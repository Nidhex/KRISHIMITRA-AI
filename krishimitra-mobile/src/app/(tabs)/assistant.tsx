/* ==========================================================================
   KrishiMitra AI — Mobile Assistant Screen (Multilingual AI Chat & Voice)
   Fully connected to Render backend (/api/chat & /api/voice/call-turn)
   ========================================================================== */

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

import { AppHeader } from '../../../components/AppHeader';
import { NetworkStatusBadge } from '../../../components/NetworkStatusBadge';
import { ChatMessageBubble } from '../../../components/ChatMessageBubble';
import { LanguageSelectorModal } from '../../../components/LanguageSelectorModal';
import { Colors, Typography, Spacing, BorderRadius, ComponentSize, Elevation } from '../../../constants/theme';
import { ChatMessageItem, VoiceState } from '../../../types/chat.types';
import { apiClient } from '../../../services/apiClient';
import { mobileVoiceService } from '../../../services/voiceService';
import { networkService } from '../../../services/networkService';
import { storageService } from '../../../services/storageService';
import { getTranslation, getLanguageOption } from '../../../i18n/languages';

export default function AssistantScreen() {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedLang, setSelectedLang] = useState('hi');
  const [isLangModalVisible, setIsLangModalVisible] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [voiceStatusText, setVoiceStatusText] = useState('');
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  // Load language preference & set initial welcome message
  useEffect(() => {
    storageService.getLanguage().then((lang) => {
      setSelectedLang(lang);
      const welcomeText = lang === 'en'
        ? 'Namaste! I am KrishiMitra AI. Ask me any question about your crops, pests, fertilizers, weather, or government schemes.'
        : 'नमस्ते! मैं कृषि मित्र AI हूँ। अपनी फसल, बीमारी, खाद, मौसम या सरकारी योजनाओं के बारे में मुझसे कोई भी सवाल पूछें।';

      setMessages([
        {
          id: 'welcome_1',
          role: 'assistant',
          content: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'sent',
          source: 'krishimitra',
          model: 'ai_assistant',
        },
      ]);
    });
  }, []);

  // Language Change Handler
  const handleSelectLanguage = (langCode: string) => {
    setSelectedLang(langCode);
    storageService.setLanguage(langCode);
  };

  // Scroll to bottom helper
  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Send Text Chat Message
  const handleSendText = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const netState = networkService.getState();
    if (!netState.isBackendReachable && netState.status === 'OFFLINE') {
      const offlineMsg: ChatMessageItem = {
        id: `sys_${Date.now()}`,
        role: 'system',
        content: getTranslation(selectedLang, 'offlineNotice'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
      };
      setMessages((prev) => [...prev, offlineMsg]);
      scrollToBottom();
      return;
    }

    const userMsgId = `user_${Date.now()}`;
    const userMsg: ChatMessageItem = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };

    const aiMsgId = `ai_${Date.now()}`;
    const aiLoadingMsg: ChatMessageItem = {
      id: aiMsgId,
      role: 'assistant',
      content: getTranslation(selectedLang, 'processing'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
    };

    setMessages((prev) => [...prev, userMsg, aiLoadingMsg]);
    setInputText('');
    scrollToBottom();

    // Bounded conversation history (last 6 messages)
    const historyPayload = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    const profile = await storageService.getFarmerProfile();

    const response = await apiClient.sendChat({
      message: text,
      language: selectedLang,
      history: historyPayload as any,
      farmerContext: profile,
    });

    if (response.success && response.reply) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                content: response.reply,
                status: 'sent',
                source: response.source || 'sarvam',
                model: response.model || 'sarvam-105b',
              }
            : m
        )
      );
    } else {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                content: response.userError || 'एआई सेवा से जवाब प्राप्त नहीं हो सका। कृपया पुनः प्रयास करें।',
                status: 'error',
                userError: response.error,
              }
            : m
        )
      );
    }

    scrollToBottom();
  };

  // Voice Recording & Call Turn Flow
  const handleVoicePress = async () => {
    if (voiceState === 'RECORDING') {
      // Stop Recording & Process
      setVoiceState('PROCESSING');
      setVoiceStatusText(getTranslation(selectedLang, 'processing'));

      const audioUri = await mobileVoiceService.stopRecording();
      if (!audioUri) {
        setVoiceState('ERROR');
        setVoiceStatusText('रिकॉर्डिंग प्राप्त नहीं हुई।');
        setTimeout(() => setVoiceState('IDLE'), 3000);
        return;
      }

      const profile = await storageService.getFarmerProfile();
      const historyPayload = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const callResult = await mobileVoiceService.processCallTurn(
        audioUri,
        selectedLang,
        historyPayload,
        profile
      );

      if (callResult.success && callResult.replyText) {
        const userMsg: ChatMessageItem = {
          id: `user_v_${Date.now()}`,
          role: 'user',
          content: callResult.userTranscript || '🎤 [आवाज़ संदेश]',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'sent',
        };

        const aiMsgId = `ai_v_${Date.now()}`;
        const aiMsg: ChatMessageItem = {
          id: aiMsgId,
          role: 'assistant',
          content: callResult.replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'sent',
          source: 'sarvam_voice',
          model: 'saaras_bulbul',
          audioBase64: callResult.audioBase64,
        };

        setMessages((prev) => [...prev, userMsg, aiMsg]);
        scrollToBottom();

        // Automatically play returned TTS audio
        if (callResult.audioBase64) {
          setVoiceState('PLAYING');
          setVoiceStatusText(getTranslation(selectedLang, 'playingAudio'));
          setPlayingMessageId(aiMsgId);
          await mobileVoiceService.playAudioBase64(callResult.audioBase64, callResult.mimeType?.split('/')[1] || 'wav');
        }

        setVoiceState('IDLE');
        setPlayingMessageId(null);
      } else {
        setVoiceState('ERROR');
        setVoiceStatusText(callResult.userError || 'आवाज़ प्रोसेसिंग में विफलता हुई।');
        setTimeout(() => setVoiceState('IDLE'), 3000);
      }
    } else {
      // Start Recording
      setVoiceState('REQUESTING_PERMISSION');
      const started = await mobileVoiceService.startRecording();

      if (started) {
        setVoiceState('RECORDING');
        setVoiceStatusText(getTranslation(selectedLang, 'recording'));
      } else {
        setVoiceState('ERROR');
        setVoiceStatusText(getTranslation(selectedLang, 'micDenied'));
        setTimeout(() => setVoiceState('IDLE'), 4000);
      }
    }
  };

  // Replay Audio on Message
  const handleReplayAudio = async (msg: ChatMessageItem) => {
    if (!msg.audioBase64) return;
    if (playingMessageId === msg.id) {
      await mobileVoiceService.stopPlayback();
      setPlayingMessageId(null);
      return;
    }

    setPlayingMessageId(msg.id);
    await mobileVoiceService.playAudioBase64(msg.audioBase64);
    setPlayingMessageId(null);
  };

  const currentLangOption = getLanguageOption(selectedLang);

  return (
    <KeyboardAvoidingView
      style={styles.flexOne}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <AppHeader title={getTranslation(selectedLang, 'assistantTitle')} subtitle={getTranslation(selectedLang, 'assistantSubtitle')} />
      <NetworkStatusBadge />

      {/* Language Selector Bar */}
      <View style={styles.langBar}>
        <Text style={styles.langBarText}>भाषा / Language:</Text>
        <TouchableOpacity
          style={styles.langBadge}
          onPress={() => setIsLangModalVisible(true)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Change language. Currently ${currentLangOption.nativeName}`}
        >
          <Text style={styles.langBadgeText}>
            {currentLangOption.flagEmoji} {currentLangOption.nativeName} ({currentLangOption.name}) ▼
          </Text>
        </TouchableOpacity>
      </View>

      {/* Messages Feed */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatMessageBubble
            message={item}
            onReplayAudio={handleReplayAudio}
            onRetryMessage={() => handleSendText(item.content)}
            isPlayingAudio={playingMessageId === item.id}
          />
        )}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={scrollToBottom}
      />

      {/* Voice Status Bar when Recording / Processing */}
      {voiceState !== 'IDLE' && (
        <View style={[styles.voiceStatusBar, voiceState === 'RECORDING' && styles.recordingBar]}>
          {voiceState === 'PROCESSING' && <ActivityIndicator color={Colors.primaryDark} style={{ marginRight: 8 }} />}
          <Text style={styles.voiceStatusText}>
            {voiceState === 'RECORDING' ? '🔴 ' : ''}{voiceStatusText}
          </Text>
        </View>
      )}

      {/* Bottom Input Toolbar */}
      <View style={styles.inputToolbar}>
        {/* Large Farmer Microphone Button */}
        <TouchableOpacity
          style={[
            styles.micBtn,
            voiceState === 'RECORDING' && styles.micBtnRecording,
          ]}
          onPress={handleVoicePress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={voiceState === 'RECORDING' ? 'Stop recording' : 'Ask by voice'}
        >
          <Text style={styles.micEmoji}>{voiceState === 'RECORDING' ? '⏹' : '🎤'}</Text>
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder={getTranslation(selectedLang, 'placeholder')}
          placeholderTextColor={Colors.textMuted}
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={() => handleSendText()}
        />

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={() => handleSendText()}
          disabled={!inputText.trim()}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Text style={styles.sendIcon}>➔</Text>
        </TouchableOpacity>
      </View>

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        visible={isLangModalVisible}
        selectedLanguage={selectedLang}
        onSelectLanguage={handleSelectLanguage}
        onClose={() => setIsLangModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  langBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  langBarText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  langBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primaryDark,
  },
  langBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryDark,
  },
  messageList: {
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md,
  },
  voiceStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  recordingBar: {
    backgroundColor: '#FFE0B2',
  },
  voiceStatusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryDark,
  },
  inputToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Elevation.medium,
  },
  micBtn: {
    width: ComponentSize.minTouchTarget,
    height: ComponentSize.minTouchTarget,
    borderRadius: ComponentSize.minTouchTarget / 2,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primaryDark,
  },
  micBtnRecording: {
    backgroundColor: '#FFCDD2',
    borderColor: Colors.error,
  },
  micEmoji: {
    fontSize: 22,
  },
  textInput: {
    flex: 1,
    height: ComponentSize.minTouchTarget,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: ComponentSize.minTouchTarget,
    height: ComponentSize.minTouchTarget,
    borderRadius: ComponentSize.minTouchTarget / 2,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.textMuted,
    opacity: 0.5,
  },
  sendIcon: {
    fontSize: 18,
    color: Colors.textOnPrimary,
    fontWeight: 'bold',
  },
});

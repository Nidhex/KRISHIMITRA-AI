/* ==========================================================================
   KrishiMitra AI — Mobile ChatMessageBubble Component
   Renders user, assistant, and system messages with audio replay & source badges.
   ========================================================================== */

import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ChatMessageItem } from '../types/chat.types';
import { Colors, Typography, Spacing, BorderRadius, Elevation } from '../constants/theme';

interface ChatMessageBubbleProps {
  message: ChatMessageItem;
  onReplayAudio?: (message: ChatMessageItem) => void;
  onRetryMessage?: (message: ChatMessageItem) => void;
  isPlayingAudio?: boolean;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  onReplayAudio,
  onRetryMessage,
  isPlayingAudio = false,
}) => {
  const isUser = message.role === 'user';
  const isError = message.status === 'error';
  const isSending = message.status === 'sending';

  if (message.role === 'system') {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperAssistant]}>
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
          isError && styles.bubbleError,
        ]}
        accessibilityRole="text"
        accessibilityLabel={`${isUser ? 'You' : 'AI Assistant'}: ${message.content}`}
      >
        {/* Source Badge for Assistant */}
        {!isUser && message.source && (
          <View style={styles.sourceBadge}>
            <Text style={styles.sourceText}>
              🌱 {message.source.toUpperCase()} {message.model ? `(${message.model})` : ''}
            </Text>
          </View>
        )}

        {/* Message Content */}
        <Text style={[styles.contentText, isUser ? styles.contentUser : styles.contentAssistant]}>
          {message.content}
        </Text>

        {/* Audio Replay Button for AI responses with Audio */}
        {!isUser && message.audioBase64 && onReplayAudio && (
          <TouchableOpacity
            style={styles.audioButton}
            onPress={() => onReplayAudio(message)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Listen to audio response"
          >
            <Text style={styles.audioIcon}>{isPlayingAudio ? '🔊' : '🔉'}</Text>
            <Text style={styles.audioText}>
              {isPlayingAudio ? 'उत्तर सुना जा रहा है...' : 'उत्तर सुनें (Listen Audio)'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Loading Indicator for Sending Messages */}
        {isSending && (
          <View style={styles.sendingRow}>
            <ActivityIndicator size="small" color={isUser ? Colors.textOnPrimary : Colors.primary} />
            <Text style={[styles.sendingText, isUser && { color: Colors.textOnPrimary }]}>
              जवाब तैयार हो रहा है...
            </Text>
          </View>
        )}

        {/* Error Retry Option */}
        {isError && onRetryMessage && (
          <TouchableOpacity
            style={styles.retryRow}
            onPress={() => onRetryMessage(message)}
            activeOpacity={0.7}
          >
            <Text style={styles.retryText}>⚠️ भेजना विफल रहा। पुनः प्रयास करें (Tap to Retry)</Text>
          </TouchableOpacity>
        )}

        {/* Timestamp */}
        <Text style={[styles.timestamp, isUser ? styles.timestampUser : styles.timestampAssistant]}>
          {message.timestamp}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: Spacing.xs,
    flexDirection: 'row',
    width: '100%',
  },
  wrapperUser: {
    justifyContent: 'flex-end',
  },
  wrapperAssistant: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Elevation.low,
  },
  bubbleUser: {
    backgroundColor: Colors.primaryDark,
    borderBottomRightRadius: BorderRadius.xs,
  },
  bubbleAssistant: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleError: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
  },
  contentText: {
    fontSize: Typography.fontSize.md,
    lineHeight: Typography.lineHeight.md,
  },
  contentUser: {
    color: Colors.textOnPrimary,
  },
  contentAssistant: {
    color: Colors.textPrimary,
  },
  sourceBadge: {
    backgroundColor: Colors.primaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryDark,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.voiceAction,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primaryDark,
  },
  audioIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  audioText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryDark,
  },
  sendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  sendingText: {
    fontSize: Typography.fontSize.xs,
    marginLeft: Spacing.xs,
    color: Colors.textSecondary,
  },
  retryRow: {
    marginTop: Spacing.xs,
    paddingVertical: 4,
  },
  retryText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
    fontWeight: Typography.fontWeight.bold,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timestampUser: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timestampAssistant: {
    color: Colors.textMuted,
  },
  systemContainer: {
    alignSelf: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.sm,
  },
  systemText: {
    fontSize: Typography.fontSize.xs,
    color: '#E65100',
    textAlign: 'center',
  },
});

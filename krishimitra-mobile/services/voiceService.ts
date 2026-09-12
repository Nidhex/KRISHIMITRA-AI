/* ==========================================================================
   KrishiMitra AI — Mobile Voice Recording & Native Audio Playback Service
   Uses expo-av for native microphone capture and audio synthesis playback.
   ========================================================================== */

import { Audio } from 'expo-av';
import { apiClient } from './apiClient';
import { VoiceCallTurnResponse } from '../types/api.types';
import { FarmerProfile } from '../types/profile.types';

export interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
  message?: string;
}

class MobileVoiceService {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private isAudioInitialized = false;

  private async ensureAudioMode() {
    if (this.isAudioInitialized) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      this.isAudioInitialized = true;
    } catch (e) {
      console.warn('[MobileVoiceService] Error configuring audio mode:', e);
    }
  }

  /**
   * Check & Request Microphone Permissions
   */
  async requestMicrophonePermission(): Promise<PermissionResult> {
    try {
      const current = await Audio.getPermissionsAsync();
      if (current.granted) {
        return { granted: true, canAskAgain: true };
      }

      const requested = await Audio.requestPermissionsAsync();
      return {
        granted: requested.granted,
        canAskAgain: requested.canAskAgain,
        message: requested.granted
          ? undefined
          : 'आवाज़ से सवाल पूछने के लिए माइक्रोफ़ोन की अनुमति आवश्यक है।',
      };
    } catch (err: any) {
      return {
        granted: false,
        canAskAgain: true,
        message: 'माइक्रोफ़ोन अनुमति प्राप्त करने में समस्या हुई।',
      };
    }
  }

  /**
   * Start Voice Recording
   */
  async startRecording(): Promise<boolean> {
    try {
      await this.stopPlayback();
      await this.stopRecording();
      await this.ensureAudioMode();

      const perm = await this.requestMicrophonePermission();
      if (!perm.granted) {
        throw new Error(perm.message || 'Permission denied');
      }

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      this.recording = recording;
      return true;
    } catch (err) {
      console.error('[MobileVoiceService] startRecording error:', err);
      this.recording = null;
      return false;
    }
  }

  /**
   * Stop Voice Recording and return local URI
   */
  async stopRecording(): Promise<string | null> {
    if (!this.recording) return null;

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      return uri;
    } catch (err) {
      console.error('[MobileVoiceService] stopRecording error:', err);
      this.recording = null;
      return null;
    }
  }

  /**
   * Send Recorded Audio File to Backend /api/voice/call-turn
   */
  async processCallTurn(
    audioUri: string,
    language: string = 'hi',
    history: any[] = [],
    farmerContext: FarmerProfile | null = null
  ): Promise<VoiceCallTurnResponse> {
    try {
      const formData = new FormData();
      const filename = audioUri.split('/').pop() || 'recording.m4a';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `audio/${match[1]}` : 'audio/m4a';

      formData.append('file', {
        uri: audioUri,
        name: filename,
        type,
      } as any);

      formData.append('language', language);
      formData.append('history', JSON.stringify(history));
      if (farmerContext) {
        formData.append('farmerContext', JSON.stringify(farmerContext));
      }

      return await apiClient.sendVoiceCallTurn(formData);
    } catch (err: any) {
      return {
        success: false,
        userTranscript: '',
        replyText: '',
        error: err.message,
        userError: 'आवाज़ प्रोसेस करने में समस्या हुई। कृपया पुनः बोलें।',
      };
    }
  }

  /**
   * Play Base64 or Remote Audio WAV/MP3 Response
   */
  async playAudioBase64(base64Data: string, format: string = 'wav'): Promise<boolean> {
    try {
      await this.stopPlayback();
      await this.ensureAudioMode();

      const dataUri = `data:audio/${format};base64,${base64Data}`;
      const { sound } = await Audio.Sound.createAsync(
        { uri: dataUri },
        { shouldPlay: true }
      );

      this.sound = sound;
      this.sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          this.stopPlayback();
        }
      });

      return true;
    } catch (err) {
      console.error('[MobileVoiceService] playAudioBase64 error:', err);
      await this.stopPlayback();
      return false;
    }
  }

  /**
   * Stop Active Audio Playback
   */
  async stopPlayback(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch (_) {
        // Ignore cleanup warning if already unloaded
      } finally {
        this.sound = null;
      }
    }
  }
}

export const mobileVoiceService = new MobileVoiceService();

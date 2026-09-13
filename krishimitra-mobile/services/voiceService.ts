/* ==========================================================================
   KrishiMitra AI — Mobile Voice Recording & Native Audio Playback Service
   Uses expo-audio for native microphone capture and audio synthesis playback.
   ========================================================================== */

import {
  AudioModule,
  RecordingPresets,
  createAudioPlayer,
  setAudioModeAsync,
} from 'expo-audio';

import type { AudioPlayer } from 'expo-audio';

import { apiClient } from './apiClient';
import { VoiceCallTurnResponse } from '../types/api.types';
import { FarmerProfile } from '../types/profile.types';

export interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
  message?: string;
}

class MobileVoiceService {
  private recording: InstanceType<typeof AudioModule.AudioRecorder> | null =
    null;

  private player: AudioPlayer | null = null;

  private playbackSubscription: { remove: () => void } | null = null;

  private isAudioInitialized = false;

  /**
   * Configure native audio behavior.
   */
  private async ensureAudioMode() {
    if (this.isAudioInitialized) return;

    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
        shouldRouteThroughEarpiece: false,
      });

      this.isAudioInitialized = true;
    } catch (e) {
      console.warn(
        '[MobileVoiceService] Error configuring audio mode:',
        e
      );
    }
  }

  /**
   * Check & request microphone permission.
   */
  async requestMicrophonePermission(): Promise<PermissionResult> {
    try {
      const current =
        await AudioModule.getRecordingPermissionsAsync();

      if (current.granted) {
        return {
          granted: true,
          canAskAgain: true,
        };
      }

      const requested =
        await AudioModule.requestRecordingPermissionsAsync();

      return {
        granted: requested.granted,
        canAskAgain: requested.canAskAgain,
        message: requested.granted
          ? undefined
          : 'आवाज़ से सवाल पूछने के लिए माइक्रोफ़ोन की अनुमति आवश्यक है।',
      };
    } catch (err) {
      console.error(
        '[MobileVoiceService] microphone permission error:',
        err
      );

      return {
        granted: false,
        canAskAgain: true,
        message:
          'माइक्रोफ़ोन अनुमति प्राप्त करने में समस्या हुई।',
      };
    }
  }

  /**
   * Start voice recording.
   */
  async startRecording(): Promise<boolean> {
    try {
      await this.stopPlayback();
      await this.stopRecording();
      await this.ensureAudioMode();

      const permission =
        await this.requestMicrophonePermission();

      if (!permission.granted) {
        throw new Error(
          permission.message || 'Permission denied'
        );
      }

      /*
       * Create a fresh native recorder for every recording.
       *
       * HIGH_QUALITY:
       * - .m4a container
       * - AAC encoder on Android
       * - 44.1 kHz
       * - 128 kbps
       */
      const recorder =
        new AudioModule.AudioRecorder(
          RecordingPresets.HIGH_QUALITY
        );

      await recorder.prepareToRecordAsync();

      recorder.record();

      this.recording = recorder;

      return true;
    } catch (err) {
      console.error(
        '[MobileVoiceService] startRecording error:',
        err
      );

      this.recording = null;

      return false;
    }
  }

  /**
   * Stop voice recording and return local URI.
   */
  async stopRecording(): Promise<string | null> {
    if (!this.recording) {
      return null;
    }

    const recorder = this.recording;

    try {
      await recorder.stop();

      const uri = recorder.uri;

      this.recording = null;

      return uri;
    } catch (err) {
      console.error(
        '[MobileVoiceService] stopRecording error:',
        err
      );

      this.recording = null;

      return null;
    }
  }

  /**
   * Send recorded audio to backend /api/voice/call-turn.
   *
   * Backend contract remains unchanged.
   */
  async processCallTurn(
    audioUri: string,
    language: string = 'hi',
    history: any[] = [],
    farmerContext: FarmerProfile | null = null
  ): Promise<VoiceCallTurnResponse> {
    try {
      const formData = new FormData();

      const filename =
        audioUri.split('/').pop() || 'recording.m4a';

      const match = /\.(\w+)$/.exec(filename);

      const type = match
        ? `audio/${match[1]}`
        : 'audio/m4a';

      formData.append(
        'file',
        {
          uri: audioUri,
          name: filename,
          type,
        } as any
      );

      formData.append(
        'language',
        language
      );

      formData.append(
        'history',
        JSON.stringify(history)
      );

      if (farmerContext) {
        formData.append(
          'farmerContext',
          JSON.stringify(farmerContext)
        );
      }

      return await apiClient.sendVoiceCallTurn(formData);
    } catch (err: any) {
      return {
        success: false,
        userTranscript: '',
        replyText: '',
        error: err.message,
        userError:
          'आवाज़ प्रोसेस करने में समस्या हुई। कृपया पुनः बोलें।',
      };
    }
  }

  /**
   * Play Base64 WAV/MP3 response from backend.
   */
  async playAudioBase64(
    base64Data: string,
    format: string = 'wav'
  ): Promise<boolean> {
    try {
      await this.stopPlayback();

      /*
       * Switch from recording mode to playback mode.
       */
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
        shouldRouteThroughEarpiece: false,
      });

      const dataUri =
        `data:audio/${format};base64,${base64Data}`;

      const player = createAudioPlayer(dataUri, {
        updateInterval: 200,
      });

      this.player = player;

      this.playbackSubscription =
        player.addListener(
          'playbackStatusUpdate',
          (status) => {
            if (status.didJustFinish) {
              void this.stopPlayback();
            }
          }
        );

      player.play();

      return true;
    } catch (err) {
      console.error(
        '[MobileVoiceService] playAudioBase64 error:',
        err
      );

      await this.stopPlayback();

      return false;
    }
  }

  /**
   * Stop active audio playback and release native resources.
   */
  async stopPlayback(): Promise<void> {
    if (this.playbackSubscription) {
      try {
        this.playbackSubscription.remove();
      } catch (_) {
        // Ignore subscription cleanup errors.
      }

      this.playbackSubscription = null;
    }

    if (this.player) {
      try {
        this.player.pause();
      } catch (_) {
        // Ignore pause errors.
      }

      try {
        this.player.remove();
      } catch (_) {
        // Ignore native cleanup errors.
      }

      this.player = null;
    }
  }
}

export const mobileVoiceService =
  new MobileVoiceService();
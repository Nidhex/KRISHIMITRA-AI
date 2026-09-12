/* ==========================================================================
   KrishiMitra AI — Mobile Chat Message Model & Types
   ========================================================================== */

export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'error' | 'recording' | 'processing' | 'playing';

export interface ChatMessageItem {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  status: MessageStatus;
  source?: string;
  model?: string;
  audioBase64?: string;
  audioUri?: string;
  userError?: string;
}

export type VoiceState = 'IDLE' | 'REQUESTING_PERMISSION' | 'RECORDING' | 'PROCESSING' | 'PLAYING' | 'ERROR';

export interface VoiceStatus {
  state: VoiceState;
  message?: string;
  durationMs?: number;
}

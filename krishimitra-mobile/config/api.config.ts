/* ==========================================================================
   KrishiMitra AI — Mobile API Configuration
   Centralized backend endpoint configuration for dev, staging, & production.
   ========================================================================== */

export interface EnvironmentConfig {
  baseUrl: string;
  timeoutMs: number;
  healthTimeoutMs: number;
  visionTimeoutMs: number;
  environmentName: 'development' | 'staging' | 'production';
}

const PRODUCTION_URL = 'https://krishimitra-ai-1-4gtj.onrender.com';
const LOCAL_DEV_URL  = 'http://10.0.2.2:5000'; // Standard Android emulator localhost alias

export const ApiConfig: EnvironmentConfig = {
  // Default to production Render URL; easily overridden for dev/staging
  baseUrl: process.env.EXPO_PUBLIC_API_URL || PRODUCTION_URL,
  timeoutMs: 45000,       // 45-second timeout for AI inference & Render cold starts
  healthTimeoutMs: 8000,  // 8-second timeout for health check ping
  visionTimeoutMs: 180000, // 180-second dedicated timeout for Vision AI crop & soil scans
  environmentName: (process.env.EXPO_PUBLIC_ENV as any) || 'production',
};

export const Endpoints = {
  health: '/api/health',
  chat: '/api/chat',
  vision: '/api/vision',
  weather: '/api/weather',
  schemes: '/api/schemes',
  feedCache: '/api/feed/cache',
  voiceTranscribe: '/api/voice/transcribe',
  voiceSynthesize: '/api/voice/synthesize',
  voiceCallTurn: '/api/voice/call-turn',
  farmDiary: '/api/farm-diary',
};

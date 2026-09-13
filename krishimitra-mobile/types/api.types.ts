/* ==========================================================================
   KrishiMitra AI — Mobile API TypeScript Contracts
   Reflects exact backend schemas from backend/routes/
   ========================================================================== */

export interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  userError?: string;
  errorCode?: string;
  data?: T;
}

export interface HealthResponse {
  status: string;
  version: string;
  model: string;
  ollamaUrl: string;
  timestamp: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface FarmerProfileContext {
  name?: string;
  state?: string;
  district?: string;
  village?: string;
  crops?: string[];
  landSize?: string;
  preferredLanguage?: string;
}

export interface ChatRequestPayload {
  message: string;
  language?: string;
  history?: ChatMessage[];
  farmerContext?: FarmerProfileContext | null;
  context?: string;
}

export interface ChatResponseData {
  success: boolean;
  reply: string;
  source: 'sarvam' | 'gemini' | 'gemma3' | 'rag_direct' | string;
  model: string;
  language: string;
  inferenceMs: number;
  totalMs: number;
  domains?: string[];
  docCount?: number;
  keywords?: string[];
  error?: string;
  userError?: string;
  errorCode?: string;
}

export interface VisionDiseaseResult {
  disease_name: string;
  disease_name_hi?: string;
  confidence: number;
  symptoms?: string | string[];
  causes?: string | string[];
  prevention?: string | string[];
  organic_treatment?: string | string[];
  chemical_treatment?: string | string[];
  precautions?: string | string[];
}

export interface VisionSoilResult {
  soil_type: string;
  soil_type_hi?: string;
  confidence: number;
  characteristics?: string;
  suitable_crops?: string[];
  fertilizer_recommendation?: string[];
}

export interface VisionResponseData {
  success: boolean;
  disease?: VisionDiseaseResult | null;
  soil?: VisionSoilResult | null;
  confidence: number;
  probabilities: Record<string, number>;
  imagePath: string;
  error?: string;
  userError?: string;
  errorCode?: string;
}

export interface WeatherDayForecast {
  day: string;
  condition: string;
  tempC: number;
  rainChance: string;
  emoji: string;
}

export interface WeatherData {
  location: string;
  today: {
    condition: string;
    tempC: number;
    humidity: string;
    windKmh: number;
    rainChance: string;
    uvIndex: number;
    emoji: string;
  };
  forecast: WeatherDayForecast[];
  advisory: string;
  source: string;
  dbRecords?: number;
}

export interface WeatherResponseData {
  success: boolean;
  weather: WeatherData;
  source: string;
  note?: string;
}

export interface SchemeItem {
  id: string;
  title: string;
  description: string;
  eligibility?: string | null;
  benefit?: string | null;
  deadline?: string | null;
  applyAt?: string | null;
  category?: string | null;
}

export interface SchemesResponseData {
  success: boolean;
  schemes: SchemeItem[];
  total: number;
  summary?: string | null;
  source?: string;
}

export interface VoiceCallTurnRequest {
  audioBase64?: string;
  mimeType?: string;
  language?: string;
  history?: ChatMessage[] | string;
  farmerContext?: FarmerProfileContext | string;
  browserTranscript?: string;
}

export interface VoiceCallTurnResponse {
  success: boolean;
  userTranscript: string;
  replyText: string;
  audioBase64?: string;
  mimeType?: string;
  language?: string;
  detectedLanguage?: string;
  durationMs?: number;
  error?: string;
  userError?: string;
  errorCode?: string;
}

export interface FeedArticle {
  id: string;
  headline: string;
  summary: string;
  category: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
  url?: string;
}

export interface FeedResponseData {
  success: boolean;
  articles: FeedArticle[];
  count?: number;
}

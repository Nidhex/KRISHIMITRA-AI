/* ==========================================================================
   KrishiMitra AI — Mobile API Client
   Typed network client abstraction connecting to Render production backend.
   ========================================================================== */

import { ApiConfig, Endpoints } from '../config/api.config';
import {
  ApiResponse,
  HealthResponse,
  ChatRequestPayload,
  ChatResponseData,
  VisionResponseData,
  WeatherResponseData,
  SchemesResponseData,
  FeedResponseData,
  VoiceCallTurnResponse
} from '../types/api.types';
import { MandiResponseData } from '../types/info.types';
import { MANDI_DATABASE } from './mandiData';

export class ApiError extends Error {
  userMessage: string;
  statusCode?: number;
  errorCode?: string;

  constructor(message: string, userMessage: string, statusCode?: number, errorCode?: string) {
    super(message);
    this.name = 'ApiError';
    this.userMessage = userMessage;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

/**
 * Fetch with configurable timeout controller.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = ApiConfig.timeoutMs
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new ApiError(
        'Request timeout',
        'सर्वर से जवाब आने में देरी हो रही है। कृपया पुनः प्रयास करें। (Request timed out)',
        408,
        'TIMEOUT'
      );
    }
    throw new ApiError(
      error.message || 'Network error',
      'नेटवर्क कनेक्शन में समस्या है। कृपया इंटरनेट चालू करें। (Network error)',
      0,
      'NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timer);
  }
}

class MobileApiClient {
  private getUrl(endpoint: string): string {
    return `${ApiConfig.baseUrl}${endpoint}`;
  }

  /**
   * Health Check Ping
   */
  async checkHealth(): Promise<ApiResponse<HealthResponse>> {
    try {
      const res = await fetchWithTimeout(this.getUrl(Endpoints.health), {}, ApiConfig.healthTimeoutMs);
      if (!res.ok) {
        return {
          success: false,
          error: `Health check returned status ${res.status}`,
          userError: 'Backend unreachable',
          errorCode: 'HEALTH_CHECK_FAILED',
        };
      }
      const data = await res.json();
      return { success: true, data };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        userError: err.userMessage || 'Backend unreachable',
        errorCode: err.errorCode || 'HEALTH_CHECK_FAILED',
      };
    }
  }

  /**
   * AI Multilingual Chat — POST /api/chat
   */
  async sendChat(payload: ChatRequestPayload): Promise<ChatResponseData> {
    try {
      const res = await fetchWithTimeout(this.getUrl(Endpoints.chat), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          reply: '',
          source: 'error',
          model: 'none',
          language: payload.language || 'hi',
          inferenceMs: 0,
          totalMs: 0,
          error: data.error || `Server error ${res.status}`,
          userError: data.userError || 'एआई सेवा अभी व्यस्त है। कृपया पुनः प्रयास करें।',
          errorCode: data.errorCode || 'CHAT_FAILED',
        };
      }

      return data;
    } catch (err: any) {
      return {
        success: false,
        reply: '',
        source: 'error',
        model: 'none',
        language: payload.language || 'hi',
        inferenceMs: 0,
        totalMs: 0,
        error: err.message,
        userError: err.userMessage || 'नेटवर्क समस्या के कारण मैसेज नहीं भेजा जा सका।',
        errorCode: err.errorCode || 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Crop Disease / Soil Scan — POST /api/vision (Multipart)
   */
  async scanVision(imageUri: string, moduleType: 'disease' | 'soil' = 'disease'): Promise<VisionResponseData> {
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'scan.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri: imageUri,
        name: filename,
        type,
      } as any);
      formData.append('module', moduleType);

      const res = await fetchWithTimeout(this.getUrl(Endpoints.vision), {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          confidence: 0,
          probabilities: {},
          imagePath: '',
          error: data.error || 'Crop vision analysis failed',
        };
      }

      return data;
    } catch (err: any) {
      return {
        success: false,
        confidence: 0,
        probabilities: {},
        imagePath: '',
        error: err.message || 'Network error during image upload',
      };
    }
  }

  /**
   * Weather Forecast & Advisory — POST /api/weather
   */
  async getWeather(location: string = 'Kishanpur, UP', language: string = 'hi'): Promise<WeatherResponseData> {
    try {
      const res = await fetchWithTimeout(this.getUrl(Endpoints.weather), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, language, useAI: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          source: 'fallback',
          weather: {
            location,
            today: { condition: 'Light Rain', tempC: 28, humidity: '80%', windKmh: 12, rainChance: '70%', uvIndex: 3, emoji: '🌧' },
            forecast: [],
            advisory: data.error || 'मौसम की जानकारी लोडिंग में समस्या हुई। कृपया इंटरनेट कनेक्शन जांचें।',
            source: 'offline_fallback',
          },
        };
      }
      return data;
    } catch (err: any) {
      return {
        success: false,
        source: 'fallback',
        weather: {
          location,
          today: { condition: 'Light Rain', tempC: 28, humidity: '80%', windKmh: 12, rainChance: '70%', uvIndex: 3, emoji: '🌧' },
          forecast: [],
          advisory: 'मौसम की जानकारी लोडिंग में समस्या हुई। कृपया इंटरनेट कनेक्शन जांचें।',
          source: 'offline_fallback',
        },
      };
    }
  }

  /**
   * Government Schemes — POST /api/schemes
   */
  async getSchemes(query: string = '', state: string = '', language: string = 'hi'): Promise<SchemesResponseData> {
    try {
      const res = await fetchWithTimeout(this.getUrl(Endpoints.schemes), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, state, language, useAI: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          schemes: [],
          total: 0,
          summary: data.error || 'योजनाएं लोड नहीं हो सकीं।',
        };
      }
      return data;
    } catch (err: any) {
      return {
        success: false,
        schemes: [],
        total: 0,
        summary: 'योजनाएं लोड नहीं हो सकीं।',
      };
    }
  }

  /**
   * Feed Articles Cache — GET /api/feed/cache
   */
  async getFeed(): Promise<FeedResponseData> {
    try {
      const res = await fetchWithTimeout(this.getUrl(Endpoints.feedCache), {
        method: 'GET',
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          articles: [],
        };
      }
      return data;
    } catch (err: any) {
      return {
        success: false,
        articles: [],
      };
    }
  }

  /**
   * Mandi Rates & MSP Advisory — Mandi Database Search
   */
  async getMandiPrices(query: string = ''): Promise<MandiResponseData> {
    try {
      let filtered = MANDI_DATABASE;
      if (query && query.trim().length > 0) {
        const q = query.toLowerCase().trim();
        filtered = MANDI_DATABASE.filter(item => {
          const matchTitle = item.title.toLowerCase().includes(q) || (item.title_hi && item.title_hi.toLowerCase().includes(q));
          const matchDesc = item.description.toLowerCase().includes(q) || (item.description_hi && item.description_hi.toLowerCase().includes(q));
          const matchCrops = item.metadata.cropPrices ? Object.keys(item.metadata.cropPrices).some(c => c.toLowerCase().includes(q)) : false;
          return matchTitle || matchDesc || matchCrops;
        });
      }

      return {
        success: true,
        mandis: filtered,
        total: filtered.length,
        isLivePrice: false,
        cachedAt: new Date().toISOString(),
        source: 'mandi_apmc_database',
      };
    } catch (err: any) {
      return {
        success: false,
        mandis: MANDI_DATABASE,
        total: MANDI_DATABASE.length,
        isLivePrice: false,
        source: 'mandi_fallback',
      };
    }
  }

  /**
   * Voice Call Turn — POST /api/voice/call-turn
   */
  async sendVoiceCallTurn(formData: FormData): Promise<VoiceCallTurnResponse> {
    try {
      const res = await fetchWithTimeout(this.getUrl(Endpoints.voiceCallTurn), {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        userTranscript: '',
        replyText: '',
        error: err.message,
        userError: 'आवाज़ रिकॉर्ड करने में समस्या हुई। कृपया पुनः बोलें।',
      };
    }
  }
}

export const apiClient = new MobileApiClient();

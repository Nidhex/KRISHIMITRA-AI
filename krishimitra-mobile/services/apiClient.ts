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

let FileSystem: any = null;
try {
  FileSystem = require('expo-file-system/legacy');
} catch (e) {
  try {
    FileSystem = require('expo-file-system');
  } catch (e2) {
    // FileSystem not available in Node CLI environment
  }
}

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

export interface HealthCheckResult {
  reachable: boolean;
  statusCode?: number;
  latencyMs: number;
  data?: HealthResponse;
  error?: string;
}

class MobileApiClient {
  private getUrl(endpoint: string): string {
    return `${ApiConfig.baseUrl}${endpoint}`;
  }

  /**
   * Health Check Ping — Detailed health check
   */
  async checkBackendHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      const res = await fetchWithTimeout(this.getUrl(Endpoints.health), {}, ApiConfig.healthTimeoutMs);
      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        return {
          reachable: false,
          statusCode: res.status,
          latencyMs,
          error: `Backend returned HTTP ${res.status}`,
        };
      }
      const data: HealthResponse = await res.json();
      const isRunning = Boolean(data && (data.status === 'running' || data.status === 'ok'));
      return {
        reachable: isRunning,
        statusCode: res.status,
        latencyMs,
        data,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        reachable: false,
        statusCode: err.statusCode || 0,
        latencyMs,
        error: err.message || 'Backend unreachable',
      };
    }
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
   * Uses native Expo FileSystem.uploadAsync on devices for maximum Android compatibility.
   */
  async scanVision(
    imageInput: string | { uri: string; name?: string; type?: string; fileName?: string; mimeType?: string },
    moduleType: 'disease' | 'soil' = 'disease'
  ): Promise<VisionResponseData> {
    try {
      // 1. Extract and validate URI string
      const rawUri = typeof imageInput === 'string' ? imageInput : imageInput?.uri;
      if (!rawUri || typeof rawUri !== 'string') {
        return {
          success: false,
          confidence: 0,
          probabilities: {},
          imagePath: '',
          error: 'FORMDATA_ERROR: Selected image has no valid URI string.',
        };
      }

      const cleanUri = String(rawUri).trim();

      // 2. Determine safe MIME type & Filename
      let safeMimeType = 'image/jpeg';
      const inputObj = typeof imageInput === 'object' ? imageInput : null;
      const givenType = inputObj?.type || inputObj?.mimeType;

      if (givenType && typeof givenType === 'string' && givenType.startsWith('image/')) {
        safeMimeType = givenType;
      } else if (cleanUri.endsWith('.png')) {
        safeMimeType = 'image/png';
      } else if (cleanUri.endsWith('.webp')) {
        safeMimeType = 'image/webp';
      }

      let safeFilename = 'crop_scan.jpg';
      if (safeMimeType === 'image/png') safeFilename = 'crop_scan.png';
      if (safeMimeType === 'image/webp') safeFilename = 'crop_scan.webp';

      // 3. Determine upload implementation: Native Expo FileSystem vs Fallback
      if (FileSystem && typeof FileSystem.uploadAsync === 'function') {
        let targetFileUri = cleanUri;

        // Copy content:// URIs to local cache directory if needed
        if (cleanUri.startsWith('content://') && FileSystem.copyAsync && FileSystem.cacheDirectory) {
          const tempCacheUri = `${FileSystem.cacheDirectory}vision_upload_${Date.now()}.${safeFilename.split('.').pop()}`;
          try {
            await FileSystem.copyAsync({
              from: cleanUri,
              to: tempCacheUri,
            });
            targetFileUri = tempCacheUri;
          } catch (copyErr) {
            console.warn('[VISION UPLOAD] Content URI copy warning, attempting direct URI:', copyErr);
          }
        }

        // Verify file existence before upload
        if (FileSystem.getInfoAsync) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(targetFileUri);
            if (!fileInfo.exists) {
              return {
                success: false,
                confidence: 0,
                probabilities: {},
                imagePath: '',
                error: 'IMAGE_FILE_UNREADABLE: Selected image file cannot be read from device storage.',
              };
            }
          } catch (infoErr) {
            // Ignore info check errors for virtual schemes
          }
        }

        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log('[VISION NATIVE UPLOAD]', {
            platform: 'native_file_system',
            uri: targetFileUri,
            uriScheme: targetFileUri.split(':')[0],
            mimeType: safeMimeType,
            filename: safeFilename,
            module: moduleType,
            uploadMethod: 'FileSystem.uploadAsync',
          });
        }

        const uploadResult = await FileSystem.uploadAsync(
          this.getUrl(Endpoints.vision),
          targetFileUri,
          {
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            fieldName: 'image',
            mimeType: safeMimeType,
            parameters: {
              module: String(moduleType),
            },
          }
        );

        let data: any = {};
        try {
          data = JSON.parse(uploadResult.body);
        } catch (parseErr) {
          data = { error: uploadResult.body };
        }

        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log('[VISION RESPONSE]', {
            status: uploadResult.status,
            success: data?.success,
            error: data?.error,
          });
        }

        if (uploadResult.status !== 200 || !data.success) {
          return {
            success: false,
            confidence: 0,
            probabilities: {},
            imagePath: '',
            error: data.error || `Server error ${uploadResult.status}: Crop vision analysis failed`,
          };
        }

        return data;
      } else {
        // --- FALLBACK FOR CLI NODE UNIT TEST ENVIRONMENT ---
        const formData = new FormData();
        const imagePart = {
          uri: String(cleanUri),
          name: String(safeFilename),
          type: String(safeMimeType),
        };
        formData.append('image', imagePart as any);
        formData.append('module', String(moduleType));

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
            error: data.error || `Server error ${res.status}: Crop vision analysis failed`,
          };
        }
        return {
          success: data.success ?? true,
          ...data,
        };
      }
    } catch (err: any) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.error('[VISION ERROR]', err);
      }
      return {
        success: false,
        confidence: 0,
        probabilities: {},
        imagePath: '',
        error: err.userMessage || err.message || 'Network error during image upload',
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

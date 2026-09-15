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
   * Configured with dedicated 120-second timeout (ApiConfig.visionTimeoutMs = 120000).
   */
  /**
   * Crop Disease / Soil Scan — POST /api/vision (Multipart)
   * Modern Expo SDK 57 implementation with AbortController timeout,
   * safe content:// URI copy, diagnostic logging, & distinct error categories.
   */
  /**
   * Crop Disease / Soil Scan — POST /api/vision (Multipart)
   * Modern Expo SDK 57 implementation with AbortController timeout,
   * safe content:// URI copy, diagnostic logging, & distinct error categories.
   */
  async scanVision(
    imageInput: string | { uri: string; name?: string; type?: string; fileName?: string; mimeType?: string },
    moduleType: 'disease' | 'soil' = 'disease'
  ): Promise<VisionResponseData> {
    const visionTimeoutMs = ApiConfig.visionTimeoutMs || 180000;
    const startTime = Date.now();

    // Checkpoint 1: Image Picker URI Check
    const rawUri = typeof imageInput === 'string' ? imageInput : imageInput?.uri;
    if (!rawUri || typeof rawUri !== 'string') {
      return {
        success: false,
        confidence: 0,
        probabilities: {},
        imagePath: '',
        error: 'VISION_URI_ERROR: Selected image has no valid URI string.',
        userError: 'Please select a clear crop or soil image.',
        errorCode: 'VISION_URI_ERROR',
        diagnostic: {
          stage: '1. image_picker_returned_uri',
          errorName: 'InvalidURIError',
          errorMessage: 'Selected image has no valid URI string.',
          errorCode: 'VISION_URI_ERROR',
          uriType: 'none',
        },
      };
    }

    const cleanUri = String(rawUri).trim();
    const uriScheme = cleanUri.split(':')[0] || 'unknown';

    // Determine MIME & Filename
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

    let safeFilename = inputObj?.name || inputObj?.fileName || 'crop_scan.jpg';
    if (!safeFilename.includes('.')) {
      const ext = safeMimeType.split('/')[1] || 'jpg';
      safeFilename = `${safeFilename}.${ext}`;
    }

    let targetFileUri = cleanUri;

    // Checkpoint 2: URI Normalization & content:// resolution
    if (cleanUri.startsWith('content://') && FileSystem && FileSystem.copyAsync && FileSystem.cacheDirectory) {
      const ext = safeFilename.split('.').pop() || 'jpg';
      const tempCacheUri = `${FileSystem.cacheDirectory}vision_upload_${Date.now()}.${ext}`;
      try {
        await FileSystem.copyAsync({
          from: cleanUri,
          to: tempCacheUri,
        });
        targetFileUri = tempCacheUri;
      } catch (copyErr: any) {
        console.warn('[VISION UPLOAD] Content URI copy warning:', copyErr);
      }
    }

    // Checkpoint 3 & 4: Local file existence & size check
    let fileExists = true;
    let fileSize: number | undefined = undefined;

    if (FileSystem && FileSystem.getInfoAsync && targetFileUri.startsWith('file://')) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(targetFileUri);
        fileExists = Boolean(fileInfo.exists);
        fileSize = (fileInfo as any).size;
        if (!fileInfo.exists) {
          return {
            success: false,
            confidence: 0,
            probabilities: {},
            imagePath: '',
            error: `VISION_FILE_ERROR: Local file does not exist at ${targetFileUri}`,
            userError: 'Please select a clear crop or soil image.',
            errorCode: 'VISION_FILE_ERROR',
            diagnostic: {
              stage: '3. local_file_existence_check',
              errorName: 'FileNotFoundError',
              errorMessage: `Local file does not exist at ${targetFileUri}`,
              errorCode: 'VISION_FILE_ERROR',
              originalUri: cleanUri,
              resolvedUri: targetFileUri,
              uriType: uriScheme,
              fileExists: false,
              mimeType: safeMimeType,
            },
          };
        }
      } catch (infoErr) {
        // Ignore virtual scheme info errors
      }
    }

    if (fileSize === 0) {
      return {
        success: false,
        confidence: 0,
        probabilities: {},
        imagePath: '',
        error: `VISION_FILE_ERROR: Image file at ${targetFileUri} is 0 bytes.`,
        userError: 'Please select a clear crop or soil image.',
        errorCode: 'VISION_FILE_ERROR',
        diagnostic: {
          stage: '4. file_size_type_check',
          errorName: 'ZeroByteFileError',
          errorMessage: `Image file at ${targetFileUri} is 0 bytes.`,
          errorCode: 'VISION_FILE_ERROR',
          originalUri: cleanUri,
          resolvedUri: targetFileUri,
          uriType: uriScheme,
          fileExists: true,
          fileSize: 0,
          mimeType: safeMimeType,
        },
      };
    }

    const targetUrl = this.getUrl(Endpoints.vision);
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, visionTimeoutMs);

    // Checkpoint 6, 7, 8: File object creation, FormData creation, FormData append
    let formData: FormData;
    try {
      formData = new FormData();
      const imagePart = {
        uri: String(targetFileUri),
        name: String(safeFilename),
        type: String(safeMimeType),
      };
      formData.append('image', imagePart as any);
      formData.append('module', String(moduleType));
    } catch (formErr: any) {
      clearTimeout(timeoutId);
      return {
        success: false,
        confidence: 0,
        probabilities: {},
        imagePath: '',
        error: `VISION_FILE_ERROR: FormData preparation failed: ${formErr.message}`,
        userError: 'Unable to prepare image file for upload.',
        errorCode: 'VISION_FILE_ERROR',
        diagnostic: {
          stage: '6. file_object_creation',
          errorName: formErr?.name || 'FormDataError',
          errorMessage: formErr?.message || String(formErr),
          errorCode: 'VISION_FILE_ERROR',
          originalUri: cleanUri,
          resolvedUri: targetFileUri,
          uriType: uriScheme,
          fileExists,
          fileSize,
          mimeType: safeMimeType,
        },
      };
    }

    // Checkpoint 9 & 10: fetch() starts & fetch() completes
    let res: Response;
    try {
      res = await fetch(targetUrl, {
        method: 'POST',
        body: formData,
        signal: abortController.signal,
      });
    } catch (fetchErr: any) {
      const isAborted = abortController.signal.aborted || fetchErr?.name === 'AbortError' || fetchErr?.errorCode === 'TIMEOUT';
      const errStr = String(fetchErr?.message || '').toLowerCase();
      const isNetwork = fetchErr?.name === 'TypeError' || errStr.includes('network') || errStr.includes('failed to fetch');

      let actualCode = 'VISION_UPLOAD_ERROR';
      let userMsg = 'Unable to upload the image. Please try again.';
      if (isAborted) {
        actualCode = 'VISION_TIMEOUT';
        userMsg = 'AI analysis took too long. Please try again.';
      } else if (isNetwork) {
        actualCode = 'VISION_NETWORK_ERROR';
        userMsg = 'Internet connection failed. Please check your connection.';
      }

      return {
        success: false,
        confidence: 0,
        probabilities: {},
        imagePath: '',
        error: `${actualCode}: ${fetchErr?.name || 'FetchError'} — ${fetchErr?.message || 'fetch failed'}`,
        userError: userMsg,
        errorCode: actualCode,
        diagnostic: {
          stage: '10. fetch_completes',
          errorName: fetchErr?.name || 'FetchError',
          errorMessage: fetchErr?.message || String(fetchErr),
          errorCode: actualCode,
          originalUri: cleanUri,
          resolvedUri: targetFileUri,
          uriType: uriScheme,
          fileExists,
          fileSize,
          mimeType: safeMimeType,
        },
      };
    } finally {
      clearTimeout(timeoutId);
    }

    // Checkpoint 11 & 12: HTTP status received & response body parsed
    const responseText = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr: any) {
      return {
        success: false,
        confidence: 0,
        probabilities: {},
        imagePath: '',
        error: `VISION_INVALID_RESPONSE: Server returned non-JSON response (HTTP ${res.status}).`,
        userError: 'Vision server returned an error. Please try again.',
        errorCode: 'VISION_INVALID_RESPONSE',
        diagnostic: {
          stage: '12. response_body_parsed',
          errorName: parseErr?.name || 'JSONParseError',
          errorMessage: parseErr?.message || 'Invalid JSON response',
          errorCode: 'VISION_INVALID_RESPONSE',
          originalUri: cleanUri,
          resolvedUri: targetFileUri,
          uriType: uriScheme,
          fileExists,
          fileSize,
          mimeType: safeMimeType,
          httpStatus: res.status,
          backendResponse: responseText.slice(0, 300),
        },
      };
    }

    if (!res.ok) {
      return {
        success: false,
        confidence: 0,
        probabilities: {},
        imagePath: '',
        error: data?.error || `VISION_HTTP_ERROR: Server returned status ${res.status}`,
        userError: 'Vision server returned an error. Please try again.',
        errorCode: 'VISION_HTTP_ERROR',
        diagnostic: {
          stage: '11. http_status_received',
          errorName: 'HTTPStatusError',
          errorMessage: data?.error || `Server status ${res.status}`,
          errorCode: 'VISION_HTTP_ERROR',
          originalUri: cleanUri,
          resolvedUri: targetFileUri,
          uriType: uriScheme,
          fileExists,
          fileSize,
          mimeType: safeMimeType,
          httpStatus: res.status,
          backendResponse: JSON.stringify(data).slice(0, 300),
        },
      };
    }

    // Checkpoint 13: Vision result validated
    if (!data.success) {
      return {
        success: false,
        confidence: 0,
        probabilities: {},
        imagePath: '',
        error: data.error || 'VISION_BACKEND_ERROR: Vision analysis returned unsuccessful status.',
        userError: data.error || 'Vision server returned an error. Please try again.',
        errorCode: 'VISION_BACKEND_ERROR',
        diagnostic: {
          stage: '13. vision_result_validated',
          errorName: 'BackendError',
          errorMessage: data.error || 'Backend returned success: false',
          errorCode: 'VISION_BACKEND_ERROR',
          originalUri: cleanUri,
          resolvedUri: targetFileUri,
          uriType: uriScheme,
          fileExists,
          fileSize,
          mimeType: safeMimeType,
          httpStatus: res.status,
          backendResponse: JSON.stringify(data).slice(0, 300),
        },
      };
    }

    return {
      success: true,
      disease: data.disease || null,
      soil: data.soil || null,
      confidence: data.confidence || 0,
      probabilities: data.probabilities || {},
      imagePath: data.imagePath || '',
      diagnostic: {
        stage: '13. vision_result_validated',
        errorCode: 'SUCCESS',
        originalUri: cleanUri,
        resolvedUri: targetFileUri,
        uriType: uriScheme,
        fileExists,
        fileSize,
        mimeType: safeMimeType,
        httpStatus: res.status,
      },
    };
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

/* ==========================================================================
   KrishiMitra AI — Frontend API Layer
   All backend communication goes through this file.
   Backend: http://localhost:5000
   ========================================================================== */

'use strict';

// ── Configuration ─────────────────────────────────────────────────────────────
const API_BASE_URL = (typeof window !== 'undefined' && window.location) ? (window.location.origin + '/api') : 'http://localhost:5000/api';
const REQUEST_TIMEOUT_MS = 20000; // 20 seconds

// ── Error messages (user-facing) ──────────────────────────────────────────────
const ERROR_MESSAGES = {
  BACKEND_OFFLINE:  'Offline AI backend not running. Please start the server.',
  OLLAMA_OFFLINE:   'Please start Ollama. Run: ollama serve in your terminal.',
  TIMEOUT:          'Request timed out. The AI is taking too long to respond.',
  NETWORK_ERROR:    'Network error. Please check your connection.',
  UNKNOWN:          'Something went wrong. Please try again.'
};

// ── Utility: fetch with timeout ───────────────────────────────────────────────
/**
 * Performs a fetch with a configurable timeout.
 * @param {string} url
 * @param {RequestInit} options
 * @param {number} [timeoutMs]
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ── Utility: classify error to user-friendly message ─────────────────────────
/**
 * Map a fetch/network error to a clean message for the farmer UI.
 * @param {Error|Object} err
 * @param {Object} [serverData] - parsed server JSON (if available)
 * @returns {string}
 */
function classifyError(err, serverData = null) {
  if (err?.name === 'AbortError')                return ERROR_MESSAGES.TIMEOUT;
  if (err?.code === 'ECONNREFUSED')              return ERROR_MESSAGES.BACKEND_OFFLINE;
  if (err?.message?.includes('Failed to fetch') ||
      err?.message?.includes('NetworkError') ||
      err?.message?.includes('ERR_CONNECTION_REFUSED')) {
    return ERROR_MESSAGES.BACKEND_OFFLINE;
  }
  if (serverData?.errorCode === 'OLLAMA_NOT_RUNNING') return ERROR_MESSAGES.OLLAMA_OFFLINE;
  if (serverData?.errorCode === 'TIMEOUT')             return ERROR_MESSAGES.TIMEOUT;
  if (serverData?.error)                               return serverData.error;
  return ERROR_MESSAGES.UNKNOWN;
}

// ── Health check ──────────────────────────────────────────────────────────────
/**
 * Check if the backend server is reachable.
 * @returns {Promise<{online: boolean, data?: Object, message?: string}>}
 */
async function checkBackendHealth() {
  try {
    const res  = await fetchWithTimeout(`${API_BASE_URL}/health`, {}, 5000);
    const data = await res.json();
    return { online: true, data };
  } catch (err) {
    return { online: false, message: classifyError(err) };
  }
}

// ── sendChat: Multilingual Sarvam AI Chatbot ─────────────────────────────────
/**
 * Send a chat message to KrishiMitra AI (Sarvam AI sarvam-105b / Ollama backend).
 *
 * @param {string} message                 - farmer's question
 * @param {Object} [options={}]
 * @param {string} [options.language='en'] - response language
 * @param {Array} [options.history=[]]     - conversation history
 * @param {Object} [options.farmerContext] - farmer profile & scan context
 * @param {string} [options.context='']    - extra context
 * @returns {Promise<{
 *   success: boolean,
 *   reply?: string,
 *   source?: string,
 *   model?: string,
 *   language?: string,
 *   domains?: string[],
 *   error?: string,
 *   userError?: string
 * }>}
 */
async function sendChat(message, options = {}) {
  const {
    language = 'en',
    history = [],
    farmerContext = null,
    context = ''
  } = options;

  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/chat`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message, language, history, farmerContext, context })
      },
      30000 // 30s timeout for AI inference
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        success:   false,
        error:     data.error || `Server error ${res.status}`,
        userError: data.userError || classifyError(null, data)
      };
    }

    return { success: true, ...data };

  } catch (err) {
    const userError = classifyError(err);
    console.error('[KrishiMitra API] sendChat error:', err);
    return { success: false, error: err.message, userError };
  }
}

// ── scanCrop ──────────────────────────────────────────────────────────────────
/**
 * Upload a crop image for disease scanning.
 *
 * @param {File|Blob} imageFile  - image from input[type=file] or canvas
 * @param {Object} [options={}]
 * @param {string} [options.cropType='']      - hint: 'paddy', 'wheat', etc.
 * @param {string} [options.language='en']
 * @returns {Promise<{
 *   success: boolean,
 *   scanId?: string,
 *   detection?: Object,
 *   error?: string,
 *   userError?: string
 * }>}
 */
async function scanCrop(imageFile, options = {}) {
  const { cropType = '', language = 'en' } = options;

  try {
    const formData = new FormData();
    formData.append('image',    imageFile);
    formData.append('cropType', cropType);
    formData.append('language', language);

    const res  = await fetchWithTimeout(
      `${API_BASE_URL}/vision`,
      { method: 'POST', body: formData }
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        success:   false,
        error:     data.error || `Server error ${res.status}`,
        userError: classifyError(null, data)
      };
    }

    return { success: true, ...data };

  } catch (err) {
    const userError = classifyError(err);
    console.error('[KrishiMitra API] scanCrop error:', err);
    return { success: false, error: err.message, userError };
  }
}

// ── getWeather ────────────────────────────────────────────────────────────────
/**
 * Get weather advisory for a location.
 *
 * @param {string} [location='Kishanpur, UP']
 * @param {Object} [options={}]
 * @param {string} [options.language='en']
 * @param {boolean} [options.useAI=false]
 * @returns {Promise<{success: boolean, weather?: Object, error?: string, userError?: string}>}
 */
async function getWeather(location = 'Kishanpur, UP', options = {}) {
  const { language = 'en', useAI = false } = options;

  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/weather`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ location, language, useAI })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        success:   false,
        error:     data.error || `Server error ${res.status}`,
        userError: classifyError(null, data)
      };
    }

    return { success: true, ...data };

  } catch (err) {
    const userError = classifyError(err);
    console.error('[KrishiMitra API] getWeather error:', err);
    return { success: false, error: err.message, userError };
  }
}

// ── getSchemes ────────────────────────────────────────────────────────────────
/**
 * Get government scheme listings.
 *
 * @param {Object} [filters={}]
 * @param {string} [filters.query='']         - search query
 * @param {string} [filters.state='']         - state filter
 * @param {string} [filters.language='en']
 * @param {boolean} [filters.useAI=false]     - enable AI summary
 * @returns {Promise<{success: boolean, schemes?: Array, summary?: string, error?: string, userError?: string}>}
 */
async function getSchemes(filters = {}) {
  const {
    query    = '',
    state    = '',
    language = 'en',
    useAI    = false
  } = filters;

  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/schemes`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query, state, language, useAI })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        success:   false,
        error:     data.error || `Server error ${res.status}`,
        userError: classifyError(null, data)
      };
    }

    return { success: true, ...data };

  } catch (err) {
    const userError = classifyError(err);
    console.error('[KrishiMitra API] getSchemes error:', err);
    return { success: false, error: err.message, userError };
  }
}

// ── Display helper ────────────────────────────────────────────────────────────
/**
 * Show an error to the user in a non-crashing way.
 * Looks for common KrishiMitra UI containers.
 *
 * @param {string} message
 * @param {string} [containerId] - optional DOM element ID to inject into
 */
function showApiError(message, containerId = null) {
  console.error('[KrishiMitra AI]', message);

  const el = containerId
    ? document.getElementById(containerId)
    : document.getElementById('chat-error-banner')
      || document.getElementById('error-banner')
      || document.getElementById('status-message');

  if (el) {
    el.textContent = message;
    el.style.display = 'block';
  } else {
    // Absolute last resort — non-blocking console only, never alert()
    console.warn('[KrishiMitra AI] No error container found. Message:', message);
  }
}

// ── Farm Diary API Methods ───────────────────────────────────────────────────
/**
 * Fetch Farm Diary events and fields.
 */
async function getFarmDiary(farmerId = 'farmer_default', filters = {}) {
  try {
    const query = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/farm-diary/${farmerId}${query ? '?' + query : ''}`;
    const res = await fetchWithTimeout(url, { method: 'GET' }, 15000);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[KrishiMitra API] getFarmDiary error:', err);
    return { success: false, events: [], fields: [], error: err.message };
  }
}

/**
 * Save a confirmed Farm Diary Event.
 */
async function saveDiaryEvent(eventData) {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/farm-diary`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      },
      15000
    );
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[KrishiMitra API] saveDiaryEvent error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delete a Farm Diary Event.
 */
async function deleteDiaryEvent(farmerId, eventId) {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/farm-diary/${farmerId}/${eventId}`,
      { method: 'DELETE' },
      15000
    );
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[KrishiMitra API] deleteDiaryEvent error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Extract structured event from natural language text.
 */
async function extractDiaryEvent(text, language = 'hi', source = 'voice') {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/farm-diary/extract`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language, source })
      },
      25000
    );
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[KrishiMitra API] extractDiaryEvent error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Run Next Best Action Decision Engine.
 */
async function getDecisionEngine(farmerId = 'farmer_default', crop = null) {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/farm-diary/decision`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmerId, crop })
      },
      20000
    );
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[KrishiMitra API] getDecisionEngine error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch Mandi prices from official backend API (/api/mandi) with static fallback.
 */
async function getMandiPrices(commodity = 'wheat', state = '', district = '') {
  try {
    const params = new URLSearchParams();
    if (commodity) params.append('commodity', commodity);
    if (state) params.append('state', state);
    if (district) params.append('district', district);

    const url = `${API_BASE_URL}/mandi?${params.toString()}`;
    console.log(`[MANDI FRONTEND DEBUG] Querying Mandi API: ${url}`);
    const res = await fetchWithTimeout(url, { method: 'GET' }, 15000);
    const data = await res.json();
    if (data && data.success && Array.isArray(data.records) && data.records.length > 0) {
      console.log(`[MANDI FRONTEND DEBUG] API Response received: success=true, recordsCount=${data.records.length}, dataDate=${data.dataDate}`);
      return data;
    }
  } catch (err) {
    console.warn('[KrishiMitra API] getMandiPrices backend fetch failed, triggering client fallback:', err);
  }

  // Client Fallback to static database/mandi/mandi.json asset for offline/static hosting
  try {
    const staticRes = await fetch('./database/mandi/mandi.json');
    if (staticRes.ok) {
      const rawList = await staticRes.json();
      const qLower = (commodity || 'wheat').trim().toLowerCase();
      
      let matched = rawList.filter(r => {
        const cLower = (r.commodity || '').toLowerCase();
        if (qLower === 'wheat') return cLower.includes('wheat') || cLower.includes('गेहूं');
        if (qLower === 'paddy') return cLower.includes('paddy') || cLower.includes('rice') || cLower.includes('धान');
        if (qLower === 'tomato') return cLower.includes('tomato') || cLower.includes('टमाटर');
        if (qLower === 'potato') return cLower.includes('potato') || cLower.includes('आलू');
        if (qLower === 'mustard') return cLower.includes('mustard') || cLower.includes('सरसों');
        return cLower.includes(qLower) || qLower.includes(cLower);
      });

      if (matched.length > 0) {
        const sorted = matched.sort((a, b) => b.modalPrice - a.modalPrice);
        const highest = sorted[0];
        const lowest = sorted[sorted.length - 1];
        return {
          success: true,
          commodity: highest.commodity || commodity,
          canonicalKey: qLower,
          count: sorted.length,
          dataDate: highest.arrivalDate || '15 Sep 2026',
          source: highest.source || 'Agmarknet / Government of India',
          sourceUrl: highest.sourceUrl || 'https://agmarknet.gov.in/',
          isCached: true,
          summary: {
            highest: {
              market: highest.market,
              district: highest.district,
              state: highest.state,
              modalPrice: highest.modalPrice,
              minPrice: highest.minPrice,
              maxPrice: highest.maxPrice,
              unit: highest.unit || '₹ / Quintal',
              arrivalDate: highest.arrivalDate,
              source: highest.source,
              sourceUrl: highest.sourceUrl
            },
            lowest: {
              market: lowest.market,
              district: lowest.district,
              state: lowest.state,
              modalPrice: lowest.modalPrice,
              minPrice: lowest.minPrice,
              maxPrice: lowest.maxPrice,
              unit: lowest.unit || '₹ / Quintal',
              arrivalDate: lowest.arrivalDate,
              source: lowest.source,
              sourceUrl: lowest.sourceUrl
            }
          },
          records: sorted
        };
      }
    }
  } catch (staticErr) {
    console.error('[KrishiMitra API] Static mandi.json fallback error:', staticErr);
  }

  return {
    success: true,
    commodity: commodity,
    count: 0,
    records: [],
    message: `No current/latest mandi record found for ${commodity}.`
  };
}

// ── Exports (ES Module style for future bundler compat + plain <script> compat)
if (typeof module !== 'undefined' && module.exports) {
  // Node / CommonJS (for testing)
  module.exports = {
    checkBackendHealth,
    sendChat,
    scanCrop,
    getWeather,
    getSchemes,
    getFarmDiary,
    saveDiaryEvent,
    deleteDiaryEvent,
    extractDiaryEvent,
    getDecisionEngine,
    getMandiPrices,
    showApiError,
    API_BASE_URL,
    ERROR_MESSAGES
  };
} else {
  // Browser global
  window.KrishiMitraAPI = {
    checkBackendHealth,
    sendChat,
    scanCrop,
    getWeather,
    getSchemes,
    getFarmDiary,
    saveDiaryEvent,
    deleteDiaryEvent,
    extractDiaryEvent,
    getDecisionEngine,
    getMandiPrices,
    showApiError,
    API_BASE_URL,
    ERROR_MESSAGES
  };
}

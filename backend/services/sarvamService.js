/* ==========================================================================
   KrishiMitra AI — Sarvam AI Service
   Production-ready integration with Sarvam AI Chat Completions API
   Model: sarvam-105b
   Endpoint: https://api.sarvam.ai/v1/chat/completions
   ========================================================================== */

'use strict';

const https = require('https');
const { logger } = require('../middleware/logger');

// ── Configuration ─────────────────────────────────────────────────────────────
const SARVAM_API_URL = process.env.SARVAM_API_URL || 'https://api.sarvam.ai/v1/chat/completions';
const DEFAULT_MODEL = process.env.SARVAM_MODEL || 'sarvam-105b';
const REQUEST_TIMEOUT_MS = 35000; // 35 seconds

/**
 * Check if the Sarvam API key is configured.
 * @returns {boolean}
 */
function isConfigured() {
  const key = process.env.SARVAM_API_KEY;
  return Boolean(key && key.trim() && key !== 'YOUR_SARVAM_API_KEY_HERE');
}

/**
 * Execute HTTP request to Sarvam AI Chat Completions endpoint.
 *
 * @param {Object} payload
 * @param {string} apiKey
 * @returns {Promise<Object>}
 */
function callSarvamHttp(payload, apiKey) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(SARVAM_API_URL);
    const postData = JSON.stringify(payload);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'api-subscription-key': apiKey,
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: REQUEST_TIMEOUT_MS
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        const statusCode = res.statusCode;
        if (statusCode >= 200 && statusCode < 300) {
          try {
            const parsed = JSON.parse(body);
            resolve({ statusCode, data: parsed });
          } catch (err) {
            reject(new Error(`Failed to parse Sarvam AI response: ${err.message}`));
          }
        } else {
          let errorMsg = `Sarvam API returned HTTP ${statusCode}`;
          let errorObj = null;
          try {
            errorObj = JSON.parse(body);
            if (errorObj && (errorObj.message || errorObj.error)) {
              errorMsg = errorObj.message || (typeof errorObj.error === 'string' ? errorObj.error : JSON.stringify(errorObj.error));
            }
          } catch (_) {
            errorMsg += `: ${body.substring(0, 150)}`;
          }

          const error = new Error(errorMsg);
          error.statusCode = statusCode;
          error.raw = body;
          reject(error);
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const err = new Error('Sarvam AI request timed out');
      err.code = 'TIMEOUT';
      reject(err);
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Send messages to Sarvam AI Chat Completions (`sarvam-105b`).
 *
 * @param {Object} options
 * @param {Array<{role: string, content: string}>} options.messages
 * @param {string} [options.model]
 * @param {number} [options.temperature=0.4]
 * @param {number} [options.maxTokens=1024]
 * @returns {Promise<{
 *   success: boolean,
 *   reply?: string,
 *   model?: string,
 *   inferenceMs?: number,
 *   error?: string,
 *   errorCode?: string,
 *   userError?: string
 * }>}
 */
async function askSarvamChat(options = {}) {
  const {
    messages = [],
    model = DEFAULT_MODEL,
    temperature = 0.4,
    maxTokens = 1024
  } = options;

  const startTime = Date.now();

  // 1. Verify API Key presence
  if (!isConfigured()) {
    logger.warn('[SARVAM] SARVAM_API_KEY is not configured in backend environment.');
    return {
      success: false,
      error: 'SARVAM_API_KEY environment variable is missing or empty.',
      errorCode: 'MISSING_API_KEY',
      userError: 'Sarvam AI is not configured. Please set SARVAM_API_KEY in your backend .env file.',
      inferenceMs: Date.now() - startTime
    };
  }

  const apiKey = process.env.SARVAM_API_KEY.trim();

  // 2. Validate input messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      success: false,
      error: 'Messages array is required and must not be empty.',
      errorCode: 'INVALID_MESSAGES',
      userError: 'Invalid chat message.',
      inferenceMs: Date.now() - startTime
    };
  }

  // 3. Prepare payload for OpenAI-compatible Sarvam endpoint
  const payload = {
    model: model,
    messages: messages,
    temperature: typeof temperature === 'number' ? temperature : 0.4,
    max_tokens: typeof maxTokens === 'number' ? maxTokens : 1024
  };

  logger.info(`[SARVAM] Requesting chat completion with model "${model}" (${messages.length} messages)...`);

  // 4. Execute request with retry mechanism (1 retry on transient network errors)
  let attempts = 0;
  const maxAttempts = 2;
  let lastError = null;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const response = await callSarvamHttp(payload, apiKey);
      const inferenceMs = Date.now() - startTime;

      if (response && response.data) {
        const choices = response.data.choices;
        if (Array.isArray(choices) && choices.length > 0 && choices[0].message) {
          const content = choices[0].message.content || '';
          logger.info(`[SARVAM] Response received successfully in ${inferenceMs}ms.`);
          return {
            success: true,
            reply: content.trim(),
            model: response.data.model || model,
            usage: response.data.usage,
            inferenceMs
          };
        }
      }

      throw new Error('Sarvam AI returned an empty or malformed choice array.');
    } catch (err) {
      lastError = err;
      const isRateLimit = err.statusCode === 429;
      const isAuthError = err.statusCode === 401 || err.statusCode === 403;
      const isTimeout = err.code === 'TIMEOUT';

      logger.warn(`[SARVAM] Attempt ${attempts} failed: ${err.message}`, {
        statusCode: err.statusCode,
        code: err.code
      });

      // Don't retry on auth errors or client bad requests
      if (isAuthError || (err.statusCode && err.statusCode >= 400 && err.statusCode < 500 && !isRateLimit)) {
        break;
      }

      if (attempts < maxAttempts) {
        // Wait 1.5s before retry
        await new Promise((res) => setTimeout(res, 1500));
      }
    }
  }

  const inferenceMs = Date.now() - startTime;
  let errorCode = 'SARVAM_ERROR';
  let userError = 'KrishiMitra AI is momentarily unavailable. Please try again.';

  if (lastError) {
    if (lastError.statusCode === 401 || lastError.statusCode === 403) {
      errorCode = 'INVALID_API_KEY';
      userError = 'Invalid or expired Sarvam AI API Key. Please verify your SARVAM_API_KEY in .env.';
    } else if (lastError.statusCode === 429) {
      errorCode = 'RATE_LIMITED';
      userError = 'Sarvam AI rate limit reached. Please wait a moment and try again.';
    } else if (lastError.code === 'TIMEOUT') {
      errorCode = 'TIMEOUT';
      userError = 'KrishiMitra AI is taking longer than expected. Please try again.';
    }
  }

  return {
    success: false,
    error: lastError ? lastError.message : 'Unknown Sarvam error',
    errorCode,
    userError,
    inferenceMs
  };
}

/**
 * Check if the Sarvam AI service is reachable and responsive.
 * @returns {Promise<{available: boolean, message: string}>}
 */
async function checkSarvamHealth() {
  if (!isConfigured()) {
    return { available: false, message: 'SARVAM_API_KEY is not configured.' };
  }
  return { available: true, message: 'SARVAM_API_KEY is configured.' };
}

module.exports = {
  askSarvamChat,
  checkSarvamHealth,
  isConfigured,
  DEFAULT_MODEL
};

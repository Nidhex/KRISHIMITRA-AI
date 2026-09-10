/* ==========================================================================
   KrishiMitra AI — Multilingual Chat Route
   POST /api/chat
   Provider Priority: Sarvam AI (sarvam-105b) → Ollama (Gemma 3) → Gemini Fallback
   Supports: 11 Indian Languages, Romanized Scripts, Code-mixed Queries
   ========================================================================== */

'use strict';

const express = require('express');
const router  = express.Router();

const { logger } = require('../middleware/logger');
const rag = require('../services/ragService');
const sarvam = require('../services/sarvamService');
const ollama = require('../services/ollamaService');
const textExtractor = require('../services/textExtractionService');

/**
 * System prompt generator for KrishiMitra AI.
 *
 * @param {string} detectedLanguage
 * @param {string} contextString
 * @returns {string}
 */
function buildSystemPrompt(detectedLanguage, contextString) {
  return `You are KrishiMitra AI (कृषि मित्र), an intelligent, friendly, and expert agricultural assistant dedicated to empowering Indian farmers.

CORE GUIDELINES:
1. LANGUAGE & COMMUNICATION:
   - Respond naturally in the farmer's language (${detectedLanguage.toUpperCase()}).
   - If the farmer wrote in Romanized script (e.g., Hinglish, Gujlish, Marathlish) or code-mixed language, understand the intent and respond in natural, fluent ${detectedLanguage.toUpperCase()}.
   - Use simple, direct, respectful language that any farmer can easily understand.
   - Avoid overly academic or dense technical jargon.

2. AGRICULTURAL PRACTICALITY & ACCURACY:
   - Give actionable, step-by-step guidance.
   - Specify concrete measurements whenever relevant (e.g., kg/acre, ml per litre of water, days between watering).
   - When suggesting disease or pest treatments, clearly distinguish between Organic (जैविक) and Chemical (रासायनिक) remedies.
   - Emphasize safety (wearing masks/gloves when spraying).

3. SOURCE OF TRUTH (CONTEXT):
   - The verified KrishiMitra data provided below is your primary source of truth for diseases, treatments, mandi rates, government schemes, and soil properties.
   - If the context contains specific solutions or dosages, follow them closely.
   - Do NOT invent fake schemes, unverified chemicals, or misleading statistics.

4. FORMATTING:
   - Use clean bullet points or numbered steps for readability on mobile screens.
   - Keep answers concise and focused (under 200-250 words unless detailed steps are needed).

VERIFIED KRISHIMITRA CONTEXT & GUIDELINES:
${contextString}`;
}

/**
 * POST /api/chat
 *
 * Request Body:
 * {
 *   "message": "cotton ma su rog che?",
 *   "language": "gu",               // Optional (en, hi, gu, mr, bn, ta, te, kn, ml, pa, or)
 *   "history": [...],                // Optional conversation history [{role: 'user'|'assistant', content: '...'}]
 *   "farmerContext": {...},          // Optional farmer profile details
 *   "context": "..."                 // Optional extra client-side context
 * }
 */
router.post('/', async (req, res, next) => {
  const requestStart = Date.now();

  try {
    const {
      message,
      language = 'en',
      history = [],
      farmerContext = null,
      context = ''
    } = req.body;

    // ── 1. Validation ─────────────────────────────────────────────────────────
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string.',
        userError: 'Please type a question before sending.',
        errorCode: 'MISSING_MESSAGE'
      });
    }

    const trimmedMessage = message.trim();

    // Guard against excessively large payloads (> 1500 chars)
    if (trimmedMessage.length > 1500) {
      return res.status(400).json({
        success: false,
        error: 'Message is too long. Please keep your question under 1500 characters.',
        userError: 'Your message is too long. Please ask a shorter question.',
        errorCode: 'MESSAGE_TOO_LONG'
      });
    }

    // ── 2. Multilingual RAG Retrieval ─────────────────────────────────────────
    logger.info(`[CHAT] Incoming message: "${trimmedMessage.substring(0, 80)}"`, {
      requestedLang: language,
      historyLength: Array.isArray(history) ? history.length : 0
    });

    const ragResult = await rag.retrieveContext(trimmedMessage, {
      language,
      farmerContext
    });

    const detectedLang = ragResult.detectedLanguage || language || 'en';

    // Merge extra client context if provided
    const combinedContext = [ragResult.context, context].filter(Boolean).join('\n\n');

    // ── 3. Sanitise Conversation History (Sliding Window: last 6 turns) ───────
    const sanitisedHistory = Array.isArray(history)
      ? history
          .filter(h => h && (h.role === 'user' || h.role === 'assistant' || h.role === 'model') && typeof h.content === 'string')
          .slice(-6)
          .map(h => ({
            role: h.role === 'model' ? 'assistant' : h.role,
            content: h.content.trim()
          }))
      : [];

    // ── 4. Build Structured Messages Array for Sarvam AI ──────────────────────
    const systemPrompt = buildSystemPrompt(detectedLang, combinedContext);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...sanitisedHistory,
      { role: 'user', content: trimmedMessage }
    ];

    // ── 5. Attempt Sarvam AI (sarvam-105b) First ───────────────────────────────
    let reply = '';
    let source = 'sarvam';
    let model = sarvam.DEFAULT_MODEL;
    let inferenceMs = 0;

    if (sarvam.isConfigured()) {
      const sarvamResult = await sarvam.askSarvamChat({
        messages,
        model: process.env.SARVAM_MODEL || 'sarvam-105b',
        temperature: 0.4,
        maxTokens: 1000
      });

      if (sarvamResult.success && sarvamResult.reply) {
        reply = sarvamResult.reply;
        source = 'sarvam';
        model = sarvamResult.model;
        inferenceMs = sarvamResult.inferenceMs;
      } else {
        logger.warn('[LLM] Sarvam unavailable: Sarvam AI call failed.', {
          error: sarvamResult.error,
          errorCode: sarvamResult.errorCode
        });
      }
    } else {
      logger.info('[LLM] Sarvam unavailable: SARVAM_API_KEY is not configured.');
    }

    // ── 6. Fallback to Gemini 3.5 Flash ──────────────────────────────────────
    if (!reply) {
      if (process.env.GEMINI_API_KEY) {
        try {
          const geminiPrompt = `${systemPrompt}\n\nFarmer Question:\n${trimmedMessage}\n\nAnswer in ${detectedLang.toUpperCase()}:`;
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
          const geminiPayload = JSON.stringify({
            contents: [{ parts: [{ text: geminiPrompt }] }]
          });

          const geminiRes = await new Promise((resolve) => {
            const gUrlObj = new URL(geminiUrl);
            const gReq = require('https').request({
              hostname: gUrlObj.hostname,
              path: gUrlObj.pathname + gUrlObj.search,
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(geminiPayload)
              },
              timeout: 20000
            }, (gRes) => {
              let gBody = '';
              gRes.on('data', c => gBody += c);
              gRes.on('end', () => {
                if (gRes.statusCode === 200) {
                  try {
                    const parsed = JSON.parse(gBody);
                    const gText = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    resolve(gText);
                  } catch (_) {
                    resolve('');
                  }
                } else {
                  resolve('');
                }
              });
            });
            gReq.on('error', () => resolve(''));
            gReq.on('timeout', () => { gReq.destroy(); resolve(''); });
            gReq.write(geminiPayload);
            gReq.end();
          });

          if (geminiRes && geminiRes.trim()) {
            reply = geminiRes.trim();
            source = 'gemini';
            model = 'gemini-3.5-flash';
            inferenceMs = Date.now() - requestStart;
          } else {
            logger.warn('[LLM] Gemini unavailable: Gemini API call did not return valid text.');
          }
        } catch (e) {
          logger.warn('[LLM] Gemini unavailable: Exception during Gemini call:', e.message);
        }
      } else {
        logger.info('[LLM] Gemini unavailable: GEMINI_API_KEY is not configured.');
      }
    }

    // ── 7. Fallback to Ollama (Gemma 3) — Development Only ──────────────────
    if (!reply) {
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) {
        logger.info('[LLM] Production mode: skipping Ollama');
      } else {
        logger.info('[LLM] Development mode: attempting Ollama fallback');
        const fallbackPrompt = `${systemPrompt}\n\nFarmer Question:\n${trimmedMessage}\n\nAnswer in ${detectedLang.toUpperCase()}:`;
        const gemmaResult = await ollama.askGemma(fallbackPrompt);

        if (gemmaResult.success && gemmaResult.response) {
          reply = gemmaResult.response;
          source = 'gemma3';
          model = gemmaResult.model;
          inferenceMs = gemmaResult.inferenceMs;
        } else {
          logger.warn('[LLM] Ollama unavailable:', gemmaResult.error);
        }
      }
    }

    // ── 8. Ground-Truth Direct RAG Knowledge Base Fallback ───────────────────
    if (!reply) {
      logger.info('[LLM] Falling back to local RAG');
      reply = textExtractor.buildFarmerFacingRAGAnswer(ragResult, detectedLang);
      source = 'rag_direct';
      model = 'krishi_kb';
      inferenceMs = Date.now() - requestStart;
    }

    // Clean and sanitize response text
    reply = textExtractor.extractFinalAssistantText(reply);
    reply = textExtractor.sanitizeAssistantText(reply, { language: detectedLang });

    if (textExtractor.isInternalPromptLeaked(reply)) {
      logger.warn('[CHAT] Refusing to return leaked internal prompt, using clean RAG fallback');
      reply = textExtractor.buildFarmerFacingRAGAnswer(ragResult, detectedLang);
    }

    const totalMs = Date.now() - requestStart;

    // ── 9. If no provider succeeded, return friendly error ───────────────────
    if (!reply) {
      logger.error('[CHAT] All AI providers failed to generate a response.', { totalMs });
      return res.status(503).json({
        success: false,
        error: 'AI services are currently unavailable.',
        userError: 'KrishiMitra AI is momentarily unavailable. Please check your connection and try again.',
        errorCode: 'SERVICE_UNAVAILABLE'
      });
    }

    // ── 10. Success Response ─────────────────────────────────────────────────
    logger.info(`[CHAT] Response generated via ${source} (${model}) in ${inferenceMs}ms`, {
      language: detectedLang,
      domains: ragResult.domains,
      docCount: ragResult.docCount,
      totalMs
    });

    return res.json({
      success: true,
      reply: reply.trim(),
      source,
      model,
      language: detectedLang,
      inferenceMs,
      totalMs,
      domains: ragResult.domains,
      docCount: ragResult.docCount,
      keywords: ragResult.keywords
    });

  } catch (err) {
    logger.error('[CHAT] Unhandled error in /api/chat:', { message: err.message, stack: err.stack });
    next(err);
  }
});

module.exports = router;

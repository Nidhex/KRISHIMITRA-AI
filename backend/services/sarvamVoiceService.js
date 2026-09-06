/* ==========================================================================
   KrishiMitra AI — Sarvam Voice Service
   Handles:
     1. Speech-to-Text (Saaras:v3)
     2. Text-to-Speech (Bulbul:v3)
     3. Complete In-Browser Voice Call Turn Orchestration (STT ➔ RAG ➔ Chat ➔ TTS)
   ========================================================================== */

'use strict';

const https = require('https');
const { logger } = require('../middleware/logger');
const sarvam = require('./sarvamService');
const rag = require('./ragService');
const ollama = require('./ollamaService');

const SARVAM_STT_URL = process.env.SARVAM_STT_URL || 'https://api.sarvam.ai/speech-to-text';
const SARVAM_TTS_URL = process.env.SARVAM_TTS_URL || 'https://api.sarvam.ai/text-to-speech';
const STT_MODEL = process.env.SARVAM_STT_MODEL || 'saaras:v3';
const TTS_MODEL = process.env.SARVAM_TTS_MODEL || 'bulbul:v3';

// ── BCP-47 Language Mapping for Sarvam Speech APIs ───────────────────────────
const LANGUAGE_CODE_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  gu: 'gu-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  pa: 'pa-IN',
  or: 'od-IN',
  od: 'od-IN'
};

/**
 * Convert simple ISO lang code to BCP-47 code (e.g. 'gu' -> 'gu-IN').
 * @param {string} lang
 * @returns {string}
 */
function toBCP47(lang) {
  if (!lang) return 'en-IN';
  if (lang.includes('-')) return lang;
  return LANGUAGE_CODE_MAP[lang.toLowerCase()] || 'en-IN';
}

/**
 * Execute HTTP POST to Sarvam Speech-to-Text API (multipart/form-data).
 *
 * @param {Buffer} audioBuffer
 * @param {string} mimeType
 * @param {string} [languageCode]
 * @returns {Promise<{transcript: string, languageCode: string}>}
 */
async function transcribeAudio(audioBuffer, mimeType = 'audio/webm', languageCode = '') {
  const startTime = Date.now();

  if (!sarvam.isConfigured()) {
    throw new Error('SARVAM_API_KEY is not configured in backend environment.');
  }

  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error('Audio buffer is empty.');
  }

  const apiKey = process.env.SARVAM_API_KEY.trim();
  const boundary = `----SarvamBoundary${Date.now().toString(16)}`;

  // Determine file extension
  let ext = 'webm';
  if (mimeType.includes('wav')) ext = 'wav';
  else if (mimeType.includes('mp4') || mimeType.includes('m4a')) ext = 'm4a';
  else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) ext = 'mp3';
  else if (mimeType.includes('ogg')) ext = 'ogg';

  // Construct multipart body
  const crlf = '\r\n';
  const parts = [];
  const bcp = toBCP47(languageCode);

  // 1. Model field
  parts.push(Buffer.from(
    `--${boundary}${crlf}` +
    `Content-Disposition: form-data; name="model"${crlf}${crlf}` +
    `${STT_MODEL}${crlf}`
  ));

  // 2. Mode field
  parts.push(Buffer.from(
    `--${boundary}${crlf}` +
    `Content-Disposition: form-data; name="mode"${crlf}${crlf}` +
    `transcribe${crlf}`
  ));

  // 3. Language code field
  if (bcp) {
    parts.push(Buffer.from(
      `--${boundary}${crlf}` +
      `Content-Disposition: form-data; name="language_code"${crlf}${crlf}` +
      `${bcp}${crlf}`
    ));
  }

  // 4. Audio file field
  parts.push(Buffer.from(
    `--${boundary}${crlf}` +
    `Content-Disposition: form-data; name="file"; filename="farmer_voice.${ext}"${crlf}` +
    `Content-Type: ${mimeType}${crlf}${crlf}`
  ));
  parts.push(audioBuffer);
  parts.push(Buffer.from(`${crlf}--${boundary}--${crlf}`));

  const payload = Buffer.concat(parts);
  const urlObj = new URL(SARVAM_STT_URL);

  const options = {
    hostname: urlObj.hostname,
    port: urlObj.port || 443,
    path: urlObj.pathname + urlObj.search,
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': payload.length,
      'api-subscription-key': apiKey
    },
    timeout: 30000
  };

  return new Promise((resolve, reject) => {
    logger.info(`[VOICE] Calling Sarvam STT (${audioBuffer.length} bytes, ${mimeType}, ${bcp})`);

    const req = https.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');

      res.on('data', (chunk) => { body += chunk; });

      res.on('end', () => {
        const statusCode = res.statusCode;
        const duration = Date.now() - startTime;

        if (statusCode >= 200 && statusCode < 300) {
          try {
            const data = JSON.parse(body);
            const transcript = (data.transcript || data.text || '').trim();
            logger.info(`[VOICE] STT response received in ${duration}ms`);
            resolve({
              transcript,
              languageCode: data.language_code || bcp || 'en-IN',
              durationMs: duration
            });
          } catch (e) {
            reject(new Error(`Failed to parse Sarvam STT JSON: ${e.message}`));
          }
        } else {
          logger.warn(`[VOICE] Sarvam STT returned HTTP ${statusCode}: ${body.substring(0, 120)}`);
          let msg = `Sarvam STT HTTP ${statusCode}`;
          try {
            const parsed = JSON.parse(body);
            if (parsed.error && typeof parsed.error === 'object') {
              msg = parsed.error.message || JSON.stringify(parsed.error);
            } else {
              msg = parsed.message || parsed.error || msg;
            }
          } catch (_) {}
          const err = new Error(msg);
          err.statusCode = statusCode;
          reject(err);
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Sarvam STT request timed out (30s).'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Execute HTTP POST to Sarvam Text-to-Speech API (Bulbul:v3).
 *
 * @param {string} text - text to speak
 * @param {string} [languageCode='en-IN']
 * @param {string} [speaker='shubh']
 * @param {number} [pace=0.95]
 * @returns {Promise<{audioBase64: string, format: string, durationMs: number}>}
 */
async function synthesizeSpeech(text, languageCode = 'en-IN', speaker = 'shubh', pace = 0.95) {
  const startTime = Date.now();

  if (!sarvam.isConfigured()) {
    throw new Error('SARVAM_API_KEY is not configured in backend environment.');
  }

  if (!text || !text.trim()) {
    throw new Error('Text to synthesize cannot be empty.');
  }

  const apiKey = process.env.SARVAM_API_KEY.trim();
  const bcp = toBCP47(languageCode);

  // Clean text of markdown asterisks/bullets for clean audio synthesis
  const cleanSpeechText = text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s+/g, '')
    .replace(/[-•]\s+/g, ', ')
    .replace(/\n+/g, ' ')
    .trim()
    .substring(0, 2000); // 2000 chars safety cap

  const payloadData = JSON.stringify({
    text: cleanSpeechText,
    inputs: [cleanSpeechText],
    target_language_code: bcp,
    language_code: bcp,
    speaker: speaker || 'shubh',
    model: TTS_MODEL,
    pace: pace || 0.95
  });

  const urlObj = new URL(SARVAM_TTS_URL);

  const options = {
    hostname: urlObj.hostname,
    port: urlObj.port || 443,
    path: urlObj.pathname + urlObj.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payloadData),
      'api-subscription-key': apiKey
    },
    timeout: 30000
  };

  return new Promise((resolve, reject) => {
    logger.info(`[VOICE] Calling Sarvam TTS for ${bcp} (${cleanSpeechText.length} chars)`);

    const req = https.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');

      res.on('data', (chunk) => { body += chunk; });

      res.on('end', () => {
        const statusCode = res.statusCode;
        const duration = Date.now() - startTime;

        if (statusCode >= 200 && statusCode < 300) {
          try {
            const data = JSON.parse(body);
            let audioBase64 = '';
            if (Array.isArray(data.audios) && data.audios.length > 0) {
              audioBase64 = data.audios[0];
            } else if (typeof data.audio === 'string') {
              audioBase64 = data.audio;
            }

            if (!audioBase64) {
              return reject(new Error('Sarvam TTS returned empty audio payload.'));
            }

            logger.info(`[VOICE] TTS response received in ${duration}ms`);
            resolve({
              audioBase64,
              format: 'wav',
              durationMs: duration
            });
          } catch (e) {
            reject(new Error(`Failed to parse Sarvam TTS JSON: ${e.message}`));
          }
        } else {
          logger.warn(`[VOICE] Sarvam TTS returned HTTP ${statusCode}: ${body.substring(0, 120)}`);
          let msg = `Sarvam TTS HTTP ${statusCode}`;
          try {
            const parsed = JSON.parse(body);
            if (parsed.error && typeof parsed.error === 'object') {
              msg = parsed.error.message || JSON.stringify(parsed.error);
            } else {
              msg = parsed.message || parsed.error || msg;
            }
          } catch (_) {}
          const err = new Error(msg);
          err.statusCode = statusCode;
          reject(err);
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Sarvam TTS request timed out (30s).'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(payloadData);
    req.end();
  });
}

/**
 * End-to-end voice call turn handler:
 * Audio In ➔ Saaras STT ➔ Multilingual RAG ➔ Sarvam-105b ➔ Bulbul TTS ➔ Audio Out
 *
 * @param {Object} params
 * @param {Buffer} params.audioBuffer
 * @param {string} params.mimeType
 * @param {string} [params.language='en']
 * @param {Array} [params.history=[]]
 * @param {Object} [params.farmerContext]
 * @param {string} [params.browserTranscript]
 * @returns {Promise<{
 *   success: boolean,
 *   transcript: string,
 *   reply: string,
 *   audioBase64?: string,
 *   language: string,
 *   detectedLanguage: string,
 *   domains: string[],
 *   docCount: number,
 *   timings: Object
 * }>}
 */
async function handleCallTurn(params = {}) {
  const {
    audioBuffer,
    mimeType = 'audio/webm',
    language = 'en',
    history = [],
    farmerContext = null,
    browserTranscript = ''
  } = params;

  const timings = {};
  const t0 = Date.now();

  logger.info(`[VOICE] Received audio request (${audioBuffer ? audioBuffer.length : 0} bytes)`);
  logger.info(`[VOICE] Audio parsed successfully`);

  // ── Step 1: Speech-to-Text (Saaras:v3) ─────────────────────────────────────
  let transcript = '';
  if (audioBuffer && audioBuffer.length > 0) {
    try {
      const sttResult = await transcribeAudio(audioBuffer, mimeType, language);
      transcript = sttResult.transcript;
      timings.sttMs = sttResult.durationMs;
    } catch (sttErr) {
      logger.warn(`[VOICE] STT request issue: ${sttErr.message}`);
      // Use browser transcript fallback if available
      if (browserTranscript && browserTranscript.trim()) {
        transcript = browserTranscript.trim();
        logger.info(`[VOICE] Using browser speech transcript fallback: "${transcript}"`);
      }
    }
  } else if (browserTranscript && browserTranscript.trim()) {
    transcript = browserTranscript.trim();
    logger.info(`[VOICE] Using browser speech transcript: "${transcript}"`);
  }

  // If still empty, check browser fallback
  if (!transcript || transcript.trim().length === 0) {
    if (browserTranscript && browserTranscript.trim()) {
      transcript = browserTranscript.trim();
    }
  }

  if (!transcript || transcript.trim().length === 0) {
    logger.warn('[VOICE] No speech detected in audio turn');
    return {
      success: false,
      errorCode: 'NO_SPEECH_DETECTED',
      userError: 'Could not hear any speech. Please speak clearly into your microphone and try again.',
      timings: { totalMs: Date.now() - t0 }
    };
  }

  logger.info(`[VOICE] Transcript: "${transcript}"`);

  // ── Step 2: Multilingual RAG Context Retrieval ────────────────────────────
  const tRagStart = Date.now();
  const ragResult = await rag.retrieveContext(transcript, {
    language,
    farmerContext
  });
  timings.ragMs = Date.now() - tRagStart;

  const detectedLang = ragResult.detectedLanguage || language || 'en';

  // ── Step 3: Conversational Sarvam Chat Completion (sarvam-105b) ───────────
  logger.info(`[VOICE] Calling KrishiMitra/Sarvam chat (detectedLang: ${detectedLang})`);
  const tChatStart = Date.now();
  const systemPrompt = `You are KrishiMitra AI (कृषि मित्र) on a LIVE VOICE CALL with an Indian farmer.
Speak naturally, kindly, and clearly in ${detectedLang.toUpperCase()}.
Keep your answer conversational, direct, and concise (under 70-90 words so it is easy to listen to).
Distinguish between Organic and Chemical remedies if discussing diseases.
Use the verified KrishiMitra data below as your ground truth:

${ragResult.context}`;

  const sanitisedHistory = Array.isArray(history)
    ? history
        .filter(h => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
        .slice(-6)
    : [];

  const messages = [
    { role: 'system', content: systemPrompt },
    ...sanitisedHistory,
    { role: 'user', content: transcript }
  ];

  let replyText = '';
  let chatSource = 'sarvam';
  let chatModel = 'sarvam-105b';

  // 3a. Try Sarvam AI first
  if (sarvam.isConfigured()) {
    const chatRes = await sarvam.askSarvamChat({
      messages,
      model: process.env.SARVAM_MODEL || 'sarvam-105b',
      temperature: 0.35,
      maxTokens: 400
    });

    if (chatRes.success && chatRes.reply) {
      replyText = chatRes.reply;
      chatSource = 'sarvam';
      chatModel = chatRes.model;
    }
  }

  // 3b. Fallback to Gemini if Sarvam unavailable
  if (!replyText && process.env.GEMINI_API_KEY) {
    try {
      const geminiPrompt = `${systemPrompt}\n\nFarmer Question:\n${transcript}\n\nProvide a concise, direct voice response in ${detectedLang.toUpperCase()}:`;
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const geminiPayload = JSON.stringify({
        contents: [{ parts: [{ text: geminiPrompt }] }]
      });

      const geminiRes = await new Promise((resolve, reject) => {
        const gUrlObj = new URL(geminiUrl);
        const gReq = https.request({
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
              } catch (e) {
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

      if (geminiRes) {
        replyText = geminiRes.trim();
        chatSource = 'gemini';
        chatModel = 'gemini-3.5-flash';
      }
    } catch (_) {}
  }

  // 3c. Fallback to Ollama
  if (!replyText) {
    const fallbackPrompt = `${systemPrompt}\n\nFarmer: ${transcript}\n\nAnswer concisely in ${detectedLang.toUpperCase()}:`;
    const gemmaResult = await ollama.askGemma(fallbackPrompt);
    if (gemmaResult.success && gemmaResult.response) {
      replyText = gemmaResult.response;
      chatSource = 'gemma3';
      chatModel = 'gemma3';
    }
  }

  // 3d. Direct Ground-Truth RAG Knowledge Fallback
  if (!replyText && ragResult.context) {
    replyText = `Based on agricultural recommendations for ${detectedLang.toUpperCase()}: ${ragResult.context.substring(0, 250)}. Please consult local Krishi Vigyan Kendra for dosage.`;
    chatSource = 'rag_direct';
    chatModel = 'krishi_kb';
  }

  timings.chatMs = Date.now() - tChatStart;

  if (!replyText) {
    return {
      success: false,
      transcript,
      errorCode: 'CHAT_FAILED',
      userError: 'KrishiMitra AI is having trouble formulating a response. Please try again.',
      timings: { totalMs: Date.now() - t0 }
    };
  }

  logger.info(`[VOICE] AI response received (${replyText.length} chars, source: ${chatSource})`);

  // ── Step 4: Text-to-Speech (Bulbul:v3) ─────────────────────────────────────
  const tTtsStart = Date.now();
  let audioBase64 = null;
  const bcp = toBCP47(detectedLang);

  if (sarvam.isConfigured()) {
    try {
      const ttsRes = await synthesizeSpeech(replyText, bcp, 'shubh', 0.95);
      audioBase64 = ttsRes.audioBase64;
      timings.ttsMs = ttsRes.durationMs;
    } catch (ttsErr) {
      logger.warn(`[VOICE] TTS synthesis fallback to browser Web Speech: ${ttsErr.message}`);
    }
  }
  timings.ttsMs = timings.ttsMs || (Date.now() - tTtsStart);
  timings.totalMs = Date.now() - t0;

  return {
    success: true,
    transcript,
    reply: replyText.trim(),
    audioBase64,
    source: chatSource,
    model: chatModel,
    language: detectedLang,
    bcp47: bcp,
    domains: ragResult.domains,
    docCount: ragResult.docCount,
    timings
  };
}

module.exports = {
  transcribeAudio,
  synthesizeSpeech,
  handleCallTurn,
  toBCP47,
  STT_MODEL,
  TTS_MODEL
};

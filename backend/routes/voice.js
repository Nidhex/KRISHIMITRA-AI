/* ==========================================================================
   KrishiMitra AI — Voice Call Routes
   Base Path: /api/voice
   ========================================================================== */

'use strict';

const express = require('express');
const router  = express.Router();
const multer  = require('multer');

const { logger } = require('../middleware/logger');
const voiceService = require('../services/sarvamVoiceService');

// Configure Multer for in-memory audio buffering (up to 25MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

/**
 * POST /api/voice/call-turn
 * Primary endpoint for full in-browser voice conversation turn.
 * Accepts multipart/form-data with `file`, `language`, `history`, `farmerContext`.
 */
router.post('/call-turn', upload.single('file'), async (req, res, next) => {
  const reqStart = Date.now();

  try {
    let audioBuffer = null;
    let mimeType = 'audio/webm';

    // 1. Extract audio from multipart file or base64 JSON
    if (req.file && req.file.buffer) {
      audioBuffer = req.file.buffer;
      mimeType = req.file.mimetype || 'audio/webm';
    } else if (req.body.audioBase64) {
      audioBuffer = Buffer.from(req.body.audioBase64, 'base64');
      mimeType = req.body.mimeType || 'audio/webm';
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Audio file or audioBase64 payload is required.',
        userError: 'Could not record your voice. Please try speaking again.',
        errorCode: 'MISSING_AUDIO'
      });
    }

    // 2. Parse accompanying metadata
    const language = req.body.language || 'en';
    const browserTranscript = (req.body.browserTranscript || req.body.transcript || '').trim();
    let history = [];
    if (req.body.history) {
      try {
        history = typeof req.body.history === 'string' ? JSON.parse(req.body.history) : req.body.history;
      } catch (_) {
        history = [];
      }
    }

    let farmerContext = null;
    if (req.body.farmerContext) {
      try {
        farmerContext = typeof req.body.farmerContext === 'string' ? JSON.parse(req.body.farmerContext) : req.body.farmerContext;
      } catch (_) {
        farmerContext = null;
      }
    }

    // 3. Process complete voice call turn
    logger.info(`[VOICE] Received audio request (${audioBuffer.length} bytes, type: ${mimeType}, lang: ${language}, browserTranscript: "${browserTranscript.substring(0, 40)}")`);

    const result = await voiceService.handleCallTurn({
      audioBuffer,
      mimeType,
      language,
      history,
      farmerContext,
      browserTranscript
    });

    if (!result.success) {
      return res.status(result.errorCode === 'NO_SPEECH_DETECTED' ? 200 : (result.statusCode || 503)).json(result);
    }

    return res.json(result);

  } catch (err) {
    logger.error('[VOICE] Unhandled call-turn error:', { message: err.message });
    return res.status(500).json({
      success: false,
      error: err.message,
      userError: 'Voice processing encountered an issue. Please speak again.',
      errorCode: 'VOICE_SERVER_ERROR'
    });
  }
});

/**
 * POST /api/voice/transcribe
 * Standalone Speech-to-Text endpoint.
 */
router.post('/transcribe', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, error: 'Audio file is required.' });
    }

    const language = req.body.language || req.body.language_code || '';
    const stt = await voiceService.transcribeAudio(req.file.buffer, req.file.mimetype, language);

    return res.json({
      success: true,
      transcript: stt.transcript,
      languageCode: stt.languageCode,
      durationMs: stt.durationMs
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/voice/synthesize
 * Standalone Text-to-Speech endpoint.
 */
router.post('/synthesize', async (req, res, next) => {
  try {
    const { text, language_code = 'en-IN', speaker = 'shubh', pace = 0.95 } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text is required.' });
    }

    const tts = await voiceService.synthesizeSpeech(text, language_code, speaker, pace);

    return res.json({
      success: true,
      audioBase64: tts.audioBase64,
      format: tts.format,
      durationMs: tts.durationMs
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

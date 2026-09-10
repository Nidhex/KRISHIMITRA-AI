const express = require('express');
const router  = express.Router();
const https   = require('https');
const { logger } = require('../middleware/logger');
const ollama  = require('../services/ollamaService');
const rag     = require('../services/ragService');
const textExtractor = require('../services/textExtractionService');

// POST /api/gemini/generateContent
router.post('/generateContent', async (req, res, next) => {
  try {
    const { model = 'gemini-3.5-flash', contents, tools } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.warn('[LLM] Gemini unavailable: GEMINI_API_KEY is missing. Triggering LLM fallback.');
      return await handleLLMFallback(contents, res);
    }
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const requestData = JSON.stringify({ contents, tools });
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      },
      timeout: 30000 // 30s timeout
    };
    
    let fallbackTriggered = false;
    const triggerFallback = async (reason) => {
      if (fallbackTriggered || res.headersSent) return;
      fallbackTriggered = true;
      logger.warn(`[LLM] Gemini unavailable. Reason: ${reason}`);
      await handleLLMFallback(contents, res);
    };

    const proxyReq = https.request(options, (proxyRes) => {
      let responseBody = '';
      
      proxyRes.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      proxyRes.on('end', async () => {
        const statusCode = proxyRes.statusCode;
        if (statusCode !== 200) {
          logger.error(`[GEMINI PROXY] Gemini API returned error status ${statusCode}.`);
          return await triggerFallback(`non-200 status code ${statusCode}`);
        }
        
        try {
          const parsed = JSON.parse(responseBody);
          if (!res.headersSent) {
            res.status(statusCode).json(parsed);
          }
        } catch (e) {
          logger.error('[GEMINI PROXY] Failed to parse Gemini response JSON.');
          return await triggerFallback('JSON parse failure');
        }
      });
    });
    
    proxyReq.on('error', async (err) => {
      logger.error('[GEMINI PROXY] Request to Gemini API failed:', err.message);
      return await triggerFallback(`connection error: ${err.message}`);
    });
    
    proxyReq.on('timeout', async () => {
      proxyReq.destroy();
      logger.error('[GEMINI PROXY] Gemini API request timed out.');
      return await triggerFallback('timeout');
    });
    
    proxyReq.write(requestData);
    proxyReq.end();
    
  } catch (err) {
    next(err);
  }
});

// Environment-aware fallback handler (Ollama in Dev, Local RAG in Prod/Fallback)
async function handleLLMFallback(contents, res) {
  try {
    let promptText = '';
    if (contents && contents[0] && contents[0].parts && contents[0].parts[0]) {
      promptText = contents[0].parts[0].text;
    }
    
    if (!promptText) {
      return res.status(400).json({
        error: { message: "No prompt text found for fallback", code: "INVALID_PROMPT" }
      });
    }

    const isProduction = process.env.NODE_ENV === 'production';

    // 1. In Production: Skip Ollama completely and use local RAG
    if (isProduction) {
      logger.info('[LLM] Production mode: skipping Ollama');
      logger.info('[LLM] Falling back to local RAG');

      const ragResult = await rag.retrieveContext(promptText);
      if (ragResult) {
        const cleanAnswer = textExtractor.buildFarmerFacingRAGAnswer(ragResult, ragResult.detectedLanguage);
        const geminiFormatResponse = {
          candidates: [
            {
              content: {
                parts: [{ text: cleanAnswer }],
                role: "model"
              },
              finishReason: "STOP",
              index: 0
            }
          ],
          usageMetadata: {
            promptTokenCount: 0,
            candidatesTokenCount: 0,
            totalTokenCount: 0
          },
          modelVersion: "krishi_rag"
        };
        return res.json(geminiFormatResponse);
      }

      return res.status(503).json({
        error: {
          message: "AI services are currently unavailable. Please try again later.",
          code: "SERVICE_UNAVAILABLE"
        }
      });
    }

    // 2. In Development: Try local Ollama first
    logger.info(`[LLM] Development mode: attempting Ollama fallback for prompt: "${promptText.substring(0, 60)}..."`);
    const ollamaResult = await ollama.askGemma(promptText);
    
    if (ollamaResult.success) {
      const geminiFormatResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: textExtractor.sanitizeAssistantText(ollamaResult.response) }],
              role: "model"
            },
            finishReason: "STOP",
            index: 0
          }
        ],
        usageMetadata: {
          promptTokenCount: 0,
          candidatesTokenCount: 0,
          totalTokenCount: 0
        },
        modelVersion: ollamaResult.model || "gemma3"
      };
      return res.json(geminiFormatResponse);
    }

    // 3. In Development: If Ollama fails, fall back to local RAG
    logger.warn(`[LLM] Ollama unavailable (${ollamaResult.error}). Falling back to local RAG`);
    const ragResult = await rag.retrieveContext(promptText);

    if (ragResult) {
      const cleanAnswer = textExtractor.buildFarmerFacingRAGAnswer(ragResult, ragResult.detectedLanguage);
      const geminiFormatResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: cleanAnswer }],
              role: "model"
            },
            finishReason: "STOP",
            index: 0
          }
        ],
        usageMetadata: {
          promptTokenCount: 0,
          candidatesTokenCount: 0,
          totalTokenCount: 0
        },
        modelVersion: "krishi_rag"
      };
      return res.json(geminiFormatResponse);
    }

    return res.status(503).json({
      error: {
        message: `Both Gemini and Ollama are unavailable: ${ollamaResult.error}`,
        code: "SERVICE_UNAVAILABLE"
      }
    });

  } catch (e) {
    logger.error('[LLM] Unexpected error during fallback:', e.message);
    return res.status(500).json({
      error: { message: "Unexpected error during LLM fallback", code: "INTERNAL_ERROR" }
    });
  }
}

module.exports = router;

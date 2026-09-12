/* ==========================================================================
   KrishiMitra AI — Multilingual Sarvam AI Chat Integration Layer
   
   Seamlessly connects the frontend Voice & Text chat interface to
   Sarvam AI (sarvam-105b) with local Ollama fallback.
   Supports: 11 Indian Languages, Romanized Scripts, Code-mixed Queries,
             Multi-turn Conversation Memory, and Farmer Profile Context.
   ========================================================================== */

(function () {
  'use strict';

  function initGemmaChat() {
    if (window.__krishiGemmaInitialized) return;
    window.__krishiGemmaInitialized = true;

    const cfg = window.KrishiMitraConfig || {
      API_BASE_URL: (typeof window !== 'undefined' && window.location) ? (window.location.origin + '/api') : 'http://localhost:5001/api',
      CHAT_TIMEOUT_MS: 35000,
      CONVERSATION_HISTORY_LIMIT: 6,
      SPEAK_REPLIES: false,
      THINKING_MESSAGE: 'KrishiMitra AI is thinking...',
      ERROR_GENERIC: 'KrishiMitra AI could not respond. Please try again.'
    };

    // ── Conversation history store ─────────────────────────────────────────
    let conversationHistory = [];

    // ── Logging helper ─────────────────────────────────────────────────────
    function logEntry(level, message, data) {
      if (level === 'ERROR') {
        console.error(`[KrishiMitra ${level}]`, message, data || '');
      } else if (level === 'WARN') {
        console.warn(`[KrishiMitra ${level}]`, message, data || '');
      } else {
        console.log(`[KrishiMitra ${level}]`, message, data || '');
      }
    }

    // ── Helper: Extract Current Farmer Context from App ────────────────────
    function getFarmerContext() {
      try {
        const farmerNameEl = typeof document !== 'undefined' ? document.querySelector('.farmer-name') : null;
        const farmerVillageEl = typeof document !== 'undefined' ? document.querySelector('.farmer-village') : null;

        return {
          name: farmerNameEl ? farmerNameEl.innerText.trim() : 'Ramesh Prasad',
          location: farmerVillageEl ? farmerVillageEl.innerText.trim() : 'Kishanpur, UP',
          landSize: '4 Acres',
          soilType: 'Clay Loam (दोमट मिट्टी)',
          primaryCrop: 'Paddy / Wheat (धान / गेहूं)',
          currentLanguage: (typeof window !== 'undefined' && window.appState && window.appState.currentLanguage) || 'en'
        };
      } catch (_) {
        return null;
      }
    }

    // ── Helper: Format AI markdown text for clean HTML rendering ───────────
    function formatMessageText(rawText) {
      if (!rawText) return '';
      let formatted = rawText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Bold **text** -> <strong>text</strong>
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic *text* -> <em>$1</em>
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

      // Bullet lines starting with - or * -> <li> style
      const lines = formatted.split('\n');
      const processedLines = [];
      let inList = false;

      for (const line of lines) {
        const trimmed = line.trim();
        if (/^[-*•]\s+/.test(trimmed)) {
          if (!inList) {
            processedLines.push('<ul style="margin:6px 0;padding-left:20px;">');
            inList = true;
          }
          processedLines.push(`<li>${trimmed.replace(/^[-*•]\s+/, '')}</li>`);
        } else if (/^\d+\.\s+/.test(trimmed)) {
          if (!inList) {
            processedLines.push('<ol style="margin:6px 0;padding-left:20px;">');
            inList = true;
          }
          processedLines.push(`<li>${trimmed.replace(/^\d+\.\s+/, '')}</li>`);
        } else {
          if (inList) {
            processedLines.push('</ul>');
            inList = false;
          }
          if (trimmed.length > 0) {
            processedLines.push(`<p style="margin:4px 0;">${trimmed}</p>`);
          }
        }
      }

      if (inList) processedLines.push('</ul>');
      return processedLines.join('');
    }

    // ── UI helpers ─────────────────────────────────────────────────────────
    function setThinkingBubble(show) {
      if (typeof document === 'undefined') return null;
      const THINKING_ID = 'km-thinking-bubble';
      let existing = document.getElementById(THINKING_ID);

      if (!show) {
        if (existing) existing.remove();
        return null;
      }

      if (existing) return existing;

      const box = document.getElementById('chat-messages-box');
      if (!box) return null;

      const bubble = document.createElement('div');
      bubble.id = THINKING_ID;
      bubble.className = 'chat-bubble bot-message km-thinking';
      bubble.innerHTML = `
        <p style="display:flex;align-items:center;gap:8px;margin:0;">
          <span class="km-dots">
            <span></span><span></span><span></span>
          </span>
          <span style="font-weight:500;color:#2e7d32;">KrishiMitra AI is analyzing...</span>
        </p>
      `;
      box.appendChild(bubble);
      box.scrollTop = box.scrollHeight;
      return bubble;
    }

    function showErrorBubble(message) {
      if (typeof document === 'undefined') return;
      const box = document.getElementById('chat-messages-box');
      if (!box) return;
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble bot-message km-error-bubble';
      const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      bubble.innerHTML = `
        <p style="color:#c0392b;margin:0 0 4px 0;">⚠️ ${message}</p>
        <span class="chat-time">${time}</span>
      `;
      box.appendChild(bubble);
      box.scrollTop = box.scrollHeight;
    }

    function setInputsDisabled(disabled) {
      if (typeof document === 'undefined') return;
      const micBtn = document.getElementById('btn-microphone');
      const sendBtn = document.getElementById('km-chat-send-btn');
      const textInp = document.getElementById('km-chat-input');

      if (micBtn) {
        micBtn.disabled = disabled;
        micBtn.style.opacity = disabled ? '0.5' : '1';
        micBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
      }
      if (sendBtn) {
        sendBtn.disabled = disabled;
        sendBtn.style.opacity = disabled ? '0.5' : '1';
        sendBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
      }
      if (textInp) {
        textInp.disabled = disabled;
      }
    }

    // ── Inject Thinking Styles ─────────────────────────────────────────────
    if (typeof document !== 'undefined' && !document.getElementById('km-thinking-styles')) {
      const style = document.createElement('style');
      style.id = 'km-thinking-styles';
      style.textContent = `
        .km-dots { display:inline-flex; gap:4px; align-items:center; }
        .km-dots span {
          display:inline-block; width:7px; height:7px;
          border-radius:50%; background:#4caf50; opacity:0.4;
          animation: km-bounce 1.2s infinite;
        }
        .km-dots span:nth-child(2) { animation-delay:.2s; }
        .km-dots span:nth-child(3) { animation-delay:.4s; }
        @keyframes km-bounce {
          0%,80%,100% { transform:scale(0.6); opacity:0.4; }
          40%          { transform:scale(1);   opacity:1;   }
        }
        .chat-provider-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 600;
          color: #2e7d32;
          background: #e8f5e9;
          padding: 2px 6px;
          border-radius: 8px;
          margin-top: 4px;
        }
      `;
      document.head.appendChild(style);
    }

    // ── Fetch with Timeout ─────────────────────────────────────────────────
    async function fetchWithTimeout(url, options, timeoutMs) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetch(url, { ...options, signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }
    }

    // ── Local Offline Knowledge & RAG Fallback ──────────────────────────────
    function queryOfflineKnowledge(questionText, options = {}) {
      const voiceLangSelect = typeof document !== 'undefined' ? document.getElementById('voice-lang-select') : null;
      const selectedLang = options.language || (voiceLangSelect ? voiceLangSelect.value.split('-')[0] : 'en');
      const farmerCtx = options.farmerContext || getFarmerContext();

      const ragEngine = (typeof window !== 'undefined' && window.KrishiOfflineRAG) ||
                        (typeof require === 'function' ? (function() { try { return require('./offlineRAG.js'); } catch(_) { return null; } })() : null);

      if (ragEngine && typeof ragEngine.answerQuestion === 'function') {
        const ragRes = ragEngine.answerQuestion(questionText, {
          language: selectedLang,
          farmerContext: farmerCtx
        });

        return {
          reply: ragRes.reply,
          source: 'offline_knowledge',
          model: 'local-rag',
          language: ragRes.language || selectedLang,
          docCount: ragRes.docCount,
          domains: ragRes.domains
        };
      }

      // Fallback if KrishiOfflineRAG script isn't loaded
      return {
        reply: "📴 **Offline AI — Answer from KrishiMitra's local agricultural knowledge**\n\nI am currently offline. Please connect to the internet to access live AI assistant.",
        source: 'offline_knowledge',
        model: 'local-kb',
        language: selectedLang
      };
    }

    // ── Core: Send Question to Backend Chat API (with Offline Bypass & Fallback) ──
    async function askKrishiMitraBackend(questionText, language) {
      const voiceLangSelect = typeof document !== 'undefined' ? document.getElementById('voice-lang-select') : null;
      const selectedLang = language || (voiceLangSelect ? voiceLangSelect.value.split('-')[0] : 'en');
      const farmerCtx = getFarmerContext();

      // Step 1: Check if browser is strictly offline
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        logEntry('INFO', '[CHAT] Device is offline (navigator.onLine === false). Bypassing backend /api/chat call completely.');
        return queryOfflineKnowledge(questionText, { language: selectedLang, farmerContext: farmerCtx });
      }

      const apiBase = cfg.API_BASE_URL || ((typeof window !== 'undefined' && window.location) ? (window.location.origin + '/api') : 'http://localhost:5001/api');
      const payload = {
        message: questionText,
        language: selectedLang,
        history: conversationHistory.slice(-cfg.CONVERSATION_HISTORY_LIMIT * 2),
        farmerContext: farmerCtx
      };

      const startTime = Date.now();
      logEntry('INFO', `Sending question to KrishiMitra backend: "${questionText.substring(0, 60)}"`, {
        language: selectedLang,
        historyLength: payload.history.length
      });

      let res;
      try {
        res = await fetchWithTimeout(
          `${apiBase}/chat`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          },
          cfg.CHAT_TIMEOUT_MS || 35000
        );
      } catch (fetchErr) {
        logEntry('WARN', 'Backend fetch failed or network unreachable, falling back to local offline RAG:', { error: fetchErr.message });
        return queryOfflineKnowledge(questionText, { language: selectedLang, farmerContext: farmerCtx });
      }

      const inferenceMs = Date.now() - startTime;
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        logEntry('WARN', 'Backend returned non-JSON response, falling back to local offline RAG:', parseErr.message);
        return queryOfflineKnowledge(questionText, { language: selectedLang, farmerContext: farmerCtx });
      }

      if (!res.ok || !data.success) {
        logEntry('WARN', 'Backend returned error status, falling back to local offline RAG:', { data, inferenceMs });
        return queryOfflineKnowledge(questionText, { language: selectedLang, farmerContext: farmerCtx });
      }

      logEntry('INFO', `KrishiMitra replied in ${data.inferenceMs || inferenceMs}ms via ${data.source} (${data.model})`, {
        language: data.language,
        domains: data.domains,
        docCount: data.docCount
      });

      return {
        reply: data.reply,
        source: data.source,
        model: data.model,
        language: data.language
      };
    }

    // ── Function to Add Chat Message with Markdown Formatting ──────────────
    function appendChatMessage(content, typeClass, meta = null) {
      if (typeof document === 'undefined') return;
      const box = document.getElementById('chat-messages-box');
      if (!box) return;

      const bubble = document.createElement('div');
      bubble.className = `chat-bubble ${typeClass}`;
      const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      if (typeClass.includes('bot-message')) {
        const htmlBody = formatMessageText(content);
        let badgeHtml = '';
        if (meta) {
          if (meta.source === 'sarvam') {
            badgeHtml = `<span class="chat-provider-badge">🌾 Sarvam AI (${meta.model || 'sarvam-105b'})</span>`;
          } else if (meta.source === 'gemini') {
            badgeHtml = `<span class="chat-provider-badge">✨ Gemini (${meta.model || 'gemini-3.5-flash'})</span>`;
          } else if (meta.source === 'offline_knowledge' || meta.source === 'offline_cache' || meta.source === 'offline_notice') {
            badgeHtml = `<span class="chat-provider-badge" style="background:#fff3e0;color:#e65100;">📴 Offline AI (Local Knowledge)</span>`;
          } else if (meta.source === 'rag_direct') {
            badgeHtml = `<span class="chat-provider-badge">📚 Krishi RAG</span>`;
          }
        }
        bubble.innerHTML = `
          <div>${htmlBody}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px;">
            ${badgeHtml}
            <span class="chat-time">${time}</span>
          </div>
        `;
      } else {
        bubble.innerHTML = `
          <p style="margin:0;">${content}</p>
          <span class="chat-time">${time}</span>
        `;
      }

      box.appendChild(bubble);
      box.scrollTop = box.scrollHeight;
    }

    // ── Clear Chat History Function ────────────────────────────────────────
    window.clearKrishiChat = function () {
      conversationHistory = [];
      if (typeof document !== 'undefined') {
        const box = document.getElementById('chat-messages-box');
        if (box) {
          box.innerHTML = `
            <div class="chat-bubble bot-message">
              <p>Namaste! I am your KrishiMitra assistant. How can I help you with your crops, weather, diseases, or market prices today?</p>
              <span class="chat-time">${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          `;
        }
      }
      logEntry('INFO', 'Conversation memory cleared.');
    };

    // ── Intercept and Patch handleFarmerVoiceQuestion ──────────────────────
    window.handleFarmerVoiceQuestion = async function (questionText) {
      if (!questionText || !questionText.trim()) return;

      const cleanQuestion = questionText.trim();

      // 1. Show user message bubble
      appendChatMessage(cleanQuestion, 'user-message');

      if (typeof window.playSound === 'function') {
        window.playSound('snd-chime');
      }

      // 2. Disable inputs & show thinking bubble
      setInputsDisabled(true);
      setThinkingBubble(true);

      try {
        // 3. Call backend API
        const result = await askKrishiMitraBackend(cleanQuestion);

        // 4. Remove thinking bubble
        setThinkingBubble(false);

        // 5. Update conversation memory
        conversationHistory.push({ role: 'user', content: cleanQuestion });
        conversationHistory.push({ role: 'assistant', content: result.reply });
        while (conversationHistory.length > cfg.CONVERSATION_HISTORY_LIMIT * 2) {
          conversationHistory.shift();
        }

        // 6. Display response bubble with formatting
        appendChatMessage(result.reply, 'bot-message', {
          source: result.source,
          model: result.model
        });

        if (typeof window.playSound === 'function') {
          window.playSound('snd-success');
        }

        // 7. Text-to-Speech (optional)
        if (cfg.SPEAK_REPLIES && typeof window.speakAloud === 'function') {
          window.speakAloud(result.reply);
        }

        return result;

      } catch (err) {
        setThinkingBubble(false);
        const userMessage = err.message || cfg.ERROR_GENERIC;
        logEntry('ERROR', 'Chat error:', { error: userMessage });
        showErrorBubble(userMessage);
      } finally {
        setInputsDisabled(false);
        if (typeof document !== 'undefined') {
          const inp = document.getElementById('km-chat-input');
          if (inp) inp.focus();
        }
      }
    };

    // ── Expose Global Reference ────────────────────────────────────────────
    window.KrishiMitraGemma = {
      ask: askKrishiMitraBackend,
      queryOffline: queryOfflineKnowledge,
      history: conversationHistory,
      log: logEntry,
      clear: window.clearKrishiChat
    };

    logEntry('INFO', 'KrishiMitra Multilingual Sarvam AI Chat ready.');
  }

  // Execute initialization immediately or on DOM ready
  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGemmaChat);
    window.addEventListener('load', initGemmaChat);
  } else {
    initGemmaChat();
  }
})();


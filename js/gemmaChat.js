/* ==========================================================================
   KrishiMitra AI — Multilingual Sarvam AI Chat Integration Layer
   
   Seamlessly connects the frontend Voice & Text chat interface to
   Sarvam AI (sarvam-105b) with local Ollama fallback.
   Supports: 11 Indian Languages, Romanized Scripts, Code-mixed Queries,
             Multi-turn Conversation Memory, and Farmer Profile Context.
   ========================================================================== */

(function () {
  'use strict';

  // ── Wait for DOM + script.js to finish loading ────────────────────────────
  window.addEventListener('load', function () {
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
        const farmerNameEl = document.querySelector('.farmer-name');
        const farmerVillageEl = document.querySelector('.farmer-village');

        return {
          name: farmerNameEl ? farmerNameEl.innerText.trim() : 'Ramesh Prasad',
          location: farmerVillageEl ? farmerVillageEl.innerText.trim() : 'Kishanpur, UP',
          landSize: '4 Acres',
          soilType: 'Clay Loam (दोमट मिट्टी)',
          primaryCrop: 'Paddy / Wheat (धान / गेहूं)',
          currentLanguage: (window.appState && window.appState.currentLanguage) || 'en'
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
    if (!document.getElementById('km-thinking-styles')) {
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
    function queryOfflineKnowledge(questionText) {
      const q = (questionText || '').toLowerCase();
      
      if (q.includes('weather') || q.includes('temp') || q.includes('rain') || q.includes('मौसम') || q.includes('बारिश')) {
        const cachedWeather = localStorage.getItem('km_weather_cache');
        if (cachedWeather) {
          try {
            const w = JSON.parse(cachedWeather);
            const dateStr = w.timestamp ? new Date(w.timestamp).toLocaleString('en-IN') : 'Recent';
            return {
              reply: `⚡ **Offline Mode — Last Cached Weather**\n\n- **Location**: ${w.locationName || 'Gorakhpur, UP'}\n- **Temperature**: ${w.data?.current?.temp || 28}°C (${w.data?.current?.conditionText || 'Partly Cloudy'})\n- **Humidity**: ${w.data?.current?.humidity || 65}%\n- **Last Updated**: ${dateStr}\n\n*(Connect to internet for live weather updates.)*`,
              source: 'offline_cache',
              model: 'local-kb'
            };
          } catch (e) {}
        }
        return {
          reply: "🌐 **Live Weather Requires Internet**\n\nLive weather forecasts require an active internet connection. Please connect to internet to fetch live Open-Meteo weather data.",
          source: 'offline_notice',
          model: 'local-kb'
        };
      }

      if (q.includes('mandi') || q.includes('price') || q.includes('rate') || q.includes('मंडी') || q.includes('भाव') || q.includes('दाम')) {
        return {
          reply: "⚡ **Offline Mode — APMC Mandi Market Prices**\n\n- **Wheat (Gorakhpur APMC)**: ₹2,275 / Qtl (MSP Benchmark)\n- **Paddy (Common)**: ₹2,183 / Qtl\n- **Mustard**: ₹5,650 / Qtl\n\nVisit the **Market** tab to view the complete bundled APMC mandi price list offline.\n*(Live daily prices require internet.)*",
          source: 'offline_cache',
          model: 'local-kb'
        };
      }

      if (q.includes('scheme') || q.includes('yojana') || q.includes('pm kisan') || q.includes('pmfby') || q.includes('योजना')) {
        return {
          reply: "⚡ **Offline Mode — Government Schemes Knowledge Base**\n\nKrishiMitra includes pre-cached guidance for major central and state schemes:\n- **PM-Kisan**: ₹6,000 annual direct benefit transfer\n- **PMFBY**: Comprehensive crop damage insurance\n- **PM-KUSUM**: Solar pump installation subsidy\n\nBrowse the **Schemes** tab for eligibility checkers and application guides offline.",
          source: 'offline_cache',
          model: 'local-kb'
        };
      }

      if (q.includes('blight') || q.includes('rust') || q.includes('rot') || q.includes('disease') || q.includes('jhulsa') || q.includes('रोग') || q.includes('बीमारी')) {
        return {
          reply: "⚡ **Offline Mode — Vision AI Plant Doctor Available**\n\nTo diagnose plant diseases like Early Blight, Late Blight, or Rust, go to the **Vision Lab** tab and take or upload a leaf photo.\n\nOur browser-side TensorFlow.js AI runs **100% offline** with zero internet required!",
          source: 'offline_cache',
          model: 'local-kb'
        };
      }

      return {
        reply: "⚡ **Offline Mode — Local Knowledge Assistant**\n\nI am currently offline. I can assist you with:\n- 🌿 **Vision AI**: Browser-side disease & soil diagnosis (100% offline)\n- 💰 **Mandi Prices**: Bundled APMC market rates\n- 🏛️ **Schemes**: Complete offline government schemes DB\n- 🌦️ **Weather**: Last cached forecast\n\n*Connect to the internet for live AI chat reasoning.*",
        source: 'offline_notice',
        model: 'local-kb'
      };
    }

    // ── Core: Send Question to Backend Chat API ────────────────────────────
    async function askKrishiMitraBackend(questionText, language) {
      const voiceLangSelect = document.getElementById('voice-lang-select');
      const selectedLang = language || (voiceLangSelect ? voiceLangSelect.value.split('-')[0] : 'en');
      const apiBase = cfg.API_BASE_URL || ((typeof window !== 'undefined' && window.location) ? (window.location.origin + '/api') : 'http://localhost:5001/api');

      const payload = {
        message: questionText,
        language: selectedLang,
        history: conversationHistory.slice(-cfg.CONVERSATION_HISTORY_LIMIT * 2),
        farmerContext: getFarmerContext()
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
        logEntry('WARN', 'Backend fetch failed or offline, switching to local offline knowledge:', { error: fetchErr.message });
        return queryOfflineKnowledge(questionText);
      }

      const inferenceMs = Date.now() - startTime;
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error('Received an invalid response from the server.');
      }

      if (!res.ok || !data.success) {
        const userMsg = data.userError || data.error || cfg.ERROR_GENERIC;
        logEntry('WARN', 'Backend returned error status:', { data, inferenceMs });
        throw new Error(userMsg);
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
      const box = document.getElementById('chat-messages-box');
      if (!box) return;

      const bubble = document.createElement('div');
      bubble.className = `chat-bubble ${typeClass}`;
      const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      if (typeClass.includes('bot-message')) {
        const htmlBody = formatMessageText(content);
        let badgeHtml = '';
        if (meta && meta.source === 'sarvam') {
          badgeHtml = `<span class="chat-provider-badge">🌾 Sarvam AI (${meta.model || 'sarvam-105b'})</span>`;
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
      const box = document.getElementById('chat-messages-box');
      if (box) {
        box.innerHTML = `
          <div class="chat-bubble bot-message">
            <p>Namaste! I am your KrishiMitra assistant. How can I help you with your crops, weather, diseases, or market prices today?</p>
            <span class="chat-time">${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        `;
      }
      logEntry('INFO', 'Conversation memory cleared.');
    };

    // ── Intercept and Patch handleFarmerVoiceQuestion ──────────────────────
    if (typeof window.handleFarmerVoiceQuestion === 'function') {
      window.__originalHandleFarmerVoiceQuestion = window.handleFarmerVoiceQuestion;
    }

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

      } catch (err) {
        setThinkingBubble(false);
        const userMessage = err.message || cfg.ERROR_GENERIC;
        logEntry('ERROR', 'Chat error:', { error: userMessage });
        showErrorBubble(userMessage);
      } finally {
        setInputsDisabled(false);
        const inp = document.getElementById('km-chat-input');
        if (inp) inp.focus();
      }
    };

    // ── Expose Global Reference ────────────────────────────────────────────
    window.KrishiMitraGemma = {
      ask: askKrishiMitraBackend,
      history: conversationHistory,
      log: logEntry,
      clear: window.clearKrishiChat
    };

    logEntry('INFO', 'KrishiMitra Multilingual Sarvam AI Chat ready.');
  });
})();

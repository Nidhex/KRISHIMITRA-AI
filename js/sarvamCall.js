/* ==========================================================================
   KrishiMitra AI — In-Browser Voice Call Controller (Call Sarvam AI)
   
   Full duplex conversational voice assistant for farmers.
   Pipeline:
     Microphone ➔ Browser MediaRecorder ➔ /api/voice/call-turn
     ➔ Saaras STT ➔ Multilingual RAG ➔ Sarvam-105b ➔ Bulbul TTS
     ➔ Auto-plays response & returns to listening for continuous dialogue.
   ========================================================================== */

(function () {
  'use strict';

  // ── Call States ────────────────────────────────────────────────────────────
  const CallState = {
    IDLE: 'IDLE',
    CONNECTING: 'CONNECTING',
    LISTENING: 'LISTENING',
    TRANSCRIBING: 'TRANSCRIBING',
    PROCESSING: 'PROCESSING',
    AI_SPEAKING: 'AI_SPEAKING',
    CALL_ENDED: 'CALL_ENDED',
    ERROR: 'ERROR'
  };

  let currentState = CallState.IDLE;
  let mediaStream = null;
  let mediaRecorder = null;
  let audioChunks = [];
  let speechRecognizer = null;
  let liveSpeechTranscript = '';
  let currentAudioPlayer = null;
  let speechTimeout = null;
  let callHistory = [];
  let callTimerInterval = null;
  let callSeconds = 0;

  // ── Determine Dynamic API Base URL ─────────────────────────────────────────
  function getApiBaseUrl() {
    if (typeof window !== 'undefined' && window.location) {
      const port = window.location.port;
      if (port === '5001' || port === '5000') {
        return window.location.origin + '/api/voice';
      }
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5001/api/voice';
      }
      return window.location.origin + '/api/voice';
    }
    return 'http://localhost:5001/api/voice';
  }

  // ── UI Element Selectors ───────────────────────────────────────────────────
  function getElements() {
    return {
      modal: document.getElementById('sarvam-call-modal'),
      statusText: document.getElementById('call-status-text'),
      subStatusText: document.getElementById('call-substatus-text'),
      avatar: document.getElementById('call-avatar-container'),
      micWave: document.getElementById('call-mic-waves'),
      speakerWave: document.getElementById('call-speaker-waves'),
      timerText: document.getElementById('call-timer'),
      transcriptBox: document.getElementById('call-transcript-box'),
      transcriptFeed: document.getElementById('call-transcript-feed'),
      btnEndCall: document.getElementById('btn-end-call'),
      btnPushSpeak: document.getElementById('btn-push-speak'),
      langSelect: document.getElementById('call-lang-select'),
      callErrorBox: document.getElementById('call-error-banner')
    };
  }

  // ── State Updater ──────────────────────────────────────────────────────────
  function setState(state, message = '', submessage = '') {
    currentState = state;
    const els = getElements();
    if (!els.modal) return;

    // Reset animations
    if (els.micWave) els.micWave.classList.add('hidden');
    if (els.speakerWave) els.speakerWave.classList.add('hidden');
    if (els.avatar) els.avatar.className = 'call-avatar-container';
    if (els.btnPushSpeak) els.btnPushSpeak.disabled = false;
    if (els.callErrorBox && state !== CallState.ERROR) els.callErrorBox.classList.add('hidden');

    switch (state) {
      case CallState.IDLE:
        els.modal.classList.add('hidden');
        stopCallTimer();
        break;

      case CallState.CONNECTING:
        els.modal.classList.remove('hidden');
        els.statusText.innerText = message || 'Connecting to KrishiMitra AI...';
        els.subStatusText.innerText = submessage || 'Setting up secure voice line';
        els.avatar.classList.add('pulse-connecting');
        if (els.btnPushSpeak) els.btnPushSpeak.disabled = true;
        break;

      case CallState.LISTENING:
        els.modal.classList.remove('hidden');
        els.statusText.innerText = message || '🎙️ Listening... Speak now';
        els.subStatusText.innerText = submessage || 'Say your question in your native language';
        if (els.micWave) els.micWave.classList.remove('hidden');
        els.avatar.classList.add('pulse-listening');
        if (els.btnPushSpeak) {
          els.btnPushSpeak.innerHTML = '<span>⏹️</span> <span>Done Speaking</span>';
          els.btnPushSpeak.classList.add('recording');
          els.btnPushSpeak.disabled = false;
        }
        break;

      case CallState.TRANSCRIBING:
        els.modal.classList.remove('hidden');
        els.statusText.innerText = message || '⏳ Transcribing speech...';
        els.subStatusText.innerText = submessage || 'Converting voice to text via Sarvam Saaras';
        els.avatar.classList.add('pulse-processing');
        if (els.btnPushSpeak) {
          els.btnPushSpeak.innerHTML = '<span>⏳</span> <span>Transcribing...</span>';
          els.btnPushSpeak.disabled = true;
          els.btnPushSpeak.classList.remove('recording');
        }
        break;

      case CallState.PROCESSING:
        els.modal.classList.remove('hidden');
        els.statusText.innerText = message || '🤖 KrishiMitra is thinking...';
        els.subStatusText.innerText = submessage || 'Checking agricultural knowledge base';
        els.avatar.classList.add('pulse-processing');
        if (els.btnPushSpeak) {
          els.btnPushSpeak.innerHTML = '<span>⏳</span> <span>Thinking...</span>';
          els.btnPushSpeak.disabled = true;
          els.btnPushSpeak.classList.remove('recording');
        }
        break;

      case CallState.AI_SPEAKING:
        els.modal.classList.remove('hidden');
        els.statusText.innerText = message || '🔊 KrishiMitra AI is Speaking...';
        els.subStatusText.innerText = submessage || 'Listen to the agricultural advice';
        if (els.speakerWave) els.speakerWave.classList.remove('hidden');
        els.avatar.classList.add('pulse-speaking');
        if (els.btnPushSpeak) {
          els.btnPushSpeak.innerHTML = '<span>🔇</span> <span>Stop / Speak</span>';
          els.btnPushSpeak.disabled = false;
          els.btnPushSpeak.classList.remove('recording');
        }
        break;

      case CallState.CALL_ENDED:
        els.statusText.innerText = message || '🔴 Call Ended';
        els.subStatusText.innerText = submessage || 'Thank you for consulting KrishiMitra AI';
        stopCallTimer();
        setTimeout(() => {
          if (currentState === CallState.CALL_ENDED) {
            setState(CallState.IDLE);
          }
        }, 1800);
        break;

      case CallState.ERROR:
        els.statusText.innerText = '⚠️ Voice Call Alert';
        els.subStatusText.innerText = message || 'An issue occurred during voice processing.';
        if (els.callErrorBox) {
          els.callErrorBox.innerHTML = `<div>${message}</div>`;
          els.callErrorBox.classList.remove('hidden');
        }
        if (els.btnPushSpeak) {
          els.btnPushSpeak.innerHTML = '<span>🔄</span> <span>Tap to Try Speaking</span>';
          els.btnPushSpeak.disabled = false;
          els.btnPushSpeak.classList.remove('recording');
        }
        break;
    }
  }

  // ── Call Timer ─────────────────────────────────────────────────────────────
  function startCallTimer() {
    callSeconds = 0;
    const els = getElements();
    if (els.timerText) els.timerText.innerText = '00:00';
    clearInterval(callTimerInterval);
    callTimerInterval = setInterval(() => {
      callSeconds++;
      const mins = String(Math.floor(callSeconds / 60)).padStart(2, '0');
      const secs = String(callSeconds % 60).padStart(2, '0');
      if (els.timerText) els.timerText.innerText = `${mins}:${secs}`;
    }, 1000);
  }

  function stopCallTimer() {
    clearInterval(callTimerInterval);
    callSeconds = 0;
  }

  // ── Live Subtitle / Transcript Feed ────────────────────────────────────────
  function appendCallTranscript(speaker, text) {
    const els = getElements();
    if (!els.transcriptFeed || !text) return;

    const row = document.createElement('div');
    row.className = `call-transcript-row ${speaker === 'farmer' ? 'farmer-row' : 'ai-row'}`;

    const badge = speaker === 'farmer' ? '👨‍🌾 You' : '🌱 KrishiMitra AI';
    row.innerHTML = `
      <div class="transcript-speaker">${badge}</div>
      <div class="transcript-bubble">${text}</div>
    `;

    els.transcriptFeed.appendChild(row);
    if (els.transcriptBox) {
      els.transcriptBox.scrollTop = els.transcriptBox.scrollHeight;
    }
  }

  // ── Extract Current Farmer Profile Context ────────────────────────────────
  function getFarmerProfileContext() {
    try {
      const nameEl = document.querySelector('.farmer-name');
      const villageEl = document.querySelector('.farmer-village');
      return {
        name: nameEl ? nameEl.innerText.trim() : 'Ramesh Prasad',
        location: villageEl ? villageEl.innerText.trim() : 'Kishanpur, UP',
        landSize: '4 Acres',
        soilType: 'Clay Loam (दोमट)',
        crops: 'Paddy / Wheat (धान / गेहूं)'
      };
    } catch (_) {
      return null;
    }
  }

  // ── Web Speech API Recognition (Parallel Live Transcriber & STT Fallback) ──
  function setupSpeechRecognition(langCode) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    try {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = langCode || 'en-IN';

      recognizer.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (final) {
          liveSpeechTranscript = (liveSpeechTranscript + ' ' + final).trim();
        } else if (interim) {
          liveSpeechTranscript = interim.trim();
        }
      };

      recognizer.onerror = (e) => {
        // Non-blocking warning for speech recognition
        console.warn('[VOICE] SpeechRecognition notice:', e.error);
      };

      return recognizer;
    } catch (_) {
      return null;
    }
  }

  // ── Audio Recording Management ─────────────────────────────────────────────
  async function startRecordingTurn() {
    if (currentState === CallState.CALL_ENDED || currentState === CallState.IDLE) return;

    try {
      // 1. Ensure active mediaStream
      if (!mediaStream || !mediaStream.active || mediaStream.getAudioTracks().every(t => t.readyState === 'ended')) {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        console.log('[VOICE] Microphone permission granted');
      }

      audioChunks = [];
      liveSpeechTranscript = '';

      const els = getElements();
      const selectedLang = els.langSelect ? els.langSelect.value : 'en-IN';

      // 2. Start Web Speech Recognition as hybrid live fallback
      if (speechRecognizer) {
        try { speechRecognizer.abort(); } catch (_) {}
        speechRecognizer = null;
      }
      speechRecognizer = setupSpeechRecognition(selectedLang);
      if (speechRecognizer) {
        try {
          speechRecognizer.start();
        } catch (_) {}
      }

      // 3. Determine supported MediaRecorder mimeType
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/wav')) {
          mimeType = 'audio/wav';
        }
      }

      mediaRecorder = new MediaRecorder(mediaStream, { mimeType });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('[VOICE] Recording stopped');
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        console.log(`[VOICE] Audio blob created (${audioBlob.size} bytes, type: ${mimeType})`);

        if (currentState === CallState.PROCESSING) {
          processAudioTurn(audioBlob, mimeType, liveSpeechTranscript);
        } else if (currentState === CallState.LISTENING) {
          // If stopped without processing, check if we should process
          if (audioBlob.size > 200 || (liveSpeechTranscript && liveSpeechTranscript.trim().length > 0)) {
            setState(CallState.PROCESSING);
            processAudioTurn(audioBlob, mimeType, liveSpeechTranscript);
          }
        }
      };

      mediaRecorder.start(250); // Slice audio in 250ms chunks
      console.log('[VOICE] Recording started');
      setState(CallState.LISTENING);

    } catch (err) {
      console.error('[VOICE] Microphone error:', err);
      let errMsg = 'Microphone permission was denied. Please allow microphone access in your browser settings.';
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'No microphone device found on your device.';
      }
      setState(CallState.ERROR, errMsg);
    }
  }

  function stopRecordingTurn() {
    if (speechRecognizer) {
      try { speechRecognizer.stop(); } catch (_) {}
    }

    if (mediaRecorder && (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused')) {
      try {
        if (typeof mediaRecorder.requestData === 'function') {
          mediaRecorder.requestData();
        }
      } catch (_) {}
      mediaRecorder.stop();
    } else {
      // If recorder was not active, process with any live transcript available
      if (currentState === CallState.PROCESSING) {
        const dummyBlob = new Blob(audioChunks, { type: 'audio/webm' });
        processAudioTurn(dummyBlob, 'audio/webm', liveSpeechTranscript);
      }
    }
  }

  // ── Send Recorded Audio to Backend Voice Call Pipeline ────────────────────
  async function processAudioTurn(audioBlob, mimeType, fallbackTranscript = '') {
    if (currentState === CallState.CALL_ENDED || currentState === CallState.IDLE) return;

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setState(CallState.ERROR, 'Voice AI requires an internet connection. You can use Offline AI text chat.');
      return;
    }

    setState(CallState.TRANSCRIBING);

    const els = getElements();
    const selectedLang = els.langSelect ? els.langSelect.value : 'auto';

    console.log('[VOICE] Sending audio to backend for processing (lang:', selectedLang, ')');

    const formData = new FormData();
    if (audioBlob && audioBlob.size > 0) {
      formData.append('file', audioBlob, 'turn_audio.webm');
    }
    formData.append('mimeType', mimeType || 'audio/webm');
    formData.append('language', selectedLang);
    formData.append('browserTranscript', (fallbackTranscript || '').trim());
    formData.append('history', JSON.stringify(callHistory.slice(-6)));
    formData.append('farmerContext', JSON.stringify(getFarmerProfileContext()));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 40000);

      setState(CallState.PROCESSING, '🤖 KrishiMitra is thinking...', 'Checking agricultural knowledge base');

      const apiUrl = `${getApiBaseUrl()}/call-turn`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errorCode === 'NO_SPEECH_DETECTED' || data.errorCode === 'EMPTY_TRANSCRIPT') {
          setState(CallState.LISTENING, '🎙️ Could not hear speech', 'Please speak clearly and click Done Speaking.');
          setTimeout(startRecordingTurn, 1000);
          return;
        }

        throw new Error(data.userError || data.error || 'Failed to process voice response.');
      }

      console.log(`[VOICE] Transcript received: "${data.transcript}"`);
      console.log(`[VOICE] AI response received (${(data.reply || '').length} chars, lang: ${data.language})`);

      const cleanReply = cleanAssistantText(data.reply, data.bcp47 || data.language);

      // 1. Append user transcript to feed
      appendCallTranscript('farmer', data.transcript);

      // 2. Append AI response to feed
      appendCallTranscript('ai', cleanReply);

      // 3. Update conversation memory
      callHistory.push({ role: 'user', content: data.transcript });
      callHistory.push({ role: 'assistant', content: cleanReply });

      // 4. Play spoken audio or present text response
      playAIResponse(cleanReply, data.audioBase64, data.bcp47 || data.language, data.ttsSupported);

    } catch (err) {
      console.error('[VOICE] Error processing turn:', err);
      if (currentState !== CallState.CALL_ENDED) {
        setState(CallState.ERROR, err.message || 'Network issue during voice call. Tap to try again.');
      }
    }
  }

  // ── Helper: Extract & Sanitize Assistant Text (Browser Safety Layer) ─────────
  function cleanAssistantText(raw, languageCode = 'en') {
    if (!raw) return '';
    let str = typeof raw === 'string' ? raw : (raw.reply || raw.text || raw.content || '');

    // Remove internal prompt leak blocks
    str = str.replace(/===\s*FARMER\s+PROFILE\s+CONTEXT\s*===[\s\S]*?(?=\n\n|===\s*|\n[A-Z\u0900-\u0D7F]|$)/gi, '');
    str = str.replace(/Farmer\s+Name:[\s\S]*?(?=\n\n|\n[A-Z\u0900-\u0D7F]|$)/gi, '');
    str = str.replace(/Location:\s*.*$/gm, '');
    str = str.replace(/Land\s+Size:\s*.*$/gm, '');
    str = str.replace(/Soil\s+Type:\s*.*$/gm, '');
    str = str.replace(/===\s*KRISHIMITRA\s+VERIFIED[\s\S]*?===/gi, '');
    str = str.replace(/===\s*RAG\s+CONTEXT\s*===/gi, '');
    str = str.replace(/===\s*SYSTEM\s+PROMPT\s*===/gi, '');
    str = str.replace(/Based\s+on\s+agricultural\s+recommendations\s+for\s+[A-Z]{2,5}:\s*/gi, '');
    str = str.replace(/Based\s+on\s+verified\s+KrishiMitra\s+agricultural\s+knowledge:\s*/gi, '');

    str = str.trim();
    if (!str || /===\s*FARMER\s+PROFILE/i.test(str)) {
      const lang = (languageCode || 'en').split('-')[0];
      const apologies = {
        hi: 'माफ़ कीजिए, अभी मैं इस सवाल का सही जवाब नहीं दे पा रहा हूँ। कृपया थोड़ी देर बाद फिर कोशिश करें।',
        gu: 'માફ કરશો, અત્યારે હું આ સવાલનો યોગ્ય જવાબ આપી શકતો નથી. કૃપા કરીને થોડી વાર પછી પ્રયાસ કરો.',
        mr: 'माफ करा, मी सध्या या प्रश्नाचे योग्य उत्तर देऊ शकत नाही. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.',
        ta: 'மன்னிக்கவும், தற்சமயம் என்னால் சரியான பதிலை வழங்க முடியவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.',
        te: 'క్షమించండి, ప్రస్తుతం నేను ఈ ప్రశ్నకు సరైన సమాధానం ఇవ్వలేకపోతున్నాను. దయచేసి కాసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.',
        en: 'I apologize, I am currently unable to provide an answer. Please try again later.'
      };
      return apologies[lang] || apologies.en;
    }
    return str;
  }

  // ── Play AI Response Audio ─────────────────────────────────────────────────
  function playAIResponse(replyText, audioBase64, languageCode, ttsSupported = true) {
    if (currentState === CallState.CALL_ENDED || currentState === CallState.IDLE) return;

    // If audio is available from Sarvam Bulbul TTS
    if (audioBase64) {
      setState(CallState.AI_SPEAKING);
      console.log('[VOICE] Playing audio response via Sarvam Bulbul TTS');
      try {
        const audioSrc = `data:audio/wav;base64,${audioBase64}`;
        if (currentAudioPlayer) {
          currentAudioPlayer.pause();
          currentAudioPlayer = null;
        }

        currentAudioPlayer = new Audio(audioSrc);
        
        currentAudioPlayer.onended = () => {
          currentAudioPlayer = null;
          if (currentState === CallState.AI_SPEAKING) {
            console.log('[VOICE] Returning to listening');
            setTimeout(startRecordingTurn, 500);
          }
        };

        currentAudioPlayer.onerror = (e) => {
          console.warn('[VOICE] Audio playback error, using Web Speech synthesis:', e);
          fallbackWebSpeech(replyText, languageCode);
        };

        const playPromise = currentAudioPlayer.play();
        if (playPromise !== undefined) {
          playPromise.catch(playErr => {
            console.warn('[VOICE] Playback prevented by browser policy, falling back to speech synthesis:', playErr);
            fallbackWebSpeech(replyText, languageCode);
          });
        }
        return;
      } catch (e) {
        console.warn('[VOICE] Exception in audio player, falling back to speech synthesis:', e);
      }
    }

    // If language is not supported by Bulbul TTS (e.g. Assamese, Urdu, Sanskrit, etc.)
    if (ttsSupported === false) {
      console.log(`[VOICE] Voice playback unavailable for ${languageCode}. Displaying text answer.`);
      const els = getElements();
      if (els.statusText) els.statusText.innerText = '📝 Text Response Generated';
      if (els.subStatusText) els.subStatusText.innerText = 'Voice playback is unavailable for this language. Text response updated.';

      // Allow 4 seconds for user to read text before resuming listening
      speechTimeout = setTimeout(() => {
        if (currentState !== CallState.CALL_ENDED) {
          startRecordingTurn();
        }
      }, 4000);
      return;
    }

    // Fallback: Browser Web Speech API
    fallbackWebSpeech(replyText, languageCode);
  }
  }

  // ── Fallback Browser Speech Synthesis ──────────────────────────────────────
  function fallbackWebSpeech(text, languageCode) {
    if (clearTimeout) clearTimeout(speechTimeout);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      // Clean text of markdown formatting
      const clean = text
        .replace(/[*#_~`]/g, '')
        .replace(/[-•]\s+/g, ', ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = languageCode || 'en-IN';
      utterance.rate = 0.95;

      let finished = false;
      const onDone = () => {
        if (finished) return;
        finished = true;
        if (clearTimeout) clearTimeout(speechTimeout);
        if (currentState === CallState.AI_SPEAKING) {
          console.log('[VOICE] Returning to listening');
          setTimeout(startRecordingTurn, 500);
        }
      };

      utterance.onend = onDone;
      utterance.onerror = onDone;

      // Safety timeout in case browser speech synthesis hangs without onend
      const estDurationMs = Math.max(3000, Math.min(18000, clean.length * 75));
      speechTimeout = setTimeout(onDone, estDurationMs);

      window.speechSynthesis.speak(utterance);
    } else {
      // If no speech synthesis support, wait 3 seconds and return to listening
      speechTimeout = setTimeout(() => {
        if (currentState === CallState.AI_SPEAKING) {
          console.log('[VOICE] Returning to listening');
          startRecordingTurn();
        }
      }, 3500);
    }
  }

  // ── Start / End Call Handlers ──────────────────────────────────────────────
  // ── Language Metadata & Localized Greetings ─────────────────────────────────
  const VOICE_LANG_META = {
    'auto': {
      greeting: 'Namaste! I am KrishiMitra AI. Please tell me your farming question.',
      substatus: 'Say your question in your native language'
    },
    'en-IN': {
      greeting: 'Namaste! I am KrishiMitra AI. Please tell me your farming question.',
      substatus: 'Say your question in English'
    },
    'hi-IN': {
      greeting: 'नमस्ते! मैं कृषि मित्र AI हूँ। कृपया अपनी फसल या मौसम का प्रश्न पूछें।',
      substatus: 'अपनी भाषा में अपना सवाल कहें'
    },
    'gu-IN': {
      greeting: 'નમસ્તે! હું કૃષિમિત્ર AI છું. તમારી ખેતીનો પ્રશ્ન પૂછો.',
      substatus: 'તમારી ભાષામાં તમારો પ્રશ્ન કહો'
    },
    'mr-IN': {
      greeting: 'नमस्कार! मी कृषि मित्र AI आहे. आपला शेतीविषयक प्रश्न विचारा.',
      substatus: 'तुमच्या भाषेत तुमचा प्रश्न सांगा'
    },
    'bn-IN': {
      greeting: 'নমস্কার! আমি কৃষিমিত্র AI। আপনার প্রশ্ন বলুন।',
      substatus: 'আপনার ভাষায় আপনার প্রশ্ন বলুন'
    },
    'ta-IN': {
      greeting: 'வணக்கம்! நான் கிருஷிமித்ரா AI. உங்கள் விவசாயக் கேள்வியைக் கேளுங்கள்.',
      substatus: 'உங்கள் மொழியில் கேள்வியைக் கூறுங்கள்'
    },
    'te-IN': {
      greeting: 'నమస్కారం! నేను కృషిమిత్ర AI. మీ వ్యవసాయ ప్రశ్నను అడగండి.',
      substatus: 'మీ భాషలో మీ ప్రశ్నను చెప్పండి'
    },
    'kn-IN': {
      greeting: 'ನಮಸ್ಕಾರ! ನಾನು ಕೃಷಿಮಿತ್ರ AI. ನಿಮ್ಮ ಕೃಷಿ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ.',
      substatus: 'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಹೇಳಿ'
    },
    'ml-IN': {
      greeting: 'നമസ്കാരം! ഞാൻ കൃഷിമിത്ര AI ആണ്. നിങ്ങളുടെ ചോദ്യം ചോദിക്കൂ.',
      substatus: 'നിങ്ങളുടെ ഭാഷയിൽ ചോദ്യം പറയൂ'
    },
    'pa-IN': {
      greeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਕ੍ਰਿਸ਼ੀਮਿੱਤਰ AI ਹਾਂ। ਆਪਣਾ ਸਵਾਲ ਪੁੱਛੋ।',
      substatus: 'ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਆਪਣਾ ਸਵਾਲ ਦੱਸੋ'
    },
    'od-IN': {
      greeting: 'ନମସ୍କାର! ମୁଁ କୃଷିମିତ୍ର AI। ଆପଣଙ୍କ ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ।',
      substatus: 'ଆପଣଙ୍କ ଭାଷାରେ ପ୍ରଶ୍ନ କୁହନ୍ତୁ'
    },
    'as-IN': {
      greeting: 'নমস্কাৰ! মই কৃষিমিত্ৰ AI। আপোনাৰ কৃষি সম্পৰ্কীয় প্ৰশ্নটো কওক।',
      substatus: 'আপোনাৰ নিজৰ ভাষাত প্ৰশ্ন কওক'
    },
    'ur-IN': {
      greeting: 'سلام! میں کرشی متر AI ہوں۔ براہ کرم اپنا زرعی سوال پوچھیں۔',
      substatus: 'اپنی زبان میں اپنا سوال بتائیں'
    },
    'sa-IN': {
      greeting: 'नमो नमः! अहं कृषि मित्र AI अस्मि। कृपया स्वकृषिविषयकं प्रश्नं पृच्छतु।',
      substatus: 'स्वभाषया प्रश्नं वदतु'
    },
    'ne-IN': {
      greeting: 'नमस्ते! म कृषि मित्र AI हुँ। कृपया आफ्नो कृषि सम्बन्धी प्रश्न सोध्नुहोस्।',
      substatus: 'आफ्नो भाषामा प्रश्न भन्नुहोस्'
    },
    'kok-IN': {
      greeting: 'नमस्कार! हांव कृषि मित्र AI. तुमचो शेताविशीं चलोवपी प्रश्न विचारात.',
      substatus: 'तुमचे भाशेंत तुमचो प्रश्न सांगात'
    },
    'ks-IN': {
      greeting: 'اسلام علیکم! بہٕ چھُس کٔرشی مِتر AI। مِہربٲنی کٔرِتھ تِہُند زٔری سَوال وُنِو।',
      substatus: 'پَننہِ زَبانہِ مَنٛز سَوال وُنِو'
    },
    'sd-IN': {
      greeting: 'اسلام عليڪم! مان ڪڙمي मित्र AI آهيان. مهرباني ڪري پنهنجو زرعي سوال پڇو.',
      substatus: 'پنهنجي ٻوليءَ ۾ سوال ٻڌايو'
    },
    'brx-IN': {
      greeting: 'खुलुमबाय! आं कृषि मित्र AI. अननानै नोंथांनि आबादनि सोंथि सों।',
      substatus: 'गावनि रावजों सोंथि बुं'
    },
    'mai-IN': {
      greeting: 'प्रणाम! हम कृषि मित्र AI छी। कृपया अपन खेतीबाड़ी सं जड़ल सवाल पूछू।',
      substatus: 'अपन भाषा मे सवाल कहू'
    },
    'doi-IN': {
      greeting: 'नमस्ते! मैं कृषि मित्र AI एं। कृपया अपना खेतीबाड़ी दा सवाल पुच्छो।',
      substatus: 'अपनी बोली च सवाल दस्सो'
    },
    'mni-IN': {
      greeting: 'খুরুমরজরী! ঐহাক কৃষ্ণিমিত্র AI নি। অদোমগী লৌউ-শিংউগী ৱাহং হংবীয়ু।',
      substatus: 'অদোমগী লোন্ অমদগী ৱাহং হায়বীয়ু'
    },
    'sat-IN': {
      greeting: 'ᱡᱚᱦᱟᱨ! ᱤᱧ ᱫᱚ ᱠᱨᱤᱥᱤᱢᱤᱛᱨᱚ AI ᱠᱟᱱᱟᱧ। ᱟᱯᱱᱟᱨᱟᱜ ᱪᱟᱥ ᱠᱩᱠᱞᱤ ᱞᱟᱹᱭ ᱵᱤᱱ।',
      substatus: 'ᱟᱯᱱᱟᱨᱟᱜ ᱯᱟᱹᱨᱥᱤ ᱛᱮ ᱠᱩᱠᱞᱤ ᱞᱟᱹᱭ ᱵᱤᱱ'
    }
  };

  // ── Start / End Call Handlers ──────────────────────────────────────────────
  async function startCall() {
    console.log('[VOICE] Call started');
    callHistory = [];
    const els = getElements();

    if (els.transcriptFeed) els.transcriptFeed.innerHTML = '';
    if (els.callErrorBox) els.callErrorBox.classList.add('hidden');

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setState(CallState.ERROR, 'Voice AI requires an internet connection. You can use Offline AI text chat.');
      return;
    }

    // Auto-select preferred language from localStorage or global app state if available
    if (els.langSelect) {
      const savedLang = localStorage.getItem('km_voice_lang');
      if (savedLang) {
        els.langSelect.value = savedLang;
      } else if (window.appState && window.appState.currentLanguage) {
        const globalCode = window.appState.currentLanguage;
        const matched = Array.from(els.langSelect.options).find(opt => opt.value.startsWith(globalCode));
        if (matched) {
          els.langSelect.value = matched.value;
        }
      }
    }

    const selectedLang = els.langSelect ? els.langSelect.value : 'en-IN';
    const langMeta = VOICE_LANG_META[selectedLang] || VOICE_LANG_META['en-IN'];

    setState(CallState.CONNECTING, 'Connecting to KrishiMitra AI...', langMeta.substatus);
    startCallTimer();

    const initialGreeting = langMeta.greeting;
    appendCallTranscript('ai', initialGreeting);

    try {
      // Pre-acquire microphone right on call start gesture
      if (!mediaStream) {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        console.log('[VOICE] Microphone permission granted');
      }

      // Speak greeting in selected language, then start recording
      playAIResponse(initialGreeting, null, selectedLang);
    } catch (e) {
      console.warn('[VOICE] Pre-call mic or greeting exception:', e);
      startRecordingTurn();
    }
  }

  function endCall() {
    if (currentState === CallState.IDLE) return;

    console.log('[VOICE] Ending call');

    if (clearTimeout && speechTimeout) {
      clearTimeout(speechTimeout);
      speechTimeout = null;
    }

    if (currentAudioPlayer) {
      currentAudioPlayer.pause();
      currentAudioPlayer = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (speechRecognizer) {
      try { speechRecognizer.stop(); } catch (_) {}
      speechRecognizer = null;
    }

    if (mediaRecorder && mediaRecorder.state === 'recording') {
      try { mediaRecorder.stop(); } catch (_) {}
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }

    setState(CallState.CALL_ENDED);
  }

  // ── Push to Speak (Manual Turn Toggle) ─────────────────────────────────────
  function togglePushToSpeak() {
    if (currentState === CallState.LISTENING) {
      // User tapped "Done Speaking"
      console.log('[VOICE] User finished speaking');
      setState(CallState.PROCESSING);
      stopRecordingTurn();
    } else if (currentState === CallState.AI_SPEAKING) {
      // Interrupt AI to speak immediately
      console.log('[VOICE] User interrupted AI speech');
      if (currentAudioPlayer) currentAudioPlayer.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      startRecordingTurn();
    } else if (currentState === CallState.ERROR) {
      // Retry speaking from error state
      startRecordingTurn();
    }
  }

  // ── Expose Public API to Window ────────────────────────────────────────────
  window.SarvamCall = {
    startCall,
    endCall,
    togglePushToSpeak,
    getState: () => currentState
  };

  // ── Initialize Event Listeners Safely ──────────────────────────────────────
  function initCallListeners() {
    const els = getElements();

    if (els.btnEndCall) {
      els.btnEndCall.onclick = endCall;
    }

    if (els.btnPushSpeak) {
      els.btnPushSpeak.onclick = togglePushToSpeak;
    }

    // Dynamic Call Language Selector Listener
    if (els.langSelect) {
      els.langSelect.onchange = (e) => {
        const langCode = e.target.value;
        localStorage.setItem('km_voice_lang', langCode);

        if (window.appState) {
          window.appState.currentLanguage = langCode.split('-')[0];
        }

        const langMeta = VOICE_LANG_META[langCode] || VOICE_LANG_META['en-IN'];
        if (els.subStatusText) {
          els.subStatusText.innerText = langMeta.substatus;
        }

        // If in an active call and in AI_SPEAKING or LISTENING state, update greeting & speak in selected language
        if (currentState === CallState.LISTENING || currentState === CallState.AI_SPEAKING) {
          if (currentAudioPlayer) currentAudioPlayer.pause();
          if ('speechSynthesis' in window) window.speechSynthesis.cancel();

          appendCallTranscript('ai', langMeta.greeting);
          playAIResponse(langMeta.greeting, null, langCode);
        }
      };
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCallListeners);
  } else {
    initCallListeners();
  }

})();

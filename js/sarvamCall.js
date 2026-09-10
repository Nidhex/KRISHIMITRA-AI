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
      // If served from backend server port 5001 or 5000
      if (port === '5001' || port === '5000') {
        return window.location.origin + '/api/voice';
      }
      // If served from Live Server (5500) or other static dev server, target backend port 5001
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

      case CallState.PROCESSING:
        els.modal.classList.remove('hidden');
        els.statusText.innerText = message || '🧠 Thinking & Analyzing...';
        els.subStatusText.innerText = submessage || 'Checking agricultural knowledge base';
        els.avatar.classList.add('pulse-processing');
        if (els.btnPushSpeak) {
          els.btnPushSpeak.innerHTML = '<span>⏳</span> <span>Processing...</span>';
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
          els.btnPushSpeak.innerHTML = '<span>🔊</span> <span>AI Speaking...</span>';
          els.btnPushSpeak.disabled = false; // Allow tapping to interrupt and speak
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
          els.callErrorBox.innerText = message;
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

    setState(CallState.PROCESSING);

    const els = getElements();
    const selectedLang = els.langSelect ? els.langSelect.value.split('-')[0] : 'en';

    console.log('[VOICE] Sending audio to backend');

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
      console.log('[VOICE] Sending transcript to AI');
      console.log(`[VOICE] AI response received (${(data.reply || '').length} chars)`);
      console.log('[VOICE] Requesting TTS');

      if (data.audioBase64) {
        console.log('[VOICE] Audio received');
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

      const cleanReply = cleanAssistantText(data.reply, data.bcp47 || data.language);

      // 1. Append user transcript to feed
      appendCallTranscript('farmer', data.transcript);

      // 2. Append AI response to feed
      appendCallTranscript('ai', cleanReply);

      // 3. Update conversation memory
      callHistory.push({ role: 'user', content: data.transcript });
      callHistory.push({ role: 'assistant', content: cleanReply });

      // 4. Play spoken audio
      playAIResponse(cleanReply, data.audioBase64, data.bcp47 || data.language);

    } catch (err) {
      console.error('[VOICE] Error processing turn:', err);
      if (currentState !== CallState.CALL_ENDED) {
        setState(CallState.ERROR, err.message || 'Network issue during voice call. Tap to try again.');
      }
    }
  }

  // ── Play AI Response Audio ─────────────────────────────────────────────────
  function playAIResponse(replyText, audioBase64, languageCode) {
    if (currentState === CallState.CALL_ENDED || currentState === CallState.IDLE) return;

    setState(CallState.AI_SPEAKING);
    console.log('[VOICE] Playing response');

    // 1. If Sarvam TTS returned audioBase64, play directly via HTML5 Audio
    if (audioBase64) {
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
          console.warn('[VOICE] Audio playback failed, using Web Speech synthesis:', e);
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

    // 2. Fallback: Browser Web Speech API (speechSynthesis)
    fallbackWebSpeech(replyText, languageCode);
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
  async function startCall() {
    console.log('[VOICE] Call started');
    callHistory = [];
    const els = getElements();

    if (els.transcriptFeed) els.transcriptFeed.innerHTML = '';
    if (els.callErrorBox) els.callErrorBox.classList.add('hidden');

    setState(CallState.CONNECTING);
    startCallTimer();

    // Initial greeting
    const selectedLang = els.langSelect ? els.langSelect.value : 'en-IN';
    const greetings = {
      'en-IN': 'Namaste! I am KrishiMitra AI. Please tell me your farming question.',
      'hi-IN': 'नमस्ते! मैं कृषि मित्र AI हूँ। कृपया अपनी फसल या मौसम का प्रश्न पूछें।',
      'gu-IN': 'નમસ્તે! હું કૃષિમિત્ર AI છું. તમારી ખેતીનો પ્રશ્ન પૂછો.',
      'mr-IN': 'नमस्कार! मी कृषि मित्र AI आहे. आपला प्रश्न विचारा.',
      'bn-IN': 'নমস্কার! আমি কৃষিমিত্র AI। আপনার প্রশ্ন বলুন।',
      'ta-IN': 'வணக்கம்! நான் கிருஷிமித்ரா AI. உங்கள் கேள்வியைக் கேளுங்கள்.',
      'te-IN': 'నమస్కారం! నేను కృషిమిత్ర AI. మీ ప్రశ్న అడగండి.',
      'kn-IN': 'ನಮಸ್ಕಾರ! ನಾನು ಕೃಷಿಮಿತ್ರ AI. ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಕೇಳಿ.',
      'ml-IN': 'നമസ്കാരം! ഞാൻ കൃഷിമിത്ര AI ആണ്. ചോദ്യം ചോദിക്കൂ.',
      'pa-IN': 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਕ੍ਰਿਸ਼ੀਮਿੱਤਰ AI ਹਾਂ। ਆਪਣਾ ਸਵਾਲ ਪੁੱਛੋ।',
      'od-IN': 'ନମସ୍କାର! ମୁଁ କୃଷିମିତ୍ର AI। ଆପଣଙ୍କ ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ।'
    };

    const initialGreeting = greetings[selectedLang] || greetings['en-IN'];
    appendCallTranscript('ai', initialGreeting);

    try {
      // Pre-acquire microphone right on call start gesture
      if (!mediaStream) {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        console.log('[VOICE] Microphone permission granted');
      }

      // Speak greeting, then start recording
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

    // Sync call language selector with global language
    if (els.langSelect) {
      els.langSelect.onchange = (e) => {
        const langCode = e.target.value;
        if (window.appState) {
          window.appState.currentLanguage = langCode.split('-')[0];
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

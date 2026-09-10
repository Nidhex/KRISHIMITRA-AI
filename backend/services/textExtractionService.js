/* ==========================================================================
   KrishiMitra AI — Final Assistant Text Extraction & Sanitization Layer
   Ensures ONLY clean farmer-facing responses reach TTS and the UI.
   Prevents internal prompts, system instructions, RAG context, and farmer profile
   blocks from ever being spoken by Bulbul TTS or shown in voice UI.
   ========================================================================== */

'use strict';

const { logger } = require('../middleware/logger');

// ── Localized Fallback Apologies (11 Indian Languages + English) ─────────────
const LOCALIZED_APOLOGIES = {
  en: 'I apologize, I am currently unable to provide a detailed answer. Please consult your local Krishi Vigyan Kendra or try again later.',
  hi: 'माफ़ कीजिए, अभी मैं इस सवाल का सही जवाब नहीं दे पा रहा हूँ। कृपया थोड़ी देर बाद फिर कोशिश करें या अपनी नजदीकी कृषि विज्ञान केंद्र से संपर्क करें।',
  gu: 'માફ કરશો, અત્યારે હું આ સવાલનો યોગ્ય જવાબ આપી શકતો નથી. કૃપા કરીને થોડી વાર પછી પ્રયાસ કરો અથવા તમારા સ્થાનિક કૃષિ વિજ્ઞાન કેન્દ્રનો સંપર્ક કરો.',
  mr: 'माफ करा, मी सध्या या प्रश्नाचे योग्य उत्तर देऊ शकत नाही. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा किंवा आपल्या स्थानिक कृषी विज्ञान केंद्राशी संपर्क साधा.',
  bn: 'দুঃখিত, আমি এই মুহূর্তে সঠিক উত্তর দিতে পারছি না। অনুগ্রহ করে একটু পরে আবার চেষ্টা করুন অথবা আপনার নিকটস্থ কৃষি বিজ্ঞান কেন্দ্রে যোগাযোগ করুন।',
  ta: 'மன்னிக்கவும், தற்சமயம் என்னால் சரியான பதிலை வழங்க முடியவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும் அல்லது உங்கள் உள்ளூர் வேளாண் அறிவியல் மையத்தைத் தொடர்பு கொள்ளவும்.',
  te: 'క్షమించండి, ప్రస్తుతం నేను ఈ ప్రశ్నకు సరైన సమాధానం ఇవ్వలేకపోతున్నాను. దయచేసి కాసేపటి తర్వాత మళ్లీ ప్రయత్నించండి లేదా మీ ప్రాంతీయ కృషి విజ్ఞాన కేంద్రాన్ని సంప్రదించండి.',
  kn: 'ಕ್ಷಮಿಸಿ, ಪ್ರಸ್ತುತ ನಾನು ಈ ಪ್ರಶ್ನೆಗೆ ಸರಿಯಾದ ಉತ್ತರವನ್ನು ನೀಡಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ನಿಮ್ಮ ಸ್ಥಳೀಯ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರವನ್ನು ಸಂಪರ್ಕಿಸಿ.',
  ml: 'ക്ഷമിക്കണം, ഇപ്പോൾ എനിക്ക് ഈ ചോദ്യത്തിന് ശരിയായ ഉത്തരം നൽകാൻ കഴിയുന്നില്ല. കുറച്ചു സമയത്തിനുശേഷം വീണ്ടും ശ്രമിക്കുക അല്ലെങ്കിൽ നിങ്ങളുടെ പ്രാദേശിക കൃഷി വിജ്ഞാന കേന്ദ്രവുമായി ബന്ധപ്പെടുക.',
  pa: 'ਮੁਆਫ਼ ਕਰਨਾ, ਹੁਣੇ ਮੈਂ ਇਸ ਸਵਾਲ ਦਾ ਸਹੀ ਜਵਾਬ ਨਹੀਂ ਦੇ ਸਕਦਾ। ਕਿਰਪਾ ਕਰਕੇ થોੜੀ ਦੇਰ ਬਾਅਦ ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ ਜਾਂ ਆਪਣੇ ਨਜ਼ਦੀਕੀ ਕ੍ਰਿਸ਼ੀ ਵਿਗਿਆਨ ਕੇਂਦਰ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।',
  or: 'କ୍ଷମା କରିବେ, ବର୍ତ୍ତମାନ ମୁଁ ଏହି ପ୍ରଶ୍ନର ସଠିକ୍ ଉତ୍ତର ଦେଇପାରୁନାହିଁ। ଦୟାକରି କିଛି ସମୟ ପରେ ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ କିମ୍ବା ଆପଣଙ୍କର ସ୍ଥାନୀୟ କୃଷି ବିଜ୍ଞାନ କେନ୍ଦ୍ର ସହିତ ଯୋଗାଯୋଗ କରନ୍ତୁ।'
};

/**
 * Get localized clean fallback message.
 * @param {string} [langCode='en']
 * @returns {string}
 */
function getLocalizedFallbackApology(langCode = 'en') {
  const code = (langCode || 'en').toLowerCase().split('-')[0];
  return LOCALIZED_APOLOGIES[code] || LOCALIZED_APOLOGIES.en;
}

// ── Internal Prompt Leak Detection Patterns ──────────────────────────────────
const INTERNAL_LEAK_PATTERNS = [
  /===\s*FARMER\s+PROFILE\s+CONTEXT\s*===/i,
  /===\s*RAG\s+CONTEXT\s*===/i,
  /===\s*SYSTEM\s+PROMPT\s*===/i,
  /===\s*USER\s+CONTEXT\s*===/i,
  /===\s*KRISHIMITRA\s+VERIFIED/i,
  /Based\s+on\s+agricultural\s+recommendations\s+for/i,
  /Based\s+on\s+verified\s+KrishiMitra/i,
  /किसान\s+को\s+सरल\s+और\s+व्यावहारिक/i,
  /Respond\s+in\s+clean,\s+simple/i,
  /Farmer\s+Name:\s*/i,
  /Land\s+Size:\s*/i,
  /system\s+prompt/i,
  /developer\s+message/i,
  /You\s+are\s+KrishiMitra\s+AI\s+.*on\s+a\s+LIVE\s+VOICE\s+CALL/i
];

/**
 * Check if a string contains internal prompt or RAG leak signatures.
 * @param {string} text
 * @returns {boolean}
 */
function isInternalPromptLeaked(text) {
  if (!text || typeof text !== 'string') return false;
  return INTERNAL_LEAK_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Extract the raw text from any LLM or system response object structure.
 * Supports Sarvam, Gemini, Ollama, RAG, or plain string responses.
 *
 * @param {any} response
 * @returns {string} Plain assistant answer string
 */
function extractFinalAssistantText(response) {
  if (!response) return '';

  if (typeof response === 'string') {
    return response.trim();
  }

  if (typeof response === 'object') {
    // 1. Gemini response structure: candidates[0].content.parts[0].text
    if (Array.isArray(response.candidates) && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate && candidate.content && Array.isArray(candidate.content.parts)) {
        const partsText = candidate.content.parts
          .map(p => (typeof p === 'string' ? p : p.text || ''))
          .filter(Boolean)
          .join('\n');
        if (partsText) return partsText.trim();
      }
    }

    // 2. OpenAI / Sarvam structure: choices[0].message.content
    if (Array.isArray(response.choices) && response.choices.length > 0) {
      const choice = response.choices[0];
      if (choice && choice.message && typeof choice.message.content === 'string') {
        return choice.message.content.trim();
      }
      if (choice && typeof choice.text === 'string') {
        return choice.text.trim();
      }
    }

    // 3. KrishiMitra internal objects: response.reply or response.response or response.text
    if (typeof response.reply === 'string') return response.reply.trim();
    if (typeof response.response === 'string') return response.response.trim();
    if (typeof response.text === 'string') return response.text.trim();
    if (typeof response.content === 'string') return response.content.trim();

    // 4. Nested error/message properties
    if (typeof response.message === 'string' && !response.error) {
      return response.message.trim();
    }
  }

  return '';
}

/**
 * Sanitize assistant text to remove internal prompt leakage, headers, or TTS-unfriendly formatting.
 *
 * @param {string} text
 * @param {Object} [options]
 * @param {boolean} [options.forTTS=false] - Strip markdown asterisks, hashes, etc. for TTS
 * @param {string} [options.language='en'] - Fallback language if sanitization empties string
 * @returns {string} Clean farmer-facing text
 */
function sanitizeAssistantText(text, options = {}) {
  const { forTTS = false, language = 'en' } = options;

  if (!text || typeof text !== 'string') {
    return getLocalizedFallbackApology(language);
  }

  let clean = text.trim();

  // 1. Remove profile context headers & lines
  clean = clean.replace(/===\s*FARMER\s+PROFILE\s+CONTEXT\s*===/gi, '');
  clean = clean.replace(/^Farmer\s+Name:.*$/gm, '');
  clean = clean.replace(/^Location:.*$/gm, '');
  clean = clean.replace(/^Land\s+Size:.*$/gm, '');
  clean = clean.replace(/^Soil\s+Type:.*$/gm, '');
  clean = clean.replace(/^Primary\s+Crops:.*$/gm, '');
  clean = clean.replace(/^Crops:.*$/gm, '');
  clean = clean.replace(/^Recent\s+Disease\s+Scan:.*$/gm, '');

  // 2. Remove internal headers & instructions
  clean = clean.replace(/===\s*KRISHIMITRA\s+VERIFIED[\s\S]*?===/gi, '');
  clean = clean.replace(/===\s*RAG\s+CONTEXT\s*===/gi, '');
  clean = clean.replace(/===\s*SYSTEM\s+PROMPT\s*===/gi, '');
  clean = clean.replace(/===\s*USER\s+CONTEXT\s*===/gi, '');

  clean = clean.replace(/Based\s+on\s+agricultural\s+recommendations\s+for\s+[A-Z]{2,5}:\s*/gi, '');
  clean = clean.replace(/Based\s+on\s+verified\s+KrishiMitra\s+agricultural\s+knowledge:\s*/gi, '');
  clean = clean.replace(/किसान\s+को\s+सरल\s+और\s+व्यावहारिक[\s\S]*?उत्तर\s+दें[।\.]/g, '');
  clean = clean.replace(/Respond\s+in\s+clean,\s+simple,\s+and\s+friendly[\s\S]*?\./g, '');
  clean = clean.replace(/<ctrl42>call:.*$/gm, '');
  clean = clean.replace(/You\s+are\s+KrishiMitra\s+AI[\s\S]*?ground\s+truth:\s*/gi, '');

  // 3. Remove record identifiers like [Record] or [Cotton Disease Record 1]
  clean = clean.replace(/\[[^\]]*Record[^\]]*\]/gi, '');

  // 4. Strip markdown formatting if preparing string for TTS
  if (forTTS) {
    clean = clean
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s+/g, '')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[-•]\s+/g, ', ')
      .replace(/\n+/g, ' ');
  }

  // 5. Clean up redundant spaces & newlines
  clean = clean
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();

  // 6. Safety check: if string is now empty or STILL leaks internal prompts, return localized fallback
  if (!clean || clean.length < 3 || isInternalPromptLeaked(clean)) {
    logger.warn('[SANITY] Refusing to use text containing internal leaks or empty result, using localized apology.');
    return getLocalizedFallbackApology(language);
  }

  return clean;
}

/**
 * Generate a clean, farmer-facing answer from local RAG results.
 * This is used during RAG direct fallback so system prompts and farmer profiles
 * are NEVER returned to the client/TTS as answer text.
 *
 * @param {Object} ragResult
 * @param {string} [language='en']
 * @returns {string} Clean farmer-facing text
 */
function buildFarmerFacingRAGAnswer(ragResult, language = 'en') {
  if (!ragResult) {
    return getLocalizedFallbackApology(language);
  }

  const lang = (language || ragResult.detectedLanguage || 'en').toLowerCase().split('-')[0];

  // If ragResult contains context or formatted docs, extract actual factual parts
  let rawText = '';
  if (typeof ragResult === 'string') {
    rawText = ragResult;
  } else if (ragResult.context) {
    rawText = ragResult.context;
  }

  // Sanitize away system prompts and farmer profile headers first
  let cleanText = sanitizeAssistantText(rawText, { language: lang });

  // If cleanText is valid and doesn't leak internal prompts, return it
  if (cleanText && cleanText !== getLocalizedFallbackApology(lang) && !isInternalPromptLeaked(cleanText)) {
    return cleanText;
  }

  // Otherwise, construct a clean sentence based on matched domains/facts
  if (ragResult.domains && ragResult.domains.length > 0) {
    const domainStr = ragResult.domains.join(', ');
    if (lang === 'hi') {
      return `कृषि मित्र जानकारी के अनुसार ${domainStr} संबंधी सलाह उपलब्ध है। अपनी फसल की सही देखभाल के लिए जैविक खादों का प्रयोग करें तथा आवश्यकतानुसार सिंचाई और खरपतवार नियंत्रण करें।`;
    }
    if (lang === 'gu') {
      return `કૃષિમિત્ર માહિતી મુજબ ${domainStr} સંબંધિત ખેતી સલાહ ઉપલબ્ધ છે. તમારા પાકની સુખાકારી માટે નિયમિત ભેજ ચકાસો અને સંતુલિત ખાતરનો ઉપયોગ કરો.`;
    }
    return `According to KrishiMitra verified records for ${domainStr}, please ensure balanced soil moisture, organic compost application, and appropriate pest management for best crop yield.`;
  }

  return getLocalizedFallbackApology(lang);
}

module.exports = {
  extractFinalAssistantText,
  sanitizeAssistantText,
  isInternalPromptLeaked,
  buildFarmerFacingRAGAnswer,
  getLocalizedFallbackApology,
  LOCALIZED_APOLOGIES
};

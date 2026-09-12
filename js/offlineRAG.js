/* ==========================================================================
   KrishiMitra AI — Offline RAG & Agricultural Knowledge Engine
   Provides zero-latency local agricultural knowledge search when offline.
   Supports: 11 Indian Languages, Native Scripts, Romanized Hindi Input,
   Exact Crop/Topic Matching, Penalty-Based Relevance Scoring,
   Hard Unknown Query Protection, and Devanagari Output Generation.
   ========================================================================== */

(function (root, factory) {
  const instance = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = instance;
  }
  if (root) {
    root.KrishiOfflineRAG = instance;
  }
}(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : this), function () {
  'use strict';

  let offlineData = {};
  let isLoaded = false;

  // ── Supported Languages Configuration ─────────────────────────────────────
  const SUPPORTED_LANGUAGES = {
    en: 'English', hi: 'हिन्दी', gu: 'ગુજરાતી', mr: 'मરાઠી',
    bn: 'বাংলা', ta: 'தமிழ்', te: 'తెలుగు', kn: 'ಕನ್ನಡ',
    ml: 'മലയാളം', pa: 'ਪੰਜਾਬੀ', or: 'ଓଡ଼ିଆ'
  };

  // ── Multilingual UI Templates ──────────────────────────────────────────────
  const LOCALIZED_UI = {
    en: {
      header: '📴 **Offline AI — Answer from KrishiMitra\'s local agricultural knowledge**\n',
      unknown: 'Sorry, I couldn\'t find enough information for this question in KrishiMitra\'s offline knowledge base. Please include the crop or problem name.',
      footer: '\n*(Offline answer generated from pre-cached KrishiMitra agricultural database)*',
      labels: {
        overview: 'Overview', crop: 'Crop', symptoms: 'Symptoms', organicTreatment: '🌿 Organic Treatment',
        chemicalTreatment: '🧪 Chemical Treatment', prevention: '🛡️ Prevention', dosage: '⚖️ Dosage',
        applicationMethod: '💧 Application Method', precautions: '⚠️ Precautions', application: '🌾 Application Advisory',
        fertilizerAdvisory: '🧪 Fertilizer Dose', timing: '⏰ Timing', suitableCrops: '🌱 Suitable Crops',
        soilType: '🏔️ Soil Type', healthScore: '📊 Health Score', moisture: '💧 Moisture', eligibility: '📋 Eligibility',
        benefit: '💰 Benefit / Subsidy', guidance: '💡 Guidance', mandiRates: '💵 Mandi Rates', marketAdvice: '📈 Market Advice'
      }
    },
    hi: {
      header: '📴 **ऑफ़लाइन AI — कृषि मित्र स्थानीय ज्ञान से उत्तर**\n',
      unknown: 'माफ़ कीजिए, मैं ऑफ़लाइन हूँ और मुझे अपने स्थानीय कृषि ज्ञानकोष में इस प्रश्न का सटीक उत्तर नहीं मिला (पर्याप्त जानकारी नहीं मिली)। कृपया प्रश्न को फसल या समस्या के नाम के साथ दोबारा पूछें।',
      footer: '\n*(कृषि मित्र के सहेजे गए स्थानीय ज्ञानकोष से जनरेट किया गया ऑफ़लाइन उत्तर)*',
      labels: {
        overview: 'विवरण', crop: 'फसल', symptoms: 'लक्षण', organicTreatment: '🌿 जैविक उपचार',
        chemicalTreatment: '🧪 रासायनिक उपचार', prevention: '🛡️ बचाव व रोकथाम के उपाय', dosage: '⚖️ खुराक / मात्रा',
        applicationMethod: '💧 प्रयोग विधि', precautions: '⚠️ सावधानियां', application: '🌾 खाद प्रयोग सलाह',
        fertilizerAdvisory: '🧪 उर्वरक मात्रा', timing: '⏰ सही समय', suitableCrops: '🌱 उपयुक्त फसलें',
        soilType: '🏔️ मिट्टी का प्रकार', healthScore: '📊 स्वास्थ्य स्कोर', moisture: '💧 नमी', eligibility: '📋 पात्रता व दस्तावेज',
        benefit: '💰 लाभ / सब्सिडी', guidance: '💡 सलाह', mandiRates: '💵 मंडी भाव', marketAdvice: '📈 बाजार सलाह'
      }
    },
    gu: {
      header: '📴 **ઑફલાઇન AI — કૃષિમિત્ર સ્થાનિક જ્ઞાનથી જવાબ**\n',
      unknown: 'માફ કરશો, હું ઓફલાઇન છું અને મને સ્થાનિક કૃષિ જ્ઞાનકોશમાં આ પ્રશ્નનો સચોટ જવાબ મળ્યો નથી. સંપૂર્ણ AI સહાય માટે કૃપા કરીને ઇન્ટરનેટથી કનેક્ટ થાઓ.',
      footer: '\n*(કૃષિમિત્ર સ્થાનિક જ્ઞાનકોશમાંથી જનરેટ થયેલ ઑફલાઇન જવાબ)*',
      labels: {
        overview: 'માહિતી', crop: 'પાક', symptoms: 'લક્ષણો', organicTreatment: '🌿 જૈવિક ઉપચાર',
        chemicalTreatment: '🧪 રાસાયણિક ઉપચાર', prevention: '🛡️ બચાવના ઉપાયો', dosage: '⚖️ પ્રમાણ',
        applicationMethod: '💧 છંટકાવ પદ્ધતિ', precautions: '⚠️ સાવચેતી', application: '🌾 ખાતર સલાહ',
        fertilizerAdvisory: '🧪 ખાતર પ્રમાણ', timing: '⏰ સમય', suitableCrops: '🌱 અનુકૂળ પાકો',
        soilType: '🏔️ જમીનનો પ્રકાર', healthScore: '📊 સ્વાસ્થ્ય સ્કોર', moisture: '💧 ભેજ', eligibility: '📋 પાત્રતા',
        benefit: '💰 લાભ / સબસિડી', guidance: '💡 માર્ગદર્શન', mandiRates: '💵 મંડી ભાવ', marketAdvice: '📈 બજાર સલાહ'
      }
    },
    mr: {
      header: '📴 **ऑफलाईन AI — कृषी मित्र स्थानिक ज्ञान उत्तर**\n',
      unknown: 'माफ करा, मी ऑफलाईन आहे आणि मला माझ्या स्थानिक कृषी ज्ञानकोशात या प्रश्नाचे अचूक उत्तर मिळाले नाही. पूर्ण AI मदतीसाठी कृपया इंटरनेटशी कनेक्ट करा.',
      footer: '\n*(कृषी मित्र स्थानिक ज्ञानकोशातून तयार केलेले ऑफलाईन उत्तर)*',
      labels: {
        overview: 'माहिती', crop: 'पीक', symptoms: 'लक्षणे', organicTreatment: '🌿 सेंद्रिय उपचार',
        chemicalTreatment: '🧪 रासायनिक उपचार', prevention: '🛡️ प्रतिबंधात्मक उपाय', dosage: '⚖️ प्रमाण',
        applicationMethod: '💧 फवारणी पद्धत', precautions: '⚠️ काळजी', application: '🌾 खत सल्ला',
        fertilizerAdvisory: '🧪 खत प्रमाण', timing: '⏰ वेळ', suitableCrops: '🌱 योग्य पिके',
        soilType: '🏔️ मातीचा प्रकार', healthScore: '📊 आरोग्य સ્કોઅર', moisture: '💧 ओलावा', eligibility: '📋 पात्रता',
        benefit: '💰 लाभ / सबसिडी', guidance: '💡 सल्ला', mandiRates: '💵 बाजार भाव', marketAdvice: '📈 मार्केट सल्ला'
      }
    },
    bn: {
      header: '📴 **অফলাইন AI — কৃষিমিত্র স্থানীয় জ্ঞান উত্তর**\n',
      unknown: 'দুঃখিত, আমি অফলাইনে আছি এবং আমার স্থানীয় কৃষি জ্ঞানকোষে এই প্রশ্নের সঠিক উত্তর খুঁজে পাইনি। পূর্ণাঙ্গ AI সহায়তার জন্য অনুগ্রহ করে ইন্টারনেটে সংযোগ করুন।',
      footer: '\n*(কৃষিমিত্র স্থানীয় জ্ঞানকোষ থেকে তৈরি অফলাইন উত্তর)*',
      labels: {
        overview: 'বিবরণ', crop: 'ফসল', symptoms: 'লক্ষণ', organicTreatment: '🌿 জৈব চিকিৎসা',
        chemicalTreatment: '🧪 রাসায়নিক চিকিৎসা', prevention: '🛡️ প্রতিরোধের উপায়', dosage: '⚖️ মাত্রা',
        applicationMethod: '💧 প্রয়োগ পদ্ধতি', precautions: '⚠️ সতর্কতা', application: '🌾 সার প্রয়োগ',
        fertilizerAdvisory: '🧪 সার মাত্রা', timing: '⏰ সময়', suitableCrops: '🌱 উপযুক্ত ফসল',
        soilType: '🏔️ মাটির ধরন', healthScore: '📊 স্বাস্থ্য স্কোর', moisture: '💧 আর্দ্রতা', eligibility: '📋 যোগ্যতা',
        benefit: '💰 সুবিধা / ভর্তুকি', guidance: '💡 পরামর্শ', mandiRates: '💵 বাজার দর', marketAdvice: '📈 বাজার পরামর্শ'
      }
    },
    ta: {
      header: '📴 **ஆஃப்லைன் AI — கிருஷிமித்ரா உள்ளூர் வேளாண் அறிவு பதில்**\n',
      unknown: 'மன்னிக்கவும், நான் ஆஃப்லைனில் உள்ளேன். எனது உள்ளூர் வேளாண் அறிவுத் தளத்தில் இந்த கேள்விக்கு சரியான பதில் கிடைக்கவில்லை. முழு AI உதவிக்கு இணையத்தில் இணையவும்.',
      footer: '\n*(கிருஷிமித்ரா உள்ளூர் தரவுத்தளத்தில் இருந்து பெறப்பட்ட ஆஃப்லைன் பதில்)*',
      labels: {
        overview: 'விவரம்', crop: 'பயிர்', symptoms: 'அறிகுறிகள்', organicTreatment: '🌿 இயற்கை சிகிச்சை',
        chemicalTreatment: '🧪 ரசாயன சிகிச்சை', prevention: '🛡️ தடுப்பு முறைகள்', dosage: '⚖️ அளவு',
        applicationMethod: '💧 தெளிப்பு முறை', precautions: '⚠️ முன்னெச்சரிக்கை', application: '🌾 உரம் பயன்பாடு',
        fertilizerAdvisory: '🧪 உர அளவு', timing: '⏰ நேரம்', suitableCrops: '🌱 ஏற்ற பயிர்கள்',
        soilType: '🏔️ மண் வகை', healthScore: '📊 ஆரோக்கிய நிலை', moisture: '💧 ஈரம்', eligibility: '📋 தகுதி',
        benefit: '💰 பயன் / மானியம்', guidance: '💡 வழிகாட்டுதல்', mandiRates: '💵 சந்தை விலை', marketAdvice: '📈 சந்தை ஆலோசனை'
      }
    },
    te: {
      header: '📴 **ఆఫ్‌లైన్ AI — కృషిమిత్ర స్థానిక వ్యవసాయ సమాధానం**\n',
      unknown: 'క్షమించండి, నేను ఆఫ్‌లైన్‌లో ఉన్నాను. నా స్థానిక వ్యవసాయ సమాచారంలో ఈ ప్రశ్నకు సరైన సమాధానం లభించలేదు. పూర్తి AI సహాయం కోసం దయచేసి ఇంటర్నెట్‌కు కనెక్ట్ అవ్వండి.',
      footer: '\n*(కృషిమిత్ర స్థానిక సమాచారం నుండి అందించబడిన ఆఫ్‌లైన్ సమాధానం)*',
      labels: {
        overview: 'వివరాలు', crop: 'పంట', symptoms: 'లక్షణాలు', organicTreatment: '🌿 సేంద్రీయ నివారణ',
        chemicalTreatment: '🧪 రసాయన నివారణ', prevention: '🛡️ నివారణ చర్యలు', dosage: '⚖️ మోతాదు',
        applicationMethod: '💧 పిచికారీ పద్ధతి', precautions: '⚠️ జాగ్రత్తలు', application: '🌾 ఎరువుల సలహా',
        fertilizerAdvisory: '🧪 ఎరువుల మోతాదు', timing: '⏰ సమయం', suitableCrops: '🌱 అనుకూల పంటలు',
        soilType: '🏔️ నేల రకం', healthScore: '📊 నేల ఆరోగ్యం', moisture: '💧 తేమ', eligibility: '📋 అర్హత',
        benefit: '💰 లబ్ధి / సబ్సిడీ', guidance: '💡 సలహా', mandiRates: '💵 మార్కెట్ ధరలు', marketAdvice: '📈 మార్కెట్ సలహా'
      }
    },
    kn: {
      header: '📴 **ಆಫ್‌ಲೈನ್ AI — ಕೃಷಿಮಿತ್ರ ಸ್ಥಳೀಯ ಕೃಷಿ ಮಾಹಿತಿ ಉತ್ತರ**\n',
      unknown: 'ಕ್ಷಮಿಸಿ, ನಾನು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದೇನೆ. ನನ್ನ ಸ್ಥಳೀಯ ಕೃಷಿ ಜ್ಞಾನಕೋಶದಲ್ಲಿ ಈ ಪ್ರಶ್ನೆಗೆ ನಿಖರವಾದ ಉತ್ತರ ಸಿಗಲಿಲ್ಲ. ಸಂಪೂರ್ಣ AI ನೆರವಿಗಾಗಿ ದಯವಿಟ್ಟು ಇಂಟರ್ನೆಟ್‌ಗೆ ಸಂಪರ್ಕಿಸಿ.',
      footer: '\n*(ಕೃಷಿಮಿತ್ರ ಸ್ಥಳೀಯ ಮಾಹಿತಿಯಿಂದ ಸಿದ್ಧಪಡಿಸಿದ ಆಫ್‌ಲೈನ್ ಉತ್ತರ)*',
      labels: {
        overview: 'ವಿವರಣೆ', crop: 'ಬೆಳೆ', symptoms: 'ಲಕ್ಷಣಗಳು', organicTreatment: '🌿 ಸಾವಯವ ಚಿಕಿತ್ಸೆ',
        chemicalTreatment: '🧪 ರಾಸಾಯನಿಕ ಚಿಕಿತ್ಸೆ', prevention: '🛡️ ಮುನ್ನೆಚ್ಚರಿಕೆ', dosage: '⚖️ ಪ್ರಮಾಣ',
        applicationMethod: '💧 ಸಿಂಪಡಣೆ ವಿಧಾನ', precautions: '⚠️ ಮುನ್ನೆಚ್ಚರಿಕೆಗಳು', application: '🌾 ಗೊಬ್ಬರ ಸಲಹೆ',
        fertilizerAdvisory: '🧪 ಗೊಬ್ಬರ ಪ್ರಮಾಣ', timing: '⏰ ಸಮಯ', suitableCrops: '🌱 ಸೂಕ್ತ ಬೆಳೆಗಳು',
        soilType: '🏔️ ಮಣ್ಣಿನ ವಿಧ', healthScore: '📊 ಮಣ್ಣಿನ ಆರೋಗ್ಯ', moisture: '💧 ತೇವಾಂಶ', eligibility: '📋 ಅರ್ಹತೆ',
        benefit: '💰 ಸೌಲಭ್ಯ / ಸಬ್ಸಿಡಿ', guidance: '💡 ಮಾರ್ಗದರ್ಶನ', mandiRates: '💵 ಮಾರುಕಟ್ಟೆ ಬೆಲೆ', marketAdvice: '📈 ಮಾರುಕಟ್ಟೆ ಸಲಹೆ'
      }
    },
    ml: {
      header: '📴 **ഓഫ്‌ലൈൻ AI — കൃഷിമിത്ര പ്രാദേശിക കാർഷിക ഉത്തരം**\n',
      unknown: 'ക്ഷമിക്കണം, ഞാൻ ഓഫ്‌ലൈനിലാണ്. എന്റെ പ്രാദേശിക കാർഷിക വിജ്ഞാനകോശത്തിൽ ഈ ചോദ്യത്തിന് കൃത്യമായ ഉത്തരം കണ്ടെത്താനായില്ല. മുഴുവൻ AI സഹായത്തിനായി ദയവായി ഇന്റർനെറ്റുമായി ബന്ധിപ്പിക്കുക.',
      footer: '\n*(കൃഷിമിത്ര പ്രാദേശിക വിവരങ്ങളിൽ നിന്നുള്ള ഓഫ്‌ലൈൻ ഉത്തരം)*',
      labels: {
        overview: 'വിവരണം', crop: 'വിള', symptoms: 'ലക്ഷണങ്ങൾ', organicTreatment: '🌿 ജൈവ ചികിത്സ',
        chemicalTreatment: '🧪 രാസ ചികിത്സ', prevention: '🛡️ പ്രതിരോധ മാർഗ്ഗങ്ങൾ', dosage: '⚖️ അളവ്',
        applicationMethod: '💧 തളിക്കൽ രീതി', precautions: '⚠️ മുൻകരുതലുകൾ', application: '🌾 വളപ്രയോഗം',
        fertilizerAdvisory: '🧪 വളത്തിന്റെ അളവ്', timing: '⏰ സമയം', suitableCrops: '🌱 അനുയോജ്യമായ വിളകൾ',
        soilType: '🏔️ മണ്ണ് തരം', healthScore: '📊 മണ്ണ് ആരോഗ്യം', moisture: '💧 ഈർപ്പം', eligibility: '📋 യോഗ്യത',
        benefit: '💰 ആനുകൂല്യം / സബ്‌സിഡി', guidance: '💡 നിർദ്ദേശം', mandiRates: '💵 വിപണി വില', marketAdvice: '📈 വിപണി ഉപദേശം'
      }
    },
    pa: {
      header: '📴 **ਆਫਲਾਈਨ AI — ਕ੍ਰਿਸ਼ੀਮਿੱਤਰ ਸਥਾਨਕ ਖੇਤੀਬਾੜੀ ਉੱਤਰ**\n',
      unknown: 'ਮੁਆਫ਼ ਕਰਨਾ, ਮੈਂ ਆਫਲਾਈਨ ਹਾਂ ਅਤੇ ਮੈਨੂੰ ਆਪਣੇ ਸਥਾਨਕ ਖੇਤੀਬਾੜੀ ਗਿਆਨਕੋਸ਼ ਵਿੱਚ ਇਸ ਸਵਾਲ ਦਾ ਸਹੀ ਜਵਾਬ ਨਹੀਂ ਮਿਲਿਆ। ਪੂਰੀ AI ਸਹਾਇਤਾ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਇੰਟਰਨੈੱਟ ਨਾਲ ਜੁੜੋ।',
      footer: '\n*(ਕ੍ਰਿਸ਼ੀਮਿੱਤਰ ਸਥਾਨਕ ਗਿਆਨਕੋਸ਼ ਤੋਂ ਤਿਆਰ ਕੀਤਾ ਗਿਆ ਆਫਲਾਈਨ ਜਵਾਬ)*',
      labels: {
        overview: 'ਵੇਰਵਾ', crop: 'ਫਸਲ', symptoms: 'ਲੱਛਣ', organicTreatment: '🌿 ਜੈਵਿਕ ਇਲਾਜ',
        chemicalTreatment: '🧪 ਰਸਾਇਣਕ ਇਲਾਜ', prevention: '🛡️ ਬਚਾਅ ਦੇ ਉਪਾਅ', dosage: '⚖️ ਖੁਰਾਕ / ਮਾਤਰਾ',
        applicationMethod: '💧 ਸਪਰੇਅ ਦਾ ਤਰੀਕਾ', precautions: '⚠️ ਸਾਵਧਾਨੀਆਂ', application: '🌾 ਖਾਦ ਦੀ ਵਰਤੋਂ',
        fertilizerAdvisory: '🧪 ਖਾਦ ਦੀ ਮਾਤਰਾ', timing: '⏰ ਸਮਾਂ', suitableCrops: '🌱 ਢੁਕਵੀਂ ਫਸਲ',
        soilType: '🏔️ ਮਿੱਟੀ ਦੀ ਕਿਸਮ', healthScore: '📊 ਮਿੱਟੀ ਦੀ ਸਿਹਤ', moisture: '💧 ਨਮੀ', eligibility: '📋 ਯੋਗਤਾ',
        benefit: '💰 ਲਾਭ / ਸਬਸਿਡੀ', guidance: '💡 ਸਲਾਹ', mandiRates: '💵 ਮੰਡੀ ਦਾ ਭਾਅ', marketAdvice: '📈 ਬਾਜ਼ਾਰ ਸਲਾਹ'
      }
    },
    or: {
      header: '📴 **ଅଫଲାଇନ୍ AI — କୃଷିମିତ୍ର ସ୍ଥାନୀୟ କୃଷି ଜ୍ଞାନ ଉତ୍ତର**\n',
      unknown: 'କ୍ଷମା କରିବେ, ମୁଁ ଅଫଲାଇନ୍ରେ ଅଛି ଏବଂ ମୋର ସ୍ଥାନୀୟ କୃଷି ଜ୍ଞାନକୋଷରେ ଏହି ପ୍ରଶ୍ନର ସଠିକ୍ ଉତ୍ତର ମିଳିଲା ନାହିଁ। ସମ୍ପୂର୍ଣ୍ଣ AI ସହାୟତା ପାଇଁ ଦୟାକରି ଇଣ୍ଟରନେଟ୍ ସହିତ ସଂଯୋଗ କରନ୍ତୁ।',
      footer: '\n*(କୃଷିମିତ୍ର ସ୍ଥାନୀୟ ଜ୍ଞାନକୋଷରୁ ପ୍ରସ୍ତୁତ ଅଫଲାଇନ୍ ଉତ୍ତର)*',
      labels: {
        overview: 'ବିବରଣୀ', crop: 'ଫସଲ', symptoms: 'ଲକ୍ଷଣ', organicTreatment: '🌿 ଜୈବିକ ଉପଚାର',
        chemicalTreatment: '🧪 ରାସାୟନିକ ଉପଚାର', prevention: '🛡️ ପ୍ରତିରୋଧକ ଉପାୟ', dosage: '⚖️ ମାତ୍ରା',
        applicationMethod: '💧 ସ୍ପ୍ରେ ପଦ୍ଧତି', precautions: '⚠️ ସାବଧାନତା', application: '🌾 ସାର ପ୍ରୟୋଗ',
        fertilizerAdvisory: '🧪 ସାର ମାତ୍ରା', timing: '⏰ ସମୟ', suitableCrops: '🌱 ଉପଯୁକ୍ତ ଫସଲ',
        soilType: '🏔️ ମାଟିର ପ୍ରକାର', healthScore: '📊 ସ୍ୱାସ୍ଥ୍ୟ ସ୍କୋର', moisture: '💧 ଆର୍ଦ୍ରତା', eligibility: '📋 ଯୋଗ୍ୟତା',
        benefit: '💰 ସୁବିଧା / ରିହାତି', guidance: '💡 ପରାମର୍ଶ', mandiRates: '💵 ମାଣ୍ଡି ଦର', marketAdvice: '📈 ବଜାର ପରାମର୍ଶ'
      }
    }
  };

  // ── Crop Alias Recognition Dictionary ─────────────────────────────────────
  const CROP_ALIASES = {
    tomato: ['tomato', 'tamatar', 'टमाटर', 'ટામેટા', 'टोमॅटो'],
    wheat: ['wheat', 'gehu', 'gehun', 'गेहूं', 'गेहु', 'kanak', 'lokwan', 'कनक'],
    rice: ['rice', 'paddy', 'dhaan', 'dhan', 'chawal', 'धान', 'चावल', 'बासमती', 'basmati', 'ડાંગર', 'भात', 'ধান', 'நெல்', 'వరి', 'ಭತ್ತ'],
    cotton: ['cotton', 'kapas', 'कपास', 'कापूस', 'પરૂત્તિ'],
    maize: ['maize', 'corn', 'makka', 'मक्का', 'मकाई'],
    potato: ['potato', 'aalu', 'aloo', 'आलू', 'बटाटा'],
    mustard: ['mustard', 'sarson', 'सरसों', 'राई'],
    chilli: ['chilli', 'chili', 'mirch', 'मिर्च'],
    brinjal: ['brinjal', 'eggplant', 'baingan', 'बैंगन'],
    okra: ['okra', 'bhindi', 'ladyfinger', 'भिंडी'],
    chickpea: ['chickpea', 'gram', 'chana', 'चना'],
    pigeonpea: ['pigeonpea', 'pigeon pea', 'arhar', 'tur', 'अरहर', 'तुअर'],
    sugarcane: ['sugarcane', 'ganna', 'गन्ना', 'ईख'],
    banana: ['banana', 'kela', 'केला'],
    mango: ['mango', 'aam', 'आम'],
    grapes: ['grapes', 'angoor', 'अंगूर'],
    citrus: ['citrus', 'lemon', 'nimbu', 'नींबू'],
    pomegranate: ['pomegranate', 'anar', 'अनार'],
    papaya: ['papaya', 'papita', 'पपीता', 'पपीते'],
    onion: ['onion', 'pyaj', 'pyaz', 'प्याज', 'प्याज़'],
    garlic: ['garlic', 'lehsun', 'lahsun', 'लहसुन'],
    ginger: ['ginger', 'adrak', 'अदरक'],
    turmeric: ['turmeric', 'haldi', 'हल्दी'],
    soybean: ['soybean', 'soyabean', 'सोयाबीन'],
    groundnut: ['groundnut', 'peanut', 'moongfali', 'मूंगफली']
  };

  function detectCropInText(text) {
    if (!text || typeof text !== 'string') return null;
    const lower = text.toLowerCase();
    for (const [cropKey, aliases] of Object.entries(CROP_ALIASES)) {
      for (const alias of aliases) {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const reg = new RegExp('(?:^|[^a-zA-Z0-9\u0900-\u0D7F])' + escaped + '(?:$|[^a-zA-Z0-9\u0900-\u0D7F])', 'i');
        if (reg.test(lower)) {
          return cropKey;
        }
      }
    }
    return null;
  }

  // ── Language & Script Detection (Supports 11 Native Indian Scripts + Hinglish) ──
  function detectLanguage(text, fallbackLang = 'en') {
    if (!text || typeof text !== 'string') return fallbackLang || 'en';
    const clean = text.trim();
    if (!clean) return fallbackLang || 'en';

    let counts = {
      gu: (clean.match(/[\u0A80-\u0AFF]/g) || []).length,
      bn: (clean.match(/[\u0980-\u09FF]/g) || []).length,
      ta: (clean.match(/[\u0B80-\u0BFF]/g) || []).length,
      te: (clean.match(/[\u0C00-\u0C7F]/g) || []).length,
      kn: (clean.match(/[\u0C80-\u0CFF]/g) || []).length,
      ml: (clean.match(/[\u0D00-\u0D7F]/g) || []).length,
      pa: (clean.match(/[\u0A00-\u0A7F]/g) || []).length,
      or: (clean.match(/[\u0B00-\u0B7F]/g) || []).length,
      devanagari: (clean.match(/[\u0900-\u097F]/g) || []).length
    };

    for (const [lang, count] of Object.entries(counts)) {
      if (lang !== 'devanagari' && count >= 2) return lang;
    }

    if (counts.devanagari >= 2) {
      const marathiMarkers = ['आहे', 'नाही', 'पिक', 'शेतकरी', 'पाने', 'करपा', 'करावे'];
      return marathiMarkers.some(m => clean.includes(m)) ? 'mr' : 'hi';
    }

    const lower = clean.toLowerCase();

    const romanizedHindiMarkers = [
      'gehu', 'gehun', 'dhaan', 'dhan', 'tamatar', 'pattiyan', 'patte', 'peeli',
      'peela', 'mud', 'rahi', 'kheti', 'kaali', 'mitti', 'urvarak', 'khad', 'bima',
      'yojana', 'kaise', 'kab', 'kyu', 'kyun', 'kya', 'chahiye', 'rog', 'keede', 'keeda',
      'safed', 'makkhi', 'tana', 'chedak', 'uvala', 'paani', 'sinchai', 'bhav', 'rate',
      'kaunsa', 'kaun', 'konsi', 'kare', 'karu', 'gaye', 'gaya', 'mera', 'meri', 'mere'
    ];

    if (romanizedHindiMarkers.some(m => new RegExp('\\b' + m + '\\b', 'i').test(lower))) {
      return 'hi';
    }

    return 'en';
  }

  // ── Stop Words List ────────────────────────────────────────────────────────
  const STOP_WORDS = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'in', 'on', 'at', 'to',
    'for', 'of', 'and', 'or', 'but', 'if', 'so', 'my', 'me', 'i', 'you', 'he',
    'this', 'that', 'these', 'those', 'with', 'from', 'by', 'about', 'what',
    'why', 'how', 'when', 'where', 'which', 'who', 'में', 'का', 'की', 'के',
    'को', 'से', 'ने', 'पर', 'भी', 'और', 'या', 'है', 'हैं', 'था', 'थे', 'थी',
    'हो', 'रहा', 'रही', 'रहे', 'हुआ', 'क्या', 'क्यों', 'कैसे', 'कब', 'कहां',
    'कौन', 'कर', 'करें', 'करो', 'करना', 'चाहिए', 'लिए', 'साथ', 'आप', 'मेरा',
    'meri', 'mera', 'mere', 'ke', 'ka', 'ki', 'ko', 'se', 'me', 'mein', 'hai',
    'hain', 'kya', 'kyun', 'kyu', 'kaise', 'chahiye', 'kare', 'karein', 'rahi',
    'raha', 'rahe', 'ho', 'gaya', 'gaye'
  ]);

  // ── Build Searchable Blob from Record ─────────────────────────────────────
  function buildSearchBlob(record) {
    const parts = [
      record.id || '',
      record.category || '',
      record.domain || '',
      record.crop || '',
      record.topic || '',
      record.title || '',
      record.title_hi || '',
      record.description || '',
      record.description_hi || ''
    ];

    if (Array.isArray(record.keywords)) parts.push(...record.keywords);
    if (Array.isArray(record.keywords_hi)) parts.push(...record.keywords_hi);
    if (Array.isArray(record.keywords_romanized)) parts.push(...record.keywords_romanized);

    if (record.metadata && typeof record.metadata === 'object') {
      flattenValues(record.metadata, parts);
    }
    return parts.join(' ');
  }

  function flattenValues(obj, parts) {
    for (const val of Object.values(obj)) {
      if (typeof val === 'string' || typeof val === 'number') {
        parts.push(String(val));
      } else if (Array.isArray(val)) {
        val.forEach(v => {
          if (typeof v === 'string' || typeof v === 'number') parts.push(String(v));
          else if (typeof v === 'object' && v !== null) flattenValues(v, parts);
        });
      } else if (typeof val === 'object' && val !== null) {
        flattenValues(val, parts);
      }
    }
  }

  // ── Search Domain with Crop Matching & Penalties ─────────────────────────
  function searchDomain(domain, query, detectedCrop, limit = 5) {
    const records = offlineData[domain] || [];
    if (!query || records.length === 0) return [];

    const lowerQuery = query.toLowerCase();
    const terms = lowerQuery.split(/\s+/).filter(w => w.length >= 2 && !STOP_WORDS.has(w));
    if (terms.length === 0) return [];

    const scored = records.map(record => {
      const blob = buildSearchBlob(record).toLowerCase();
      let score = 0;

      // 1. Keyword match scoring
      terms.forEach(term => {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordRegex = new RegExp('(?:^|[^a-zA-Z0-9\u0900-\u0D7F])' + escaped + '(?:$|[^a-zA-Z0-9\u0900-\u0D7F])', 'i');
        if (wordRegex.test(blob)) {
          score += 4;
          if ((record.title && record.title.toLowerCase().includes(term)) ||
              (record.title_hi && record.title_hi.toLowerCase().includes(term)) ||
              (record.id && record.id.toLowerCase().includes(term))) {
            score += 8;
          }
        } else if (term.length >= 2 && blob.includes(term)) {
          score += 2;
        }
      });

      // 2. Crop Match & Mismatch Penalty
      const recordCropKey = detectCropInText(record.crop || record.title || record.title_hi || record.id || '');

      if (detectedCrop) {
        if (recordCropKey === detectedCrop) {
          score += 25; // Massive boost for exact crop match
        } else if (recordCropKey && recordCropKey !== detectedCrop && domain !== 'soil' && domain !== 'schemes' && domain !== 'weather' && domain !== 'mandi' && domain !== 'faq') {
          score -= 30; // Heavy penalty for wrong crop on disease/pest records
        }
      }

      // 3. Leaf Curl / Curling Symptom Boost
      if (lowerQuery.includes('mud') || lowerQuery.includes('curl') || lowerQuery.includes('मरोड़') || lowerQuery.includes('मुड़')) {
        if (blob.includes('curl') || blob.includes('marod') || blob.includes('मरोड़') || blob.includes('मुड़')) {
          score += 15;
        }
      }

      // 4. Yellow Leaves / Rust Symptom Boost
      if (lowerQuery.includes('peeli') || lowerQuery.includes('peela') || lowerQuery.includes('yellow') || lowerQuery.includes('पीली') || lowerQuery.includes('पीला')) {
        if (blob.includes('yellow') || blob.includes('peeli') || blob.includes('पीला') || blob.includes('rust')) {
          score += 15;
        }
      }

      // 5. Black Soil Query Boost
      if (lowerQuery.includes('kaali') || lowerQuery.includes('black soil') || lowerQuery.includes('काली')) {
        if (domain === 'soil' && (blob.includes('black') || blob.includes('kaali') || blob.includes('काली'))) {
          score += 20;
        }
      }

      // 6. PM-Kisan Boost
      if (lowerQuery.includes('pm kisan') || lowerQuery.includes('पीएम किसान') || lowerQuery.includes('samman nidhi')) {
        if (record.id === 'pm-kisan' || record.id === 'faq-pm-kisan-samman' || record.id === 'faq-pm-kisan-details') {
          score += 25;
        }
      }

      // 7. Mandi Rate & Market Query Boost
      if (lowerQuery.includes('mandi') || lowerQuery.includes('मंडी') || lowerQuery.includes('bhav') || lowerQuery.includes('भाव') || lowerQuery.includes('rate')) {
        if (domain === 'mandi' || domain === 'faq') {
          score += 20;
        }
      }

      // 8. Cold Wave / Frost Boost
      if (lowerQuery.includes('pala') || lowerQuery.includes('पाले') || lowerQuery.includes('पाला') || lowerQuery.includes('cold wave')) {
        if (blob.includes('pala') || blob.includes('frost') || blob.includes('पाला')) {
          score += 20;
        }
      }

      // 9. Fog / Kohra Boost
      if (lowerQuery.includes('kohra') || lowerQuery.includes('कोहरे') || lowerQuery.includes('कोहरा') || lowerQuery.includes('fog')) {
        if (blob.includes('fog') || blob.includes('kohra') || blob.includes('कोहरा')) {
          score += 20;
        }
      }

      // 10. KCC Boost
      if (lowerQuery.includes('kcc') || lowerQuery.includes('किसान क्रेडिट कार्ड')) {
        if (record.id === 'kisan-credit-card-kcc') {
          score += 25;
        }
      }

      // 11. Fertilizer Domain Boost for Fertilizer Queries
      if (lowerQuery.includes('dap') || lowerQuery.includes('डीएपी') || lowerQuery.includes('sulfur') || lowerQuery.includes('सल्फर') || lowerQuery.includes('उर्वरक') || lowerQuery.includes('fertilizer') || lowerQuery.includes('मात्रा')) {
        if (domain === 'fertilizers') {
          score += 25;
        }
      }

      return { record, score, domain };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // ── Format Output Answer in Proper Devanagari ─────────────────────────────
  function formatOfflineAnswer(results, queryInfo) {
    const { detectedLang } = queryInfo;
    const ui = LOCALIZED_UI[detectedLang] || LOCALIZED_UI.en;
    const isHindi = detectedLang === 'hi';

    if (!results || results.length === 0) {
      return `${ui.header}\n${ui.unknown}`;
    }

    const lines = [ui.header];

    results.forEach(item => {
      const rec = item.record;
      let title = isHindi ? (rec.title_hi || rec.title) : rec.title;
      let desc = isHindi ? (rec.description_hi || rec.description) : rec.description;

      lines.push(`\n📌 **${title}**`);
      if (desc) {
        lines.push(`• **${ui.labels.overview}**: ${desc}`);
      }

      const meta = rec.metadata || {};

      if (meta.crop) {
        lines.push(`• **${ui.labels.crop}**: ${meta.crop}`);
      }

      if (meta.symptoms_hi && isHindi) {
        lines.push(`• **${ui.labels.symptoms}**: ${meta.symptoms_hi}`);
      } else if (meta.symptoms) {
        lines.push(`• **${ui.labels.symptoms}**: ${meta.symptoms}`);
      }

      if (meta.organicTreatment_hi && isHindi) {
        lines.push(`• **${ui.labels.organicTreatment}**: ${meta.organicTreatment_hi}`);
      } else if (meta.organicTreatment || meta.organic_treatment) {
        lines.push(`• **${ui.labels.organicTreatment}**: ${meta.organicTreatment || meta.organic_treatment}`);
      }

      if (meta.chemicalTreatment_hi && isHindi) {
        lines.push(`• **${ui.labels.chemicalTreatment}**: ${meta.chemicalTreatment_hi}`);
      } else if (meta.chemicalTreatment || meta.chemical_treatment) {
        lines.push(`• **${ui.labels.chemicalTreatment}**: ${meta.chemicalTreatment || meta.chemical_treatment}`);
      }

      if (meta.preventiveMeasures_hi && isHindi) {
        lines.push(`• **${ui.labels.prevention}**: ${meta.preventiveMeasures_hi}`);
      } else if (meta.preventiveMeasures || meta.prevention) {
        lines.push(`• **${ui.labels.prevention}**: ${meta.preventiveMeasures || meta.prevention}`);
      }

      if (meta.fertilizerAdvisory) {
        lines.push(`• **${ui.labels.fertilizerAdvisory}**: ${meta.fertilizerAdvisory}`);
      }
      if (meta.benefit) {
        lines.push(`• **${ui.labels.benefit}**: ${meta.benefit}`);
      }
      if (meta.voiceResponse && !meta.symptoms) {
        lines.push(`• **${ui.labels.guidance}**: ${meta.voiceResponse}`);
      }

      // Mandi Rates display
      if (rec.category === 'mandi' || meta.cropPrices) {
        lines.push(`• **${ui.labels.mandiRates}**:`);
        if (meta.cropPrices) {
          for (const [cropKey, data] of Object.entries(meta.cropPrices)) {
            lines.push(`  - ${cropKey.toUpperCase()}: ₹${data.price}/Qtl (${data.trend === 'up' ? '📈 Rising' : '📉 Stable'})`);
          }
        } else {
          lines.push(`  - ${rec.title}: ${rec.description}`);
        }
      }
    });

    lines.push(ui.footer);
    return lines.join('\n');
  }

  // ── Core Answer Engine ───────────────────────────────────────────────────
  function answerQuestion(question, options = {}) {
    if (!isLoaded || Object.keys(offlineData).length === 0) {
      init();
    }

    // Phase 6: Hard Non-Agricultural / Irrelevant Query Filter
    const lowerQ = question.toLowerCase();
    const irrelevantWords = [
      'moon', 'চাঁদ', 'चांद', 'car', 'engine', 'इंजन', 'कार', 'space', 'mars',
      'laptop', 'python', 'javascript', 'cricket', 'football', 'फुटबॉल', 'movie'
    ];
    
    // Use word boundary check so 'car' does not match 'card'
    const isIrrelevant = irrelevantWords.some(term => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const reg = new RegExp('(?:^|[^a-zA-Z0-9\u0900-\u0D7F])' + escaped + '(?:$|[^a-zA-Z0-9\u0900-\u0D7F])', 'i');
      return reg.test(lowerQ);
    });

    if (isIrrelevant) {
      const ui = LOCALIZED_UI[detectLanguage(question)] || LOCALIZED_UI.en;
      return {
        success: true,
        reply: `${ui.header}\n${ui.unknown}`,
        source: 'offline_knowledge',
        model: 'local-rag',
        language: detectLanguage(question),
        docCount: 0,
        domains: []
      };
    }

    const { language = 'en' } = options;
    const detectedLang = detectLanguage(question, language);
    const detectedCrop = detectCropInText(question);

    const allDomains = ['diseases', 'pests', 'crops', 'fertilizers', 'irrigation', 'soil', 'weather', 'schemes', 'mandi', 'pesticides', 'faq'];

    let allScoredResults = [];
    const seenIds = new Set();

    allDomains.forEach(domain => {
      const scoredItems = searchDomain(domain, question, detectedCrop, 5);
      scoredItems.forEach(item => {
        if (!seenIds.has(item.record.id)) {
          seenIds.add(item.record.id);
          allScoredResults.push(item);
        }
      });
    });

    allScoredResults.sort((a, b) => b.score - a.score);

    // Phase 6: Hard Unknown Query Threshold Check
    // Require top score >= 4 to ensure relevance
    const topResults = (allScoredResults.length > 0 && allScoredResults[0].score >= 4)
      ? allScoredResults.slice(0, 2)
      : [];

    const reply = formatOfflineAnswer(topResults, {
      detectedLang,
      query: question
    });

    return {
      success: true,
      reply,
      source: 'offline_knowledge',
      model: 'local-rag',
      language: detectedLang,
      docCount: topResults.length,
      domains: Array.from(new Set(topResults.map(m => m.domain)))
    };
  }

  // ── Init Data ─────────────────────────────────────────────────────────────
  function init(bundleData) {
    if (bundleData && typeof bundleData === 'object') {
      offlineData = bundleData.data || bundleData;
      isLoaded = true;
      return true;
    }

    if (typeof window !== 'undefined' && window.KRISHI_OFFLINE_KNOWLEDGE_BUNDLE) {
      const b = window.KRISHI_OFFLINE_KNOWLEDGE_BUNDLE;
      offlineData = b.data || b;
      isLoaded = true;
      return true;
    }

    if (typeof require === 'function') {
      try {
        const fs = require('fs');
        const path = require('path');
        const bundlePath = path.join(__dirname, 'offline-knowledge.json');
        if (fs.existsSync(bundlePath)) {
          const raw = fs.readFileSync(bundlePath, 'utf8');
          const json = JSON.parse(raw);
          offlineData = json.data || json;
          isLoaded = true;
          return true;
        }
      } catch (e) {}
    }

    if (typeof window !== 'undefined' && window.fetch) {
      fetch('/js/offline-knowledge.json')
        .then(res => res.json())
        .then(json => {
          offlineData = json.data || json;
          isLoaded = true;
        })
        .catch(err => {});
    }

    return isLoaded;
  }

  init();

  return {
    init,
    answerQuestion,
    detectLanguage,
    detectCropInText,
    searchDomain,
    getLoadedData: () => offlineData,
    isLoaded: () => isLoaded
  };
}));

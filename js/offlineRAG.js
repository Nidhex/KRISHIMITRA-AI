/* ==========================================================================
   KrishiMitra AI — Offline RAG & Agricultural Knowledge Engine
   Provides zero-latency local agricultural knowledge search when offline.
   Supports: 11 Indian Languages, Native Scripts, Romanized Hindi Input,
              Exact Matching Boosts, and Devanagari Output Generation.
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
    en: 'English', hi: 'हिन्दी', gu: 'ગુજરાતી', mr: 'मराठी',
    bn: 'বাংলা', ta: 'தமிழ்', te: 'తెలుగు', kn: 'ಕನ್ನಡ',
    ml: 'മലയാളം', pa: 'ਪੰਜਾਬੀ', or: 'ଓଡ଼ିଆ'
  };

  // ── Multilingual UI Templates ──────────────────────────────────────────────
  const LOCALIZED_UI = {
    en: {
      header: '📴 **Offline AI — Answer from KrishiMitra\'s local agricultural knowledge**\n',
      unknown: 'I’m offline and I couldn\'t find enough information in my local agricultural knowledge base to answer this accurately. Please reconnect to use the full AI assistant.',
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
      unknown: 'क्षमा करें, मैं ऑफ़लाइन हूँ और मुझे अपने स्थानीय कृषि ज्ञानकोष में इस प्रश्न का सटीक उत्तर नहीं मिला। संपूर्ण AI सहायता के लिए कृपया इंटरनेट से जुड़ें।',
      footer: '\n*(कृषि मित्र के पहले से सहेजे गए स्थानीय ज्ञानकोष से जनरेट किया गया ऑफ़लाइन उत्तर)*',
      labels: {
        overview: 'विवरण', crop: 'फसल', symptoms: 'रोग के लक्षण', organicTreatment: '🌿 जैविक उपचार',
        chemicalTreatment: '🧪 रासायनिक उपचार', prevention: '🛡️ बचाव व रोकथाम के उपाय', dosage: '⚖️ खुराक / मात्रा',
        applicationMethod: '💧 छिड़काव / प्रयोग विधि', precautions: '⚠️ सावधानियां', application: '🌾 खाद प्रयोग सलाह',
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
        soilType: '🏔️ मातीचा प्रकार', healthScore: '📊 आरोग्य स्कोअर', moisture: '💧 ओलावा', eligibility: '📋 पात्रता',
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

  // ── Comprehensive Hindi Devanagari Terminology Translation Map ──────────────
  const HINDI_TRANSLATION_MAP = {
    // Record Titles
    'Wheat Yellow Rust / Yellow Leaves (Gehun me Peeli Pattiyan / Peela Rog)': 'गेहूं का पीला रतुआ / पीली पत्तियां (नाइट्रोजन कमी या रतुआ रोग)',
    'Aphids / Mustard-Wheat Aphid (Chepa / Maho / Keede)': 'माहो / चेपा / कीड़े (एफिड्स कीट प्रकोप)',
    'Rice Blast (Dhaan ka Jhonka Rog)': 'धान का झोंका रोग (राइस ब्लास्ट)',
    'Cotton Leaf Curl (Kapas ka Patta Marod Rog)': 'कपास पत्ती मरोड़ रोग (लीफ कर्ल)',
    'Early Blight (Ageti Jhulsa Rog)': 'टमाटर का अगेती झुलसा रोग (अर्ली ब्लाइट)',
    'Wheat (Lokwan)': 'गेहूं (लोकवन किस्म)',
    'Paddy (Basmati)': 'धान / चावल (बासमती किस्म)',
    'Tomato (Desi)': 'टमाटर (देसी किस्म)',
    'Potato (Jyoti)': 'आलू (ज्योति किस्म)',
    'Mustard Seed': 'सरसों की फसल',
    'Urea (Nitrogen Fertilizer)': 'यूरिया (नाइट्रोजन उर्वरक)',
    'DAP (Phosphorus Fertilizer)': 'डीएपी (फास्फोरस उर्वरक)',
    'Organic Cow Compost (Gobhar Khad)': 'जैविक गोबर खाद (देसी कंपोस्ट)',
    'Zinc Sulphate (Micronutrient)': 'जिंक सल्फेट (सूक्ष्म पोषक तत्व)',
    'Tricyclazole 75 WP (Rice Blast Treatment)': 'ट्राइसाइक्लाज़ोल 75 WP (धान झोंका रोग नाशी)',
    'Neem Oil Formulation 3000 ppm (Organic)': 'नीम तेल (3000 ppm) जैविक कीटनाशक',
    'Imidacloprid 17.8 SL (Cotton Whitefly Control)': 'इमिडाक्लोप्रिड 17.8 SL (कपास सफेद मक्खी कीटनाशक)',
    'Mancozeb 75 WP (Tomato Early Blight Treatment)': 'मैन्कोज़ेब 75 WP (अगेती झुलसा फफूंदनाशी)',
    'Trichoderma (Bio-Pesticide Fungal Control)': 'ट्राइकोडरमा (जैविक फफूंदनाशी)',
    'Alluvial Clay-Loam Soil (Domat Mitti)': 'जलोढ़ दोमट मिट्टी (नदी मैदानी क्षेत्र)',
    'Black Clayey Soil (Kaali Mitti)': 'काली मिट्टी (रेगुर मिट्टी)',
    'PM Kisan Samman Nidhi Yojana': 'पीएम किसान सम्मान निधि योजना',
    'PM Kisan Samman Nidhi': 'पीएम किसान सम्मान निधि योजना',
    'Pradhan Mantri Fasal Bima Yojana (PMFBY)': 'प्रधानमंत्री फसल बीमा योजना (PMFBY)',
    'PM KUSUM Solar Pump Scheme': 'पीएम कुसुम सोलर पंप योजना',
    'PM KUSUM Yojana (Solar Pumps)': 'पीएम कुसुम सोलर पंप योजना',
    'Soil Health Card Scheme': 'मृदा स्वास्थ्य कार्ड योजना',
    'Paramparagat Krishi Vikas Yojana (PKVY)': 'पारम्परागत कृषि विकास योजना (PKVY)',
    'Sub-Mission on Agricultural Mechanization (SMAM)': 'कृषि यंत्रीकरण उप-मिशन (SMAM)',
    'Per Drop More Crop (PDMC - PMKSY)': 'प्रति बूंद अधिक फसल (ड्रिप/स्प्रिंकलर सिंचाई योजना)',

    // Record Descriptions & Metadata Strings
    'Yellowing of wheat leaves (peeli pattiyan) caused by Nitrogen deficiency, water logging, or Yellow Rust (Puccinia striiformis) fungal infection.': 'गेहूं की पत्तियां पीली होने के कई कारण हो सकते हैं, जैसे नाइट्रोजन की कमी, खेत में अत्यधिक पानी का जमाव (जलभराव) या पीला रतुआ फफूंद रोग।',
    'Wheat (Gehun)': 'गेहूं की फसल',
    'Yellow stripes or complete yellowing of wheat leaves (peeli pattiyan), stunted growth, reduced tillering.': 'गेहूं की पत्तियों पर पीली धारियां या पत्तियों का पीला पड़ना, पौधे का विकास रुकना तथा कल्ले कम बनना।',
    'Apply organic cow compost (gobhar khad) and neem oil spray (3 ml/liter). Ensure proper field drainage to clear stagnant water.': 'खेत में अच्छी सड़ी हुई गोबर की जैविक खाद का प्रयोग करें तथा नीम के तेल (3 मिली/लीटर) का छिड़काव करें। जल निकासी की उचित व्यवस्था करें।',
    'Apply Urea (25kg/acre) for nitrogen deficiency. Spray Propiconazole 25 EC (1 ml per liter of water) for fungal yellow rust.': 'नाइट्रोजन कमी के लिए 25 किग्रा/एकड़ यूरिया की टॉप ड्रेसिंग करें। पीला रतुआ फफूंद दिखने पर प्रोपिकोनाज़ोल 25 EC (1 मिली/लीटर पानी) का छिड़काव करें।',
    'Avoid over-irrigation, maintain field drainage, use resistant wheat seed varieties (e.g., HD-2967, DBW-187), and apply balanced NPK fertilizers.': 'अत्यधिक सिंचाई से बचें, खेत में जल निकासी रखें, रोग प्रतिरोधी किस्मों (HD-2967, DBW-187) का प्रयोग करें तथा संतुलित उर्वरक डालें।',
    'Small sap-sucking insects causing leaf yellowing, curling, and honeydew mold on crops.': 'छोटे रस चूसक कीड़े जो फसल की पत्तियों का रस चूसकर पत्तियों को पीला और मुड़ा हुआ बना देते हैं।',
    'Clusters of tiny green/black aphids on undersides of leaves and stems, leaf yellowing, sticky honeydew emission.': 'पत्तियों और तनों पर हरे/काले कीड़ों का जमावड़ा, पत्तियों का पीला पड़ना तथा चिपचिपा पदार्थ।',
    'Spray Neem oil (3,000 ppm) at 3-5 ml per liter of water with soap solution, or release ladybird beetles.': 'नीम तेल (3000 ppm) 3-5 मिली/लीटर पानी में साबुन घोल के साथ छिड़कें।',
    'Spray Imidacloprid 17.8 SL at 0.5 ml per liter of water or Dimethoate 30 EC at 1.5 ml per liter.': 'इमिडाक्लोप्रिड 17.8 SL (0.5 मिली/लीटर) या डाइमेथोएट 30 EC (1.5 मिली/लीटर) का छिड़काव करें।',
    'Install yellow sticky traps (10-12 traps per acre), monitor field weekly, preserve natural predators.': 'प्रति एकड़ 10-12 पीले चिपचिपे ट्रैप (Yellow Sticky Traps) लगाएं।',
    'Primary nitrogen source fertilizer. Should not be applied before or during rain events to avoid wash-off and loss.': 'फसल का मुख्य नाइट्रोजन उर्वरक। बारिश के दौरान या ठीक पहले इसका छिड़काव न करें ताकि दवा बहकर व्यर्थ न हो।',
    '25kg Nitrogen (Urea) per acre for Alluvial Clay-Loam soil': 'जलोढ़ दोमट मिट्टी के लिए प्रति एकड़ 25 किग्रा यूरिया (नाइट्रोजन)',
    'Di-Ammonium Phosphate - primary phosphorus and secondary nitrogen source for most crops.': 'डाई-अमोनियम फास्फेट — फसलों के लिए मुख्य फास्फोरस एवं नाइट्रोजन स्रोत।',
    '15kg Phosphorus (DAP) per acre for Alluvial Clay-Loam soil': 'जलोढ़ दोमट मिट्टी के लिए प्रति एकड़ 15 किग्रा डीएपी',
    'Farm yard manure / organic compost that improves soil organic carbon, water retention, and microbial activity.': 'देशी गोबर खाद जो मिट्टी में जैविक कार्बन, जलधारण क्षमता और सूक्ष्मजीवों को बढ़ाती है।',
    'Mix 5 tons organic cow compost (gobhar khad) per acre. For Black Clayey Soil: regular compost is sufficient.': 'प्रति एकड़ 5 टन सड़ी गोबर खाद मिलाएं। काली मिट्टी में सामान्य कंपोस्ट पर्याप्त है।',
    'Zinc micronutrient fertilizer used in Black Clayey Soil to enhance micronutrient availability.': 'काली मिट्टी में जिंक की कमी दूर करने और सूक्ष्म पोषक तत्व बढ़ाने वाला उर्वरक।',
    'Add 10kg Zinc Sulphate per acre to enhance micro-nutrients in Black Clayey Soil': 'काली मिट्टी में सूक्ष्म पोषक तत्वों के लिए प्रति एकड़ 10 किग्रा जिंक सल्फेट डालें।',
    'Common soil type in UP river plains. Low organic matter, medium water retention. Suitable for wheat, potato, mustard, and gram.': 'उत्तर प्रदेश के मैदानी क्षेत्रों में पाई जाने वाली उपजाऊ मिट्टी। गेहूं, आलू, सरसों और चना की खेती के लिए सर्वोत्तम।',
    'High organic matter, high water retention soil type. Excellent for cotton, soybeans, pigeon pea, and paddy.': 'उच्च जलधारण क्षमता और पोषक तत्वों से भरपूर मिट्टी। कपास, सोयाबीन, अरहर और धान की खेती के लिए अत्यंत उत्तम।',
    'Alluvial Clay-Loam': 'जलोढ़ दोमट मिट्टी',
    'Domat Mitti': 'दोमट मिट्टी',
    'Black Clayey Soil': 'काली मिट्टी',
    'Kaali Mitti / Regur Soil': 'काली मिट्टी / रेगुर मिट्टी',
    'Direct income support of Rs.6,000 per year in three equal installments to all landholding farmer families across India to help purchase inputs.': 'देश के सभी भूस्वामी किसान परिवारों को कृषि इनपुट खरीदने के लिए प्रति वर्ष ₹6,000 की प्रत्यक्ष आय सहायता (तीन समान किस्तों में)।',
    'Rs.6,000 / Year Cash Assistance (Direct Benefit Transfer)': '₹6,000 प्रति वर्ष नकद सहायता (डीबीटी के माध्यम से सीधे बैंक खाते में)',
    'Financial support and risk coverage for farmers suffering crop loss or damage due to natural calamities, pests, and diseases.': 'प्राकृतिक आपदाओं, कीटों और रोगों के कारण फसल नुकसान पर किसानों को वित्तीय सुरक्षा एवं बीमा कवर।',
    'Low Premium Crop Insurance (1.5% - 2% Premium for Rabi/Kharif crops)': 'कम प्रीमियम पर फसल बीमा (रबी/खरीफ फसलों के लिए केवल 1.5% से 2% प्रीमियम)',
    'De-dieselization of the farm sector. Install clean solar water pumps with 60% combined subsidy from Central and State Governments.': 'सिंचाई को डीजल मुक्त बनाना। केंद्र और राज्य सरकार की ओर से 60% सब्सिडी पर सोलर वाटर पंप स्थापना।',
    '60% Subsidy on Solar Water Pump Installation': 'सोलर वाटर पंप स्थापना पर 60% तक सरकारी सब्सिडी',
    'Provides soil testing services to help farmers understand the nutrient status of their soil and receive recommendations on fertilizer dosage.': 'किसानों को मिट्टी की जांच सुविधा प्रदान करना तथा पोषक तत्वों की स्थिति एवं उर्वरक मात्रा की सलाह देना।',
    'Free Soil Health Testing and Advisory Card': 'निःशुल्क मिट्टी जांच एवं मृदा स्वास्थ्य कार्ड',
    'Supports organic farming in clusters. Financial assistance of Rs.50,000 per hectare for 3 years is provided for organic inputs, certification, and packaging.': 'क्लस्टर में जैविक खेती को बढ़ावा देना। जैविक खाद, प्रमाणीकरण और पैकिंग के लिए 3 वर्षों में ₹50,000 प्रति हेक्टेयर की वित्तीय सहायता।',
    'Rs.50,000 / Hectare Subsidy for organic cultivation and certification': '₹50,000 प्रति हेक्टेयर सब्सिडी (जैविक खेती एवं प्रमाणीकरण)',
    'Assistance for procurement of modern agricultural machinery (tractors, tillers, harvesters, rotavators) to reduce labor costs and increase efficiency.': 'आधुनिक कृषि यंत्रों (ट्रैक्टर, रोटावेटर, थ्रेशर) की खरीद पर सब्सिडी ताकि खेती की लागत घटे।',
    '40% to 50% Subsidy on Agricultural Equipment (up to 80% for SC/ST/Women/Small farmers)': 'कृषि उपकरणों पर 40% से 50% तक सब्सिडी (छोटे/सीमांत किसानों के लिए 80% तक)',
    'Promotes micro-irrigation systems like drip and sprinkler setups to enhance water-use efficiency and crop productivity.': 'ड्रिप और स्प्रिंकलर जैसी सूक्ष्म सिंचाई प्रणालियों को बढ़ावा देना ताकि पानी की बचत और पैदावार बढ़े।',
    '45% to 55% Subsidy on Drip and Sprinkler Irrigation Systems': 'ड्रिप और स्प्रिंकलर सिंचाई प्रणाली पर 45% से 55% तक सब्सिडी',
    'Spindle-shaped lesions on leaves with grayish centers. Spreads rapidly in high humidity conditions. Reported in Kishanpur block farms.': 'पत्तियों पर सलेटी केंद्र वाले नाव के आकार के धब्बे। उच्च नमी में तेजी से फैलता है।'
  };

  // Helper to translate arbitrary text to Devanagari Hindi if translation exists
  function translateToHindiDevanagari(text) {
    if (!text || typeof text !== 'string') return text;
    const clean = text.trim();
    if (HINDI_TRANSLATION_MAP[clean]) {
      return HINDI_TRANSLATION_MAP[clean];
    }
    let res = clean;
    res = res.replace(/\bWheat\b/gi, 'गेहूं')
             .replace(/\bPaddy\b/gi, 'धान')
             .replace(/\bRice\b/gi, 'चावल')
             .replace(/\bCotton\b/gi, 'कपास')
             .replace(/\bTomato\b/gi, 'टमाटर')
             .replace(/\bPotato\b/gi, 'आलू')
             .replace(/\bMustard\b/gi, 'सरसों')
             .replace(/\bFertilizer\b/gi, 'उर्वरक')
             .replace(/\bSoil\b/gi, 'मिट्टी')
             .replace(/\bYellow Rust\b/gi, 'पीला रतुआ')
             .replace(/\bYellow Leaves\b/gi, 'पीली पत्तियां')
             .replace(/\bEarly Blight\b/gi, 'अगेती झुलसा')
             .replace(/\bRice Blast\b/gi, 'धान का झोंका रोग');

    return res;
  }

  // ── Multilingual Synonyms Dictionary ──────────────────────────────────────
  const MULTILINGUAL_SYNONYMS = {
    // Crops
    'कपास': 'cotton kapas', 'કપાસ': 'cotton kapas', 'कापूस': 'cotton kapas', 'तुला': 'cotton', 'பருத்தி': 'cotton', 'ప్రత్తి': 'cotton', 'kapas': 'cotton kapas', 'cotton': 'cotton kapas',
    'धान': 'rice paddy dhaan dhan chawal', 'ડાંગર': 'rice paddy dhaan', 'भात': 'rice paddy', 'ধান': 'rice paddy', 'நெல்': 'rice paddy', 'వరి': 'rice paddy', 'dhaan': 'rice paddy dhaan chawal', 'dhan': 'rice paddy dhaan', 'chawal': 'rice paddy chawal', 'paddy': 'rice paddy dhaan', 'rice': 'rice paddy dhaan', 'basmati': 'rice paddy basmati',
    'गेहूं': 'wheat gehun gehu kanak', 'गेहु': 'wheat gehun gehu', 'घऊं': 'wheat gehun', 'गहू': 'wheat gehun', 'গম': 'wheat', 'கோதுமை': 'wheat', 'ગોધુમ': 'wheat', 'gehu': 'wheat gehun gehu', 'gehun': 'wheat gehun gehu', 'wheat': 'wheat gehun gehu', 'lokwan': 'wheat lokwan', 'kanak': 'wheat gehun kanak',
    'टमाटर': 'tomato tamatar', 'ટામેટા': 'tomato tamatar', 'टोमॅटो': 'tomato tamatar', 'টমেটো': 'tomato', 'தக்காளி': 'tomato', 'tamatar': 'tomato tamatar', 'tomato': 'tomato tamatar', 'desi': 'tomato desi',
    'आलू': 'potato aalu aloo jyoti', 'બટાકા': 'potato aalu', 'बटाटा': 'potato aalu', 'আলু': 'potato', 'aalu': 'potato aalu aloo', 'aloo': 'potato aalu aloo', 'potato': 'potato aalu aloo', 'jyoti': 'potato jyoti',
    'गन्ना': 'sugarcane ganna', 'શેરડી': 'sugarcane ganna', 'ऊस': 'sugarcane ganna', 'ganna': 'sugarcane ganna', 'sugarcane': 'sugarcane ganna',
    'मक्का': 'maize corn makka', 'મકાઈ': 'maize corn makka', 'मका': 'maize corn makka', 'makka': 'maize corn makka', 'maize': 'maize corn makka', 'corn': 'maize corn makka',
    'सरसों': 'mustard sarson', 'રાયડો': 'mustard sarson', 'मोहरी': 'mustard sarson', 'sarson': 'mustard sarson', 'mustard': 'mustard sarson',

    // Symptoms & Issues / Yellow Leaves / Wheat Disease
    'पीली': 'yellow peeli peela yellowing leaves rust rust-disease',
    'पीले': 'yellow yellowing peeli peela pila', 'पीला': 'yellow yellowing peeli peela pila', 'પીળા': 'yellow peeli peela', 'पिवळे': 'yellow peeli peela', 'peele': 'yellow yellowing peeli peela', 'peela': 'yellow yellowing peeli peela', 'pila': 'yellow yellowing peeli peela', 'peeli': 'yellow yellowing peeli peela', 'yellow': 'yellow yellowing peeli peela', 'yellowing': 'yellow yellowing peeli peela',
    'पत्तियां': 'leaf leaves patta pattiyan yellowing',
    'पत्ते': 'leaf leaves patte patta pan paan pattiyan', 'पत्ता': 'leaf leaves patte patta pattiyan', 'पत्तिया': 'leaf leaves patte patta pattiyan', 'पाने': 'leaf leaves patte', 'পাতা': 'leaf leaves', 'இலை': 'leaf leaves', 'patte': 'leaf leaves patte patta pattiyan', 'patta': 'leaf leaves patte patta pattiyan', 'pattiyan': 'leaf leaves patte patta pattiyan', 'pan': 'leaf leaves', 'paan': 'leaf leaves', 'leaf': 'leaf leaves patte patta pattiyan', 'leaves': 'leaf leaves patte patta pattiyan',
    'रोग': 'disease blast rust blight spot attack rog bimari infection', 'રોગ': 'disease rog bimari', 'রোগ': 'disease rog', 'நோய்': 'disease rog', 'rog': 'disease rog bimari', 'bimari': 'disease rog bimari', 'disease': 'disease rog bimari', 'infection': 'disease rog infection',
    'धब्बे': 'spot blast blight jhulsa jhonka', 'स्पॉट': 'spot', 'झुलसा': 'blight blast jhulsa', 'झोंका': 'blast jhonka', 'blast': 'blast jhonka', 'blight': 'blight jhulsa', 'rust': 'rust peela rog', 'canker': 'canker',
    'कीड़े': 'pest insect caterpillar aphid whitefly keede keeda chepa maho', 'जीवात': 'pest insect keede', 'पोका': 'pest insect', 'keede': 'pest insect caterpillar aphid keede keeda chepa maho', 'keeda': 'pest insect caterpillar aphid keede keeda chepa maho', 'aphid': 'aphid insect pest chepa maho keede', 'aphids': 'aphid insect pest chepa maho keede', 'whitefly': 'whitefly insect pest', 'chepa': 'aphid pest chepa maho keede', 'maho': 'aphid pest chepa maho keede',

    // Soil & Black Soil
    'काली': 'black kaali mitti clayey regur kaalii',
    'मिट्टी': 'soil mitti clay loam alluvial kaali domat maati janch', 'માટી': 'soil clay loam mitti', 'जमीन': 'soil land mitti', 'माती': 'soil mitti', 'mitti': 'soil clay loam alluvial black mitti maati janch', 'soil': 'soil clay loam alluvial black mitti maati janch', 'janch': 'soil test testing health score janch', 'test': 'soil test testing janch', 'testing': 'soil test testing janch', 'kaali': 'black kaali mitti clayey regur kaalii', 'black': 'black kaali mitti clayey regur', 'domat': 'alluvial clay loam soil domat mitti',

    // PM Kisan & Schemes
    'पीएम': 'pm kisan samman yojana 6000 subsidy scheme',
    'किसान': 'kisan farmer yojana pm-kisan samman',
    'योजना': 'scheme subsidy pm kisan pmfby kusum yojana', 'યોજના': 'scheme subsidy yojana', 'yojana': 'scheme subsidy pm kisan pmfby kusum yojana', 'subsidy': 'subsidy scheme yojana', 'scheme': 'scheme subsidy yojana', 'bima': 'insurance claim crop insurance pmfby bima',
    'pm': 'pm kisan samman yojana 6000 subsidy scheme',
    'kisan': 'kisan farmer yojana pm-kisan samman',

    // Fertilizer & Soil
    'उर्वरक': 'fertilizer urea dap npk compost khad urvarak dosage',
    'खाद': 'fertilizer urea dap npk compost khad khaad gobhar urvarak', 'ખાતર': 'fertilizer urea dap npk khad', 'खत': 'fertilizer khad', 'সার': 'fertilizer khad', 'உரம்': 'fertilizer khad', 'khad': 'fertilizer urea dap npk compost khad khaad gobhar', 'khaad': 'fertilizer urea dap npk khad khaad gobhar', 'khatar': 'fertilizer khad', 'fertilizer': 'fertilizer urea dap npk compost khad khaad gobhar urvarak', 'urea': 'urea nitrogen fertilizer khad', 'dap': 'dap phosphorus fertilizer khad', 'gobhar': 'organic compost fertilizer gobhar khad', 'nitrogen': 'nitrogen urea fertilizer', 'phosphorus': 'phosphorus dap fertilizer', 'compost': 'organic compost fertilizer gobhar khad',
    'यूरिया': 'urea nitrogen fertilizer khad',
    'urvarak': 'fertilizer urea dap npk compost khad urvarak',
    'दवा': 'pesticide medicine spray treatment fungicide insecticide dawa upchar upay', 'દવા': 'pesticide medicine spray dawa', 'औषध': 'pesticide medicine spray', 'dawa': 'pesticide medicine spray treatment fungicide insecticide dawa upchar upay', 'spray': 'pesticide spray dawa', 'upchar': 'treatment remedy cure upchar', 'upay': 'treatment remedy cure upay', 'cure': 'treatment remedy cure', 'treatment': 'treatment remedy upchar', 'fungicide': 'fungicide pesticide dawa', 'insecticide': 'insecticide pesticide dawa',

    // Disease & Rice Blast
    'धान': 'paddy rice dhaan dhan chawal',
    'ब्लास्ट': 'blast jhonka rice blast tricyclazole',
    'झोंका': 'blast jhonka rice blast tricyclazole',

    // Mandi & Price
    'भाव': 'mandi price rate apmc quintal bhav dam', 'ભાવ': 'mandi price rate apmc bhav', 'દર': 'mandi price rate', 'bhav': 'mandi price rate apmc bhav dam', 'price': 'mandi price rate bhav dam', 'rate': 'mandi price rate bhav dam', 'mandi': 'mandi price market apmc', 'dam': 'price rate dam',

    // Weather
    'मौसम': 'weather rain temperature forecast advisory mausam barish', 'હવામાન': 'weather rain forecast mausam', 'पाऊस': 'rain weather barish', 'mausam': 'weather rain temperature forecast mausam barish', 'barish': 'rain weather barish', 'weather': 'weather rain forecast advisory mausam barish', 'rain': 'rain weather barish'
  };

  // ── Stop Words List ────────────────────────────────────────────────────────
  const STOP_WORDS = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but',
    'if', 'so', 'my', 'me', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'this', 'that', 'these', 'those', 'with', 'from', 'by', 'about',
    'what', 'why', 'how', 'when', 'where', 'which', 'who', 'should',
    'में', 'का', 'की', 'के', 'को', 'से', 'ने', 'पर', 'भी', 'और', 'या',
    'है', 'हैं', 'था', 'थे', 'थी', 'हो', 'रहा', 'रही', 'रहे', 'हुआ', 'हुए', 'हुई',
    'क्या', 'क्यों', 'कैसे', 'किस', 'कब', 'कहां', 'कौन', 'कौनसा', 'कौनसी', 'कौनसे',
    'कर', 'करें', 'करो', 'करने', 'करना', 'चाहिए', 'लिए', 'साथ', 'आप', 'मेरा', 'मेरी', 'मेरे',
    'ke', 'ka', 'ki', 'ko', 'se', 'me', 'mein', 'hai', 'hain', 'tha', 'the', 'thi',
    'kya', 'kyun', 'kyu', 'kaise', 'kese', 'kaunsa', 'kaun', 'chahiye', 'karu', 'kare',
    'karein', 'karne', 'rahi', 'raha', 'rahe', 'hoye', 'ho', 'gaye', 'gaya', 'mera', 'meri', 'mere', 'aap'
  ]);

  // ── Language & Script Detection (Supports Native Scripts + Romanized Hindi -> Devanagari) ──
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

    // Pure Latin text without Romanized Hindi markers -> English
    if (/^[a-zA-Z0-9\s.,?!'\-"]+$/.test(clean) && !/\b(meri|mera|mere|fasal|keede|keeda|lag|gaye|gaya|kya|kare|karu|hoye|hai|hain|upchar|dawa|mausam|barish|peele|patte|peeli|pattiyan|janch|kaunsa|gehu|gehun|kaise|kisi|yojana|kaali|mitti|urvarak|dhaan|rog)\b/.test(lower)) {
      return 'en';
    }

    // Romanized markers -> Normalizes Romanized Hindi to Hindi ('hi')
    if (/\b(meri|mera|mere|fasal|keede|keeda|lag|gaye|gaya|kya|kare|karu|hoye|hai|hain|upchar|dawa|mausam|barish|peele|patte|peeli|pattiyan|janch|kaunsa|gehu|gehun|kaise|kisi|yojana|kaali|mitti|urvarak|dhaan|rog)\b/.test(lower)) {
      return 'hi';
    }
    if (/\b(su|rog|che|khedut|kheti|pan|paan|kem|cho|chhe)\b/.test(lower)) return 'gu';
    if (/\b(sheti|pik|aajar|khat|ahe|pivale|fawarani)\b/.test(lower)) return 'mr';

    return (fallbackLang && SUPPORTED_LANGUAGES[fallbackLang]) ? fallbackLang : 'en';
  }

  // ── Extract & Expand Keywords ──────────────────────────────────────────────
  function extractAndExpandKeywords(question) {
    const rawTokens = question
      .toLowerCase()
      .replace(/[^\w\s\u0900-\u0D7F]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !STOP_WORDS.has(w));

    const expandedTerms = new Set();

    rawTokens.forEach(token => {
      expandedTerms.add(token);
      for (const [key, synonym] of Object.entries(MULTILINGUAL_SYNONYMS)) {
        const kLower = key.toLowerCase();
        if (token === kLower || token.includes(kLower) || kLower.includes(token)) {
          synonym.split(' ').forEach(s => expandedTerms.add(s));
        }
      }
    });

    const termsArray = Array.from(expandedTerms);
    return {
      terms: rawTokens,
      expandedQuery: termsArray.join(' ')
    };
  }

  // ── Build Search Blob from Record ──────────────────────────────────────────
  function buildSearchBlob(record) {
    const parts = [
      record.id || '',
      record.category || '',
      record.title || '',
      record.description || ''
    ];

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

  // ── Search Domain ──────────────────────────────────────────────────────────
  function searchDomain(domain, query, limit = 5) {
    const records = offlineData[domain] || [];
    if (!query || records.length === 0) return [];

    const lowerQuery = query.toLowerCase();
    const terms = lowerQuery.split(/\s+/).filter(w => w.length >= 2 && !STOP_WORDS.has(w));
    if (terms.length === 0) return [];

    const scored = records.map(record => {
      const blob = buildSearchBlob(record).toLowerCase();
      let score = 0;
      terms.forEach(term => {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordRegex = new RegExp('(?:^|[^a-zA-Z0-9\u0900-\u0D7F])' + escaped + '(?:$|[^a-zA-Z0-9\u0900-\u0D7F])', 'i');
        if (wordRegex.test(blob)) {
          score += 2;
          if ((record.title && record.title.toLowerCase().includes(term)) ||
              (record.id && record.id.toLowerCase().includes(term))) {
            score += 3;
          }
        } else if (term.length >= 3 && blob.includes(term)) {
          score += 1;
        }
      });

      // ── Specific Query Phrase Boosts ──
      const recordTitleLower = (record.title || '').toLowerCase();
      const recordIdLower = (record.id || '').toLowerCase();

      // Black Soil boost
      if ((lowerQuery.includes('काली') || lowerQuery.includes('kaali') || lowerQuery.includes('black soil')) &&
          (recordTitleLower.includes('black') || recordTitleLower.includes('kaali') || recordIdLower.includes('black'))) {
        score += 15;
      }

      // PM-Kisan Scheme boost
      if ((lowerQuery.includes('पीएम किसान') || lowerQuery.includes('pm kisan') || lowerQuery.includes('pm-kisan')) &&
          (recordTitleLower.includes('pm kisan') || recordIdLower.includes('pm-kisan'))) {
        score += 15;
      }

      // Wheat Yellow Rust / Yellow Leaves boost
      if ((lowerQuery.includes('पीली') || lowerQuery.includes('peeli') || lowerQuery.includes('yellow')) &&
          (lowerQuery.includes('गेहूं') || lowerQuery.includes('gehu') || lowerQuery.includes('wheat')) &&
          (recordTitleLower.includes('yellow') || recordTitleLower.includes('peeli') || recordIdLower.includes('yellow'))) {
        score += 15;
      }

      // Rice Blast boost
      if ((lowerQuery.includes('ब्लास्ट') || lowerQuery.includes('blast') || lowerQuery.includes('झोंका')) &&
          (recordTitleLower.includes('blast') || recordIdLower.includes('blast'))) {
        score += 15;
      }

      // Fertilizer boost
      if ((lowerQuery.includes('उर्वरक') || lowerQuery.includes('fertilizer') || lowerQuery.includes('यूरिया') || lowerQuery.includes('डीएपी')) &&
          domain === 'fertilizers') {
        score += 12;
      }

      // Soil testing / soil health card boost
      if ((lowerQuery.includes('जांच') || lowerQuery.includes('testing') || lowerQuery.includes('janch')) &&
          (domain === 'soil' || recordIdLower.includes('soil-health'))) {
        score += 12;
      }

      return { record, score, domain };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // ── Multilingual Answer Formatter ──────────────────────────────────────────
  function formatOfflineAnswer(results, queryInfo) {
    const { detectedLang } = queryInfo;
    const ui = LOCALIZED_UI[detectedLang] || LOCALIZED_UI.en;
    const labels = ui.labels;
    const isHindi = detectedLang === 'hi';

    let header = ui.header;

    if (!results || results.length === 0) {
      return `${header}\n${ui.unknown}`;
    }

    const lines = [header];

    results.forEach(item => {
      const rec = item.record;
      let title = rec.title || rec.id;
      let description = rec.description || '';

      if (isHindi) {
        title = translateToHindiDevanagari(title);
        description = translateToHindiDevanagari(description);
      }

      lines.push(`\n📌 **${title}**`);

      if (description) {
        lines.push(`• **${labels.overview}**: ${description}`);
      }

      if (rec.metadata) {
        const meta = rec.metadata;
        if (meta.crop) {
          const val = isHindi ? translateToHindiDevanagari(meta.crop) : meta.crop;
          lines.push(`• **${labels.crop}**: ${val}`);
        }
        if (meta.symptoms) {
          const val = isHindi ? translateToHindiDevanagari(meta.symptoms) : meta.symptoms;
          lines.push(`• **${labels.symptoms}**: ${val}`);
        }

        if (meta.organicTreatment) {
          const val = isHindi ? translateToHindiDevanagari(meta.organicTreatment) : meta.organicTreatment;
          lines.push(`• ${labels.organicTreatment}: ${val}`);
        }
        if (meta.chemicalTreatment) {
          const val = isHindi ? translateToHindiDevanagari(meta.chemicalTreatment) : meta.chemicalTreatment;
          lines.push(`• ${labels.chemicalTreatment}: ${val}`);
        }
        if (meta.preventiveMeasures) {
          const val = isHindi ? translateToHindiDevanagari(meta.preventiveMeasures) : meta.preventiveMeasures;
          lines.push(`• ${labels.prevention}: ${val}`);
        }
        if (meta.dosage) {
          const val = isHindi ? translateToHindiDevanagari(meta.dosage) : meta.dosage;
          lines.push(`• ${labels.dosage}: ${val}`);
        }
        if (meta.applicationMethod) {
          const val = isHindi ? translateToHindiDevanagari(meta.applicationMethod) : meta.applicationMethod;
          lines.push(`• ${labels.applicationMethod}: ${val}`);
        }
        if (meta.precautions) {
          const val = isHindi ? translateToHindiDevanagari(meta.precautions) : meta.precautions;
          lines.push(`• ${labels.precautions}: ${val}`);
        }

        if (meta.application) {
          const val = isHindi ? translateToHindiDevanagari(meta.application) : meta.application;
          lines.push(`• ${labels.application}: ${val}`);
        }
        if (meta.fertilizerAdvisory) {
          const val = isHindi ? translateToHindiDevanagari(meta.fertilizerAdvisory) : meta.fertilizerAdvisory;
          lines.push(`• ${labels.fertilizerAdvisory}: ${val}`);
        }
        if (meta.timing) {
          const val = isHindi ? translateToHindiDevanagari(meta.timing) : meta.timing;
          lines.push(`• ${labels.timing}: ${val}`);
        }

        if (meta.recommendedCrops) {
          const cropsList = Array.isArray(meta.recommendedCrops) ? meta.recommendedCrops.join(', ') : meta.recommendedCrops;
          const val = isHindi ? translateToHindiDevanagari(cropsList) : cropsList;
          lines.push(`• ${labels.suitableCrops}: ${val}`);
        }

        if (meta.soilType) {
          const val = isHindi ? translateToHindiDevanagari(meta.soilType) : meta.soilType;
          lines.push(`• ${labels.soilType}: ${val}`);
        }
        if (meta.healthScore) lines.push(`• ${labels.healthScore}: ${meta.healthScore}`);
        if (meta.moisture) lines.push(`• ${labels.moisture}: ${meta.moisture}`);

        if (meta.eligibility) lines.push(`• ${labels.eligibility}: ${meta.eligibility}`);
        if (meta.benefit) {
          const val = isHindi ? translateToHindiDevanagari(meta.benefit) : meta.benefit;
          lines.push(`• ${labels.benefit}: ${val}`);
        }
        if (meta.voiceResponse) {
          const val = isHindi ? translateToHindiDevanagari(meta.voiceResponse) : meta.voiceResponse;
          lines.push(`• ${labels.guidance}: ${val}`);
        }

        if (meta.mandiPrices) {
          const mp = meta.mandiPrices;
          if (typeof mp === 'object' && mp.highest) {
            lines.push(`• ${labels.mandiRates}: Highest ₹${mp.highest}/Qtl (${mp.highestMandi || ''}), Lowest ₹${mp.lowest}/Qtl (${mp.lowestMandi || ''})`);
          }
        }
        if (meta.marketRecommendation) {
          const val = isHindi ? translateToHindiDevanagari(meta.marketRecommendation) : meta.marketRecommendation;
          lines.push(`• ${labels.marketAdvice}: ${val}`);
        }
      }
    });

    lines.push(ui.footer);
    return lines.join('\n');
  }

  // ── Main Search & Answer Generation ────────────────────────────────────────
  function answerQuestion(question, options = {}) {
    // Ensure data is loaded
    if (!isLoaded || Object.keys(offlineData).length === 0) {
      init();
    }

    const { language = 'en', farmerContext = null } = options;
    const detectedLang = detectLanguage(question, language);
    const { terms, expandedQuery } = extractAndExpandKeywords(question);

    const allDomains = ['diseases', 'crops', 'fertilizers', 'pesticides', 'soil', 'weather', 'schemes', 'mandi', 'faq'];

    let allScoredResults = [];
    const seenIds = new Set();

    allDomains.forEach(domain => {
      const scoredItems = searchDomain(domain, expandedQuery || question, 5);
      scoredItems.forEach(item => {
        if (!seenIds.has(item.record.id)) {
          seenIds.add(item.record.id);
          allScoredResults.push(item);
        }
      });
    });

    // Fallback search with raw question if expanded query had zero matches
    if (allScoredResults.length === 0) {
      allDomains.forEach(domain => {
        const scoredItems = searchDomain(domain, question, 5);
        scoredItems.forEach(item => {
          if (!seenIds.has(item.record.id)) {
            seenIds.add(item.record.id);
            allScoredResults.push(item);
          }
        });
      });
    }

    allScoredResults.sort((a, b) => b.score - a.score);

    // ── Unknown Query Threshold Check ──
    // If top score is below threshold (e.g. < 4), consider knowledge insufficient
    const topResults = (allScoredResults.length > 0 && allScoredResults[0].score >= 4)
      ? allScoredResults.slice(0, 2)
      : [];

    const finalAnswer = formatOfflineAnswer(topResults, {
      detectedLang,
      query: question
    });

    return {
      success: true,
      reply: finalAnswer,
      source: 'offline_knowledge',
      model: 'local-rag',
      language: detectedLang,
      docCount: topResults.length,
      domains: Array.from(new Set(topResults.map(m => m.domain)))
    };
  }

  // ── Load Bundle Data (Supports Synchronous Browser Bundle, Node fs, and Fetch) ──
  function init(bundleData) {
    if (bundleData && typeof bundleData === 'object') {
      offlineData = bundleData.data || bundleData;
      isLoaded = true;
      console.log('[OfflineRAG] Loaded knowledge data directly into store.');
      return true;
    }

    // 1. Check synchronous browser bundle window.KRISHI_OFFLINE_KNOWLEDGE_BUNDLE
    if (typeof window !== 'undefined' && window.KRISHI_OFFLINE_KNOWLEDGE_BUNDLE) {
      const b = window.KRISHI_OFFLINE_KNOWLEDGE_BUNDLE;
      offlineData = b.data || b;
      isLoaded = true;
      console.log('[OfflineRAG] Loaded synchronous KRISHI_OFFLINE_KNOWLEDGE_BUNDLE.');
      return true;
    }

    // 2. Check Node environment fs
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
          console.log('[OfflineRAG] Loaded offline-knowledge.json via Node fs.');
          return true;
        }
      } catch (e) {
        // Continue to fetch if present
      }
    }

    // 3. Fallback browser async fetch
    if (typeof window !== 'undefined' && window.fetch) {
      fetch('/js/offline-knowledge.json')
        .then(res => res.json())
        .then(json => {
          offlineData = json.data || json;
          isLoaded = true;
          console.log('[OfflineRAG] Knowledge bundle successfully fetched & loaded.');
        })
        .catch(err => {
          console.warn('[OfflineRAG] Could not fetch offline-knowledge.json:', err.message);
        });
    }

    return isLoaded;
  }

  init();

  return {
    init,
    answerQuestion,
    detectLanguage,
    extractAndExpandKeywords,
    searchDomain,
    getLoadedData: () => offlineData,
    isLoaded: () => isLoaded
  };
}));

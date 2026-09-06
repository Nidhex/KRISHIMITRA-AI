/* ==========================================================================
   KrishiMitra AI — Multilingual RAG (Retrieval-Augmented Generation) Service
   Supports: 11 Indian Languages (Native scripts, Romanized, & Code-mixed)
   Languages: English, Hindi, Gujarati, Marathi, Bengali, Tamil, Telugu,
              Kannada, Malayalam, Punjabi, Odia
   Pipeline:
     User Query → Multilingual Language & Script Detection
     → Multilingual Semantic Synonym Expansion (Translates Indian terms to DB keywords)
     → Multi-domain Keyword Extraction & Domain Routing
     → Search Local Agricultural Knowledge Store (Crops, Diseases, Soils, etc.)
     → Return Formatted Context with Ground Truth Agricultural Facts
   ========================================================================== */

'use strict';

const db = require('./databaseService');

// ── Supported Language Definitions ──────────────────────────────────────────
const SUPPORTED_LANGUAGES = {
  en: { name: 'English', native: 'English', script: 'Latin' },
  hi: { name: 'Hindi', native: 'हिन्दी', script: 'Devanagari' },
  gu: { name: 'Gujarati', native: 'ગુજરાતી', script: 'Gujarati' },
  mr: { name: 'Marathi', native: 'मराठी', script: 'Devanagari' },
  bn: { name: 'Bengali', native: 'বাংলা', script: 'Bengali' },
  ta: { name: 'Tamil', native: 'தமிழ்', script: 'Tamil' },
  te: { name: 'Telugu', native: 'తెలుగు', script: 'Telugu' },
  kn: { name: 'Kannada', native: 'ಕನ್ನಡ', script: 'Kannada' },
  ml: { name: 'Malayalam', native: 'മലയാളം', script: 'Malayalam' },
  pa: { name: 'Punjabi', native: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
  or: { name: 'Odia', native: 'ଓଡ଼ିଆ', script: 'Odia' }
};

// ── Multilingual Semantic Synonyms & DB Translation Map ─────────────────────
const MULTILINGUAL_SYNONYMS = {
  // Crops
  'कपास': 'cotton', 'કપાસ': 'cotton', 'કપાસની': 'cotton', 'कापूस': 'cotton', 'তুলা': 'cotton',
  'பருத்தி': 'cotton', 'ప్రత్తి': 'cotton', 'ಹತ್ತಿ': 'cotton', 'പരുത്തി': 'cotton', 'ਕਪਾਹ': 'cotton',
  'କପା': 'cotton', 'kapas': 'cotton', 'kapat': 'cotton',

  'धान': 'rice paddy', 'डांगर': 'rice paddy', 'ડાંગર': 'rice paddy', 'भात': 'rice paddy',
  'ধান': 'rice paddy', 'நெல்': 'rice paddy', 'వరి': 'rice paddy', 'ಭತ್ತ': 'rice paddy',
  'നെല്ല്': 'rice paddy', 'ਝੋਨਾ': 'rice paddy', 'ଧାନ': 'rice paddy', 'dhaan': 'rice paddy', 'chawal': 'rice',

  'गेहूं': 'wheat', 'गेहु': 'wheat', 'ઘઉં': 'wheat', 'गहू': 'wheat', 'গম': 'wheat',
  'கோதுமை': 'wheat', 'గోధుమ': 'wheat', 'ಗೋಧಿ': 'wheat', 'ഗോതമ്പ്': 'wheat', 'ਕਣਕ': 'wheat',
  'ଗହମ': 'wheat', 'gehu': 'wheat', 'gehun': 'wheat',

  'टमाटर': 'tomato', 'ટામેટા': 'tomato', 'टोमॅटो': 'tomato', 'টমেটো': 'tomato',
  'தக்காளி': 'tomato', 'టమాటా': 'tomato', 'ಟೊಮೆಟೊ': 'tomato', 'തക്കാളി': 'tomato',
  'ਟਮਾਟਰ': 'tomato', 'tamatar': 'tomato',

  'आलू': 'potato', 'બટાકા': 'potato', 'बटाटा': 'potato', 'আলু': 'potato',
  'உருளைக்கிழங்கு': 'potato', 'బంగాళాదుంప': 'potato', 'ಆಲೂಗಡ್ಡೆ': 'potato',
  'ഉരുളക്കിഴങ്ങ്': 'potato', 'ਆਲੂ': 'potato', 'aalu': 'potato', 'aloo': 'potato',

  'गन्ना': 'sugarcane', 'શેરડી': 'sugarcane', 'ऊस': 'sugarcane', 'আখ': 'sugarcane',
  'கரும்பு': 'sugarcane', 'చెరకు': 'sugarcane', 'ಕಬ್ಬು': 'sugarcane', 'കരിമ്പ്': 'sugarcane',
  'ਕਮਾਦ': 'sugarcane', 'ganna': 'sugarcane',

  'मक्का': 'maize corn', 'મકાઈ': 'maize corn', 'मका': 'maize corn', 'ভুট্টা': 'maize corn',
  'மக்காச்சோளம்': 'maize corn', 'మొక్కజొన్న': 'maize corn', 'ಮೆಕ್ಕೆಜೋಳ': 'maize corn',
  'ਮੱਕੀ': 'maize corn', 'makka': 'maize corn',

  'सरसों': 'mustard', 'રાયડો': 'mustard', 'मोहरी': 'mustard', 'সরিষা': 'mustard',
  'கடுகு': 'mustard', 'ఆవాలు': 'mustard', 'ਸਰ੍ਹੋਂ': 'mustard', 'sarson': 'mustard',

  // Symptoms & Issues
  'पीले': 'yellow', 'पीला': 'yellow', 'पीली': 'yellow', 'પીળા': 'yellow', 'પીળું': 'yellow',
  'पिवळे': 'yellow', 'হলুদ': 'yellow', 'மஞ்சள்': 'yellow', 'పసుపు': 'yellow', 'ಹಳದಿ': 'yellow',
  'മഞ്ഞ': 'yellow', 'peele': 'yellow', 'peela': 'yellow', 'pila': 'yellow',

  'पत्ते': 'leaf leaves', 'पत्ता': 'leaf', 'पाने': 'leaf leaves', 'পাতা': 'leaf leaves',
  'இலை': 'leaf leaves', 'இலைகள்': 'leaf leaves', 'ఆకులు': 'leaf leaves', 'ಎಲೆ': 'leaf leaves',
  'ഇലകൾ': 'leaf leaves', 'ਪੱਤੇ': 'leaf leaves', 'ପତ୍ର': 'leaf leaves', 'patte': 'leaf leaves',
  'pan': 'leaf leaves', 'paan': 'leaf leaves', 'panna': 'leaf leaves',

  'रोग': 'disease', 'રોગ': 'disease', 'রোগ': 'disease', 'நோய்': 'disease', 'తెగులు': 'disease',
  'ರೋಗ': 'disease', 'രോഗം': 'disease', 'ਬਿਮਾਰੀ': 'disease', 'rog': 'disease', 'bimari': 'disease',
  'धब्बे': 'spot blast blight', 'કાળા': 'black dark', 'સુકારો': 'wilt blight', 'करपा': 'blight blast',

  'कीड़े': 'pest insect caterpillar', 'जीवात': 'pest insect', 'જીવાત': 'pest insect',
  'किड': 'pest insect', 'পোকা': 'pest insect', 'பூச்சி': 'pest insect', 'పురుగు': 'pest insect',
  'ಕೀಟ': 'pest insect', 'കീടം': 'pest insect', 'ਕੀੜੇ': 'pest insect', 'keede': 'pest insect',
  'keeda': 'pest insect',

  'खाद': 'fertilizer urea dap npk', 'ખાતર': 'fertilizer urea dap npk', 'खत': 'fertilizer',
  'সার': 'fertilizer', 'உரம்': 'fertilizer', 'ఎరువు': 'fertilizer', 'ಗೊಬ್ಬರ': 'fertilizer',
  'വളം': 'fertilizer', 'khad': 'fertilizer', 'khatar': 'fertilizer',

  'दवा': 'pesticide medicine spray', 'દવા': 'pesticide medicine spray', 'औषध': 'pesticide medicine spray',
  'மருந்து': 'pesticide medicine', 'మందు': 'pesticide medicine', 'ಔಷಧ': 'pesticide medicine',
  'dawa': 'pesticide medicine', 'spray': 'pesticide spray',

  'मिट्टी': 'soil black loam', 'માટી': 'soil black loam', 'जमीन': 'soil land', 'माती': 'soil',
  'మట్టి': 'soil', 'மண்': 'soil', 'ಮಣ್ಣು': 'soil', 'mitti': 'soil',

  'भाव': 'mandi price rate apmc', 'ભાવ': 'mandi price rate apmc', 'દર': 'mandi price rate',
  'விலை': 'mandi price rate', 'ధర': 'mandi price rate', 'ಬೆಲೆ': 'mandi price rate',
  'bhav': 'mandi price rate', 'price': 'mandi price rate', 'rate': 'mandi price rate',

  'मौसम': 'weather rain temperature', 'હવામાન': 'weather rain forecast', 'पाऊस': 'rain weather',
  'மழை': 'rain weather', 'వర్షం': 'rain weather', 'ಮಳೆ': 'rain weather', 'mausam': 'weather rain',
  'barish': 'rain weather', 'varsad': 'rain weather',

  'योजना': 'scheme subsidy pm kisan', 'યોજના': 'scheme subsidy pm kisan', 'अनुदान': 'scheme subsidy',
  'திட்டம்': 'scheme subsidy', 'పథకం': 'scheme subsidy', 'yojana': 'scheme subsidy',
  'subsidy': 'subsidy scheme', 'bima': 'insurance claim'
};

// ── Multi-domain Multilingual Trigger Map ────────────────────────────────────
const DOMAIN_TRIGGERS = [
  {
    domains:  ['disease'],
    keywords: [
      'disease', 'pest', 'infection', 'blast', 'blight', 'wilt', 'rot', 'fungus',
      'virus', 'leaf curl', 'mosaic', 'yellowing', 'yellow', 'spots', 'caterpillar', 'aphid',
      'brown spot', 'rust', 'canker', 'damage', 'cure', 'treatment', 'insect',
      'bimari', 'rog', 'keeda', 'keede', 'jhonka', 'patte peele', 'jhulsa', 'upchar',
      'રોગ', 'જીવાત', 'પીળા', 'પાંદડા', 'સુકાય', 'ખેતીમાં', 'su rog che', 'kapat',
      'रोग', 'किड', 'पिवळे', 'पाने', 'करपा', 'उपाय', 'aajar',
      'রোগ', 'পোকা', 'পাতা হলুদ', 'ধ্বসা', 'প্রতিকার',
      'நோய்', 'பூச்சி', 'இலை மஞ்சள்', 'வாடல்', 'மருந்து',
      'తెగులు', 'పురుగు', 'ఆకులు పసుపు', 'రోగం', 'నివారణ',
      'ರೋಗ', 'ಕೀಟ', 'ಎಲೆ ಹಳದಿ', 'ಔಷಧ',
      'രോഗം', 'കീടം', 'ഇല മഞ്ഞ', 'ചികിത്സ',
      'ਬਿਮਾਰੀ', 'ਕੀੜੇ', 'ਪੱਤੇ ਪੀਲੇ', 'ਇਲਾਜ',
      'ରୋଗ', 'ପୋକ', 'ପତ୍ର ହଳଦିଆ', 'ଉପଚାର'
    ],
    fn: q => db.searchDisease(q, 4)
  },
  {
    domains:  ['crop'],
    keywords: [
      'crop', 'crops', 'farming', 'cultivation', 'harvest', 'yield', 'sowing',
      'paddy', 'rice', 'wheat', 'cotton', 'sugarcane', 'maize', 'mustard',
      'potato', 'tomato', 'soybean', 'groundnut', 'onion', 'chilli', 'pulses',
      'fasal', 'kheti', 'dhaan', 'gehun', 'gehu', 'kapas', 'ganna', 'sarson',
      'tamatar', 'aalu', 'chana', 'arhar', 'moong', 'pyaj', 'upaj',
      'કપાસ', 'ડાંગર', 'ઘઉં', 'શેરડી', 'મગફળી', 'બટાકા', 'ટામેટા', 'પાક',
      'कापूस', 'भात', 'गहू', 'ऊस', 'कांदा', 'सोयाबीन', 'पीक',
      'ধান', 'গম', 'তুলা', 'আলু', 'টমেটো', 'ফসল',
      'பருத்தி', 'நெல்', 'கோதுமை', 'கரும்பு', 'தக்காளி', 'பயிர்',
      'ప్రత్తి', 'వరి', 'గోధుమ', 'చెరకు', 'టమాటా', 'పంట',
      'ಹತ್ತಿ', 'ಭತ್ತ', 'ಗೋಧಿ', 'ಕಬ್ಬು', 'ಟೊಮೆಟೊ', 'ಬೆಳೆ',
      'പരുത്തി', 'നെല്ല്', 'ഗോതമ്പ്', 'കരിമ്പ്', 'വിള',
      'ਕਪਾਹ', 'ਝੋਨਾ', 'ਕਣਕ', 'ਕਮਾਦ', 'ਫਸਲ',
      'କପା', 'ଧାନ', 'ଗହମ', 'ଫସଲ'
    ],
    fn: q => db.searchCrop(q, 4)
  },
  {
    domains:  ['fertilizer'],
    keywords: [
      'fertilizer', 'fertilizers', 'manure', 'compost', 'urea', 'dap', 'npk',
      'potash', 'nitrogen', 'phosphorus', 'potassium', 'zinc', 'sulphur',
      'micronutrient', 'organic manure', 'dosage', 'kg per acre',
      'khad', 'khaad', 'urvarak', 'gobhar', 'poshan', 'matra',
      'ખાતર', 'યુરિયા', 'ડીએપી', 'છાણીયું ખાતર', 'khatar',
      'खत', 'युरिया', 'शेणखत', 'khat',
      'সার', 'ইউরিয়া', 'জৈব সার',
      'உரம்', 'யூரியா', 'இயற்கை உரம்',
      'ఎరువు', 'యూరియా', 'సేంద్రీయ ఎరువు',
      'ಗೊಬ್ಬರ', 'ಯೂರಿಯಾ',
      'വളം', 'യൂറിയ',
      'ਖਾਦ', 'ਯੂਰੀਆ',
      'ସାର', 'ୟୁରିଆ'
    ],
    fn: q => db.searchFertilizer(q, 3)
  },
  {
    domains:  ['pesticide'],
    keywords: [
      'pesticide', 'insecticide', 'fungicide', 'herbicide', 'weedicide',
      'spray', 'chemical', 'neem oil', 'imidacloprid', 'chlorpyrifos',
      'monocrotophos', 'dose', 'ml per litre', 'organic spray',
      'keetnashak', 'chhidkaw', 'dawa', 'kitnashak',
      'જંતુનાશક', 'દવા', 'છંટકાવ', 'jantunashak',
      'कीटकनाशक', 'फवारणी', 'औषध',
      'কীটনাশক', 'স্প্রে', 'ওষুধ',
      'பூச்சிக்கொல்லி', 'தெளிப்பு', 'மருந்து',
      'పురుగుమందు', 'స్ప్రే', 'మందు',
      'ಕೀಟನಾಶಕ', 'ಸಿಂಪಡಣೆ',
      'കീടനാശിനി', 'തളിക്കൽ',
      'ਕੀਟਨਾਸ਼ਕ', 'ਸਪਰੇਅ',
      'କୀଟନାଶକ', 'ସ୍ପ୍ରେ'
    ],
    fn: q => db.searchPesticide(q, 3)
  },
  {
    domains:  ['soil'],
    keywords: [
      'soil', 'black soil', 'red soil', 'alluvial', 'clay', 'loamy', 'sandy',
      'ph', 'moisture', 'soil test', 'fertility', 'drainage',
      'mitti', 'kaali mitti', 'domat', 'mitti ki janch', 'nammi',
      'માટી', 'જમીન', 'કાળી માટી', 'ભેજ', 'mati', 'jamin',
      'माती', 'काळी माती', 'ओलावा',
      'মাটি', 'দোআঁশ মাটি',
      'மண்', 'கரிசல் மண்', 'ஈரப்பதம்',
      'నేల', 'నల్ల రేగడి నేల', 'తేమ',
      'ಮಣ್ಣು', 'ಕಪ್ಪು ಮಣ್ಣು',
      'മണ്ണ്', 'കരിമണ്ണ്',
      'ਮਿੱਟੀ', 'ਕਾਲੀ ਮਿੱਟੀ',
      'ମାଟି', 'କଳା ମାଟି'
    ],
    fn: q => db.searchSoil(q, 3)
  },
  {
    domains:  ['weather'],
    keywords: [
      'weather', 'rain', 'rainfall', 'temperature', 'humidity', 'forecast',
      'storm', 'cloud', 'monsoon', 'drought', 'frost', 'wind',
      'mausam', 'barish', 'barsat', 'tapman', 'garmi', 'baadal',
      'હવામાન', 'વરસાદ', 'તાપમાન', 'વાદળ', 'havaman', 'varsad',
      'हवामान', 'पाऊस', 'तापमान', 'ढग', 'paus',
      'আবহাওয়া', 'বৃষ্টি', 'তাপমাত্রা',
      'வானிலை', 'மழை', 'வெப்பநிலை', 'malai',
      'వాతావరణం', 'వర్షం', 'ఉష్ణోగ్రత', 'varsham',
      'ಹವಾಮಾನ', 'ಮಳೆ', 'ತಾಪಮಾನ', 'male',
      'കാലാവസ്ഥ', 'മഴ', 'താപനില', 'mazha',
      'ਮੌਸਮ', 'ਮੀਂਹ', 'ਤਾਪਮਾਨ', 'meenh',
      'ପାଣିପାଗ', 'ବର୍ଷା', 'ତାପମାତ୍ରା', 'barsha'
    ],
    fn: q => db.searchWeather(q, 3)
  },
  {
    domains:  ['mandi'],
    keywords: [
      'mandi', 'market', 'price', 'rate', 'apmc', 'quintal', 'sell',
      'wholesale', 'bhav', 'market price', 'bazaar',
      'bhav', 'daam', 'bazar', 'bechna', 'mandi bhav',
      'બજાર', 'ભાવ', 'મંડી', 'વેચાણ', 'દર',
      'बाजार', 'भाव', 'दर', 'मार्केट',
      'বাজার', 'দাম', 'দর', 'মান্ডি',
      'சந்தை', 'விலை', 'மண்டி', 'vilai',
      'మార్కెట్', 'ధర', 'మండి', 'dhara',
      'ಮಾರುಕಟ್ಟೆ', 'ಬೆಲೆ', 'ದರ', 'bele',
      'വിപണി', 'വില', 'vila',
      'ਮੰਡੀ', 'ਭਾਅ', 'ਰੇਟ',
      'ମାଣ୍ଡି', 'ଦର', 'ବଜାର'
    ],
    fn: q => db.searchMandi(q, 4)
  },
  {
    domains:  ['scheme'],
    keywords: [
      'scheme', 'schemes', 'yojana', 'subsidy', 'government', 'kisan credit',
      'pm kisan', 'pm kusum', 'fasal bima', 'insurance', 'loan', 'subsidy 60%',
      'financial support', 'apply', 'eligibility',
      'sarkar', 'sarkari yojana', 'anudan', 'sahayata', 'kisan samman', 'bima',
      'યોજના', 'સબસિડી', 'સરકારી સહાય', 'વીમો', 'yojana', 'sahay',
      'योजना', 'अनुदान', 'विमा', 'शेतकरी',
      'পরিকল্পনা', 'ভর্তুকি', 'বীমা',
      'திட்டம்', 'மானியம்', 'காப்பீடு',
      'పథకం', 'సబ్సిడీ', 'భీమా',
      'ಯೋಜನೆ', 'ಸಬ್ಸಿಡಿ', 'ವಿಮೆ',
      'പദ്ധതി', 'സബ്സിഡി', 'ഇൻഷുറൻസ്',
      'ਸਕੀਮ', 'ਸਬਸਿਡੀ', 'ਬੀਮਾ',
      'ଯୋଜନା', 'ରିହାତି', 'ବୀମା'
    ],
    fn: q => db.searchScheme(q, 4)
  },
  {
    domains:  ['faq'],
    keywords: [
      'how to', 'what is', 'guide', 'steps', 'tips', 'help', 'advice',
      'kaise', 'kya', 'kem', 'kashasathi', 'kivabe', 'eppadi', 'ela', 'hege', 'enganeyanu'
    ],
    fn: q => db.searchFAQ(q, 3)
  }
];

// ── Language & Script Detection ──────────────────────────────────────────────
/**
 * Detect language from text (script Unicode analysis + Romanized heuristics).
 *
 * @param {string} text
 * @param {string} [fallbackLang='en']
 * @returns {string} ISO language code
 */
function detectLanguage(text, fallbackLang = 'en') {
  if (!text || typeof text !== 'string') return fallbackLang || 'en';

  const clean = text.trim();
  if (!clean) return fallbackLang || 'en';

  // 1. Script Range Counts
  let counts = {
    gu: (clean.match(/[\u0A80-\u0AFF]/g) || []).length, // Gujarati
    bn: (clean.match(/[\u0980-\u09FF]/g) || []).length, // Bengali
    ta: (clean.match(/[\u0B80-\u0BFF]/g) || []).length, // Tamil
    te: (clean.match(/[\u0C00-\u0C7F]/g) || []).length, // Telugu
    kn: (clean.match(/[\u0C80-\u0CFF]/g) || []).length, // Kannada
    ml: (clean.match(/[\u0D00-\u0D7F]/g) || []).length, // Malayalam
    pa: (clean.match(/[\u0A00-\u0A7F]/g) || []).length, // Punjabi / Gurmukhi
    or: (clean.match(/[\u0B00-\u0B7F]/g) || []).length, // Odia
    devanagari: (clean.match(/[\u0900-\u097F]/g) || []).length // Hindi or Marathi
  };

  for (const [lang, count] of Object.entries(counts)) {
    if (lang !== 'devanagari' && count >= 2) {
      return lang;
    }
  }

  // Devanagari script: differentiate between Marathi and Hindi
  if (counts.devanagari >= 2) {
    const marathiMarkers = ['आहे', 'नाही', 'पिक', 'शेतकरी', 'पाने', 'करपा', 'करावे', 'द्या', 'आणि', 'कसे', 'कापूस'];
    const isMarathi = marathiMarkers.some(m => clean.includes(m));
    return isMarathi ? 'mr' : 'hi';
  }

  // 2. Romanized / Transliteration Heuristics
  const lower = clean.toLowerCase();

  // Gujarati Romanized markers: e.g. "su rog che", "kem cho", "ma su", "khedut", "kheti ma", "pan peela"
  if (/\b(su|rog|che|khedut|kheti|pan|paan|kem|cho|chhe|aavshe|nuksan|kapat)\b/.test(lower) &&
      (/\b(su|che|chhe|kem|ma|khedut|rog)\b/.test(lower))) {
    return 'gu';
  }

  // Marathi Romanized markers: e.g. "sheti", "pik", "kasa", "aajar", "khat", "ahe", "pivale"
  if (/\b(sheti|pik|aajar|khat|ahe|aahe|pivale|fawarani|bhav)\b/.test(lower) &&
      (/\b(ahe|aahe|kasa|kay|pik)\b/.test(lower))) {
    return 'mr';
  }

  // Hindi Romanized markers: e.g. "meri fasal", "keede lag gaye", "kya karu", "peele ho rahe"
  if (/\b(meri|mera|mere|fasal|keede|keeda|lag|gaye|gaya|kya|kare|karu|hoye|hai|hain|upchar|dawa|mausam|barish)\b/.test(lower)) {
    return 'hi';
  }

  // Punjabi Romanized markers: e.g. "kheti", "kive", "tusi", "meenh"
  if (/\b(kive|tusi|chahida|meenh|kheti|janda)\b/.test(lower)) {
    return 'pa';
  }

  // Bengali Romanized markers
  if (/\b(shoshyo|chash|kivabe|korbo|hobe|bristi)\b/.test(lower)) {
    return 'bn';
  }

  // Tamil Romanized markers
  if (/\b(vivasayam|payir|eppadi|noi|seyvathu|malai)\b/.test(lower)) {
    return 'ta';
  }

  // Telugu Romanized markers
  if (/\b(vyavasayam|pantalu|thegulu|ela|cheyali|varsham)\b/.test(lower)) {
    return 'te';
  }

  // Kannada Romanized markers
  if (/\b(krushi|beleyalli|hege|maduvudu|male|roga)\b/.test(lower)) {
    return 'kn';
  }

  // Malayalam Romanized markers
  if (/\b(krishi|vila|enganeyanu|rogam|mazha)\b/.test(lower)) {
    return 'ml';
  }

  // Odia Romanized markers
  if (/\b(chasa|phasala|kipari|karibi|barsha)\b/.test(lower)) {
    return 'or';
  }

  // Fallback to explicitly passed dropdown language if valid, else default to 'en'
  if (fallbackLang && SUPPORTED_LANGUAGES[fallbackLang]) {
    return fallbackLang;
  }

  return 'en';
}

// ── Keyword Extractor & Semantic Query Expander ─────────────────────────────
/**
 * Extract meaningful search terms and expand Indian language terms into DB keywords.
 *
 * @param {string} question
 * @returns {{ terms: string[], expandedQuery: string }}
 */
function extractAndExpandKeywords(question) {
  const STOP_WORDS = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but',
    'if', 'so', 'my', 'me', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'this', 'that', 'these', 'those', 'with', 'from', 'by', 'about',
    // Hindi / Hinglish stopwords
    'ke', 'ka', 'ki', 'ko', 'se', 'me', 'mein', 'hai', 'hain', 'tha', 'the',
    'kya', 'mera', 'meri', 'mere', 'aap', 'hum', 'aur', 'ya', 'par', 'bhi',
    'ho', 'rahe', 'gaye', 'kare', 'karu', 'kese',
    // Gujarati stopwords
    'ma', 'na', 'ni', 'nu', 'no', 'che', 'chhe', 'ane', 'su', 'tame', 'maru',
    'thay', 'chhe', 'karvu',
    // Marathi stopwords
    'cha', 'chi', 'che', 'ani', 'kay', 'ahe', 'kasa'
  ]);

  const rawTokens = question
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u0D7F]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));

  const expandedEnglishTerms = new Set();

  rawTokens.forEach(token => {
    expandedEnglishTerms.add(token);
    // Exact or substring match in multilingual synonyms
    for (const [key, synonym] of Object.entries(MULTILINGUAL_SYNONYMS)) {
      if (token === key.toLowerCase() || token.includes(key.toLowerCase()) || key.toLowerCase().includes(token)) {
        synonym.split(' ').forEach(s => expandedEnglishTerms.add(s));
      }
    }
  });

  const termsArray = Array.from(expandedEnglishTerms);
  return {
    terms: rawTokens,
    expandedQuery: termsArray.join(' ')
  };
}

// ── Domain Detector ──────────────────────────────────────────────────────────
/**
 * Identify relevant domain categories for the user's query.
 *
 * @param {string} question
 * @param {string} expandedQuery
 * @returns {Array}
 */
function detectDomains(question, expandedQuery = '') {
  const combined = `${question} ${expandedQuery}`.toLowerCase();
  return DOMAIN_TRIGGERS.filter(trigger =>
    trigger.keywords.some(kw => combined.includes(kw.toLowerCase()))
  );
}

// ── Context Formatter ────────────────────────────────────────────────────────
/**
 * Format retrieved database records into structured, high-signal agricultural facts.
 *
 * @param {Object[]} docs
 * @param {string} domain
 * @returns {string}
 */
function formatDocs(docs, domain) {
  if (!docs || docs.length === 0) return '';

  const lines = [`\n=== KRISHIMITRA VERIFIED ${domain.toUpperCase()} DATA ===`];

  docs.forEach(doc => {
    lines.push(`\n[${doc.title || doc.id || 'Record'}]`);
    if (doc.description) lines.push(`Details: ${doc.description}`);
    if (doc.metadata) {
      const meta = doc.metadata;
      if (meta.symptoms)           lines.push(`- Symptoms: ${meta.symptoms}`);
      if (meta.organicTreatment)   lines.push(`- Organic Treatment: ${meta.organicTreatment}`);
      if (meta.chemicalTreatment)  lines.push(`- Chemical Treatment: ${meta.chemicalTreatment}`);
      if (meta.preventiveMeasures) lines.push(`- Prevention: ${meta.preventiveMeasures}`);
      if (meta.fertilizerAdvisory) lines.push(`- Fertilizer Dose: ${meta.fertilizerAdvisory}`);
      if (meta.recommendedCrops)   lines.push(`- Suitable Crops: ${Array.isArray(meta.recommendedCrops) ? meta.recommendedCrops.join(', ') : meta.recommendedCrops}`);
      if (meta.region)             lines.push(`- Region: ${meta.region}`);
      if (meta.crop)               lines.push(`- Crop: ${meta.crop}`);
      if (meta.severity)           lines.push(`- Severity: ${meta.severity}`);
      if (meta.eligibility)        lines.push(`- Eligibility: ${meta.eligibility}`);
      if (meta.benefit)            lines.push(`- Benefit / Subsidy: ${meta.benefit}`);
      if (meta.pricePerQuintal)    lines.push(`- Price/Quintal: ₹${meta.pricePerQuintal}`);
      if (meta.distance)           lines.push(`- Mandi Distance: ${meta.distance}`);
    }
  });

  return lines.join('\n');
}

// ── Language-Specific System Instruction Builder ─────────────────────────────
/**
 * Generate precise multilingual instructions for the AI system prompt.
 *
 * @param {string} language - ISO language code
 * @returns {string}
 */
function buildLanguageInstruction(language) {
  const instructions = {
    en: 'Respond in clean, simple, and friendly English suitable for an Indian farmer.',
    hi: 'किसान को सरल और व्यावहारिक हिन्दी (Hindi) में उत्तर दें। यदि किसान ने रोमन लिपि (Hinglish) में पूछा है, तो स्वाभाविक हिन्दी में उत्तर दें।',
    gu: 'ખેડૂતને સરળ અને વ્યવહારુ ગુજરાતી (Gujarati) માં જવાબ આપો. જો ખેડૂતે રોમન લિપિમાં પૂછ્યું હોય તો પણ કુદરતી ગુજરાતીમાં જવાબ આપો.',
    mr: 'शेतकऱ्याला सोप्या आणि व्यावहारिक मराठीत (Marathi) उत्तर द्या.',
    bn: 'কৃষককে সহজ ও ব্যবহারিক বাংলায় (Bengali) উত্তর দিন।',
    ta: 'விவசாயிக்கு எளிய மற்றும் நடைமுறை தமிழில் (Tamil) பதிலளிக்கவும்.',
    te: 'రైతుకు సరళమైన మరియు ఆచరణాత్మక తెలుగులో (Telugu) సమాధానం ఇవ్వండి.',
    kn: 'ರೈತರಿಗೆ ಸರಳ ಮತ್ತು ಪ್ರಾಯೋಗಿಕ ಕನ್ನಡದಲ್ಲಿ (Kannada) ಉತ್ತರಿಸಿ.',
    ml: 'കർഷകന് ലളിതവും പ്രായോഗികവുമായ മലയാളത്തിൽ (Malayalam) മറുപടി നൽകുക.',
    pa: 'ਕਿਸਾਨ ਨੂੰ ਸਰਲ ਅਤੇ ਵਿਹਾਰਕ ਪੰਜਾਬੀ (Punjabi) ਵਿੱਚ ਜਵਾਬ ਦਿਓ।',
    or: 'କୃଷକଙ୍କୁ ସରଳ ଏବଂ ବ୍ୟବହାରିକ ଓଡ଼ିଆରେ (Odia) ଉତ୍ତର ଦିଅନ୍ତୁ।'
  };

  return instructions[language] || instructions.en;
}

// ── Main RAG Context Retrieval ───────────────────────────────────────────────
/**
 * Retrieve relevant factual context from the local KrishiMitra database.
 *
 * @param {string} question
 * @param {Object} [options]
 * @param {string} [options.language='en']
 * @param {Object} [options.farmerContext]
 * @returns {Promise<{
 *   context: string,
 *   detectedLanguage: string,
 *   domains: string[],
 *   docCount: number,
 *   keywords: string[]
 * }>}
 */
async function retrieveContext(question, options = {}) {
  const { language = 'en', farmerContext = null } = options;

  if (!question || typeof question !== 'string') {
    return { context: '', detectedLanguage: 'en', domains: [], docCount: 0, keywords: [] };
  }

  // 1. Detect language from the question
  const detectedLanguage = detectLanguage(question, language);
  const { terms, expandedQuery } = extractAndExpandKeywords(question);
  const matchedTriggers = detectDomains(question, expandedQuery);

  // Fallback to standard domains if none matched
  const triggers = matchedTriggers.length > 0
    ? matchedTriggers
    : DOMAIN_TRIGGERS.slice(0, 3);

  const contextParts = [];
  const domainsUsed = [];
  let totalDocCount = 0;

  for (const trigger of triggers) {
    try {
      // Search with expanded English terms + original terms
      const docs = trigger.fn(expandedQuery || question);
      if (docs && docs.length > 0) {
        contextParts.push(formatDocs(docs, trigger.domains[0]));
        domainsUsed.push(trigger.domains[0]);
        totalDocCount += docs.length;
      }
    } catch (err) {
      console.warn(`[RAG] Search error for domain ${trigger.domains[0]}: ${err.message}`);
    }
  }

  // 2. Inject farmer profile context if available
  let farmerContextString = '';
  if (farmerContext && typeof farmerContext === 'object') {
    const details = [];
    if (farmerContext.name) details.push(`Farmer Name: ${farmerContext.name}`);
    if (farmerContext.village || farmerContext.location) details.push(`Location: ${farmerContext.village || farmerContext.location}`);
    if (farmerContext.landSize) details.push(`Land Size: ${farmerContext.landSize}`);
    if (farmerContext.soilType) details.push(`Soil Type: ${farmerContext.soilType}`);
    if (farmerContext.primaryCrop || farmerContext.crops) details.push(`Primary Crops: ${farmerContext.primaryCrop || farmerContext.crops}`);
    if (farmerContext.recentScan) details.push(`Recent Disease Scan: ${farmerContext.recentScan}`);

    if (details.length > 0) {
      farmerContextString = `\n=== FARMER PROFILE CONTEXT ===\n${details.join('\n')}\n`;
    }
  }

  const langInstruction = buildLanguageInstruction(detectedLanguage);

  let finalContext = '';
  if (contextParts.length > 0 || farmerContextString) {
    finalContext = [
      langInstruction,
      farmerContextString,
      contextParts.join('\n')
    ].filter(Boolean).join('\n');
  } else {
    finalContext = `${langInstruction}\nNo specific local record matched. Provide advice based on standard Indian agricultural best practices.`;
  }

  return {
    context: finalContext,
    detectedLanguage,
    domains: domainsUsed,
    docCount: totalDocCount,
    keywords: terms
  };
}

module.exports = {
  retrieveContext,
  detectLanguage,
  buildLanguageInstruction,
  extractKeywords: (q) => extractAndExpandKeywords(q).terms,
  extractAndExpandKeywords,
  detectDomains,
  SUPPORTED_LANGUAGES,
  MULTILINGUAL_SYNONYMS
};

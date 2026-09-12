/* ==========================================================================
   KrishiMitra AI — Browser-Safe Offline RAG Engine
   Performs local agricultural knowledge search & answer generation.
   Supports: 11 Indian Languages, Romanized Scripts, & Code-mixed Queries.
   Compatible with both Browser environment and Node.js testing.
   ========================================================================== */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KrishiOfflineRAG = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ── In-memory Knowledge Store ──────────────────────────────────────────────
  let offlineData = {
    crops: [],
    diseases: [],
    schemes: [],
    weather: [],
    soil: [],
    fertilizers: [],
    pesticides: [],
    mandi: [],
    faq: []
  };

  let isLoaded = false;

  // ── Supported Language Definitions ──────────────────────────────────────────
  const SUPPORTED_LANGUAGES = {
    en: { name: 'English', native: 'English' },
    hi: { name: 'Hindi', native: 'हिन्दी' },
    gu: { name: 'Gujarati', native: 'ગુજરાતી' },
    mr: { name: 'Marathi', native: 'मराठी' },
    bn: { name: 'Bengali', native: 'বাংলা' },
    ta: { name: 'Tamil', native: 'தமிழ்' },
    te: { name: 'Telugu', native: 'తెలుగు' },
    kn: { name: 'Kannada', native: 'ಕನ್ನಡ' },
    ml: { name: 'Malayalam', native: 'മലയാളം' },
    pa: { name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    or: { name: 'Odia', native: 'ଓଡ଼ିଆ' }
  };

  // ── Multilingual Semantic Synonyms & Cross-Script Mapping ────────────────────
  const MULTILINGUAL_SYNONYMS = {
    // Crops
    'कपास': 'cotton kapas', 'કપાસ': 'cotton kapas', 'कापूस': 'cotton kapas', 'तुला': 'cotton', 'பருத்தி': 'cotton', 'ప్రత్తి': 'cotton', 'kapas': 'cotton kapas', 'cotton': 'cotton kapas',
    'धान': 'rice paddy dhaan dhan chawal', 'डांगर': 'rice paddy dhaan', 'ડાંગર': 'rice paddy', 'भात': 'rice paddy', 'ধান': 'rice paddy', 'நெல்': 'rice paddy', 'వరి': 'rice paddy', 'dhaan': 'rice paddy dhaan chawal', 'dhan': 'rice paddy dhaan', 'chawal': 'rice paddy chawal', 'paddy': 'rice paddy dhaan', 'rice': 'rice paddy dhaan', 'basmati': 'rice paddy basmati',
    'गेहूं': 'wheat gehun gehu kanak', 'गेहु': 'wheat gehun gehu', 'घऊं': 'wheat gehun', 'गहू': 'wheat gehun', 'गम': 'wheat', 'कோதுமை': 'wheat', 'ગોధుம': 'wheat', 'gehu': 'wheat gehun gehu', 'gehun': 'wheat gehun gehu', 'wheat': 'wheat gehun gehu', 'lokwan': 'wheat lokwan', 'kanak': 'wheat gehun kanak',
    'टमाटर': 'tomato tamatar', 'ટામેટા': 'tomato tamatar', 'टोमॅटो': 'tomato tamatar', 'টমেটো': 'tomato', 'தக்காளி': 'tomato', 'tamatar': 'tomato tamatar', 'tomato': 'tomato tamatar', 'desi': 'tomato desi',
    'आलू': 'potato aalu aloo jyoti', 'બટાકા': 'potato aalu', 'बटाटा': 'potato aalu', 'আলু': 'potato', 'aalu': 'potato aalu aloo', 'aloo': 'potato aalu aloo', 'potato': 'potato aalu aloo', 'jyoti': 'potato jyoti',
    'गन्ना': 'sugarcane ganna', 'શેરડી': 'sugarcane ganna', 'ऊस': 'sugarcane ganna', 'ganna': 'sugarcane ganna', 'sugarcane': 'sugarcane ganna',
    'मक्का': 'maize corn makka', 'મકાઈ': 'maize corn makka', 'मका': 'maize corn makka', 'makka': 'maize corn makka', 'maize': 'maize corn makka', 'corn': 'maize corn makka',
    'सरसों': 'mustard sarson', 'રાયડો': 'mustard sarson', 'मोहरी': 'mustard sarson', 'sarson': 'mustard sarson', 'mustard': 'mustard sarson',

    // Symptoms & Issues
    'पीले': 'yellow yellowing peeli peela pila', 'पीला': 'yellow yellowing peeli peela pila', 'पीली': 'yellow yellowing peeli peela pila', 'પીળા': 'yellow peeli peela', 'पिवळे': 'yellow peeli peela', 'peele': 'yellow yellowing peeli peela', 'peela': 'yellow yellowing peeli peela', 'pila': 'yellow yellowing peeli peela', 'peeli': 'yellow yellowing peeli peela', 'yellow': 'yellow yellowing peeli peela', 'yellowing': 'yellow yellowing peeli peela',
    'पत्ते': 'leaf leaves patte patta pan paan pattiyan', 'पत्ता': 'leaf leaves patte patta pattiyan', 'पत्तियां': 'leaf leaves patte patta pattiyan', 'पत्तिया': 'leaf leaves patte patta pattiyan', 'पाने': 'leaf leaves patte', 'পাতা': 'leaf leaves', 'இலை': 'leaf leaves', 'patte': 'leaf leaves patte patta pattiyan', 'patta': 'leaf leaves patte patta pattiyan', 'pattiyan': 'leaf leaves patte patta pattiyan', 'pan': 'leaf leaves', 'paan': 'leaf leaves', 'leaf': 'leaf leaves patte patta pattiyan', 'leaves': 'leaf leaves patte patta pattiyan',
    'रोग': 'disease rog bimari infection', 'રોગ': 'disease rog bimari', 'রোগ': 'disease rog', 'நோய்': 'disease rog', 'rog': 'disease rog bimari', 'bimari': 'disease rog bimari', 'disease': 'disease rog bimari', 'infection': 'disease rog infection',
    'धब्बे': 'spot blast blight jhulsa jhonka', 'स्पॉट': 'spot', 'झुलसा': 'blight blast jhulsa', 'झोंका': 'blast jhonka', 'blast': 'blast jhonka', 'blight': 'blight jhulsa', 'rust': 'rust peela rog', 'canker': 'canker',
    'कीड़े': 'pest insect caterpillar aphid whitefly keede keeda chepa maho', 'जीवात': 'pest insect keede', 'पोका': 'pest insect', 'keede': 'pest insect caterpillar aphid keede keeda chepa maho', 'keeda': 'pest insect caterpillar aphid keede keeda chepa maho', 'aphid': 'aphid insect pest chepa maho keede', 'aphids': 'aphid insect pest chepa maho keede', 'whitefly': 'whitefly insect pest', 'chepa': 'aphid pest chepa maho keede', 'maho': 'aphid pest chepa maho keede',

    // Fertilizers & Soil
    'खाद': 'fertilizer urea dap npk compost khad khaad gobhar', 'ખાતર': 'fertilizer urea dap npk khad', 'खत': 'fertilizer khad', 'সার': 'fertilizer khad', 'உரம்': 'fertilizer khad', 'khad': 'fertilizer urea dap npk compost khad khaad gobhar', 'khaad': 'fertilizer urea dap npk khad khaad gobhar', 'khatar': 'fertilizer khad', 'fertilizer': 'fertilizer urea dap npk compost khad khaad gobhar', 'urea': 'urea nitrogen fertilizer khad', 'dap': 'dap phosphorus fertilizer khad', 'gobhar': 'organic compost fertilizer gobhar khad', 'nitrogen': 'nitrogen urea fertilizer', 'phosphorus': 'phosphorus dap fertilizer', 'compost': 'organic compost fertilizer gobhar khad',
    'दवा': 'pesticide medicine spray treatment fungicide insecticide dawa upchar upay', 'દવા': 'pesticide medicine spray dawa', 'औषध': 'pesticide medicine spray', 'dawa': 'pesticide medicine spray treatment fungicide insecticide dawa upchar upay', 'spray': 'pesticide spray dawa', 'upchar': 'treatment remedy cure upchar', 'upay': 'treatment remedy cure upay', 'cure': 'treatment remedy cure', 'treatment': 'treatment remedy upchar', 'fungicide': 'fungicide pesticide dawa', 'insecticide': 'insecticide pesticide dawa',
    'मिट्टी': 'soil clay loam alluvial black mitti maati janch', 'માટી': 'soil clay loam mitti', 'जमीन': 'soil land mitti', 'माती': 'soil mitti', 'mitti': 'soil clay loam alluvial black mitti maati janch', 'soil': 'soil clay loam alluvial black mitti maati janch', 'janch': 'soil test testing health score janch', 'test': 'soil test testing janch', 'testing': 'soil test testing janch', 'kaali': 'black clayey soil kaali mitti', 'black': 'black clayey soil kaali mitti', 'domat': 'alluvial clay loam soil domat mitti',

    // Mandi & Price
    'भाव': 'mandi price rate apmc quintal bhav dam', 'ભાવ': 'mandi price rate apmc bhav', 'दर': 'mandi price rate', 'bhav': 'mandi price rate apmc bhav dam', 'price': 'mandi price rate bhav dam', 'rate': 'mandi price rate bhav dam', 'mandi': 'mandi price market apmc', 'dam': 'price rate dam',

    // Weather
    'मौसम': 'weather rain temperature forecast advisory mausam barish', 'હવામાન': 'weather rain forecast mausam', 'पाऊस': 'rain weather barish', 'mausam': 'weather rain temperature forecast mausam barish', 'barish': 'rain weather barish', 'weather': 'weather rain forecast advisory mausam barish', 'rain': 'rain weather barish',

    // Schemes
    'योजना': 'scheme subsidy pm kisan pmfby kusum yojana', 'યોજના': 'scheme subsidy yojana', 'yojana': 'scheme subsidy pm kisan pmfby kusum yojana', 'subsidy': 'subsidy scheme yojana', 'scheme': 'scheme subsidy yojana', 'bima': 'insurance claim crop insurance pmfby bima'
  };

  // ── Stop Words List (Multilingual: English, Devanagari, Hinglish, etc.) ────
  const STOP_WORDS = new Set([
    // English
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but',
    'if', 'so', 'my', 'me', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'this', 'that', 'these', 'those', 'with', 'from', 'by', 'about',
    'what', 'why', 'how', 'when', 'where', 'which', 'who', 'should',
    // Hindi Devanagari
    'में', 'का', 'की', 'के', 'को', 'से', 'ने', 'पर', 'भी', 'और', 'या',
    'है', 'हैं', 'था', 'थे', 'थी', 'हो', 'रहा', 'रही', 'रहे', 'हुआ', 'हुए', 'हुई',
    'क्या', 'क्यों', 'कैसे', 'किस', 'कब', 'कहां', 'कौन', 'कौनसा', 'कौनसी', 'कौनसे',
    'कर', 'करें', 'करो', 'करने', 'करना', 'चाहिए', 'लिए', 'साथ', 'आप', 'मेरा', 'मेरी', 'मेरे',
    // Hinglish Romanized
    'ke', 'ka', 'ki', 'ko', 'se', 'me', 'mein', 'hai', 'hain', 'tha', 'the', 'thi',
    'kya', 'kyun', 'kyu', 'kaise', 'kese', 'kaunsa', 'kaun', 'chahiye', 'karu', 'kare',
    'karein', 'karne', 'rahi', 'raha', 'rahe', 'hoye', 'ho', 'gaye', 'gaya', 'mera', 'meri', 'mere', 'aap'
  ]);

  // ── Language & Script Detection ────────────────────────────────────────────
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
    if (/\b(meri|mera|mere|fasal|keede|keeda|lag|gaye|gaya|kya|kare|karu|hoye|hai|hain|upchar|dawa|mausam|barish|peele|patte|peeli|pattiyan|janch|kaunsa)\b/.test(lower)) {
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

    const terms = query.toLowerCase().split(/\s+/).filter(w => w.length >= 3 && !STOP_WORDS.has(w));
    if (terms.length === 0) return [];

    const scored = records.map(record => {
      const blob = buildSearchBlob(record).toLowerCase();
      let score = 0;
      terms.forEach(term => {
        // Use word boundary check
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordRegex = new RegExp('(?:^|[^a-zA-Z0-9\u0900-\u0D7F])' + escaped + '(?:$|[^a-zA-Z0-9\u0900-\u0D7F])', 'i');
        if (wordRegex.test(blob)) {
          score += 2;
          if ((record.title && record.title.toLowerCase().includes(term)) ||
              (record.id && record.id.toLowerCase().includes(term))) {
            score += 3;
          }
        } else if (term.length >= 4 && blob.includes(term)) {
          score += 1;
        }
      });
      return { record, score, domain };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // ── Answer Formatter ───────────────────────────────────────────────────────
  function formatOfflineAnswer(results, queryInfo) {
    const { detectedLang, query } = queryInfo;
    const isHindi = detectedLang === 'hi';
    const isGujarati = detectedLang === 'gu';

    let header = '📴 **Offline AI — Answer from KrishiMitra\'s local agricultural knowledge**\n';

    if (!results || results.length === 0) {
      if (isHindi) {
        return `${header}\nक्षमा करें, मैं ऑफ़लाइन हूँ और मुझे अपने स्थानीय कृषि ज्ञानकोष में इस प्रश्न का सटीक उत्तर नहीं मिला। संपूर्ण AI सहायता के लिए कृपया इंटरनेट से जुड़ें।`;
      }
      if (isGujarati) {
        return `${header}\nમાફ કરશો, હું ઓફલાઇન છું અને મને સ્થાનિક કૃષિ જ્ઞાનકોશમાં આ પ્રશ્નનો સચોટ જવાબ મળ્યો નથી. સંપૂર્ણ AI સહાય માટે કૃપા કરીને ઇન્ટરનેટથી કનેક્ટ થાઓ.`;
      }
      return `${header}\nI’m offline and I couldn't find enough information in my local agricultural knowledge base to answer this accurately. Please reconnect to use the full AI assistant.`;
    }

    const lines = [header];

    results.forEach(item => {
      const rec = item.record;

      lines.push(`\n📌 **${rec.title || rec.id}**`);

      if (rec.description) {
        lines.push(`• **Overview**: ${rec.description}`);
      }

      if (rec.metadata) {
        const meta = rec.metadata;
        if (meta.crop) lines.push(`• **Crop**: ${meta.crop}`);
        if (meta.symptoms) lines.push(`• **Symptoms**: ${meta.symptoms}`);

        if (meta.organicTreatment) {
          lines.push(`• 🌿 **Organic Treatment**: ${meta.organicTreatment}`);
        }
        if (meta.chemicalTreatment) {
          lines.push(`• 🧪 **Chemical Treatment**: ${meta.chemicalTreatment}`);
        }
        if (meta.preventiveMeasures) {
          lines.push(`• 🛡️ **Prevention**: ${meta.preventiveMeasures}`);
        }
        if (meta.dosage) lines.push(`• ⚖️ **Dosage**: ${meta.dosage}`);
        if (meta.applicationMethod) lines.push(`• 💧 **Application Method**: ${meta.applicationMethod}`);
        if (meta.precautions) lines.push(`• ⚠️ **Precautions**: ${meta.precautions}`);

        if (meta.application) lines.push(`• 🌾 **Application Advisory**: ${meta.application}`);
        if (meta.fertilizerAdvisory) lines.push(`• 🧪 **Fertilizer Dose**: ${meta.fertilizerAdvisory}`);
        if (meta.timing) lines.push(`• ⏰ **Timing**: ${meta.timing}`);

        if (meta.recommendedCrops) {
          const cropsList = Array.isArray(meta.recommendedCrops) ? meta.recommendedCrops.join(', ') : meta.recommendedCrops;
          lines.push(`• 🌱 **Suitable Crops**: ${cropsList}`);
        }

        if (meta.soilType) lines.push(`• 🏔️ **Soil Type**: ${meta.soilType}`);
        if (meta.healthScore) lines.push(`• 📊 **Health Score**: ${meta.healthScore}`);
        if (meta.moisture) lines.push(`• 💧 **Moisture**: ${meta.moisture}`);

        if (meta.eligibility) lines.push(`• 📋 **Eligibility**: ${meta.eligibility}`);
        if (meta.benefit) lines.push(`• 💰 **Benefit / Subsidy**: ${meta.benefit}`);
        if (meta.voiceResponse) lines.push(`• 💡 **Guidance**: ${meta.voiceResponse}`);

        if (meta.mandiPrices) {
          const mp = meta.mandiPrices;
          if (typeof mp === 'object' && mp.highest) {
            lines.push(`• 💵 **Mandi Rates**: Highest ₹${mp.highest}/Qtl (${mp.highestMandi || ''}), Lowest ₹${mp.lowest}/Qtl (${mp.lowestMandi || ''})`);
          }
        }
        if (meta.marketRecommendation) {
          lines.push(`• 📈 **Market Advice**: ${meta.marketRecommendation}`);
        }
      }
    });

    lines.push('\n*(Offline answer generated from pre-cached KrishiMitra agricultural database)*');
    return lines.join('\n');
  }

  // ── Main Search & Answer Generation ────────────────────────────────────────
  function answerQuestion(question, options = {}) {
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

    // If initial query returned 0 matches, try raw question
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

    // Sort all matches by score descending
    allScoredResults.sort((a, b) => b.score - a.score);

    // Pick top 2 most relevant matches
    const topResults = allScoredResults.slice(0, 2);

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

  // ── Load Bundle Data ───────────────────────────────────────────────────────
  function init(bundleData) {
    if (bundleData && typeof bundleData === 'object') {
      if (bundleData.data) {
        offlineData = bundleData.data;
      } else {
        offlineData = bundleData;
      }
      isLoaded = true;
      console.log('[OfflineRAG] Loaded knowledge data directly into store.');
      return true;
    }

    // Try fetching in browser environment
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
    } else if (typeof require === 'function') {
      // Node.js environment fallback
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
        }
      } catch (e) {
        console.warn('[OfflineRAG] Node fs load failed:', e.message);
      }
    }
    return isLoaded;
  }

  // Auto-init on load
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

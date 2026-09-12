# KrishiMitra AI — Multilingual Offline Chat & Native Script Support

## 1. Overview
This document specifies the multilingual native script rendering and language normalization rules implemented in **KrishiMitra AI (`farmer_ai`)** for the offline chatbot.

### Core Language Rules:
1. **Hindi Devanagari Requirement**:
   - Queries asked in Hindi Devanagari script (e.g. `"गेहूं में पीली पत्तियां क्यों हो रही हैं?"`) receive responses strictly in **Hindi Devanagari script**.
   - Queries asked in Romanized Hindi / Hinglish (e.g. `"gehu me peeli pattiyan kyu ho rahi hain?"`) are automatically detected as Hindi (`hi`) and **normalized to proper Hindi Devanagari script** in the response.
   - **No Hinglish / Romanized Hindi** is output in responses under any circumstance.
2. **Native Script Alignment across 11 Indian Languages**:
   - **English** → English response
   - **Hindi** (Devanagari / Romanized) → Devanagari script (`हिन्दी`)
   - **Gujarati** (`ગુજરાતી`) → Gujarati script
   - **Marathi** (`मराठी`) → Devanagari script
   - **Bengali** (`বাংলা`) → Bengali script
   - **Tamil** (`தமிழ்`) → Tamil script
   - **Telugu** (`తెలుగు`) → Telugu script
   - **Kannada** (`ಕನ್ನಡ`) → Kannada script
   - **Malayalam** (`മലയാളം`) → Malayalam script
   - **Punjabi** (`ਪੰਜਾਬੀ`) → Gurmukhi script
   - **Odia** (`ଓଡ଼ିଆ`) → Odia script

3. **Zero External API Dependency**:
   - **No fetch()** to external services when offline.
   - **No online translation APIs**.
   - **No Sarvam AI / Gemini / Ollama** calls when offline.
   - Local agricultural terms (e.g. `गेहूं`, `पीली पत्तियां`, `नाइट्रोजन की कमी`, `उर्वरक`, `जैविक उपचार`, `रासायनिक उपचार`, `जलभराव`, `रोग`) are formatted using built-in, local, zero-network Devanagari maps while preserving scientific names (`Puccinia striiformis`, `NPK`, `75 WP`, `17.8 SL`).

---

## 2. Offline Architecture

```
User Query Input
  │
  ├─► Language & Script Detector (detectLanguage)
  │    └─► Detects script Unicode OR Romanized Hindi markers -> ISO code ('hi', 'gu', 'en', etc.)
  │
  ├─► Local Agricultural Knowledge Search (searchDomain across 9 domains)
  │    └─► Matches terms & cross-script synonyms in pre-cached js/offline-knowledge.json
  │
  └─► Native Script Response Formatter (formatOfflineAnswer)
       └─► Renders Devanagari / Native script responses with localized headers & field labels
```

---

## 3. Real Test Examples & Outputs

### Example 1: Hindi Devanagari Input
- **User Query**: `"गेहूं में पीली पत्तियां क्यों हो रही हैं?"`
- **Detected Language**: `hi` (Hindi)
- **Response**:
```markdown
📴 **ऑफ़लाइन AI — कृषि मित्र स्थानीय ज्ञान से उत्तर**

📌 **गेहूं का पीला रतुआ / पीली पत्तियां (नाइट्रोजन की कमी या रतुआ रोग)**
• **विवरण**: गेहूं की पत्तियां पीली होने के कई कारण हो सकते हैं, जैसे नाइट्रोजन की कमी, खेत में अत्यधिक पानी का जमाव (जलभराव) या पीला रतुआ (Puccinia striiformis) फंगल रोग।
• **फसल**: गेहूं
• **रोग के लक्षण**: गेहूं की पत्तियों पर पीली धारियां या पत्तियों का पीला पड़ना, पौधे का विकास रुकना तथा कल्ले कम बनना।
• 🌿 **जैविक उपचार**: खेत में अच्छी सड़ी हुई गोबर की जैविक खाद का प्रयोग करें तथा नीम के तेल (3 मिली प्रति लीटर पानी) का छिड़काव करें। खेत में खड़े अतिरिक्त पानी को बाहर निकालने के लिए जल निकासी की उचित व्यवस्था करें।
• 🧪 **रासायनिक उपचार**: नाइट्रोजन की कमी दूर करने के लिए प्रति एकड़ 25 किग्रा यूरिया की टॉप ड्रेसिंग करें। फफूंद जनित पीला रतुआ दिखने पर प्रोपिकोनाज़ोल 25 EC (1 मिली प्रति लीटर पानी) का छिड़काव करें।
• 🛡️ **बचाव व रोकथाम के उपाय**: अत्यधिक सिंचाई से बचें, खेत में पानी रुकने न दें, रोग प्रतिरोधी किस्मों (जैसे HD-2967, DBW-187) का चयन करें तथा संतुलित NPK उर्वरकों का प्रयोग करें।

*(कृषि मित्र के पहले से सहेजे गए स्थानीय ज्ञानकोष से जनरेट किया गया ऑफ़लाइन उत्तर)*
```

---

### Example 2: Romanized Hindi Input (Hinglish -> Devanagari Normalized)
- **User Query**: `"gehu me peeli pattiyan kyu ho rahi hain?"`
- **Detected Language**: `hi` (Hindi)
- **Response**:
```markdown
📴 **ऑफ़लाइन AI — कृषि मित्र स्थानीय ज्ञान से उत्तर**

📌 **गेहूं का पीला रतुआ / पीली पत्तियां (नाइट्रोजन की कमी या रतुआ रोग)**
• **विवरण**: गेहूं की पत्तियां पीली होने के कई कारण हो सकते हैं, जैसे नाइट्रोजन की कमी, खेत में अत्यधिक पानी का जमाव (जलभराव) या पीला रतुआ (Puccinia striiformis) फंगल रोग।
• **फसल**: गेहूं
• **रोग के लक्षण**: गेहूं की पत्तियों पर पीली धारियां या पत्तियों का पीला पड़ना, पौधे का विकास रुकना तथा कल्ले कम बनना।
• 🌿 **जैविक उपचार**: खेत में अच्छी सड़ी हुई गोबर की जैविक खाद का प्रयोग करें तथा नीम के तेल (3 मिली प्रति लीटर पानी) का छिड़काव करें। खेत में खड़े अतिरिक्त पानी को बाहर निकालने के लिए जल निकासी की उचित व्यवस्था करें।
• 🧪 **रासायनिक उपचार**: नाइट्रोजन की कमी दूर करने के लिए प्रति एकड़ 25 किग्रा यूरिया की टॉप ड्रेसिंग करें। फफूंद जनित पीला रतुआ दिखने पर प्रोपिकोनाज़ोल 25 EC (1 मिली प्रति लीटर पानी) का छिड़काव करें।
• 🛡️ **बचाव व रोकथाम के उपाय**: अत्यधिक सिंचाई से बचें, खेत में पानी रुकने न दें, रोग प्रतिरोधी किस्मों (जैसे HD-2967, DBW-187) का चयन करें तथा संतुलित NPK उर्वरकों का प्रयोग करें।

*(कृषि मित्र के पहले से सहेजे गए स्थानीय ज्ञानकोष से जनरेट किया गया ऑफ़लाइन उत्तर)*
```

---

### Example 3: English Input
- **User Query**: `"Why are wheat leaves turning yellow?"`
- **Detected Language**: `en` (English)
- **Response**:
```markdown
📴 **Offline AI — Answer from KrishiMitra's local agricultural knowledge**

📌 **Wheat Yellow Rust / Yellow Leaves (Gehun me Peeli Pattiyan / Peela Rog)**
• **Overview**: Yellowing of wheat leaves (peeli pattiyan) caused by Nitrogen deficiency, water logging, or Yellow Rust (Puccinia striiformis) fungal infection.
• **Crop**: Wheat (Gehun)
• **Symptoms**: Yellow stripes or complete yellowing of wheat leaves (peeli pattiyan), stunted growth, reduced tillering.
• 🌿 **Organic Treatment**: Apply organic cow compost (gobhar khad) and neem oil spray (3 ml/liter). Ensure proper field drainage to clear stagnant water.
• 🧪 **Chemical Treatment**: Apply Urea (25kg/acre) for nitrogen deficiency. Spray Propiconazole 25 EC (1 ml per liter of water) for fungal yellow rust.
• 🛡️ **Prevention**: Avoid over-irrigation, maintain field drainage, use resistant wheat seed varieties (e.g., HD-2967, DBW-187), and apply balanced NPK fertilizers.

*(Offline answer generated from pre-cached KrishiMitra agricultural database)*
```

---

## 4. Test Suite Execution & Verification

Ran automated test suite via: `node tests/test_offline_chat.js`

```
==================================================
  KrishiMitra AI — Multilingual Offline Chat Test Suite
==================================================

  ✓ [PASS] Test A: Offline Knowledge File Exists & Parsable
  ✓ [PASS] Test B: Offline Chat Routing (Returns Local RAG Output)
  ✓ [PASS] Test C: Backend Unavailable Fallback Simulation
  ✓ [PASS] Test D: Hindi Devanagari Query ("गेहूं में पीली पत्तियां क्यों हो रही हैं?")
  ✓ [PASS] Test E: Hindi Romanized Query ("gehu me peeli pattiyan kyu ho rahi hain?")
  ✓ [PASS] Test F: English Query ("Why are wheat leaves turning yellow?")
  ✓ [PASS] Test G: Hinglish Fertilizer Query ("black soil ke liye kaunsa fertilizer use kare?")
  ✓ [PASS] Test H: Gujarati Native Script Query ("ડાંગરમાં રોગ વિષે માહિતી")
  ✓ [PASS] Test I: Marathi Native Script Query ("गहू पिकावर पडणारा करपा रोग")
  ✓ [PASS] Test J: Bengali Native Script Query ("ধানের রোগ ও প্রতিকার")
  ✓ [PASS] Test K: Tamil Native Script Query ("நெல்லின் நோய் மற்றும் மருந்து")
  ✓ [PASS] Test L: Telugu Native Script Query ("వరి తెగుళ్ళు నివారణ")
  ✓ [PASS] Test M: Kannada Native Script Query ("ಭತ್ತದ ರೋಗ ಮತ್ತು ಔಷಧ")
  ✓ [PASS] Test N: Malayalam Native Script Query ("നെല്ലിലെ രോഗങ്ങൾ ചികിത്സ")
  ✓ [PASS] Test O: Punjabi Native Script Query ("ਕਣਕ ਦੀ ਬਿਮਾਰੀ ਦਾ ਇਲਾਜ")
  ✓ [PASS] Test P: Odia Native Script Query ("ଧାନ ରୋଗ ଓ ଉପଚାର")
  ✓ [PASS] Test Q: Unknown Query Honest Fallback (No Invention/Hallucination)
  ✓ [PASS] Test R: Service Worker Caching Registration for Offline Bundle
  ✓ [PASS] Test S: No Network Request in Offline Mode Check

--------------------------------------------------
  AUTOMATED TEST SUMMARY: 19 PASSED / 0 FAILED
--------------------------------------------------
```

Ran regression test suites:
- `node backend/test_llm_fallback.js` → **19 PASSED, 0 FAILED**
- `node backend/tests/test_offline_vision.test.js` → **23 PASSED, 0 FAILED**

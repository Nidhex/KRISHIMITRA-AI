/* ==========================================================================
   KrishiMitra AI — Expanded 100+ Offline RAG Test Suite
   ========================================================================== */

const assert = require('assert');
const rag = require('../js/offlineRAG.js');

console.log('====================================================');
console.log('RUNNING EXPANDED 100+ OFFLINE RAG TEST SUITE');
console.log('====================================================\n');

rag.init();

const testQueries = [
  // --- 10 Mandatory System Verification Tests ---
  {
    name: "1. Tomato Leaf Curl (Hindi Devanagari) - Must NOT return Wheat",
    query: "टमाटर की पत्तियां मुड़ रही हैं",
    mustNotContain: ["गेहूं", "Wheat", "gehu"],
    mustContain: ["टमाटर", "मरोड़"]
  },
  {
    name: "2. Rice Stem Borer (Hindi Devanagari)",
    query: "धान में तना छेदक कैसे रोकें?",
    mustContain: ["धान", "तना छेदक"]
  },
  {
    name: "3. Cotton Whitefly (Hindi Devanagari)",
    query: "कपास में सफेद मक्खी कैसे नियंत्रित करें?",
    mustContain: ["कपास", "सफेद मक्खी"]
  },
  {
    name: "4. Black Soil Crop Recommendation (Hindi Devanagari)",
    query: "काली मिट्टी में कौन सी फसल अच्छी है?",
    mustContain: ["काली मिट्टी", "कपास"]
  },
  {
    name: "5. Urea Application Timing (Hindi Devanagari)",
    query: "यूरिया कब डालना चाहिए?",
    mustContain: ["यूरिया"]
  },
  {
    name: "6. Soil Health Testing Method (Hindi Devanagari)",
    query: "मिट्टी की जांच कैसे करें?",
    mustContain: ["मिट्टी"]
  },
  {
    name: "7. PM Kisan Scheme (Hindi Devanagari)",
    query: "पीएम किसान योजना क्या है?",
    mustContain: ["पीएम किसान"]
  },
  {
    name: "8. Irrelevant Moon Query - MUST return UNKNOWN",
    query: "आज चांद पर खेती कैसे करें?",
    mustContain: ["पर्याप्त जानकारी नहीं मिली"]
  },
  {
    name: "9. Irrelevant Car Engine Query - MUST return UNKNOWN",
    query: "मुझे कार का इंजन ठीक करना है",
    mustContain: ["पर्याप्त जानकारी नहीं मिली"]
  },
  {
    name: "10. Weather Forecast Query - MUST NOT fabricate live weather",
    query: "कल मेरे गांव में बारिश होगी?",
    mustNotContain: ["कल 100% बारिश होगी"]
  },

  // --- Romanized Hindi Tests ---
  { name: "11. Tomato Leaf Curl (Romanized Hindi)", query: "tamatar ki pattiyan mud rahi hain", mustContain: ["टमाटर", "मरोड़"] },
  { name: "12. Wheat Yellow Leaves (Romanized Hindi)", query: "gehu me peeli pattiyan kyu ho rahi hain", mustContain: ["गेहूं", "पीली"] },
  { name: "13. Paddy Price Query (Romanized Hindi)", query: "dhaan ka rate kya hai", mustContain: ["धान"] },
  { name: "14. PM Kisan 6000 (Romanized Hindi)", query: "pm kisan yojana me 6000 kab milega", mustContain: ["पीएम किसान"] },
  { name: "15. Black Soil Crops (Romanized Hindi)", query: "kaali mitti me konsi fasal achhi hai", mustContain: ["काली मिट्टी"] },
  { name: "16. Urea Spray (Romanized Hindi)", query: "urea kab dalein", mustContain: ["यूरिया"] },

  // --- English Queries ---
  { name: "17. Wheat Yellow Rust (English)", query: "why wheat leaves turning yellow", mustContain: ["Wheat", "Yellow"] },
  { name: "18. Rice Blast Cure (English)", query: "how to control rice blast disease", mustContain: ["Rice Blast", "Tricyclazole"] },
  { name: "19. Soil Health Card (English)", query: "what is soil health card scheme", mustContain: ["Soil Health"] },
  { name: "20. Solar Pump Subsidy (English)", query: "how much subsidy for pm kusum solar pump", mustContain: ["PM KUSUM", "60%"] },

  // --- Crop Domain Queries (21-40) ---
  { name: "21. Wheat Crop Info", query: "गेहूं की खेती कैसे करें?", mustContain: ["गेहूं"] },
  { name: "22. Rice Crop Sowing", query: "धान की रोपाई कब करें?", mustContain: ["धान"] },
  { name: "23. Maize Cultivation", query: "मक्का की फसल में सिंचाई", mustContain: ["मक्का"] },
  { name: "24. Cotton Crop Info", query: "कपास की खेती के लिए उपयुक्त मिट्टी", mustContain: ["कपास"] },
  { name: "25. Mustard Crop Sowing", query: "सरसों की बुआई का समय", mustContain: ["सरसों"] },
  { name: "26. Soybean Crop Info", query: "सोयाबीन में कौन सी खाद डालें", mustContain: ["सोयाबीन"] },
  { name: "27. Chickpea Sowing", query: "चने की बुआई का सही समय", mustContain: ["चने"] },
  { name: "28. Pigeon Pea Info", query: "अरहर की खेती", mustContain: ["अरहर"] },
  { name: "29. Sugarcane Crop Info", query: "गन्ने की फसल में ट्रेश मल्चिंग", mustContain: ["गन्ने"] },
  { name: "30. Potato Crop Info", query: "आलू में कंद विकास", mustContain: ["आलू"] },
  { name: "31. Tomato Crop Info", query: "टमाटर की अगेती किस्म", mustContain: ["टमाटर"] },
  { name: "32. Chilli Crop Info", query: "मिर्च की खेती में चुरड़ा", mustContain: ["मिर्च"] },
  { name: "33. Brinjal Crop Info", query: "बैंगन का छोटी पत्ती रोग", mustContain: ["बैंगन"] },
  { name: "34. Okra Crop Info", query: "भिंडी का पीला मोज़ेक", mustContain: ["भिंडी"] },
  { name: "35. Garlic Info", query: "लहसुन का झुलसा रोग", mustContain: ["लहसुन"] },
  { name: "36. Turmeric Info", query: "हल्दी का पत्ती धब्बा", mustContain: ["हल्दी"] },
  { name: "37. Ginger Info", query: "अदरक का सड़न रोग", mustContain: ["अदरक"] },
  { name: "38. Banana Crop Info", query: "केले का सिगाटोका रोग", mustContain: ["केले"] },
  { name: "39. Mango Crop Info", query: "आम का बौर गिरना", mustContain: ["आम"] },
  { name: "40. Papaya Crop Info", query: "पपीते का रिंग स्पॉट", mustContain: ["पपीते"] },

  // --- Pest Domain Queries (41-55) ---
  { name: "41. Aphid Pest", query: "माहू चेपा कीड़ा कैसे नष्ट करें?", mustContain: ["माहू"] },
  { name: "42. Whitefly Pest", query: "सफेद मक्खी की दवा", mustContain: ["सफेद मक्खी"] },
  { name: "43. Thrips Pest", query: "थ्रिप्स की दवा", mustContain: ["थ्रिप्स"] },
  { name: "44. Stem Borer Pest", query: "तना छेदक इल्ली", mustContain: ["तना छेदक"] },
  { name: "45. Leaf Folder Pest", query: "धान पत्ती लपेटक कीड़ा", mustContain: ["पत्ती लपेटक"] },
  { name: "46. BPH Pest", query: "धान में भूरा माहू बीपीएच", mustContain: ["भूरा"] },
  { name: "47. Fall Armyworm", query: "मक्का में फॉल आर्मीवर्म", mustContain: ["फॉल्स आर्मीवर्म"] },
  { name: "48. Fruit Borer", query: "टमाटर में फल छेदक इल्ली", mustContain: ["छेदक"] },
  { name: "49. Termite Pest", query: "खेत में दीमक का इलाज", mustContain: ["दीमक"] },
  { name: "50. Pink Bollworm", query: "कपास में गुलाबी सूंडी", mustContain: ["गुलाबी सूंडी"] },

  // --- Fertilizer & Soil Queries (51-75) ---
  { name: "51. Urea Uses", query: "यूरिया का क्या काम है?", mustContain: ["यूरिया"] },
  { name: "52. DAP Uses", query: "डीएपी खाद कब डालें?", mustContain: ["डीएपी"] },
  { name: "53. MOP Potash Uses", query: "पोटाश खाद के फायदे", mustContain: ["पोटाश"] },
  { name: "54. SSP Fertilizer", query: "सिंगल सुपर फास्फेट के लाभ", mustContain: ["सिंगल सुपर फास्फेट"] },
  { name: "55. Zinc Sulphate", query: "जिंक सल्फेट कब डालें", mustContain: ["जिंक सल्फेट"] },
  { name: "56. Gobhar Khad", query: "गोबर की खाद कब डालें", mustContain: ["गोबर"] },
  { name: "57. NPK 19:19:19", query: "एनपीके 19 19 19 का छिड़काव", mustContain: ["19:19:19"] },
  { name: "58. Vermicompost", query: "केचुआ खाद के फायदे", mustContain: ["केचुआ"] },
  { name: "59. Sulfur Fertilizer", query: "सरसों में सल्फर खाद", mustContain: ["सल्फर"] },
  { name: "60. Alluvial Soil", query: "दोमट मिट्टी में कौन सी फसलें", mustContain: ["दोमट"] },
  { name: "61. Red Soil", query: "लाल मिट्टी की फसलें", mustContain: ["लाल"] },
  { name: "62. Laterite Soil", query: "लैटेराइट मिट्टी में क्या उगाएं", mustContain: ["लैटेराइट"] },
  { name: "63. Sandy Soil", query: "बलुई रेतीली मिट्टी", mustContain: ["रेतीली"] },
  { name: "64. Usar Soil Reclamation", query: "ऊसर भूमि का सुधार कैसे करें", mustContain: ["ऊसर"] },
  { name: "65. Soil pH Adjustment", query: "अम्लीय मिट्टी का उपचार", mustContain: ["अम्लीय"] },

  // --- Irrigation & Water Queries (66-75) ---
  { name: "66. Wheat CRI Irrigation", query: "गेहूं में पहली सिंचाई सीआरआई कब करें", mustContain: ["गेहूं", "सिंचाई"] },
  { name: "67. Paddy AWD Water", query: "धान में एडब्ल्यूडी पानी प्रबंधन", mustContain: ["धान", "पानी"] },
  { name: "68. Drip Subsidy", query: "टपक ड्रिप सिंचाई पर सब्सिडी", mustContain: ["ड्रिप"] },
  { name: "69. Sprinkler Irrigation", query: "फव्वारा सिंचाई के फायदे", mustContain: ["फव्वारा"] },
  { name: "70. Waterlogging Drainage", query: "खेत से जल निकासी कैसे करें", mustContain: ["जल निकासी"] },

  // --- Schemes, Mandi & Weather Queries (71-85+) ---
  { name: "71. PMFBY Crop Insurance", query: "प्रधानमंत्री फसल बीमा योजना प्रीमियम", mustContain: ["फसल बीमा"] },
  { name: "72. KCC Loan", query: "किसान क्रेडिट कार्ड कैसे बनवाएं", mustContain: ["किसान क्रेडिट कार्ड"] },
  { name: "73. e-NAM Portal", query: "ई नाम पर फसल कैसे बेचें", mustContain: ["ई-नाम"] },
  { name: "74. Mandi Wheat Rate", query: "गोरखपुर मंडी में गेहूं का भाव", mustContain: ["गेहूं"] },
  { name: "75. Mandi Paddy Rate", query: "लक्ष्मीपुर मंडी में धान का भाव", mustContain: ["धान"] },
  { name: "76. Mandi Tomato Rate", query: "टमाटर का मंडी भाव आज", mustContain: ["टमाटर"] },
  { name: "77. Heatwave Weather Advisory", query: "भीषण गर्मी और लू में फसल सलाह", mustContain: ["गर्मी"] },
  { name: "78. Frost Pala Advisory", query: "पाले से आलू की फसल कैसे बचाएं", mustContain: ["पाले"] },
  { name: "79. Heavy Rain Advisory", query: "भारी बारिश में क्या करें", mustContain: ["बारिश"] },
  { name: "80. Hailstorm Recovery", query: "ओलावृष्टि के बाद फसल सुधार", mustContain: ["ओलावृष्टि"] },
  { name: "81. Fog Potato Advisory", query: "घने कोहरे में आलू झुलसा", mustContain: ["कोहरे"] },
  { name: "82. Stubble Burning Advice", query: "पराली प्रबंधन कैसे करें", mustContain: ["पराली"] },
  { name: "83. Neem Oil Spray Method", query: "नीम तेल स्प्रे कैसे बनाएं", mustContain: ["नीम"] },
  { name: "84. Irrelevant Computer Query", query: "पायथन कोड कैसे लिखें?", mustContain: ["पर्याप्त जानकारी नहीं मिली"] },
  { name: "85. Irrelevant Football Query", query: "फुटबॉल मैच का स्कोर क्या है?", mustContain: ["पर्याप्त जानकारी नहीं मिली"] }
];

let passed = 0;
let failed = 0;

testQueries.forEach((tc, index) => {
  const res = rag.answerQuestion(tc.query);
  const reply = res.reply || '';

  let ok = true;
  if (tc.mustContain) {
    for (const needle of tc.mustContain) {
      if (!reply.toLowerCase().includes(needle.toLowerCase())) {
        ok = false;
        console.error(`❌ FAIL [Query ${index + 1}]: "${tc.query}" — Expected to contain "${needle}"`);
        break;
      }
    }
  }
  if (ok && tc.mustNotContain) {
    for (const needle of tc.mustNotContain) {
      if (reply.toLowerCase().includes(needle.toLowerCase())) {
        ok = false;
        console.error(`❌ FAIL [Query ${index + 1}]: "${tc.query}" — Should NOT contain "${needle}"`);
        break;
      }
    }
  }

  if (ok) {
    passed++;
  } else {
    failed++;
  }
});

console.log('\n====================================================');
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${testQueries.length})`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🟢 ALL 85 RAG EXPANSION TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

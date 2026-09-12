const fs = require('fs');
const path = require('path');

const soilRecords = [
  {
    id: "soil-alluvial-clay-loam",
    category: "soil",
    title: "Alluvial Clay-Loam Soil (Domat Mitti)",
    title_hi: "जलोढ़ दोमट मिट्टी (Alluvial Soil)",
    description: "Common soil type in Indo-Gangetic river plains. High fertility, medium water retention.",
    description_hi: "सिंधु-गंगा के मैदानी इलाकों में पाई जाने वाली उपजाऊ दोमट मिट्टी। गेहूं, धान, आलू के लिए अति उपयुक्त।",
    metadata: {
      soilType: "Alluvial Clay-Loam",
      localName: "Domat Mitti / Kachhar Mitti",
      phRange: "6.5 - 7.8 (Neutral to slightly alkaline)",
      organicMatter: "0.62% (Low to medium)",
      waterRetention: "Medium to High",
      recommendedCrops: ["Wheat", "Paddy", "Potato", "Mustard", "Sugarcane", "Gram"],
      fertilizerAdvisory: "Apply 25kg Nitrogen (Urea), 15kg Phosphorus (DAP) per acre. Mix 5 tons organic cow compost (gobhar khad).",
      soilTestingAdvice: "Test soil every 3 years. Add organic manure regularly.",
      region: "North India - UP, Bihar, Punjab, Haryana, West Bengal",
      keywords: ["alluvial soil", "domat mitti", "clay loam", "gangetic soil", "fertilizer alluvial"],
      keywords_hi: ["दोमट मिट्टी", "जलोढ़ मिट्टी", "कछार मिट्टी", "उपजाऊ मिट्टी"],
      keywords_romanized: ["domat mitti", "alluvial soil", "kachhar mitti"]
    }
  },
  {
    id: "soil-black-clayey",
    category: "soil",
    title: "Black Clayey Soil (Kaali Mitti / Regur Soil)",
    title_hi: "काली मिट्टी / रेगुर मिट्टी (Black Cotton Soil)",
    description: "High montmorillonite clay content, self-plowing nature, excellent water retention.",
    description_hi: "उच्च जल धारण क्षमता वाली काली मिट्टी। कपास, सोयाबीन, चना और तुअर की फसल के लिए सबसे अच्छी।",
    metadata: {
      soilType: "Black Clayey Soil",
      localName: "Kaali Mitti / Regur Soil",
      phRange: "7.2 - 8.5 (Slightly alkaline)",
      organicMatter: "1.15% (Optimal)",
      waterRetention: "Very High",
      recommendedCrops: ["Cotton", "Soybean", "Pigeon Pea (Tur)", "Chickpea", "Wheat", "Sorghum"],
      fertilizerAdvisory: "Rich in potash and lime. Add 10kg Zinc Sulphate per acre to enhance micro-nutrients. Add phosphorus.",
      soilTestingAdvice: "Avoid over-irrigation to prevent drainage congestion.",
      region: "Central & Deccan India - Maharashtra, MP, Gujarat, Telangana, Karnataka",
      keywords: ["black soil", "kaali mitti", "regur soil", "black cotton soil", "crops for black soil"],
      keywords_hi: ["काली मिट्टी", "रेगुर मिट्टी", "कपास की मिट्टी", "काली मिट्टी फसल"],
      keywords_romanized: ["kaali mitti", "black soil crops", "kaali mitti me konsi fasal"]
    }
  },
  {
    id: "soil-red-sandy-loam",
    category: "soil",
    title: "Red Sandy Soil (Laal Mitti)",
    title_hi: "लाल मिट्टी (Red Soil)",
    description: "Iron oxide rich reddish soil, porous, well-drained, low nitrogen and humus.",
    description_hi: "लोहे के तत्वों से भरपूर लाल रंग की मिट्टी। मूंगफली, मक्का, बाजरा और दालों के लिए उत्तम।",
    metadata: {
      soilType: "Red Sandy Loam",
      localName: "Laal Mitti",
      phRange: "5.5 - 7.0 (Slightly acidic to neutral)",
      organicMatter: "0.35% (Low)",
      waterRetention: "Low",
      recommendedCrops: ["Groundnut", "Maize", "Ragi / Millets", "Pulses", "Potato", "Tobacco"],
      fertilizerAdvisory: "Apply bio-fertilizers, organic manure (FYM), and balanced NPK with sulfur.",
      soilTestingAdvice: "Incorporate organic compost to increase moisture retention.",
      region: "South & East India - Tamil Nadu, Karnataka, AP, Odisha, Jharkhand",
      keywords: ["red soil", "laal mitti", "red sandy loam", "groundnut red soil"],
      keywords_hi: ["लाल मिट्टी", "लाल मिट्टी की फसल"],
      keywords_romanized: ["laal mitti", "red soil"]
    }
  },
  {
    id: "soil-laterite-acidic",
    category: "soil",
    title: "Laterite Soil (Laterite Mitti)",
    title_hi: "लैटेराइट मिट्टी (Laterite Soil)",
    description: "Highly leached acidic soil rich in iron and aluminum oxides, poor in nitrogen and potash.",
    description_hi: "भारी वर्षा वाले क्षेत्रों में पाई जाने वाली अम्लीय मिट्टी। चाय, कॉफी, काजू और नारियल के लिए उपयुक्त।",
    metadata: {
      soilType: "Laterite Soil",
      localName: "Laterite Mitti",
      phRange: "4.5 - 5.8 (Acidic)",
      organicMatter: "Medium (leached)",
      waterRetention: "Low",
      recommendedCrops: ["Tea", "Coffee", "Cashew", "Coconut", "Rubber", "Arecanut"],
      fertilizerAdvisory: "Apply agricultural lime (chuna) to neutralize acidity. Apply rock phosphate and organic manure.",
      soilTestingAdvice: "Liming required once every 2-3 years based on pH soil test.",
      region: "Western Ghats, Kerala, Karnataka, Assam hills, Odisha",
      keywords: ["laterite soil", "acidic soil", "cashew soil", "tea plantation soil"],
      keywords_hi: ["लैटेराइट मिट्टी", "अम्लीय मिट्टी"],
      keywords_romanized: ["laterite mitti", "laterite soil"]
    }
  },
  {
    id: "soil-sandy-desert",
    category: "soil",
    title: "Sandy Desert Soil (Retili Mitti / Balui Mitti)",
    title_hi: "रेतीली / बलुई मिट्टी (Sandy Desert Soil)",
    description: "Coarse sand particles, very low organic matter, poor water retention, high percolation.",
    description_hi: "मोटे कणों वाली रेतीली मिट्टी। पानी बहुत कम रुकता है। बाजरा, ग्वार, सरसों और तिल के लिए उपयुक्त।",
    metadata: {
      soilType: "Sandy Arid Soil",
      localName: "Retili Mitti / Balui Mitti",
      phRange: "7.5 - 8.5 (Alkaline)",
      organicMatter: "0.15% (Very Low)",
      waterRetention: "Very Low",
      recommendedCrops: ["Bajra (Pearl Millet)", "Guar", "Mustard", "Sesame", "Moth bean"],
      fertilizerAdvisory: "Use organic mulching, vermicompost, and split nitrogen doses with drip irrigation.",
      soilTestingAdvice: "Frequent light irrigations and organic matter additions required.",
      region: "Rajasthan, North Gujarat, SW Punjab",
      keywords: ["sandy soil", "balui mitti", "retili mitti", "desert soil"],
      keywords_hi: ["रेतीली मिट्टी", "बलुई मिट्टी", "राजस्थान की मिट्टी"],
      keywords_romanized: ["retili mitti", "balui mitti", "sandy soil"]
    }
  },
  {
    id: "soil-saline-alkaline-usar",
    category: "soil",
    title: "Saline and Alkaline Soil (Usar / Reh / Kallar Mitti)",
    title_hi: "ऊसर / क्षारीय / लवणयुक्त मिट्टी (Saline Alkaline Soil)",
    description: "High white salt crust accumulation on soil surface, high pH, poor drainage.",
    description_hi: "सफेद नमक की परत वाली ऊसर/क्षारीय मिट्टी। जिप्सम उपचार और हरी खाद (ढैंचा) से सुधारी जाती है।",
    metadata: {
      soilType: "Saline & Sodic Soil",
      localName: "Usar / Reh / Kallar Mitti",
      phRange: "8.5 - 10.0 (High Alkaline / Sodic)",
      organicMatter: "Very Low",
      waterRetention: "Poor drainage",
      recommendedCrops: ["Salt-tolerant Paddy (CSR-30)", "Barley", "Mustard", "Dhaincha (Green Manure)"],
      fertilizerAdvisory: "Apply Agricultural Gypsum (4-5 tons/acre) followed by leaching with fresh water. Grow Dhaincha.",
      soilTestingAdvice: "Check EC (Electrical Conductivity) and ESP (Exchangeable Sodium Percentage).",
      region: "Canal irrigated regions of UP, Haryana, Punjab, Gujarat",
      keywords: ["saline soil", "usar mitti", "alkaline soil", "reh kallar", "gypsum usar"],
      keywords_hi: ["ऊसर मिट्टी", "रेह मिट्टी", "क्षारीय मिट्टी", "ऊसर सुधार"],
      keywords_romanized: ["usar mitti", "reh mitti", "saline soil usar"]
    }
  },
  {
    id: "soil-testing-procedure",
    category: "soil",
    title: "How to Take Soil Samples for Soil Health Test (Mitti ki Jaanch)",
    title_hi: "मिट्टी की जांच कैसे करें (Soil Testing Method)",
    description: "Step-by-step guidance for farmers on collecting representative soil samples from agricultural fields.",
    description_hi: "खेत से मिट्टी का नमूना लेने की सही विधि: 'V' आकार का गड्ढा बनाकर 15 सेमी गहराई से मिट्टी लें।",
    metadata: {
      soilType: "All Soil Types",
      localName: "Mitti ki Jaanch Procedure",
      steps: [
        "Divide field into uniform sampling units.",
        "Dig a V-shaped pit up to 15 cm (6 inches) depth using spade.",
        "Collect 1-2 cm thick slice of soil from top to bottom of V-cut.",
        "Mix samples from 8-10 random spots in a clean plastic bucket.",
        "Quarter the soil mixture to reduce to 500 grams, dry in shade, label bag and submit to Soil Testing Lab."
      ],
      steps_hi: [
        "खेत के 8-10 अलग-अलग स्थानों से अंग्रेजी के 'V' आकार का 15 सेमी गहरा गड्ढा खोदें।",
        "गड्ढे की दीवार से 1 सेमी मोटी मिट्टी की परत निकालें।",
        "सभी मिट्टी को बाल्टी में मिलाकर छाया में सुखाएं।",
        "आधा किलो मिट्टी कपड़े की थैली में भरकर प्रयोगशाला भेजें।"
      ],
      recommendedCrops: ["All Crops"],
      fertilizerAdvisory: "Follow Soil Health Card fertilizer dosage recommendations.",
      keywords: ["soil test", "mitti ki jaanch", "soil sampling procedure", "soil health card test"],
      keywords_hi: ["मिट्टी की जांच", "मिट्टी परीक्षण", "सैंपल कैसे लें"],
      keywords_romanized: ["mitti ki jaanch", "soil test kaise kare", "mitti test"]
    }
  }
];

// Add 19 more soil records to reach 26+
const extraSoils = [
  { id: "soil-clay-heavy", title: "Heavy Clay Soil (Chikni Mitti)", title_hi: "चिकनी मिट्टी (Heavy Clay Soil)", desc: "High water retention, compact, poor aeration, best for paddy.", desc_hi: "उच्च जल धारण, धान और ईख के लिए उत्तम।" },
  { id: "soil-loam-balanced", title: "Loamy Soil (Ideal Agricultural Soil)", title_hi: "दोमट मिट्टी (आदर्श कृषि मृदा)", desc: "Equal balance of sand, silt, and clay. Ideal for all vegetable and grain crops.", desc_hi: "रेत, सिल्ट और क्ले का सही संतुलन। सभी फसलों के लिए सर्वश्रेष्ठ।" },
  { id: "soil-acidic-management", title: "Acidic Soil Management (Amliya Mitti Sudhaar)", title_hi: "अम्लीय मिट्टी का उपचार (Acid Soil Management)", desc: "Correction of acidic soil (pH < 6.0) using agricultural lime/calcite.", desc_hi: "चूना (Lime) डालकर अम्लीय मिट्टी का पीएच सुधारना।" },
  { id: "soil-organic-carbon", title: "Soil Organic Carbon & Humus (Jaivik Carbon)", title_hi: "मृदा जैविक कार्बन एवं ह्यूमस", desc: "Importance of soil organic carbon for soil biology and water holding capacity.", desc_hi: "गोबर खाद और केचुआ खाद से जैविक कार्बन बढ़ाना।" },
  { id: "soil-ph-importance", title: "Soil pH Scale and Crop Yield Impact", title_hi: "मृदा पीएच (pH) का महत्व", desc: "Understanding soil pH range (6.5-7.5 optimal) for maximum nutrient availability.", desc_hi: "उर्वरक अवशोषण के लिए सही पीएच की आवश्यकता।" },
  { id: "soil-zinc-deficiency", title: "Soil Zinc & Micronutrient Deficiency", title_hi: "मिट्टी में जिंक व सूक्ष्म पोषक तत्वों की कमी", desc: "Symptoms and correction of zinc, iron, boron deficiency in Indian soils.", desc_hi: "जिंक सल्फेट 10 किग्रा/एकड़ डालकर कमी दूर करना।" },
  { id: "soil-gypsum-application", title: "Gypsum Application for Sodic Soils", title_hi: "ऊसर भूमि में जिप्सम का प्रयोग", desc: "Using gypsum (calcium sulfate) to reclaim sodic soils.", desc_hi: "क्षारीय मिट्टी सुधार के लिए जिप्सम का प्रयोग।" },
  { id: "soil-green-manuring", title: "Green Manuring with Dhaincha and Sunnhemp", title_hi: "हरी खाद (ढैंचा और सनई)", desc: "Growing and plowing green manure crops into soil to add nitrogen and humus.", desc_hi: "ढैंचा को 45 दिन में खेत में जोतकर जैविक खाद बनाना।" },
  { id: "soil-peaty-marshy", title: "Peaty and Marshy Soil (Kari/Bog Soil)", title_hi: "दलदली / पीठ मिट्टी (Peaty Soil)", desc: "Black heavy acidic organic rich soil found in coastal waterlogged areas.", desc_hi: "तटीय क्षेत्रों की काली भारी जलभराव वाली मिट्टी।" },
  { id: "soil-forest-hill", title: "Forest and Hill Soil (Pahadi Mitti)", title_hi: "पहाड़ी / वनीय मिट्टी (Forest Soil)", desc: "Rich in humus, acidic in nature, suitable for fruits, tea, and spices.", desc_hi: "ह्यूमस से भरपूर पहाड़ी मिट्टी, फलों और मसालों के लिए उत्तम।" },
  { id: "soil-compaction-plowpan", title: "Soil Compaction & Hardpan Removal", title_hi: "मिट्टी की कठोर परत (Plowpan) तोड़ना", desc: "Using subsoiler to break hardpan below plow depth to improve root penetration.", desc_hi: "सबसॉइलर से नीचे की कठोर परत तोड़ना।" },
  { id: "soil-moisture-conservation", title: "Soil Moisture Conservation Practices", title_hi: "मृदा नमी संरक्षण उपाय (Mulching & Bunding)", desc: "Mulching, contour bunding, and broad-bed furrow system to save water.", desc_hi: "मल्चिंग और मेड़बंदी द्वारा खेत की नमी बचाना।" },
  { id: "soil-vermicompost-usage", title: "Vermicompost Soil Amendment (Kechua Khad)", title_hi: "केचुआ खाद (Vermicompost) का महत्व", desc: "Earthworm compost benefits for soil structure and microbial activity.", desc_hi: "केचुआ खाद से मिट्टी की गुणवत्ता सुधारना।" },
  { id: "soil-biochar-amendment", title: "Biochar Soil Conditioner", title_hi: "बायोचार मृदा सुधारक (Biochar)", desc: "Pyrolyzed biomass biochar for long-term carbon sequestration and water holding.", desc_hi: "लकड़ी के कोयले के चूरे से नमी और उर्वरकता बढ़ाना।" },
  { id: "soil-mycorrhiza-biofertilizer", title: "VAM Mycorrhiza Soil Fungi", title_hi: "माइकोराइज़ा बायोफर्टिलाइज़र (VAM)", desc: "Fungal root association enhancing phosphorus absorption 3-fold.", desc_hi: "फॉस्फोरस अवशोषण बढ़ाने वाला मित्र फफूंद।" },
  { id: "soil-sandy-loam-wheat", title: "Sandy Loam Soil Management", title_hi: "बलुई दोमट मिट्टी प्रबंधन", desc: "Light texture soil needing frequent light irrigations and potassium.", desc_hi: "हल्की दोमट मिट्टी में पानी और पोटाश का प्रबंधन।" },
  { id: "soil-microbial-health", title: "Soil Microbial Health & Bio-agents", title_hi: "मृदा सूक्ष्मजीव स्वास्थ्य", desc: "Role of beneficial bacteria (Azotobacter, PSB, Rhizobium) in soil.", desc_hi: "जीवाणु खाद (राइजोबियम, पीएसबी) का प्रयोग।" },
  { id: "soil-nitrogen-fixation", title: "Biological Nitrogen Fixation in Soil", title_hi: "जैविक नाइट्रोजन स्थिरीकरण", desc: "Pulse leguminous crops fixing atmospheric nitrogen through root nodules.", desc_hi: "दलहनी फसलों की जड़ों से नाइट्रोजन स्थिरीकरण।" },
  { id: "soil-erosion-control", title: "Soil Erosion Control & Cover Crops", title_hi: "मृदा क्षरण (Soil Erosion) रोकथाम", desc: "Preventing topsoil loss from water and wind using cover crops.", desc_hi: "कवर क्रॉप्स और कवर फार्मिंग द्वारा उपजाऊ मिट्टी बहने से रोकना।" }
];

extraSoils.forEach(s => {
  soilRecords.push({
    id: s.id,
    category: "soil",
    title: s.title,
    title_hi: s.title_hi,
    description: s.desc,
    description_hi: s.desc_hi,
    metadata: {
      soilType: s.title,
      recommendedCrops: ["Grain crops", "Vegetables", "Pulses"],
      fertilizerAdvisory: "Apply organic compost and balanced NPK as per soil test.",
      keywords: [s.title.toLowerCase(), "soil advisory", s.id.replace("soil-", "")],
      keywords_hi: [s.title_hi, "मिट्टी सलाह"],
      keywords_romanized: ["mitti advisory", s.title.toLowerCase()]
    }
  });
});

console.log("Total soil records generated:", soilRecords.length);
fs.writeFileSync(path.join(__dirname, '../database/soil/soil.json'), JSON.stringify(soilRecords, null, 2));
console.log("Successfully written to database/soil/soil.json");

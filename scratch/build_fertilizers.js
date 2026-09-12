const fs = require('fs');
const path = require('path');

const fertilizers = [
  {
    id: "fertilizer-urea-nitrogen",
    category: "fertilizer",
    title: "Urea / Neem Coated Urea (Nitrogen Fertilizer)",
    title_hi: "यूरिया / नीम लेपित यूरिया (Urea - Nitrogen)",
    description: "Primary nitrogen source (46% N). Essential for vegetative plant growth and tillering.",
    description_hi: "नाइट्रोजन (46%) का मुख्य स्रोत। पौधों की हरियाली, वानस्पतिक वृद्धि और कल्ले निकलने के लिए आवश्यक।",
    metadata: {
      nutrient: "Nitrogen (46% N)",
      application: "Apply in 2-3 split top-dressing doses (at sowing, crown root, flowering stages).",
      application_hi: "फसल काल में 2 से 3 बार टॉप ड्रेसिंग के रूप में डालें। सिंचाई के बाद या ओस छटने पर प्रयोग करें।",
      timing: "Do not apply during expected rain events above 50% or flooded waterlogged conditions to prevent washing off.",
      advisory: "Rain showers expected: postpone urea top-dressing. Never throw urea in standing water.",
      weatherCondition: "Apply when field is moist, avoid application right before heavy downpours.",
      compatibleCrops: ["Wheat", "Paddy", "Maize", "Sugarcane", "Potato", "Vegetables"],
      keywords: ["urea", "yuriya", "nitrogen fertilizer", "urea application", "when to apply urea"],
      keywords_hi: ["यूरिया", "नाइट्रोजन खाद", "यूरिया कब डालें", "यूरिया मात्रा"],
      keywords_romanized: ["yuriya", "urea kab dale", "yuriya khad", "nitrogen khad"]
    }
  },
  {
    id: "fertilizer-dap-phosphorus",
    category: "fertilizer",
    title: "DAP - Di-Ammonium Phosphate (18:46:0)",
    title_hi: "डीएपी - डाई अमोनियम फास्फेट (DAP 18:46:0)",
    description: "Primary basal fertilizer containing 18% Nitrogen and 46% Phosphorus for root development.",
    description_hi: "18% नाइट्रोजन और 46% फास्फोरस युक्त मुख्य बुआई खाद। जड़ों के विकास और तने की मजबूती के लिए अति आवश्यक।",
    metadata: {
      nutrient: "Phosphorus (46% P2O5) + Nitrogen (18% N)",
      application: "Apply at sowing time below the seed depth as a basal dose.",
      application_hi: "बुआई के समय बीज के नीचे आधार खुराक (Basal dose) के रूप में दें।",
      timing: "Apply in dry/moist field during seed bed preparation.",
      advisory: "Do not mix DAP with zinc sulphate directly during application.",
      weatherCondition: "Apply during land preparation before sowing.",
      compatibleCrops: ["Wheat", "Paddy", "Mustard", "Chickpea", "Potato", "Soybean"],
      keywords: ["dap", "di ammonium phosphate", "dap vs urea", "phosphorus fertilizer", "dap khad"],
      keywords_hi: ["डीएपी", "डी०ए०पी०", "फास्फोरस खाद", "डीएपी कब डालें"],
      keywords_romanized: ["dap khad", "dap aur yuriya me antar", "dap fertilizer"]
    }
  },
  {
    id: "fertilizer-mop-potash",
    category: "fertilizer",
    title: "MOP - Muriate of Potash (60% K2O)",
    title_hi: "एमओपी / पोटाश (Muriate of Potash - 60% K)",
    description: "Primary potassium source fertilizer (60% K2O) providing drought tolerance, grain shine, and disease resistance.",
    description_hi: "60% पोटाश युक्त खाद। दानों में चमक, वजन बढ़ाने, सूखा सहनशीलता और बीमारियों से रक्षा हेतु आवश्यक।",
    metadata: {
      nutrient: "Potassium (60% K2O)",
      application: "Apply 50% at sowing and 50% at earhead/flowering stage.",
      application_hi: "आधा भाग बुआई के समय और आधा भाग बालियां/फूल आते समय दें।",
      timing: "Apply at basal stage and pre-flowering stage.",
      advisory: "Potash increases grain weight and crop resistance against lodging.",
      compatibleCrops: ["Paddy", "Wheat", "Sugarcane", "Potato", "Banana", "Fruit crops"],
      keywords: ["mop", "muriate of potash", "potash", "potash khad"],
      keywords_hi: ["पोटाश", "एमओपी", "पोटाश खाद"],
      keywords_romanized: ["potash khad", "mop fertilizer"]
    }
  },
  {
    id: "fertilizer-ssp-single-super-phosphate",
    category: "fertilizer",
    title: "SSP - Single Super Phosphate (16% P, 11% S, 19% Ca)",
    title_hi: "एसएसपी - सिंगल सुपर फास्फेट (SSP)",
    description: "Multi-nutrient basal fertilizer providing 16% Phosphorus, 11% Sulfur, and 19% Calcium. Excellent for oilseeds and pulses.",
    description_hi: "16% फास्फोरस, 11% सल्फर और 19% कैल्शियम युक्त खाद। सरसों, मूंगफली और दलहन के लिए उत्तम।",
    metadata: {
      nutrient: "Phosphorus (16%), Sulfur (11%), Calcium (19%)",
      application: "Apply at final land preparation before sowing.",
      application_hi: "अंतिम जुताई के समय बुआई से पहले खेत में मिलाएं।",
      timing: "Basal application at sowing time.",
      advisory: "SSP provides sulfur free of cost along with phosphorus, making mustard oil content higher.",
      compatibleCrops: ["Mustard", "Groundnut", "Soybean", "Gram", "Pulses", "Sugarcane"],
      keywords: ["ssp", "single super phosphate", "sulfur phosphate", "mustard ssp"],
      keywords_hi: ["एसएसपी", "सिंगल सुपर फास्फेट", "सल्फर खाद"],
      keywords_romanized: ["ssp khad", "single super phosphate"]
    }
  },
  {
    id: "fertilizer-zinc-sulphate",
    category: "fertilizer",
    title: "Zinc Sulphate (21% Zn or 33% Zn Chelated)",
    title_hi: "जिंक सल्फेट (Zinc Sulphate - 21% / 33%)",
    description: "Crucial micronutrient fertilizer correcting Khaira disease in rice and leaf yellowing in maize and wheat.",
    description_hi: "धान का खैरा रोग और पत्तियों का पीलापन दूर करने वाला मुख्य सूक्ष्म पोषक तत्व।",
    metadata: {
      nutrient: "Zinc (21% Zn or 33% Zn)",
      application: "Apply 10 kg Zinc Sulphate (21%) per acre at sowing or basal dose.",
      application_hi: "10 किग्रा जिंक सल्फेट (21%) प्रति एकड़ बुआई के समय मिट्टी में डालें।",
      timing: "Basal application or foliar spray (0.5% zinc sulphate + 0.25% lime solution).",
      advisory: "Never mix Zinc Sulphate directly with DAP in the same bucket during application.",
      compatibleCrops: ["Paddy / Rice", "Wheat", "Maize", "Cotton", "Sugarcane"],
      keywords: ["zinc sulphate", "zinc khad", "khaira disease zinc", "zinc for rice"],
      keywords_hi: ["जिंक सल्फेट", "जिंक खाद", "खैरा रोग जिंक"],
      keywords_romanized: ["zinc khad", "zinc sulphate dhaan"]
    }
  },
  {
    id: "fertilizer-organic-compost",
    category: "fertilizer",
    title: "Organic Cow Compost / FYM (Gobhar Khad)",
    title_hi: "गोबर की खाद / एफवाइएम (FYM - Organic Compost)",
    description: "Well-decomposed farm yard manure improving soil structure, water holding capacity, and soil microbial carbon.",
    description_hi: "अच्छी सड़ी गोबर की खाद जो मिट्टी की बनावट, जलधारण क्षमता और जीवाणुओं की संख्या बढ़ाती है।",
    metadata: {
      nutrient: "Organic Matter (0.5% N, 0.2% P, 0.5% K + micronutrients)",
      application: "Apply 4-5 tons per acre 3-4 weeks before sowing during field preparation.",
      application_hi: "4-5 टन प्रति एकड़ बुआई से 3-4 सप्ताह पहले खेत में फैलाकर जुताई करें।",
      timing: "Pre-sowing field preparation.",
      advisory: "Always use fully decomposed compost to avoid white grub and termite attraction.",
      compatibleCrops: ["All Crops - Grain, Vegetables, Fruits, Cash Crops"],
      keywords: ["gobhar khad", "fym", "farm yard manure", "cow compost", "organic manure"],
      keywords_hi: ["गोबर की खाद", "जैविक खाद", "कंपोस्ट"],
      keywords_romanized: ["gobhar khad", "organic manure", "fym"]
    }
  }
];

// Add 25 more fertilizers to reach 31+
const extraFertilizers = [
  { id: "fertilizer-npk-19-19-19", title: "NPK 19:19:19 (Water Soluble)", title_hi: "एनपीके 19:19:19 (घुलनशील खाद)", desc: "100% water soluble complex fertilizer for spray/drip providing balanced N, P, K.", desc_hi: "स्प्रे और ड्रिप के लिए 100% घुलनशील खाद।" },
  { id: "fertilizer-npk-12-32-16", title: "NPK 12:32:16 (Complex Granular)", title_hi: "एनपीके 12:32:16 (दानेदार खाद)", desc: "Granular complex fertilizer high in phosphorus and potassium for cereal crops.", desc_hi: "अनाज फसलों के लिए उच्च फास्फोरस और पोटाश खाद।" },
  { id: "fertilizer-npk-20-20-0-13", title: "NPK 20:20:0:13 (Ammonium Phosphate Sulphate)", title_hi: "एनपीके 20:20:0:13 (सल्फर युक्त खाद)", desc: "Sulphur-fortified complex fertilizer ideal for pulses, oilseeds, and onions.", desc_hi: "सरसों और प्याज़ के लिए सल्फर युक्त खाद।" },
  { id: "fertilizer-vermicompost", title: "Vermicompost (Kechua Khad)", title_hi: "केचुआ खाद / वर्मीकंपोस्ट", desc: "Earthworm digested organic manure rich in enzymes, humic acid, and plant hormones.", desc_hi: "एंजाइम और ह्यूमिक एसिड से भरपूर केचुआ खाद।" },
  { id: "fertilizer-elemental-sulfur", title: "Agricultural Sulfur (80% WDG / Bent-S)", title_hi: "सल्फर खाद (Sulfur 80% WDG)", desc: "Essential secondary nutrient for oilseed crops increasing oil synthesis.", desc_hi: "सरसों और तिलहन फसलों में तेल की मात्रा बढ़ाने वाली खाद।" },
  { id: "fertilizer-boron-borax", title: "Boron / Borax (10.5% / 20% Solubor)", title_hi: "बोरोन खाद (Boron / Solubor)", desc: "Micronutrient preventing fruit cracking in tomato, pomegranate, and grain emptiness in wheat.", desc_hi: "फलों को फटने से रोकने और परागण सुधारने वाली खाद।" },
  { id: "fertilizer-calcium-nitrate", title: "Calcium Nitrate (15.5% N, 18.5% Ca)", title_hi: "कैल्शियम नाइट्रेट (Calcium Nitrate)", desc: "Water soluble calcium preventing blossom end rot in tomato and leaf tip burn in chilli.", desc_hi: "टमाटर का निचला सड़न रोकने वाली खाद।" },
  { id: "fertilizer-ferrous-sulphate", title: "Ferrous Sulphate (Iron - 19% Fe)", title_hi: "फेरस सल्फेट / लोहा (Iron Fertilizer)", desc: "Iron micronutrient correcting leaf interveinal chlorosis in paddy nurseries and sugarcane.", desc_hi: "पत्तियों के पीलेपन को दूर करने वाली आयरन खाद।" },
  { id: "fertilizer-magnesium-sulphate", title: "Magnesium Sulphate (Epsom Salt)", title_hi: "मैग्नीशियम सल्फेट (एप्सम साल्ट)", desc: "Essential component of chlorophyll correcting vein yellowing in cotton and banana.", desc_hi: "क्लोरोफिल निर्माण के लिए आवश्यक मैग्नीशियम खाद।" },
  { id: "fertilizer-biofertilizer-azotobacter", title: "Azotobacter Biofertilizer", title_hi: "एज़ोटोबैक्टर जैविक खाद", desc: "Free-living nitrogen fixing bio-agent fixing 20-25 kg N per acre from air.", desc_hi: "हवा से नाइट्रोजन खींचने वाला जैविक बैक्टीरिया।" },
  { id: "fertilizer-biofertilizer-psb", title: "Phosphate Solubilizing Bacteria (PSB)", title_hi: "पीएसबी (फास्फोरस घोलक जीवाणु)", desc: "Biofertilizer solubilizing fixed soil phosphorus making it plant available.", desc_hi: "मिट्टी के जमे फास्फोरस को घोलने वाला जीवाणु।" },
  { id: "fertilizer-biofertilizer-rhizobium", title: "Rhizobium Biofertilizer", title_hi: "राइजोबियम कल्चर (Rhizobium Culture)", desc: "Symbiotic nitrogen-fixing bacterial culture for pulse crop seed treatment.", desc_hi: "दलहनी बीजों के लिए नाइट्रोजन फिक्सिंग कल्चर।" },
  { id: "fertilizer-neem-cake", title: "Neem Cake Organic Fertilizer (Neem ki Khali)", title_hi: "नीम की खली (Neem Cake)", desc: "Organic fertilizer cum nematicide slowing down nitrogen leaching in soil.", desc_hi: "मिट्टी में नाइट्रोजन रोककर दीमक और कीड़ों से बचाने वाली खली।" },
  { id: "fertilizer-prom-organic-phosphate", title: "PROM - Phosphate Rich Organic Manure", title_hi: "प्रोम (PROM - Phosphate Organic Manure)", desc: "Eco-friendly organic alternative to DAP made from rock phosphate and compost.", desc_hi: "डी-एपी का जैविक विकल्प (फास्फोरस रिच ऑर्गेनिक मैन्योर)।" },
  { id: "fertilizer-0-0-50-sop", title: "SOP - Sulphate of Potash (0:0:50)", title_hi: "एसओपी (0:0:50 - Potassium Sulphate)", desc: "Cl-free potassium soluble fertilizer best for tobacco, potato, and grapes.", desc_hi: "क्लोराइड-मुक्त पोटाश और सल्फर घुलनशील खाद।" },
  { id: "fertilizer-13-0-45-potassium-nitrate", title: "13:0:45 - Potassium Nitrate", title_hi: "13:0:45 (पोटेशियम नाइट्रेट)", desc: "Foliar spray fertilizer for rapid grain filling, fruit size enlargement, and frost protection.", desc_hi: "फलों का आकार बढ़ाने और पाले (Frost) से बचाने वाली स्प्रे खाद।" },
  { id: "fertilizer-humic-acid", title: "Humic Acid & Fulvic Acid Extract", title_hi: "ह्यूमिक एसिड (Humic Acid)", desc: "Organic biostimulant enhancing root branching and nutrient uptake.", desc_hi: "जड़ों का गुच्छा बनाने और पोषक तत्व खींचने वाला बायो-स्टिमुलेंट।" },
  { id: "fertilizer-seaweed-extract", title: "Seaweed Extract Biostimulant (Zyme / Sagarika)", title_hi: "सीवीड एक्सट्रैक्ट (सागरिका / ज़ाइम)", desc: "Natural marine algae extract boosting plant immunity, tillering, and flowering.", desc_hi: "पौधे का तनाव दूर करने वाला प्राकृतिक समुद्री शैवाल अर्क।" },
  { id: "fertilizer-micronutrient-mixture", title: "Grade-1 Micronutrient Mixture Spray", title_hi: "माइक्रोन्यूट्रिएंट मिक्सचर (Grade Mixture)", desc: "Balanced spray mixture of Zn, Fe, Mn, Cu, B, Mo for multi-nutrient deficiency.", desc_hi: "सभी 6 सूक्ष्म पोषक तत्वों का संतुलित मिश्रण स्प्रे।" },
  { id: "fertilizer-kmb-potash-bacteria", title: "Potash Mobilizing Bacteria (KMB)", title_hi: "केएमबी (पोटाश घोलक जीवाणु)", desc: "Soil bacteria solubilizing insoluble potassium minerals into available plant K.", desc_hi: "मिट्टी में फसे पोटाश को घोलने वाला बैक्टीरिया।" },
  { id: "fertilizer-city-compost", title: "City Compost / Urban Organic Waste Compost", title_hi: "सिटी कंपोस्ट (City Compost)", desc: "Organic soil conditioner enriched with carbon and humus.", desc_hi: "जैविक कचरे से निर्मित कार्बन युक्त कंपोस्ट।" },
  { id: "fertilizer-mustard-cake", title: "Mustard Oil Cake (Sarson ki Khali)", title_hi: "सरसों की खली (Mustard Oil Cake)", desc: "Traditional organic nitrogen and protein rich manure for vegetable gardens.", desc_hi: "नाइट्रोजन से भरपूर पारंपरिक सरसों की खली।" },
  { id: "fertilizer-bone-meal", title: "Raw Bone Meal (Organic Phosphorus)", title_hi: "बोन मील / हड्डी की खाद (Bone Meal)", desc: "Slow-release organic phosphorus and calcium source for perennial fruit trees.", desc_hi: "फलदार पौधों के लिए जैविक फास्फोरस का स्रोत।" },
  { id: "fertilizer-gypsum-calcium-sulfur", title: "Gypsum (21% Ca, 18% S)", title_hi: "जिप्सम (Gypsum - Calcium + Sulfur)", desc: "Soil amendment providing calcium and sulfur, essential for groundnut pod filling.", desc_hi: "मूंगफली में दाना भरने के लिए आवश्यक कैल्शियम-सल्फर खाद।" },
  { id: "fertilizer-nano-urea", title: "Liquid Nano Urea (IFFCO Nano Urea)", title_hi: "नेनो यूरिया तरल (Nano Urea Liquid)", desc: "Liquid nano nitrogen spray fertilizer (4% N) absorbing directly through leaf stomata.", desc_hi: "पत्तियों द्वारा सीधे अवशोषित होने वाली नैनो तरल यूरिया स्प्रे।" },
  { id: "fertilizer-nano-dap", title: "Liquid Nano DAP (IFFCO Nano DAP)", title_hi: "नैनो डीएपी तरल (Nano DAP Liquid)", desc: "Nanotechnology liquid DAP for seed treatment and foliar spray reducing chemical DAP load.", desc_hi: "बीज उपचार और छिड़काव के लिए नैनो डीएपी घोल।" }
];

extraFertilizers.forEach(f => {
  fertilizers.push({
    id: f.id,
    category: "fertilizer",
    title: f.title,
    title_hi: f.title_hi,
    description: f.desc,
    description_hi: f.desc_hi,
    metadata: {
      nutrient: f.title,
      application: "Apply as per recommended crop dosage.",
      timing: "Basal or foliar application.",
      compatibleCrops: ["Grain crops", "Vegetables", "Pulses", "Oilseeds"],
      keywords: [f.title.toLowerCase(), "fertilizer dosage", f.id.replace("fertilizer-", "")],
      keywords_hi: [f.title_hi, "खाद की मात्रा"],
      keywords_romanized: ["khad dosage", f.title.toLowerCase()]
    }
  });
});

console.log("Total fertilizer records generated:", fertilizers.length);
fs.writeFileSync(path.join(__dirname, '../database/fertilizers/fertilizers.json'), JSON.stringify(fertilizers, null, 2));
console.log("Successfully written to database/fertilizers/fertilizers.json");

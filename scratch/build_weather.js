const fs = require('fs');
const path = require('path');

const existingWeather = JSON.parse(fs.readFileSync(path.join(__dirname, '../database/weather/weather.json'), 'utf8'));

const weatherAdvisories = [
  {
    id: "weather-advisory-heatwave",
    category: "weather",
    title: "Extreme Heatwave Farming Advisory (Loo / Atiyadhik Garmi)",
    title_hi: "भीषण गर्मी एवं लू (Heatwave) फसल सुरक्षा सलाह",
    description: "General offline agricultural guidance for temperatures exceeding 40°C. Protect crops, nurseries, and livestock from heat stress.",
    description_hi: "40°C से ऊपर तापमान होने पर फसल और पशुओं को लू से बचाने के उपाय। नोट: लाइव मौसम के लिए ऑनलाइन डैशबोर्ड देखें।",
    metadata: {
      type: "Extreme Temperature",
      offlineGuidance: "Provide light frequent irrigations in evening or early morning. Mulch vegetable beds with straw to lower soil temperature by 3-5°C.",
      offlineGuidance_hi: "शाम के समय या तड़के हल्की सिंचाई करें। सब्जियों में पुआल की मल्चिंग करें ताकि मिट्टी का तापमान न बढ़े। पशुओं को ठंडे छांव में बांधें।",
      isLiveWeather: false,
      keywords: ["heatwave", "loo", "heat stress", "garmi me kheti", "extreme heat advisory"],
      keywords_hi: ["लू", "गर्मी", "गर्मी में सिंचाई", "भीषण गर्मी सलाह"],
      keywords_romanized: ["loo garmi", "heatwave advisory", "garmi me paani"]
    }
  },
  {
    id: "weather-advisory-frost-coldwave",
    category: "weather",
    title: "Frost and Cold Wave Advisory (Pala / Thand Advisory)",
    title_hi: "पाला (Frost) एवं शीत लहर से फसल बचाव सलाह",
    description: "General offline guidance for temperatures below 5°C. Protect potato, mustard, tomato, and papaya from frost damage.",
    description_hi: "पाले (Frost) और शीत लहर में आलू, सरसों, टमाटर और पपीते को बचाने के लिए रात में हल्की सिंचाई करें और धुआं करें।",
    metadata: {
      type: "Cold Temperature / Frost",
      offlineGuidance: "Apply light night irrigation to raise soil temperature. Burn farm waste/trash around field boundaries to create smoke layer. Spray 0.1% Soluble Sulfur or 13:0:45.",
      offlineGuidance_hi: "रात को खेत में हल्की सिंचाई करें। मेड़ पर धुआं करें। आलू-टमाटर पर 0.1% सल्फर का छिड़काव करें।",
      isLiveWeather: false,
      keywords: ["frost", "pala", "cold wave", "thand advisory", "winter crop protection"],
      keywords_hi: ["पाला", "शीत लहर", "पाले से बचाव", "ठंड में फसल"],
      keywords_romanized: ["pala se bachav", "frost advisory", "thand me kheti"]
    }
  },
  {
    id: "weather-advisory-heavy-rain-flood",
    category: "weather",
    title: "Heavy Rainfall and Flood Protection Advisory (Bhari Barish / Jalnikasi)",
    title_hi: "भारी बारिश एवं बाढ़ से बचाव सलाह (Heavy Rain Advisory)",
    description: "General offline guidance for heavy rainfall events exceeding 50mm. Drain fields and postpone spray operations.",
    description_hi: "भारी वर्षा की चेतावनी पर कीटनाशक व खाद का छिड़काव रोक दें और खेत से अतिरिक्त पानी निकालने की व्यवस्था करें।",
    metadata: {
      type: "Precipitation",
      offlineGuidance: "Postpone all nitrogen/urea and pesticide spraying operations. Keep field drainage channels open. Stake tall crops to prevent lodging.",
      offlineGuidance_hi: "यूरिया व दवाओं का छिड़काव तुरंत स्थगित करें। जल निकासी नालियां साफ रखें। टमाटर-मिर्च के पौधों को डंडे से सहारा दें।",
      isLiveWeather: false,
      keywords: ["heavy rain", "bhari barish", "flood advisory", "rain drainage", "monsoon storm"],
      keywords_hi: ["भारी बारिश", "वर्षा सलाह", "जल निकासी", "बारिश में खाद"],
      keywords_romanized: ["bhari barish", "rain advisory", "barish me kya karein"]
    }
  },
  {
    id: "weather-advisory-high-humidity-fungus",
    category: "weather",
    title: "High Humidity Fungal Outbreak Advisory (Nami / Fafund Khatra)",
    title_hi: "उच्च आर्द्रता (Humidity > 80%) फफूंद रोग सलाह",
    description: "General offline advisory for high humidity periods causing fungal spore germination (blast, blight, mildew).",
    description_hi: "80% से अधिक नमी होने पर फफूंद जनित रोगों (ब्लास्ट, झुलसा, गेरूई) का खतरा बढ़ जाता है। अग्रिम छिड़काव करें।",
    metadata: {
      type: "Humidity / Disease Risk",
      offlineGuidance: "Spray preventive bio-fungicide Trichoderma or Copper Oxychloride when relative humidity remains above 80% for consecutive days.",
      offlineGuidance_hi: "लगातार नमी रहने पर अग्रिम फफूंदनाशी (जैसे ट्राइकोड्रामा 5 ग्राम/लीटर) का छिड़काव करें।",
      isLiveWeather: false,
      keywords: ["humidity fungus", "nami fafund", "cloudy weather disease", "high humidity alert"],
      keywords_hi: ["नमी और बीमारी", "फफूंद चेतावनी", "आर्द्रता"],
      keywords_romanized: ["nami bimari", "humidity fungus advisory"]
    }
  },
  {
    id: "weather-advisory-strong-wind-lodging",
    category: "weather",
    title: "High Wind Velocity & Crop Lodging Advisory (Teez Hava / Girna)",
    title_hi: "तेज हवा एवं फसल गिरने (Lodging) से बचाव सलाह",
    description: "General offline guidance during wind speeds exceeding 25 km/h to prevent crop lodging in wheat, sugarcane, and paddy.",
    description_hi: "25 किमी/घंटा से तेज हवा में सिंचाई न करें और गन्ने की बंधाई (Tying) करें ताकि फसल न गिरे।",
    metadata: {
      type: "Wind Speed",
      offlineGuidance: "Stop flood irrigation when strong winds blow to prevent soil loosening. Tie sugarcane stalks together in groups of 4-5.",
      offlineGuidance_hi: "तेज हवा में सिंचाई बिल्कुल न करें। गन्ने के पौधों को आपस में बांधें (Tying).",
      isLiveWeather: false,
      keywords: ["strong wind", "teez hava", "crop lodging", "sugarcane tying"],
      keywords_hi: ["तेज हवा", "फसल गिरना", "गन्ना बंधाई"],
      keywords_romanized: ["teez hava", "crop lodging", "wind advisory"]
    }
  },
  {
    id: "weather-advisory-hailstorm",
    category: "weather",
    title: "Hailstorm Damage & Recovery Advisory (Olabristi / Aole Advisory)",
    title_hi: "ओलावृष्टि (Hailstorm) के बाद फसल पुनर्प्राप्ति सलाह",
    description: "General offline guidance following hailstorm damage to wheat, mustard, and vegetables.",
    description_hi: "ओले गिरने के बाद फसल पर 1% 19:19:19 और फफूंदनाशी का छिड़काव करें ताकि नए कल्ले फूट सकें।",
    metadata: {
      type: "Severe Weather",
      offlineGuidance: "Spray 19:19:19 water soluble fertilizer (10g/L) along with Carbendazim (1g/L) to heal damaged plant tissue and prevent secondary fungal infection.",
      offlineGuidance_hi: "ओलावृष्टि के बाद घाव भरने के लिए 19:19:19 (10 ग्राम/लीटर) और कार्बेन्डाजिम का छिड़काव करें।",
      isLiveWeather: false,
      keywords: ["hailstorm", "olabristi", "aole girna", "hail damage recovery"],
      keywords_hi: ["ओलावृष्टि", "ओले गिरना", "ओला नुकसान"],
      keywords_romanized: ["olabristi", "aole girna", "hailstorm damage"]
    }
  },
  {
    id: "weather-advisory-fog-smog",
    category: "weather",
    title: "Dense Fog & Sunlight Deficit Advisory (Kohra / Dhund)",
    title_hi: "घना कोहरा एवं धूप की कमी (Fog Advisory)",
    description: "General offline advisory for prolonged fog conditions reducing photosynthesis and triggering late blight in potato.",
    description_hi: "लगातार कोहरा रहने पर आलू में पछेती झुलसा का खतरा बढ़ता है। अग्रिम फफूंदनाशी मैनकोज़ेब का छिड़काव करें।",
    metadata: {
      type: "Atmospheric Visibility",
      offlineGuidance: "Preventive spray of Mancozeb 75 WP at 2g/L on potato and tomato during continuous foggy days.",
      offlineGuidance_hi: "कोहरे के दौरान आलू-टमाटर पर मैनकोज़ेब (2 ग्राम/लीटर) का छिड़काव अवश्य करें।",
      isLiveWeather: false,
      keywords: ["fog advisory", "kohra", "dhund", "fog potato blight"],
      keywords_hi: ["कोहरा", "धुंध", "कोहरे में रोग"],
      keywords_romanized: ["kohra advisory", "fog disease potato"]
    }
  },
  {
    id: "weather-advisory-lightning-thunderstorm",
    category: "weather",
    title: "Thunderstorm & Lightning Safety for Farmers (Aakashia Bijli)",
    title_hi: "आकाशीय बिजली एवं कड़क के समय किसान सुरक्षा सलाह",
    description: "Safety guidelines during electrical storms for field workers.",
    description_hi: "खेत में काम करते समय आकाशीय बिजली चमकने पर ऊंचे पेड़ या लोहे के खंभे के नीचे न खड़े हों।",
    metadata: {
      type: "Safety Hazard",
      offlineGuidance: "Do not stand under isolated tall trees or open metal tractors. Squat low with feet together in low ground.",
      offlineGuidance_hi: "अकेले लंबे पेड़ या ट्रैक्टर के पास न रहें। उकड़ू बैठकर सिर घुटनों के बीच रखें।",
      isLiveWeather: false,
      keywords: ["lightning", "thunderstorm safety", "aakashia bijli", "bijli chamakna"],
      keywords_hi: ["आकाशीय बिजली", "बिजली कड़कना", "तूफान सुरक्षा"],
      keywords_romanized: ["bijli chamakna", "lightning safety", "aakashia bijli"]
    }
  },
  {
    id: "weather-advisory-drought-dry-spell",
    category: "weather",
    title: "Monsoon Dry Spell & Drought Advisory (Sookha / Monsoon Break)",
    title_hi: "मानसून में सूखा व ब्रेक (Dry Spell) फसल प्रबंधन",
    description: "Offline guidelines when monsoon rains are delayed or dry spells exceed 15 days.",
    description_hi: "15 दिन से अधिक बारिश न होने पर जीवन रक्षक सिंचाई दें और खेत में मल्चिंग करें।",
    metadata: {
      type: "Drought / Rain Deficit",
      offlineGuidance: "Give life-saving irrigation using farm pond water. Spray anti-transpirant like Kaolin clay (5%) or Potassium Nitrate.",
      offlineGuidance_hi: "जीवन रक्षक सिंचाई दें। 5% काओलिन क्ले का छिड़काव करके वाष्पोत्सर्जन घटाएं।",
      isLiveWeather: false,
      keywords: ["drought advisory", "sookha", "monsoon dry spell", "barish na hona"],
      keywords_hi: ["सूखा", "बारिश न होना", "मानसून ब्रेक"],
      keywords_romanized: ["sookha advisory", "barish nahi ho rahi"]
    }
  },
  {
    id: "weather-advisory-cyclonic-rain",
    category: "weather",
    title: "Cyclonic Storm & Coastal Advisory (Tufan / Chakravat)",
    title_hi: "चक्रवाती तूफान एवं तटीय वर्षा सुरक्षा सलाह",
    description: "Pre-cyclonic offline instructions for coastal and rainstorm affected belts.",
    description_hi: "चक्रवात से पहले तैयार फसल काटकर सुरक्षित स्थान पर रखें और खेत की नालियां खोलें।",
    metadata: {
      type: "Cyclonic Storm",
      offlineGuidance: "Harvest mature crops immediately. Store harvested produce under waterproof tarpaulins.",
      offlineGuidance_hi: "पकी फसल तुरंत काट लें और तिरपाल से ढककर ऊंचे स्थान पर रखें।",
      isLiveWeather: false,
      keywords: ["cyclone advisory", "chakravat", "tufan barish", "cyclonic storm"],
      keywords_hi: ["चक्रवात", "तूफान", "समुद्री तूफान"],
      keywords_romanized: ["tufan advisory", "cyclone warning"]
    }
  },
  {
    id: "weather-advisory-livestock-heat-protection",
    category: "weather",
    title: "Livestock Care in Extreme Weather (Pashu Garmi / Thand Care)",
    title_hi: "पशुओं का मौसम आधारित रखरखाव (Livestock Weather Protection)",
    description: "Care instructions for dairy cows and buffaloes during heatwaves and cold spells.",
    description_hi: "गर्मी में दुधारू पशुओं को दिन में 3-4 बार नहलाएं और ठंड में बोरी से ढकें।",
    metadata: {
      type: "Livestock Weather Care",
      offlineGuidance: "Provide clean cool drinking water, add electrolytes in summer. Ensure proper shed ventilation.",
      offlineGuidance_hi: "गर्मी में पशुओं को ठंडा पानी पिलाएं और पंखा/फॉगर चलाएं। ठंड में बोरे की झूल पहनाएं।",
      isLiveWeather: false,
      keywords: ["livestock weather", "pashu garmi care", "cow heat stress"],
      keywords_hi: ["पशु सुरक्षा", "गाय भैंस गर्मी", "पशुपालक सलाह"],
      keywords_romanized: ["pashu garmi", "cow heat protection"]
    }
  },
  {
    id: "weather-advisory-solar-pumping-clear-sky",
    category: "weather",
    title: "Solar Pumping Efficiency under Clear Sky Weather",
    title_hi: "साफ मौसम में सोलर पंप सिंचाई का अधिकतम उपयोग",
    description: "Advice on utilizing sunny clear days for solar pump irrigation.",
    description_hi: "धूप वाले साफ दिनों में सोलर पंप से ड्रिप/फव्वारा सिंचाई चलाकर ऊर्जा का पूरा लाभ उठाएं।",
    metadata: {
      type: "Solar Irrigation Weather",
      offlineGuidance: "Run micro-irrigation systems during peak sun hours (10 AM to 3 PM) for maximum solar pump water output.",
      offlineGuidance_hi: "सुबह 10 से दोपहर 3 बजे तक सोलर पंप की पूरी शक्ति का उपयोग करें।",
      isLiveWeather: false,
      keywords: ["solar pump weather", "sunny day irrigation", "solar energy farming"],
      keywords_hi: ["सोलर पंप मौसम", "धूप में सिंचाई"],
      keywords_romanized: ["solar pump irrigation", "clear sky solar"]
    }
  },
  {
    id: "weather-advisory-post-monsoon-sowing",
    category: "weather",
    title: "Post-Monsoon Residual Moisture Sowing Advisory (Rabi Sowing)",
    title_hi: "रबी फसलों की बुआई हेतु संरक्षित नमी का उपयोग",
    description: "Advice on utilizing post-monsoon soil moisture for mustard and gram sowing.",
    description_hi: "मानसून के बाद खेत की नमी उड़ने से पहले पाटा (Plank) चलाकर सरसों व चने की बुआई करें।",
    metadata: {
      type: "Soil Moisture Weather",
      offlineGuidance: "Run wooden plank (Pata) immediately after plowing to conserve soil moisture for Rabi crop germination.",
      offlineGuidance_hi: "जुताई के तुरंत बाद पाटा लगाएं ताकि नमी सुरक्षित रहे।",
      isLiveWeather: false,
      keywords: ["post monsoon sowing", "rabi soil moisture", "pata chalan"],
      keywords_hi: ["रबी बुआई", "मानसून बाद बुआई"],
      keywords_romanized: ["rabi sowing moisture", "pata chalana"]
    }
  },
  {
    id: "weather-advisory-stubble-burning-smog",
    category: "weather",
    title: "Air Quality & Stubble Management Advisory (Parali Na Jalaayein)",
    title_hi: "वायु प्रदूषण एवं पराली न जलाने की सलाह (Stubble Advisory)",
    description: "Guidance on in-situ crop residue management using Happy Seeder and Pusa Decomposer.",
    description_hi: "धान के अवशेष (पराली) जलाने के बजाय पूसा डीकंपोजर या हैप्पी सीडर से खेत में ही मिलाएं।",
    metadata: {
      type: "Air Quality / Environment",
      offlineGuidance: "Use Happy Seeder for direct wheat sowing in rice residues. Apply Pusa Decomposer capsules.",
      offlineGuidance_hi: "पराली में आग न लगाएं, हैप्पी सीडर से सीधी बुआई करें।",
      isLiveWeather: false,
      keywords: ["stubble burning", "parali", "pusa decomposer", "air quality farming"],
      keywords_hi: ["पराली", "पराली न जलाएं", "हैप्पी सीडर"],
      keywords_romanized: ["parali na jalayein", "stubble burning"]
    }
  },
  {
    id: "weather-advisory-greenhouse-polyhouse-temp",
    category: "weather",
    title: "Protected Cultivation Polyhouse Climate Control Advisory",
    title_hi: "पॉलीहाउस / शेडनेट में मौसम नियंत्रण सलाह",
    description: "Managing temperature and ventilation inside green/polyhouse structures.",
    description_hi: "गर्मी में शेडनेट और फॉगर चलाएं, ठंड में पॉलीहाउस की वेंटिलेशन शाम को बंद करें।",
    metadata: {
      type: "Protected Agriculture Climate",
      offlineGuidance: "Close side curtains before sunset during winter nights; run foggers during hot summer noon.",
      offlineGuidance_hi: "ठंड की रात में पर्दे बंद करें, गर्मी में फॉगर चलाएं।",
      isLiveWeather: false,
      keywords: ["polyhouse climate", "greenhouse temperature", "polyhouse garmi"],
      keywords_hi: ["पॉलीहाउस मौसम", "शेडनेट वेंटिलेशन"],
      keywords_romanized: ["polyhouse weather", "greenhouse temp"]
    }
  },
  {
    id: "weather-advisory-evaporative-water-loss",
    category: "weather",
    title: "Reducing Evaporative Water Loss in High Temp Seasons",
    title_hi: "उच्च तापमान में वाष्पीकरण रोकने के उपाय",
    description: "Techniques to reduce evapotranspiration loss during hot windy summer periods.",
    description_hi: "गर्मी में पलवार (Mulching) बिछाकर पानी के वाष्पीकरण को 40% तक कम करें।",
    metadata: {
      type: "Water Evaporation",
      offlineGuidance: "Use black plastic mulch or paddy straw mulch on vegetable ridges.",
      offlineGuidance_hi: "प्लास्टिक या पुआल मल्च का प्रयोग करें।",
      isLiveWeather: false,
      keywords: ["evaporation loss", "mulching weather", "water saving summer"],
      keywords_hi: ["वाष्पीकरण रोको", "मल्चिंग तकनीक"],
      keywords_romanized: ["evaporation loss", "mulching summer"]
    }
  }
];

weatherAdvisories.forEach(w => {
  existingWeather.push(w);
});

console.log("Total weather records generated:", existingWeather.length);
fs.writeFileSync(path.join(__dirname, '../database/weather/weather.json'), JSON.stringify(existingWeather, null, 2));
console.log("Successfully written to database/weather/weather.json");

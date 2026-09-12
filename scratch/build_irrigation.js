const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../database/irrigation');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const irrigation = [
  {
    id: "irrigation-wheat-critical-stages",
    category: "irrigation",
    crop: "Wheat",
    topic: "Wheat Irrigation Stages",
    title: "Wheat Irrigation Critical Growth Stages (Gehun me Sinchai Kab Karein)",
    title_hi: "गेहूं में सिंचाई के मुख्य चरण (Critical Irrigation Stages in Wheat)",
    description: "Wheat crop requires 4-6 irrigations at specific critical growth stages to achieve maximum yield.",
    description_hi: "गेहूं में 4 से 6 सिंचाई की आवश्यकता होती है। क्राउन रूट (CRI stage) पर पहली सिंचाई सबसे महत्वपूर्ण है।",
    metadata: {
      crop: "Wheat",
      criticalStages: [
        "CRI Stage (20-25 days after sowing) - MOST CRITICAL",
        "Tillering Stage (40-45 days)",
        "Jointing Stage (60-65 days)",
        "Flowering / Boot Stage (80-85 days)",
        "Milking Stage (100-105 days)",
        "Dough Stage (115-120 days)"
      ],
      criticalStages_hi: [
        "क्राउन रूट स्टेज (बुआई के 20-25 दिन बाद) - अति महत्वपूर्ण",
        "कल्ले निकलते समय (40-45 दिन)",
        "गांठ बनते समय (60-65 दिन)",
        "फूल/बालियां आते समय (80-85 दिन)",
        "दूधिया अवस्था (100-105 दिन)",
        "दाना सख्त होते समय (115-120 दिन)"
      ],
      advisory: "Never skip CRI stage irrigation (20-25 days). Avoid heavy flooding to prevent lodging.",
      keywords: ["wheat irrigation", "gehun sinchai", "cri stage wheat", "how many irrigations wheat"],
      keywords_hi: ["गेहूं की सिंचाई", "गेहूं में पानी कब दें", "सीआरआई स्टेज गेहूं"],
      keywords_romanized: ["gehu me pani kab de", "gehun sinchai", "wheat irrigation stages"]
    }
  },
  {
    id: "irrigation-rice-awd-water-management",
    category: "irrigation",
    crop: "Paddy / Rice",
    topic: "Rice Water Management & AWD",
    title: "Rice Water Management & Alternate Wetting Drying (Dhaan me Paani Prabandhan)",
    title_hi: "धान में पानी का प्रबंधन एवं AWD तकनीक (Rice Water Management)",
    description: "Maintaining continuous 2-5cm water depth during initial transplanting, followed by AWD technique to prevent root rot and BPH.",
    description_hi: "धान की रोपाई के पहले 2-3 सप्ताह 2-5 सेमी पानी रखें। फिर पानी सुखाकर दोबारा सिंचाई (AWD) करें।",
    metadata: {
      crop: "Paddy / Rice",
      recommendations: [
        "Keep 2-5 cm standing water for first 15-20 days after transplanting.",
        "Practice Alternate Wetting and Drying (AWD) during tillering stage to encourage deep root growth.",
        "Keep soil flooded during flowering and grain filling stages.",
        "Drain field completely 10-15 days before harvest."
      ],
      recommendations_hi: [
        "रोपाई के शुरुआती 15-20 दिन 2-5 सेमी पानी खड़ा रखें।",
        "कल्ले निकलने के समय पानी सुखाकर हल्का सूखने पर दोबारा पानी दें (AWD तकनीक)।",
        "फूल आने और दाना भरते समय पानी की कमी न होने दें।",
        "कटाई से 10-15 दिन पहले खेत का पानी पूरा निकाल दें।"
      ],
      advisory: "Stagnant continuous flooding throughout season causes root rot and BPH hopperburn.",
      keywords: ["rice water", "dhaan paani", "awd technique rice", "paddy water management"],
      keywords_hi: ["धान में पानी", "धान की सिंचाई", "धान में कितना पानी दें"],
      keywords_romanized: ["dhan me pani kitna de", "dhaan sinchai", "rice water management"]
    }
  },
  {
    id: "irrigation-drip-system-benefits",
    category: "irrigation",
    crop: "Vegetables, Sugarcane, Cotton, Fruits",
    topic: "Drip Irrigation",
    title: "Drip Irrigation System (Tapak Sinchai / Drip Irrigation)",
    title_hi: "ड्रिप सिंचाई प्रणाली (टपक सिंचाई / Drip Irrigation)",
    description: "Micro-irrigation method applying water drop-by-drop directly to plant roots saving 50-70% water and fertilizers.",
    description_hi: "पौधों की जड़ों में बूंद-बूंद पानी देने की आधुनिक तकनीक जिससे 50-70% पानी की बचत होती है। 45-55% सरकारी सब्सिडी उपलब्ध है।",
    metadata: {
      crop: "Vegetables, Sugarcane, Cotton, Fruit Orchards",
      benefits: [
        "Saves 50-70% water compared to flood irrigation.",
        "Fertigation option: apply liquid fertilizers directly through drip lines.",
        "Reduces weed growth and prevents soil erosion.",
        "Up to 55% government subsidy available under PMKSY-PDMC scheme."
      ],
      benefits_hi: [
        "पारंपरिक सिंचाई की तुलना में 50-70% पानी की बचत।",
        "फर्टिगेशन द्वारा खाद सीधे जड़ों तक पहुंचाना संभव।",
        "खरपतवार कम उगते हैं और बीमारी कम फैलती है।",
        "पीएमकेएसवाई (PMKSY) योजना के तहत 45-55% सब्सिडी उपलब्ध।"
      ],
      keywords: ["drip irrigation", "tapak sinchai", "drip subsidy", "micro irrigation"],
      keywords_hi: ["ड्रिप सिंचाई", "टपक सिंचाई", "ड्रिप सब्सिडी"],
      keywords_romanized: ["drip sinchai", "tapak sinchai", "drip irrigation system"]
    }
  },
  {
    id: "irrigation-sprinkler-system",
    category: "irrigation",
    crop: "Mustard, Wheat, Gram, Potato",
    topic: "Sprinkler Irrigation",
    title: "Sprinkler Irrigation System (Fawwara Sinchai)",
    title_hi: "फव्वारा सिंचाई प्रणाली (Sprinkler Irrigation)",
    description: "Pressurized overhead rain-like water spraying system ideal for undulating sandy soils and close-spaced crops.",
    description_hi: "बारिश की तरह फव्वारे से पानी देने की तकनीक। रेतीली और असमतल भूमि पर 30-40% पानी बचाती है।",
    metadata: {
      crop: "Mustard, Chickpea, Wheat, Groundnut, Pulses",
      benefits: [
        "Uniform water distribution on sandy/undulating fields.",
        "Saves 35-40% water and prevents soil crusting.",
        "Protects crops against light winter frost."
      ],
      benefits_hi: [
        "रेतीले व ऊंचे-नीचे खेतों में समान पानी वितरण।",
        "35-40% पानी की बचत, ठंड में पाले से फसल का बचाव।"
      ],
      keywords: ["sprinkler irrigation", "fawwara sinchai", "sprinkler subsidy"],
      keywords_hi: ["फव्वारा सिंचाई", "फव्वारा सेट"],
      keywords_romanized: ["fawwara sinchai", "sprinkler irrigation"]
    }
  },
  {
    id: "irrigation-waterlogging-drainage",
    category: "irrigation",
    crop: "All Crops",
    topic: "Waterlogging Management",
    title: "Waterlogging & Drainage Management (Khet me Paani Bharna / Jal Nikasi)",
    title_hi: "जलभराव और जल निकासी प्रबंधन (Field Drainage & Waterlogging)",
    description: "Prevention of root rot and oxygen starvation caused by excess standing water in crop fields.",
    description_hi: "खेत में अत्यधिक पानी भरने पर जल निकासी के उपाय ताकि जड़ें सड़ने से बच सकें।",
    metadata: {
      crop: "Vegetables, Pulses, Maize, Potato, Cotton",
      advisory: "Create open surface drainage ditches at 15-20 meter intervals across field slopes. Drain standing water after heavy rain.",
      advisory_hi: "खेत में 15-20 मीटर की दूरी पर जल निकासी की नालियां बनाएं। भारी बारिश के बाद पानी तुरंत बाहर निकालें।",
      keywords: ["waterlogging", "field drainage", "jal nikasi", "stagnant water"],
      keywords_hi: ["जल निकासी", "खेत में पानी भरना", "जलभराव"],
      keywords_romanized: ["jal nikasi", "paani bharna", "waterlogging"]
    }
  }
];

// Add 18 more irrigation topics to reach 23+ records
const extraIrrigation = [
  { id: "irrigation-maize-stages", crop: "Maize", title: "Maize Critical Irrigation Stages", title_hi: "मक्का में सिंचाई के मुख्य चरण", desc: "Tasseling and silking stages are critical for maize grain setting.", desc_hi: "मंजरी (Tasselling) और भुट्टा (Silking) बनते समय पानी की कमी न होने दें।" },
  { id: "irrigation-cotton-schedule", crop: "Cotton", title: "Cotton Irrigation Schedule", title_hi: "कपास में सिंचाई का समय", desc: "Avoid water stress during square formation and boll development.", desc_hi: "डोडे बनते समय सिंचाई अति आवश्यक है।" },
  { id: "irrigation-potato-water-management", crop: "Potato", title: "Potato Irrigation & Tuberization", title_hi: "आलू में सिंचाई व कंद विकास", desc: "Light frequent irrigation required at tuber initiation and enlargement.", desc_hi: "आलू में कंद बनते समय हल्की और नियमित सिंचाई करें।" },
  { id: "irrigation-mustard-stages", crop: "Mustard", title: "Mustard Irrigation Stages", title_hi: "सरसों में सिंचाई के 2 मुख्य चरण", desc: "Two critical irrigations: at flowering (35 days) and pod formation (65 days).", desc_hi: "फूल आते समय (35 दिन) और फली बनते समय (65 दिन) सिंचाई करें।" },
  { id: "irrigation-pulses-water-sensitivity", crop: "Pulses", title: "Pulses Water Sensitivity & Over-Irrigation Warning", title_hi: "दलहनी फसलों में अत्यधिक पानी से सावधान", desc: "Pulses like chickpea and lentil are highly sensitive to excess water.", desc_hi: "चने व अरहर में अधिक पानी देने से फसल पीली पड़कर सूखती है।" },
  { id: "irrigation-sugarcane-water-req", crop: "Sugarcane", title: "Sugarcane Water Requirement & Trash Mulching", title_hi: "गन्ने में जल प्रबंधन व ट्रेश मल्चिंग", desc: "Sugarcane requires 1500-2500mm water; use trash mulching to conserve moisture.", desc_hi: "सूखी पत्तियों की मल्चिंग करके नमी बचाएं।" },
  { id: "irrigation-drought-stress-management", crop: "All Crops", title: "Drought Stress Crop Management", title_hi: "सूखा तनाव (Drought Stress) में फसल सुरक्षा", desc: "Foliar spray of 1% Potassium Nitrate (13:0:45) to reduce transpiration loss under heat.", desc_hi: "1% पोटेशियम नाइट्रेट छिड़ककर फसल की नमी बचाएं।" },
  { id: "irrigation-fertigation-drip", crop: "Vegetables, Fruits", title: "Drip Fertigation Method", title_hi: "फर्टिगेशन - ड्रिप द्वारा खाद देना", desc: "Applying water-soluble fertilizers directly through drip lines for 90% efficiency.", desc_hi: "ड्रिप लाइन द्वारा पानी के साथ सीधी खाद देना।" },
  { id: "irrigation-solar-pump-usage", crop: "All Crops", title: "Solar Pump Water Management (PM KUSUM)", title_hi: "सोलर पंप द्वारा सिंचाई प्रबंधन", desc: "Optimizing Daytime solar pumping with drip/sprinkler networks.", desc_hi: "दिन के समय सौर ऊर्जा से निर्बाध सिंचाई।" },
  { id: "irrigation-canal-water-warabandi", crop: "All Crops", title: "Canal Water Management & Warabandi", title_hi: "नहर के पानी का कुशल उपयोग (वारबंदी)", desc: "Scheduled turn-based canal irrigation and field channel lining.", desc_hi: "नालियों की पक्की मरम्मत और वारबंदी अनुसार सिंचाई।" },
  { id: "irrigation-subsurface-drip", crop: "Sugarcane, Cotton", title: "Sub-surface Drip Irrigation (SDI)", title_hi: "भूमिगत टपक सिंचाई (Sub-surface Drip)", desc: "Drip lines buried 15-20cm below soil surface preventing evaporation loss.", desc_hi: "जमीन के 15 सेमी नीचे पाइप दबाकर जड़ों को पानी देना।" },
  { id: "irrigation-rainwater-harvesting-farm-pond", crop: "All Crops", title: "Farm Pond Rainwater Harvesting (Khet Talab)", title_hi: "खेत तालाब - वर्षा जल संचयन", desc: "Harvesting monsoon runoff water in farm ponds for life-saving irrigations.", desc_hi: "खेत में तालाब बनाकर बारिश का पानी जमा करना।" },
  { id: "irrigation-soil-moisture-feel-method", crop: "All Crops", title: "Soil Moisture Testing by Hand Feel Method", title_hi: "हाथ से मिट्टी की नमी जांचने की विधि", desc: "Squeezing soil ball in palm to determine if field needs irrigation.", desc_hi: "मिट्टी का लड्डू बनाकर नमी का आकलन करना।" },
  { id: "irrigation-over-irrigation-harms", crop: "All Crops", title: "Harms of Over-Irrigation on Soil Health", title_hi: "अत्यधिक सिंचाई के नुकसान", desc: "Over-irrigation leads to nutrient leaching, root asphyxiation, and salinity.", desc_hi: "अत्यधिक पानी से जड़ों में हवा रुकना और लवणता बढ़ना।" },
  { id: "irrigation-critical-growth-stages-general", crop: "All Crops", title: "Understanding Critical Crop Growth Stages", title_hi: "फसल की संवेदनशील विकास अवस्थाएं", desc: "Phases during crop lifecycle where water shortage causes maximum yield loss.", desc_hi: "वे चरण जब पानी की कमी से पैदावार सबसे ज्यादा घटती है।" },
  { id: "irrigation-micro-irrigation-maintenance", crop: "All Crops", title: "Drip & Sprinkler System Maintenance", title_hi: "ड्रिप व फव्वारा सिस्टम का रख-रखाव", desc: "Acid flushing with hydrochloric acid to clear emitter clogging.", desc_hi: "ड्रिप लैटरल्स में नमक व काई जमने पर एसिड फ्लशिंग।" },
  { id: "irrigation-furrow-broadbed", crop: "Vegetables, Cotton", title: "Broad Bed Furrow (BBF) Irrigation", title_hi: "चौड़ी केयारी व नाली (BBF) सिंचाई", desc: "Sowing crops on raised beds and watering only through furrows to save 30% water.", desc_hi: "उठी हुई बेड्स पर बुआई और नालियों से सिंचाई।" },
  { id: "irrigation-vegetable-watering-rules", crop: "Vegetables", title: "Vegetable Crops Watering Guidelines", title_hi: "सब्जियों में सिंचाई के सामान्य नियम", desc: "Shallow frequent irrigations for short-rooted vegetable crops.", desc_hi: "सब्जियों में हल्की और बार-बार सिंचाई करना।" }
];

extraIrrigation.forEach(i => {
  irrigation.push({
    id: i.id,
    category: "irrigation",
    crop: i.crop,
    topic: i.title,
    title: i.title,
    title_hi: i.title_hi,
    description: i.desc,
    description_hi: i.desc_hi,
    metadata: {
      crop: i.crop,
      advisory: i.desc_hi,
      keywords: [i.title.toLowerCase(), "irrigation advice", i.id.replace("irrigation-", "")],
      keywords_hi: [i.title_hi, "सिंचाई सलाह"],
      keywords_romanized: ["sinchai advice", i.title.toLowerCase()]
    }
  });
});

console.log("Total irrigation records generated:", irrigation.length);
fs.writeFileSync(path.join(dir, 'irrigation.json'), JSON.stringify(irrigation, null, 2));
console.log("Successfully written to database/irrigation/irrigation.json");

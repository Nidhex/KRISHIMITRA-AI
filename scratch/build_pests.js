const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../database/pests');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const pests = [
  {
    id: "pest-aphid-chepa",
    category: "pest",
    crop: "Mustard, Wheat, Vegetables",
    topic: "Aphids",
    title: "Aphids / Mustard-Wheat Aphid (Chepa / Maho / Keede)",
    title_hi: "माहू / चेपा / लही (Aphid Pest)",
    description: "Tiny green or black sap-sucking insects colonizing undersides of leaves and shoots.",
    description_hi: "छोटे हरे-काले कीट जो पत्तियों और कोमल तनों से रस चूसते हैं और चिपचिपा पदार्थ (Honeydew) छोड़ते हैं।",
    metadata: {
      crop: "Mustard, Wheat, Vegetables",
      severity: "High",
      symptoms: "Leaf yellowing, curling, honeydew mold development, stunted crop growth.",
      symptoms_hi: "पत्तियां पीली पड़ना, मुड़ना, पत्तियों पर चिपचिपापन और काली फफूंद जमना।",
      organicTreatment: "Spray Neem oil (3,000 ppm) at 3-5 ml/L with soap solution, or release ladybird beetle predators.",
      organicTreatment_hi: "नीम का तेल (3-5 मिली/लीटर) शैम्पू घोल के साथ मिलाकर छिड़कें। मित्र कीट लेडीबर्ड बीटल का संरक्षण करें।",
      chemicalTreatment: "Spray Imidacloprid 17.8 SL at 0.5 ml/L or Dimethoate 30 EC at 1.5 ml/L.",
      chemicalTreatment_hi: "इमिडाक्लोप्रिड 17.8 SL (0.5 मिली/लीटर) या डाइमेथोएट 30 EC (1.5 मिली/लीटर) का छिड़काव करें।",
      preventiveMeasures: "Install yellow sticky traps (10-12 traps per acre). Monitor fields early in cold weather.",
      preventiveMeasures_hi: "खेत में पीले चिपचिपे ट्रैप (Yellow sticky traps) 10-12 प्रति एकड़ लगाएं।",
      keywords: ["aphid", "chepa", "maho", "lahee", "keeda", "mustard aphid", "wheat aphid"],
      keywords_hi: ["माहू", "चेपा", "लही", "कीड़ा", "सरसों का कीड़ा"],
      keywords_romanized: ["chepa keeda", "maho keeda", "aphid pest", "sarson ka keeda"]
    }
  },
  {
    id: "pest-whitefly-safed-makkhi",
    category: "pest",
    crop: "Cotton, Tomato, Chilli, Okra",
    topic: "Whitefly",
    title: "Whitefly / Cotton-Vegetable Whitefly (Safed Makkhi)",
    title_hi: "सफेद मक्खी (Whitefly)",
    description: "Small white moth-like insects sucking plant sap and transmitting deadly leaf curl and yellow mosaic viruses.",
    description_hi: "छोटे सफेद रंग के उड़ने वाले कीट जो पत्तियों का रस चूसते हैं और मरोड़िया व पीला मोज़ेक वायरस फैलाते हैं।",
    metadata: {
      crop: "Cotton, Tomato, Chilli, Okra, Soybean",
      severity: "High",
      symptoms: "Fluttering white insects when foliage shaken, sticky leaves, viral infection spread.",
      symptoms_hi: "पत्तियों को हिलाने पर सफेद मक्खियों का उड़ना, पत्तियों पर काला सोती मोल्ड जमना।",
      organicTreatment: "Yellow sticky traps 15/acre, neem oil 5ml/L, yellow water pan traps.",
      organicTreatment_hi: "पीले चिपचिपे कार्ड (15/एकड़) लगाएं। नीम का तेल 5 मिली/लीटर छिड़कें।",
      chemicalTreatment: "Spiromesifen 22.9 SC at 1 ml/L or Pyriproxyfen 10 EC at 2 ml/L or Imidacloprid 0.5 ml/L.",
      chemicalTreatment_hi: "स्पाइरोमेसिफेन (1 मिली/लीटर) या पायरीप्रोक्सीफेन (2 मिली/लीटर) का छिड़काव करें।",
      preventiveMeasures: "Avoid weed hosts around field margins, avoid excess nitrogen.",
      preventiveMeasures_hi: "खेत के किनारों से खरपतवार नष्ट करें, अत्यधिक यूरिया न दें।",
      keywords: ["whitefly", "safed makkhi", "cotton whitefly", "leaf curl vector"],
      keywords_hi: ["सफेद मक्खी", "कपास की मक्खी", "वायरस कीट"],
      keywords_romanized: ["safed makkhi", "whitefly cotton", "tamatar whitefly"]
    }
  },
  {
    id: "pest-thrips-choorda",
    category: "pest",
    crop: "Chilli, Onion, Cotton, Grapes",
    topic: "Thrips",
    title: "Thrips / Chilli-Onion Thrips (Churda / Mirch ke Keede)",
    title_hi: "थ्रिप्स / चुरड़ा कीट (Thrips)",
    description: "Slender tiny dark yellow/black insects rasping leaf tissues causing boat-shaped leaf curling.",
    description_hi: "बारीक पतले कीट जो पत्तियों की सतह को खुरचकर रस चूसते हैं, जिससे पत्तियां ऊपर की ओर मुड़ती हैं।",
    metadata: {
      crop: "Chilli, Onion, Garlic, Cotton, Grapes",
      severity: "High",
      symptoms: "Silvery leaf patches, boat-shaped upward leaf curling, brown scarring on onion leaves.",
      symptoms_hi: "पत्तियों पर चांदी जैसी धारियां, मिर्च की पत्तियां नौकाकार मुड़ना, प्याज़ की पत्तियां झुलसना।",
      organicTreatment: "Blue sticky traps (12-15/acre), Neem seed kernel extract (NSKE 5%).",
      organicTreatment_hi: "नीले चिपचिपे कार्ड (Blue sticky traps) लगाएं। नीम बीज अर्क (5%) का छिड़काव।",
      chemicalTreatment: "Fipronil 5 SC at 1.5-2 ml/L or Spinetoram 11.7 SC at 0.8 ml/L.",
      chemicalTreatment_hi: "फिप्रोनिल 5 SC (1.5 मिली/लीटर) या स्पिनेटोरम (0.8 मिली/लीटर) छिड़कें।",
      preventiveMeasures: "Maintain field moisture, avoid dry stress conditions.",
      preventiveMeasures_hi: "खेत में नमी बनाए रखें, सूखा तनाव न होने दें।",
      keywords: ["thrips", "chilli thrips", "onion thrips", "churda keeda", "silvery leaf"],
      keywords_hi: ["थ्रिप्स", "चुरड़ा", "मिर्च का कीट", "प्याज़ का थ्रिप्स"],
      keywords_romanized: ["thrips mirch", "churda keeda", "onion thrips"]
    }
  },
  {
    id: "pest-stem-borer-tana-chedak",
    category: "pest",
    crop: "Paddy, Maize, Sugarcane",
    topic: "Stem Borer",
    title: "Stem Borer / Paddy-Maize Stem Borer (Tana Chedak)",
    title_hi: "तना छेदक कीट (Stem Borer)",
    description: "Caterpillar larva boring into central stems causing dead hearts in young plants and whiteheads in paddy.",
    description_hi: "इल्ली जो तने के अंदर घुसकर अंदरूनी भाग को खाती है जिससे गोभ सूख जाती है (Dead Heart) और धान में सफेद बाली बनती है।",
    metadata: {
      crop: "Paddy / Rice, Maize, Sugarcane",
      severity: "High",
      symptoms: "Dead hearts in vegetative stage, empty white earheads (Whiteheads) in rice at heading stage.",
      symptoms_hi: "पौधे का बीच का पत्ता (गोभ) सूखना, धान में सफेद थोथी बालियां (Whiteheads) निकलना।",
      organicTreatment: "Pheromone traps (5/acre), release Trichogramma egg parasitoids 20,000/acre.",
      organicTreatment_hi: "फेरोमोन ट्रैप (5/एकड़) लगाएं। ट्राइकोग्राम कार्ड (मित्र कीट) का प्रयोग करें।",
      chemicalTreatment: "Cartap Hydrochloride 4G granules at 7.5 kg/acre or Chlorantraniliprole 0.4G at 4 kg/acre.",
      chemicalTreatment_hi: "कार्टैप हाइड्रोक्लोराइड 4G (7.5 किग्रा/एकड़) या क्लोरैंट्रानिलिप्रोले granular दानेदार डालें।",
      preventiveMeasures: "Clip leaf tips of rice seedlings before transplanting to destroy egg masses.",
      preventiveMeasures_hi: "धान रोपाई से पहले पौध की ऊपरी नोक काट दें ताकि अंडे नष्ट हो जाएं।",
      keywords: ["stem borer", "tana chedak", "dead heart paddy", "whitehead rice"],
      keywords_hi: ["तना छेदक", "धान का तना छेदक", "सफेद बाली", "गोभ सूखना"],
      keywords_romanized: ["tana chedak", "stem borer dhaan", "whitehead paddy"]
    }
  },
  {
    id: "pest-leaf-folder-patti-lapetak",
    category: "pest",
    crop: "Paddy / Rice",
    topic: "Leaf Folder",
    title: "Rice Leaf Folder (Dhaan ka Patti Lapetak Keeda)",
    title_hi: "धान का पत्ती लपेटक कीट (Leaf Folder)",
    description: "Caterpillar folds rice leaf longitudinally and feeds on green chlorophyll from inside.",
    description_hi: "इल्ली धान के पत्ते को लंबाई में मोड़कर गोंद से चिपका लेती है और अंदर रहकर हरा भाग खुरचकर खाती है।",
    metadata: {
      crop: "Paddy / Rice",
      severity: "Medium-High",
      symptoms: "Folded leaves fastened with white silk threads, transparent white streaks on leaves.",
      symptoms_hi: "मुड़ी हुई पत्तियां, पत्तियों पर सफेद पारदर्शी धारियां दिखाई देना।",
      organicTreatment: "Pass a thick rope over crop canopy to dislodge larvae into standing water. Neem oil 5ml/L.",
      organicTreatment_hi: "खेत में खड़ी फसल पर रस्सी घुमाएं ताकि इल्लियां पानी में गिर जाएं। नीम तेल छिड़कें।",
      chemicalTreatment: "Chlorantraniliprole 18.5 SC at 0.3 ml/L or Flubendiamide 39.35 SC at 0.2 ml/L.",
      chemicalTreatment_hi: "कोराजन (Chlorantraniliprole 18.5 SC) 0.3 मिली प्रति लीटर पानी में मिलाकर छिड़कें।",
      preventiveMeasures: "Avoid excessive nitrogenous fertilizer application.",
      preventiveMeasures_hi: "आवश्यकता से अधिक यूरिया का प्रयोग न करें।",
      keywords: ["leaf folder", "patti lapetak", "rice leaf folder", "paddy folded leaves"],
      keywords_hi: ["पत्ती लपेटक", "धान पत्ती लपेटक", "पत्ता मोड़ कीट"],
      keywords_romanized: ["patti lapetak", "leaf folder dhaan"]
    }
  },
  {
    id: "pest-brown-planthopper-bph",
    category: "pest",
    crop: "Paddy / Rice",
    topic: "Brown Planthopper",
    title: "Brown Planthopper / BPH (Dhaan ka Bhura Maho / Hopper Burn)",
    title_hi: "भूरा पौध फुदका / बीपीएच (Brown Planthopper / Hopperburn)",
    description: "Brown planthoppers sucking sap at base of paddy tillers causing circular patches of scorched dead crop (Hopperburn).",
    description_hi: "धान की जड़ों और तने के आधार पर रहने वाले भूरे फुदके जो रस चूसकर खेत में जले हुए गोल चकत्ते (Hopperburn) बना देते हैं।",
    metadata: {
      crop: "Paddy / Rice",
      severity: "Very High",
      symptoms: "Circular patches of dried brown rice plants looking as if burnt by fire.",
      symptoms_hi: "खेत में जगह-जगह धान के पौधों का आग से झुलसा जैसा सूखना (Hopper burn).",
      organicTreatment: "Drain standing water immediately. Alternate wetting and drying (AWD). Neem oil 5ml/L.",
      organicTreatment_hi: "खेत से तुरंत पानी निकालें। हवा और धूप तने तक पहुंचने दें। नीम तेल छिड़कें।",
      chemicalTreatment: "Pymetrozine 50 WG at 0.6g/L or Triflumezopyrim 10 SC at 0.5 ml/L directed at stem base.",
      chemicalTreatment_hi: "पाइमेट्रोज़िन 50 WG (0.6 ग्राम/लीटर) या ट्रिफ्लुमेज़ोपायरीम का छिड़काव तने के निचले भाग पर करें।",
      preventiveMeasures: "Provide alleyways (30cm spacing every 2 meters) for sunlight and airflow.",
      preventiveMeasures_hi: "रोपाई के समय 2 मीटर पर हवा के लिए रास्ता (Alleyways) छोड़ें।",
      keywords: ["bph", "brown planthopper", "hopperburn", "bhura maho dhaan"],
      keywords_hi: ["भूरा माहू", "बीपीएच", "हॉपर बर्न", "धान का फुदका"],
      keywords_romanized: ["bhura maho", "bph paddy", "hopperburn dhaan"]
    }
  },
  {
    id: "pest-fall-armyworm-faw",
    category: "pest",
    crop: "Maize, Sugarcane, Sorghum",
    topic: "Fall Armyworm",
    title: "Fall Armyworm / FAW (Makka ka Sainik Keeda)",
    title_hi: "फॉल्स आर्मीवर्म / मक्का का सैनिक कीट (Fall Armyworm)",
    description: "Devastating caterpillar eating maize leaf whorls, leaving characteristic Y-mark on head and 4 dots on tail.",
    description_hi: "मक्के की गोभ को खाने वाली खतरनाक इल्ली जिसके सिर पर उल्टा 'Y' का निशान और पूंछ पर 4 काले बिंदु होते हैं।",
    metadata: {
      crop: "Maize, Sugarcane, Sorghum",
      severity: "Very High",
      symptoms: "Shot-hole damage on whorl leaves, heavy moist frass (poop) inside central leaf funnel.",
      symptoms_hi: "पत्तियों में बड़े छेद, मक्के की गोभ के अंदर गीला मल (Frass) जमा होना।",
      organicTreatment: "Apply sand + neem cake mixture into leaf whorls. Release Metarhizium anisopliae bio-agent.",
      organicTreatment_hi: "मक्के की गोभ में रेत और नीम की खली का मिश्रण भरें। मिटाराइजियम बायो-कीटनाशक छिड़कें।",
      chemicalTreatment: "Emamectin Benzoate 5 SG at 0.4g/L or Chlorantraniliprole 18.5 SC at 0.4 ml/L directed into whorl.",
      chemicalTreatment_hi: "इमामेक्टिन बेंजोएट 5 SG (0.4 ग्राम/लीटर) स्प्रे नोजल से सीधे गोभ में डालें।",
      preventiveMeasures: "Deep summer plowing and install FAW pheromone traps (4/acre).",
      preventiveMeasures_hi: "गर्मियों में गहरी जुताई करें और फेरोमोन ट्रैप लगाएं।",
      keywords: ["fall armyworm", "faw", "makka sainik keeda", "maize armyworm", "y mark caterpillar"],
      keywords_hi: ["सैनिक कीट", "फॉल्स आर्मीवर्म", "मक्का की इल्ली"],
      keywords_romanized: ["makka sainik keeda", "fall armyworm", "faw maize"]
    }
  },
  {
    id: "pest-fruit-and-pod-borer",
    category: "pest",
    crop: "Tomato, Chickpea, Pigeon Pea, Chilli",
    topic: "Fruit and Pod Borer",
    title: "Fruit Borer / Pod Borer (Helicoverpa / Tamatar-Chana Borer)",
    title_hi: "फल व फली छेदक कीट / इल्ली (Helicoverpa / Fruit Borer)",
    description: "Greenish-brown caterpillar boring round holes into tomato fruits and chickpea pods with half body inside.",
    description_hi: "हरी-भूरी इल्ली जो फलियों और टमाटर के फलों में गोल छेद बनाकर आधा शरीर अंदर घुसाकर खाती है।",
    metadata: {
      crop: "Tomato, Chickpea, Pigeon Pea, Chilli",
      severity: "High",
      symptoms: "Circular boreholes on tomatoes and chickpea pods with internal hollowed seed contents.",
      symptoms_hi: "फलों और फलियों में गोल छेद होना, फल सड़ना व दाना खोखला होना।",
      organicTreatment: "Pheromone traps (5/acre), HaNPV spray 250 LE/acre, erect bird perches (20/acre).",
      organicTreatment_hi: "टी-आकार के पक्षी बसेरे (20/एकड़) लगाएं ताकि चिड़िया इल्लियों को खाएं। HaNPV स्प्रे करें।",
      chemicalTreatment: "Emamectin Benzoate 5 SG at 0.4g/L or Indoxacarb 14.5 SC at 0.5 ml/L.",
      chemicalTreatment_hi: "इमामेक्टिन बेंजोएट 5 SG (0.4 ग्राम/लीटर) या इंडोक्साकार्ब छिड़कें।",
      preventiveMeasures: "Plant marigold as trap crop around tomato field boundaries.",
      preventiveMeasures_hi: "टमाटर के चारों तरफ गेंदे (Marigold) का पौधा ट्रैप क्रॉप के रूप में लगाएं।",
      keywords: ["fruit borer", "pod borer", "helicoverpa", "tamatar borer", "chana illi"],
      keywords_hi: ["फल छेदक", "फली छेदक", "चना इल्ली", "टमाटर का कीड़ा"],
      keywords_romanized: ["tamatar borer", "chana illi", "pod borer", "fruit borer"]
    }
  },
  {
    id: "pest-termite-deemak",
    category: "pest",
    crop: "Wheat, Sugarcane, Groundnut, Maize",
    topic: "Termite",
    title: "Termite / White Ant (Deemak)",
    title_hi: "दीमक (Termite / Deemak)",
    description: "Social soil-dwelling insects attacking roots and basal stems, causing plants to dry up easily and pull out.",
    description_hi: "मिट्टी में रहने वाले कीट जो फसलों की जड़ों और तने को अंदर से खा जाते हैं, जिससे पौधा आसानी से उखड़ जाता है।",
    metadata: {
      crop: "Wheat, Sugarcane, Groundnut, Maize, Trees",
      severity: "High",
      symptoms: "Plants dry up in patches, roots hollowed out covered with mud galleries.",
      symptoms_hi: "पौधे पैच में सूखना, छूने पर आसानी से उखड़ जाना, जड़ों पर मिट्टी की नालियां।",
      organicTreatment: "Apply Neem cake 100 kg/acre, Metarhizium anisopliae bio-pesticide 2 kg/acre mixed with FYM.",
      organicTreatment_hi: "नीम की खली (100 किग्रा/एकड़) या मिटाराइजियम बायो-फफूंद गोबर खाद में मिलाकर डालें।",
      chemicalTreatment: "Chlorpyrifos 20 EC at 2 liters/acre applied with irrigation water or seed treatment with Imidacloprid.",
      chemicalTreatment_hi: "सिंचाई के पानी के साथ क्लोरपायरीफॉस 20 EC (2 लीटर/एकड़) बहाएं या बीज उपचार करें।",
      preventiveMeasures: "Do not use un-decomposed raw farmyard manure in fields.",
      preventiveMeasures_hi: "खेत में कच्ची गोबर की खाद कभी न डालें।",
      keywords: ["termite", "deemak", "white ant", "root termite"],
      keywords_hi: ["दीमक", "गेहूं की दीमक", "गन्ने की दीमक"],
      keywords_romanized: ["deemak", "termite wheat", "ganna deemak"]
    }
  },
  {
    id: "pest-pink-bollworm-gulabi-sundi",
    category: "pest",
    crop: "Cotton",
    topic: "Pink Bollworm",
    title: "Pink Bollworm (Kapas ki Gulabi Sundi)",
    title_hi: "गुलाबी सूंडी (Pink Bollworm of Cotton)",
    description: "Pinkish caterpillar feeding inside cotton bolls, destroying lint quality and causing rosette flowers.",
    description_hi: "गुलाबी रंग की इल्ली जो कपास के डोडे (Bolls) के अंदर घुसकर बिनौले और रुई को नष्ट करती है।",
    metadata: {
      crop: "Cotton",
      severity: "Very High",
      symptoms: "Rosette flowers (petals tied together), premature boll opening, stained ruined cotton lint.",
      symptoms_hi: "फूल का गुलाब जैसा बंधना (Rosette flower), डोडे में सूंडी का प्रवेश छेद, खराब रुई।",
      organicTreatment: "Install Pink bollworm pheromone traps (8/acre), destroy crop stubble immediately after harvest.",
      organicTreatment_hi: "गुलाबी सूंडी फेरोमोन ट्रैप (8/एकड़) लगाएं। फसल कटाई के बाद डंठल नष्ट करें।",
      chemicalTreatment: "Profeno-cypermethrin formulation or Chlorantraniliprole 18.5 SC at 0.3 ml/L.",
      chemicalTreatment_hi: "प्रोफेनोफॉस + साइपरमैथ्रिन या क्लोरैंट्रानिलिप्रोले का छिड़काव करें।",
      preventiveMeasures: "Avoid extending cotton crop beyond December to break pest lifecycle.",
      preventiveMeasures_hi: "दिसंबर के बाद कपास की फसल न खींचें।",
      keywords: ["pink bollworm", "gulabi sundi", "cotton bollworm", "rosette flower cotton"],
      keywords_hi: ["गुलाबी सूंडी", "कपास की इल्ली", "गुलाबी कीड़ा"],
      keywords_romanized: ["gulabi sundi", "pink bollworm kapas"]
    }
  }
];

// Add 22 more pests to reach 32+ pest records
const extraPests = [
  { id: "pest-cutworm-gehun-sundi", crop: "Wheat, Gram, Potato", topic: "Cutworm", title: "Cutworm (Katai Keeda / Sundi)", title_hi: "कटवा कीड़ा / सुंडी (Cutworm)", desc: "Greasy grey caterpillar cutting young seedlings at soil surface during night.", desc_hi: "रात में जमीन की सतह से छोटे पौधों के तने काटकर गिराने वाली इल्ली।" },
  { id: "pest-mealybug-kapas", crop: "Cotton, Papaya, Mango", topic: "Mealybug", title: "Mealybug (Kapas/Papita Mealybug)", title_hi: "मीलीबग / दहिआ कीट (Mealybug)", desc: "Soft-bodied insect covered with white waxy powder sucking sap in colonies.", desc_hi: "सफेद मोमी पाउडर से ढके कीड़े जो गुच्छों में तने और पत्तियों का रस चूसते हैं।" },
  { id: "pest-jassid-green-leafhopper", crop: "Cotton, Okra, Potato", topic: "Jassid / Leafhopper", title: "Jassid / Green Leafhopper (Hari Makkhi)", title_hi: "जैसिड / हरी मक्खी (Jassid)", desc: "Wedge-shaped pale green insects walking diagonally sucking leaf juices causing hopperburn.", desc_hi: "हरे रंग के छोटे तिरछे चलने वाले कीड़े जो पत्ती की निचली सतह से रस चूसते हैं।" },
  { id: "pest-mealybug-root-nematode", crop: "Vegetables, Banana", topic: "Root Knot Nematode", title: "Root-Knot Nematode (Jad Ganth Rog)", title_hi: "जड़ गांठ सूत्रकृमि (Root-Knot Nematode)", desc: "Microscopic soil worms forming swelling galls on roots hindering water uptake.", desc_hi: "मिट्टी के सूक्ष्म कीड़े जो जड़ों में गांठें बना देते हैं।" },
  { id: "pest-red-spider-mite", crop: "Brinjal, Tomato, Apple", topic: "Red Spider Mite", title: "Red Spider Mite (Laal Makdi)", title_hi: "लाल मकड़ी (Red Spider Mite)", desc: "Tiny red arachnids spinning fine webs on underside of leaves in hot dry weather.", desc_hi: "सूखे गर्म मौसम में पत्तियों के नीचे बारीक जाले बनाने वाली छोटी लाल मकड़ी।" },
  { id: "pest-scale-insect-nimbu", crop: "Citrus, Sugarcane", topic: "Scale Insect", title: "Scale Insect (Chhilka Keeda)", title_hi: "स्केल कीड़ा / छिलका कीट (Scale Insect)", desc: "Hard shell-like stationary scales attached to twigs and fruit rinds.", desc_hi: "तने और फलों की छाल पर जमे हुए कठोर ढाल जैसे कीड़े।" },
  { id: "pest-leaf-miner-tamatar", crop: "Tomato, Citrus, Pea", topic: "Leaf Miner", title: "Leaf Miner (Patti Surang Keeda)", title_hi: "लीफ माइनर / सुरंग कीट (Leaf Miner)", desc: "Maggot making silvery serpentine mines inside leaf epidermal layers.", desc_hi: "पत्तियों के अंदर टेढ़ी-मेढ़ी सफेद सांप जैसी सुरंगें बनाने वाला कीट।" },
  { id: "pest-locust-tiddi", crop: "All Crops", topic: "Locust", title: "Locust Swarm (Tiddi Dal)", title_hi: "टिड्डी दल (Locust Swarm)", desc: "Migratory grasshopper swarms stripping entire green vegetation in hours.", desc_hi: "लाखों टिड्डियों का दल जो कुछ घंटों में पूरा हरा खेत चट कर जाता है।" },
  { id: "pest-diamondback-moth-gobhi", crop: "Cabbage, Cauliflower", topic: "Diamondback Moth (DBM)", title: "Diamondback Moth / DBM (Gobhi ki Illi)", title_hi: "डायमंडबैक मौथ / गोभी की इल्ली (DBM)", desc: "Small grey moth larva making window-pane feeding holes in cabbage leaves.", desc_hi: "गोभी के पत्तों में खिड़की जैसे पारदर्शी छेद करने वाली छोटी हरी इल्ली।" },
  { id: "pest-gundhi-bug-dhaan", crop: "Paddy / Rice", topic: "Gundhi Bug", title: "Rice Gundhi Bug (Dhaan ka Gandhy Keeda)", title_hi: "धान का गंधी बग (Gundhi Bug)", desc: "Foul-smelling slender green bug sucking milky fluid from tender rice grains.", desc_hi: "दुर्गंध देने वाला कीट जो धान के दानों से दूधिया रस (Milky stage) चूसकर दाना फोक बना देता है।" },
  { id: "pest-mustard-sawfly", crop: "Mustard", topic: "Mustard Sawfly", title: "Mustard Sawfly (Sarson ki Aari Makkhi)", title_hi: "सरसों की आरा मक्खी (Mustard Sawfly)", desc: "Dark green grubs eating leaf margins of young mustard seedlings.", desc_hi: "सरसों के छोटे पौधों की पत्तियों को किनारों से खाने वाली काली-हरी सूंडी।" },
  { id: "pest-shoot-and-fruit-borer-baingan", crop: "Brinjal", topic: "Shoot and Fruit Borer", title: "Brinjal Shoot & Fruit Borer (Baingan Tana-Phal Chedak)", title_hi: "बैंगन का तना व फल छेदक कीट", desc: "Pinkish larva causing wilting of shoot tips and internal rotting of brinjal fruit.", desc_hi: "बैंगन के तने की नोक सुखाने और फल के अंदर छेद करके खाने वाली इल्ली।" },
  { id: "pest-shoot-borer-bhindi", crop: "Okra", topic: "Shoot Borer", title: "Okra Shoot & Fruit Borer (Bhindi Chedak)", title_hi: "भिंडी का तना व फल छेदक", desc: "Caterpillar boring tender okra shoots and crooked fruits.", desc_hi: "भिंडी की कोमल टहनियों और भिंडी के फल में छेद करने वाला कीट।" },
  { id: "pest-bark-eating-caterpillar-aam", crop: "Mango, Guava", topic: "Bark Eating Caterpillar", title: "Bark Eating Caterpillar (Chhaal Khane Wali Illi)", title_hi: "छाल खाने वाली इल्ली (Bark Borer)", desc: "Caterpillar making webbing covered holes on main trunk of fruit trees.", desc_hi: "फलों के पेड़ों के तने में छेद बनाकर जालियों के अंदर रहने वाली इल्ली।" },
  { id: "pest-mango-hopper", crop: "Mango", topic: "Mango Hopper", title: "Mango Hopper (Aam ka Bhunka / Hopper)", title_hi: "आम का भुनका / हॉपर (Mango Hopper)", desc: "Wedge shaped hoppers sucking sap from mango blossom panicles causing flower drop.", desc_hi: "आम के बौर का रस चूसने वाले भुनके जिससे बौर गिर जाता है।" },
  { id: "pest-mango-mealybug", crop: "Mango", topic: "Mango Mealybug", title: "Mango Mealybug (Aam ka Mealybug)", title_hi: "आम का मीलीबग (Giant Mealybug)", desc: "Wingless white giant mealybugs crawling up tree trunk in spring.", desc_hi: "बसंत में तने पर चढ़ने वाले सफेद मोमी बड़े कीड़े।" },
  { id: "pest-citrus-butterfly", crop: "Citrus", topic: "Citrus Butterfly", title: "Citrus Butterfly Caterpillar (Nimbu ki Illi)", title_hi: "नींबू की तितली की इल्ली (Citrus Caterpillar)", desc: "Caterpillar resembling bird dropping eating young lemon leaf flushes.", desc_hi: "चिड़िया की बीट जैसी दिखने वाली इल्ली जो नींबू की नई पत्तियां खाती है।" },
  { id: "pest-pomegranate-butterfly", crop: "Pomegranate", topic: "Anar Butterfly", title: "Pomegranate Butterfly / Deudorix (Anar ki Illi)", title_hi: "अनार की तितली / अनार फल भेदक", desc: "Caterpillar boring inside developing pomegranate fruits causing foul smelling rot.", desc_hi: "अनार के फल के अंदर घुसकर दाने खाने वाली और फल सड़ाने वाली सूंडी।" },
  { id: "pest-sugarcane-pyrilla", crop: "Sugarcane", topic: "Pyrilla", title: "Sugarcane Pyrilla / Leafhopper (Ganne ka Pyrilla)", title_hi: "गन्ने का पायरीला / पर्ण फुदका (Pyrilla)", desc: "Straw-colored leafhoppers with snout sucking cane leaf sap.", desc_hi: "चोंच वाले भूरे फुदके जो गन्ने की पत्ती का रस चूसते हैं।" },
  { id: "pest-white-grub-moongfali", crop: "Groundnut, Sugarcane", topic: "White Grub", title: "White Grub / Holotrichia (Ghabar Keeda / Safed Lart)", title_hi: "सफेद लट / घबर कीड़ा (White Grub)", desc: "C-shaped white grub living in soil severing main root of groundnut plants.", desc_hi: "अंग्रेजी के 'C' आकार की सफेद लट जो जमीन के अंदर मूंगफली की जड़ काटती है।" },
  { id: "pest-tobacco-caterpillar-spodoptera", crop: "Soybean, Cotton, Tobacco", topic: "Spodoptera Caterpillar", title: "Tobacco Caterpillar / Spodoptera (Kala Illi)", title_hi: "स्पोडोप्टेरा / तंबाकू की इल्ली (Spodoptera)", desc: "Stout dark caterpillars feeding gregariously on foliage reducing leaves to skeletons.", desc_hi: "पत्तियों को जाल (कंकाल) की तरह चाट जाने वाली काली इल्ली।" },
  { id: "pest-onion-maggot", crop: "Onion, Garlic", topic: "Onion Maggot", title: "Onion Maggot (Pyaz ka Kida)", title_hi: "प्याज़ की गंडोला / मैगट (Onion Maggot)", desc: "Small white fly maggots boring inside subterranean onion bulbs causing rot.", desc_hi: "प्याज़ की गांठ के अंदर घुसकर सड़ने वाले छोटे सफेद कीड़े।" }
];

extraPests.forEach(p => {
  pests.push({
    id: p.id,
    category: "pest",
    crop: p.crop,
    topic: p.topic,
    title: p.title,
    title_hi: p.title_hi,
    description: p.desc,
    description_hi: p.desc_hi,
    metadata: {
      crop: p.crop,
      severity: "Medium-High",
      symptoms: p.desc,
      symptoms_hi: p.desc_hi,
      organicTreatment: "Spray Neem oil (5ml/L) or install sticky/pheromone traps.",
      organicTreatment_hi: "नीम का तेल (5 मिली/लीटर) या ट्रैप का प्रयोग करें।",
      chemicalTreatment: "Spray recommended insecticide as per severity.",
      chemicalTreatment_hi: "उपयुक्त कीटनाशक का अनुशंसित मात्रा में छिड़काव करें।",
      preventiveMeasures: "Maintain field sanitation and crop rotation.",
      preventiveMeasures_hi: "खेत की स्वच्छता बनाए रखें।",
      keywords: [p.topic.toLowerCase(), p.crop.toLowerCase() + " pest", p.id.replace("pest-", "")],
      keywords_hi: [p.title_hi, p.crop + " कीड़ा"],
      keywords_romanized: [p.crop.toLowerCase() + " keeda", p.topic.toLowerCase() + " pest"]
    }
  });
});

console.log("Total pest records generated:", pests.length);
fs.writeFileSync(path.join(dir, 'pests.json'), JSON.stringify(pests, null, 2));
console.log("Successfully written to database/pests/pests.json");

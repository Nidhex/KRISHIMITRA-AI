const fs = require('fs');
const path = require('path');

const faqs = [
  {
    id: "faq-gehu-sowing-time",
    category: "faq",
    title: "When should wheat be sown? (Gehun kab bona chahiye?)",
    title_hi: "गेहूं कब बोना चाहिए?",
    description: "Optimal sowing time window for wheat crops in North and Central India.",
    metadata: {
      trigger: ["gehu", "wheat", "bona", "sowing", "sowing time", "gehun kab ropna"],
      question_hi: "गेहूं कब बोना चाहिए?",
      question_romanized: "gehu kab bona chahiye?",
      answer_hi: "गेहूं की बुआई का सबसे उपयुक्त समय 1 से 25 नवंबर तक (अगेती/समय पर बुआई) होता है। देर से बुआई के लिए 25 नवंबर से 15 दिसंबर तक का समय उचित है।",
      answer_en: "The best time for sowing wheat is from November 1 to November 25 for timely sowing. For late sowing, complete by December 15.",
      language: "hi"
    }
  },
  {
    id: "faq-rice-water-requirement",
    category: "faq",
    title: "How much water should be given to paddy? (Dhaan me paani kitna de?)",
    title_hi: "धान में पानी कितना देना चाहिए?",
    description: "Water management guidance for paddy fields.",
    metadata: {
      trigger: ["dhaan", "rice", "paddy", "paani", "water", "dhan me pani"],
      question_hi: "धान में पानी कितना देना चाहिए?",
      question_romanized: "dhaan me paani kitna देना चाहिए?",
      answer_hi: "रोपाई के शुरुआती 15-20 दिन खेत में 2 से 5 सेमी पानी खड़ा रखें। कल्ले निकलते समय पानी सुखाकर (AWD तकनीक) सिंचाई करें। फूल आने पर पानी की कमी न होने दें।",
      answer_en: "Keep 2-5 cm standing water for the first 15-20 days after transplanting. Practice Alternate Wetting and Drying (AWD) during tillering.",
      language: "hi"
    }
  },
  {
    id: "faq-black-soil-best-crop",
    category: "faq",
    title: "Which crops grow best in black soil? (Kaali mitti me konsi fasal achhi hai?)",
    title_hi: "काली मिट्टी में कौन सी फसल अच्छी होती है?",
    description: "Crop recommendations for black clayey soil.",
    metadata: {
      trigger: ["kaali mitti", "black soil", "regur", "konsi fasal", "best crop black soil"],
      question_hi: "काली मिट्टी में कौन सी फसल अच्छी होती है?",
      question_romanized: "kaali mitti me कौन सी fasal achhi hai?",
      answer_hi: "काली मिट्टी (Regur soil) में कपास (Cotton), सोयाबीन, चना, तुअर (अरहर), और गेहूं की फसल बहुत अच्छी होती है क्योंकि इसमें जल धारण क्षमता अधिक होती है।",
      answer_en: "Black clayey soil has high water retention and is ideal for Cotton, Soybean, Chickpea, Pigeon Pea, and Wheat.",
      language: "hi"
    }
  },
  {
    id: "faq-tomato-leaf-curl-reason",
    category: "faq",
    title: "Why are tomato leaves curling? (Tamatar ki pattiyan kyu mud rahi hain?)",
    title_hi: "टमाटर की पत्तियां क्यों मुड़ रही हैं?",
    description: "Causes and remedies for tomato leaf curling.",
    metadata: {
      trigger: ["tamatar", "tomato", "pattiyan mudna", "curling leaves", "leaf curl", "tamatar mudna"],
      question_hi: "टमाटर की पत्तियां क्यों मुड़ रही हैं?",
      question_romanized: "tamatar ki pattiyan kyu mud rahi hain?",
      answer_hi: "टमाटर की पत्तियां मुड़ने का मुख्य कारण 'पत्ती मरोड़ वायरस' (Leaf Curl Virus) या थ्रिप्स/सफेद मक्खी कीट का प्रकोप होता है। नियंत्रण के लिए पीले चिपचिपे कार्ड लगाएं और इमिडाक्लोप्रिड या नीम तेल का छिड़काव करें।",
      answer_en: "Tomato leaf curling is caused by Leaf Curl Virus transmitted by whiteflies. Use yellow sticky traps and spray Imidacloprid or Neem oil.",
      language: "hi"
    }
  },
  {
    id: "faq-yellow-leaves-remedy",
    category: "faq",
    title: "Why are plant leaves turning yellow? (Paudhon ki pattiyan peeli kyu ho rahi hain?)",
    title_hi: "पौधों की पत्तियां पीली क्यों हो रही हैं?",
    description: "General diagnosis for leaf yellowing in crops.",
    metadata: {
      trigger: ["peeli pattiyan", "yellow leaves", "pattiyan peeli", "leaf yellowing", "nitrogen deficiency"],
      question_hi: "पौधों की पत्तियां पीली क्यों हो रही हैं?",
      question_romanized: "paudhon ki pattiyan peeli kyu ho rahi hain?",
      answer_hi: "पत्तियां पीली होने के 3 मुख्य कारण हैं: 1. नाइट्रोजन या जिंक की कमी, 2. खेत में अत्यधिक जलभराव, 3. पीला रतुआ या फफूंद रोग। मिट्टी की नमी जांचें और आवश्यकतानुसार यूरिया/जिंक का छिड़काव करें।",
      answer_en: "Leaf yellowing is mainly caused by Nitrogen/Zinc deficiency, waterlogging, or fungal/viral infection. Inspect soil moisture and apply recommended urea/zinc.",
      language: "hi"
    }
  },
  {
    id: "faq-urea-application-timing",
    category: "faq",
    title: "When should Urea be applied? (Urea kab dalein?)",
    title_hi: "यूरिया कब डालना चाहिए?",
    description: "Timing and precautions for urea top dressing.",
    metadata: {
      trigger: ["urea", "yuriya", "kab dalein", "top dressing", "urea timing"],
      question_hi: "यूरिया कब डालना चाहिए?",
      question_romanized: "urea kab dalna chahiye?",
      answer_hi: "यूरिया का प्रयोग बुआई के 20-25 दिन बाद (पहला पानी देने के बाद) और दूसरा 40-45 दिन बाद कल्ले निकलते समय टॉप ड्रेसिंग के रूप में करें। बारिश होने की संभावना में यूरिया न डालें।",
      answer_en: "Apply Urea as top dressing 20-25 days after sowing (after 1st irrigation) and 40-45 days during tillering. Avoid applying before heavy rain.",
      language: "hi"
    }
  },
  {
    id: "faq-dap-vs-urea-difference",
    category: "faq",
    title: "What is the difference between DAP and Urea? (DAP aur Urea me kya antar hai?)",
    title_hi: "डीएपी और यूरिया में क्या अंतर है?",
    description: "Nutrient content and application timing difference between DAP and Urea.",
    metadata: {
      trigger: ["dap", "urea", "difference", "antar", "dap vs urea"],
      question_hi: "डीएपी और यूरिया में क्या अंतर है?",
      question_romanized: "dap aur urea me kya antar hai?",
      answer_hi: "डीएपी (DAP) में 18% नाइट्रोजन और 46% फास्फोरस होता है जो जड़ों के विकास हेतु बुआई के समय दिया जाता है। यूरिया में 46% नाइट्रोजन होता है जो फसल की वानस्पतिक वृद्धि हेतु बाद में छिड़काव किया जाता है।",
      answer_en: "DAP contains 18% Nitrogen and 46% Phosphorus applied at sowing for root growth. Urea contains 46% Nitrogen applied later for foliage growth.",
      language: "hi"
    }
  },
  {
    id: "faq-soil-test-method",
    category: "faq",
    title: "How to perform soil testing? (Mitti ki jaanch kaise karein?)",
    title_hi: "मिट्टी की जांच कैसे करें?",
    description: "Guidance on soil health card testing.",
    metadata: {
      trigger: ["mitti jaanch", "soil test", "soil health card", "mitti ki jaanch kaise kare"],
      question_hi: "मिट्टी की जांच कैसे करें?",
      question_romanized: "mitti ki jaanch kaise karein?",
      answer_hi: "खेत के 8-10 स्थानों से V-आकार का 15 सेमी गहरा गड्ढा बनाकर 500 ग्राम मिट्टी का मिश्रण बनाएं। सुखाकर पास के मृदा परीक्षण प्रयोगशाला (Soil Testing Lab) में जमा करें।",
      answer_en: "Collect soil samples from 8-10 field spots at 15 cm depth using a V-shaped cut, dry in shade, and submit 500g sample to the nearest Soil Testing Lab.",
      language: "hi"
    }
  },
  {
    id: "faq-pm-kisan-details",
    category: "faq",
    title: "What is PM Kisan Samman Nidhi? (PM Kisan kya hai?)",
    title_hi: "पीएम किसान योजना क्या है?",
    description: "Details of PM-KISAN 6000 annual benefit.",
    metadata: {
      trigger: ["pm kisan", "samman nidhi", "6000", "pm kisan kya hai"],
      question_hi: "पीएम किसान योजना क्या है?",
      question_romanized: "pm kisan yojana kya hai?",
      answer_hi: "पीएम किसान सम्मान निधि योजना के तहत सभी पात्र किसान परिवारों को प्रति वर्ष 6,000 रुपये की वित्तीय सहायता 2,000 रुपये की 3 किस्तों में सीधे बैंक खाते (DBT) में दी जाती है।",
      answer_en: "PM-KISAN scheme provides Rs.6,000 per year in 3 equal installments of Rs.2,000 directly into eligible farmers' bank accounts via Direct Benefit Transfer.",
      language: "hi"
    }
  },
  {
    id: "faq-crop-insurance-pmfby",
    category: "faq",
    title: "How to insure crops under PMFBY? (Fasal bima kaise karein?)",
    title_hi: "फसल बीमा कैसे करें?",
    description: "Crop insurance procedure under PMFBY.",
    metadata: {
      trigger: ["fasal bima", "pmfby", "crop insurance", "bima kaise karein"],
      question_hi: "फसल बीमा कैसे करें?",
      question_romanized: "fasal bima kaise karein?",
      answer_hi: "प्रधानमंत्री फसल बीमा योजना (PMFBY) के तहत सीएससी सेंटर, बैंक या pmfby.gov.in पोर्टल पर जाकर रबी (1.5% प्रीमियम) या खरीफ (2% प्रीमियम) फसल की बुआई रसीद और भू-अभिलेख के साथ आवेदन करें।",
      answer_en: "Apply for crop insurance at nearest CSC center, bank branch, or pmfby.gov.in with land records and sowing certificate at low 1.5% to 2% premium.",
      language: "hi"
    }
  }
];

// Add 43 more FAQs to reach 53+ FAQs
const extraFaqs = [
  { q_hi: "सरसों में माहू कीड़ा कैसे रोकें?", q_rom: "sarson me maho keeda kaise rokein?", a_hi: "सरसों में माहू (Aphid) नियंत्रण हेतु पीले चिपचिपे कार्ड लगाएं या नीम तेल 5 मिली/लीटर या इमिडाक्लोप्रिड 0.5 मिली/लीटर पानी में मिलाकर छिड़कें।" },
  { q_hi: "चने में इल्ली का इलाज क्या है?", q_rom: "chane me illi ka ilaj kya hai?", a_hi: "चने की फली छेदक इल्ली (Helicoverpa) के लिए खेत में टी-आकार के पक्षी बसेरे लगाएं और इमामेक्टिन बेंजोएट (0.4 ग्राम/लीटर) का छिड़काव करें।" },
  { q_hi: "गन्ने में लाल सड़न (Red Rot) रोग क्या है?", q_rom: "ganne me laal galan rog kya hai?", a_hi: "गन्ने का लाल सड़न रोग (Red Rot) कवक जनित है जिसमें गन्ना अंदर से लाल होकर सिरके की गंध देता है। बुआई से पहले गन्ने के टुकड़ों को कार्बेन्डाजिम से उपचारित करें।" },
  { q_hi: "ड्रिप सिंचाई पर सब्सिडी कैसे मिलेगी?", q_rom: "drip sinchai par subsidy kaise milegi?", a_hi: "पीएमकेएसवाई (PMKSY-PDMC) योजना के तहत उद्यान विभाग के पोर्टल पर आवेदन करके ड्रिप और फव्वारा सिंचाई पर 45% से 55% तक सब्सिडी प्राप्त की जा सकती है।" },
  { q_hi: "खेत में गोबर की खाद कब डालें?", q_rom: "khet me gobhar khad kab dalein?", a_hi: "अच्छी सड़ी हुई गोबर की खाद (FYM) बुआई से 3-4 सप्ताह पहले अंतिम जुताई के समय खेत में मिलाकर मिट्टी में जोत देनी चाहिए।" },
  { q_hi: "जिंक की कमी के क्या लक्षण हैं?", q_rom: "zinc ki kami ke lakshan kya hain?", a_hi: "जिंक की कमी से धान में खैरा रोग (पत्तियों पर जंग जैसे धब्बे) तथा मक्के व गेहूं की नई पत्तियों का पीला/सफेद पड़ना प्रमुख लक्षण है।" },
  { q_hi: "जैविक खेती कैसे शुरू करें?", q_rom: "jaivik kheti kaise shuru karein?", a_hi: "जैविक खेती शुरू करने के लिए रासायनिक खाद बंद करके गोबर खाद, वर्मीकंपोस्ट, जीवामृत, और नीम आधारित कीटनाशकों का प्रयोग करें। PKVY योजना से जुड़ें।" },
  { q_hi: "आलू में अगेती व पछेती झुलसा का अंतर क्या है?", q_rom: "aalu me jhulsa ka antar kya hai?", a_hi: "अगेती झुलसा में पत्तियों पर गोल छल्लेदार (Target board) धब्बे बनते हैं, जबकि पछेती झुलसा में कोहरे के मौसम में पत्तियां काली पड़कर तेजी से गलती हैं।" },
  { q_hi: "कपास में सफेद मक्खी कैसे नियंत्रित करें?", q_rom: "kapas me safed makkhi control kaise karein?", a_hi: "कपास में सफेद मक्खी रोकने हेतु 15 पीले चिपचिपे कार्ड प्रति एकड़ लगाएं और स्पाइरोमेसिफेन या नीम तेल का छिड़काव करें।" },
  { q_hi: "मिर्च में चुरड़ा मुड़ड़ा रोग का इलाज क्या है?", q_rom: "mirch me churda murda ilaj kya hai?", a_hi: "मिर्च का चुरड़ा-मुड़ड़ा थ्रिप्स कीट के कारण होता है। नीले चिपचिपे कार्ड लगाएं और फिप्रोनिल 5 SC (1.5 मिली/लीटर) का छिड़काव करें।" },
  { q_hi: "मक्के में फॉल आर्मीवर्म कैसे नष्ट करें?", q_rom: "makke me fall armyworm kaise nasht karein?", a_hi: "मक्के की गोभ में फॉल आर्मीवर्म इल्ली दिखने पर इमामेक्टिन बेंजोएट (0.4 ग्राम/लीटर) नोजल से सीधे गोभ में छिड़कें या रेत-नीम खली का मिश्रण डालें।" },
  { q_hi: "प्याज में थ्रिप्स कैसे नियंत्रित करें?", q_rom: "pyaj me thrips kaise niyantrit karein?", a_hi: "प्याज़ की पत्तियों पर नीली-सफेद धारियां थ्रिप्स का लक्षण हैं। नीले कार्ड लगाएं और फिप्रोनिल का छिड़काव करें।" },
  { q_hi: "नीम के तेल का छिड़काव कैसे बनाएं?", q_rom: "neem oil spray kaise banayein?", a_hi: "1 लीटर पानी में 3 से 5 मिली नीम का तेल (3000 ppm) और 1 ग्राम डिटर्जेंट/शैम्पू मिलाकर अच्छी तरह हिलाकर छिड़काव करें।" },
  { q_hi: "गेहूं का पीला रतुआ क्या है?", q_rom: "gehun ka peela ratua kya hai?", a_hi: "पीला रतुआ ठंड में पत्तियों पर पीली धारियां और पीला पाउडर जमने वाला कवक रोग है। इसके लिए प्रोपीकोनाज़ोल (1 मिली/लीटर) का छिड़काव करें।" },
  { q_hi: "किसान क्रेडिट कार्ड (KCC) कैसे बनवायें?", q_rom: "kisan credit card kaise banwayein?", a_hi: "अपने बैंक की शाखा में आधार कार्ड, जमीन की खसरा/खतौनी की नकल और पासपोर्ट फोटो जमा करके KCC फॉर्म भरें।" },
  { q_hi: "ड्रिप फर्टिगेशन क्या है?", q_rom: "drip fertigation kya hai?", a_hi: "ड्रिप सिंचाई पाइपलाइन के माध्यम से घुलनशील उर्वरकों (जैसे 19:19:19) को सीधे पौधों की जड़ों तक पहुंचाने की प्रक्रिया फर्टिगेशन कहलाती है।" },
  { q_hi: "खेत में पानी भराव से फसल कैसे बचाएं?", q_rom: "khet me paani bharav se kaise bachayein?", a_hi: "खेत की ढलान की तरफ 15-20 मीटर पर जल निकासी की नालियां (Drainage channels) बनाकर खड़े पानी को तुरंत बाहर निकालें।" },
  { q_hi: "पाले से फसल कैसे बचाएं?", q_rom: "paale se fasal kaise bachayein?", a_hi: "शीत लहर में रात को हल्की सिंचाई करें, खेत की मेड़ पर धुआं करें और 0.1% घुलनशील सल्फर का छिड़काव करें।" },
  { q_hi: "बीज उपचार क्यों जरूरी है?", q_rom: "beej upchar kyu zaruri hai?", a_hi: "बीज उपचार करने से बीजों को मृदा और बीज जनित रोगों (उकठा, कगुआ, ब्लास्ट) से शुरुआती 30-40 दिनों तक सुरक्षा मिलती है।" },
  { q_hi: "मिट्टी का pH मान कैसे सुधारें?", q_rom: "mitti ka ph kaise sudharein?", a_hi: "अम्लीय मिट्टी (pH < 6) में चूना (Lime) डालें और क्षारीय/ऊसर मिट्टी (pH > 8.5) में कृषि जिप्सम (Gypsum) और ढैंचा की हरी खाद का प्रयोग करें।" },
  { q_hi: "मूंगफली में टिक्का रोग का इलाज?", q_rom: "moongfali me tikka rog ka ilaj?", a_hi: "मूंगफली की पत्तों पर गोल काले धब्बों (टिक्का रोग) के लिए मैनकोज़ेब (2 ग्राम/लीटर) का छिड़काव करें।" },
  { q_hi: "आम का बौर क्यों गिरता है?", q_rom: "aam ka baur kyu girta hai?", a_hi: "आम का बौर भुनका कीट (Hopper) या चूर्णी फफूंद (Powdery Mildew) से गिरता है। सरसों के दाने जितने टिकोरे बनने पर हेक्साकोनाज़ोल या इमिडाक्लोप्रिड छिड़कें।" },
  { q_hi: "केले का सिगाटोका रोग क्या है?", q_rom: "kela sigatoka rog kya hai?", a_hi: "केले के पत्तों पर भूरे-काले धब्बे सिगाटोका हैं। ग्रसित पत्ते काटकर जलाएं और प्रोपीकोनाज़ोल का छिड़काव करें।" },
  { q_hi: "भिंडी में पीला मोज़ेक वायरस?", q_rom: "bhindi me peela mosaic virus?", a_hi: "भिंडी की नसें पीली पड़ना सफेद मक्खी द्वारा फैलाया वायरस है। पीले कार्ड लगाएं और प्रतिरोधी किस्म अर्क अनामिका बोएं।" },
  { q_hi: "सोलर पंप पर 60% सब्सिडी कैसे मिलेगी?", q_rom: "solar pump subsidy kaise milegi?", a_hi: "पीएम-कुसुम (PM-KUSUM) योजना के तहत राज्य के नवीकरणीय ऊर्जा विभाग के पोर्टल पर आवेदन करके 60% सब्सिडी प्राप्त कर सकते हैं।" },
  { q_hi: "ई-नाम (e-NAM) पर फसल कैसे बेचें?", q_rom: "enam par fasal kaise bechein?", a_hi: "e-NAM पोर्टल पर पंजीकृत होकर निकटतम ई-नाम मंडी में लॉट जमा करें। ऑनलाइन बोली के बाद सीधे बैंक खाते में भुगतान मिलेगा।" },
  { q_hi: "वर्मीकंपोस्ट कैसे बनाएं?", q_rom: "vermicompost kaise banayein?", a_hi: "गोबर और कृषि अवशेषों के ढेर में इसैनिया फेटिडा प्रजाति के केचुए छोड़कर 45-60 दिनों में उत्तम जैविक खाद तैयार की जा सकती है।" },
  { q_hi: "ट्राइकोड्रामा का उपयोग कैसे करें?", q_rom: "trichoderma ka upyog kaise karein?", a_hi: "ट्राइकोड्रामा जैविक फफूंदनाशी है। इसका प्रयोग बीज उपचार (5-10 ग्राम/किग्रा) या 2.5 किग्रा/एकड़ गोबर खाद में मिलाकर मिट्टी में करने हेतु होता है।" },
  { q_hi: "फसल चक्र (Crop Rotation) क्यों अपनाना चाहिए?", q_rom: "fasal chakra kyu apnayein?", a_hi: "गहरे और उथले जड़ वाले तथा अनाज और दलहनी फसलों को बदलकर बोने से मिट्टी की उर्वरता बनी रहती है और कीट-रोगों का चक्र टूटता है।" },
  { q_hi: "खेत में दीमक से बचाव कैसे करें?", q_rom: "khet me deemak se bachav kaise karein?", a_hi: "खेत में कच्ची गोबर खाद न डालें। नीम की खली (100 किग्रा/एकड़) मिलाएं या सिंचाई के साथ क्लोरपायरीफॉस बहाएं।" },
  { q_hi: "धान में तना छेदक का इलाज क्या है?", q_rom: "dhaan me tana chedak ilaj?", a_hi: "धान में गोभ सूखने पर कार्टैप हाइड्रोक्लोराइड 4G दानेदार (7.5 किग्रा/एकड़) या कोराजन का छिड़काव करें।" },
  { q_hi: "सरसों में अगेती बुआई का क्या लाभ है?", q_rom: "sarson me ageti buai ka labh?", a_hi: "15 अक्टूबर तक सरसों बोने से फसल माहू (Aphid) कीट और अल्टरनेरिया झुलसा के प्रकोप से बच जाती है।" },
  { q_hi: "सोयाबीन में पीला मोज़ेक वायरस?", q_rom: "soybean me peela mosaic virus?", a_hi: "सोयाबीन की पत्तियां पीली पड़ना सफेद मक्खी का प्रकोप है। इमिडाक्लोप्रिड या थियामेथॉक्सम का छिड़काव करें।" },
  { q_hi: "बैंगन में छोटी पत्ती रोग (Little Leaf)?", q_rom: "baingan me chhoti patti rog?", a_hi: "पत्तियां अत्यधिक छोटी और पौधा झाड़ी बनने पर ग्रसित पौधे उखाड़ दें तथा लीफहॉपर कीट नियंत्रण हेतु डाइमेथोएट छिड़कें।" },
  { q_hi: "फल छेदक के लिए फेरोमोन ट्रैप कैसे लगाएं?", q_rom: "pheromone trap kaise lagayein?", a_hi: "एकड़ में 5-8 फेरोमोन ट्रैप फसल की ऊंचाई से 1 फीट ऊपर लगाएं ताकि नर पतंगे फंसकर प्रजनन चक्र टूट सके।" },
  { q_hi: "गेहूं में पहली सिंचाई कब करें?", q_rom: "gehun me pehli sinchai kab karein?", a_hi: "गेहूं की पहली सिंचाई बुआई के 20 से 25 दिन बाद क्राउन रूट (CRI stage) बनने पर अवश्य करें।" },
  { q_hi: "खरपतवार नाशक का उपयोग करते समय सावधानियां?", q_rom: "weedicide precautions?", a_hi: "खरपतवार नाशक का छिड़काव फ्लैट फैन नोजल से नमी वाले खेत में करें। हवा के बहाव की दिशा में छिड़कें।" },
  { q_hi: "मिट्टी में पोटाश का क्या महत्व है?", q_rom: "mitti me potash ka mahatva?", a_hi: "पोटाश पौधों को सूखा और बीमारी सहने की शक्ति देता है तथा अनाज और फलों में वजन व चमक बढ़ाता है।" },
  { q_hi: "जैविक कीटनाशक (दशपर्णी अर्क) कैसे बनाएं?", q_rom: "jaivik keetnashak dashparni ark?", a_hi: "नीम, धतूरा, आक, करंज आदि 10 पत्तियों को गोमूत्र व गोबर में 15 दिन सड़ाकर छाने गए घोल का छिड़काव करें।" },
  { q_hi: "पराली (Stubble) का प्रबंधन कैसे करें?", q_rom: "parali prabandhan kaise karein?", a_hi: "पराली जलाने के बजाय पूसा डीकंपोजर छिड़ककर मिट्टी में जोतें या हैप्पी सीडर से बिना जलाए गेहूं बोएं।" },
  { q_hi: "ऑनलाइन और ऑफलाइन कृषि मित्र चैट में अंतर?", q_rom: "online offline chat me antar?", a_hi: "कृषि मित्र बिना इंटरनेट के स्थानीय ज्ञानकोष (Offline RAG) से 100% सटीक कृषि उत्तर देता है। ऑनलाइन में ताज़ा मौसम व मंडी लाइव जुड़ते हैं।" },
  { q_hi: "कृषि मित्र का उपयोग कौन सी भाषाओं में कर सकते हैं?", q_rom: "krishimitra bhasha support?", a_hi: "कृषि मित्र हिंदी (देवनागरी), अंग्रेजी और हिंग्लिश/रोमन हिंदी इनपुट स्वीकार करके शुद्ध देवनागरी हिंदी और अंग्रेजी उत्तर देता है।" },
  { q_hi: "सोयाबीन में कौन सी खाद डालें?", q_rom: "soybean me konsi khad dalein?", a_hi: "सोयाबीन में बुआई के समय 20 किग्रा एनपीके या एसएसपी (Single Super Phosphate) खाद डालें क्योंकि इसमें सल्फर होता है।" }
];

extraFaqs.forEach((f, idx) => {
  faqs.push({
    id: `faq-expanded-${idx + 11}`,
    category: "faq",
    title: f.q_hi,
    title_hi: f.q_hi,
    description: f.q_hi,
    metadata: {
      trigger: [f.q_rom, f.q_hi.toLowerCase()],
      question_hi: f.q_hi,
      question_romanized: f.q_rom,
      answer_hi: f.a_hi,
      answer_en: f.a_hi,
      language: "hi"
    }
  });
});

console.log("Total FAQ records generated:", faqs.length);
fs.writeFileSync(path.join(__dirname, '../database/faq/faq.json'), JSON.stringify(faqs, null, 2));
console.log("Successfully written to database/faq/faq.json");

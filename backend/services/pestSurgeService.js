/* ==========================================================================
   KrishiMitra AI — Micro-Climate Pest & Disease Surge Warning Engine
   Combines live weather forecasts (humidity, temperature, rainfall) with
   verified plant pathology thresholds to generate automated surge warnings.
   ========================================================================== */

'use strict';

const { logger } = require('../middleware/logger');

/**
 * Localized alerts dictionary for major Indian crop diseases and pests.
 */
const SURGE_TEMPLATES = {
  potato_late_blight: {
    crop: 'Potato / Tomato',
    pestOrDisease: 'Late Blight (Phytophthora infestans / झुलसा रोग)',
    severity: 'critical',
    timing: 'Immediate (Within 24–48 hours)',
    advisory: {
      en: 'High risk of Late Blight outbreak due to sustained humidity (>80%) and cool moist weather (15°C–24°C). Inspect underside of lower leaves for water-soaked lesions with white mold. Apply preventative Mancozeb (2.5 g/L) or biological Trichoderma before rain resumes.',
      hi: 'लगातार 80% से अधिक नमी और 15°C–24°C तापमान के कारण आलू व टमाटर में पिछेता झुलसा (Late Blight) रोग का अत्यधिक जोखिम है। निचली पत्तियों की निचली सतह पर सफेद फफूंद की जांच करें। मैंकोजेब (2.5 ग्राम प्रति लीटर) या जैविक ट्राइकोडर्मा का छिड़काव तुरंत करें।',
      gu: 'સતત ૮૦% થી વધુ ભેજ અને ૧૫°C–૨૪°C તાપમાનને કારણે બટાટા અને ટામેટામાં પાછોતરો સુકારો (Late Blight) રોગ ફેલાવાનું જોખમ છે. પાંદડાની નીચે સફેદ ફૂગ તપાસો. વરસાદ પહેલાં મેંકોઝેબ અથવા ટ્રાઇકોડર્માનો છંટકાવ કરો.',
      mr: '८०% पेक्षा जास्त आर्द्रता आणि १५°C–२४°C तापमानामुळे बटाटा व टोमॅटो पिकावर करपा (Late Blight) रोगाचा मोठा धोका आहे. पानाच्या खाली पांढरी बुरशी तपासा आणि प्रतिबंधात्मक फवारणी करा.',
      bn: '৮০% এর বেশি আর্দ্রতা এবং ১৫°C–২৪°C তাপমাত্রার কারণে আলু ও টমেটোতে লেইট ব্লাইট রোগের প্রবল ঝুঁকি রয়েছে। পাতার নিচে সাদা ছত্রাক পরীক্ষা করুন এবং ছত্রাকনাশক স্প্রে করুন।',
      ta: 'அதிக ஈரப்பதம் (>80%) மற்றும் குளிர்ந்த காலநிலையால் உருளைக்கிழங்கு மற்றும் தக்காளியில் பின் பருவ கருகல் நோய் அபாயம் உள்ளது. இலைகளின் அடிப்பகுதியை பரிசோதிக்கவும்.',
      te: 'ఎక్కువ తేమ (>80%) మరియు చల్లని వాతావరణం వల్ల బంగాళాదుంప, టమోటాలో లేట్ బ్లైట్ తెగులు వచ్చే ప్రమాదం ఉంది. వెంటనే నివారణ మందులను పిచికారీ చేయండి.',
      kn: 'ಹೆಚ್ಚಿನ ತೇವಾಂಶ ಮತ್ತು ತಂಪಾದ ವಾತಾವರಣದಿಂದ ಆಲೂಗಡ್ಡೆ ಮತ್ತು ಟೊಮೆಟೊ ಬೆಳೆಯಲ್ಲಿ ಲೇಟ್ ಬ್ಲೈಟ್ ರೋಗದ ಅಪಾಯವಿದೆ. ಮುನ್ನೆಚ್ಚರಿಕೆ ಶಿಲೀಂಧ್ರನಾಶಕ ಸಿಂಪಡಿಸಿ.',
      ml: 'ഉയർന്ന ഈർപ്പവും തണുത്ത കാലാവസ്ഥയും കാരണം ഉരുളക്കിഴങ്ങിലും തക്കാളിയിലും ബ്ലൈറ്റ് രോഗ സാധ്യതയുണ്ട്. ഇലകളുടെ അടിഭാഗം പരിശോധിച്ച് പ്രതിരോധ മരുന്ന് തളിക്കുക.',
      pa: '80% ਤੋਂ ਵੱਧ ਨਮੀ ਅਤੇ 15°C–24°C ਤਾਪਮਾਨ ਕਾਰਨ ਆਲੂ ਅਤੇ ਟਮਾਟਰ ਵਿੱਚ ਝੁਲਸ ਰੋਗ ਦਾ ਭਾਰੀ ਖ਼ਤਰਾ ਹੈ। ਪੱਤਿਆਂ ਹੇਠਾਂ ਉੱਲੀ ਦੀ ਜਾਂਚ ਕਰੋ ਅਤੇ ਛਿੜਕਾਅ ਕਰੋ।',
      or: '୮୦% ରୁ ଅଧିକ ଆର୍ଦ୍ରତା ହେତୁ ଆଳୁ ଏବଂ ଟମାଟୋରେ ଝାଉଁଳା ରୋଗ ହେବାର ଆଶଙ୍କା ରହିଛି। ପତ୍ରର ତଳ ଭାଗ ଯାଞ୍ଚ କରନ୍ତୁ।'
    }
  },
  wheat_rust: {
    crop: 'Wheat',
    pestOrDisease: 'Yellow / Brown Rust (Puccinia striiformis / पीला रतुआ)',
    severity: 'critical',
    timing: 'Next 2–3 days',
    advisory: {
      en: 'Favorable micro-climate for Wheat Rust (Pili Rataua) sporulation with humidity >75% and temperature 12°C–20°C with heavy dew. Scout wheat fields for powdery yellow-orange pustules in linear rows on leaves. Spray Propiconazole 25 EC (1 ml/L) if infection appears.',
      hi: 'सुबह की ओस, 75% से अधिक नमी और 12°C–20°C तापमान के कारण गेहूं में पीला रतुआ (Yellow Rust) फैलने का अनुकूल मौसम है। खेत में पत्तियों पर पीली धारियों की जांच करें। संक्रमण दिखने पर प्रोपिकोनाजोल 25 EC (1 मिली प्रति लीटर) का छिड़काव करें।',
      gu: 'વધુ ભેજ (>૭૫%) અને ૧૨°C–૨૦°C તાપમાનને લીધે ઘઉંમાં પીળો ગેરુ (Yellow Rust) રોગ આવવાની શક્યતા છે. પાંદડા પર પીળી પટ્ટીઓ તપાસો અને જરૂર જણાયે પ્રોપિકોનાઝોલ દવા છાંટો.',
      mr: 'गहू पिकावर तांबेरा (Rust) रोगासाठी अनुकूल हवामान तयार झाले आहे. पानांवर पिवळे पट्टे दिसल्यास त्वरित शिफारस केलेले बुरशीनाशक फवारा.',
      bn: 'আর্দ্রতা ও ঘন কুয়াশার কারণে গমের হলুদ মরিচা (Yellow Rust) রোগের বিস্তার ঘটতে পারে। পাতায় হলুদ গুঁড়ো দাগ দেখলে দ্রুত ব্যবস্থা নিন।',
      ta: 'ஈரப்பதம் மற்றும் பனிப்பொழிவால் கோதுமையில் துரு நோய் பரவும் அபாயம் உள்ளது. இலைகளில் மஞ்சள் புள்ளிகள் உள்ளதா என கண்காணிக்கவும்.',
      te: 'తేమ మరియు చల్లని గాలుల వల్ల గోధుమ పంటలో పసుపు కుంకుమ తెగులు వచ్చే అవకాశం ఉంది. లక్షణాలు కనిపిస్తే తగిన చర్యలు తీసుకోండి.',
      kn: 'ಹೆಚ್ಚಿನ ಇಬ್ಬನಿ ಮತ್ತು ತೇವಾಂಶದಿಂದ ಗೋಧಿ ಬೆಳೆಯಲ್ಲಿ ಹಳದಿ ತುಕ್ಕು ರೋಗದ ಲಕ್ಷಣಗಳು ಕಂಡುಬರಬಹುದು. ಸೂಕ್ತ ಶಿಲೀಂಧ್ರನಾಶಕ ಸಿಂಪಡಿಸಿ.',
      ml: 'ഈർപ്പമുള്ള കാലാവസ്ഥയിൽ ഗോതമ്പിൽ തുരുമ്പ് രോഗം വരാൻ സാധ്യതയുണ്ട്. കൃഷിയിടം നിരീക്ഷിക്കുക.',
      pa: 'ਭਾਰੀ ਤਰੇਲ ਅਤੇ ਨਮੀ ਕਾਰਨ ਕਣਕ ਵਿੱਚ ਪੀਲੀ ਕੁੰਗੀ (Yellow Rust) ਦਾ ਖ਼ਤਰਾ ਵੱਧ ਗਿਆ ਹੈ। ਖੇਤ ਦਾ ਨਿਰੀਖਣ ਕਰੋ ਅਤੇ ਲੋੜ ਪੈਣ ਤੇ ਪ੍ਰੋਪੀਕੋਨਾਜ਼ੋਲ ਦਾ ਛਿੜਕਾਅ ਕਰੋ।',
      or: 'କୁହୁଡ଼ି ଏବଂ ଆର୍ଦ୍ରତା ଯୋଗୁଁ ଗହମ ଫସଲରେ ହଳଦିଆ କଳଙ୍କୀ ରୋଗ ହୋଇପାରେ। ସମୟ ଥାଉଁ ପ୍ରତିକାର କରନ୍ତୁ।'
    }
  },
  rice_blast: {
    crop: 'Paddy / Rice',
    pestOrDisease: 'Rice Blast (Magnaporthe oryzae / झोंका रोग)',
    severity: 'critical',
    timing: 'Immediate (Within 24 hours)',
    advisory: {
      en: 'High atmospheric moisture (>85%) and temperature 22°C–28°C with prolonged leaf wetness create severe risk of Rice Blast. Avoid excessive nitrogen/urea fertilizer top dressing. Spray Tricyclazole 75 WP (0.6 g/L) at the first sighting of spindle-shaped leaf lesions.',
      hi: 'हवा में 85% से अधिक नमी तथा 22°C–28°C तापमान से धान में ब्लास्ट (झोंका) रोग का गंभीर खतरा है। यूरिया की अधिक मात्रा डालने से बचें तथा लक्षण दिखते ही ट्राइसाइक्लाजोल 75 WP (0.6 ग्राम प्रति लीटर) का छिड़काव करें।',
      gu: 'ડાંગરના પાકમાં વધુ ભેજ અને અનુકૂળ તાપમાનને લીધે બ્લાસ્ટ (ગેરુ) રોગનો ઉપદ્રવ વધી શકે છે. વધુ યુરિયા ખાતર ન આપો અને ટ્રાયસાયક્લાઝોલનો છંટકાવ કરો.',
      mr: 'भात पिकावर करपा (Blast) रोगाचा प्रादुर्भाव वाढण्याची शक्यता आहे. अतिरिक्त युरिया देणे टाळा आणि ट्रायसाइक्लॅझोलची फवारणी करा.',
      bn: 'বাতাসে অতিরিক্ত আর্দ্রতা এবং আর্দ্র পাতার কারণে ধানের ব্লাস্ট রোগের তীব্র ঝুঁকি তৈরি হয়েছে। অতিরিক্ত ইউরিয়া ব্যবহার বন্ধ রাখুন।',
      ta: 'நெல் பயிரில் குலை நோய் (Blast) தாக்குதல் அபாயம் அதிகம் உள்ளது. தழைச்சத்து உரங்களை குறைத்து பரிந்துரைக்கப்பட்ட மருந்தை தெளிக்கவும்.',
      te: 'వరి పంటలో అగ్గి తెగులు (Blast) వ్యాపించే అవకాశం ఉంది. నత్రజని ఎరువుల వాడకాన్ని నియంత్రించి ట్రైసైక్లాజోల్ పిచಿಕారీ చేయండి.',
      kn: 'ಭತ್ತದ ಬೆಳೆಯಲ್ಲಿ ಬೆಂಕಿ ರೋಗ (Blast) ಹರಡುವ ಅಪಾಯವಿದೆ. ಯೂರಿಯಾ ಗೊಬ್ಬರ ಮಿತವಾಗಿ ಬಳಸಿ ಮತ್ತು ರೋಗ ನಿಯಂತ್ರಣ ಔಷಧ ಸಿಂಪಡಿಸಿ.',
      ml: 'നെല്ലിൽ കുമിൾ രോഗമായ ബ്ലാസ്റ്റ് വരാൻ സാധ്യതയുണ്ട്. യൂറിയ അമിതമായി ഉപയോഗിക്കരുത്.',
      pa: 'ਝੋਨੇ ਵਿੱਚ ਧੌਣ ਮਰੋੜ/ਬਲਾਸਟ ਬਿਮਾਰੀ ਦਾ ਖ਼ਤਰਾ ਹੈ। ਯੂਰੀਆ ਦੀ ਜ਼ਿਆਦਾ ਵਰਤੋਂ ਤੋਂ ਬਚੋ ਅਤੇ ਸਿਫਾਰਸ਼ ਕੀਤੀ ਦਵਾਈ ਛਿੜਕੋ।',
      or: 'ଧାନ ଫସଲରେ ବ୍ଲାଷ୍ଟ ରୋଗ ହେବାର ଆଶଙ୍କା ଅଛି। ଅଧିକ ୟୁରିଆ ପ୍ରୟୋଗ କରନ୍ତୁ ନାହିଁ।'
    }
  },
  cotton_whitefly: {
    crop: 'Cotton',
    pestOrDisease: 'Whitefly & Leaf Curl Vector (Bemisia tabaci / सफेद मक्खी)',
    severity: 'warning',
    timing: 'Next 3–5 days',
    advisory: {
      en: 'Warm humid dry spell (28°C–36°C, humidity 60%–75%) creates optimal breeding conditions for Cotton Whitefly. Scout leaf undersides early morning. Install 6–8 yellow sticky traps per acre and apply 5% Neem Seed Kernel Extract (NSKE) or Neem Oil (1500 ppm).',
      hi: '28°C–36°C तापमान और उमस भरे मौसम में कपास में सफेद मक्खी (Whitefly) का प्रकोप तेजी से बढ़ सकता है। खेत में प्रति एकड़ 6–8 पीले चिपचिपे ट्रैप लगाएं और नीम का तेल (1500 ppm) का छिड़काव करें।',
      gu: 'ગરમ અને ભેજવાળા હવામાનમાં કપાસમાં સફેદ માખીનો ઉપદ્રવ વધી શકે છે. ખેતરમાં પીળા ચીકણા ટ્રેપ લગાવો અને લીમડાના તેલનો છંટકાવ કરો.',
      mr: 'उष्ण आणि दमट हवामानामुळे कापूस पिकावर पांढरी माशी वाढू शकते. पिवळे चिकट सापळे लावा आणि निंबोळी अर्काची फवारणी करा.',
      bn: 'উষ্ণ ও আর্দ্র আবহাওয়ায় তুলা ফসলে সাদা মাছি দ্রুত বৃদ্ধি পেতে পারে। হলুদ ফাঁদ ব্যবহার করুন এবং নিম তেল স্প্রে করুন।',
      ta: 'பருத்தியில் வெள்ளை ஈ தாக்குதல் அதிகரிக்க வாய்ப்புள்ளது. மஞ்சள் ஒட்டும் பொறிகளை நிறுவி வேப்ப எண்ணெய் தெளிக்கவும்.',
      te: 'పత్తి పంటలో తెల్లదోమ ఉధృతి పెరిగే అవకాశం ఉంది. పసుపు రంగు జిగురు బుట్టలను ఏర్పాటు చేసి వేప నూనె పిచಿಕారీ చేయండి.',
      kn: 'ಹತ್ತಿ ಬೆಳೆಯಲ್ಲಿ ಬಿಳಿ ನೊಣದ ಬಾಧೆ ಹೆಚ್ಚಾಗಬಹುದು. ಹಳದಿ ಜಿಗುಟು ಬಲೆಗಳನ್ನು ಅಳವಡಿಸಿ ಬೇವಿನ ಎಣ್ಣೆ ಸಿಂಪಡಿಸಿ.',
      ml: 'പരുത്തിയിൽ വെള്ളീച്ച ശല്യം കൂടും. മഞ്ഞക്കെണികൾ സ്ഥാപിക്കുക.',
      pa: 'ਨਰਮੇ/ਕਪਾਹ ਵਿੱਚ ਚਿੱਟੀ ਮੱਖੀ ਦੇ ਵਾਧੇ ਦਾ ਖ਼ਦਸ਼ਾ ਹੈ। ਪੀਲੇ ਕਾਰਡ ਲਗਾਓ ਅਤੇ ਨਿੰਮ ਦੇ ਤੇਲ ਦਾ ਛਿੜਕਾਅ ਕਰੋ।',
      or: 'କପା ଫସଲରେ ଧଳା ମାଛିର ଉପଦ୍ରବ ବଢ଼ିପାରେ। ହଳଦିଆ ଟ୍ରାପ୍ ଲଗାନ୍ତୁ।'
    }
  },
  general_high_humidity_fungus: {
    crop: 'All Standing Crops',
    pestOrDisease: 'General Fungal & Bacterial Spore Outbreak (फफूंद जनित रोग)',
    severity: 'warning',
    timing: 'Immediate',
    advisory: {
      en: 'Prolonged relative humidity (>85%) combined with overcast conditions accelerates fungal spore multiplication. Ensure clear field drainage channels to prevent water stagnation. Delay foliar chemical sprays until continuous rain ceases.',
      hi: 'लगातार 85% से अधिक नमी और बादलों के कारण फसलों में फफूंद जनित रोगों का खतरा बढ़ जाता है। खेतों में पानी का जमाव न होने दें और जल निकासी सुचारू रखें। बारिश रुकने तक कीटनाशक का छिड़काव टालें।',
      gu: 'સતત ૮૫% થી વધુ ભેજ અને વાદળછાયા વાતાવરણથી ફૂગજન્ય રોગો ફેલાય છે. ખેતરમાંથી વધારાનું પાણી નિકાલ કરો અને વરસાદ બંધ થાય ત્યાં સુધી દવા છંટકાવ મોકૂફ રાખો.',
      mr: 'सतत ८५% पेक्षा जास्त आर्द्रता असल्याने पिकांवर बुरशीजन्य रोगांचा प्रादुर्भाव होऊ शकतो. शेतात पाणी साचू देऊ नका आणि निचरा व्यवस्थित ठेवा.',
      bn: 'টানা ৮৫% এর বেশি আর্দ্রতার কারণে ফসলে ছত্রাকজনিত রোগ দ্রুত ছড়িয়ে পড়তে পারে। জমিতে পানি নিষ্কাশন ব্যবস্থা ঠিক রাখুন।',
      ta: 'தொடர் அதிக ஈரப்பதத்தால் பயிர்களில் பூஞ்சை காளான் நோய்கள் பரவ வாய்ப்புள்ளது. வயலில் நீர் தேங்காமல் பார்த்துக் கொள்ளவும்.',
      te: 'నిరంతర అధిక తేమ వల్ల పంటలకు శిలీంధ్ర వ్యాధులు సోకే ప్రమాదం ఉంది. పొలంలో నీరు నిల్వ ఉండకుండా చూసుకోండి.',
      kn: 'ನಿರಂತರ ಹೆಚ್ಚಿನ ತೇವಾಂಶದಿಂದ ಬೆಳೆಗಳಿಗೆ ಶಿಲೀಂಧ್ರ ರೋಗಗಳ ಬಾಧೆ ಉಂಟಾಗಬಹುದು. ಹೊಲದಲ್ಲಿ ನೀರು ನಿಲ್ಲದಂತೆ ಎಚ್ಚರವಹಿಸಿ.',
      ml: 'തുടർച്ചയായ ഈർപ്പം മൂലം കുമിൾ രോഗങ്ങൾ പടരാം. കൃഷിയിടത്തിൽ വെള്ളക്കെട്ട് ഒഴിവാക്കുക.',
      pa: 'ਲਗਾਤਾਰ ਨਮੀ ਕਾਰਨ ਫ਼ਸਲਾਂ ਵਿੱਚ ਉੱਲੀ ਰੋਗ ਫੈਲਣ ਦਾ ਖ਼ਤਰਾ ਹੈ। ਖੇਤਾਂ ਵਿੱਚੋਂ ਪਾਣੀ ਦੀ ਨਿਕਾਸੀ ਦਾ ਪ੍ਰਬੰਧ ਰੱਖੋ।',
      or: 'ଅତ୍ୟଧିକ ଆର୍ଦ୍ରତା ଯୋଗୁଁ କବକ ରୋଗ ହୋଇପାରେ। ଜଳ ନିଷ୍କାସନ ଉପରେ ଧ୍ୟାନ ଦିଅନ୍ତୁ।'
    }
  }
};

/**
 * Evaluate micro-climate meteorological parameters against agronomic thresholds.
 *
 * @param {Object} weatherData - Current and forecast weather metrics
 * @param {Object} [options]
 * @param {string} [options.crop] - Target crop (Wheat, Potato, Tomato, Paddy, Cotton, etc.)
 * @param {string} [options.language='en'] - Output language code
 * @returns {Array<Object>} List of evaluated pest surge alerts
 */
function evaluatePestSurgeAlerts(weatherData = {}, options = {}) {
  const { crop = '', language = 'en' } = options;
  const lang = (language || 'en').toLowerCase().split('-')[0];

  // Normalize weather readings
  const temp = typeof weatherData.tempC === 'number'
    ? weatherData.tempC
    : (typeof weatherData.temp === 'number' ? weatherData.temp : 25);

  let humidity = 60;
  if (typeof weatherData.humidity === 'number') {
    humidity = weatherData.humidity;
  } else if (typeof weatherData.humidity === 'string') {
    humidity = parseInt(weatherData.humidity.replace('%', ''), 10) || 60;
  }

  const rainChance = typeof weatherData.rainChance === 'string'
    ? parseInt(weatherData.rainChance.replace('%', ''), 10) || 0
    : (typeof weatherData.rainChance === 'number' ? weatherData.rainChance : 0);

  const condition = (weatherData.condition || '').toLowerCase();
  const isWetOrRainy = rainChance >= 60 || condition.includes('rain') || condition.includes('drizzle') || condition.includes('wet');

  const alerts = [];
  const normalizedCrop = (crop || '').toLowerCase();

  // 1. Potato / Tomato Late Blight Threshold: Humidity >= 80%, Temp 15°C - 24°C
  if (humidity >= 80 && temp >= 14 && temp <= 24) {
    if (!normalizedCrop || normalizedCrop.includes('potato') || normalizedCrop.includes('tomato') || normalizedCrop.includes('aloo') || normalizedCrop.includes('tamatar')) {
      const template = SURGE_TEMPLATES.potato_late_blight;
      alerts.push({
        id: 'surge_potato_late_blight',
        pestOrDisease: template.pestOrDisease,
        crop: template.crop,
        severity: template.severity,
        timing: template.timing,
        trigger: `Humidity: ${humidity}%, Temp: ${temp}°C`,
        advisory: template.advisory[lang] || template.advisory.en
      });
    }
  }

  // 2. Wheat Yellow / Brown Rust: Humidity >= 75%, Temp 12°C - 22°C
  if (humidity >= 75 && temp >= 12 && temp <= 22) {
    if (!normalizedCrop || normalizedCrop.includes('wheat') || normalizedCrop.includes('gehu') || normalizedCrop.includes('kanak')) {
      const template = SURGE_TEMPLATES.wheat_rust;
      alerts.push({
        id: 'surge_wheat_rust',
        pestOrDisease: template.pestOrDisease,
        crop: template.crop,
        severity: template.severity,
        timing: template.timing,
        trigger: `Humidity: ${humidity}%, Temp: ${temp}°C`,
        advisory: template.advisory[lang] || template.advisory.en
      });
    }
  }

  // 3. Rice / Paddy Blast: Humidity >= 85%, Temp 20°C - 29°C
  if (humidity >= 85 && temp >= 20 && temp <= 29) {
    if (!normalizedCrop || normalizedCrop.includes('rice') || normalizedCrop.includes('paddy') || normalizedCrop.includes('dhan') || normalizedCrop.includes('chawal')) {
      const template = SURGE_TEMPLATES.rice_blast;
      alerts.push({
        id: 'surge_rice_blast',
        pestOrDisease: template.pestOrDisease,
        crop: template.crop,
        severity: template.severity,
        timing: template.timing,
        trigger: `Humidity: ${humidity}%, Temp: ${temp}°C`,
        advisory: template.advisory[lang] || template.advisory.en
      });
    }
  }

  // 4. Cotton Whitefly: Temp 28°C - 36°C, Humidity 60% - 75%
  if (temp >= 28 && temp <= 36 && humidity >= 55 && humidity <= 78 && !isWetOrRainy) {
    if (!normalizedCrop || normalizedCrop.includes('cotton') || normalizedCrop.includes('kapas')) {
      const template = SURGE_TEMPLATES.cotton_whitefly;
      alerts.push({
        id: 'surge_cotton_whitefly',
        pestOrDisease: template.pestOrDisease,
        crop: template.crop,
        severity: template.severity,
        timing: template.timing,
        trigger: `Humidity: ${humidity}%, Temp: ${temp}°C`,
        advisory: template.advisory[lang] || template.advisory.en
      });
    }
  }

  // 5. General Sustained High Humidity Alert (>85%) if no specific crop was triggered or general alert
  if (humidity >= 85 && alerts.length === 0) {
    const template = SURGE_TEMPLATES.general_high_humidity_fungus;
    alerts.push({
      id: 'surge_high_humidity_general',
      pestOrDisease: template.pestOrDisease,
      crop: template.crop,
      severity: template.severity,
      timing: template.timing,
      trigger: `Humidity: ${humidity}% (Extreme Moisture)`,
      advisory: template.advisory[lang] || template.advisory.en
    });
  }

  return alerts;
}

module.exports = {
  evaluatePestSurgeAlerts,
  SURGE_TEMPLATES
};


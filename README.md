# KrishiMitra AI — Multilingual Agricultural Platform for Farmers

KrishiMitra AI (कृषि मित्र) is a comprehensive digital agriculture assistant designed for Indian farmers. It provides real-time crop disease diagnosis, soil health analysis, AI weather advisories, mandi market price comparisons, government scheme recommendations, a production-ready multilingual conversational AI powered by **Sarvam AI (`sarvam-105b`)**, and an in-browser voice calling assistant **"Call Sarvam AI"** powered by **Saaras STT** and **Bulbul TTS**.

---

## 🌟 Key Features

1. **📞 "Call Sarvam AI" (In-Browser Voice Assistant)**:
   - Live interactive voice call with KrishiMitra AI.
   - **Speech-to-Text**: Powered by Sarvam **Saaras (`saaras:v3`)** for accurate Indian accent & vernacular recognition.
   - **Grounded Agricultural Reasoning**: Multilingual RAG connected to verified KrishiMitra crop/disease databases.
   - **AI Brain**: Sarvam **`sarvam-105b`** for multi-turn conversational dialogue.
   - **Text-to-Speech**: Powered by Sarvam **Bulbul (`bulbul:v3`)** for natural Indic speech synthesis with live subtitles.
   - Seamless continuous conversation loop (listen ➔ process ➔ speak ➔ listen).

2. **💬 Multilingual Sarvam AI Chatbot**:
   - Powered by Sarvam AI's flagship `sarvam-105b` multilingual model.
   - Native support across **11 Indian languages**: English, हिन्दी (Hindi), ગુજરાતી (Gujarati), मराठी (Marathi), বাংলা (Bengali), தமிழ் (Tamil), తెలుగు (Telugu), ಕನ್ನಡ (Kannada), മലയാളം (Malayalam), ਪੰਜਾਬੀ (Punjabi), and ଓଡ଼ିଆ (Odia).
   - Robust understanding of native scripts, Romanized Indian languages (e.g. *"meri fasal me keede lag gaye"*, *"cotton ma su rog che?"*), and code-mixed queries.
   - Multi-turn conversation memory and farmer profile context.

3. **🌱 AI Vision Lab**:
   - Real-time crop disease diagnosis & leaf symptom identification.
   - Soil moisture & fertility evaluation.
   - Harvest quality grader & growth monitoring.
   - AI-verified crop damage proof reports for PM Fasal Bima Yojana claims.

4. **🌦 Weather & Advisory Intelligence**:
   - 7-day hyper-local forecasts and AI-generated farm advisories.

5. **💰 Live Mandi APMC Prices**:
   - Comparative rates across nearby APMCs to maximize farmer profits.

6. **🏛 Government Schemes & Subsidies**:
   - Eligibility checks and direct application assistance for central and state schemes.

---

## 🏛 Voice Call Architecture

```
Farmer (Speaks via Microphone)
   │
   ▼
Browser MediaRecorder (Audio Stream)
   │
   ▼ POST /api/voice/call-turn
Express Backend Server (Node.js 18+)
   ├── 1. Sarvam Speech-to-Text (Saaras:v3) ──► Farmer Transcript
   ├── 2. Multilingual RAG Engine ──► Verified Agriculture Facts
   ├── 3. Sarvam Chat (sarvam-105b) ──► Spoken AI Response
   └── 4. Sarvam Text-to-Speech (Bulbul:v3) ──► Base64 Audio
   │
   ▼
Browser HTML5 Audio Player (Speaks AI response to farmer)
   │
   ▼
Automatic Listening for Next Question (Continuous loop until "End Call")
```

---

## ⚙️ Environment Variables Setup

Create a `.env` file in `farmer_ai/` (or copy from `.env.example`):

```bash
# Sarvam AI API Key for Chatbot (sarvam-105b), Saaras STT (saaras:v3), and Bulbul TTS (bulbul:v3)
# Obtain from: https://indus.sarvam.ai/ or https://dashboard.sarvam.ai/
SARVAM_API_KEY=your_sarvam_api_key_here

# Optional model overrides
SARVAM_MODEL=sarvam-105b
SARVAM_STT_MODEL=saaras:v3
SARVAM_TTS_MODEL=bulbul:v3

# Google Gemini API Key (Optional fallback)
GEMINI_API_KEY=your_gemini_api_key_here

# Local Ollama AI Base URL (Default: http://localhost:11434)
OLLAMA_BASE_URL=http://localhost:11434

# Port (Default: 5001)
PORT=5001
```

> 🔒 **Security Notice**: Never commit `.env` or hardcode `SARVAM_API_KEY`. The key is read server-side only and never exposed to the frontend.

---

## 🚀 Quickstart & Local Setup

### 1. Install Backend Dependencies
```bash
cd farmer_ai/backend
npm install
```

### 2. Start the Server
```bash
# Production mode:
npm start

# Development mode (with auto-reload):
npm run dev
```

### 3. Open the Application
Open your browser and navigate to:
```
http://localhost:5001
```

---

## 📡 API Specifications

### 1. Voice Call Turn (`POST /api/voice/call-turn`)
- **Body**: `multipart/form-data` with `file` (audio blob), `language` (e.g. `gu`), `history` (JSON array), `farmerContext` (JSON object).
- **Response**:
  ```json
  {
    "success": true,
    "transcript": "મારી કપાસની ખેતીમાં પાંદડા પીળા થાય છે.",
    "reply": "કપાસમાં પાંદડા પીળા થવાના મુખ્ય કારણો પોષક તત્વોની ઉણપ અથવા પાનનો સુકારો હોઈ શકે છે...",
    "audioBase64": "UklGRiQAAABXQVZFZm10IBAAAAABAAEA...",
    "language": "gu",
    "bcp47": "gu-IN",
    "domains": ["disease", "crop"]
  }
  ```

### 2. Multilingual Text Chat (`POST /api/chat`)
- **Body**: `{ "message": "cotton ma su rog che?", "language": "gu" }`
- **Response**: `{ "success": true, "reply": "...", "source": "sarvam", "model": "sarvam-105b", "language": "gu" }`

---

## 🌐 Supported Languages (11 Indian Languages)

| Language | Script | Code | BCP-47 Code | Example Query |
|---|---|---|---|---|
| **English** | Latin | `en` | `en-IN` | "How do I cure brown spot in rice?" |
| **हिन्दी (Hindi)** | Devanagari | `hi` | `hi-IN` | "मेरी धान की फसल में भूरे धब्बे लग गए हैं, क्या उपाय करें?" |
| **ગુજરાતી (Gujarati)** | Gujarati | `gu` | `gu-IN` | "મારી કપાસની ખેતીમાં પાંદડા પીળા થાય છે, શું કરવું?" |
| **मराठी (Marathi)** | Devanagari | `mr` | `mr-IN` | "माझ्या कापसाच्या पिकावर कीड पडली आहे, उपाय काय?" |
| **বাংলা (Bengali)** | Bengali | `bn` | `bn-IN` | "আমার ধানের পাতায় বাদামী দাগ পড়েছে, প্রতিকার কী?" |
| **தமிழ் (Tamil)** | Tamil | `ta` | `ta-IN` | "நெல் பயிரில் இலைக்கருகல் நோய்க்கு என்ன மருந்து?" |
| **తెలుగు (Telugu)** | Telugu | `te` | `te-IN` | "వరి పంటలో ఆకుమచ్చ తెగులు నివారణ ఎలా?" |
| **ಕನ್ನಡ (Kannada)** | Kannada | `kn` | `kn-IN` | "ಭತ್ತದ ಬೆಳೆಯಲ್ಲಿ ರೋಗ ನಿಯಂತ್ರಣಕ್ಕೆ ಯಾವ ಔಷಧ ಸಿಂಪಡಿಸಬೇಕು?" |
| **മലയാളം (Malayalam)** | Malayalam | `ml` | `ml-IN` | "നെല്ലിലെ ഇലപ്പുള്ളി രോഗത്തിന് എന്ത് മരുന്നാണ് തളിക്കേണ്ടത്?" |
| **ਪੰਜਾਬੀ (Punjabi)** | Gurmukhi | `pa` | `pa-IN` | "ਮੇਰੀ ਕਣਕ ਦੀ ਫਸਲ ਵਿੱਚ ਪੀਲਾ ਰਤੂਆ ਲੱਗ ਗਿਆ ਹੈ, ਕੀ ਕਰੀਏ?" |
| **ଓଡ଼ିଆ (Odia)** | Odia | `or` | `od-IN` | "ଧାନ ଫସଲରେ ରୋଗ ପୋକ ଦାଉରୁ ରକ୍ଷା ପାଇବା ପାଇଁ କଣ କରିବା?" |

---

## 📄 License
MIT License. Developed for Indian Agriculture & KrishiMitra AI.

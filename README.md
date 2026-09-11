# 🌾 KrishiMitra AI (कृषि मित्र) — Multilingual Digital Agriculture Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-blue.svg)](https://nodejs.org/)
[![Sarvam AI](https://img.shields.io/badge/AI-Sarvam_105b-orange.svg)](https://www.sarvam.ai/)
[![TensorFlow.js](https://img.shields.io/badge/ML-TensorFlow.js_v4.17-ff69b4.svg)](https://www.tensorflow.org/js)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline_Vision-brightgreen.svg)](manifest.json)
[![Indic Languages](https://img.shields.io/badge/Languages-11_Indic_Languages-purple.svg)](#-supported-languages-11-indian-languages)

**KrishiMitra AI (कृषि मित्र)** is an AI-powered, production-grade digital agriculture assistant engineered specifically for Indian farmers. It bridges technological gaps by delivering real-time crop disease diagnosis, soil health analysis, hyper-local weather advisories, mandi APMC price tracking, government scheme guidance, and an offline-first browser ML vision laboratory.

The platform features an **in-browser live voice calling assistant** ("Call Sarvam AI") powered by **Sarvam Saaras (`saaras:v3`) STT** and **Bulbul (`bulbul:v3`) TTS**, backed by a multi-tier conversational LLM cascade (**`sarvam-105b`**, Google Gemini, and local Ollama `gemma3`) with multilingual RAG grounding across 11 Indian languages.

---

## 🌟 Key Features & Capabilities

### 1. 📞 "Call Sarvam AI" (In-Browser Live Voice Assistant)
- **Hands-Free Conversational Voice Loop**: Continuous listening, speech parsing, reasoning, and speech playback loop.
- **Speech-to-Text (STT)**: Powered by Sarvam **Saaras (`saaras:v3`)** for accurate Indian accent and vernacular dialect recognition.
- **Grounded Agricultural RAG**: Multilingual retrieval-augmented generation grounded in verified KrishiMitra agronomy databases.
- **Conversational Intelligence**: Sarvam **`sarvam-105b`** flagship model optimized forIndic multi-turn context.
- **Text-to-Speech (TTS)**: Powered by Sarvam **Bulbul (`bulbul:v3`)** for natural, human-like Indic speech synthesis with real-time browser subtitles.

### 2. 💬 Multilingual Conversational AI & RAG
- **Native Support Across 11 Indian Languages**: English, हिन्दी (Hindi), ગુજરાતી (Gujarati), मराठी (Marathi), বাংলা (Bengali), தமிழ் (Tamil), తెలుగు (Telugu), Kannada (ಕನ್ನಡ), മലയാളം (Malayalam), ਪੰਜਾਬੀ (Punjabi), and ଓଡ଼ିଆ (Odia).
- **Vernacular Script & Code-Mixed Understanding**: Native support for Devanagari, Gujarati, Bengali, Dravidian scripts, plus Romanized Indic dialects (*Hinglish*, *Gujlish* e.g., *"meri fasal me keede lag gaye"*, *"cotton ma su rog che?"*).
- **Multi-Tier LLM Cascade**:
  1. **Sarvam AI (`sarvam-105b`)** (Primary Indic LLM)
  2. **Google Gemini (`gemini-3.5-flash`)** (Cloud Fallback)
  3. **Local Ollama (`gemma3`)** (Offline Cloud Fallback)
  4. **Direct Ground-Truth RAG** (Deterministic Fact Output Fallback)

### 3. ⚡ Offline AI Vision Lab (True Browser ML)
- **In-Browser TensorFlow.js Inference**: Runs custom CNN models directly inside the browser using `@tensorflow/tfjs` (v4.17.0) with zero external network calls.
- **Disease & Soil Classifier Parity**: 100% prediction match rate with Python Keras backend models across 22+ plant leaf disease classes and 4+ soil types.
- **Zero Tensor Memory Leaks**: Wrapped execution pipeline inside `tf.tidy()` for clean WebGL memory management.
- **Hybrid Online/Offline Routing**: Automatically routes image diagnosis to local TensorFlow.js engine if backend server or internet is unreachable.

### 4. 🌾 AI Vision Diagnostics & PM Fasal Bima Yojana Claims
- **Crop Disease Diagnosis**: Scans leaf photos for early symptom identification, treatment steps, and organic/chemical remedies.
- **Soil Fertility & Moisture Evaluation**: Classifies soil composition and recommends crop suitability & fertilizer ratios.
- **Crop Damage Certification**: Generates AI-verified crop damage proof reports tailored for **PM Fasal Bima Yojana** insurance claims.

### 5. 🌦 Weather & Advisory Intelligence
- **7-Day Hyper-Local Forecasts**: Temperature, precipitation, humidity, and wind updates with AI-generated crop management advisories.

### 6. 💰 Live Mandi APMC Prices
- Real-time commodity rate comparisons across nearby APMCs to empower farmers during crop sales.

### 7. 🏛 Government Schemes & Subsidies
- Smart eligibility engine for central and state agricultural schemes (PM-KISAN, PMFBY, Soil Health Card, KCC) with step-by-step application guidance.

### 8. 📰 Krishi News & Agronomy Feed
- Curated agricultural news feed with AI summarization and offline Service Worker caching.

---

## 🏛 Architecture & Data Flows

### A. Live Voice Call Architecture ("Call Sarvam AI")

```text
Farmer (Microphone Input)
   │
   ▼
Browser MediaRecorder (Captures Audio Stream)
   │
   ▼ POST /api/voice/call-turn (multipart/form-data)
Express Backend Server (Node.js 18+)
   ├── 1. Sarvam Saaras STT (saaras:v3) ────► Transcribes Vernacular Audio
   ├── 2. Multilingual RAG Engine ──────────► Fetches Ground-Truth Agronomy Facts
   ├── 3. Sarvam Chat (sarvam-105b) ─────────► Synthesizes Spoken AI Response
   └── 4. Sarvam Bulbul TTS (bulbul:v3) ────► Encodes Audio as Base64 WAV
   │
   ▼ Response JSON { transcript, reply, audioBase64, language }
Browser HTML5 Audio Player
   ├── Plays Spoken AI Response
   └── On Playback End ─────────────────────► Automatically Resumes Listening Loop
```

### B. Offline AI Vision Routing Flow

```text
User Selects / Captures Leaf or Soil Photo
   │
   ▼
Browser Client (script.js)
   │
   ├── Try POST /api/vision (Backend Python TensorFlow Server)
   │      │
   │      ├── [Success] ──► Render Python AI Prediction Result
   │      │
   │      └── [Offline / Error / Timeout]
   │             │
   │             ▼
   └── Fallback to Local TensorFlow.js (js/offlineVision.js)
          ├── Load Model Shards from PWA Cache / Static Storage
          ├── Run `tf.tidy()` In-Browser WebGL Matrix Multiply
          └── Render `⚡ True Offline AI (Browser ML)` Diagnostic Result
```

---

## 🌐 Supported Languages (11 Indian Languages)

| Language | Native Name | Script | Code | BCP-47 Code | Example Query |
|:---|:---|:---|:---:|:---:|:---|
| **English** | English | Latin | `en` | `en-IN` | *"How do I cure brown spot in rice?"* |
| **Hindi** | हिन्दी | Devanagari | `hi` | `hi-IN` | *"मेरी धान की फसल में भूरे धब्बे लग गए हैं, क्या उपाय करें?"* |
| **Gujarati** | ગુજરાતી | Gujarati | `gu` | `gu-IN` | *"મારી કપાસની ખેતીમાં પાંદડા પીળા થાય છે, શું કરવું?"* |
| **Marathi** | मराठी | Devanagari | `mr` | `mr-IN` | *"माझ्या कापसाच्या पिकावर कीड पडली आहे, उपाय काय?"* |
| **Bengali** | বাংলা | Bengali | `bn` | `bn-IN` | *"আমার ধানের পাতায় বাদামী দাগ পড়েছে, প্রতিকার কী?"* |
| **Tamil** | தமிழ் | Tamil | `ta` | `ta-IN` | *"நெல் பயிரில் இலைக்கருகல் நோய்க்கு என்ன மருந்து?"* |
| **Telugu** | తెలుగు | Telugu | `te` | `te-IN` | *"వరి పంటలో ఆకుమచ్చ తెగులు నివారణ ఎలా?"* |
| **Kannada** | ಕನ್ನಡ | Kannada | `kn` | `kn-IN` | *"ಭತ್ತದ ಬೆಳೆಯಲ್ಲಿ ರೋಗ ನಿಯಂತ್ರಣಕ್ಕೆ ಯಾವ ಔಷಧ ಸಿಂಪಡಿಸಬೇಕು?"* |
| **Malayalam** | മലയാളം | Malayalam | `ml` | `ml-IN` | *"നെല്ലിലെ ഇലപ്പുള്ളി രോഗത്തിന് എന്ത് മരുന്നാണ് തളിക്കേണ്ടത്?"* |
| **Punjabi** | ਪੰਜਾਬੀ | Gurmukhi | `pa` | `pa-IN` | *"ਮੇਰੀ ਕਣਕ ਦੀ ਫਸਲ ਵਿੱਚ ਪੀਲਾ ਰਤੂਆ ਲੱਗ ਗਿਆ ਹੈ, ਕੀ ਕਰੀਏ?"* |
| **Odia** | ଓଡ଼ିଆ | Odia | `or` | `od-IN` | *"ଧାନ ଫସଲରେ ରୋଗ ପୋକ ଦାଉରୁ ରକ୍ଷା ପାଇବା ପାଇଁ କଣ କରିବା?"* |

---

## 📁 Repository Structure

```text
farmer_ai/
├── backend/
│   ├── middleware/        # CORS, rate limiters, logging, error handling
│   ├── routes/            # Express API routes (chat, voice, vision, weather, schemes, gemini)
│   ├── services/          # RAG engine, Sarvam API, Ollama client, Database search
│   ├── tests/             # Automated test suites (vision, voice extraction)
│   ├── server.js          # Express app entrypoint (Port 5001)
│   └── package.json       # Node.js dependencies
├── ai/
│   ├── browser-models/    # Converted TensorFlow.js model shards (disease & soil)
│   ├── models/            # Keras saved models (.keras)
│   ├── prediction/        # Python prediction scripts & api.py server
│   └── convert_models_to_tfjs.py  # Model conversion script
├── database/              # JSON Knowledge Bases (diseases, crops, soil, fertilizers, etc.)
├── js/
│   ├── lib/               # Local bundled dependencies (tf.min.js - 1.46 MB)
│   ├── api.js             # Frontend HTTP client wrapper
│   ├── gemmaChat.js       # Multilingual chat UI controller
│   ├── offlineVision.js   # Browser TensorFlow.js inference module
│   └── voiceCall.js       # Web Audio MediaRecorder & voice call engine
├── css/                   # Custom CSS modular stylesheets
├── docs/                  # Architecture & API documentation
├── index.html             # Application Web UI
├── manifest.json          # PWA Manifest configuration
├── service-worker.js      # PWA Service Worker for offline asset & model caching
├── script.js              # Application core UI controller
└── style.css              # Main design system stylesheet
```

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the root of `farmer_ai/` (or inside `backend/`):

```bash
# Sarvam AI API Key (Required for sarvam-105b, Saaras STT saaras:v3, Bulbul TTS bulbul:v3)
# Obtain from: https://dashboard.sarvam.ai/
SARVAM_API_KEY=your_sarvam_api_key_here

# Model Configuration (Optional Overrides)
SARVAM_MODEL=sarvam-105b
SARVAM_STT_MODEL=saaras:v3
SARVAM_TTS_MODEL=bulbul:v3

# Google Gemini API Key (Optional Fallback LLM)
GEMINI_API_KEY=your_gemini_api_key_here

# Local Ollama Base URL (Optional Offline Fallback LLM, Default: http://localhost:11434)
OLLAMA_BASE_URL=http://localhost:11434

# Backend Server Port (Default: 5001)
PORT=5001
```

> 🔒 **Security Notice**: Never commit `.env` or expose API keys in frontend code. Keys are accessed exclusively by server-side Express handlers.

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Python** (Optional, for backend Keras vision inference): `v3.10+` with TensorFlow & Flask

### 1. Install Backend Dependencies
```bash
cd farmer_ai/backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and insert your `SARVAM_API_KEY`:
```bash
cp .env.example .env
```

### 3. Launch the Backend Server
```bash
# Development mode (with auto-reload):
npm run dev

# Production mode:
npm start
```

### 4. Access the Application
Open your web browser and navigate to:
```
http://localhost:5001
```

---

## 📡 Key API Endpoints

### 1. Voice Call Turn (`POST /api/voice/call-turn`)
- **Headers**: `Content-Type: multipart/form-data`
- **Body**: `file` (audio blob), `language` (e.g. `gu`), `history` (JSON string), `farmerContext` (JSON string).
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

### 2. Multilingual Chat (`POST /api/chat`)
- **Body**: `{ "message": "cotton ma su rog che?", "language": "gu" }`
- **Response**:
  ```json
  {
    "success": true,
    "reply": "...",
    "source": "sarvam",
    "model": "sarvam-105b",
    "language": "gu",
    "inferenceMs": 420
  }
  ```

### 3. Crop & Soil Vision Diagnosis (`POST /api/vision`)
- **Headers**: `Content-Type: multipart/form-data`
- **Body**: `image` (JPEG/PNG file), `type` (`disease` or `soil`)
- **Response**: Returns diagnosis class, confidence score, treatment recommendations, and PMFBY claim proof metadata.

---

## 🧪 Testing & Verification

Run the automated backend test suites to verify offline vision capabilities and voice response extraction:

```bash
# Run Offline Vision Test Suite (Verifies browser ML fallback logic & routes):
node backend/tests/test_offline_vision.test.js

# Run Voice Text Extraction Test Suite (Verifies Sarvam response parsing):
node backend/tests/test_voice_text_extraction.test.js
```

To run the Python-to-TFJS 20+ image prediction parity test suite:
```bash
python ai/test_prediction_parity_20.py
```

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute for agricultural technology innovation.

Developed with ❤️ for Indian Agriculture & KrishiMitra AI.

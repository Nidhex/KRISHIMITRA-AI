# 🌾 KrishiMitra AI (कृषि मित्र) — Complete Technical & Architectural Summary

> **Purpose**: This document provides an exhaustive, production-grade summary of the entire **KrishiMitra AI** project. You can copy and paste this document directly into any AI model (GPT-4o, Claude 3.5 Sonnet, Gemini 1.5/3, DeepSeek, etc.) to give it 100% context on the project's architecture, tech stack, API specifications, data flows, directory structure, and functional workflows.

---

## 🚀 1. Executive Summary

**KrishiMitra AI (कृषि मित्र)** is a production-ready, multilingual digital agricultural platform designed specifically for Indian farmers. It provides end-to-end AI-assisted farming services, including:
1. **In-browser live voice calling** ("Call Sarvam AI") using Indic Speech-to-Text and Text-to-Speech models.
2. **Multilingual conversational AI** across **11 Indian languages** (supporting native scripts, Romanized Indian languages like *Hinglish* or *Gujlish*, and code-mixed queries).
3. **AI Vision Lab** for crop disease identification, leaf symptom scanning, soil health evaluation, and PM Fasal Bima Yojana crop damage claim proof reports.
4. **Hyper-local weather forecasting & AI crop advisories**.
5. **Live APMC Mandi market price comparison**.
6. **Government scheme eligibility evaluation & application guidance**.
7. **Krishi News Feed** with AI summaries and offline caching.

---

## 🛠️ 2. Tech Stack & Dependencies

### **Frontend**
- **Core Stack**: Vanilla HTML5, CSS3, ES6 JavaScript (No heavyweight framework, high speed & minimal bundle overhead).
- **Audio Processing**: HTML5 Web Audio API, `MediaRecorder` API, ArrayBuffer / Base64 audio decoding for continuous voice calls.
- **Styling & UI**: Custom CSS3 design system with responsive layouts, CSS variables, dark mode styling, and dynamic CSS transitions.

### **Backend**
- **Runtime**: Node.js (v18+) with Express.js backend server (`http://localhost:5001` or `5000`).
- **File Uploads & Middleware**: `multer` (for audio blob & image uploads), `cors`, `dotenv`.
- **Inference Integration**: `child_process.spawn` for executing local Python TensorFlow model scripts.

### **AI Infrastructure & Models**
- **Sarvam AI (Primary AI Engine for Indic Languages)**:
  - **Chat LLM**: `sarvam-105b` via Sarvam Chat Completions API (`https://api.sarvam.ai/v1/chat/completions`).
  - **Speech-to-Text (STT)**: Sarvam **Saaras (`saaras:v3`)** via `https://api.sarvam.ai/speech-to-text`.
  - **Text-to-Speech (TTS)**: Sarvam **Bulbul (`bulbul:v3`)** via `https://api.sarvam.ai/text-to-speech`.
- **Google Gemini API (Fallback Chat LLM)**: `gemini-3.5-flash` / `gemini-1.5-flash` for cloud fallback.
- **Local Ollama AI (Offline Fallback Chat LLM)**: `gemma3` model running via local Ollama instance (`http://localhost:11434`).
- **Custom Vision Models (TensorFlow / Keras in Python)**:
  - Custom CNN models for crop disease classification & soil type evaluation (`ai/prediction/predictor.py`, `ai/prediction/soil_predictor.py`).

---

## 🏛️ 3. System Architecture & Workflows

### **A. Voice Call Turn Architecture ("Call Sarvam AI")**

```
Farmer (Microphone Input)
   │
   ▼
Browser MediaRecorder (Captures Audio Stream)
   │
   ▼ POST /api/voice/call-turn (multipart/form-data)
Express Backend Server (Node.js)
   ├── 1. Sarvam Saaras STT (saaras:v3) ──► Farmer Transcript (e.g., Gujarati / Hindi / English)
   ├── 2. Multilingual RAG Engine ──► Fetch Verified Agricultural Ground Truth Facts
   ├── 3. Sarvam Chat (sarvam-105b) ──► Generate Concise Spoken AI Response (< 80 words)
   └── 4. Sarvam Bulbul TTS (bulbul:v3) ──► Synthesize Indic Audio (Base64 WAV)
   │
   ▼ Response JSON { transcript, reply, audioBase64, language }
Browser HTML5 Audio Player
   ├── Plays AI spoken response automatically
   └── On playback end: Restarts MediaRecorder for continuous multi-turn call loop
```

### **B. Multilingual RAG (Retrieval-Augmented Generation) Pipeline**

```
User Query (e.g., "meri fasal me keede lag gaye" / "મારી કપાસની ખેતીમાં પાંદડા પીળા થાય છે")
   │
   ▼
Language & Script Detector
   ├── Script Unicode Analysis (Devanagari, Gujarati, Bengali, Tamil, Telugu, Kannada, Malayalam, etc.)
   └── Transliteration Heuristics (Detects Romanized Hinglish/Gujlish)
   │
   ▼
Semantic Synonym Expander
   └── Translates Indian vernacular terms (e.g., "कपास" / "કપાસ" ➔ "cotton", "पीले" ➔ "yellow")
   │
   ▼
Domain Trigger Router & Local DB Search
   ├── Search across Disease, Crop, Soil, Fertilizer, Pesticide, Mandi, Weather, and Scheme JSON DBs
   └── Extract top match records & format into factual context string
   │
   ▼
LLM System Prompt Construction
   └── Injects language-specific instructions + farmer profile context + grounded facts ➔ Sent to `sarvam-105b`
```

---

## 🌐 4. Supported Languages Matrix (11 Indian Languages)

| Language | Native Name | Code | BCP-47 Code | Script | Sample User Query |
|---|---|---|---|---|---|
| **English** | English | `en` | `en-IN` | Latin | *"How do I cure brown spot in rice?"* |
| **Hindi** | हिन्दी | `hi` | `hi-IN` | Devanagari | *"मेरी धान की फसल में भूरे धब्बे लग गए हैं, क्या उपाय करें?"* |
| **Gujarati** | ગુજરાતી | `gu` | `gu-IN` | Gujarati | *"મારી કપાસની ખેતીમાં પાંદડા પીળા થાય છે, શું કરવું?"* |
| **Marathi** | मराठी | `mr` | `mr-IN` | Devanagari | *"माझ्या कापसाच्या पिकावर कीड पडली आहे, उपाय काय?"* |
| **Bengali** | বাংলা | `bn` | `bn-IN` | Bengali | *"আমার ধানের পাতায় বাদামী দাগ পড়েছে, প্রতিকার কী?"* |
| **Tamil** | தமிழ் | `ta` | `ta-IN` | Tamil | *"நெல் பயிரில் இலைக்கருகல் நோய்க்கு என்ன மருந்து?"* |
| **Telugu** | తెలుగు | `te` | `te-IN` | Telugu | *"వరి పంటలో ఆకుమచ్చ తెగులు నివారణ ఎలా?"* |
| **Kannada** | ಕನ್ನಡ | `kn` | `kn-IN` | Kannada | *"ಭತ್ತದ ಬೆಳೆಯಲ್ಲಿ ರೋಗ ನಿಯಂತ್ರಣಕ್ಕೆ ಯಾವ ಔಷಧ ಸಿಂಪಡಿಸಬೇಕು?"* |
| **Malayalam** | മലയാളം | `ml` | `ml-IN` | Malayalam | *"നെല്ലിലെ ഇലപ്പുള്ളി രോഗത്തിന് എന്ത് മരുന്നാണ് തളിക്കേണ്ടത്?"* |
| **Punjabi** | ਪੰਜਾਬੀ | `pa` | `pa-IN` | Gurmukhi | *"ਮੇਰੀ ਕਣਕ ਦੀ ਫਸਲ ਵਿੱਚ ਪੀਲਾ ਰਤੂਆ ਲੱਗ ਗਿਆ ਹੈ, ਕੀ ਕਰੀਏ?"* |
| **Odia** | ଓଡ଼ିଆ | `or` | `od-IN` | Odia | *"ଧାନ ଫସଲରେ ରୋଗ ପୋକ ଦାଉରୁ ରକ୍ଷା ପାଇବା ପାଇଁ କଣ କରିବା?"* |

---

## 📁 5. Directory Structure & Key Files

```
farmer_ai/
├── backend/                        # Node.js Express Backend
│   ├── cache/                      # Runtime cache directory
│   ├── logs/                       # Server log files
│   ├── middleware/
│   │   ├── errorHandler.js         # Centralized API error handling middleware
│   │   └── logger.js               # Request logging middleware
│   ├── routes/
│   │   ├── chat.js                 # POST /api/chat route (Sarvam / Gemini / Ollama fallback)
│   │   ├── gemini.js               # Direct Gemini route fallback
│   │   ├── schemes.js              # Government schemes query endpoint
│   │   ├── vision.js               # POST /api/vision image upload route
│   │   ├── voice.js                # POST /api/voice/call-turn & speech endpoints
│   │   └── weather.js              # Weather data & AI advisory route
│   ├── services/
│   │   ├── databaseService.js      # Local JSON database search engine
│   │   ├── ollamaService.js        # Local Ollama (gemma3) integration
│   │   ├── ragService.js           # Multilingual RAG, script detector, & synonym expander
│   │   ├── sarvamService.js        # Sarvam Chat Completions (sarvam-105b) client
│   │   ├── sarvamVoiceService.js   # Saaras STT & Bulbul TTS voice call turn handler
│   │   └── visionService.js        # TensorFlow Python spawn wrapper for image inference
│   ├── uploads/                    # Uploaded images & audio files
│   ├── package.json                # Express, Multer, Cors, Dotenv dependencies
│   ├── server.js                   # Express server entry point (Port 5001)
│   ├── test_chat_integration.js    # Integration test suite for Chat API
│   ├── test_server_endpoints.js   # Integration test suite for Server endpoints
│   └── test_voice_service.js       # Integration test suite for Sarvam Voice API
├── js/                             # Frontend JavaScript Modules
│   ├── api.js                      # Central HTTP client for backend API calls
│   ├── config.js                   # Frontend configuration & endpoint definitions
│   ├── feed.js                     # Krishi News Feed controller & categorised tabs
│   ├── feedService.js              # News API fetcher & summarizer
│   ├── gemmaChat.js                # Chat UI logic, history management & DOM rendering
│   ├── newsAI.js                   # News processing & topic tagging
│   ├── newsCache.js                # News article caching layer (LocalStorage + Server sync)
│   └── sarvamCall.js               # "Call Sarvam AI" Web Audio recorder & call controller
├── database/                       # Local Knowledge Store (JSON DBs)
│   ├── crops/                      # Crop cultivation data
│   ├── diseases/                   # Plant diseases, symptoms, organic & chemical remedies
│   ├── faq/                        # Agricultural FAQs
│   ├── fertilizers/                # Fertilizer dosage & soil nutrient guides
│   ├── mandi/                      # Mandi market prices & APMC lists
│   ├── news/                       # Cached news articles JSON (`news_cache.json`)
│   ├── pesticides/                 # Approved pesticides & safety rules
│   ├── schemes/                    # PM-KISAN, PM Fasal Bima, KUSUM scheme facts
│   ├── soil/                       # Soil types & characteristics
│   └── weather/                    # Historical/mock weather advisory facts
├── ai/                             # Python Machine Learning Subsystem
│   ├── prediction/
│   │   ├── api.py                  # CLI API entry point for vision inference
│   │   ├── predictor.py            # Crop disease TensorFlow classifier
│   │   └── soil_predictor.py       # Soil type TensorFlow classifier
│   └── training/                   # Model training scripts (`train_soil.py`, etc.)
├── css/                            # Modular styles
├── index.html                      # Single Page Web Application main interface
├── script.js                       # Main application JS (navigation, sliders, calculators)
├── style.css                       # Primary stylesheet & UI design system
├── weatherService.js               # Weather API client
├── weatherAIService.js             # Weather advisory AI prompt generator
├── .env.example                    # Environment variable template
└── README.md                       # High-level project documentation
```

---

## 📡 6. Core API Endpoint Contracts

### **1. Voice Call Turn (`POST /api/voice/call-turn`)**
- **Request Type**: `multipart/form-data`
- **Fields**:
  - `file`: Audio Blob (WebM / WAV / MP4 recorded from browser microphone)
  - `language`: Target language ISO code (e.g. `gu`, `hi`, `en`)
  - `history`: JSON array of previous chat turns `[{ role: "user", content: "..." }, ...]`
  - `farmerContext`: Optional JSON object `{ name, location, soilType, primaryCrop }`
- **Response Format**:
  ```json
  {
    "success": true,
    "transcript": "મારી કપાસની ખેતીમાં પાંદડા પીળા થાય છે.",
    "reply": "કપાસમાં પાંદડા પીળા થવાના મુખ્ય કારણો પોષક તત્વોની ઉણપ અથવા ચોક્કસ રોગ હોઈ શકે છે...",
    "audioBase64": "UklGRiQAAABXQVZFZm10IBAAAAABAAEA...",
    "language": "gu",
    "bcp47": "gu-IN",
    "domains": ["disease", "crop"],
    "docCount": 4,
    "timings": { "sttMs": 420, "ragMs": 15, "chatMs": 1100, "ttsMs": 550, "totalMs": 2085 }
  }
  ```

### **2. Multilingual Chat (`POST /api/chat`)**
- **Request Body**:
  ```json
  {
    "message": "cotton ma su rog che?",
    "language": "gu",
    "farmerContext": { "primaryCrop": "cotton" }
  }
  ```
- **Response Format**:
  ```json
  {
    "success": true,
    "reply": "કપાસના પાકમાં પત્તાં પીળા થવા કે સુકાવવાના મુખ્ય રોગો નીચે મુજબ છે...",
    "source": "sarvam",
    "model": "sarvam-105b",
    "language": "gu"
  }
  ```

### **3. AI Vision Analysis (`POST /api/vision`)**
- **Request Type**: `multipart/form-data`
- **Fields**: `image` (File), `module` (`"disease"` or `"soil"`)
- **Response Format**:
  ```json
  {
    "success": true,
    "disease": "Cotton Leaf Curl Virus",
    "confidence": 0.94,
    "probabilities": { "Cotton Leaf Curl Virus": 0.94, "Healthy": 0.04, "Blight": 0.02 },
    "imagePath": "/uploads/scan_1725612345.jpg"
  }
  ```

### **4. News Feed Cache (`GET /api/feed/cache` & `POST /api/feed/cache`)**
- **GET**: Serves cached agricultural news articles from `database/news/news_cache.json` with `Cache-Control: no-cache`.
- **POST**: Accepts `{ articles: [...] }`, merges unique articles by ID/headline, caps at 500 items, and updates disk cache.

---

## ⚙️ 7. Environment Variables & Setup

### **`.env` Configuration File** (`farmer_ai/.env`):
```bash
# Sarvam AI API Key (Required for sarvam-105b Chat, Saaras STT, and Bulbul TTS)
SARVAM_API_KEY=your_sarvam_api_key_here

# Model Overrides (Optional)
SARVAM_MODEL=sarvam-105b
SARVAM_STT_MODEL=saaras:v3
SARVAM_TTS_MODEL=bulbul:v3

# Google Gemini API Key (Optional Fallback)
GEMINI_API_KEY=your_gemini_api_key_here

# Local Ollama Base URL (Optional Offline Fallback)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3

# Express Server Port
PORT=5001
```

### **Quickstart Commands**:
```bash
# 1. Navigate to backend
cd farmer_ai/backend

# 2. Install dependencies
npm install

# 3. Start server
npm start          # Production
npm run dev        # Development mode with nodemon

# 4. Access Application
# Browser: http://localhost:5001
```

---

## 💡 8. Key Design Rationale & Standout Features

1. **Zero External Frontend Framework Lock-in**: Built with Vanilla JS & HTML5 to guarantee instant load times and lightweight execution on low-bandwidth rural mobile devices.
2. **Server-Side API Key Protection**: All Sarvam AI & Gemini API calls are strictlyProxied through Express backend services; API keys are never exposed in browser Network tabs.
3. **Resilient Failover Cascade**: If Sarvam AI API is unavailable, the backend automatically fails over: `Sarvam AI (sarvam-105b)` ➔ `Google Gemini` ➔ `Local Ollama (gemma3)` ➔ `Direct Ground-Truth RAG Knowledge`.
4. **Natural Indic Voice Subtitles & Audio Loop**: The browser "Call Sarvam AI" assistant decodes Base64 WAV chunks dynamically and automatically re-activates microphone recording upon AI utterance completion, creating a hands-free continuous conversation experience for farmers.

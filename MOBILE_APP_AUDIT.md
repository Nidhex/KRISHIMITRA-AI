# KRISHIMITRA AI — COMPLETE READ-ONLY MOBILE APP AUDIT & ARCHITECTURE BLUEPRINT

**Project**: KrishiMitra AI (`farmer_ai`)  
**Audit Date**: September 12, 2026  
**Auditor**: Senior Mobile AI / Systems Architect  
**Purpose**: Prepare full specifications for a React Native + Expo mobile application reusing the existing Node.js backend (`backend/`) and offline knowledge database.

---

## 1. PROJECT STRUCTURE AUDIT

The repository consists of a dual-layer architecture: a browser PWA frontend (`index.html`, `script.js`, `js/`), a Node.js + Express backend (`backend/`), an AI/ML training & browser model pipeline (`ai/`), and a local agricultural knowledge database (`database/`).

```
farmer_ai/
├── .env                       # Backend & API configuration
├── .env.example               # Environment template
├── index.html                 # Main PWA Web UI App shell (1160+ lines)
├── script.js                  # Frontend state, navigation, i18n & tab handlers
├── style.css                  # Custom CSS design system (cards, buttons, typography)
├── manifest.json              # Web App PWA Manifest
├── service-worker.js          # Service Worker for browser PWA caching
├── schemes.json               # Legacy schemes static cache
├── weatherService.js          # Client-side weather API wrapper
├── weatherAIService.js        # Client-side weather AI advisory generator
├── ai/                        # Vision AI Models & Conversion Pipelines
│   ├── browser-models/        # TF.js web models (Float32 binary shards)
│   │   ├── disease/           # Plant Disease TF.js model (model.json + 3 shards)
│   │   └── soil/              # Soil Classifier TF.js model (model.json + 3 shards)
│   ├── models/                # Source Keras models (.keras / .h5) & label mappings
│   ├── convert_models_to_tfjs.py # Python TF.js converter script
│   └── parity_test_data/      # Test image datasets (22 disease, 22 soil)
├── backend/                   # Node.js + Express API Server (Port 5000)
│   ├── server.js              # Server entry point, middleware & health endpoint
│   ├── routes/                # Express API Route Handlers
│   │   ├── chat.js            # /api/chat (Sarvam -> Gemini -> Ollama -> RAG)
│   │   ├── voice.js           # /api/voice (Call-turn, Transcribe, Synthesize)
│   │   ├── vision.js          # /api/vision (Multipart image analysis)
│   │   ├── weather.js         # /api/weather (Weather forecast & advisory)
│   │   ├── schemes.js         # /api/schemes (Government schemes search)
│   │   └── gemini.js          # /api/gemini/generateContent (Gemini Proxy/Fallback)
│   ├── services/              # Business Logic & External API Integrations
│   │   ├── databaseService.js # Database reader for 11 JSON domains
│   │   ├── ragService.js      # Server-side Multilingual RAG engine
│   │   ├── sarvamService.js   # Sarvam AI text chat service (sarvam-105b)
│   │   ├── sarvamVoiceService.js # Saaras STT & Bulbul TTS integrations
│   │   ├── ollamaService.js   # Dev-only Gemma 3 Ollama fallback
│   │   ├── visionService.js   # Keras Python/TF model invocation
│   │   └── textExtractionService.js # Output sanitizer & prompt leak guard
│   └── middleware/            # Logging, Rate Limiting, Error Handling
├── database/                  # Source-of-Truth Knowledge Base (317 Structured Records)
│   ├── crops/crops.json       # 32 Crop profiles
│   ├── diseases/diseases.json # 64 Disease records
│   ├── pests/pests.json       # 32 Insect & pest records
│   ├── soil/soil.json         # 26 Soil types & soil management
│   ├── fertilizers/fertilizers.json # 32 Nutrient & fertilizer records
│   ├── irrigation/irrigation.json # 23 Water management records
│   ├── schemes/schemes.json   # 20 Government scheme profiles
│   ├── weather/weather.json   # 20 Climate & weather advisories
│   ├── mandi/mandi.json       # 10 Mandi market records
│   ├── pesticides/pesticides.json # 5 Pesticide safety guidelines
│   ├── news/news_cache.json   # Cached news feed articles
│   └── faq/faq.json           # 53 Multi-lingual Q&As
├── js/                        # Web Client Modules
│   ├── api.js                 # Web API client wrapper (`KrishiMitraAPI`)
│   ├── gemmaChat.js           # Hybrid chat controller (Online backend / Offline RAG)
│   ├── offlineRAG.js          # Client-side JavaScript RAG engine
│   ├── offlineVision.js       # Client-side TF.js disease & soil inference
│   ├── offline-knowledge.json # Bundled JSON knowledge database (545 KB)
│   ├── offline-knowledge-bundle.js # Window bundle for offline RAG
│   ├── offlineStatus.js       # Web online/offline event listeners
│   ├── offlineStorage.js      # IndexedDB / localStorage wrappers
│   ├── sarvamCall.js          # Duplex web voice call turn manager
│   ├── feed.js & feedService.js # Agricultural news feed manager
│   └── lib/tf.min.js          # Local TensorFlow.js browser library (v4.22.0)
└── tests/                     # Automated Test Suites (100% Pass Rate)
```

---

## 2. FEATURE INVENTORY

| Feature | Current Web Implementation | Relevant Frontend Files | Relevant Backend Route | Relevant Backend Service | Required API Endpoint | Needs Internet? | Has Offline Support? | Reusable in Mobile? | Native Mobile API Required |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **Home Dashboard** | Web tab grid (`#view-home`) with quick action buttons & profile badge | `index.html`, `script.js` | N/A | N/A | N/A | No | Yes | Conceptually | No |
| **AI Chat (Online)** | Multi-turn text chat with streaming & memory window | `index.html`, `js/gemmaChat.js`, `js/api.js` | `backend/routes/chat.js` | `sarvamService`, `ragService`, `textExtractionService` | `POST /api/chat` | Yes | Falls back to offline RAG | Yes | Keyboard, Clipboard |
| **AI Chat (Offline)** | Browser-local client RAG using `offline-knowledge.json` | `js/gemmaChat.js`, `js/offlineRAG.js`, `js/offline-knowledge-bundle.js` | None (Client-side) | None | None | No | Yes (100%) | Yes (RN JavaScript engine) | AsyncStorage / FileSystem |
| **Voice Assistant** | Single-shot STT/TTS voice question | `js/voiceAssistant.js`, `script.js` | `backend/routes/voice.js` | `sarvamVoiceService` | `POST /api/voice/transcribe`, `POST /api/voice/synthesize` | Yes | Browser SpeechSynth fallback | Yes | Expo Audio / Microphone |
| **Live Voice Call** | Full-duplex voice turn conversation (`Call Sarvam AI`) | `js/sarvamCall.js`, `index.html` | `backend/routes/voice.js` | `sarvamVoiceService` | `POST /api/voice/call-turn` | Yes | No | Yes | Expo Audio Recording / Player |
| **Crop Disease Vision** | Upload or capture crop photo for disease diagnosis | `js/offlineVision.js`, `js/api.js`, `script.js` | `backend/routes/vision.js` | `visionService` | `POST /api/vision` | Optional | Yes (TF.js / local model) | Yes | Expo Camera / ImagePicker |
| **Soil Test Vision** | Upload or capture soil photo for type & pH analysis | `js/offlineVision.js`, `js/api.js`, `script.js` | `backend/routes/vision.js` | `visionService` | `POST /api/vision` | Optional | Yes (TF.js / local model) | Yes | Expo Camera / ImagePicker |
| **Weather Forecast** | 7-day weather forecast & AI agricultural advisory | `weatherService.js`, `weatherAIService.js`, `js/api.js` | `backend/routes/weather.js` | `ragService` | `POST /api/weather` | Yes | Static Offline Weather Advisory | Yes | Expo Location (GPS) |
| **Mandi Prices** | Crop price comparison & market rates | `index.html`, `script.js` | N/A (Static DB query) | `databaseService` | Via chat/RAG | Optional | Yes (Mandi database) | Yes | No |
| **Govt Schemes** | Scheme listing, state filtering, eligibility & AI summary | `index.html`, `script.js`, `js/api.js` | `backend/routes/schemes.js` | `databaseService`, `ragService` | `POST /api/schemes` | Optional | Yes (Schemes database) | Yes | WebBrowser / External link |
| **News / Agri Feed** | RSS / News API agricultural news feed with category tabs | `js/feed.js`, `js/feedService.js`, `js/newsCache.js` | `backend/server.js` | N/A | `GET /api/feed/cache`, `POST /api/feed/cache` | Yes | Yes (Cached articles) | Yes | WebBrowser |
| **Farmer Profile** | Local profile storage (Name, Village, Crops, Land size, Language) | `index.html`, `script.js`, `js/offlineStorage.js` | N/A | N/A | N/A | No | Yes | Yes | AsyncStorage |
| **Multilingual (11 Langs)** | Dynamic UI text translation & language switcher | `index.html`, `script.js` | N/A | `ragService` | N/A | No | Yes | Yes | Expo Localization / i18n |
| **Network Status** | Automatic online/offline transition detection | `js/offlineStatus.js` | `backend/server.js` | N/A | `GET /api/health` | No | Yes | Yes | NetInfo (`@react-native-community/netinfo`) |

---

## 3. BACKEND API CONTRACT

The mobile application must reuse the existing backend deployed on Render (`http://localhost:5000` or production URL).

### A. Endpoint Summary

#### 1. Health Check — `GET /api/health`
- **Method**: `GET`
- **Headers**: None
- **Response**:
  ```json
  {
    "status": "running",
    "version": "1.0.0",
    "model": "gemma3",
    "ollamaUrl": "http://localhost:11434",
    "timestamp": "2026-09-12T21:38:35.000Z"
  }
  ```
- **Mobile Client Support**: Fully supported.
- **CORS Restrictions**: `cors({ origin: '*' })` configured on Express backend.

#### 2. AI Multilingual Chat — `POST /api/chat`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "message": "gehu me pattiyan peeli kyu ho rahi hain?",
    "language": "hi",
    "history": [
      {"role": "user", "content": "Namaste"},
      {"role": "assistant", "content": "नमस्ते! मैं आपकी क्या सहायता कर सकता हूँ?"}
    ],
    "farmerContext": {
      "name": "Ramesh Prasad",
      "location": "Kishanpur, UP",
      "crops": ["Wheat", "Paddy"]
    },
    "context": ""
  }
  ```
- **Response Structure (200 OK)**:
  ```json
  {
    "success": true,
    "reply": "गेहूं की पत्तियां पीली होने के मुख्य कारण निम्नलिखित हैं...",
    "source": "sarvam",
    "model": "sarvam-105b",
    "language": "hi",
    "inferenceMs": 420,
    "totalMs": 435,
    "domains": ["crop", "disease"],
    "docCount": 4,
    "keywords": ["gehu", "peeli", "pattiyan"]
  }
  ```
- **Error Response (400 / 503)**:
  ```json
  {
    "success": false,
    "error": "Message is required and must be a non-empty string.",
    "userError": "Please type a question before sending.",
    "errorCode": "MISSING_MESSAGE"
  }
  ```

#### 3. Voice Call Turn (STT + LLM + TTS) — `POST /api/voice/call-turn`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data` OR `application/json` (with base64)
- **Multipart Form Data**:
  - `file`: Audio file binary (WebM, WAV, MP4, AAC)
  - `language`: `hi`, `en`, `gu`, `mr`, etc.
  - `history`: Stringified JSON array `[{"role":"user","content":"..."},...]`
  - `farmerContext`: Stringified JSON object
  - `browserTranscript`: Optional client STT fallback string
- **Base64 JSON Body Alternative**:
  ```json
  {
    "audioBase64": "<base64_string>",
    "mimeType": "audio/m4a",
    "language": "hi",
    "history": [],
    "farmerContext": {}
  }
  ```
- **Response Structure (200 OK)**:
  ```json
  {
    "success": true,
    "userTranscript": "गेहूं की बोआई कब करें?",
    "replyText": "गेहूं की बोआई के लिए उपयुक्त समय 15 नवंबर से 25 नवंबर तक है।",
    "audioBase64": "<base64_wav_audio_string>",
    "mimeType": "audio/wav",
    "language": "hi",
    "detectedLanguage": "hi",
    "durationMs": 850
  }
  ```

#### 4. Standalone Voice STT — `POST /api/voice/transcribe`
- **Method**: `POST` (`multipart/form-data`)
- **Params**: `file` (audio binary), `language` (optional)
- **Response**: `{ "success": true, "transcript": "...", "languageCode": "hi", "durationMs": 320 }`

#### 5. Standalone Voice TTS — `POST /api/voice/synthesize`
- **Method**: `POST` (`application/json`)
- **Request Body**: `{ "text": "...", "language_code": "hi-IN", "speaker": "shubh", "pace": 0.95 }`
- **Response**: `{ "success": true, "audioBase64": "...", "format": "wav", "durationMs": 410 }`

#### 6. Vision Scan — `POST /api/vision`
- **Method**: `POST` (`multipart/form-data`)
- **Multipart Form Data**:
  - `image`: Image file binary (JPEG, PNG, WEBP)
  - `module`: `"disease"` or `"soil"`
- **Response Structure (200 OK)**:
  ```json
  {
    "success": true,
    "disease": {
      "disease_name": "Tomato___Late_blight",
      "disease_name_hi": "टमाटर का पछेती झुलसा रोग",
      "confidence": 0.942,
      "symptoms": "पत्तियों पर गहरे भूरे रंग के धब्बे...",
      "organic_treatment": ["नीम के तेल का छिड़काव"],
      "chemical_treatment": ["मैनकोज़ेब 75% WP @ 2g/L water"]
    },
    "soil": null,
    "confidence": 0.942,
    "probabilities": {"Tomato___Late_blight": 0.942, "Tomato___healthy": 0.031},
    "imagePath": "/uploads/scan_1726174800.jpg"
  }
  ```

#### 7. Weather Advisory — `POST /api/weather`
- **Method**: `POST` (`application/json`)
- **Request Body**: `{ "location": "Kishanpur, UP", "language": "hi", "useAI": true }`
- **Response Structure**:
  ```json
  {
    "success": true,
    "weather": {
      "location": "Kishanpur, UP",
      "today": { "condition": "Light Rain", "tempC": 28, "humidity": "82%", "rainChance": "80%", "emoji": "🌧" },
      "forecast": [...],
      "advisory": "कल भारी बारिश की संभावना है। आज कीटनाशक का छिड़काव न करें।",
      "source": "rag"
    }
  }
  ```

#### 8. Government Schemes — `POST /api/schemes` & `GET /api/schemes`
- **Method**: `POST` or `GET` (`application/json`)
- **Request Body**: `{ "query": "PM-KISAN", "state": "UP", "language": "hi", "useAI": true }`
- **Response Structure**:
  ```json
  {
    "success": true,
    "schemes": [
      {
        "id": "pm_kisan",
        "title": "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
        "description": "Financial assistance of ₹6,000 per year...",
        "eligibility": "Small and marginal farmer families",
        "benefit": "₹6,000 per year in 3 equal installments",
        "applyAt": "pmkisan.gov.in"
      }
    ],
    "total": 1,
    "summary": "PM-KISAN योजना भारत सरकार की एक प्रमुख योजना है...",
    "source": "rag"
  }
  ```

#### 9. Feed Cache — `GET /api/feed/cache` & `POST /api/feed/cache`
- **Method**: `GET` / `POST` (`application/json`)
- **Response**: `{ "success": true, "articles": [...] }`

---

## 4. VISION AUDIT

### Current Keras Models (Source of Truth — LOCKED)
1. **Plant Disease Model**: `ai/models/plant_disease_model.keras` (9.7 MB, 15 classes, MobileNetV2 architecture).
2. **Soil Classifier Model**: `ai/models/soil_classifier_v4.keras` (23.5 MB, 7 classes, EfficientNet/MobileNet architecture).

### Browser TF.js Models (Float32 Binary Alignment)
- `ai/browser-models/disease/model.json` + 3 `.bin` shards (4.19MB, 4.19MB, 544KB).
- `ai/browser-models/soil/model.json` + 3 `.bin` shards (4.19MB, 4.19MB, 503KB).
- All binary shards are byte-aligned to exact multiples of 4 bytes for float32 array buffer loading.

### Preprocessing & Input Dimensions
- **Input Resolution**: `224 x 224 x 3` (RGB normalized Float32 array).
- **Normalization**: Pixel values divided by `255.0` (`[0, 1]` range).

### Mobile Integration Strategy
- **Online Mode**: The React Native app captures image using `expo-camera` or `expo-image-picker` and sends a `multipart/form-data` POST request to `/api/vision`. This requires zero client-side model execution and returns instantaneous verified results.
- **Offline Mode**:
  - React Native can load TF.js browser models using `@tensorflow/tfjs` and `@tensorflow/tfjs-react-native` with `bundleResourceIO` or local Expo `FileSystem`.
  - Alternatively, ONNX / TFLite converted versions can be executed via `react-native-fast-tflite` for hardware-accelerated local execution.

---

## 5. OFFLINE CAPABILITY AUDIT

### Web PWA vs. Mobile React Native Offline Architecture

| Component | Web PWA Architecture | Recommended React Native Architecture |
| :--- | :--- | :--- |
| **App Shell** | Service Worker (`service-worker.js`) | Native pre-compiled JS bundle via Expo |
| **Knowledge Storage** | `js/offline-knowledge-bundle.js` / JSON | Local JSON file loaded via `require('./assets/offline-knowledge.json')` |
| **Search Index** | Pre-computed in JS memory (`offlineRAG.js`) | Reused `offlineRAG.js` business logic executed inside React Native JavaScript runtime |
| **Cache Storage** | Browser `CacheStorage` & `IndexedDB` | `@react-native-async-storage/async-storage` & `expo-file-system` |
| **Network Detection** | `navigator.onLine` & `online`/`offline` window events | `@react-native-community/netinfo` event listener |
| **Offline Vision** | `js/offlineVision.js` using web `tf.min.js` | Online API fallback or `@tensorflow/tfjs-react-native` local loading |

---

## 6. MULTILINGUAL AUDIT

### Supported Languages (11 Indian Languages + English)
1. **English (`en`)**
2. **Hindi (`hi`)** — Full Devanagari script generation & Romanized Hinglish parsing
3. **Gujarati (`gu`)**
4. **Marathi (`mr`)**
5. **Bengali (`bn`)**
6. **Tamil (`ta`)**
7. **Telugu (`te`)**
8. **Kannada (`kn`)**
9. **Malayalam (`ml`)**
10. **Punjabi (`pa`)**
11. **Odia (`or`)**

### Code-Mixed & Script Parsing
- **Romanized Hindi Input**: Input like *"tamatar ki pattiyan peeli ho rahi hain"* is parsed by the client/server RAG engine, mapped to agricultural concepts, and answered in **proper Devanagari Hindi**.
- **UI Localization**: Reusable JSON translation dictionary (`data-i18n` attributes in `index.html` and `script.js`) easily maps to `i18n-js` / `react-i18next` in React Native.

---

## 7. VOICE AUDIT

### Web Browser Limitations vs. React Native Native APIs

| Voice Feature | Web Browser Implementation | React Native Native Replacement |
| :--- | :--- | :--- |
| **Microphone Capture** | `navigator.mediaDevices.getUserMedia` | `expo-av` (`Audio.Recording`) |
| **Audio Format** | WebM (`audio/webm;codecs=opus`) | AAC (`audio/m4a`) or WAV (`audio/wav`) |
| **Speech-to-Text (STT)** | Web Speech API / Saaras STT API | `expo-av` recording sent to `/api/voice/call-turn` or `/api/voice/transcribe` |
| **Text-to-Speech (TTS)** | `window.speechSynthesis` / Bulbul TTS API | `expo-speech` (Local TTS) or Bulbul Audio player (`expo-av` `Audio.Sound`) |
| **Full-Duplex Call** | Custom event loop in `js/sarvamCall.js` | React Native Call Screen state machine with `expo-av` recording/playback |

---

## 8. UI/UX AUDIT

### Design Tokens & Visual Identity
- **Primary Color**: `#2E7D32` (Forest Green - Trust & Agriculture)
- **Secondary Accent**: `#81C784` (Light Leaf Green)
- **Call-to-Action Color**: `#1B5E20` (Dark Emerald Green)
- **Background Theme**: Crisp Light `#F4F6F4` / High Contrast `#000000`
- **Typography**: `Outfit` (Headings, bold & clean) & `Open Sans` (Body text)
- **Iconography**: Clean agricultural emojis (`🌱`, `🌿`, `🟤`, `🎤`, `🌦`, `💰`, `🏛`, `📞`) & SVG icons

### Key User Navigation Screens
1. **Home Tab (`view-home`)**: Welcome banner, profile summary badge, 6 quick action cards, call-to-action banner for live voice call.
2. **Chat Tab (`view-chat`)**: Multilingual message list, suggested question pills, text input bar with mic icon.
3. **Vision Tab (`view-vision`)**: Camera preview / photo picker, toggle between Disease Scan & Soil Test, diagnostic report card.
4. **Voice Call Modal (`sarvam-call-modal`)**: Full-screen voice conversation interface with pulsating avatar, real-time waveform, transcript feed, push-to-speak button, end call button.
5. **Weather Tab (`view-weather`)**: Today's temperature card, 3-day forecast grid, agricultural advisory card.
6. **Mandi Tab (`view-mandi`)**: Market rate list, crop filter pills, price comparison cards.
7. **Schemes Tab (`view-schemes`)**: Government scheme list, search bar, state filter dropdown, scheme detail modal.
8. **Feed Tab (`view-feed`)**: Agricultural news card list, category filters (Crops, Tech, Market, Weather).
9. **Farmer Profile Modal (`profile-modal`)**: Editable farmer details (Name, State, District, Village, Land Size, Primary Crops).

---

## 9. DATA / DATABASE AUDIT

### Source-of-Truth Database (`database/`)
- **Total Records**: **317 structured records** across 11 domains.
- **Client Offline Bundle**: `js/offline-knowledge.json` (545 KB) & `js/offline-knowledge-bundle.js` (525 KB).
- **Consumption in React Native**:
  - The static JSON `offline-knowledge.json` will be embedded directly in the mobile app assets directory (`assets/offline-knowledge.json`).
  - The business logic of `js/offlineRAG.js` (crop detection, relevance scoring, Devanagari output formatters) will be imported directly as a pure JavaScript module into the React Native codebase.

---

## 10. RECOMMENDED REACT NATIVE ARCHITECTURE

### Directory Structure
```
krishimitra-mobile/
├── assets/
│   ├── fonts/                 # Outfit & OpenSans TTF fonts
│   ├── images/                # App icons, splash screens, logo
│   └── data/
│       └── offline-knowledge.json # Embedded 317-record RAG knowledge base
├── src/
│   ├── api/                   # Reusable API Client Layer
│   │   ├── client.ts          # Axios / Fetch wrapper with timeout & error handling
│   │   ├── chatApi.ts         # /api/chat endpoints
│   │   ├── voiceApi.ts        # /api/voice multipart endpoints
│   │   ├── visionApi.ts       # /api/vision image upload endpoints
│   │   ├── weatherApi.ts      # /api/weather endpoints
│   │   └── schemesApi.ts      # /api/schemes endpoints
│   ├── components/            # UI Components
│   │   ├── common/            # Header, Button, Card, Loading, Badge
│   │   ├── chat/              # ChatBubble, InputToolbar, SuggestedPills
│   │   ├── vision/            # CameraView, ScanResultCard
│   │   └── voice/             # CallAvatar, WaveformAnimation, TranscriptBox
│   ├── config/                # App constants, colors, endpoints
│   ├── hooks/                 # Custom React Hooks
│   │   ├── useNetworkStatus.ts# NetInfo listener hook
│   │   ├── useOfflineRAG.ts   # Client-side mobile RAG hook
│   │   ├── useVoiceCall.ts    # Voice recording & playback state machine
│   │   └── useFarmerProfile.ts# AsyncStorage profile hook
│   ├── i18n/                  # 11 Indian language translations
│   │   ├── index.ts
│   │   └── locales/           # en.json, hi.json, gu.json, etc.
│   ├── navigation/            # React Navigation Setup
│   │   ├── AppNavigator.tsx   # Stack Navigator
│   │   └── BottomTabNavigator.tsx # Bottom Tabs (Home, Chat, Vision, Weather, Schemes)
│   ├── screens/               # Screen Views
│   │   ├── HomeScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── VisionScreen.tsx
│   │   ├── VoiceCallScreen.tsx
│   │   ├── WeatherScreen.tsx
│   │   ├── MandiScreen.tsx
│   │   ├── SchemesScreen.tsx
│   │   ├── FeedScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── services/              # Offline RAG & Storage Services
│   │   ├── mobileRAG.ts       # Adapted offlineRAG engine
│   │   └── storageService.ts  # AsyncStorage wrapper
│   └── types/                 # TypeScript Interfaces
├── app.json                   # Expo configuration
├── package.json
└── tsconfig.json
```

---

## 11. WEB ↔ MOBILE FEATURE MATRIX

| Feature | Web Status | Backend Status | Mobile Implementation Plan | Offline Strategy | Native Mobile APIs Required |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Home Dashboard** | Production | Ready | Custom React Native View + Cards | 100% Offline | None |
| **Online AI Chat** | Production | Ready | React Native FlatList + Axios | Fallback to `mobileRAG.ts` | Keyboard, Haptics |
| **Offline AI Chat** | Production | N/A | Local JS execution of `mobileRAG.ts` | 100% Offline | AsyncStorage |
| **Voice Call Turn** | Production | Ready | Custom Voice Screen + `expo-av` | STT fallback | `expo-av` (Mic, Audio) |
| **Crop Vision** | Production | Ready | Camera View + `/api/vision` | TF.js / TFLite local | `expo-camera`, `expo-image-picker` |
| **Soil Vision** | Production | Ready | Camera View + `/api/vision` | TF.js / TFLite local | `expo-camera`, `expo-image-picker` |
| **Weather** | Production | Ready | React Native Cards + `/api/weather` | Local offline advisories | `expo-location` |
| **Govt Schemes** | Production | Ready | FlatList + Filter Modal | Local schemes DB | `expo-web-browser` |
| **Mandi Rates** | Production | N/A | Market Rate Table | Local mandi DB | None |
| **Agri News Feed** | Production | Ready | News List + `/api/feed/cache` | Cached feed articles | `expo-web-browser` |
| **Farmer Profile** | Production | N/A | Form Screen + State Selector | 100% Offline | AsyncStorage |
| **11 Languages** | Production | Ready | `i18n-js` + Dynamic Selector | 100% Offline | `expo-localization` |
| **Network Status** | Production | Ready | Top Status Banner | `@react-native-community/netinfo` | NetInfo |

---

## 12. IMPLEMENTATION PHASES

- **Phase 0 — Read-Only Audit (COMPLETED)**: Verified existing web, backend, AI/ML, and RAG database architecture.
- **Phase 1 — Mobile Foundation**: Initialize Expo React Native project (`krishimitra-mobile`), configure TypeScript, design tokens, fonts (`Outfit`, `OpenSans`), and `i18n-js` for 11 languages.
- **Phase 2 — Navigation & UI Shell**: Build Bottom Tab Navigator (Home, Chat, Vision, Weather, Schemes) & Header Profile Badge.
- **Phase 3 — API Layer & Network Management**: Implement Axios client targeting Render backend, integrate `@react-native-community/netinfo`, and handle online/offline toggling.
- **Phase 4 — Multilingual Chat (Online & Offline)**: Build `ChatScreen.tsx`, integrate `/api/chat` for online chat, and embed `mobileRAG.ts` with `offline-knowledge.json` for offline chat.
- **Phase 5 — Mobile Vision (Disease & Soil)**: Integrate `expo-camera` & `expo-image-picker` to send photo scans to `/api/vision`.
- **Phase 6 — Voice Assistant & Live Call**: Integrate `expo-av` for audio recording and playback, connecting to `/api/voice/call-turn`.
- **Phase 7 — Weather, Mandi, Schemes & News**: Build list views, filter modals, and advisory cards.
- **Phase 8 — Local Storage & Profile Sync**: Implement `AsyncStorage` profile hook for farmer profile context.
- **Phase 9 — Production Build & Testing**: Test on physical Android & iOS devices, generate APK / AAB via Expo EAS.

---

## 13. CRITICAL RISKS & BLOCKERS

1. **Audio Format Compatibility**: Web browsers send WebM audio (`audio/webm`), whereas iOS devices capture AAC/M4A (`audio/m4a`) and Android captures AAC/3GP. **Resolution**: `backend/routes/voice.js` uses Multer and Saaras STT, which support MP4, M4A, WAV, and WebM binaries without code changes.
2. **CORS / Network Access**: React Native native apps are not subject to browser CORS policies, but Render backend URLs must use `https://` in production builds.
3. **Large Asset Bundle**: Embedding `offline-knowledge.json` (545 KB) inside the React Native bundle is lightweight and will not cause performance degradation.
4. **Render Cold Starts**: Free-tier Render web services sleep after 15 minutes of inactivity. The mobile app must display a friendly "Connecting to KrishiMitra AI..." loading state when waking up backend services.

---

## 14. CONCLUSION & REUSABLE ASSET SUMMARY

### Current Architecture Summary
KrishiMitra AI is a production-ready, verified agricultural AI ecosystem. Its Node.js backend handles multi-provider AI routing (Sarvam AI, Gemini 3.5 Flash, Gemma 3, RAG direct), voice call turn-taking (Saaras STT + Bulbul TTS), and Keras vision model execution.

### Exact Files That MUST Be Reused (Conceptually & Data)
1. **Knowledge Database**: `database/**/*.json` (All 317 structured records across 11 domains).
2. **Offline Knowledge Bundle**: `js/offline-knowledge.json` (Embedded directly into mobile app assets).
3. **Offline RAG Business Logic**: `js/offlineRAG.js` (Algorithmic scoring, crop detection, Devanagari output formatting).
4. **Backend Server & Services**: The entire `backend/` codebase without modifying a single line.
5. **Keras Vision Models**: `ai/models/plant_disease_model.keras` & `ai/models/soil_classifier_v4.keras`.

### EXACT Files That MUST NOT Be Modified
- `backend/server.js`
- `backend/routes/*.js`
- `backend/services/*.js`
- `ai/models/*.keras`
- `ai/browser-models/**/*`
- `database/**/*.json`
- `js/offlineRAG.js`
- `index.html` & `script.js`

### First Implementation Task After Audit
Initialise the Expo React Native project root (`krishimitra-mobile`), configure the design system tokens, fonts, and set up `BottomTabNavigator.tsx`.

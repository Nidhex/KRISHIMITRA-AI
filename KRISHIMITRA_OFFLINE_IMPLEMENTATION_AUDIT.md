# 🌾 KRISHIMITRA AI — DEEP OFFLINE FEATURE & MODEL IMPLEMENTATION AUDIT

> **Auditor Role**: Senior ML Engineer + Full-Stack Engineer + PWA/Offline Architecture Specialist  
> **Source of Truth**: Absolute codebase inspection (Zero assumptions from documentation)  
> **Repository Path**: `c:\Users\ASUS\Desktop\farmarai\farmer_ai`  
> **Audit Date**: September 6, 2026  

---

# 1. EXECUTIVE SUMMARY & REPOSITORY STRUCTURE

### Architecture Map

```text
[Browser Client (HTML5 / Vanilla JS)]
       │
       ├── NO Service Worker / NO PWA Cache / NO Browser ML (tfjs/onnx)
       ├── Requires HTTP Fetch to Backend
       ▼
[Node.js Express Server (backend/server.js on Port 5001)]
       │
       ├── Chat Endpoint (/api/chat)
       │     ├── 1. Sarvam AI (Cloud API)
       │     ├── 2. Gemini API (Cloud API)
       │     ├── 3. Ollama (Local gemma3 via http://localhost:11434)
       │     └── 4. RAG Knowledge Base (Local database/ JSON files)
       │
       ├── Vision Endpoint (/api/vision)
       │     └── child_process.spawn("python -m prediction.api <image_path> <mode>")
       │           │
       │           ▼
       │     [Python Subprocess (ai/prediction/api.py)]
       │           ├── Loads TensorFlow & Keras Model Binary from Disk
       │           ├── Preprocesses Image (224x224 RGB float32 / 255.0)
       │           ├── Runs model.predict()
       │           ├── Prints JSON Output to stdout
       │           └── Python Process Exits (Process Terminated)
       │
       └── Static Data Endpoints (/api/weather, /api/schemes, /api/feed/cache)
```

---

# 2. ALL TRAINED AI/ML MODELS DISCOVERED

| Model Name | Exact File Path | File Size | Model Format | Intended Task | Input Shape | Preprocessing | Class Labels Count | Inference Execution Location |
|---|---|---|---|---|---|---|---|---|
| **Plant Disease Classifier** | [`ai/models/plant_disease_model.keras`](file:///c:/Users/ASUS/Desktop/farmarai/farmer_ai/ai/models/plant_disease_model.keras) | 9.70 MB (9,704,181 B) | Keras (`.keras`) HDF5/Zip | Plant Disease Diagnosis | `(1, 224, 224, 3)` | RGB, `224x224`, `float32`, `/ 255.0` | 15 classes ([`labels.json`](file:///c:/Users/ASUS/Desktop/farmarai/farmer_ai/ai/models/labels.json)) | Python TensorFlow on Node.js Server |
| **Soil Classifier v4** | [`ai/models/soil_classifier_v4.keras`](file:///c:/Users/ASUS/Desktop/farmarai/farmer_ai/ai/models/soil_classifier_v4.keras) | 23.54 MB (23,542,350 B) | Keras (`.keras`) HDF5/Zip | Soil Type Classification | `(1, 224, 224, 3)` | RGB, `224x224`, `float32`, unscaled float32 | 7 classes ([`soil_labels_v4.json`](file:///c:/Users/ASUS/Desktop/farmarai/farmer_ai/ai/models/soil_labels_v4.json)) | Python TensorFlow on Node.js Server |
| **Soil Classifier v3** | [`ai/models/soil_classifier_v3.keras`](file:///c:/Users/ASUS/Desktop/farmarai/farmer_ai/ai/models/soil_classifier_v3.keras) | 21.83 MB | Keras (`.keras`) | Previous Soil Classifier iteration | `(1, 224, 224, 3)` | RGB, `224x224` | 7 classes | Archived / Inactive |
| **Soil Classifier v2** | [`ai/models/soil_classifier_v2.keras`](file:///c:/Users/ASUS/Desktop/farmarai/farmer_ai/ai/models/soil_classifier_v2.keras) | 9.75 MB | Keras (`.keras`) | Previous Soil Classifier iteration | `(1, 224, 224, 3)` | RGB, `224x224` | 7 classes | Archived / Inactive |
| **Soil Classifier v1** | [`ai/models/soil_classifier.keras`](file:///c:/Users/ASUS/Desktop/farmarai/farmer_ai/ai/models/soil_classifier.keras) | 9.75 MB | Keras (`.keras`) | Previous Soil Classifier iteration | `(1, 224, 224, 3)` | RGB, `224x224` | 7 classes | Archived / Inactive |

---

# 3. DISEASE DETECTION MODEL — DEEP TRACE

### Execution Pipeline

```text
User Selects Image in UI
  │
  ▼ (script.js calls KrishiMitraAPI.scanCrop(file))
Browser HTTP POST /api/vision (FormData: image file)
  │
  ▼ (backend/routes/vision.js)
Multer saves file to backend/uploads/scan_<timestamp>.jpg
  │
  ▼ (backend/services/visionService.js)
Child Process Spawn: python -m prediction.api backend/uploads/scan_<timestamp>.jpg disease
  │
  ▼ (ai/prediction/api.py -> predictor.py)
1. Python process initializes
2. TensorFlow imports & loads plant_disease_model.keras into Python RAM
3. image_utils.preprocess_image() resizes image to (224, 224, 3), normalizes (/ 255.0)
4. model.predict() executes
5. Returns predicted_class (from labels.json) & confidence score float
6. api.py prints JSON string to stdout
  │
  ▼ (backend/services/visionService.js)
Child process closes ➔ Node parses JSON from stdout
  │
  ▼ (backend/routes/vision.js)
Express returns HTTP 200 JSON { success: true, disease, confidence, imagePath }
  │
  ▼ (script.js)
UI updates disease card with diagnosis name & confidence %
```

### Offline Capability Assessment for Disease Model
- **With Internet + Hosted Backend**: **SUPPORTED**
- **With Internet but Backend Unavailable**: **NOT SUPPORTED**
- **Without Internet after App is Loaded (Browser-Side)**: **NOT SUPPORTED** (Fails at `fetch('/api/vision')`)
- **Completely Offline from Cold Start**: **NOT SUPPORTED** (No Service Worker)
- **Offline on Local Machine (`localhost`)**: **SUPPORTED** (If Node.js server and Python run locally on the farmer's computer/device)

---

# 4. SOIL ANALYSIS MODEL — DEEP TRACE

- **Model Binary**: [`ai/models/soil_classifier_v4.keras`](file:///c:/Users/ASUS/Desktop/farmarai/farmer_ai/ai/models/soil_classifier_v4.keras) (23.54 MB)
- **Labels File**: [`ai/models/soil_labels_v4.json`](file:///c:/Users/ASUS/Desktop/farmarai/farmer_ai/ai/models/soil_labels_v4.json) (`Alluvial_Soil`, `Arid_Soil`, `Black_Soil`, `Laterite_Soil`, `Mountain_Soil`, `Red_Soil`, `Yellow_Soil`)
- **Inference Location**: Python Subprocess (`ai/prediction/soil_predictor.py`) spawned by Node.js backend.
- **Preprocessing**: Image loaded via `tensorflow.keras.preprocessing.image.load_img`, forced RGB, resized to `224x224`, batch expanded `(1, 224, 224, 3)`.
- **Reason Preventing In-Browser Offline Inference**: The model binary is in Python Keras format (`.keras`) and resides on the backend disk server. No browser-side TensorFlow.js runner (`tf.loadLayersModel`) or ONNX runtime is installed in the frontend code.

---

# 5. OFFLINE SCENARIOS ANALYSIS

| Scenario | Status | Technical Explanation Based on Actual Codebase |
|---|---|---|
| **Scenario 1**: User online + Hosted app + Uses AI Vision | **YES** | HTTP `fetch('/api/vision')` reaches hosted Node backend, which spawns Python TensorFlow process and returns prediction JSON. |
| **Scenario 2**: User loads app online ➔ Disconnects internet ➔ Uploads photo | **NO** | `script.js` executes `fetch('/api/vision')`. Because internet is lost and no browser-side ML model (TF.js) exists, the fetch call rejects with `TypeError: Failed to fetch`. |
| **Scenario 3**: User opens app while completely offline after previous visit | **NO** | No Service Worker (`service-worker.js`) or Manifest exists. Browser shows standard offline error (`ERR_INTERNET_DISCONNECTED`). |
| **Scenario 4**: First-ever visit while completely offline | **NO** | Web browser cannot download `index.html` or static assets from server. |
| **Scenario 5**: App loaded online ➔ Internet disconnected permanently | **PARTIAL** | **On Localhost**: If Node server + Ollama run locally on `http://localhost:5001`, chat & vision work 100% offline. **On Hosted Site**: Nothing works after disconnection. |

---

# 6. BROWSER-SIDE ML AUDIT

### **NO BROWSER-SIDE MODEL INFERENCE VERIFIED**

- Search for `@tensorflow/tfjs`, `tf.loadLayersModel`, `ort.InferenceSession`, `onnxruntime-web`, WebGL ML runners, or WebGPU in `index.html`, `script.js`, and `js/*.js` returned **ZERO** results.
- All machine learning model execution takes place exclusively on the backend server via Python.

---

# 7. PYTHON INFERENCE AUDIT

- **Execution Model**: **Node `child_process.spawn` per request** (Ephemeral subprocess execution).
- **Process Lifecycle**:
  ```text
  Node receives POST /api/vision
    │
    ▼
  spawn("python", ["-m", "prediction.api", imagePath, mode])
    │
    ▼
  Python process starts ➔ TensorFlow imports ➔ Keras model loads into Python RAM ➔ Predicts ➔ Prints JSON ➔ Process EXITS
  ```
- **Memory Persistence**: The TensorFlow model does **NOT** stay resident in RAM between HTTP requests. Every vision request incurs cold-start overhead (Python startup + Keras load).

---

# 8. SERVICE WORKER / PWA AUDIT

- **Service Worker Present**: 🔴 **NO** (No `service-worker.js`, `sw.js`, or `navigator.serviceWorker.register`)
- **Web App Manifest Present**: 🔴 **NO** (No `manifest.json` or `<link rel="manifest">`)
- **IndexedDB Usage**: 🔴 **NO** (Zero IndexedDB code in repository)
- **App Shell Offline Caching**: 🔴 **NO** (Assets are not cached by browser Cache Storage)

---

# 9. MODEL CACHING AUDIT

### **"Where does the model physically live when the user is offline?"**
- **Answer**: **Python environment on backend server disk only** (`c:\Users\ASUS\Desktop\farmarai\farmer_ai\ai\models\plant_disease_model.keras` and `soil_classifier_v4.keras`).
- It is **NOT** present in browser Cache Storage, **NOT** in IndexedDB, and **NOT** in the frontend client application bundle.

---

# 10. OFFLINE DATA AUDIT

| Dataset | Storage Location | Usable Offline without Server? | Usable Offline with Local Node Server? |
|---|---|---|---|
| `crops.json` | `farmer_ai/database/crops/crops.json` | ❌ No | 🟢 Yes |
| `diseases.json` | `farmer_ai/database/diseases/diseases.json` | ❌ No | 🟢 Yes |
| `soil.json` | `farmer_ai/database/soil/soil.json` | ❌ No | 🟢 Yes |
| `fertilizers.json` | `farmer_ai/database/fertilizers/fertilizers.json` | ❌ No | 🟢 Yes |
| `pesticides.json` | `farmer_ai/database/pesticides/pesticides.json` | ❌ No | 🟢 Yes |
| `schemes.json` | `farmer_ai/database/schemes/schemes.json` | ❌ No | 🟢 Yes |
| `faq.json` | `farmer_ai/database/faq/faq.json` | ❌ No | 🟢 Yes |
| `mandi.json` | `farmer_ai/database/mandi/mandi.json` | ❌ No | 🟢 Yes |
| `weather.json` | `farmer_ai/database/weather/weather.json` | ❌ No | 🟢 Yes |
| `news_cache.json` | `farmer_ai/database/news/news_cache.json` & Browser `localStorage` | 🟢 Yes (in `localStorage`) | 🟢 Yes |

---

# 11. RAG OFFLINE AUDIT

- **A. Offline Knowledge Retrieval**: **SUPPORTED via Local Node Server**. `ragService.js` and `databaseService.js` perform full-text fuzzy lookup over local JSON files without internet access.
- **B. Offline Generative AI**: **SUPPORTED via Local Ollama (`gemma3`)**. If internet drops, `backend/routes/chat.js` routes prompt to local Ollama instance (`http://localhost:11434`).

---

# 12. CHAT OFFLINE AUDIT

- **Cloud Dependencies**: Sarvam AI (`sarvam-105b`) & Google Gemini (`gemini-3.5-flash`).
- **Offline Cascade**:
  - Internet lost ➔ Sarvam/Gemini fail ➔ Backend calls local Ollama (`gemma3`).
  - If Ollama is offline ➔ Backend returns ground-truth text snippet directly from local RAG JSON database.
- **Client-Side AI**: None in browser. Requires connection to Node backend.

---

# 13. VOICE OFFLINE AUDIT

- **STT (Speech-to-Text)**: Requires Sarvam Saaras API (`saaras:v3`). Hybrid fallback uses Web Speech API (`webkitSpeechRecognition`), which requires Chrome cloud connection on most platforms.
- **TTS (Text-to-Speech)**: Requires Sarvam Bulbul API (`bulbul:v3`). Fallback uses browser `window.speechSynthesis`.
- **Result**: Voice assistant requires active internet connection for high-accuracy Indic voice synthesis and transcription.

---

# 14. WEATHER OFFLINE AUDIT

- **Implementation**: Hardcoded mock weather object in `backend/routes/weather.js`.
- **Offline Status**: Returns static mock weather object regardless of internet connectivity.

---

# 15. MANDI OFFLINE AUDIT

- **Implementation**: 3 static records in `database/mandi/mandi.json`.
- **Offline Status**: Static records are accessible offline whenever backend server is reachable.

---

# 16. FRONTEND OFFLINE BEHAVIOR

- **Offline Banners**: `js/api.js` has error classification (`ERROR_MESSAGES.BACKEND_OFFLINE = 'Offline AI backend not running'`).
- **Misleading UI**: UI displays "Live APMC Prices" and "7-Day Hyperlocal Weather" even though both are static mock data.

---

# 17. DEPLOYMENT AUDIT

- **Hosting Requirements**: Deployment requires a server environment capable of running **Node.js v18+** AND **Python 3.10+ with TensorFlow** (or a Docker container combining Node + Python + Keras model binaries).
- **Static Hosting (Vercel / Netlify)**: Serverless static hosting will **NOT** run the Python TensorFlow vision inference out-of-the-box without containerization.

---

# 18. ACTUAL OFFLINE FEATURE MATRIX

| Feature | Online | Offline After Cache (Hosted App) | Cold Offline (Local Node Server) | Backend Required | Internet Required |
|---|---|---|---|---|---|
| **App Shell** | 🟢 Yes | 🔴 No | 🟢 Yes (Localhost) | 🟢 Yes | 🔴 No |
| **Disease AI** | 🟢 Yes | 🔴 No | 🟢 Yes | 🟢 Yes | 🔴 No |
| **Soil AI** | 🟢 Yes | 🔴 No | 🟢 Yes | 🟢 Yes | 🔴 No |
| **Chat** | 🟢 Yes | 🔴 No | 🟢 Yes (Ollama) | 🟢 Yes | 🔴 No |
| **Voice STT** | 🟢 Yes | 🔴 No | 🔴 No | 🟢 Yes | 🟢 Yes |
| **Voice TTS** | 🟢 Yes | 🔴 No | 🔴 No | 🟢 Yes | 🟢 Yes |
| **RAG Search** | 🟢 Yes | 🔴 No | 🟢 Yes | 🟢 Yes | 🔴 No |
| **Schemes** | 🟢 Yes | 🔴 No | 🟢 Yes | 🟢 Yes | 🔴 No |
| **Calculators**| 🟢 Yes | 🟢 Yes (`localStorage`) | 🟢 Yes | 🔴 No | 🔴 No |
| **Weather** | 🟢 Yes (Mock) | 🔴 No | 🟢 Yes (Mock) | 🟢 Yes | 🔴 No |
| **Mandi** | 🟢 Yes (Static)| 🔴 No | 🟢 Yes (Static) | 🟢 Yes | 🔴 No |
| **News** | 🟢 Yes | 🟢 Yes (`localStorage`) | 🟢 Yes | 🔴 No | 🔴 No |
| **PMFBY Report**| 🟢 Yes | 🟢 Yes (`script.js`) | 🟢 Yes | 🔴 No | 🔴 No |

---

# 19. EXISTING OFFLINE IMPLEMENTATION

### What Has Been Trained & Implemented:
1. **Plant Disease Classifier**: Trained Keras CNN model (`plant_disease_model.keras`, 9.7MB, 15 classes).
2. **Soil Classifier**: Trained Keras CNN model (`soil_classifier_v4.keras`, 23.5MB, 7 classes).
3. **Python Bridge Pipeline**: `ai/prediction/api.py`, `predictor.py`, `soil_predictor.py`, `image_utils.py`.
4. **Local Knowledge RAG Engine**: 9 local JSON databases + in-memory full-text search.
5. **Local Ollama Fallback**: Configured to connect to `gemma3` on `http://localhost:11434`.

---

# 20. MODEL & DEPLOYMENT SIZE

- `plant_disease_model.keras`: **9.70 MB**
- `soil_classifier_v4.keras`: **23.54 MB**
- Total Trained Models Size: **33.24 MB**
- **Lazy Loading**: Python script loads model binary from disk only when `/api/vision` endpoint is invoked.

---

# 21. SECURITY AUDIT FOR OFFLINE AI

- **API Keys**: Safe (Backend `.env` only).
- **Uploaded Images**: Saved to `backend/uploads/scan_<timestamp>.jpg` with 10MB limit.
- **Subprocess Safety**: Safe argument array passing in `child_process.spawn`.

---

# 22. PERFORMANCE AUDIT

- **Cold Start Subprocess Latency**: Every call to `/api/vision` incurs ~1.5s to 2.5s Python + TensorFlow startup latency because models load on every invocation.

---

# 23. TESTING AUDIT

- `backend/test_chat_integration.js`: Integration test for RAG retrieval & Sarvam API.
- `backend/test_server_endpoints.js`: Express route status tests.
- `backend/test_voice_service.js`: BCP-47 formatting test.

---

# 24. DOCUMENTATION VS REAL CODE

| Documentation Claim | Actual Code Implementation | Match Status |
|---|---|---|
| **"Multilingual Sarvam AI"** | `sarvam-105b` API integrated in backend | 🟢 Matches Code |
| **"In-Browser Voice Call"** | MediaRecorder + Saaras STT + Bulbul TTS | 🟢 Matches Code |
| **"AI Vision Lab"** | Real Keras TensorFlow models (`.keras`) | 🟢 Matches Code |
| **"Offline AI Mode Ready"** | Server-side Ollama + local RAG DBs | 🟡 Server Offline Only (No PWA/Browser ML) |
| **"Live Mandi APMC Rates"** | Static 3-record JSON file | 🔴 Documentation Mismatch |
| **"7-Day Hyperlocal Weather"** | Static mock weather object | 🔴 Documentation Mismatch |

---

# 25. FINAL VERDICT & 10 AUDIT QUESTIONS

1. **HAVE I ALREADY IMPLEMENTED A TRUE OFFLINE AI FEATURE?**  
   👉 **YES (Server-Side Offline AI)**. The project contains custom-trained Keras vision models, local RAG JSON knowledge bases, and local Ollama (`gemma3`) LLM fallback running on the backend server.

2. **WHICH TRAINED MODEL(S) ARE INVOLVED?**  
   👉 `plant_disease_model.keras` (9.7MB, 15 classes) and `soil_classifier_v4.keras` (23.5MB, 7 classes).

3. **CAN THE TRAINED MODEL RUN WITHOUT MY NODE BACKEND?**  
   👉 **NO**. The trained models require Python + TensorFlow spawned by the Node.js backend (`visionService.js`).

4. **CAN IT RUN WITHOUT INTERNET?**  
   👉 **YES**, provided the Node backend and Python environment are running locally on the user's computer/device (`localhost`). **NO**, if relying on a cloud-hosted server while the browser is offline.

5. **CAN IT RUN DIRECTLY INSIDE THE BROWSER?**  
   👉 **NO**. There is zero TensorFlow.js or ONNX Runtime Web code in the frontend.

6. **IS THERE ALREADY A SERVICE WORKER?**  
   👉 **NO**. No Service Worker or Manifest file exists.

7. **IS THE MODEL ALREADY CACHED ON THE DEVICE?**  
   👉 **NO**. Models reside on backend server disk only.

8. **DOES THE HOSTED VERSION PRESERVE THIS OFFLINE CAPABILITY?**  
   👉 **NO**. Hosted app requires network connection to reach backend.

9. **WHAT IS THE MINIMUM WORK REQUIRED TO MAKE THE EXISTING TRAINED FEATURE TRULY OFFLINE IN BROWSER?**  
   👉 Convert `.keras` models to TensorFlow.js format (`tfjs_converter`), register a Service Worker for static assets, and run `tf.loadLayersModel()` directly in browser JavaScript.

10. **WHAT MUST NOT BE CHANGED BECAUSE IT IS ALREADY WORKING?**  
    👉 Do **NOT** touch the trained Keras model binaries (`ai/models/*.keras`), dataset preprocessing (`image_utils.py`), RAG engine (`ragService.js`), or Sarvam/Ollama chat fallback pipeline (`chat.js`).

### **Overall Project Classification**:
### 🟡 **PARTIALLY OFFLINE (SERVER-SIDE OFFLINE AI COMPLETE / BROWSER PWA & IN-BROWSER ML MISSING)**

---

# 26. CURRENT STATE FOR HANDOFF

```text
================================================================================
KRISHIMITRA AI — CURRENT STATE FOR HANDOFF
================================================================================
1. TRAINED ML MODELS:
   - Plant Disease: ai/models/plant_disease_model.keras (9.7MB, 15 classes)
   - Soil Health: ai/models/soil_classifier_v4.keras (23.5MB, 7 classes)
   - Execution: Spawns Python TensorFlow subprocess per request via visionService.js

2. OFFLINE CAPABILITIES (EXISTING):
   - Local RAG Knowledge Base (database/ JSON files - 9 domains)
   - Local LLM Fallback (Ollama gemma3 via backend/services/ollamaService.js)
   - News Cache (database/news/news_cache.json + LocalStorage)

3. MISSING FOR TRUE BROWSER PWA OFFLINE:
   - No Service Worker (service-worker.js)
   - No Web App Manifest (manifest.json)
   - No Browser-side ML Engine (TensorFlow.js / ONNX Web)

4. DO NOT MODIFY:
   - ai/models/plant_disease_model.keras & soil_classifier_v4.keras
   - backend/services/ragService.js & databaseService.js
   - backend/routes/chat.js & backend/services/sarvamVoiceService.js
================================================================================
```

# KrishiMitra AI — All Features: Complete Technical Narrative & Mermaid Diagrams

This document contains the complete technical text explanation, workflow breakdown, and **Mermaid diagrams** for every feature in the **KrishiMitra AI** platform.

---

## Table of Contents

1. [Feature 1: Core System Architecture & Topology](#feature-1-core-system-architecture--topology)
2. [Feature 2: Farm Diary & Agentic AI Decision Engine](#feature-2-farm-diary--agentic-ai-decision-engine)
3. [Feature 3: Vision Lab (Crop Disease Scan & Treatment Advisory)](#feature-3-vision-lab-crop-disease-scan--treatment-advisory)
4. [Feature 4: Voice AI Assistant (Multilingual Vernacular Voice Line)](#feature-4-voice-ai-assistant-multilingual-vernacular-voice-line)
5. [Feature 5: Mandi Prices & APMC Market Intelligence](#feature-5-mandi-prices--apmc-market-intelligence)
6. [Feature 6: Government Schemes Navigator](#feature-6-government-schemes-navigator)
7. [Feature 7: Weather & Microclimate Advisory](#feature-7-weather--microclimate-advisory)
8. [Feature 8: Krishi Feed & Community Forum](#feature-8-krishi-feed--community-forum)
9. [Feature 9: Resilient Multi-Tier Fallback & Data Sync Architecture](#feature-9-resilient-multi-tier-fallback--data-sync-architecture)

---

## Feature 1: Core System Architecture & Topology

### Comprehensive Explanation
KrishiMitra AI is designed with a **resilient hybrid mobile architecture**. It prioritizes local execution and offline caching on the farmer's mobile device via React Native / Expo, backed by an Express/Node.js microservice architecture on Render. Heavy AI tasks (such as multilingual voice processing, multimodal image analysis, and deep agricultural context reasoning) are delegated to cloud AI services (Google Gemini API and Sarvam AI).

### System Topology Flowchart
```mermaid
graph TD
    subgraph MobileApp["📱 KrishiMitra Mobile App (Expo / React Native)"]
        UI["🎨 Mobile UI Layer (Expo Router)"]
        LocalStorage["💾 Async Storage / Local Cache"]
        NetworkMonitor["🌐 Network Status Monitor"]
        LocalEngine["🧠 Local Rule & Decision Engine"]
        ApiClient["📡 API Client Layer"]
    end

    subgraph CloudBackend["☁️ Render Backend Server (Node.js / Express)"]
        Gateway["🚪 REST API Gateway"]
        DiaryService["📖 Farm Diary API Service"]
        VisionService["🔬 Disease Classifier Endpoint"]
        VoiceService["🎙️ Voice Pipeline Proxy"]
        MandiService["🌾 Mandi Rates Endpoint"]
        SchemeService["🏛️ Govt Schemes Endpoint"]
        WeatherService["⛅ Weather Integration Proxy"]
    end

    subgraph AIServices["🤖 External Microservices & APIs"]
        Gemini["✨ Google Gemini AI Engine"]
        Sarvam["🔊 Sarvam AI (Voice STT / TTS)"]
        MandiDB["📊 Government Agmarknet API"]
        WeatherDB["⛅ OpenWeather API"]
    end

    UI --> LocalStorage
    UI --> NetworkMonitor
    UI --> LocalEngine
    UI --> ApiClient

    ApiClient -->|HTTPS REST| Gateway
    Gateway --> DiaryService
    Gateway --> VisionService
    Gateway --> VoiceService
    Gateway --> MandiService
    Gateway --> SchemeService
    Gateway --> WeatherService

    VoiceService --> Sarvam
    VoiceService --> Gemini
    DiaryService --> Gemini
    VisionService --> Gemini
    MandiService --> MandiDB
    WeatherService --> WeatherDB
```

---

## Feature 2: Farm Diary & Agentic AI Decision Engine

### Comprehensive Explanation
The **Farm Diary** serves as the farmer's digital **Farm Memory**. When a farmer performs field operations (applying pesticide, sowing wheat, irrigating, applying urea fertilizer, harvesting), the activity is recorded with canonical metadata (`eventType`, `crop`, `quantity`, `unit`, `area`, `date`). 

The **Agentic AI Decision Engine** continually monitors this event sequence. It evaluates past operations alongside crop growth stages and microclimate conditions to compute a dynamic **🌱 NEXT BEST ACTION** card. If an event is deleted or a new activity is saved, the engine automatically recomputes the recommendation in real-time.

### Event Processing & Recomputation Flowchart
```mermaid
flowchart TD
    Start(["👨‍🌾 Farmer Interacts with Farm Diary"]) --> InputMode{"Input Method"}
    
    InputMode -->|Manual Form| EnterForm["📝 Input Details (Type, Crop, Qty, Unit, Area, Date)"]
    InputMode -->|Voice Audio| SpeakActivity["🎙️ Speak Activity in Vernacular Language"]

    SpeakActivity --> ExtractAPI["📡 POST /api/farm-diary/extract"]
    ExtractAPI --> ParseCanonical["Extract Canonical JSON (eventType, crop, qty, unit)"]
    ParseCanonical --> EnterForm

    EnterForm --> SaveEvent["💾 Save Event to Local Farm Memory"]
    SaveEvent --> SyncBackend["📡 POST /api/farm-diary"]

    SyncBackend --> TriggerEngine["⚡ Trigger Automatic Recomputation Loop"]
    
    TriggerEngine --> FetchHistory["🧠 Read Complete Farmer History Array"]
    FetchHistory --> CheckEvents{"Are Events Present?"}

    CheckEvents -->|No Events| EmptyState["🌱 Action: 'Start recording your daily farm activities'"]
    CheckEvents -->|Has Events| AnalyzeSequence["⚙️ Analyze Latest Activity & Historical Sequence"]

    AnalyzeSequence --> DecisionRules{"Evaluate Operational Pattern"}
    
    DecisionRules -->|Latest = Pesticide| Rule1["Action: 'Monitor field 2-3 days before next spray'"]
    DecisionRules -->|Latest = Fertilizer| Rule2["Action: 'Schedule light irrigation to assist root nitrogen uptake'"]
    DecisionRules -->|Latest = Irrigation| Rule3["Action: 'Inspect soil moisture & check for early weed growth'"]
    DecisionRules -->|Latest = Harvest| Rule4["Action: 'Sun-dry crop to <12% moisture & check Mandi prices'"]

    EmptyState --> RenderCard["📱 Render Next Best Action Card on UI"]
    Rule1 --> RenderCard
    Rule2 --> RenderCard
    Rule3 --> RenderCard
    Rule4 --> RenderCard
```

### Agentic State Machine
```mermaid
stateDiagram-v2
    [*] --> MemoryEmpty : 0 Events Logged
    
    state MemoryEmpty {
        [*] --> PromptFarmer : "Add a crop activity to build farm memory"
    }

    MemoryEmpty --> EventRecorded : Farmer logs activity

    state ActiveFarmMemory {
        [*] --> LoadChronologicalEvents
        LoadChronologicalEvents --> IdentifyLatestOperation
        
        state EvaluationRules {
            IdentifyLatestOperation --> PesticideApplied : eventType == pesticide
            IdentifyLatestOperation --> FertilizerApplied : eventType == fertilizer
            IdentifyLatestOperation --> IrrigationApplied : eventType == irrigation
            
            PesticideApplied --> AdviceChemicalSafety : "Allow 48-72h knockdown evaluation"
            FertilizerApplied --> AdviceWatering : "Schedule light watering for nitrogen absorption"
            IrrigationApplied --> AdviceMoisture : "Check root zone & weed emergence"
        }
    }

    ActiveFarmMemory --> NextBestActionGenerated : Action + Why + Based On + Timing + Confidence
    NextBestActionGenerated --> RenderUICard : Render Card

    EventRecorded --> ActiveFarmMemory : Recompute
    EventDeleted --> ActiveFarmMemory : Recompute
```

---

## Feature 3: Vision Lab (Crop Disease Scan & Treatment Advisory)

### Comprehensive Explanation
The **Vision Lab (Crop Doctor)** enables instant field diagnostics for plant diseases. A farmer snaps a photo of an infected leaf or stem. The image is compressed and passed to a trained deep neural network model. The system identifies the specific disease, calculates a diagnostic confidence percentage, assesses severity, and provides actionable **Chemical** (e.g. fungicide spray doses per acre) and **Organic** (e.g. neem oil, biological control) remediation steps.

### Disease Diagnosis Sequence Diagram
```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 👨‍🌾 Farmer
    participant VisionUI as 🔬 Vision Screen UI
    participant Service as ⚙️ visionService
    participant Backend as ☁️ Render Backend Server
    participant Classifier as 🤖 TensorFlow / Keras Model
    participant LLM as ✨ Gemini AI Model

    Farmer->>VisionUI: Tap "Scan Crop" or Select Photo
    VisionUI->>Service: analyzeCropImage(imageUri, cropHint: "Wheat")
    Service->>Service: Compress & Encode Base64 Image String
    
    alt Online Path
        Service->>Backend: POST /api/vision/analyze { imageBase64, crop: "Wheat" }
        Backend->>Classifier: Pass Tensor Image Array
        Classifier-->>Backend: Return Disease: "Yellow Rust", Confidence: 94%
        
        Backend->>LLM: Request Treatment Plan for "Yellow Rust" in "Wheat"
        LLM-->>Backend: Return Chemical Doses & Organic Remediation
        Backend-->>Service: Return Complete Diagnosis Object
    else Offline Fallback Path
        Service->>Service: Run Lightweight Offline Rule Classifier
    end

    Service-->>VisionUI: Return CropDiagnosis Result
    VisionUI-->>Farmer: Render Disease Name, Confidence %, Symptoms, Chemical/Organic Treatment
```

---

## Feature 4: Voice AI Assistant (Multilingual Vernacular Voice Line)

### Comprehensive Explanation
The **Voice AI Assistant** bridges the literacy barrier for rural farmers. By tapping the voice microphone icon, farmers can ask agricultural questions in their spoken native language (Hindi, Punjabi, Marathi, Gujarati, Telugu, Tamil, English). 

The audio stream is transcribed via Sarvam AI's speech-to-text engine, enriched with the farmer's local crop context, answered by Google Gemini, and spoken back out loud using Sarvam AI's text-to-speech synthesizer.

### Multilingual Voice Pipeline Diagram
```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 👨‍🌾 Farmer
    participant UI as 🎙️ Voice UI Modal
    participant AudioEngine as 🔊 expo-av Audio Recorder
    participant VoiceSvc as ⚙️ voiceService
    participant Backend as ☁️ Render Backend Proxy
    participant Sarvam as 🔊 Sarvam AI (STT & TTS)
    participant Gemini as ✨ Gemini AI Model

    Farmer->>UI: Hold Microphone & Speak ("गेहूं में पहली सिंचाई कब करें?")
    UI->>AudioEngine: Record Audio Buffer (.wav / .m4a)
    Farmer->>UI: Release Record Button
    UI->>VoiceSvc: processVoiceQuery(audioUri, language: "hi")
    
    VoiceSvc->>Backend: POST /api/voice/stt { audioBase64, language: "hi" }
    Backend->>Sarvam: Speech-to-Text API Call
    Sarvam-->>Backend: Transcribed Text: "गेहूं में पहली सिंचाई कब करें?"
    
    Backend->>Gemini: Prompt: Transcribed Text + Farm Memory Context
    Gemini-->>Backend: Response: "गेहूं में पहली सिंचाई बुआई के 21 दिन बाद (C.R.I. अवस्था) करें।"
    
    Backend->>Sarvam: Text-to-Speech Call (Hindi Synthesizer)
    Sarvam-->>Backend: Return Synthetic Speech Audio Stream
    
    Backend-->>VoiceSvc: Return JSON { text: "...", audioUrl: "..." }
    VoiceSvc->>AudioEngine: Stream & Play Audio Response
    AudioEngine-->>Farmer: Speaks Answer Out Loud + Renders Text Transcript
```

---

## Feature 5: Mandi Prices & APMC Market Intelligence

### Comprehensive Explanation
The **Mandi Prices** module fetches live daily APMC wholesale rates across Indian markets. It integrates device GPS coordinates to calculate the physical distance (in kilometers) from the farmer's location to nearby market yards. The engine computes modal prices, price spreads (Min vs. Max), and highlights the market providing the highest financial return.

### Mandi Distance & Rate Recommendation Flowchart
```mermaid
flowchart TD
    Start(["🌾 Farmer Opens Mandi Screen"]) --> GetLoc{"Fetch Device GPS Location"}
    
    GetLoc -->|GPS On| Coords["📍 Read Latitude & Longitude"]
    GetLoc -->|GPS Off| DefaultLoc["📍 Default to Farmer Profile District (Varanasi, UP)"]

    Coords --> FetchData["📡 GET /api/mandi?state=UP&commodity=Wheat"]
    DefaultLoc --> FetchData

    FetchData --> ComputeDistance["📏 Calculate Distance (Haversine Formula) to each Mandi"]
    ComputeDistance --> CalculateStats["📊 Identify Max Price, Min Price, and Price Trends"]

    CalculateStats --> HighlightBest["🟢 Tag APMC with Highest Return as 'BEST PRICE NEAR YOU'"]

    HighlightBest --> RenderCards["📱 Render Mandi Cards (Market Name, Distance km, Modal Price, Arrival Qty)"]
    RenderCards --> SellAdvice["💡 Render Advisory: 'Selling at APMC Varanasi yields +₹150/quintal extra'"]
```

---

## Feature 6: Government Schemes Navigator

### Comprehensive Explanation
The **Government Schemes Navigator** demystifies public welfare programs (PM-Kisan Samman Nidhi, Kisan Credit Card, PM Fasal Bima Yojana, Soil Health Card). It evaluates the farmer's profile (land holding size in acres, state, crop type, category) against eligibility criteria matrices to highlight qualifying schemes and document requirements.

### Scheme Eligibility Sequence Diagram
```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 👨‍🌾 Farmer
    participant UI as 🏛️ Schemes UI Screen
    participant Profile as 👤 Farmer Profile Store
    participant Service as ⚙️ Scheme Service / apiClient
    participant Backend as ☁️ Render Schemes Engine

    Farmer->>UI: Opens Govt Schemes Tab
    UI->>Profile: Read Profile Data { landArea: 2.0, state: "UP", category: "Small" }
    Profile-->>UI: Return Profile Metadata
    
    UI->>Service: fetchMatchingSchemes(farmerProfile)
    Service->>Backend: POST /api/schemes/match { landArea: 2.0, state: "UP" }
    Backend->>Backend: Run Eligibility Rules Engine against Criteria Database
    Backend-->>Service: Return SchemeMatchResults[]
    
    Service-->>UI: Return Schemes with Match Percentage
    UI-->>Farmer: Display "100% Eligible" Badges, Benefits, Document Checklist & One-Tap Govt Links
```

---

## Feature 7: Weather & Microclimate Advisory

### Comprehensive Explanation
The **Weather & Microclimate Advisory** feature combines temperature, humidity, precipitation probability, and wind speed forecasts with **agronomic operational rules**. It provides clear recommendations on whether weather conditions are safe for pesticide spraying or if scheduled irrigation should be postponed.

### Weather Operational Advisory Decision Tree
```mermaid
flowchart TD
    Start(["⛅ Fetch Live Weather & 5-Day Forecast"]) --> TempCheck["🌡️ Read Temperature & Humidity"]
    Start --> WindCheck["💨 Read Wind Speed (km/h)"]
    Start --> RainCheck["🌧️ Read Rain Probability (%)"]

    WindCheck --> WindRule{"Wind Speed > 15 km/h?"}
    WindRule -->|Yes| SprayUnsafe["🔴 Unsafe Spray Window: High chemical drift risk"]
    WindRule -->|No| RainRule{"Rain Probability > 30%?"}

    RainRule -->|Yes| SprayUnsafe2["🔴 Unsafe Spray Window: Chemical wash-off risk"]
    RainRule -->|No| SpraySafe["🟢 Safe Pesticide Spray Window"]

    RainCheck --> RainIrrigRule{"Rain Forecast > 60% in 24h?"}
    RainIrrigRule -->|Yes| HoldIrrigation["🔵 Hold Irrigation: Natural rainfall expected"]
    RainIrrigRule -->|No| AllowIrrigation["🟢 Regular Irrigation Window"]

    SprayUnsafe --> RenderAdvisory["📱 Render Operational Weather Badges on Screen"]
    SpraySafe --> RenderAdvisory
    HoldIrrigation --> RenderAdvisory
    AllowIrrigation --> RenderAdvisory
```

---

## Feature 8: Krishi Feed & Community Forum

### Comprehensive Explanation
The **Krishi Feed & Community Forum** delivers verified agricultural news, crop management circulars, and a peer-to-peer discussion forum. Farmers can post questions, attach photos of crop symptoms, and receive answers from verified agricultural extension scientists or fellow farmers.

### Community Post & Interaction Flowchart
```mermaid
flowchart TD
    Start(["📰 Farmer Opens Krishi Feed"]) --> FeedChoice{"Choose View Mode"}
    
    FeedChoice -->|Official News| LoadNews["📡 Fetch Verified Government Circulars & Extension News"]
    FeedChoice -->|Community Forum| LoadForum["📡 Fetch Farmer Q&A Posts & Success Stories"]

    LoadForum --> CategoryFilter{"Select Filter"}
    CategoryFilter -->|All Crops| ShowAll["📋 Render All Community Posts"]
    CategoryFilter -->|Specific Crop| FilterByCrop["🔍 Filter by Crop (Wheat, Paddy, Organic)"]

    ShowAll --> RenderFeedCards["📱 Render Post Cards (Author, Verified Expert Badge, Image, Upvotes)"]
    FilterByCrop --> RenderFeedCards

    RenderFeedCards --> Interaction{"Farmer Interaction"}
    Interaction -->|Upvote| UpvoteAction["👍 Tap Upvote -> Increment Counter & Sync Backend"]
    Interaction -->|Create Post| NewPostModal["➕ Create Post -> Attach Photo & Vernacular Query"]

    NewPostModal --> SubmitPost["📡 POST /api/feed/create -> Refresh Feed Immediately"]
```

---

## Feature 9: Resilient Multi-Tier Fallback & Data Sync Architecture

### Comprehensive Explanation
KrishiMitra AI is engineered for zero data loss in disconnected environments. When network connection drops or a backend cloud API times out, the application automatically triggers a **Multi-Tier Fallback**:
- **Tier 1 (Cloud AI)**: Primary live cloud REST API call.
- **Tier 2 (Async Cache)**: Unexpired local JSON cache payload.
- **Tier 3 (Local Rules Engine)**: Zero-network deterministic decision engine.

Any user mutations (adding or deleting diary entries) performed while offline are saved with `pendingSync: true`. When connectivity is restored, the background sync manager automatically pushes pending payloads to the cloud database.

### Multi-Tier Fallback Sequence Diagram
```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 👨‍🌾 Farmer
    participant UI as 📱 Mobile UI Layer
    participant Client as 📡 apiClient.ts
    participant Net as 🌐 NetInfo Monitor
    participant Storage as 💾 StorageService / Cache
    participant Engine as 🧠 Local Rule Engine
    participant Backend as ☁️ Render Cloud Server

    Farmer->>UI: Request Feature Action (e.g. Next Best Action / Mandi / Vision)
    UI->>Client: executeApiRequest(endpoint, payload)
    Client->>Net: fetchConnectivityStatus()
    Net-->>Client: Return isConnected (true / false)

    alt Scenario A: Network Connected & Cloud API Healthy
        Client->>Backend: HTTP POST / GET Payload (Timeout: 8s)
        Backend-->>Client: HTTP 200 OK JSON
        Client->>Storage: saveCache(key, responsePayload, ttl: 4h)
        Client-->>UI: Return { success: true, data: cloudData, source: "cloud" }
        UI-->>Farmer: Render dynamic Live Cloud UI 🟢
    
    else Scenario B: Network Offline or Cloud Server Times Out / Errors
        Client->>Backend: HTTP Request Fails (Offline / Timeout / 503)
        Backend--xClient: Connection Exception
        Client->>Storage: getCache(key)
        
        alt Cache Exists (Cache Hit)
            Storage-->>Client: Return Cached JSON Payload
            Client-->>UI: Return { success: true, data: cachedData, source: "cache" }
            UI-->>Farmer: Render UI from Cache + "Offline Mode" Badge 🟡
        else Cache Missing (Cache Miss)
            Storage-->>Client: Return null
            Client->>Engine: executeLocalFallback(feature, payload)
            Engine-->>Client: Return Deterministic Rule Recommendation / Static Dataset
            Client-->>UI: Return { success: true, data: fallbackData, source: "local_engine" }
            UI-->>Farmer: Render UI from Local Engine + "Offline Advisory" Badge 🔴
        end
    end
```

---

## Technical Maintenance & Summary Matrix

| Feature Module | Primary Component | Key Data Contract | External Services | Fallback Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **System Core** | `_layout.tsx` / `apiClient.ts` | `ApiConfig`, `NetworkState` | Render Backend Proxy | Auto-Retry + Offline Queue |
| **Farm Diary** | `diary.tsx` / `diaryService.ts` | `FarmDiaryEvent`, `DecisionRecommendation` | Gemini AI, Local Storage | `calculateLocalDecision()` Rules |
| **Vision Lab** | `vision.tsx` / `visionService.ts` | `CropDiagnosis`, `TreatmentOptions` | TensorFlow / Keras, Gemini AI | Local Rule Classifier |
| **Voice Line** | `assistant.tsx` / `voiceService.ts` | `VoiceSession`, `AudioStream` | Sarvam AI (STT/TTS), Gemini AI | Local Vernacular Text & Audio |
| **Mandi Prices** | `info/mandi.tsx` / `mandiData.ts` | `MandiItem`, `MandiSummary` | Agmarknet API, GPS Location | Cached APMC Rates (4h TTL) |
| **Govt Schemes** | `info/schemes.tsx` | `Scheme`, `EligibilityCriteria` | Govt Portals, Rules Engine | Local Criteria Matrix |
| **Weather** | `info/weather.tsx` / `locationService.ts` | `WeatherData`, `AgriculturalAdvisory` | OpenWeather API, GPS Location | Microclimate Rule Calculator |
| **Krishi Feed** | `info/news.tsx` | `FeedPost`, `Comment` | Community DB, KVK Extension | Cached News Circulars |


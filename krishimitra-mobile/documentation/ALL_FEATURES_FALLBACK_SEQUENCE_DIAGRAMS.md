# KrishiMitra AI — All Features: Sequence Diagrams with Fallback & Connections

This document provides UML Sequence Diagrams for **all KrishiMitra AI features**, modeled to clearly illustrate:
1. How components (Farmer, Mobile App, Local Cache, Local Rule Engine, Backend Server, and Cloud AI) connect.
2. How the **multi-tier fallback** operates when network is offline or cloud APIs time out.
3. How **background auto-synchronization** recovers once connectivity is restored.

---

## 1. Master System Architecture: End-to-End Fallback & Sync Sequence

![Master Architecture Fallback Sequence](./images/fallback_flow_diagram_1789522360955.jpg)

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 👨‍🌾 Farmer
    participant App as 📱 Mobile App
    participant Cache as 💾 Local Cache
    participant Engine as 🧠 Local Rule Engine
    participant Backend as ☁️ Backend Server
    participant AI as 🤖 Cloud AI (Gemini / Sarvam)

    Farmer->>App: 1. Input farm request / action
    App->>Cache: 2. Query cached state
    Cache-->>App: Return local state

    alt [Online Mode — Cloud Available]
        App->>Backend: 3. API Request (Payload + Farm Context)
        Backend->>AI: 4. Heavy AI Inference / Processing
        AI-->>Backend: 5. Return Structured AI Result
        Backend-->>App: 6. Consolidated HTTP 200 Response
        App->>Cache: Update Local Cache Store
        App-->>Farmer: Render Dynamic Cloud Data 🟢

    else [Offline / Timeout Fallback]
        Note over App,Backend: Cloud API timed out (>8s) or Network Offline
        App--xBackend: Connection Failed / Timed Out
        App->>Cache: Check unexpired local cache
        
        alt Cache Hit
            Cache-->>App: Return cached payload
            App-->>Farmer: Render Cached Data + "Offline Mode" Badge 🟡
        else Cache Miss
            App->>Engine: 4. Process offline request
            Note over Engine: Fallback to local memory & agricultural rules
            Engine->>Engine: 5. Apply local deterministic rules
            Engine-->>App: 6. Rule-based advisory result
            App-->>Farmer: Render Local Advisory + "Offline Engine" Badge 🔴
        end
    end

    opt [Background Sync on Reconnection]
        loop [Background Sync Queue]
            App->>Backend: 7. Push pending offline mutations
            Backend-->>App: Sync confirmation (HTTP 201 Created)
            App->>Cache: Clear pendingSync flags
        end
    end
```

---

## 2. Feature 1: Farm Diary & Agentic AI Decision Engine

![Farm Diary & Agentic AI Fallback Sequence](./images/farm_diary_decision_diagram_1789523354300.jpg)

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 👨‍🌾 Farmer
    participant DiaryUI as 📖 Farm Diary UI
    participant Service as ⚙️ diaryService
    participant LocalDB as 💾 Async Storage
    participant LocalEngine as 🧠 Local Decision Engine
    participant Backend as ☁️ Backend API (/api/farm-diary)
    participant Gemini as ✨ Gemini AI Model

    Farmer->>DiaryUI: 1. Tap "Save Event" (e.g. 2L Pesticide on Wheat)
    DiaryUI->>Service: 2. saveEvent(pestEventPayload)
    Service->>LocalDB: 3. Store event locally with ID "off_timestamp"

    alt [Online Mode]
        Service->>Backend: 4. POST /api/farm-diary (new event)
        Backend-->>Service: 5. HTTP 201 Created (confirmed)
        Service->>Backend: 6. POST /api/farm-diary/decision { farmerId }
        Backend->>Gemini: 7. Evaluate full history & weather context
        Gemini-->>Backend: 8. Context-aware Next Best Action
        Backend-->>Service: 9. Return DecisionRecommendation JSON
        Service->>LocalDB: Cache newest decision
        Service-->>DiaryUI: 10. Update 🌱 Next Best Action Card
        DiaryUI-->>Farmer: Displays: "Monitor field 2-3 days before next spray" 🟢

    else [Offline / Backend Unavailable Fallback]
        Note over Service,Backend: Device is offline or Backend unreachable
        Service->>LocalDB: 4. Mark event with pendingSync = true
        Service->>LocalDB: 5. Load all remaining historical events
        LocalDB-->>Service: Return event list [Pesticide, Fertilizer, Irrigation]
        Service->>LocalEngine: 6. calculateLocalDecision(events, crop)
        Note over LocalEngine: Analyzes operational sequence deterministically
        LocalEngine->>LocalEngine: 7. Apply Rule: Pesticide recently applied -> Hold sprays
        LocalEngine-->>Service: 8. Return local DecisionRecommendation
        Service-->>DiaryUI: 9. Render 🌱 Next Best Action Card + "Pending Sync ⏳"
        DiaryUI-->>Farmer: Displays: "Monitor field 2-3 days before next spray" 🟡
    end

    opt [Network Restored]
        loop [Sync Pending Queue]
            Service->>Backend: POST /api/farm-diary (Sync pending events)
            Backend-->>Service: HTTP 200 OK (Sync complete)
            Service->>LocalDB: Update pendingSync = false
        end
    end
```

---

## 3. Feature 2: Vision Lab (Crop Disease Scan & Treatment Advisory)

![Vision Lab Disease Diagnosis Fallback Sequence](./images/vision_crop_disease_diagram_1789523390346.jpg)

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 👨‍🌾 Farmer
    participant VisionUI as 🔬 Vision Screen UI
    participant Service as ⚙️ visionService
    participant LocalModel as 🧠 Local Classifier Rules
    participant Cache as 💾 Local Diagnostics Cache
    participant Backend as ☁️ Backend API (/api/vision/analyze)
    participant TFServer as 🤖 TensorFlow/Keras Classifier
    participant Gemini as ✨ Gemini Remediation AI

    Farmer->>VisionUI: 1. Capture Leaf Photo & tap "Analyze"
    VisionUI->>Service: 2. analyzeCropImage(imageUri, crop: "Wheat")
    Service->>Service: 3. Compress & encode image to Base64

    alt [Online Mode — Cloud Classifier]
        Service->>Backend: 4. POST /api/vision/analyze { imageBase64, crop: "Wheat" }
        Backend->>TFServer: 5. Execute Deep Neural Net classification
        TFServer-->>Backend: Return Class: "Yellow Rust", Confidence: 94%
        Backend->>Gemini: 6. Generate precise Chemical & Organic remedies
        Gemini-->>Backend: Return fungicide dosages & safety precautions
        Backend-->>Service: 7. Full CropDiagnosis JSON response
        Service->>Cache: 8. Save diagnosis in local scan history
        Service-->>VisionUI: 9. Render Diagnosis & Treatment Plan
        VisionUI-->>Farmer: Shows: Yellow Rust (94% Conf), Propiconazole 25% EC dosage 🟢

    else [Offline / Network Timeout Fallback]
        Note over Service,Backend: No Internet connection or API timeout
        Service--xBackend: Network Connection Failed
        Service->>LocalModel: 4. Invoke local lightweight symptom classifier
        Note over LocalModel: Evaluates visual color thresholds & crop metadata
        LocalModel->>LocalModel: 5. Match symptoms to regional crop pathogen database
        LocalModel-->>Service: 6. Return deterministic diagnosis + standard organic remedies
        Service->>Cache: 7. Save offline diagnosis record
        Service-->>VisionUI: 8. Render Diagnosis + "Offline Mode" Badge
        VisionUI-->>Farmer: Shows: Suspected Fungal Infection + Neem Oil Spray guide 🔴
    end
```

---

## 4. Feature 3: Voice AI Assistant (Multilingual Vernacular Line)

![Voice AI Assistant Multilingual Fallback Sequence](./images/voice_ai_pipeline_diagram_1789523423497.jpg)

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 👨‍🌾 Farmer
    participant AudioUI as 🎙️ Voice Line UI
    participant VoiceSvc as ⚙️ voiceService
    participant AudioAssets as 💾 Local Audio Cache
    participant Backend as ☁️ Backend API (/api/voice/process)
    participant SarvamSTT as 🗣️ Sarvam Speech-to-Text
    participant Gemini as ✨ Gemini Agro-LLM
    participant SarvamTTS as 🔊 Sarvam Text-to-Speech

    Farmer->>AudioUI: 1. Hold Microphone & Speak ("गेहूं में पहली सिंचाई कब करें?")
    AudioUI->>VoiceSvc: 2. Stop recording & pass audio buffer (.wav)

    alt [Online Mode — Full Cloud Voice Pipeline]
        VoiceSvc->>Backend: 3. POST /api/voice/stt { audioBase64, language: "hi" }
        Backend->>SarvamSTT: 4. Transcribe Hindi speech audio
        SarvamSTT-->>Backend: 5. Text: "गेहूं में पहली सिंचाई कब करें?"
        Backend->>Gemini: 6. Prompt with Farmer context + Query
        Gemini-->>Backend: 7. Response: "बुआई के 21 दिन बाद C.R.I. अवस्था पर सिंचाई करें।"
        Backend->>SarvamTTS: 8. Synthesize Hindi voice audio
        SarvamTTS-->>Backend: 9. Return streaming audio URL / buffer
        Backend-->>VoiceSvc: 10. Return { text: "...", audioUrl: "..." }
        VoiceSvc-->>AudioUI: 11. Play audio response & display Hindi speech bubble
        AudioUI-->>Farmer: Speaks answer out loud + Displays Hindi transcript 🟢

    else [Offline / Voice Gateway Error Fallback]
        Note over VoiceSvc,Backend: Cloud Voice API unavailable or network dropped
        VoiceSvc--xBackend: Request Failed
        VoiceSvc->>AudioAssets: 3. Query offline vernacular Q&A library
        Note over AudioAssets: Matches keywords: "गेहूं", "सिंचाई"
        AudioAssets-->>VoiceSvc: 4. Return offline text advisory + pre-recorded voice prompt
        VoiceSvc-->>AudioUI: 5. Play pre-recorded local audio & show offline transcript
        AudioUI-->>Farmer: Plays local audio response + "Offline Voice Mode" Badge 🟡
    end
```

---

## 5. Feature 4: Mandi Prices & APMC Market Intelligence

![Information Hub Mandi Schemes Weather Fallback Sequence](./images/info_hub_fallback_diagram_1789523480914.jpg)

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 👨‍🌾 Farmer
    participant MandiUI as 🌾 Mandi Screen UI
    participant MandiSvc as ⚙️ mandiData / apiClient
    participant LocalCache as 💾 Mandi Cache (StorageService)
    participant StaticDB as 📁 Static APMC Fallback DB
    participant Backend as ☁️ Backend API (/api/mandi)
    participant Agmarknet as 📊 Govt Agmarknet Portal

    Farmer->>MandiUI: 1. Select State "Uttar Pradesh" & Commodity "Wheat"
    MandiUI->>MandiSvc: 2. fetchMandiPrices({ state: "UP", commodity: "Wheat" })
    MandiSvc->>LocalCache: 3. Check cached APMC rates (TTL: 4 hours)

    alt [Tier 1: Fresh Cache Available]
        LocalCache-->>MandiSvc: Return unexpired cached Mandi records
        MandiSvc-->>MandiUI: Render cached APMC rates
        MandiUI-->>Farmer: Instant display with "Cached Rates" 🟡

    else [Tier 2: Online Fetch from Cloud]
        MandiSvc->>Backend: 4. GET /api/mandi?state=UP&commodity=Wheat
        Backend->>Agmarknet: 5. Fetch daily wholesale arrival rates
        Agmarknet-->>Backend: 6. Return current APMC market records
        Backend-->>MandiSvc: 7. HTTP 200 OK JSON Dataset
        MandiSvc->>LocalCache: 8. Update cache with 4-hour expiration
        MandiSvc-->>MandiUI: 9. Highlight Highest Modal Price Market
        MandiUI-->>Farmer: Live Mandi Cards + Distance in km 🟢

    else [Tier 3: Offline / Server Down Fallback]
        Note over MandiSvc,Backend: Server error or No cellular connectivity
        Backend--xMandiSvc: Network Failure / HTTP 503
        MandiSvc->>StaticDB: 4. Read static regional APMC baseline database
        Note over StaticDB: Bundled baseline rates for UP, Punjab, MP, Haryana
        StaticDB-->>MandiSvc: 5. Return historical regional price benchmarks
        MandiSvc-->>MandiUI: 6. Render baseline rates + "Offline Estimates" Badge
        MandiUI-->>Farmer: Displays reference prices + "Last verified APMC rates" 🔴
    end
```

---

## 6. Feature 5: Government Schemes Navigator

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 👨‍🌾 Farmer
    participant SchemeUI as 🏛️ Schemes Screen UI
    participant Service as ⚙️ apiClient.ts
    participant Cache as 💾 Saved Schemes Cache
    participant LocalRules as 🧠 Local Eligibility Rules
    participant Backend as ☁️ Backend API (/api/schemes)
    participant GovtPortal as 🏛️ National Schemes Database

    Farmer->>SchemeUI: 1. Opens Govt Schemes Tab
    SchemeUI->>Service: 2. fetchMatchingSchemes(farmerProfile)
    Service->>Cache: 3. Check for locally cached scheme list

    alt [Online Mode]
        Service->>Backend: 4. POST /api/schemes/match { landArea: 2.0, state: "UP" }
        Backend->>GovtPortal: 5. Query latest central & state circulars
        GovtPortal-->>Backend: 6. Return active subsidy & welfare schemes
        Backend->>Backend: 7. Evaluate eligibility matrix
        Backend-->>Service: 8. Return matched schemes (PM-Kisan, KCC, PMFBY)
        Service->>Cache: 9. Cache scheme list locally
        Service-->>SchemeUI: 10. Render scheme cards with "100% Eligible" badges
        SchemeUI-->>Farmer: Displays matching schemes + Required Documents 🟢

    else [Offline Fallback Mode]
        Note over Service,Backend: Network disconnected
        Service->>Cache: 4. Read cached schemes
        alt Cache Exists
            Cache-->>Service: Return cached scheme registry
        else Cache Empty
            Service->>LocalRules: 4. Run local offline eligibility rules
            Note over LocalRules: Evaluates land size (<2 ha) and state rules
            LocalRules-->>Service: 5. Return standard schemes (PM-Kisan, KCC)
        end
        Service-->>SchemeUI: 6. Render schemes + "Offline Mode" Badge
        SchemeUI-->>Farmer: Displays eligibility + Offline document checklist 🔴
    end
```

---

## 7. Feature 6: Weather & Microclimate Advisory

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 👨‍🌾 Farmer
    participant WeatherUI as ⛅ Weather Screen UI
    participant Service as ⚙️ apiClient / LocationService
    participant Cache as 💾 Weather Cache
    participant LocalAgRules as 🧠 Local Agronomic Rules
    participant Backend as ☁️ Backend API (/api/weather)
    participant OpenWeather as 🌐 OpenWeather API

    Farmer->>WeatherUI: 1. Opens Weather Screen
    WeatherUI->>Service: 2. getWeatherData(latitude, longitude)
    Service->>Cache: 3. Check 30-minute weather cache

    alt [Online Mode — Live Weather Fetch]
        Service->>Backend: 4. GET /api/weather?lat=25.31&lon=82.97
        Backend->>OpenWeather: 5. Fetch current conditions & 5-day forecast
        OpenWeather-->>Backend: 6. Temp, Wind speed, Humidity, Rain chance %
        Backend->>Backend: 7. Compute spray safety index & irrigation warnings
        Backend-->>Service: 8. Return WeatherData + AgriculturalAdvisory JSON
        Service->>Cache: 9. Save to local cache (TTL: 30 mins)
        Service-->>WeatherUI: 10. Update UI with live weather & badges
        WeatherUI-->>Farmer: Shows: 29°C, Wind: 8 km/h, "Safe Spray Window ✅" 🟢

    else [Offline / Weather API Failure Fallback]
        Note over Service,Backend: Cellular data off or OpenWeather API error
        Service->>Cache: 4. Fetch last recorded weather observation
        Cache-->>Service: 5. Return previous forecast data
        Service->>LocalAgRules: 6. Compute microclimate advisories from cached data
        Note over LocalAgRules: If high humidity & moderate temp -> Alert for fungal risk
        LocalAgRules-->>Service: 7. Return offline operational advisory
        Service-->>WeatherUI: 8. Render cached forecast + "Offline Weather" Badge
        WeatherUI-->>Farmer: Shows: Last cached conditions + Seasonal field advice 🟡
    end
```

---

## 8. Feature 7: Krishi Feed & Community Forum

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 👨‍🌾 Farmer
    participant FeedUI as 📰 Krishi Feed UI
    participant Service as ⚙️ apiClient.ts
    participant LocalDB as 💾 Feed Cache & Outbox
    participant Backend as ☁️ Backend API (/api/feed)
    participant CommunityDB as 👥 Cloud Community DB

    Farmer->>FeedUI: 1. Opens Krishi Feed / Taps "Create Post"
    
    alt [Read Mode — Online vs Offline]
        alt Online
            FeedUI->>Service: fetchFeedPosts({ category: "wheat" })
            Service->>Backend: GET /api/feed/posts?category=wheat
            Backend->>CommunityDB: Query posts & expert answers
            CommunityDB-->>Backend: Return post array
            Backend-->>Service: HTTP 200 OK JSON
            Service->>LocalDB: Cache newest posts
            Service-->>FeedUI: Render feed cards with Verified Badges 🟢
        else Offline
            Note over Service,Backend: Network dropped in field
            Service->>LocalDB: Fetch previously cached articles & posts
            LocalDB-->>Service: Return cached post array
            Service-->>FeedUI: Render feed cards + "Offline Reading Mode" 🟡
        end

    else [Write Mode — Creating Post While Offline]
        Farmer->>FeedUI: 2. Types question & attaches crop leaf photo
        FeedUI->>Service: 3. submitPost({ text, imageUri, crop: "Wheat" })
        Service->>LocalDB: 4. Save post into local Outbox queue { pendingSync: true }
        Service-->>FeedUI: 5. Show post immediately in farmer's feed with "Pending Sync ⏳"
        
        opt [Network Connection Restored]
            loop [Outbox Sync Manager]
                Service->>Backend: 6. POST /api/feed/posts (Multipart Form Data)
                Backend->>CommunityDB: 7. Commit post to cloud database
                Backend-->>Service: 8. HTTP 201 Created { postId: "post_789" }
                Service->>LocalDB: 9. Mark post as synced (remove from Outbox)
                Service-->>FeedUI: 10. Update badge to "Published to Community ✅"
            end
        end
    end
```

---

## 9. Fallback & Connection Matrix Across All Features

| Feature | Primary Online Component | Network Timeout Threshold | Fallback 1 (Cache Tier) | Fallback 2 (Local Engine Tier) | Sync Queue Trigger |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Farm Diary** | `/api/farm-diary/decision` + Gemini AI | 6 seconds | Last computed decision in AsyncStorage | `calculateLocalDecision()` rule engine | `NetInfo` reconnect event |
| **Vision Lab** | `/api/vision/analyze` + TF Server | 10 seconds | Scan history in AsyncStorage | Local visual heuristic rule classifier | Auto-sync on connection |
| **Voice Line** | `/api/voice/process` + Sarvam STT/TTS | 8 seconds | Cached Q&A transcripts | Pre-recorded regional audio assets | N/A (Session-based) |
| **Mandi Rates** | `/api/mandi` + Agmarknet Portal | 6 seconds | 4-Hour TTL local storage cache | Static regional APMC baseline database | 4-Hour TTL expiration |
| **Govt Schemes** | `/api/schemes/match` | 6 seconds | Saved scheme registry | Local Land Size & State eligibility rules | Background periodic check |
| **Weather** | `/api/weather` + OpenWeather | 5 seconds | 30-Minute TTL forecast cache | Local agronomic seasonal rule engine | 30-Minute TTL expiration |
| **Krishi Feed** | `/api/feed/posts` | 6 seconds | Cached news & community posts | Offline circular reading list | Outbox sync on reconnect |

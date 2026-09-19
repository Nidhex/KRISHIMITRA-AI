# Resilient Offline Fallback & Data Sync Architecture

## Overview

KrishiMitra AI is engineered for extreme reliability in rural connectivity environments. Because farmers frequently work in fields with zero or intermittent cellular connectivity (2G/3G drops), the application implements a **Three-Tier Fallback Hierarchy**:

1. **Tier 1 — Live Cloud AI Engine** (Primary: Render Backend + Gemini AI + Sarvam AI)
2. **Tier 2 — Cached Local Storage** (Fallback 1: Async Storage TTL Cache)
3. **Tier 3 — Local Offline Rule & Decision Engine** (Fallback 2: Zero-network offline logic)

## Visual Architecture & Fallback Diagram
![Master Offline Fallback & Sync Flow](./images/fallback_flow_diagram_1789522360955.jpg)

---

## 1. Master Online/Offline Fallback & Execution Flowchart

```mermaid
flowchart TD
    Start(["📱 User Triggers Feature Action"]) --> NetCheck{"🌐 Check Network Connection (NetInfo)"}
    
    %% ONLINE PATH
    NetCheck -->|Online| PrimaryAPI["📡 Send Request via apiClient.ts to Render Backend"]
    
    PrimaryAPI --> ServerCheck{"☁️ Server Response Status"}
    
    ServerCheck -->|HTTP 200 OK| ValidateJSON["✅ Valid Cloud Payload Received"]
    ValidateJSON --> UpdateCache["💾 Write Payload to Local Async Storage Cache"]
    UpdateCache --> RenderOnlineUI["🟢 Render UI with Live Cloud Data (Online Mode)"]
    
    %% SERVER FAILURE / TIMEOUT FALLBACK
    ServerCheck -->|HTTP 5xx / Timeout / Error| FallbackTrigger["⚠️ Primary Cloud API Failed / Timed Out"]
    
    %% OFFLINE PATH
    NetCheck -->|Offline| FallbackTrigger
    
    FallbackTrigger --> ReadCache{"💾 Check Local Cache (Async Storage)"}
    
    ReadCache -->|Unexpired Cache Hit| LoadCacheData["📋 Load Fresh Cached Data"]
    LoadCacheData --> RenderCachedUI["🟡 Render UI from Cache (Cached Offline Mode)"]
    
    ReadCache -->|Cache Miss / Empty| RunLocalEngine["🧠 Execute Local Offline Rule Engine"]
    
    %% LOCAL RULE ENGINE FALLBACKS
    RunLocalEngine --> RuleType{"Feature Type"}
    RuleType -->|Farm Diary| LocalDecision["calculateLocalDecision(): Local Agro-Rules"]
    RuleType -->|Vision Doctor| LocalVision["Local Lightweight Classifier & Static Remedies"]
    RuleType -->|Voice Assistant| LocalVoiceText["Pre-recorded Audio & Vernacular Text Fallback"]
    RuleType -->|Mandi Rates| LocalMandi["Static Regional APMC Price Database"]
    RuleType -->|Weather| LocalWeatherAlert["Cached Weather Advisory Metrics"]

    LocalDecision --> QueueMutation{"Was this a Mutation (Create/Delete)?"}
    LocalVision --> RenderOfflineUI["🔴 Render UI with Local Offline Engine (Offline Mode)"]
    LocalVoiceText --> RenderOfflineUI
    LocalMandi --> RenderOfflineUI
    LocalWeatherAlert --> RenderOfflineUI

    QueueMutation -->|Yes| MarkPending["✏️ Save to Local Storage with pendingSync = true"]
    QueueMutation -->|No| RenderOfflineUI

    MarkPending --> RenderOfflineUI
    RenderOfflineUI --> MonitorSync["🔄 Network Monitor Listens for Connectivity Re-establishment"]

    %% RECOVERY & SYNC
    MonitorSync --> ConnectionRestored{"Network Reconnected?"}
    ConnectionRestored -->|Yes| SyncQueue["⚡ Trigger Sync Engine: Push pendingSync items to Backend"]
    SyncQueue --> BackendAck["✅ Backend Returns HTTP 200 Sync Success"]
    BackendAck --> ClearPending["Clean Flags (pendingSync = false) & Refresh UI"]
```

---

## 2. API Request Lifecycle & Multi-Tier Fallback Sequence Diagram

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
    participant AI as 🤖 Gemini / Sarvam AI

    Farmer->>UI: Request Feature Action (e.g. Next Best Action / Mandi / Vision)
    UI->>Client: executeApiRequest(endpoint, payload)
    Client->>Net: fetchConnectivityStatus()
    Net-->>Client: Return isConnected (true / false)

    alt Scenario A: Network Connected & Cloud API Healthy
        Client->>Backend: HTTP POST / GET Payload (Timeout: 8s)
        Backend->>AI: Heavy Model Inference / External Data Query
        AI-->>Backend: Return Response Payload
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

## 3. Offline Queue & Background Auto-Synchronization Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 👨‍🌾 Farmer
    participant UI as 📱 Diary UI
    participant Service as ⚙️ diaryService
    participant LocalDB as 💾 Async Storage
    participant SyncEngine as 🔄 Background Sync Manager
    participant Backend as ☁️ Render Backend API

    note over Farmer, LocalDB: PHASE 1: OFFLINE MUTATION RECORDING
    Farmer->>UI: Create Diary Event (Pesticide spray) while in field (Offline)
    UI->>Service: saveEvent(pestEventPayload)
    Service->>Service: Assign Local ID "off_1789509_x9z"
    Service->>LocalDB: Save event with { pendingSync: true }
    Service-->>UI: Event saved locally + Trigger Local Decision Engine
    UI-->>Farmer: Display new event immediately with "Pending Sync ⏳" badge

    note over SyncEngine, Backend: PHASE 2: AUTOMATIC RECOVERY & SYNC
    SyncEngine->>SyncEngine: Detect NetInfo status change (Offline ➡️ Online)
    SyncEngine->>LocalDB: Fetch all items where pendingSync == true
    LocalDB-->>SyncEngine: Return [off_1789509_x9z]

    loop For Each Pending Event
        SyncEngine->>Backend: POST /api/farm-diary (Sync Payload)
        Backend->>Backend: Insert into Cloud Database
        Backend-->>SyncEngine: HTTP 201 Created { cloudId: "db_ev_456" }
        SyncEngine->>LocalDB: Update event { id: "db_ev_456", pendingSync: false }
    end

    SyncEngine->>UI: Notify Sync Complete Event
    UI-->>Farmer: Update UI badge to "Synced with Cloud ✅"
```

---

## Fallback System Comparison Matrix

| Feature | Primary (Online Cloud API) | Fallback 1 (Cached Local Storage) | Fallback 2 (Local Offline Engine) |
| :--- | :--- | :--- | :--- |
| **Farm Diary & Decision Engine** | Gemini AI Contextual Next Best Action | Last computed decision & historical events | `calculateLocalDecision()` deterministic rule engine |
| **Vision Crop Doctor** | Cloud TensorFlow / Keras + Gemini Remedies | Saved past scan diagnoses | Local lightweight classifier & organic remedies |
| **Voice AI Line** | Sarvam STT/TTS + Gemini LLM Speech | Local transcript history | Local pre-recorded audio assets & vernacular text |
| **Mandi APMC Rates** | Daily Agmarknet Govt Live Feed | Cached APMC prices (4-hour TTL) | Static regional APMC price database |
| **Govt Schemes** | Real-time Central/State Govt Rules | Saved eligible schemes registry | Local eligibility matrix (Land size & State rules) |
| **Weather Advisory** | Hyper-local OpenWeather API | Cached 5-day weather forecast | Microclimate operational rule calculation |
| **Krishi Feed** | Live Community Q&A & News Feed | Offline cached feed articles | Local extension advisory circulars |

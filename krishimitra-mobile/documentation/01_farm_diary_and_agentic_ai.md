# Farm Diary & Agentic AI Decision Engine

## Overview

The **Farm Diary & Agentic AI Decision Engine** records farmer field operations (fertilizer, irrigation, pesticide, sowing, harvest, expenses) into an immutable **Farm Memory**. It analyzes historical events, current crop growth stage, and microclimate context to generate dynamic **Next Best Action** recommendations.

## Visual UML Sequence & Fallback Diagram
![Farm Diary & Agentic AI Decision Engine](./images/farm_diary_decision_diagram_1789523354300.jpg)

---

## 1. Event Creation & Data Preservation Flowchart

```mermaid
flowchart TD
    Start(["👨‍🌾 Farmer Opens Farm Diary"]) --> ActionChoice{"Choose Entry Method"}
    
    ActionChoice -->|Manual Entry| FormInput["📝 Enter Details (Type, Crop, Qty, Unit, Area, Date)"]
    ActionChoice -->|Voice Entry| VoiceInput["🎙️ Speak Activity (Hindi / English / Vernacular)"]
    
    VoiceInput --> VoiceExtract["📡 Send to /api/farm-diary/extract"]
    VoiceExtract --> ExtractParse["Parse Canonical JSON Draft (EventType, Crop, Qty, Unit)"]
    ExtractParse --> FormInput

    FormInput --> Validate{"Validate Schema"}
    Validate -->|Valid| AssignID["🆔 Generate Unique ID (off_timestamp_rand)"]
    AssignID --> PreserveType["🔒 Freeze EventType (fertilizer / irrigation / pesticide / harvest / etc.)"]
    
    PreserveType --> SaveLocal["💾 Save to Local Farm Memory Array"]
    SaveLocal --> PostBackend["📡 POST /api/farm-diary to Render Backend"]
    
    PostBackend -->|Success| MarkSynced["✅ Mark pendingSync = false"]
    PostBackend -->|Offline/Error| MarkPending["⚠️ Mark pendingSync = true (Queue for sync)"]

    MarkSynced --> TriggerRecompute["⚡ Trigger Automatic Recomputation"]
    MarkPending --> TriggerRecompute

    TriggerRecompute --> FetchMemory["🧠 Reload Full Farmer History"]
    FetchMemory --> ExecEngine["⚙️ Run Agentic AI Decision Algorithm"]
    ExecEngine --> UpdateUI["🌱 Render Next Best Action Card on Screen"]
```

---

## 2. Event Category Isolation System

```mermaid
classDiagram
    class FarmDiaryEvent {
        +string id
        +string farmerId
        +string fieldId
        +string crop
        +string eventType
        +string date
        +string title
        +string description
        +number quantity
        +string unit
        +number area
        +string areaUnit
        +number amount
        +boolean pendingSync
    }

    class AllowedEventTypes {
        <<enumeration>>
        FERTILIZER
        IRRIGATION
        PESTICIDE
        DISEASE
        PLANTING
        HARVEST
        EXPENSE
        INCOME
        OTHER
    }

    class DecisionRecommendation {
        +string action
        +string priority
        +string reason
        +string crop
        +BasedOnItem[] basedOn
        +string timing
        +number confidence
        +string disclaimer
    }

    FarmDiaryEvent --> AllowedEventTypes : strictly typed
    FarmDiaryEvent ..> DecisionRecommendation : feeds memory context
```

---

## 3. Agentic Next Best Action Decision Loop (State Machine)

```mermaid
stateDiagram-v2
    [*] --> EmptyState : No Diary Events

    state EmptyState {
        [*] --> DisplayTruthfulMessage : "Start recording your daily farm activities"
    }

    EmptyState --> EventAdded : Farmer saves activity

    state ActiveMemory {
        [*] --> ParseHistory : Read chronological events
        ParseHistory --> CheckNewest : Identify latest operation
        
        CheckNewest --> PesticideApplied : Latest == pesticide
        CheckNewest --> FertilizerApplied : Latest == fertilizer
        CheckNewest --> IrrigationApplied : Latest == irrigation
        CheckNewest --> HarvestRecorded : Latest == harvest

        PesticideApplied --> RulePesticide : "Monitor field 2-3 days before next spray"
        FertilizerApplied --> CheckIrrigation : Was field irrigated?
        
        CheckIrrigation --> IrrigationDone : Yes -> "Allow root nitrogen uptake, postpone top-dressing"
        CheckIrrigation --> IrrigationNeeded : No -> "Schedule light irrigation to assist breakdown"
        
        IrrigationApplied --> CheckPesticide : Follows recent pesticide?
        CheckPesticide --> PostPesticide : Yes -> "Check spray was not washed off"
        CheckPesticide --> NormalWater : No -> "Monitor soil moisture & weed growth"

        HarvestRecorded --> RuleHarvest : "Sun-dry harvest to <12% moisture & check Mandi prices"
    }

    ActiveMemory --> DecisionGenerated : Formulate Action + Why + Based On + Timing + Confidence
    DecisionGenerated --> DisplayCard : Render 🌱 Next Best Action Card

    EventAdded --> ActiveMemory : Trigger Recomputation
    EventDeleted --> ActiveMemory : Trigger Recomputation
```

---

## 4. Sequence Diagram: Event Deletion & Recommendation Recalculation

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 👨‍🌾 Farmer
    participant UI as 📱 Diary Screen UI
    participant Service as ⚙️ diaryService
    participant Memory as 💾 Local / Remote Farm Memory
    participant Engine as 🧠 Decision Engine

    Farmer->>UI: Tap Delete Icon on Event Card (ID: ev_123)
    UI->>Service: deleteEvent("ev_123", farmerId)
    Service->>Memory: Remove "ev_123" from event store
    Memory-->>Service: Event deleted confirmation
    Service->>Service: Reload remaining events
    Service->>Engine: getNextBestAction(farmerId, currentCropFilter)
    Engine->>Engine: Re-evaluate remaining operational context
    Engine-->>Service: Return newly computed DecisionRecommendation
    Service-->>UI: Update recommendation state
    UI-->>Farmer: Screen updates automatically with fresh Next Best Action card
```

---

## Summary of Guarantees

1. **Category Isolation**: An event with `eventType = "pesticide"` remains permanently classified as `pesticide`. It can never morph into `disease` or `fertilizer`.
2. **Dynamic Context**: Recommendations are dynamically computed based on the exact sequence of historical events (e.g. Fertilizer followed by Irrigation vs. Pesticide followed by Heavy Rain).
3. **No Fake Fallbacks**: If zero events exist, the system explicitly reports insufficient data rather than injecting hardcoded demo events.

# KrishiMitra AI — Complete Visual Diagram Gallery for ALL Features

This document collects high-resolution **UML Sequence & Architecture Diagram Images** for **every feature** in the KrishiMitra AI platform. Each diagram visually details:
- How the farmer and mobile app connect across components.
- How the **Live Online Path** executes.
- How the **Offline / Timeout Fallback Path** protects against network errors.
- How the **Background Sync Loop** recovers data upon network restoration.

---

## Table of Visual Diagrams

1. [Master System Architecture & Fallback Topology](#1-master-system-architecture--fallback-topology)
2. [Farm Diary & Agentic AI Decision Engine](#2-farm-diary--agentic-ai-decision-engine)
3. [Vision Lab — Crop Disease Diagnosis & Treatment Advisory](#3-vision-lab--crop-disease-diagnosis--treatment-advisory)
4. [Voice AI Assistant — Multilingual Vernacular Voice Line](#4-voice-ai-assistant--multilingual-vernacular-voice-line)
5. [Mandi Prices & APMC Market Intelligence](#5-mandi-prices--apmc-market-intelligence)
6. [Government Schemes Navigator](#6-government-schemes-navigator)
7. [Weather & Microclimate Operational Advisory](#7-weather--microclimate-operational-advisory)
8. [Krishi Feed & Community Forum](#8-krishi-feed--community-forum)
9. [Information Hub Consolidated Overview](#9-information-hub-consolidated-overview)

---

## 1. Master System Architecture & Fallback Topology

![Master System Architecture & Fallback Topology](./images/fallback_flow_diagram_1789522360955.jpg)

### Technical Description
- **Participants**: Farmer, Mobile App, Local Cache (Async Storage), Local Rule Engine, Backend Server (Render), Cloud AI (Gemini / Sarvam).
- **Online Mode**: Client dispatches requests to Render Backend, which coordinates Gemini and Sarvam AI models for inference, returning consolidated results.
- **Offline Fallback**: When the cloud API times out (>8s) or network is dropped, the app queries local cache. If missing, it invokes the Local Rule Engine for deterministic recommendations.
- **Auto-Sync Loop**: Restored network triggers automatic push of queued mutations (`pendingSync: true`) to the cloud database.

---

## 2. Farm Diary & Agentic AI Decision Engine

![Farm Diary & Agentic AI Decision Engine](./images/farm_diary_decision_diagram_1789523354300.jpg)

### Technical Description
- **Participants**: Farmer, Farm Diary UI, Async Storage, Local Rule Engine, Backend Server, Gemini AI.
- **Online Mode**: Farmer saves an activity (pesticide/fertilizer/irrigation). Backend evaluates full historical sequence with Gemini AI to generate a contextual Next Best Action card.
- **Offline Fallback**: Network unavailability triggers `calculateLocalDecision()`. Deterministic agronomic rules (e.g. recent pesticide application requires 2-3 days monitoring before spraying again) run entirely on-device.
- **Auto-Sync**: Queued diary events sync seamlessly upon network reconnection.

---

## 3. Vision Lab — Crop Disease Diagnosis & Treatment Advisory

![Vision Lab — Crop Disease Diagnosis & Treatment Advisory](./images/vision_crop_disease_diagram_1789523390346.jpg)

### Technical Description
- **Participants**: Farmer, Camera UI, Base64 Encoder, Local Symptom Model, Backend Server, TensorFlow Model.
- **Online Mode**: Leaf photo is captured, compressed, and sent to the cloud TensorFlow/Keras neural network classifier. Returns disease class (e.g. Yellow Rust, 94% confidence) with Gemini chemical remedies (pesticide/fungicide dosage per acre).
- **Offline Fallback**: Falls back to the local symptom heuristic model and regional organic remedies (Neem oil, biological controls).

---

## 4. Voice AI Assistant — Multilingual Vernacular Voice Line

![Voice AI Assistant — Multilingual Vernacular Voice Line](./images/voice_ai_pipeline_diagram_1789523423497.jpg)

### Technical Description
- **Participants**: Farmer, Voice Line UI, Local Audio Assets, Backend Server, Sarvam AI (STT/TTS), Gemini Agro-LLM.
- **Online Mode**: Natural voice input (Hindi, Marathi, Punjabi, Gujarati, etc.) is transcribed via Sarvam AI STT, processed with Gemini agro-context reasoning, and spoken back using Sarvam AI synthetic voice.
- **Offline Fallback**: Pre-recorded local vernacular audio prompts and keyword-matched agronomic text responses are played directly from local assets.

---

## 5. Mandi Prices & APMC Market Intelligence

![Mandi Prices & APMC Market Intelligence](./images/mandi_prices_market_diagram_1789523811409.jpg)

### Technical Description
- **Participants**: Farmer, Mandi UI Screen, GPS Location Service, Mandi Cache (4h TTL), Backend Gateway, Govt Agmarknet API.
- **Online Mode**: Reads live wholesale commodity arrival rates, computes Haversine distance from the farmer's GPS coordinates, and tags the market providing the highest financial return.
- **Offline Fallback**: Serves unexpired local cache (4-hour TTL) or falls back to the static regional APMC baseline price database.

---

## 6. Government Schemes Navigator

![Government Schemes Navigator](./images/schemes_navigator_diagram_1789523926753.jpg)

### Technical Description
- **Participants**: Farmer, Schemes Screen UI, Farmer Profile Store, Scheme Rules Engine, Backend Server, National Schemes API.
- **Online Mode**: Evaluates farmer profile (land size, state, crop type, category) against active national circulars (PM-Kisan, KCC, PMFBY) to render 100% eligibility badges.
- **Offline Fallback**: Evaluates eligibility on-device using bundled land-holding rules and displays complete required document checklists.

---

## 7. Weather & Microclimate Operational Advisory

![Weather & Microclimate Operational Advisory](./images/weather_advisory_diagram_1789524005014.jpg)

### Technical Description
- **Participants**: Farmer, Weather Screen UI, Location Service, Weather Cache (30m TTL), Backend Gateway, OpenWeather API.
- **Online Mode**: Retrieves hyper-local temperature, humidity, precipitation probability, and wind speed. Computes pesticide spray safety index and rain warnings.
- **Offline Fallback**: Serves 30-minute cached forecast or synthesizes seasonal agronomic microclimate guidance.

---

## 8. Krishi Feed & Community Forum

![Krishi Feed & Community Forum](./images/krishi_feed_community_diagram_1789524026997.jpg)

### Technical Description
- **Participants**: Farmer, Feed Screen UI, Local Outbox DB, Backend Server, KVK Expert Review, Community Database.
- **Online Mode**: Displays real-time community questions, answers, verified extension badges, and upvotes.
- **Offline Fallback**: Questions and crop photos authored offline are placed in the Local Outbox queue (`pendingSync: true`). The reconnection loop automatically commits queued posts to the community cloud database.

---

## 9. Information Hub Consolidated Overview

![Information Hub Consolidated Overview](./images/info_hub_fallback_diagram_1789523480914.jpg)

### Technical Description
Consolidated architectural flow displaying how the **Information Hub** tabs (Mandi Prices, Schemes, Weather, Feed) unify data fetching, local caching, and offline fallbacks under a single resilient mobile client interface.

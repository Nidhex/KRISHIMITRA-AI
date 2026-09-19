# Voice AI Assistant — Multilingual Voice Line

## Overview

The **Voice AI Assistant (KrishiMitra Voice Line)** allows farmers to speak naturally in their native language (Hindi, Punjabi, Marathi, Gujarati, Tamil, Telugu, English, etc.) to ask agricultural questions, log diary entries, or check market prices.

## Visual UML Sequence & Fallback Diagram
![Voice AI Assistant Multilingual Fallback Sequence](./images/voice_ai_pipeline_diagram_1789523423497.jpg)

---

## 1. Voice Assistant Interaction Flowchart

```mermaid
flowchart TD
    Start(["🎙️ Farmer Opens Voice Line Modal"]) --> LangSelect["🌐 Select Native Language (Hindi / Vernacular)"]
    
    LangSelect --> PressRecord["🔴 Tap Microphone Button (Start Recording)"]
    PressRecord --> RecordAudio["🎙️ Capture Audio Buffer via expo-av / expo-audio"]
    
    RecordAudio --> StopRecord["⏹️ Tap Stop / Auto silence detection"]
    StopRecord --> SendBackend["📡 Send Audio Buffer to /api/voice/process"]

    SendBackend --> STT["🗣️ Sarvam AI / Speech-to-Text Engine"]
    STT --> TranscribedText["📝 Return Transcribed Text String"]

    TranscribedText --> ContextInjection["🧠 Inject Farm Memory Context (Farmer's Crops, Recent Diary Events, Location)"]
    ContextInjection --> GeminiAI["✨ Query Google Gemini Agro-LLM Engine"]

    GeminiAI --> AnswerGen["💡 Generate Structured Agricultural Response in Selected Language"]

    AnswerGen --> DualOutput{"Output Handlers"}
    
    DualOutput -->|Text| RenderUI["📱 Render Chat Speech Bubble & Suggested Follow-up Buttons"]
    DualOutput -->|Audio| TTS["🔊 Sarvam AI Text-to-Speech Synthesizer"]

    TTS --> PlayAudio["🔊 Stream & Play Audio Response via expo-av Player"]
    PlayAudio --> Finish(["✅ Audio Playback Finished"])
```

---

## 2. Voice Audio Pipeline Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 👨‍🌾 Farmer
    participant App as 📱 Mobile Audio Engine
    participant VoiceSvc as ⚙️ voiceService
    participant Backend as ☁️ Render Backend Proxy
    participant Sarvam as 🔊 Sarvam AI (Voice STT/TTS)
    participant Gemini as ✨ Gemini AI Model

    Farmer->>App: Press & Speak ("गेहूं में खाद कब डालें?")
    App->>App: Record Audio (.wav / .m4a)
    Farmer->>App: Release Record Button
    App->>VoiceSvc: processVoiceQuery(audioUri, language: "hi-IN")
    
    VoiceSvc->>Backend: POST /api/voice/stt (Base64 Audio Data)
    Backend->>Sarvam: Process Speech-to-Text (Hindi Audio)
    Sarvam-->>Backend: Transcribed: "गेहूं में खाद कब डालें?"
    
    Backend->>Gemini: Prompt with Agro-Context + Query
    Gemini-->>Backend: Response: "आपकी गेहूं की फसल बोए 21 दिन हो चुके हैं, C.R.I. अवस्था पर 40 kg यूरिया प्रति एकड़ दें।"
    
    Backend->>Sarvam: POST /api/voice/tts (Response Text + Hindi Voice Model)
    Sarvam-->>Backend: Return Audio Stream URL / Buffer
    
    Backend-->>VoiceSvc: Return { text: "...", audioUrl: "...", language: "hi" }
    VoiceSvc->>App: Play Audio Response & Display Text Transcript
    App-->>Farmer: Speaks answer out loud + Displays Hindi text transcript
```

---

## 3. Multilingual Intent & Language Resolution Matrix

```mermaid
flowchart LR
    subgraph VernacularInputs["Vernacular Voice / Text Inputs"]
        In1["Hindi: गेहूं में कौन सा कीटनाशक छिड़कें?"]
        In2["English: Which pesticide for wheat?"]
        In3["Hinglish: Wheat me pesticide konsa dale?"]
    end

    subgraph IntentResolver["Canonical Intent & Entity Parser"]
        Intent["Intent: QUERY_PESTICIDE_ADVISORY"]
        Crop["Crop: Wheat"]
        Category["Category: pesticide"]
    end

    subgraph StructuredResponse["Structured Response Engine"]
        Advice["Response: Recommended Neem-based bio-pesticide or Chlorpyrifos 20% EC"]
    end

    In1 --> IntentResolver
    In2 --> IntentResolver
    In3 --> IntentResolver

    IntentResolver --> StructuredResponse
    StructuredResponse --> OutputSpeech["🔊 Text-to-Speech Engine (Target Language)"]
```

---

## Key Voice Architecture Rules

1. **Zero Secret Exposure**: The mobile app NEVER stores `SARVAM_API_KEY` or `GEMINI_API_KEY`. All voice operations route strictly through the backend gateway `/api/voice/*`.
2. **Offline Fallback Audio**: If the remote voice service is unavailable or offline, pre-recorded local audio assets and text transcript fallbacks are used automatically.

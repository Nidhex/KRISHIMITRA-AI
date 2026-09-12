# KrishiMitra AI — Offline Chatbot Implementation Report

## Overview
This document details the architectural design, implementation details, caching strategy, fallback logic, and verification results for the **Offline Agricultural Chatbot** in **KrishiMitra AI (`farmer_ai`)**.

The chatbot allows farmers in rural areas with intermittent or zero internet connectivity to ask agricultural questions in **11 Indian languages** (including Devanagari script, Romanized Hinglish, Gujlish, etc.) and receive accurate, grounded, farmer-friendly guidance straight from pre-cached local agricultural knowledge.

---

## 1. Architecture

```
                       ┌──────────────────────────────────────┐
                       │          User Question Input         │
                       └──────────────────┬───────────────────┘
                                          │
                        ┌─────────────────┴─────────────────┐
                        │        navigator.onLine ?         │
                        └────────┬─────────────────┬────────┘
                                 │                 │
                           YES (Online)         NO (Offline)
                                 │                 │
            ┌────────────────────┴───┐             │
            │   POST /api/chat       │             │
            │ (Sarvam AI/Gemini)     │             │
            └──────────┬─────────────┘             │
                       │                           │
                   SUCCESS ?                       │
                  /        \                       │
              YES            NO (Fetch Failed)     │
               │              │                    │
        [Return AI]   [Fallback to Local RAG] ◄────┘
                              │
             ┌────────────────┴──────────────────┐
             │       js/offlineRAG.js            │
             │   (Browser RAG Search Engine)     │
             └────────────────┬──────────────────┘
                              │
             ┌────────────────┴──────────────────┐
             │    js/offline-knowledge.json      │
             │ (Pre-cached 9-domain DB Bundle)   │
             └────────────────┬──────────────────┘
                              │
             ┌────────────────┴──────────────────┐
             │  📴 Offline AI Response Rendered  │
             └───────────────────────────────────┘
```

---

## 2. Source-of-Truth Knowledge Files

The browser offline knowledge bundle (`js/offline-knowledge.json`) is automatically generated at build time via `scripts/build-offline-knowledge.js` from the existing source-of-truth JSON database files:

- `database/crops/crops.json` (Crop varieties, mandi prices, recommendations)
- `database/diseases/diseases.json` (Plant disease symptoms, organic & chemical treatments, preventive measures)
- `database/schemes/schemes.json` (Government schemes: PM-Kisan, PMFBY, PM-KUSUM, eligibility & benefits)
- `database/weather/weather.json` (Weather advisory conditions & code mappings)
- `database/soil/soil.json` (Soil types: Alluvial, Black Clayey, moisture & fertilizer advisories)
- `database/fertilizers/fertilizers.json` (Urea, DAP, Organic Compost, Zinc Sulphate dosages)
- `database/pesticides/pesticides.json` (Tricyclazole, Imidacloprid, Mancozeb, Neem Oil application guidelines)
- `database/mandi/mandi.json` (APMC mandi prices & benchmarks)
- `database/faq/faq.json` (Common farmer questions & voice responses)

---

## 3. Files Created & Modified

### Files Created:
1. `scripts/build-offline-knowledge.js` — Build script to bundle `database/*/*.json` into `js/offline-knowledge.json`.
2. `js/offline-knowledge.json` — Static browser-safe 9-domain knowledge bundle (44 records total).
3. `js/offlineRAG.js` — Browser RAG engine supporting language detection, keyword extraction, synonyms, domain routing, and result formatting.
4. `tests/test_offline_chat.js` — Automated test suite with 18 comprehensive tests.
5. `KRISHIMITRA_OFFLINE_CHAT_IMPLEMENTATION.md` — Technical implementation & verification report.

### Files Modified:
1. `database/diseases/diseases.json` — Added explicit records for Wheat Yellow Rust / Yellow Leaves (`disease-wheat-yellow-rust`) and Aphids (`disease-aphid-pest`).
2. `js/gemmaChat.js` — Added `navigator.onLine` bypass, fetch failure fallback, and `📴 Offline AI` badge rendering.
3. `js/offlineStatus.js` — Updated status banner text for online vs offline connection states.
4. `index.html` — Added `<script src="js/offlineRAG.js"></script>` before `gemmaChat.js`.
5. `service-worker.js` — Added `/js/offlineRAG.js` and `/js/offline-knowledge.json` to `STATIC_ASSETS` and updated static cache version to `krishimitra-static-v3`.

---

## 4. Key Features & Design Rules

1. **Zero Network Overhead in Offline Mode**:
   When `navigator.onLine === false`, `gemmaChat.js` skips making HTTP requests to `/api/chat` completely.
2. **Backend Failure Fallback**:
   If `navigator.onLine` is true but `/api/chat` fails due to server shutdown, timeout, or network glitch, the frontend smoothly falls back to `js/offlineRAG.js` without showing generic errors.
3. **No Hallucinations / Honest Fallback**:
   If an unknown or non-agricultural question is asked while offline, the system honestly responds:
   `"📴 I’m offline and I couldn't find enough information in my local agricultural knowledge base to answer this accurately. Please reconnect to use the full AI assistant."`
4. **No Fake Generative AI**:
   Offline responses clearly state:
   `📴 Offline AI — Answer from KrishiMitra's local agricultural knowledge`
   and display an `📴 Offline AI (Local Knowledge)` provider badge.

---

## 5. Automated Test Results

Executed via: `node tests/test_offline_chat.js`

```
==================================================
  KrishiMitra AI — Offline Chat Automated Test Suite
==================================================

  ✓ [PASS] Test A: Offline Knowledge File Exists & Parsable
  ✓ [PASS] Test B: Offline Chat Routing (Returns Local RAG Output)
  ✓ [PASS] Test C: Backend Unavailable Fallback Simulation
  ✓ [PASS] Test D: Hindi Query ("गेहूं में पीली पत्तियां क्यों हो रही हैं?")
  ✓ [PASS] Test E: English Query ("Why are wheat leaves turning yellow?")
  ✓ [PASS] Test F: Hinglish Query ("black soil ke liye kaunsa fertilizer use kare?")
  ✓ [PASS] Test G: Crop Domain Query ("wheat lokwan price recommendation")
  ✓ [PASS] Test H: Disease Domain Query ("aphid kaise control kare?")
  ✓ [PASS] Test I: Fertilizer Domain Query ("urea dose for wheat")
  ✓ [PASS] Test J: Soil Domain Query ("mitti ki janch kaise kare?")
  ✓ [PASS] Test K: Pesticide Domain Query ("tricyclazole dose rice blast")
  ✓ [PASS] Test L: FAQ Query ("What is PM Kusum scheme?")
  ✓ [PASS] Test M: Unknown Query Honest Fallback (No Invention/Hallucination)
  ✓ [PASS] Test N: Online -> Offline -> Online Transition Handling
  ✓ [PASS] Test O: Service Worker Caching Registration for Offline Bundle
  ✓ [PASS] Test P: No API Request in Offline Mode Check
  ✓ [PASS] Test Q: Response Quality & Formatting
  ✓ [PASS] Test R: Farmer Profile Context Integration

--------------------------------------------------
  AUTOMATED TEST SUMMARY: 18 PASSED / 0 FAILED
--------------------------------------------------
```

---

## 6. Verification Summary Matrix

| Verification Item | Status | Result |
| :--- | :---: | :--- |
| Online Chat | PASS | `/api/chat` called normally when online |
| Offline Chat | PASS | Returns local RAG response from bundled JSON |
| Backend Failure Fallback | PASS | Smooth fallback to local RAG when server is down |
| Hindi Query Handling | PASS | Accurately parses Devanagari script queries |
| English Query Handling | PASS | Accurately processes English agricultural terms |
| Hinglish Query Handling | PASS | Maps Romanized terms (e.g. `peeli`, `patte`, `khad`, `dawa`) |
| Disease Domain Search | PASS | Returns symptoms, organic & chemical treatments |
| Crop Domain Search | PASS | Returns crop details, mandi prices & market advice |
| Fertilizer Domain Search | PASS | Returns Urea, DAP & organic compost recommendations |
| Soil Domain Search | PASS | Returns soil type, health score & crop recommendations |
| Pesticide Domain Search | PASS | Returns chemical & bio-pesticide application details |
| Unknown Query Fallback | PASS | Honest response, zero hallucination |
| Service Worker Cache | PASS | `offline-knowledge.json` & `offlineRAG.js` cached cache-first |
| No Network Request Offline | PASS | Zero network traffic in offline mode |
| Transition Handling | PASS | Smooth Online -> Offline -> Online switching |

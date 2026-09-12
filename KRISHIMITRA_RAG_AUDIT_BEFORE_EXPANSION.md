# KrishiMitra AI — Offline RAG Audit Before Knowledge Expansion

## 1. Executive Summary & Current Architecture

KrishiMitra AI (`farmer_ai`) uses an offline-first, dual-layer RAG architecture:
- **Online Layer**: Frontend UI → `/api/chat` → Sarvam AI (`sarvam-105b`) → Gemini (`gemini-3.5-flash`) → Local Ollama (`gemma3`) → Local Backend RAG.
- **Offline Layer**: Frontend UI → `js/gemmaChat.js` → `js/offlineRAG.js` → `js/offline-knowledge-bundle.js` (`window.KRISHI_OFFLINE_KNOWLEDGE_BUNDLE`) / `js/offline-knowledge.json` → Local Agricultural Answer (Zero network requests).

---

## 2. Current Record Counts by Domain

| Domain | File Path | Record Count | Primary Topics Covered |
| :--- | :--- | :---: | :--- |
| **Crops** | `database/crops/crops.json` | 5 | Paddy (Basmati), Wheat (Lokwan), Tomato (Desi), Potato (Jyoti), Mustard Seed |
| **Diseases** | `database/diseases/diseases.json` | 5 | Rice Blast, Cotton Leaf Curl, Tomato Early Blight, Wheat Yellow Rust, Aphids |
| **Schemes** | `database/schemes/schemes.json` | 8 | PM-Kisan, PMFBY, PM-KUSUM, Soil Health Card, PKVY, SMAM, PDMC, Rythu Bandhu |
| **Weather** | `database/weather/weather.json` | 4 | Light Rain Advisory, Heavy Rain Advisory, High Temp, Low Temp |
| **Soil** | `database/soil/soil.json` | 2 | Alluvial Clay-Loam Soil (Domat Mitti), Black Clayey Soil (Kaali Mitti) |
| **Fertilizers** | `database/fertilizers/fertilizers.json` | 4 | Urea (Nitrogen), DAP (Phosphorus), Organic Cow Compost, Zinc Sulphate |
| **Pesticides** | `database/pesticides/pesticides.json` | 5 | Tricyclazole 75 WP, Neem Oil 3000 ppm, Imidacloprid 17.8 SL, Mancozeb 75 WP, Trichoderma |
| **Mandi** | `database/mandi/mandi.json` | 3 | Kishanpur Mandi, Laxmipur APMC, Gorakhpur Sadar Mandi |
| **FAQ** | `database/faq/faq.json` | 8 | Mandi Wheat Price, Rice Blast Cure, PM Kusum, Weather Advisory, Soil Advisory, PM Kisan, Paddy Price, Tomato Price |
| **TOTAL** | **9 Domains** | **44 Records** | — |

---

## 3. Domain Coverage Analysis & Missing Topics

1. **Crops (5 records)**:
   - *Existing*: Wheat, Paddy, Tomato, Potato, Mustard.
   - *Missing*: Maize, Cotton, Soybean, Chickpea (Chana), Pigeon Pea (Arhar/Tur), Lentil (Masoor), Groundnut, Onion, Garlic, Chilli, Brinjal, Okra, Cabbage, Cauliflower, Pea, Sugarcane, Bajra, Jowar, Ragi, Turmeric, Ginger, Banana, Mango, Guava, Papaya, Pomegranate, Grapes, Citrus, Coconut, Tea, Coffee.
2. **Plant Diseases & Pests (10 records combined)**:
   - *Existing*: Rice Blast, Cotton Leaf Curl, Tomato Early Blight, Wheat Yellow Rust, Aphids, 5 chemical/organic pesticide entries.
   - *Missing*: Wheat Brown/Black Rust, Loose Smut, Rice Bacterial Leaf Blight, Sheath Blight, False Smut, Stem Borer, Leaf Folder, Brown Planthopper, Fall Armyworm, Fruit Borer, Pod Borer, Termite, Cutworm, Whitefly, Thrips, Mealybug, Jassid, Tomato Late Blight, Potato Black Scurf, Chilli Leaf Curl, Brinjal Wilt, Okra Yellow Vein Mosaic, Sugarcane Red Rot, Citrus Canker, Mango Anthracnose.
3. **Soil & Amendments (2 records)**:
   - *Existing*: Alluvial Soil, Black Soil.
   - *Missing*: Red Soil, Laterite Soil, Sandy Soil, Clay Soil, Loamy Soil, Saline Soil, Alkaline Soil, Acidic Soil, Sodic Soil, Soil pH management, Gypsum/Lime application, Organic Matter enhancement.
4. **Fertilizers & Nutrients (4 records)**:
   - *Existing*: Urea, DAP, Organic Compost, Zinc.
   - *Missing*: MOP (Muriate of Potash), SSP (Single Super Phosphate), NPK 19:19:19, NPK 12:32:16, Sulfur, Boron, Iron, Magnesium, Biofertilizers (Rhizobium, Azotobacter, PSB), Vermicompost, FYM.
5. **Irrigation & Water Management (0 records)**:
   - *Missing*: Dedicated irrigation domain for Wheat, Rice, Maize, Cotton, Vegetables, Drip Irrigation, Sprinkler Systems, Waterlogging mitigation, Drought stress management, Critical crop growth stages.

---

## 4. Retrieval & Scoring Weaknesses

1. **Lack of Crop/Topic Penalty**:
   - If a user asks `"टमाटर के पौधों की पत्तियां क्यों मुड़ रही हैं?"`, tomato records and wheat records both contain the generic word `पत्तियां`. Without crop-mismatch penalties, a wheat disease record might rank close to a tomato disease record.
2. **Limited Keyword Expansion**:
   - Romanized Hindi variations (`chana`, `tuvar`, `arhar`, `safed makhi`, `tana chedak`, `patti lapetak`) need comprehensive synonyms to prevent query drop-offs.
3. **Schema Variations Across Domains**:
   - `crops`, `diseases`, `schemes`, `soil`, `fertilizers` use different metadata field names, making unified answer generation complex.

---

## 5. Recommended Standardized Record Schema

```json
{
  "id": "domain-crop-condition-id",
  "category": "crop | disease | pest | soil | fertilizer | irrigation | scheme | weather | mandi | faq",
  "domain": "crops | diseases | pests | soil | fertilizers | irrigation | schemes | weather | mandi | faq",
  "crop": "Crop Name (English / Hindi)",
  "topic": "Topic / Disease / Condition Name",
  "title": "Display Title (English / Devanagari Hindi)",
  "description": "Comprehensive Overview",
  "description_hi": "विस्तृत विवरण (हिन्दी देवनागरी)",
  "symptoms": ["Symptom 1", "Symptom 2"],
  "symptoms_hi": ["लक्षण 1", "लक्षण 2"],
  "causes": ["Cause 1"],
  "causes_hi": ["कारण 1"],
  "prevention": ["Preventive Measure 1"],
  "prevention_hi": ["रोकथाम 1"],
  "organic_treatment": ["Organic Remedy 1"],
  "organic_treatment_hi": ["जैविक उपचार 1"],
  "chemical_treatment": ["Chemical Remedy 1"],
  "chemical_treatment_hi": ["रासायनिक उपचार 1"],
  "dosage": ["Verified Dosage 1"],
  "precautions": ["Precaution 1"],
  "keywords": ["english_keywords"],
  "keywords_hi": ["हिन्दी_कीवर्ड्स"],
  "keywords_romanized": ["romanized_hindi_keywords"]
}
```

---

## 6. Expansion Plan Targets (Phase 2 to Phase 14)

- **Target Total Records**: **300+ Verified Records** across 10 domains.
- **Domain Targets**:
  1. `crops`: 40+ records
  2. `diseases`: 60+ records
  3. `pests`: 35+ records
  4. `soil`: 25+ records
  5. `fertilizers`: 30+ records
  6. `irrigation`: 25+ records
  7. `schemes`: 20+ records
  8. `weather`: 20+ records
  9. `mandi`: 10+ records
  10. `faq`: 50+ records
- **Scoring Enhancements**: Crop match bonus (+20), exact title match (+15), phrase match (+10), crop mismatch penalty (-15), score thresholding (`score >= 4`).
- **Zero Fabrication**: All dosages, eligibility rules, prices, and weather advice strictly backed by verified agricultural facts without mock data.

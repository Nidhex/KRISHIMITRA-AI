# Vision Lab — Crop Disease Diagnostics

## Overview

The **Vision Lab (Crop Doctor)** enables farmers to scan infected crop leaves or stems using their smartphone camera or gallery images. The system uses a deep neural network classifier paired with an agronomic advisory engine to detect plant pathogens (fungal, bacterial, viral, nutrient deficiency) and recommend specific treatments.

## Visual UML Sequence & Fallback Diagram
![Vision Lab Disease Diagnosis Fallback Sequence](./images/vision_crop_disease_diagram_1789523390346.jpg)

---

## 1. Crop Disease Scanning & Diagnosis Flowchart

```mermaid
flowchart TD
    Start(["🔬 Farmer Opens Vision Lab"]) --> SourceChoice{"Select Image Source"}
    
    SourceChoice -->|Camera| CameraCapture["📸 Capture Leaf Photo with Expo Camera"]
    SourceChoice -->|Gallery| GalleryPicker["🖼️ Select Image from Device Gallery"]

    CameraCapture --> PreviewImg["👁️ Preview & Crop Image"]
    GalleryPicker --> PreviewImg

    PreviewImg --> SubmitDiagnosis{"Farmer Confirms Image"}
    SubmitDiagnosis -->|Retake| SourceChoice
    SubmitDiagnosis -->|Analyze| ConvertBase64["⚙️ Compress Image & Convert to Base64 / Multipart"]

    ConvertBase64 --> NetworkCheck{"Check Internet Network State"}

    NetworkCheck -->|Online| CloudInference["☁️ POST /api/vision/analyze to Backend"]
    NetworkCheck -->|Offline| LocalInference["💾 Run Offline Lightweight TensorFlow / Rule Classifier"]

    CloudInference --> ClassifierEngine["🤖 TensorFlow / Keras Model Inference"]
    ClassifierEngine --> ExtractResult["Extract Disease Class, Confidence Score & Severity"]

    LocalInference --> ExtractResult

    ExtractResult --> AdvisoryLookup["📚 Query Agronomic Treatment & Prevention Database"]
    AdvisoryLookup --> FormatUI["🎨 Format Result UI (Disease Name, Confidence %, Chemical/Organic Remediation)"]

    FormatUI --> SaveHistory["💾 Auto-save Scan to Vision History in Farm Memory"]
    SaveHistory --> DisplayResult["📱 Display Comprehensive Diagnosis Screen"]
```

---

## 2. Image Diagnostics Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 👨‍🌾 Farmer
    participant VisionUI as 🔬 Vision Screen UI
    participant VisionSvc as ⚙️ visionService
    participant Backend as ☁️ Render Backend API
    participant TFModel as 🤖 TensorFlow / Keras Classifier
    participant Gemini as ✨ Gemini Multimodal AI

    Farmer->>VisionUI: Tap "Scan Crop" / Take Photo
    VisionUI->>VisionSvc: analyzeCropImage(imageUri, cropHint)
    VisionSvc->>VisionSvc: Compress image & generate Base64 payload
    
    alt Primary API Path (Cloud Classifier)
        VisionSvc->>Backend: POST /api/vision/analyze { imageBase64, crop: "Wheat" }
        Backend->>TFModel: Execute Model Prediction on Tensor
        TFModel-->>Backend: Return Top 3 Classes + Probabilities
        
        opt Enriched AI Advice
            Backend->>Gemini: Request Treatment Plan for Class + Severity
            Gemini-->>Backend: Return Structured Organic & Chemical Remedies
        end

        Backend-->>VisionSvc: Return Diagnosis JSON Result
    else Offline Fallback Path
        VisionSvc->>VisionSvc: Execute Local Fallback Classification Engine
    end

    VisionSvc-->>VisionUI: Return CropDiagnosis Result Object
    VisionUI-->>Farmer: Render Disease Card, Confidence Gauge, Treatment Plan & Download/Share PDF
```

---

## 3. Crop Diagnosis Data Model Diagram

```mermaid
classDiagram
    class CropDiagnosis {
        +string scanId
        +string crop
        +string diseaseName
        +string scientificName
        +number confidence
        +string severity
        +string description
        +TreatmentOptions treatment
        +string[] symptoms
        +string[] prevention
        +string imageUri
        +string timestamp
    }

    class TreatmentOptions {
        +string[] chemical
        +string[] organic
        +string dosageInstruction
        +string safetyPrecautions
    }

    CropDiagnosis *-- TreatmentOptions
```

---

## Key Diagnostic Features

- **Multi-Crop Support**: Wheat, Rice (Paddy), Tomato, Potato, Cotton, Maize, Sugarcane, Mustard.
- **Dual Remediation Strategy**: Provides both **Chemical Solutions** (exact pesticide/fungicide names and dosage per acre) and **Organic/Biological Solutions** (neem oil, Trichoderma, crop rotation).
- **Auto-Sync to Diary**: Scan results can be saved directly into the **Farm Diary** as a `disease` or `pesticide` event with a single tap.

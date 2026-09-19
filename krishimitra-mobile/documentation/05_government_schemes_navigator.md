# Government Schemes Navigator

## Overview

The **Government Schemes Navigator** helps smallholder and marginal farmers discover, check eligibility for, and apply to national and state-specific agricultural welfare schemes (PM-Kisan Samman Nidhi, Kisan Credit Card, PM Fasal Bima Yojana, Soil Health Card Scheme, Sub-Mission on Agricultural Mechanization).

## Visual UML Sequence & Fallback Diagram
![Government Schemes Navigator](./images/schemes_navigator_diagram_1789523926753.jpg)

---

## 1. Scheme Matching Engine & Application Flowchart

```mermaid
flowchart TD
    Start(["🏛️ Farmer Opens Schemes Navigator"]) --> ReadProfile["👤 Load Farmer Profile (Land Size, State, Category, Crops Grown)"]
    
    ReadProfile --> FetchSchemes["📡 Query /api/schemes or Load Cached Schemes Registry"]
    
    FetchSchemes --> FilterCategory{"Farmer Selects Filter"}
    FilterCategory -->|All Schemes| ListAll["📋 List All Central & State Schemes"]
    FilterCategory -->|Category| FilterCat["🔍 Filter by Type (Financial, Insurance, Equipment, Irrigation)"]

    ListAll --> MatchEngine["⚙️ Run Rules-Based Eligibility Matching Engine"]
    FilterCat --> MatchEngine

    MatchEngine --> EvaluateCriteria{"Check Land Size, State, & Category"}
    
    EvaluateCriteria -->|100% Match| HighEligible["🟢 High Eligibility (e.g., PM-Kisan: Land < 2 Hectares)"]
    EvaluateCriteria -->|Partial Match| PartialEligible["🟡 Partial Eligibility (Requires Document Verification)"]
    EvaluateCriteria -->|Not Eligible| Ineligible["🔴 Not Eligible"]

    HighEligible --> RenderCards["📱 Render Scheme Cards sorted by Eligibility Match"]
    PartialEligible --> RenderCards
    Ineligible --> RenderCards

    RenderCards --> TapScheme["👆 Farmer Taps Scheme Card"]
    TapScheme --> DetailScreen["📄 Show Full Benefits, Required Documents Checklist, & Application Process"]
    
    DetailScreen --> RedirectOfficial["🌐 One-Tap Launch Official Govt Portal (e.g. pmkisan.gov.in)"]
```

---

## 2. Scheme Eligibility Verification Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 👨‍🌾 Farmer
    participant UI as 🏛️ Schemes Screen UI
    participant Service as ⚙️ Schemes Service / apiClient
    participant Profile as 👤 Farmer Profile Store
    participant Backend as ☁️ Render Schemes Engine

    Farmer->>UI: Opens Schemes Tab
    UI->>Profile: getFarmerProfile()
    Profile-->>UI: Return Profile { landArea: 2.0, state: "UP", category: "Marginal" }
    
    UI->>Service: fetchMatchingSchemes(farmerProfile)
    Service->>Backend: POST /api/schemes/match { landArea: 2.0, state: "UP" }
    Backend->>Backend: Evaluate Scheme Rules against Criteria Matrix
    Backend-->>Service: Return SchemeMatchResult[]
    
    Service-->>UI: Return matched scheme list
    UI-->>Farmer: Render badges ("100% Eligible", "Required Documents: Aadhar, Khatauni")
```

---

## 3. Scheme & Eligibility Data Model Diagram

```mermaid
classDiagram
    class Scheme {
        +string schemeId
        +string name
        +string nameHindi
        +string category
        +string agency
        +string summary
        +string benefits
        +string maxFinancialBenefit
        +EligibilityCriteria criteria
        +string[] requiredDocuments
        +string applicationUrl
        +string helplineNumber
    }

    class EligibilityCriteria {
        +number maxLandArea
        +string[] allowedStates
        +string[] targetCrops
        +string farmerCategory
    }

    class FarmerProfile {
        +string farmerId
        +string name
        +number landAreaAcres
        +string state
        +string district
        +string category
    }

    Scheme *-- EligibilityCriteria
    Scheme ..> FarmerProfile : matched against
```

---

## Key Scheme Navigator Features

- **Document Checklist**: Provides exact lists of documents required (Aadhaar Card, Land Record/Khatauni, Bank Passbook, Passport Photo) so farmers prepare in advance.
- **Helpline Integration**: One-tap phone dialer connection to official scheme helpline numbers (e.g., PM-Kisan toll-free `155261`).
- **Direct Portal Deep Link**: Opens verified government web portals directly inside a secure browser session.

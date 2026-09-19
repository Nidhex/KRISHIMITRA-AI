# Mandi Prices & APMC Market Intelligence

## Overview

The **Mandi Prices & Market Intelligence** feature provides real-time agricultural APMC market rates, price trend analysis, highest/lowest price highlights, and distance-based market recommendations to assist farmers in deciding where and when to sell their produce for maximum profit.

## Visual UML Sequence & Fallback Diagram
![Mandi Prices & APMC Market Intelligence](./images/mandi_prices_market_diagram_1789523811409.jpg)

---

## 1. Mandi Data Retrieval & Distance Recommendation Flowchart

```mermaid
flowchart TD
    Start(["🌾 Farmer Opens Mandi Screen"]) --> DetectLoc{"Fetch Device GPS Location"}
    
    DetectLoc -->|GPS Available| GetCoords["📍 Obtain Latitude / Longitude Coordinates"]
    DetectLoc -->|GPS Denied / Offline| DefaultDistrict["📍 Use Farmer Profile Default Location (Varanasi, UP)"]

    GetCoords --> QueryMandi["📡 Query Mandi API with Location & State Filter"]
    DefaultDistrict --> QueryMandi

    QueryMandi --> FilterCommodity{"Farmer Selects Commodity / Crop"}
    
    FilterCommodity -->|All Commodities| ListAll["📋 Fetch All Mandi Prices in State/District"]
    FilterCommodity -->|Specific Crop| FilterCrop["🔍 Filter by Crop (Wheat, Paddy, Mustard, Potato, etc.)"]

    ListAll --> CalcDistance["📏 Compute Distance (Haversine Formula) from Farmer Location"]
    FilterCrop --> CalcDistance

    CalcDistance --> CalculateMetrics["📊 Identify Highest Modal Price & Lowest Modal Price"]

    CalculateMetrics --> SortMandi["🔝 Sort Mandis by Distance & Max Return"]

    SortMandi --> RenderCards["📱 Render Mandi Cards (Market Name, Modal Price, Min-Max Range, Arrival Qty, Distance in km)"]
    RenderCards --> SellAdvisory["💡 Display Best APMC Recommendation (e.g. 'Sell at APMC Varanasi for ₹2,450/quintal')"]
```

---

## 2. Mandi Search & Filtering Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 👨‍🌾 Farmer
    participant UI as 🌾 Mandi Screen UI
    participant MandiSvc as ⚙️ mandiData / apiClient
    participant Cache as 💾 Local Cache (StorageService)
    participant Backend as ☁️ Render Mandi API
    participant GovtMandi as 🏛️ Govt Agmarknet / APMC Data

    Farmer->>UI: Select State "Uttar Pradesh" & Commodity "Wheat"
    UI->>MandiSvc: fetchMandiPrices({ state: "Uttar Pradesh", commodity: "Wheat" })
    MandiSvc->>Cache: Check for unexpired cached Mandi data
    
    alt Fresh Cache Hit
        Cache-->>MandiSvc: Return cached Mandi list
    else Cache Miss / Expired
        MandiSvc->>Backend: GET /api/mandi?state=UP&commodity=wheat
        Backend->>GovtMandi: Sync APMC daily rate feed
        GovtMandi-->>Backend: Return Mandi dataset
        Backend-->>MandiSvc: HTTP 200 JSON Response
        MandiSvc->>Cache: Save fresh dataset (TTL 4 hours)
    end

    MandiSvc-->>UI: Return formatted MandiItem[] array
    UI->>UI: Highlight Highest Price Card (Green Badge)
    UI-->>Farmer: Render Mandi cards + Price Trend Graph
```

---

## 3. Mandi Data Model Diagram

```mermaid
classDiagram
    class MandiItem {
        +string id
        +string marketName
        +string district
        +string state
        +string commodity
        +string variety
        +number minPrice
        +number maxPrice
        +number modalPrice
        +string priceUnit
        +number arrivalQuantity
        +string arrivalUnit
        +string date
        +number distanceKm
        +boolean isBestPrice
    }

    class MandiSummary {
        +string topMarket
        +number maxModalPrice
        +number avgPrice
        +number totalArrivals
        +string priceTrend
    }

    MandiSummary ..> MandiItem : calculated from
```

---

## Key Market Features

- **Price Badging**: Automatically highlights the highest modal price market within 50 km to maximize farmer earnings.
- **Price Trend Visualizer**: Displays historical price trajectory (7-day / 30-day) to indicate whether APMC prices are rising, stable, or falling.
- **Direct Nav Directions**: Tapping a Mandi card offers external navigation directions to the APMC market yard via Google Maps.

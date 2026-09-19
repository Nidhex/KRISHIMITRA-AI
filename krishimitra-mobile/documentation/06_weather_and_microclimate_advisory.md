# Weather & Microclimate Advisory

## Overview

The **Weather & Microclimate Advisory** feature delivers hyper-local weather conditions (temperature, humidity, precipitation chance, wind speed, UV index) combined with **Agricultural Operational Alerts** (e.g. ideal pesticide spraying windows, frost alerts, heat stress warnings, irrigation postponement).

## Visual UML Sequence & Fallback Diagram
![Weather & Microclimate Advisory](./images/weather_advisory_diagram_1789524005014.jpg)

---

## 1. Weather Retrieval & Microclimate Alert Flowchart

```mermaid
flowchart TD
    Start(["⛅ Farmer Opens Weather Screen"]) --> GetGPS{"Fetch Device GPS Location"}
    
    GetGPS -->|Success| LatLng["📍 Obtain Coordinates (Lat, Lon)"]
    GetGPS -->|Offline/Fail| FallbackCity["📍 Fallback to Saved Farm Location (Varanasi, UP)"]

    LatLng --> QueryWeather["📡 Query /api/weather?lat=...&lon=..."]
    FallbackCity --> QueryWeather

    QueryWeather --> NetworkCheck{"Network Status"}
    NetworkCheck -->|Online| RemoteAPI["☁️ Fetch Weather API Data"]
    NetworkCheck -->|Offline| LocalCache["💾 Load Cached Weather Data"]

    RemoteAPI --> ParseData["Parse Current Temp, Humidity, Rain Probability, Wind Speed, 5-Day Forecast"]
    LocalCache --> ParseData

    ParseData --> AgRulesEngine["⚙️ Run Agricultural Operational Rules Engine"]

    AgRulesEngine --> CheckPesticideWindow{"Wind < 15 km/h & Rain < 20%?"}
    CheckPesticideWindow -->|Yes| SprayAllowed["🟢 Ideal Spraying Window (Pesticide safe)"]
    CheckPesticideWindow -->|No| SprayWarning["🔴 High Spray Risk (Wind wash-off / drift risk)"]

    AgRulesEngine --> CheckRain{"Rain Probability > 60% in 24h?"}
    CheckRain -->|Yes| PostponeIrrigation["🔵 Postpone Irrigation (Rain expected)"]
    CheckRain -->|No| NormalIrrigation["🟢 Regular Irrigation Schedule"]

    SprayAllowed --> RenderUI["📱 Display Weather Metrics + Ag-Advisory Badges"]
    SprayWarning --> RenderUI
    PostponeIrrigation --> RenderUI
    NormalIrrigation --> RenderUI
```

---

## 2. Weather & Operational Advisory Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 👨‍🌾 Farmer
    participant UI as ⛅ Weather Screen UI
    participant LocationSvc as 📍 LocationService
    participant WeatherSvc as ⚙️ Weather Service / apiClient
    participant Backend as ☁️ Render Weather Proxy
    participant ExternalWeather as 🌐 OpenWeather API

    Farmer->>UI: Opens Weather Tab
    UI->>LocationSvc: getCurrentPosition()
    LocationSvc-->>UI: Return { latitude: 25.3176, longitude: 82.9739 }
    
    UI->>WeatherSvc: getWeatherForecast(25.3176, 82.9739)
    WeatherSvc->>Backend: GET /api/weather?lat=25.3176&lon=82.9739
    Backend->>ExternalWeather: Query Weather API
    ExternalWeather-->>Backend: Return Current + 5-day hourly forecast
    
    Backend->>Backend: Compute Spray Window, Frost Risk, Irrigation Advice
    Backend-->>WeatherSvc: Return WeatherAdvisoryJSON
    
    WeatherSvc-->>UI: Return WeatherData Object
    UI-->>Farmer: Render Temperature Card, Wind Gauge, 5-day Cards & Agronomic Warnings
```

---

## 3. Weather & Advisory Data Model Diagram

```mermaid
classDiagram
    class WeatherData {
        +string locationName
        +number currentTemp
        +number feelsLike
        +number humidity
        +number windSpeed
        +string windDirection
        +number rainProbability
        +string conditionText
        +string conditionIcon
        +DailyForecast[] forecast
        +AgriculturalAdvisory advisory
    }

    class DailyForecast {
        +string day
        +string date
        +number tempMax
        +number tempMin
        +number rainChance
        +string condition
    }

    class AgriculturalAdvisory {
        +boolean sprayAllowed
        +string sprayReason
        +boolean irrigationAdvised
        +string irrigationReason
        +string alertLevel
        +string summary
    }

    WeatherData *-- DailyForecast
    WeatherData *-- AgriculturalAdvisory
```

---

## Key Weather Feature Rules

1. **Pesticide Spray Safety Index**: Advises against spraying if wind speed exceeds 15 km/h (causing drift) or rain probability exceeds 30% (causing chemical wash-off).
2. **Irrigation Saver**: Warns farmers to hold off on canal or tubewell irrigation when heavy rainfall is forecasted within 24–48 hours, saving water and electricity costs.

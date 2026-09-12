/* ==========================================================================
   KrishiMitra AI — Mobile Information Hub Types
   TypeScript definitions for Weather, Mandi, Schemes, and News modules.
   ========================================================================== */

export interface MandiCropPrice {
  price: number;
  trend: 'up' | 'down' | 'stable';
  unit?: string;
}

export interface MandiItem {
  id: string;
  category: string;
  title: string;
  title_hi?: string;
  description: string;
  description_hi?: string;
  metadata: {
    distance?: string;
    type?: string;
    cropPrices?: Record<string, MandiCropPrice>;
    highlightedFor?: string[];
    concept?: string;
    advisory?: string;
    advisory_hi?: string;
    isLivePrice?: boolean;
    note?: string;
    keywords?: string[];
    keywords_hi?: string[];
    keywords_romanized?: string[];
    updatedAt?: string;
  };
}

export interface MandiResponseData {
  success: boolean;
  mandis: MandiItem[];
  total: number;
  cachedAt?: string;
  isLivePrice?: boolean;
  source?: string;
}

export interface CachedWeatherData {
  data: any; // WeatherResponseData
  timestamp: string;
  location: string;
}

export interface CachedMandiData {
  data: MandiItem[];
  timestamp: string;
}

export interface CachedSchemesData {
  data: any; // SchemesResponseData
  timestamp: string;
}

export interface CachedNewsData {
  data: any[]; // FeedArticle[]
  timestamp: string;
}

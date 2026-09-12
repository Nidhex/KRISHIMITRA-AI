/* ==========================================================================
   KrishiMitra AI — Mobile Information Hub Cache Service
   Provides dedicated offline storage abstractions for Weather, Mandi, Schemes, & News.
   ========================================================================== */

import { storageService } from './storageService';
import { CachedWeatherData, CachedMandiData, CachedSchemesData, CachedNewsData, MandiItem } from '../types/info.types';
import { WeatherResponseData, SchemesResponseData, FeedArticle } from '../types/api.types';

const CACHE_KEYS = {
  WEATHER: 'krishimitra_cache_weather',
  MANDI: 'krishimitra_cache_mandi',
  SCHEMES: 'krishimitra_cache_schemes',
  NEWS: 'krishimitra_cache_news',
};

class MobileCacheService {
  // ── Weather Cache ────────────────────────────────────────────────────────
  async saveWeatherCache(location: string, data: WeatherResponseData): Promise<void> {
    const cachePayload: CachedWeatherData = {
      data,
      timestamp: new Date().toISOString(),
      location,
    };
    await storageService.setItem(CACHE_KEYS.WEATHER, cachePayload);
  }

  async getWeatherCache(): Promise<CachedWeatherData | null> {
    return await storageService.getItem<CachedWeatherData>(CACHE_KEYS.WEATHER);
  }

  // ── Mandi Cache ──────────────────────────────────────────────────────────
  async saveMandiCache(mandis: MandiItem[]): Promise<void> {
    const cachePayload: CachedMandiData = {
      data: mandis,
      timestamp: new Date().toISOString(),
    };
    await storageService.setItem(CACHE_KEYS.MANDI, cachePayload);
  }

  async getMandiCache(): Promise<CachedMandiData | null> {
    return await storageService.getItem<CachedMandiData>(CACHE_KEYS.MANDI);
  }

  // ── Schemes Cache ────────────────────────────────────────────────────────
  async saveSchemesCache(data: SchemesResponseData): Promise<void> {
    const cachePayload: CachedSchemesData = {
      data,
      timestamp: new Date().toISOString(),
    };
    await storageService.setItem(CACHE_KEYS.SCHEMES, cachePayload);
  }

  async getSchemesCache(): Promise<CachedSchemesData | null> {
    return await storageService.getItem<CachedSchemesData>(CACHE_KEYS.SCHEMES);
  }

  // ── News Cache ───────────────────────────────────────────────────────────
  async saveNewsCache(articles: FeedArticle[]): Promise<void> {
    const cachePayload: CachedNewsData = {
      data: articles,
      timestamp: new Date().toISOString(),
    };
    await storageService.setItem(CACHE_KEYS.NEWS, cachePayload);
  }

  async getNewsCache(): Promise<CachedNewsData | null> {
    return await storageService.getItem<CachedNewsData>(CACHE_KEYS.NEWS);
  }
}

export const cacheService = new MobileCacheService();

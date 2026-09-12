/* ==========================================================================
   KrishiMitra AI — Mobile Storage Service Abstraction
   Centralized local key-value & caching store for farmer profile & app settings.
   ========================================================================== */

import { FarmerProfile, DEFAULT_FARMER_PROFILE } from '../types/profile.types';

const STORAGE_KEYS = {
  FARMER_PROFILE: 'krishimitra_farmer_profile',
  LANGUAGE_PREF: 'krishimitra_language_preference',
  APP_SETTINGS: 'krishimitra_app_settings',
  CHAT_HISTORY: 'krishimitra_chat_history',
};

class MobileStorageService {
  private memoryCache: Map<string, string> = new Map();

  constructor() {
    // Pre-populate default profile in memory
    this.memoryCache.set(STORAGE_KEYS.FARMER_PROFILE, JSON.stringify(DEFAULT_FARMER_PROFILE));
    this.memoryCache.set(STORAGE_KEYS.LANGUAGE_PREF, 'hi');

    // Attempt sync from localStorage if available
    if (typeof localStorage !== 'undefined') {
      try {
        const savedProf = localStorage.getItem(STORAGE_KEYS.FARMER_PROFILE);
        if (savedProf) this.memoryCache.set(STORAGE_KEYS.FARMER_PROFILE, savedProf);
        const savedLang = localStorage.getItem(STORAGE_KEYS.LANGUAGE_PREF);
        if (savedLang) this.memoryCache.set(STORAGE_KEYS.LANGUAGE_PREF, savedLang);
      } catch (e) {
        // Ignore storage errors in restricted contexts
      }
    }
  }

  /**
   * Get Farmer Profile
   */
  async getFarmerProfile(): Promise<FarmerProfile> {
    try {
      const raw = this.memoryCache.get(STORAGE_KEYS.FARMER_PROFILE);
      if (raw) {
        return JSON.parse(raw);
      }
      return DEFAULT_FARMER_PROFILE;
    } catch (e) {
      return DEFAULT_FARMER_PROFILE;
    }
  }

  /**
   * Save Farmer Profile
   */
  async saveFarmerProfile(profile: Partial<FarmerProfile>): Promise<FarmerProfile> {
    const current = await this.getFarmerProfile();
    const updated: FarmerProfile = {
      ...current,
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    const stringified = JSON.stringify(updated);
    this.memoryCache.set(STORAGE_KEYS.FARMER_PROFILE, stringified);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.FARMER_PROFILE, stringified);
      } catch (e) {}
    }
    return updated;
  }

  /**
   * Get Preferred Language Code
   */
  async getLanguage(): Promise<string> {
    return this.memoryCache.get(STORAGE_KEYS.LANGUAGE_PREF) || 'hi';
  }

  /**
   * Set Preferred Language Code
   */
  async setLanguage(langCode: string): Promise<void> {
    this.memoryCache.set(STORAGE_KEYS.LANGUAGE_PREF, langCode);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.LANGUAGE_PREF, langCode);
      } catch (e) {}
    }
    const profile = await this.getFarmerProfile();
    await this.saveFarmerProfile({ preferredLanguage: langCode as any });
  }

  /**
   * Generic Key-Value Getter
   */
  async getItem<T>(key: string): Promise<T | null> {
    let val = this.memoryCache.get(key);
    if (!val && typeof localStorage !== 'undefined') {
      try {
        val = localStorage.getItem(key) || undefined;
        if (val) this.memoryCache.set(key, val);
      } catch (e) {}
    }
    if (!val) return null;
    try {
      return JSON.parse(val);
    } catch (e) {
      return val as any;
    }
  }

  /**
   * Generic Key-Value Setter
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    const stringified = typeof value === 'string' ? value : JSON.stringify(value);
    this.memoryCache.set(key, stringified);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, stringified);
      } catch (e) {}
    }
  }
}

export const storageService = new MobileStorageService();

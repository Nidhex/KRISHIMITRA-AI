/* ==========================================================================
   KrishiMitra AI — Mobile Farmer Profile Types
   ========================================================================== */

export type SupportedLanguageCode =
  | 'en'
  | 'hi'
  | 'gu'
  | 'mr'
  | 'bn'
  | 'ta'
  | 'te'
  | 'kn'
  | 'ml'
  | 'pa'
  | 'or';

export interface FarmerProfile {
  id: string;
  name: string;
  phone?: string;
  state: string;
  district: string;
  village: string;
  landSizeAcres: string;
  primaryCrops: string[];
  preferredLanguage: SupportedLanguageCode;
  updatedAt: string;
}

export const DEFAULT_FARMER_PROFILE: FarmerProfile = {
  id: 'farmer_default',
  name: 'Ramesh Prasad',
  state: 'Uttar Pradesh',
  district: 'Varanasi',
  village: 'Kishanpur',
  landSizeAcres: '2.5',
  primaryCrops: ['Wheat', 'Paddy'],
  preferredLanguage: 'hi',
  updatedAt: new Date().toISOString(),
};

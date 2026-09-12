/* ==========================================================================
   KrishiMitra AI — Mobile Location Service
   Handles location permissions, device GPS, reverse geocoding & manual fallbacks.
   ========================================================================== */

import * as Location from 'expo-location';

export type LocationPermissionStatus = 
  | 'GRANTED'
  | 'DENIED'
  | 'UNAVAILABLE'
  | 'TIMEOUT'
  | 'ERROR';

export interface LocationResult {
  status: LocationPermissionStatus;
  locationName: string;
  coords?: {
    latitude: number;
    longitude: number;
  };
  userMessage?: string;
}

const DEFAULT_FALLBACK_LOCATION = 'Gorakhpur, Uttar Pradesh';

class MobileLocationService {
  /**
   * Request device location permission and fetch current village/city location.
   */
  async getCurrentLocation(): Promise<LocationResult> {
    try {
      // 1. Check existing permission status
      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        // Request permission if not granted
        const permission = await Location.requestForegroundPermissionsAsync();
        status = permission.status;
      }

      if (status !== 'granted') {
        return {
          status: 'DENIED',
          locationName: DEFAULT_FALLBACK_LOCATION,
          userMessage: 'स्थान की अनुमति अस्वीकृत की गई। डिफ़ॉल्ट स्थान दिखाया जा रहा है। (Location permission denied)',
        };
      }

      // 2. Fetch current coordinates with timeout protection
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // 3. Reverse geocode to city/village name
      const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
      let locationName = DEFAULT_FALLBACK_LOCATION;

      if (reverse && reverse.length > 0) {
        const place = reverse[0];
        const city = place.district || place.city || place.subregion || place.region || 'Gorakhpur';
        const state = place.region || 'UP';
        const village = place.name || place.street;
        
        if (village && city && village !== city) {
          locationName = `${village}, ${city}`;
        } else {
          locationName = `${city}, ${state}`;
        }
      }

      return {
        status: 'GRANTED',
        locationName,
        coords: { latitude, longitude },
      };
    } catch (error: any) {
      if (error.message && error.message.includes('timeout')) {
        return {
          status: 'TIMEOUT',
          locationName: DEFAULT_FALLBACK_LOCATION,
          userMessage: 'स्थान प्राप्त करने में देरी हुई। (Location request timed out)',
        };
      }

      return {
        status: 'UNAVAILABLE',
        locationName: DEFAULT_FALLBACK_LOCATION,
        userMessage: 'स्थान सेवा उपलब्ध नहीं है। (Location service unavailable)',
      };
    }
  }
}

export const locationService = new MobileLocationService();

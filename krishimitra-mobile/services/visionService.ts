/* ==========================================================================
   KrishiMitra AI — Mobile Vision Service
   Image selection (Camera/Gallery), compression, & multipart upload handling.
   ========================================================================== */

import * as ImagePicker from 'expo-image-picker';
import { apiClient } from './apiClient';
import { VisionModuleType, SelectedImage, VisionScanResult } from '../types/vision.types';

class MobileVisionService {
  /**
   * Request Camera & Media Library Permissions
   */
  async requestCameraPermission(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      return false;
    }
  }

  async requestMediaLibraryPermission(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      return false;
    }
  }

  /**
   * Capture photo using native camera
   */
  async capturePhoto(): Promise<SelectedImage | null> {
    const hasPerm = await this.requestCameraPermission();
    if (!hasPerm) {
      throw new Error('कैमरा का उपयोग करने के लिए अनुमति आवश्यक है। (Camera permission required)');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8, // Compression setting: 80% quality to optimize network data
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileName: asset.fileName || 'camera_scan.jpg',
      mimeType: asset.mimeType || 'image/jpeg',
    };
  }

  /**
   * Select photo from photo gallery
   */
  async selectFromGallery(): Promise<SelectedImage | null> {
    const hasPerm = await this.requestMediaLibraryPermission();
    if (!hasPerm) {
      throw new Error('गैलरी से फोटो चुनने के लिए अनुमति आवश्यक है। (Gallery permission required)');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileName: asset.fileName || 'gallery_scan.jpg',
      mimeType: asset.mimeType || 'image/jpeg',
    };
  }

  /**
   * Upload image scan to backend /api/vision
   */
  async analyzeImage(
    imageUri: string,
    moduleType: VisionModuleType
  ): Promise<{ success: boolean; result?: VisionScanResult; error?: string }> {
    try {
      const response = await apiClient.scanVision(imageUri, moduleType);

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'स्कैन विश्लेषण में समस्या हुई। कृपया पुनः प्रयास करें।',
        };
      }

      if (moduleType === 'disease' && response.disease) {
        const raw = response.disease;
        const symptomsArray = Array.isArray(raw.symptoms)
          ? raw.symptoms
          : typeof raw.symptoms === 'string'
          ? [raw.symptoms]
          : [];
        const organicArray = Array.isArray(raw.organic_treatment)
          ? raw.organic_treatment
          : typeof raw.organic_treatment === 'string'
          ? [raw.organic_treatment]
          : [];
        const chemicalArray = Array.isArray(raw.chemical_treatment)
          ? raw.chemical_treatment
          : typeof raw.chemical_treatment === 'string'
          ? [raw.chemical_treatment]
          : [];
        const precautionsArray = Array.isArray(raw.precautions)
          ? raw.precautions
          : typeof raw.precautions === 'string'
          ? [raw.precautions]
          : [];

        return {
          success: true,
          result: {
            moduleType: 'disease',
            imageUri,
            confidence: response.confidence || raw.confidence || 0,
            probabilities: response.probabilities,
            rawImagePath: response.imagePath,
            disease: {
              diseaseName: raw.disease_name || 'Unknown Disease',
              diseaseNameHi: raw.disease_name_hi || raw.disease_name,
              confidence: response.confidence || raw.confidence || 0,
              symptoms: symptomsArray,
              organicTreatment: organicArray,
              chemicalTreatment: chemicalArray,
              precautions: precautionsArray,
            },
          },
        };
      }

      if (moduleType === 'soil' && response.soil) {
        const raw = response.soil;
        return {
          success: true,
          result: {
            moduleType: 'soil',
            imageUri,
            confidence: response.confidence || raw.confidence || 0,
            probabilities: response.probabilities,
            rawImagePath: response.imagePath,
            soil: {
              soilType: raw.soil_type || 'Unknown Soil',
              soilTypeHi: raw.soil_type_hi || raw.soil_type,
              confidence: response.confidence || raw.confidence || 0,
              characteristics: raw.characteristics || '',
              suitableCrops: raw.suitable_crops || [],
              fertilizerRecommendations: raw.fertilizer_recommendation || [],
            },
          },
        };
      }

      return {
        success: false,
        error: 'स्कैन परिणाम अस्पष्ट है। कृपया साफ़ फोटो लेकर दोबारा प्रयास करें।',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'नेटवर्क त्रुटि के कारण स्कैन अपलोड नहीं हो सका।',
      };
    }
  }
}

export const mobileVisionService = new MobileVisionService();

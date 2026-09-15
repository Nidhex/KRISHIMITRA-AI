import { VisionDiagnosticInfo } from './api.types';

export type VisionModuleType = 'disease' | 'soil';

export type VisionScanStatus = 'IDLE' | 'PREVIEW' | 'ANALYZING' | 'SUCCESS' | 'ERROR';

export interface SelectedImage {
  uri: string;
  width?: number;
  height?: number;
  fileName?: string;
  mimeType?: string;
}

export interface DiseaseDiagnosis {
  diseaseName: string;
  diseaseNameHi?: string;
  confidence: number; // Percentage float e.g. 0.942 -> 94.2%
  symptoms: string[];
  organicTreatment: string[];
  chemicalTreatment: string[];
  precautions: string[];
}

export interface SoilDiagnosis {
  soilType: string;
  soilTypeHi?: string;
  confidence: number;
  characteristics: string;
  suitableCrops: string[];
  fertilizerRecommendations: string[];
}

export interface VisionScanResult {
  moduleType: VisionModuleType;
  imageUri: string;
  disease?: DiseaseDiagnosis | null;
  soil?: SoilDiagnosis | null;
  confidence: number;
  probabilities?: Record<string, number>;
  rawImagePath?: string;
  diagnostic?: VisionDiagnosticInfo;
}

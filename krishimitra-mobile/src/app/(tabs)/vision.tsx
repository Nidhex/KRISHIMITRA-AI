/* ==========================================================================
   KrishiMitra AI — Mobile Vision AI Screen (Disease & Soil Diagnosis)
   Connected to Render backend (/api/vision) via apiClient.scanVision
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, TextInput, Alert } from 'react-native';

import { AppHeader } from '../../../components/AppHeader';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { NetworkStatusBadge } from '../../../components/NetworkStatusBadge';
import { Card } from '../../../components/Card';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { ErrorState } from '../../../components/ErrorState';
import { VisionResultCard } from '../../../components/VisionResultCard';

import { Colors, Typography, Spacing, BorderRadius } from '../../../constants/theme';
import { VisionModuleType, VisionScanStatus, SelectedImage, VisionScanResult } from '../../../types/vision.types';
import { VisionDiagnosticInfo } from '../../../types/api.types';
import { mobileVisionService } from '../../../services/visionService';
import { networkService } from '../../../services/networkService';

// TEMPORARY DIAGNOSTIC FLAG FOR RELEASE APK QA — REMOVE AFTER DIAGNOSIS
const VISION_DEBUG = true;

export default function VisionScreen() {
  const [moduleType, setModuleType] = useState<VisionModuleType>('disease');
  const [status, setStatus] = useState<VisionScanStatus>('IDLE');
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [scanResult, setScanResult] = useState<VisionScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [diagnosticInfo, setDiagnosticInfo] = useState<VisionDiagnosticInfo | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    const state = networkService.getState();
    setIsOnline(state.isDeviceConnected);

    const unsubscribe = networkService.subscribe((s) => {
      setIsOnline(s.isDeviceConnected);
    });
    return () => unsubscribe();
  }, []);

  // Handle Camera Photo Capture
  const handleCameraCapture = async () => {
    try {
      setErrorMessage('');
      setDiagnosticInfo(null);
      const img = await mobileVisionService.capturePhoto();
      if (img) {
        setSelectedImage(img);
        setStatus('PREVIEW');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'कैमरा खोलने में समस्या हुई। (Camera Error)');
      setDiagnosticInfo({
        stage: '5. image_resize_compression',
        errorName: err?.name || 'CameraError',
        errorMessage: err?.message || 'Camera capture failed',
        errorCode: 'VISION_IMAGE_ERROR',
      });
      setStatus('ERROR');
    }
  };

  // Handle Gallery Selection
  const handleGallerySelect = async () => {
    try {
      setErrorMessage('');
      setDiagnosticInfo(null);
      const img = await mobileVisionService.selectFromGallery();
      if (img) {
        setSelectedImage(img);
        setStatus('PREVIEW');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'गैलरी से फोटो चुनने में समस्या हुई। (Gallery Error)');
      setDiagnosticInfo({
        stage: '5. image_resize_compression',
        errorName: err?.name || 'GalleryError',
        errorMessage: err?.message || 'Gallery selection failed',
        errorCode: 'VISION_IMAGE_ERROR',
      });
      setStatus('ERROR');
    }
  };

  // Handle Image Analysis Submission
  const handleAnalyze = async () => {
    if (!selectedImage) return;

    if (!isOnline) {
      setErrorMessage(
        'आप अभी ऑफ़लाइन हैं। फसल बीमारी और मिट्टी परीक्षण के लिए इंटरनेट कनेक्शन उपलब्ध होने पर स्कैन करें।'
      );
      setDiagnosticInfo({
        stage: '9. fetch_starts',
        errorName: 'NetworkError',
        errorMessage: 'Device is offline',
        errorCode: 'VISION_NETWORK_ERROR',
      });
      setStatus('ERROR');
      return;
    }

    setStatus('ANALYZING');

    const response = await mobileVisionService.analyzeImage(selectedImage, moduleType);

    if (response.diagnostic) {
      setDiagnosticInfo(response.diagnostic);
    }

    if (response.success && response.result) {
      setScanResult(response.result);
      setStatus('SUCCESS');
    } else {
      setErrorMessage(response.error || 'स्कैन विश्लेषण में समस्या हुई। कृपया पुनः प्रयास करें।');
      setStatus('ERROR');
    }
  };

  // Reset Scan
  const handleReset = () => {
    setSelectedImage(null);
    setScanResult(null);
    setErrorMessage('');
    setDiagnosticInfo(null);
    setStatus('IDLE');
  };

  const debugText = `VISION DEBUG
Stage: ${diagnosticInfo?.stage || 'Unknown stage'}
Error name: ${diagnosticInfo?.errorName || 'None'}
Error message: ${diagnosticInfo?.errorMessage || errorMessage || 'None'}
Error code: ${diagnosticInfo?.errorCode || 'None'}
URI type: ${diagnosticInfo?.uriType || selectedImage?.uri?.split(':')[0] || 'Unknown'}
Original URI: ${diagnosticInfo?.originalUri || selectedImage?.uri || 'N/A'}
Resolved URI: ${diagnosticInfo?.resolvedUri || selectedImage?.uri || 'N/A'}
File exists: ${diagnosticInfo?.fileExists !== undefined ? String(diagnosticInfo.fileExists) : 'Unknown'}
File size: ${diagnosticInfo?.fileSize !== undefined ? `${diagnosticInfo.fileSize} bytes` : 'Unknown'}
MIME type: ${diagnosticInfo?.mimeType || selectedImage?.mimeType || 'Unknown'}
HTTP status: ${diagnosticInfo?.httpStatus !== undefined ? String(diagnosticInfo.httpStatus) : 'N/A'}
Backend response: ${diagnosticInfo?.backendResponse || 'N/A'}`;

  return (
    <View style={styles.flexOne}>
      <AppHeader title="फसल व मिट्टी जांच" subtitle="AI Crop Disease & Soil Test" />
      <NetworkStatusBadge />

      <ScreenContainer>
        {/* Module Switcher Tabs */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, moduleType === 'disease' && styles.toggleBtnActive]}
            onPress={() => {
              setModuleType('disease');
              handleReset();
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: moduleType === 'disease' }}
            accessibilityLabel="Crop Disease Detection Mode"
          >
            <Text style={[styles.toggleText, moduleType === 'disease' && styles.toggleTextActive]}>
              🌿 फसल बीमारी (Disease)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, moduleType === 'soil' && styles.toggleBtnActive]}
            onPress={() => {
              setModuleType('soil');
              handleReset();
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: moduleType === 'soil' }}
            accessibilityLabel="Soil Test Mode"
          >
            <Text style={[styles.toggleText, moduleType === 'soil' && styles.toggleTextActive]}>
              🟤 मिट्टी परीक्षण (Soil Test)
            </Text>
          </TouchableOpacity>
        </View>

        {/* IDLE STAGE: Instructions & Action Buttons */}
        {status === 'IDLE' && (
          <Card style={styles.actionCard}>
            <Text style={styles.emojiIcon}>{moduleType === 'disease' ? '📸' : '🧪'}</Text>
            <Text style={styles.cardTitle}>
              {moduleType === 'disease'
                ? 'फसल की पत्ती की साफ़ फोटो लें'
                : 'मिट्टी के सैंपल की साफ़ फोटो लें'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {moduleType === 'disease'
                ? 'AI फोटो देखकर बीमारी पहचानेगा और सही जैविक व रासायनिक उपचार बताएगा'
                : 'AI फोटो से मिट्टी की किस्म, नमी व उर्वरक की सलाह देगा'}
            </Text>

            <View style={styles.buttonGroup}>
              <PrimaryButton
                title="📷 कैमरा खोलें (Take Photo)"
                onPress={handleCameraCapture}
                style={styles.actionBtn}
              />
              <SecondaryButton
                title="🖼 गैलरी से चुनें (Choose Gallery)"
                onPress={handleGallerySelect}
                style={styles.actionBtn}
              />
            </View>
          </Card>
        )}

        {/* PREVIEW STAGE: Confirm or Retake Image */}
        {status === 'PREVIEW' && selectedImage && (
          <Card style={styles.actionCard}>
            <Text style={styles.previewHeading}>फोटो पूर्वावलोकन (Preview)</Text>
            <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} resizeMode="cover" />

            <View style={styles.buttonGroup}>
              <PrimaryButton
                title="🔬 विश्लेषण शुरू करें (Analyze Image)"
                onPress={handleAnalyze}
                style={styles.actionBtn}
              />
              <SecondaryButton
                title="🔄 दूसरी फोटो लें (Retake Photo)"
                onPress={handleReset}
                style={styles.actionBtn}
              />
            </View>
          </Card>
        )}

        {/* ANALYZING STAGE: Loading Indicator */}
        {status === 'ANALYZING' && (
          <Card style={styles.loadingCard}>
            <LoadingIndicator
              message={
                moduleType === 'disease'
                  ? 'AI फसल रोग का विश्लेषण कर रहा है... (Analyzing Disease...)'
                  : 'AI मिट्टी के सैंपल का विश्लेषण कर रहा है... (Analyzing Soil...)'
              }
            />
          </Card>
        )}

        {/* SUCCESS STAGE: Result View */}
        {status === 'SUCCESS' && scanResult && (
          <VisionResultCard result={scanResult} onScanAgain={handleReset} />
        )}

        {/* ERROR STAGE: Error & Retry View */}
        {status === 'ERROR' && (
          <View>
            <ErrorState
              title="जांच विफलता (Diagnosis Error)"
              message={errorMessage || 'विश्लेषण पूरा नहीं हो सका।'}
              onRetry={handleReset}
              retryText="पुनः प्रयास करें (Try Again)"
            />

            {/* TEMPORARY DEVELOPER DIAGNOSTICS CARD FOR APK QA */}
            {VISION_DEBUG && (
              <Card style={styles.debugCard}>
                <Text style={styles.debugTitle}>🛠 VISION DEBUG DIAGNOSTICS</Text>
                <TextInput
                  style={styles.debugInput}
                  multiline
                  editable={false}
                  selectTextOnFocus
                  value={debugText}
                />
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={() => {
                    Alert.alert('Debug Info', 'Press and hold text above to select and copy.');
                  }}
                >
                  <Text style={styles.copyBtnText}>📋 Select / Copy Debug Info</Text>
                </TouchableOpacity>
              </Card>
            )}
          </View>
        )}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primaryDark,
  },
  toggleText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.textOnPrimary,
  },
  actionCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingCard: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  emojiIcon: {
    fontSize: 56,
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.xl,
  },
  previewHeading: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  previewImage: {
    width: '100%',
    height: 260,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  buttonGroup: {
    width: '100%',
  },
  actionBtn: {
    marginBottom: Spacing.sm,
  },
  debugCard: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#1E1E1E',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  debugTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFB74D',
    marginBottom: Spacing.xs,
  },
  debugInput: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 11,
    color: '#E0E0E0',
    backgroundColor: '#121212',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    minHeight: 180,
    textAlignVertical: 'top',
  },
  copyBtn: {
    marginTop: Spacing.xs,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  copyBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.warning,
  },
});

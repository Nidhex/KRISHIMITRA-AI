/* ==========================================================================
   KrishiMitra AI — Mobile VisionResultCard Component
   Renders verified Disease Diagnosis or Soil Classification results.
   ========================================================================== */

import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { VisionScanResult } from '../types/vision.types';
import { Card } from './Card';
import { PrimaryButton } from './PrimaryButton';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface VisionResultCardProps {
  result: VisionScanResult;
  onScanAgain: () => void;
  language?: string;
}

export const VisionResultCard: React.FC<VisionResultCardProps> = ({
  result,
  onScanAgain,
  language = 'hi',
}) => {
  const isDisease = result.moduleType === 'disease' && result.disease;
  const isSoil = result.moduleType === 'soil' && result.soil;
  const confidencePercent = Math.round((result.confidence || 0) * 100);

  // Confidence color badge helper
  const getBadgeStyle = (pct: number) => {
    if (pct >= 80) return { bg: '#E8F5E9', border: Colors.primaryDark, text: Colors.primaryDark };
    if (pct >= 50) return { bg: '#FFF8E1', border: '#F57F17', text: '#F57F17' };
    return { bg: '#FFEBEE', border: Colors.error, text: Colors.error };
  };

  const badgeTheme = getBadgeStyle(confidencePercent);

  return (
    <Card style={styles.cardContainer}>
      {/* Image Preview */}
      {result.imageUri ? (
        <Image source={{ uri: result.imageUri }} style={styles.imagePreview} resizeMode="cover" />
      ) : null}

      {/* Header & Confidence Badge */}
      <View style={styles.resultHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.categoryTitle}>
            {isDisease ? '🌿 फसल बीमारी जांच परिणाम' : '🟤 मिट्टी परीक्षण परिणाम'}
          </Text>
          <Text style={styles.mainDiagnosis}>
            {isDisease
              ? result.disease?.diseaseNameHi || result.disease?.diseaseName
              : result.soil?.soilTypeHi || result.soil?.soilType}
          </Text>
          <Text style={styles.englishSubName}>
            {isDisease ? result.disease?.diseaseName : result.soil?.soilType}
          </Text>
        </View>

        <View style={[styles.confidenceBadge, { backgroundColor: badgeTheme.bg, borderColor: badgeTheme.border }]}>
          <Text style={[styles.confidenceText, { color: badgeTheme.text }]}>
            {confidencePercent}% सटीक
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* DISEASE DIAGNOSIS CONTENT */}
      {isDisease && result.disease && (
        <View style={styles.contentSection}>
          {/* Symptoms */}
          {result.disease.symptoms.length > 0 && (
            <View style={styles.infoBlock}>
              <Text style={styles.blockTitle}>🔍 बीमारी के लक्षण (Symptoms):</Text>
              {result.disease.symptoms.map((sym, idx) => (
                <Text key={idx} style={styles.bulletText}>• {sym}</Text>
              ))}
            </View>
          )}

          {/* Organic Remedies */}
          {result.disease.organicTreatment.length > 0 && (
            <View style={[styles.infoBlock, styles.organicBlock]}>
              <Text style={[styles.blockTitle, { color: Colors.primaryDark }]}>🌱 जैविक उपचार (Organic Treatment):</Text>
              {result.disease.organicTreatment.map((org, idx) => (
                <Text key={idx} style={styles.bulletText}>• {org}</Text>
              ))}
            </View>
          )}

          {/* Chemical Remedies */}
          {result.disease.chemicalTreatment.length > 0 && (
            <View style={[styles.infoBlock, styles.chemicalBlock]}>
              <Text style={[styles.blockTitle, { color: '#0288D1' }]}>🧪 रासायनिक उपचार (Chemical Control):</Text>
              {result.disease.chemicalTreatment.map((chem, idx) => (
                <Text key={idx} style={styles.bulletText}>• {chem}</Text>
              ))}
            </View>
          )}

          {/* Precautions */}
          {result.disease.precautions.length > 0 && (
            <View style={[styles.infoBlock, styles.precautionBlock]}>
              <Text style={[styles.blockTitle, { color: Colors.warning }]}>⚠️ सावधानियां (Safety Precautions):</Text>
              {result.disease.precautions.map((prec, idx) => (
                <Text key={idx} style={styles.bulletText}>• {prec}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* SOIL DIAGNOSIS CONTENT */}
      {isSoil && result.soil && (
        <View style={styles.contentSection}>
          {/* Characteristics */}
          {result.soil.characteristics ? (
            <View style={styles.infoBlock}>
              <Text style={styles.blockTitle}>📋 मिट्टी की विशेषताएं (Characteristics):</Text>
              <Text style={styles.bulletText}>{result.soil.characteristics}</Text>
            </View>
          ) : null}

          {/* Suitable Crops */}
          {result.soil.suitableCrops.length > 0 && (
            <View style={styles.infoBlock}>
              <Text style={styles.blockTitle}>🌾 उपयुक्त फसलें (Suitable Crops):</Text>
              <View style={styles.cropPillRow}>
                {result.soil.suitableCrops.map((crop, idx) => (
                  <View key={idx} style={styles.cropPill}>
                    <Text style={styles.cropPillText}>{crop}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Fertilizer Recommendations */}
          {result.soil.fertilizerRecommendations.length > 0 && (
            <View style={[styles.infoBlock, styles.organicBlock]}>
              <Text style={[styles.blockTitle, { color: Colors.primaryDark }]}>🧪 उर्वरक सलाह (Fertilizers):</Text>
              {result.soil.fertilizerRecommendations.map((fert, idx) => (
                <Text key={idx} style={styles.bulletText}>• {fert}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Scan Again Action */}
      <PrimaryButton
        title="📸 दूसरी फोटो जांचें (Scan Another Image)"
        onPress={onScanAgain}
        style={styles.scanAgainBtn}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    padding: Spacing.md,
  },
  imagePreview: {
    width: '100%',
    height: 220,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  categoryTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  mainDiagnosis: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryDark,
  },
  englishSubName: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  confidenceBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  confidenceText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  contentSection: {
    marginBottom: Spacing.md,
  },
  infoBlock: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
  },
  organicBlock: {
    backgroundColor: '#E8F5E9',
  },
  chemicalBlock: {
    backgroundColor: '#E1F5FE',
  },
  precautionBlock: {
    backgroundColor: '#FFF3E0',
  },
  blockTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  bulletText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeight.md,
    marginBottom: 2,
  },
  cropPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
  },
  cropPill: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primaryDark,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  cropPillText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryDark,
  },
  scanAgainBtn: {
    marginTop: Spacing.sm,
  },
});

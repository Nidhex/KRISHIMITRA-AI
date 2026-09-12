import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '../../../../components/AppHeader';
import { ScreenContainer } from '../../../../components/ScreenContainer';
import { NetworkStatusBadge } from '../../../../components/NetworkStatusBadge';
import { SectionHeader } from '../../../../components/SectionHeader';
import { Colors, Typography, Spacing, BorderRadius, ComponentSize } from '../../../../constants/theme';
import { storageService } from '../../../../services/storageService';
import { getTranslation } from '../../../../i18n/languages';

export default function InfoHubScreen() {
  const router = useRouter();
  const [lang, setLang] = useState<string>('hi');

  useEffect(() => {
    storageService.getLanguage().then(setLang);
  }, []);

  return (
    <View style={styles.flexOne}>
      <AppHeader 
        title={lang === 'hi' ? 'कृषि ज्ञान केंद्र' : 'Agri Info Hub'} 
        subtitle="Weather, Mandi Rates, Govt Schemes & News" 
      />
      <NetworkStatusBadge />

      <ScreenContainer>
        <SectionHeader title={lang === 'hi' ? 'कृषि सेवाएं एवं जानकारी (Agri Services)' : 'Agricultural Information Services'} />

        <TouchableOpacity
          style={[styles.infoCard, { backgroundColor: Colors.weatherCard }]}
          onPress={() => router.push('/(tabs)/info/weather')}
          activeOpacity={0.8}
          accessibilityLabel="Weather Advisory and 7-Day Forecast"
          accessibilityRole="button"
        >
          <Text style={styles.cardEmoji}>🌦</Text>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>{getTranslation(lang, 'weatherTitle')}</Text>
            <Text style={styles.cardDesc}>{getTranslation(lang, 'weatherSubtitle')}</Text>
          </View>
          <Text style={styles.arrow}>➔</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.infoCard, { backgroundColor: Colors.mandiCard }]}
          onPress={() => router.push('/(tabs)/info/mandi')}
          activeOpacity={0.8}
          accessibilityLabel="Mandi Prices and Minimum Support Price Advisory"
          accessibilityRole="button"
        >
          <Text style={styles.cardEmoji}>💰</Text>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>{getTranslation(lang, 'mandiTitle')}</Text>
            <Text style={styles.cardDesc}>{getTranslation(lang, 'benchmarkNotice')}</Text>
          </View>
          <Text style={styles.arrow}>➔</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.infoCard, { backgroundColor: '#F3E5F5' }]}
          onPress={() => router.push('/(tabs)/info/schemes')}
          activeOpacity={0.8}
          accessibilityLabel="Government Schemes for Farmers"
          accessibilityRole="button"
        >
          <Text style={styles.cardEmoji}>🏛</Text>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>{getTranslation(lang, 'schemesTitle')}</Text>
            <Text style={styles.cardDesc}>PM-KISAN, Fasal Bima, Subsidy Schemes</Text>
          </View>
          <Text style={styles.arrow}>➔</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.infoCard, { backgroundColor: '#E8EAF6' }]}
          onPress={() => router.push('/(tabs)/info/news')}
          activeOpacity={0.8}
          accessibilityLabel="Agricultural News and Farming Updates"
          accessibilityRole="button"
        >
          <Text style={styles.cardEmoji}>📰</Text>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>{getTranslation(lang, 'newsTitle')}</Text>
            <Text style={styles.cardDesc}>Farming tech, market trends, policies</Text>
          </View>
          <Text style={styles.arrow}>➔</Text>
        </TouchableOpacity>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: ComponentSize.minTouchTarget * 1.5,
  },
  cardEmoji: {
    fontSize: 36,
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  cardDesc: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  arrow: {
    fontSize: 20,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
});

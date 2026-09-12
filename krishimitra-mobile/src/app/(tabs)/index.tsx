import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '../../../components/AppHeader';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { NetworkStatusBadge } from '../../../components/NetworkStatusBadge';
import { Card } from '../../../components/Card';
import { SectionHeader } from '../../../components/SectionHeader';
import { Colors, Typography, Spacing, BorderRadius, ComponentSize, Elevation } from '../../../constants/theme';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.flexOne}>
      <AppHeader
        farmerName="Ramesh Prasad"
        villageName="Kishanpur, UP"
        onProfilePress={() => router.push('/(tabs)/profile')}
      />
      <NetworkStatusBadge />

      <ScreenContainer>
        {/* Welcome Banner */}
        <Card style={styles.welcomeCard}>
          <Text style={styles.welcomeGreeting}>नमस्ते, रमेश! 👋</Text>
          <Text style={styles.welcomeMessage}>
            आज आप कौन सी कृषि सेवा का उपयोग करना चाहते हैं?
          </Text>
          <Text style={styles.subtextEnglish}>
            Which farming service do you want to use today?
          </Text>
        </Card>

        {/* Call Sarvam AI Live Banner */}
        <TouchableOpacity
          style={styles.callBanner}
          onPress={() => router.push('/(tabs)/assistant')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Call Sarvam AI Live Voice Assistant"
        >
          <Text style={styles.callEmoji}>📞</Text>
          <View style={styles.callTextContainer}>
            <Text style={styles.callTitle}>Call Sarvam AI (लाइव कॉल)</Text>
            <Text style={styles.callSubtext}>अपनी भाषा में बोलकर तुरंत सलाह पाएं</Text>
          </View>
        </TouchableOpacity>

        {/* Quick Action Grid */}
        <SectionHeader title="मुख्य सेवाएं (Quick Actions)" />

        <View style={styles.grid}>
          {/* Scan Crop Card */}
          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: Colors.primaryLight }]}
            onPress={() => router.push('/(tabs)/vision')}
            activeOpacity={0.8}
          >
            <Text style={styles.gridEmoji}>🌿</Text>
            <Text style={styles.gridTitle}>फसल बीमारी (Scan Crop)</Text>
            <Text style={styles.gridDesc}>रोग की जांच और उपचार</Text>
          </TouchableOpacity>

          {/* Soil Test Card */}
          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: '#EFEBE9' }]}
            onPress={() => router.push('/(tabs)/vision')}
            activeOpacity={0.8}
          >
            <Text style={styles.gridEmoji}>🟤</Text>
            <Text style={styles.gridTitle}>मिट्टी परीक्षण (Soil Test)</Text>
            <Text style={styles.gridDesc}>नमी और खाद की जांच</Text>
          </TouchableOpacity>

          {/* Ask AI Card */}
          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: Colors.voiceAction }]}
            onPress={() => router.push('/(tabs)/assistant')}
            activeOpacity={0.8}
          >
            <Text style={styles.gridEmoji}>🎤</Text>
            <Text style={styles.gridTitle}>एआई सवाल (Ask AI)</Text>
            <Text style={styles.gridDesc}>बोलकर सवाल पूछें</Text>
          </TouchableOpacity>

          {/* Weather Card */}
          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: Colors.weatherCard }]}
            onPress={() => router.push('/(tabs)/info/weather')}
            activeOpacity={0.8}
          >
            <Text style={styles.gridEmoji}>🌦</Text>
            <Text style={styles.gridTitle}>मौसम (Weather)</Text>
            <Text style={styles.gridDesc}>7 दिन का पूर्वानुमान</Text>
          </TouchableOpacity>

          {/* Mandi Prices Card */}
          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: Colors.mandiCard }]}
            onPress={() => router.push('/(tabs)/info/mandi')}
            activeOpacity={0.8}
          >
            <Text style={styles.gridEmoji}>💰</Text>
            <Text style={styles.gridTitle}>मंडी भाव (Mandi Rates)</Text>
            <Text style={styles.gridDesc}>फसल बाजार दरें</Text>
          </TouchableOpacity>

          {/* Schemes Card */}
          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: '#F3E5F5' }]}
            onPress={() => router.push('/(tabs)/info/schemes')}
            activeOpacity={0.8}
          >
            <Text style={styles.gridEmoji}>🏛</Text>
            <Text style={styles.gridTitle}>सरकारी योजनाएं (Schemes)</Text>
            <Text style={styles.gridDesc}>पीएम-किसान व अन्य</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  welcomeCard: {
    backgroundColor: Colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  welcomeGreeting: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryDark,
    marginBottom: Spacing.xs,
  },
  welcomeMessage: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  subtextEnglish: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  callBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primaryDark,
    marginBottom: Spacing.md,
    ...Elevation.low,
  },
  callEmoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  callTextContainer: {
    flex: 1,
  },
  callTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryDark,
  },
  callSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: ComponentSize.minTouchTarget * 2.2,
  },
  gridEmoji: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  gridTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  gridDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

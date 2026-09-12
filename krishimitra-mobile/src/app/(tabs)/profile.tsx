import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { AppHeader } from '../../../components/AppHeader';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { Card } from '../../../components/Card';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { Colors, Typography, Spacing } from '../../../constants/theme';
import { storageService } from '../../../services/storageService';
import { FarmerProfile } from '../../../types/profile.types';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<FarmerProfile | null>(null);

  useEffect(() => {
    storageService.getFarmerProfile().then(setProfile);
  }, []);

  return (
    <View style={styles.flexOne}>
      <AppHeader title="किसान प्रोफ़ाइल" subtitle="Farmer Profile & Settings" showProfileBadge={false} />

      <ScreenContainer>
        <Card style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👨‍🌾</Text>
          </View>
          <Text style={styles.nameText}>{profile?.name || 'Ramesh Prasad'}</Text>
          <Text style={styles.villageText}>
            {profile?.village || 'Kishanpur'}, {profile?.state || 'Uttar Pradesh'}
          </Text>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>प्राथमिक फसलें (Crops):</Text>
            <Text style={styles.value}>{profile?.primaryCrops?.join(', ') || 'Wheat, Paddy'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>ज़मीन का क्षेत्रफल (Land):</Text>
            <Text style={styles.value}>{profile?.landSizeAcres || '2.5'} एकड़</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>पसंदीदा भाषा (Language):</Text>
            <Text style={styles.value}>हिन्दी (Hindi)</Text>
          </View>

          <PrimaryButton
            title="प्रोफ़ाइल संपादित करें (Edit Profile)"
            onPress={() => {}}
            style={styles.editBtn}
          />
        </Card>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarEmoji: {
    fontSize: 40,
  },
  nameText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  villageText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    width: '100%',
    marginVertical: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  editBtn: {
    width: '100%',
    marginTop: Spacing.md,
  },
});

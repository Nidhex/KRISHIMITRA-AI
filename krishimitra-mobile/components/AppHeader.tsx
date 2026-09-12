/* ==========================================================================
   KrishiMitra AI — AppHeader Component
   Top header banner displaying brand title, tagline, & profile avatar.
   ========================================================================== */

import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, Elevation, ComponentSize } from '../constants/theme';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  farmerName?: string;
  villageName?: string;
  onProfilePress?: () => void;
  showProfileBadge?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title = 'KrishiMitra AI',
  subtitle = 'Simple AI Assistance for Every Farmer',
  farmerName = 'Ramesh Prasad',
  villageName = 'Kishanpur, UP',
  onProfilePress,
  showProfileBadge = true,
}) => {
  return (
    <View style={styles.headerContainer} accessibilityRole="header">
      <View style={styles.brandRow}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🌱</Text>
        </View>
        <View style={styles.brandTextContainer}>
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.subtitleText} numberOfLines={1}>{subtitle}</Text>
        </View>
      </View>

      {showProfileBadge && (
        <TouchableOpacity
          style={styles.profileBadge}
          onPress={onProfilePress}
          activeOpacity={0.7}
          accessibilityLabel={`Profile for ${farmerName}, ${villageName}`}
          accessibilityRole="button"
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👨‍🌾</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.farmerNameText} numberOfLines={1}>{farmerName}</Text>
            <Text style={styles.villageText} numberOfLines={1}>{villageName}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Elevation.low,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  logoEmoji: {
    fontSize: 24,
  },
  brandTextContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryDark,
  },
  subtitleText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: ComponentSize.minTouchTarget,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  profileInfo: {
    maxWidth: 100,
  },
  farmerNameText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  villageText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
});

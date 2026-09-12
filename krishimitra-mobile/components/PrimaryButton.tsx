/* ==========================================================================
   KrishiMitra AI — PrimaryButton Component
   Large, high-contrast action button designed for farmer accessibility.
   ========================================================================== */

import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ActivityIndicator, View, ViewStyle, TextStyle } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, ComponentSize, Elevation } from '../constants/theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      accessibilityLabel={accessibilityLabel || title}
    >
      {loading ? (
        <ActivityIndicator color={Colors.textOnPrimary} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <Text style={styles.iconText}>{icon}</Text> : null}
          <Text style={[styles.title, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primaryDark,
    height: ComponentSize.buttonHeight,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    ...Elevation.low,
  },
  buttonDisabled: {
    backgroundColor: Colors.textMuted,
    opacity: 0.6,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textOnPrimary,
  },
});

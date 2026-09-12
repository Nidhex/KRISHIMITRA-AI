/* ==========================================================================
   KrishiMitra AI — Card Component
   Standard container card with subtle border & elevation.
   ========================================================================== */

import React from 'react';
import { StyleSheet, View, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Elevation } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  testID,
  accessibilityLabel,
}) => {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={onPress}
        activeOpacity={0.8}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, style]} testID={testID}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Elevation.low,
  },
});

/* ==========================================================================
   KrishiMitra AI — SecondaryButton Component
   Outlined button for secondary actions.
   ========================================================================== */

import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View, ViewStyle, TextStyle } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, ComponentSize } from '../constants/theme';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  icon?: string;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  title,
  onPress,
  icon,
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
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
    >
      <View style={styles.contentRow}>
        {icon ? <Text style={styles.iconText}>{icon}</Text> : null}
        <Text style={[styles.title, textStyle]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.surface,
    height: ComponentSize.buttonHeight,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  buttonDisabled: {
    borderColor: Colors.border,
    opacity: 0.5,
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
    color: Colors.primaryDark,
  },
});

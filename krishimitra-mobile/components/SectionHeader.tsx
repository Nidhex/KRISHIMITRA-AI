/* ==========================================================================
   KrishiMitra AI — SectionHeader Component
   ========================================================================== */

import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onActionPress?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionText,
  onActionPress,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>{title}</Text>
      {actionText && onActionPress ? (
        <TouchableOpacity onPress={onActionPress} activeOpacity={0.7}>
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  titleText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  actionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryDark,
  },
});

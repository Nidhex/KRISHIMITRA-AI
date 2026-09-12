/* ==========================================================================
   KrishiMitra AI — EmptyState Component
   ========================================================================== */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '🌾',
  title,
  description,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  icon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

/* ==========================================================================
   KrishiMitra AI — LoadingIndicator Component
   ========================================================================== */

import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

interface LoadingIndicatorProps {
  message?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'जानकारी लोड हो रही है... (Loading...)',
}) => {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={message}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.messageText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

/* ==========================================================================
   KrishiMitra AI — ErrorState Component
   ========================================================================== */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { PrimaryButton } from './PrimaryButton';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'समस्या हुई (Error)',
  message = 'जानकारी लोड नहीं हो सकी। कृपया इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।',
  onRetry,
  retryText = 'पुनः प्रयास करें (Retry)',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <PrimaryButton
          title={retryText}
          onPress={onRetry}
          style={styles.retryButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    backgroundColor: '#FFEBEE',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  icon: {
    fontSize: 36,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.error,
    marginBottom: Spacing.xs,
  },
  message: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  retryButton: {
    width: '100%',
  },
});

/* ==========================================================================
   KrishiMitra AI — ScreenContainer Component
   Standard page layout wrapper with safe area, scroll handling, & padding.
   ========================================================================== */

import React from 'react';
import { StyleSheet, View, ScrollView, ViewStyle, StatusBar } from 'react-native';
import { Colors, Spacing } from '../constants/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  testID?: string;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
  testID,
}) => {
  return (
    <View style={[styles.container, style]} testID={testID}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, contentContainerStyle]}>{children}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.screenPadding,
    paddingBottom: Spacing.xxxl,
  },
  content: {
    flex: 1,
    padding: Spacing.screenPadding,
  },
});

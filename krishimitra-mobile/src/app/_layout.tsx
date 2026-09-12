import { Stack } from 'expo-router';
import React from 'react';
import { Colors } from '../../constants/theme';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.textOnPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: Colors.background,
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ title: 'Page Not Found' }} />
    </Stack>
  );
}

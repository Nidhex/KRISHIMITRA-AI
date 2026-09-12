import { Tabs } from 'expo-router';
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../../constants/theme';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={styles.tabIconEmoji}>{emoji}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primaryDark,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: Typography.fontSize.xs,
          fontWeight: Typography.fontWeight.semibold,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'मुख्य (Home)',
          tabBarIcon: () => <TabIcon emoji="🏠" />,
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'एआई सहायक (AI)',
          tabBarIcon: () => <TabIcon emoji="🤖" />,
        }}
      />
      <Tabs.Screen
        name="vision"
        options={{
          title: 'फसल जाँच (Scan)',
          tabBarIcon: () => <TabIcon emoji="🌿" />,
        }}
      />
      <Tabs.Screen
        name="info"
        options={{
          title: 'जानकारी (Info)',
          tabBarIcon: () => <TabIcon emoji="📊" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'प्रोफ़ाइल (Profile)',
          tabBarIcon: () => <TabIcon emoji="👨‍🌾" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconEmoji: {
    fontSize: 22,
  },
});

import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { colors, fonts } from '../../src/theme';

function TabIcon({ glyph, focused }: { glyph: string; focused: boolean }) {
  return <Text style={{ fontSize: 21, opacity: focused ? 1 : 0.4 }}>{glyph}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 84,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.terracotta,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10.5, fontFamily: fonts.sansBold, letterSpacing: 0.3 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Discover', tabBarIcon: ({ focused }) => <TabIcon glyph="🍳" focused={focused} /> }}
      />
      <Tabs.Screen
        name="chef"
        options={{ title: 'Sous-Chef', tabBarIcon: ({ focused }) => <TabIcon glyph="👨‍🍳" focused={focused} /> }}
      />
      <Tabs.Screen
        name="pantry"
        options={{ title: 'Pantry & Cart', tabBarIcon: ({ focused }) => <TabIcon glyph="🛒" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'You', tabBarIcon: ({ focused }) => <TabIcon glyph="⚙️" focused={focused} /> }}
      />
    </Tabs>
  );
}

import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { colors, radius, spacing, type } from '../theme';

export function tap() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}

export function SectionTitle({ children, action, onAction }: {
  children: React.ReactNode;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={type.label}>{children}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Card({ children, style, onPress }: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
}) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.card, pressed && { backgroundColor: colors.cardPressed }, style]}
    >
      {children}
    </Pressable>
  );
}

export function GradientButton({ title, onPress, icon, variant = 'flame', disabled }: {
  title: string;
  onPress: () => void;
  icon?: string;
  variant?: 'flame' | 'herb' | 'wine' | 'ghost';
  disabled?: boolean;
}) {
  const palettes: Record<string, [string, string]> = {
    flame: [colors.flame, colors.ember],
    herb: ['#6FBF73', '#4E9E59'],
    wine: ['#9B5DE5', '#7440B8'],
    ghost: [colors.card, colors.card],
  };
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [{ opacity: disabled ? 0.4 : pressed ? 0.85 : 1 }]}
    >
      <LinearGradient
        colors={palettes[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.button, variant === 'ghost' && { borderWidth: 1, borderColor: colors.border }]}
      >
        <Text style={[styles.buttonText, variant === 'ghost' && { color: colors.textSecondary }]}>
          {icon ? `${icon}  ` : ''}{title}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, tone = 'flame' }: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'flame' | 'herb' | 'wine' | 'danger';
}) {
  const tones = {
    flame: { bg: colors.flameSoft, fg: colors.flame },
    herb: { bg: colors.herbSoft, fg: colors.herb },
    wine: { bg: colors.wineSoft, fg: colors.wine },
    danger: { bg: '#33201E', fg: colors.danger },
  } as const;
  const t = tones[tone];
  return (
    <Pressable
      onPress={onPress ? () => { tap(); onPress(); } : undefined}
      style={[
        styles.chip,
        { backgroundColor: selected ? t.bg : colors.card, borderColor: selected ? t.fg : colors.border },
      ]}
    >
      <Text style={[styles.chipText, { color: selected ? t.fg : colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ children, tone = 'neutral' }: {
  children: React.ReactNode;
  tone?: 'neutral' | 'flame' | 'herb' | 'wine' | 'danger';
}) {
  const tones = {
    neutral: { bg: colors.bgElevated, fg: colors.textSecondary },
    flame: { bg: colors.flameSoft, fg: colors.flame },
    herb: { bg: colors.herbSoft, fg: colors.herb },
    wine: { bg: colors.wineSoft, fg: colors.wine },
    danger: { bg: '#33201E', fg: colors.danger },
  } as const;
  const t = tones[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      <Text style={[styles.pillText, { color: t.fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionAction: { color: colors.flame, fontWeight: '600', fontSize: 13 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    borderRadius: radius.full,
    paddingVertical: 15,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  buttonText: { color: '#16110B', fontWeight: '800', fontSize: 15.5 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipText: { fontSize: 13.5, fontWeight: '600' },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginRight: 6,
    marginBottom: 6,
  },
  pillText: { fontSize: 11.5, fontWeight: '700' },
});

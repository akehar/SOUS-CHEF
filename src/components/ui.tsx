import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { PressableScale } from './motion';

export function tap() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}

/** Culinary-Lens section eyebrow: terracotta line + tracked uppercase label. */
export function Eyebrow({ children, icon }: { children: React.ReactNode; icon?: string }) {
  return (
    <View style={styles.eyebrowRow}>
      <View style={styles.eyebrowLine} />
      {icon ? <Text style={{ fontSize: 12 }}>{icon}</Text> : null}
      <Text style={type.label}>{children}</Text>
    </View>
  );
}

/** Serif headline with an italic terracotta accent word, e.g.
 *  <EditorialTitle pre="What are we " accent="cooking" post=" tonight?" /> */
export function EditorialTitle({
  pre,
  accent,
  post,
  size = 'hero',
}: {
  pre?: string;
  accent?: string;
  post?: string;
  size?: 'hero' | 'title';
}) {
  const base = size === 'hero' ? type.hero : type.title;
  return (
    <Text style={base}>
      {pre}
      {accent ? (
        <Text style={[base, { fontFamily: fonts.serifItalic, color: colors.terracotta }]}>{accent}</Text>
      ) : null}
      {post}
    </Text>
  );
}

export function SectionTitle({ children, action, onAction }: {
  children: React.ReactNode;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionRow}>
      <Eyebrow>{children}</Eyebrow>
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
    <PressableScale
      onPress={() => {
        tap();
        onPress();
      }}
      style={StyleSheet.flatten([styles.card, style])}
    >
      {children}
    </PressableScale>
  );
}

export function GradientButton({ title, onPress, icon, variant = 'flame', disabled }: {
  title: string;
  onPress: () => void;
  icon?: string;
  variant?: 'flame' | 'herb' | 'wine' | 'ghost' | 'gold';
  disabled?: boolean;
}) {
  const palettes: Record<string, { bg: string; fg: string; border?: string }> = {
    flame: { bg: colors.terracotta, fg: '#FFFFFF' },
    herb: { bg: colors.herb, fg: '#FFFFFF' },
    wine: { bg: colors.wine, fg: '#FFFFFF' },
    gold: { bg: colors.gold, fg: colors.text },
    ghost: { bg: 'transparent', fg: colors.textSecondary, border: colors.border },
  };
  const p = palettes[variant];
  return (
    <PressableScale
      disabled={disabled}
      scaleTo={0.98}
      onPress={() => {
        tap();
        onPress();
      }}
      style={StyleSheet.flatten([
        styles.button,
        { backgroundColor: p.bg, opacity: disabled ? 0.45 : 1 },
        p.border ? { borderWidth: 1.5, borderColor: p.border } : null,
        variant !== 'ghost' ? shadow.card : null,
      ])}
    >
      <Text style={[styles.buttonText, { color: p.fg }]}>
        {icon ? `${icon}  ` : ''}{title}
      </Text>
    </PressableScale>
  );
}

export function Chip({ label, selected, onPress, tone = 'flame' }: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'flame' | 'herb' | 'wine' | 'danger';
}) {
  const tones = {
    flame: { bg: colors.terracottaSoft, fg: colors.terracotta },
    herb: { bg: colors.herbSoft, fg: colors.herb },
    wine: { bg: colors.wineSoft, fg: colors.wine },
    danger: { bg: '#F9E5E2', fg: colors.danger },
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
  tone?: 'neutral' | 'flame' | 'herb' | 'wine' | 'danger' | 'gold';
}) {
  const tones = {
    neutral: { bg: colors.bgElevated, fg: colors.textSecondary },
    flame: { bg: colors.terracottaSoft, fg: colors.terracotta },
    herb: { bg: colors.herbSoft, fg: colors.herb },
    wine: { bg: colors.wineSoft, fg: colors.wine },
    danger: { bg: '#F9E5E2', fg: colors.danger },
    gold: { bg: colors.goldSoft, fg: colors.butter },
  } as const;
  const t = tones[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      <Text style={[styles.pillText, { color: t.fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eyebrowLine: { height: 1, width: 26, backgroundColor: colors.terracotta },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionAction: { color: colors.terracotta, fontFamily: fonts.sansSemiBold, fontSize: 13 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  button: {
    borderRadius: radius.full,
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  buttonText: { fontFamily: fonts.sansBold, fontSize: 15, letterSpacing: 0.2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.5,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipText: { fontSize: 13, fontFamily: fonts.sansSemiBold },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: radius.full,
    marginRight: 6,
    marginBottom: 6,
  },
  pillText: { fontSize: 11.5, fontFamily: fonts.sansBold, letterSpacing: 0.3 },
});

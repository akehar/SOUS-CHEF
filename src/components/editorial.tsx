import React from 'react';
import { ImageStyle, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { getArt } from '../data/recipeArt';
import { Recipe } from '../types';
import { PressableScale } from './motion';
import { tap } from './ui';

// ── Condé-Nast-style editorial primitives ──────────────────────────────────
// Hairline rules, tracked kickers, a masthead, full-bleed feature, a numbered
// contents index, and pull-quote bands. These are the layout vocabulary that
// makes the feed read like a magazine spread instead of a list of cards.

/** 1px hairline rule, optionally with a centered tracked label. */
export function Rule({ label, style }: { label?: string; style?: ViewStyle }) {
  if (!label) return <View style={[styles.rule, style]} />;
  return (
    <View style={[styles.ruleRow, style]}>
      <View style={styles.ruleSeg} />
      <Text style={styles.ruleLabel}>{label}</Text>
      <View style={styles.ruleSeg} />
    </View>
  );
}

/** Tracked all-caps eyebrow with an optional leading tick. */
export function Kicker({ children, tick = true, color }: { children: React.ReactNode; tick?: boolean; color?: string }) {
  return (
    <View style={styles.kickerRow}>
      {tick ? <View style={[styles.kickerTick, color ? { backgroundColor: color } : null]} /> : null}
      <Text style={[type.kicker, color ? { color } : null]}>{children}</Text>
    </View>
  );
}

/** Magazine masthead: hairline, serif wordmark, edition + date line. */
export function Masthead({ edition }: { edition: string }) {
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  }).toUpperCase();
  return (
    <View style={styles.masthead}>
      <View style={styles.rule} />
      <Text style={styles.wordmark}>SOUS<Text style={{ color: colors.terracotta }}>·</Text>CHEF</Text>
      <Text style={styles.editionLine}>{edition}  ·  {date}</Text>
      <View style={styles.ruleThin} />
    </View>
  );
}

// Cover art with graceful fallback to a gradient "plate" hero.
function CoverArt({ recipe, style, emojiSize = 64 }: { recipe: Recipe; style?: ImageStyle; emojiSize?: number }) {
  const art = getArt(recipe.id)?.cover ?? (recipe.image ? { uri: recipe.image } : undefined);
  if (art) return <Image source={art} style={[StyleSheet.absoluteFill, style]} contentFit="cover" transition={400} />;
  return (
    <LinearGradient
      colors={[recipe.heroColor, shadeUp(recipe.heroColor)]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
    >
      <View style={styles.glow} />
      <Text style={{ fontSize: emojiSize }}>{recipe.emoji}</Text>
    </LinearGradient>
  );
}

function shadeUp(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number, t: number) => Math.round(c + (t - c) * 0.4);
  const r = mix((n >> 16) & 255, 250);
  const g = mix((n >> 8) & 255, 244);
  const b = mix(n & 255, 230);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Full-bleed cover story — kicker, large serif title and deck over the image. */
export function FeatureCard({ recipe, kicker = 'The Cover Dish', onPress }: {
  recipe: Recipe;
  kicker?: string;
  onPress: () => void;
}) {
  return (
    <PressableScale scaleTo={0.985} onPress={() => { tap(); onPress(); }} style={styles.feature}>
      <CoverArt recipe={recipe} emojiSize={92} />
      <LinearGradient
        colors={['rgba(20,15,10,0.05)', 'rgba(20,15,10,0.78)']}
        locations={[0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.featureTop}>
        <Text style={styles.featureKicker}>{kicker.toUpperCase()}</Text>
      </View>
      <View style={styles.featureBody}>
        <Text style={styles.featureTitle}>{recipe.title}</Text>
        <Text style={styles.featureDeck} numberOfLines={2}>{recipe.tagline}</Text>
        <View style={styles.featureMeta}>
          <Text style={styles.featureMetaText}>{recipe.cuisine.toUpperCase()}</Text>
          <View style={styles.metaDot} />
          <Text style={styles.featureMetaText}>{recipe.totalMin} MIN</Text>
          <View style={styles.metaDot} />
          <Text style={styles.featureMetaText}>{recipe.macros.protein}G PROTEIN</Text>
        </View>
      </View>
    </PressableScale>
  );
}

/** Numbered contents row — the signature magazine "index" device. */
export function IndexRow({ recipe, n, onPress, last }: {
  recipe: Recipe;
  n: number;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <PressableScale scaleTo={0.99} onPress={() => { tap(); onPress(); }}>
      <View style={[styles.indexRow, !last && styles.indexBorder]}>
        <Text style={styles.indexNum}>{String(n).padStart(2, '0')}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.indexCuisine}>{recipe.cuisine.toUpperCase()}  ·  {recipe.totalMin} MIN</Text>
          <Text style={styles.indexTitle} numberOfLines={2}>{recipe.title}</Text>
          <Text style={styles.indexDeck} numberOfLines={1}>{recipe.tagline}</Text>
        </View>
        <View style={styles.indexThumb}>
          <CoverArt recipe={recipe} emojiSize={30} />
        </View>
      </View>
    </PressableScale>
  );
}

/** Full-bleed pull-quote band — the editorial breath between sections. */
export function PullQuote({ quote, attribution, invert }: {
  quote: string;
  attribution?: string;
  invert?: boolean;
}) {
  return (
    <View style={[styles.quoteBand, invert && { backgroundColor: colors.ink }]}>
      <Text style={[styles.quoteMark, invert && { color: 'rgba(255,255,255,0.18)' }]}>“</Text>
      <Text style={[styles.quoteText, invert && { color: colors.cream }]}>{quote}</Text>
      {attribution ? (
        <Text style={[styles.quoteAttr, invert && { color: 'rgba(255,255,255,0.6)' }]}>— {attribution}</Text>
      ) : null}
    </View>
  );
}

/** Compact editorial card for horizontal departments. */
export function MiniCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  return (
    <PressableScale scaleTo={0.975} onPress={() => { tap(); onPress(); }} style={styles.mini}>
      <View style={styles.miniImage}>
        <CoverArt recipe={recipe} emojiSize={44} />
      </View>
      <Text style={styles.miniKicker}>{recipe.cuisine.toUpperCase()}</Text>
      <Text style={styles.miniTitle} numberOfLines={2}>{recipe.title}</Text>
      <Text style={styles.miniMeta}>{recipe.totalMin} min · {recipe.macros.calories} kcal</Text>
    </PressableScale>
  );
}

/** Asymmetric two-up: a taller lead card beside a shorter companion. */
export function TwoUp({ lead, companion, onLead, onCompanion }: {
  lead: Recipe;
  companion: Recipe;
  onLead: () => void;
  onCompanion: () => void;
}) {
  return (
    <View style={styles.twoUp}>
      <PressableScale scaleTo={0.975} onPress={() => { tap(); onLead(); }} style={{ flex: 1.25 }}>
        <View style={[styles.twoUpImage, { height: 230 }]}>
          <CoverArt recipe={lead} emojiSize={56} />
          <LinearGradient colors={['transparent', 'rgba(20,15,10,0.55)']} style={styles.twoUpShade} />
          <View style={styles.twoUpCaption}>
            <Text style={styles.twoUpKicker}>{lead.cuisine.toUpperCase()}</Text>
            <Text style={styles.twoUpTitle} numberOfLines={2}>{lead.title}</Text>
          </View>
        </View>
      </PressableScale>
      <PressableScale scaleTo={0.975} onPress={() => { tap(); onCompanion(); }} style={{ flex: 1 }}>
        <View style={[styles.twoUpImage, { height: 180 }]}>
          <CoverArt recipe={companion} emojiSize={44} />
          <LinearGradient colors={['transparent', 'rgba(20,15,10,0.55)']} style={styles.twoUpShade} />
          <View style={styles.twoUpCaption}>
            <Text style={styles.twoUpKicker}>{companion.cuisine.toUpperCase()}</Text>
            <Text style={[styles.twoUpTitle, { fontSize: 16 }]} numberOfLines={2}>{companion.title}</Text>
          </View>
        </View>
      </PressableScale>
    </View>
  );
}

/** Drop-capped opening paragraph for article-style intros. */
export function DropCapText({ children }: { children: string }) {
  const first = children.charAt(0);
  const rest = children.slice(1);
  return (
    <Text style={styles.dropBody}>
      <Text style={styles.dropCap}>{first}</Text>{rest}
    </Text>
  );
}

const styles = StyleSheet.create({
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline, opacity: 0.85, alignSelf: 'stretch' },
  ruleThin: { height: StyleSheet.hairlineWidth, backgroundColor: colors.rule, alignSelf: 'stretch' },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ruleSeg: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.rule },
  ruleLabel: {
    fontSize: 10.5, fontFamily: fonts.sansBold, color: colors.textMuted,
    letterSpacing: 2.6, textTransform: 'uppercase',
  },

  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kickerTick: { width: 18, height: 2, backgroundColor: colors.terracotta },

  masthead: { alignItems: 'center', gap: 8, paddingTop: spacing.xs },
  wordmark: {
    fontFamily: fonts.serifBlack, fontSize: 30, color: colors.ink,
    letterSpacing: 3, marginTop: 10,
  },
  editionLine: {
    fontSize: 9.5, fontFamily: fonts.sansBold, color: colors.textMuted,
    letterSpacing: 2.4, marginBottom: 10,
  },

  glow: {
    position: 'absolute', top: -40, right: -30, width: 180, height: 180,
    borderRadius: 90, backgroundColor: 'rgba(251,192,45,0.28)',
  },

  feature: {
    height: 460, borderRadius: radius.md, overflow: 'hidden',
    backgroundColor: colors.bgElevated, ...shadow.lifted,
  },
  featureTop: { position: 'absolute', top: spacing.md, left: spacing.md, right: spacing.md },
  featureKicker: {
    color: colors.cream, fontSize: 11, fontFamily: fonts.sansExtraBold, letterSpacing: 3,
  },
  featureBody: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.lg },
  featureTitle: {
    color: '#FFF', fontFamily: fonts.serifBlack, fontSize: 38, lineHeight: 40, letterSpacing: -0.6,
  },
  featureDeck: {
    color: 'rgba(255,255,255,0.88)', fontFamily: fonts.serifItalic, fontSize: 16, marginTop: 8, lineHeight: 22,
  },
  featureMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  featureMetaText: { color: 'rgba(255,255,255,0.9)', fontSize: 10.5, fontFamily: fonts.sansBold, letterSpacing: 1.6 },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.6)' },

  indexRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 16 },
  indexBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.rule },
  indexNum: { ...type.indexNum, width: 44 },
  indexCuisine: { fontSize: 9.5, fontFamily: fonts.sansBold, color: colors.terracotta, letterSpacing: 1.8, marginBottom: 3 },
  indexTitle: { fontFamily: fonts.serif, fontSize: 19, color: colors.ink, lineHeight: 23, letterSpacing: -0.2 },
  indexDeck: { fontFamily: fonts.serifItalic, fontSize: 13, color: colors.textMuted, marginTop: 3 },
  indexThumb: { width: 66, height: 66, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.bgElevated },

  quoteBand: {
    backgroundColor: colors.bgElevated, borderRadius: radius.md,
    paddingVertical: spacing.xl, paddingHorizontal: spacing.lg, alignItems: 'center',
  },
  quoteMark: { fontFamily: fonts.serifBlack, fontSize: 56, color: colors.rule, height: 44, lineHeight: 64 },
  quoteText: {
    fontFamily: fonts.serifItalic, fontSize: 23, lineHeight: 31, color: colors.ink,
    textAlign: 'center', marginTop: 4,
  },
  quoteAttr: {
    fontSize: 10.5, fontFamily: fonts.sansBold, color: colors.textMuted,
    letterSpacing: 2, marginTop: 16, textTransform: 'uppercase',
  },

  mini: { width: 190, marginRight: spacing.md },
  miniImage: { height: 150, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.bgElevated, ...shadow.card },
  miniKicker: { fontSize: 9.5, fontFamily: fonts.sansBold, color: colors.terracotta, letterSpacing: 1.8, marginTop: 10 },
  miniTitle: { fontFamily: fonts.serif, fontSize: 16.5, color: colors.ink, lineHeight: 20, marginTop: 3, letterSpacing: -0.2 },
  miniMeta: { ...type.caption, marginTop: 4 },

  twoUp: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  twoUpImage: { borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.bgElevated, ...shadow.card },
  twoUpShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },
  twoUpCaption: { position: 'absolute', left: 12, right: 12, bottom: 12 },
  twoUpKicker: { color: 'rgba(255,255,255,0.9)', fontSize: 9, fontFamily: fonts.sansBold, letterSpacing: 1.6 },
  twoUpTitle: { color: '#FFF', fontFamily: fonts.serif, fontSize: 19, lineHeight: 22, marginTop: 4, letterSpacing: -0.2 },

  dropBody: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 26, color: colors.text },
  dropCap: {
    fontFamily: fonts.serifBlack, fontSize: 52, lineHeight: 46, color: colors.terracotta,
  },
});

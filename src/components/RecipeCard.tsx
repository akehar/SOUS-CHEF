import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { Recipe } from '../types';
import { PressableScale } from './motion';
import { Pill, tap } from './ui';

// Editorial recipe card in the Culinary-Lens style: photo-forward hero with a
// bottom gradient, gold glass badge top-right, cuisine badge top-left, serif
// title below. When a recipe has no `image`, an art-directed "plate" hero
// (layered warm gradients + dish emoji) keeps the same anatomy.

function PlateHero({ recipe }: { recipe: Recipe }) {
  return (
    <LinearGradient
      colors={[recipe.heroColor, shadeUp(recipe.heroColor)]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={StyleSheet.absoluteFill}
    >
      {/* radial-ish gold glow, top right — like the mascot halo */}
      <View style={styles.glowGold} />
      <View style={styles.glowWarm} />
      <View style={styles.plate}>
        <Text style={styles.plateEmoji}>{recipe.emoji}</Text>
      </View>
    </LinearGradient>
  );
}

// Lighten a hex color toward cream for the gradient's second stop.
function shadeUp(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number, t: number) => Math.round(c + (t - c) * 0.45);
  const r = mix((n >> 16) & 255, 250);
  const g = mix((n >> 8) & 255, 244);
  const b = mix(n & 255, 230);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function RecipeCard({ recipe, wide }: { recipe: Recipe; wide?: boolean }) {
  const router = useRouter();
  return (
    <PressableScale
      scaleTo={0.975}
      onPress={() => {
        tap();
        router.push(`/recipe/${recipe.id}`);
      }}
      style={StyleSheet.flatten([styles.card, wide ? { width: '100%' } : { width: 272 }])}
    >
      <View style={[styles.hero, wide && { height: 190 }]}>
        {recipe.image ? (
          <Image source={{ uri: recipe.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
        ) : (
          <PlateHero recipe={recipe} />
        )}

        {/* bottom gradient, always on (touch has no hover) */}
        <LinearGradient
          colors={['transparent', 'rgba(20,12,6,0.42)']}
          style={styles.heroShade}
        />

        {/* gold glass badge — top right */}
        <View style={styles.goldBadge}>
          <Text style={styles.goldBadgeText}>
            {recipe.generatedByAI ? '✦ MADE FOR YOU' : '★ INTERACTIVE'}
          </Text>
        </View>

        {/* cuisine badge — top left */}
        <View style={styles.cuisineBadge}>
          <Text style={styles.cuisineText}>{recipe.cuisine.toUpperCase()}</Text>
        </View>

        {/* time, anchored bottom-left over the shade */}
        <Text style={styles.heroTime}>⏱ {recipe.totalMin} min · {recipe.difficulty}</Text>
      </View>

      <View style={{ paddingTop: 12, paddingHorizontal: 2 }}>
        <Text style={styles.title} numberOfLines={1}>{recipe.title}</Text>
        <Text style={styles.tagline} numberOfLines={2}>{recipe.tagline}</Text>
        <View style={styles.metaRow}>
          <Pill tone="herb">{recipe.macros.protein}g protein</Pill>
          <Pill tone="gold">{recipe.macros.calories} kcal</Pill>
          <Pill tone="wine">🍷 pairing</Pill>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { marginRight: spacing.md, marginBottom: 4 },
  hero: {
    height: 168,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
    ...shadow.card,
  },
  heroShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%' },
  glowGold: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(251,192,45,0.30)',
  },
  glowWarm: {
    position: 'absolute',
    bottom: -70,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  plate: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    marginTop: -52,
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.55)',
    ...shadow.lifted,
  },
  plateEmoji: { fontSize: 52 },
  goldBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(251,192,45,0.95)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  goldBadgeText: { color: colors.text, fontSize: 8.5, fontFamily: fonts.sansExtraBold, letterSpacing: 1.6 },
  cuisineBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(45,45,45,0.55)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  cuisineText: { color: '#FFF', fontSize: 8.5, fontFamily: fonts.sansBold, letterSpacing: 1.6 },
  heroTime: {
    position: 'absolute',
    left: 12,
    bottom: 10,
    color: '#FFF',
    fontSize: 12,
    fontFamily: fonts.sansSemiBold,
  },
  title: { ...type.heading, fontSize: 18 },
  tagline: { ...type.caption, color: colors.textSecondary, marginTop: 3, lineHeight: 18 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 9 },
});

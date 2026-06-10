import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors, radius, spacing } from '../theme';
import { Recipe } from '../types';
import { Card, Pill } from './ui';

export function RecipeCard({ recipe, wide }: { recipe: Recipe; wide?: boolean }) {
  const router = useRouter();
  return (
    <Card
      onPress={() => router.push(`/recipe/${recipe.id}`)}
      style={StyleSheet.flatten([styles.card, wide ? { width: '100%' } : { width: 270 }])}
    >
      <LinearGradient
        colors={[recipe.heroColor, colors.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.emoji}>{recipe.emoji}</Text>
        {recipe.generatedByAI ? (
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>✦ MADE FOR YOU</Text>
          </View>
        ) : null}
      </LinearGradient>
      <View style={{ padding: spacing.md }}>
        <Text style={styles.title} numberOfLines={1}>{recipe.title}</Text>
        <Text style={styles.tagline} numberOfLines={2}>{recipe.tagline}</Text>
        <View style={styles.metaRow}>
          <Pill tone="flame">⏱ {recipe.totalMin} min</Pill>
          <Pill tone="herb">{recipe.macros.protein}g protein</Pill>
          <Pill>{recipe.difficulty}</Pill>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0, overflow: 'hidden', marginRight: spacing.md },
  hero: {
    height: 110,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 52 },
  aiBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  aiBadgeText: { color: colors.butter, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.8 },
  title: { color: colors.text, fontSize: 16.5, fontWeight: '700' },
  tagline: { color: colors.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 18 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
});

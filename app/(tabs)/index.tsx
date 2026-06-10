import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { RECIPES, getRecipe } from '../../src/data/recipes';
import { useChat, useCookSession, usePreferences } from '../../src/store';
import { colors, radius, spacing, type } from '../../src/theme';
import { Card, GradientButton, Pill, SectionTitle } from '../../src/components/ui';
import { RecipeCard } from '../../src/components/RecipeCard';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Discover() {
  const router = useRouter();
  const { prefs } = usePreferences();
  const session = useCookSession((s) => s.session);
  const aiRecipes = useChat((s) => s.aiRecipes);
  const activeRecipe = session ? getRecipe(session.recipeId) ?? aiRecipes.find((r) => r.id === session.recipeId) : null;

  // Light personalization: float recipes matching the user's diet to the front.
  const ordered = [...RECIPES].sort((a, b) => {
    const score = (r: typeof a) =>
      prefs.diets.filter((d) => r.tags.some((t) => t.toLowerCase().includes(d.toLowerCase()))).length -
      prefs.allergens.filter((al) => r.allergens.includes(al.toLowerCase())).length * 10;
    return score(b) - score(a);
  });

  const quick = ordered.filter((r) => r.totalMin <= 30);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={type.caption}>{greeting()}{prefs.name ? `, ${prefs.name}` : ''}</Text>
        <Text style={[type.hero, { marginTop: 4 }]}>What are we{'\n'}cooking tonight?</Text>

        {/* Resume an in-flight cook session */}
        {session && activeRecipe ? (
          <Card style={styles.resumeCard} onPress={() => router.push(`/cook/${session.recipeId}`)}>
            <LinearGradient
              colors={[colors.flameSoft, colors.card]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 40 }}>{activeRecipe.emoji}</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.liveDot} />
                  <Text style={styles.resumeLabel}>
                    {session.pausedAt ? 'PAUSED — PICK UP WHERE YOU LEFT OFF' : 'COOKING NOW'}
                  </Text>
                </View>
                <Text style={styles.resumeTitle} numberOfLines={1}>{session.recipeTitle}</Text>
                <Text style={type.caption}>
                  Step {session.stepIndex + 1} of {activeRecipe.steps.length}
                </Text>
              </View>
              <Text style={{ color: colors.flame, fontSize: 24 }}>›</Text>
            </View>
          </Card>
        ) : (
          <Card style={styles.ctaCard} onPress={() => router.push('/chef')}>
            <Text style={{ fontSize: 32 }}>👨‍🍳</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.ctaTitle}>Ask your AI sous-chef</Text>
              <Text style={type.bodySecondary}>
                "I have chicken, 25 minutes and a gym session behind me" → custom recipe, live coaching, wine pairing.
              </Text>
            </View>
          </Card>
        )}

        {/* AI-generated recipes from chat */}
        {aiRecipes.length > 0 && (
          <>
            <SectionTitle>Made for you</SectionTitle>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rail}>
              {aiRecipes.map((r) => <RecipeCard key={r.id} recipe={r} />)}
            </ScrollView>
          </>
        )}

        <SectionTitle>Tonight's lineup</SectionTitle>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rail}>
          {ordered.map((r) => <RecipeCard key={r.id} recipe={r} />)}
        </ScrollView>

        <SectionTitle>Under 30 minutes</SectionTitle>
        {quick.map((r) => <View key={r.id} style={{ marginBottom: spacing.md }}><RecipeCard recipe={r} wide /></View>)}

        {/* Why it's different */}
        <SectionTitle>Your kitchen, upgraded</SectionTitle>
        <Card>
          <FeatureRow emoji="👁" title="Chef's Eye" body="Point your camera at the pan — the AI tells you when your onions are truly caramelized." />
          <FeatureRow emoji="🗣" title="Speaks up in real time" body="Hands covered in flour? Your sous-chef talks you through every step." />
          <FeatureRow emoji="🔄" title="Substitutes on the fly" body="Out of sherry? Get a chef-grade swap with exact ratios, instantly." />
          <FeatureRow emoji="🍷" title="Sommelier built in" body="Every recipe ships with a wine pairing and a zero-proof alternative." last />
        </Card>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureRow({ emoji, title, body, last }: { emoji: string; title: string; body: string; last?: boolean }) {
  return (
    <View style={[styles.featureRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14.5 }}>{title}</Text>
        <Text style={[type.bodySecondary, { fontSize: 13.5, marginTop: 2 }]}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  rail: { marginHorizontal: -spacing.md, paddingLeft: spacing.md },
  resumeCard: { marginTop: spacing.lg, overflow: 'hidden' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.live },
  resumeLabel: { color: colors.flame, fontSize: 10.5, fontWeight: '800', letterSpacing: 1 },
  resumeTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginTop: 2 },
  ctaCard: { marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center' },
  ctaTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 2 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
});

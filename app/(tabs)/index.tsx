import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { RECIPES, getRecipe } from '../../src/data/recipes';
import { useChat, useCookSession, usePreferences } from '../../src/store';
import { colors, fonts, radius, spacing, type } from '../../src/theme';
import { Card, EditorialTitle, Eyebrow, SectionTitle } from '../../src/components/ui';
import { Pulse, Reveal, Sway } from '../../src/components/motion';
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
        {/* Editorial hero */}
        <Reveal>
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Eyebrow>{greeting()}{prefs.name ? ` · ${prefs.name}` : ''}</Eyebrow>
              <View style={{ marginTop: 10 }}>
                <EditorialTitle pre={'What are we '} accent="cooking" post={' tonight?'} />
              </View>
              <Text style={[type.bodySecondary, { marginTop: 8, fontSize: 14 }]}>
                Your sous-chef is in the kitchen — camera on, wine chosen, macros counted.
              </Text>
            </View>
            <Sway style={styles.mascotWrap}>
              <View style={styles.mascotHalo} />
              <Text style={{ fontSize: 58 }}>👨‍🍳</Text>
            </Sway>
          </View>
        </Reveal>

        {/* Resume an in-flight cook session */}
        {session && activeRecipe ? (
          <Reveal index={1}>
            <Card style={styles.resumeCard} onPress={() => router.push(`/cook/${session.recipeId}`)}>
              <LinearGradient
                colors={[colors.goldSoft, colors.card]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 40 }}>{activeRecipe.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Pulse><View style={styles.liveDot} /></Pulse>
                    <Text style={styles.resumeLabel}>
                      {session.pausedAt ? 'PAUSED — PICK UP WHERE YOU LEFT OFF' : 'COOKING NOW'}
                    </Text>
                  </View>
                  <Text style={styles.resumeTitle} numberOfLines={1}>{session.recipeTitle}</Text>
                  <Text style={type.caption}>
                    Step {session.stepIndex + 1} of {activeRecipe.steps.length}
                  </Text>
                </View>
                <Text style={{ color: colors.terracotta, fontSize: 24 }}>›</Text>
              </View>
            </Card>
          </Reveal>
        ) : (
          <Reveal index={1}>
            <Card style={styles.ctaCard} onPress={() => router.push('/chef')}>
              <LinearGradient
                colors={[colors.goldSoft, colors.card]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.9 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={{ fontSize: 32 }}>💬</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.ctaTitle}>Ask your sous-chef</Text>
                <Text style={[type.bodySecondary, { fontSize: 13.5 }]}>
                  "Chicken, 25 minutes, post-gym" → custom recipe, live coaching, the right wine.
                </Text>
              </View>
              <Text style={{ color: colors.terracotta, fontSize: 24 }}>›</Text>
            </Card>
          </Reveal>
        )}

        {/* AI-generated recipes from chat */}
        {aiRecipes.length > 0 && (
          <Reveal index={2}>
            <SectionTitle>Made for you</SectionTitle>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rail}>
              {aiRecipes.map((r) => <RecipeCard key={r.id} recipe={r} />)}
            </ScrollView>
          </Reveal>
        )}

        <Reveal index={2}>
          <SectionTitle>Tonight's lineup</SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rail}>
            {ordered.map((r) => <RecipeCard key={r.id} recipe={r} />)}
          </ScrollView>
        </Reveal>

        <Reveal index={3}>
          <SectionTitle>Under 30 minutes</SectionTitle>
          {quick.map((r) => (
            <View key={r.id} style={{ marginBottom: spacing.lg }}>
              <RecipeCard recipe={r} wide />
            </View>
          ))}
        </Reveal>

        {/* Why it's different */}
        <Reveal index={4}>
          <SectionTitle>Your kitchen, upgraded</SectionTitle>
          <Card>
            <FeatureRow emoji="👁" title="Chef's Eye" body="Point your camera at the pan — the AI tells you when your onions are truly caramelized." />
            <FeatureRow emoji="🗣" title="Speaks up in real time" body="Hands covered in flour? Your sous-chef talks you through every step." />
            <FeatureRow emoji="🔄" title="Substitutes on the fly" body="Out of sherry? Get a chef-grade swap with exact ratios, instantly." />
            <FeatureRow emoji="🍷" title="Sommelier built in" body="Every recipe ships with a wine pairing and a zero-proof alternative." last />
          </Card>
        </Reveal>

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
        <Text style={{ color: colors.text, fontFamily: fonts.sansBold, fontSize: 14.5 }}>{title}</Text>
        <Text style={[type.bodySecondary, { fontSize: 13.5, marginTop: 2 }]}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mascotWrap: { width: 92, height: 92, alignItems: 'center', justifyContent: 'center' },
  mascotHalo: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(251,192,45,0.28)',
  },
  rail: { marginHorizontal: -spacing.md, paddingLeft: spacing.md },
  resumeCard: { marginTop: spacing.lg, overflow: 'hidden' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.live },
  resumeLabel: { color: colors.terracotta, fontSize: 10, fontFamily: fonts.sansExtraBold, letterSpacing: 1.2 },
  resumeTitle: { ...type.heading, fontSize: 17, marginTop: 2 },
  ctaCard: { marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  ctaTitle: { ...type.heading, fontSize: 17, marginBottom: 2 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
});

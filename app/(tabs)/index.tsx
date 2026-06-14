import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { RECIPES, getRecipe } from '../../src/data/recipes';
import { useChat, useCookSession, usePreferences } from '../../src/store';
import { colors, fonts, radius, spacing, type } from '../../src/theme';
import { Card } from '../../src/components/ui';
import { Pulse, Reveal } from '../../src/components/motion';
import {
  FeatureCard,
  IndexRow,
  Kicker,
  Masthead,
  MiniCard,
  PullQuote,
  Rule,
  TwoUp,
} from '../../src/components/editorial';

function edition(): string {
  const h = new Date().getHours();
  if (h < 11) return 'THE MORNING EDITION';
  if (h < 17) return 'THE MIDDAY EDITION';
  return 'THE EVENING EDITION';
}

export default function Discover() {
  const router = useRouter();
  const { prefs } = usePreferences();
  const session = useCookSession((s) => s.session);
  const aiRecipes = useChat((s) => s.aiRecipes);
  const activeRecipe = session
    ? getRecipe(session.recipeId) ?? aiRecipes.find((r) => r.id === session.recipeId)
    : null;

  const go = (id: string) => router.push(`/recipe/${id}`);

  // Personalize order: diet matches float up, allergen conflicts sink.
  const ordered = [...RECIPES].sort((a, b) => {
    const score = (r: typeof a) =>
      prefs.diets.filter((d) => r.tags.some((t) => t.toLowerCase().includes(d.toLowerCase()))).length -
      prefs.allergens.filter((al) => r.allergens.includes(al.toLowerCase())).length * 10;
    return score(b) - score(a);
  });

  // Carve the feed into magazine modules so the rhythm varies down the page.
  const cover = ordered[0];
  const contents = ordered.slice(1, 6); // the numbered index
  const twoUp = ordered.slice(6, 8);
  const quick = ordered.filter((r) => r.totalMin <= 30).slice(0, 8);
  const rest = ordered.slice(8);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Reveal><Masthead edition={edition()} /></Reveal>

        {/* Greeting / standfirst */}
        <Reveal index={1}>
          <View style={{ alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.md }}>
            <Text style={[type.deck, { textAlign: 'center' }]}>
              {prefs.name ? `Welcome back, ${prefs.name}. ` : ''}Tonight, we cook like
              someone who loves you is standing right beside you.
            </Text>
          </View>
        </Reveal>

        {/* Resume band */}
        {session && activeRecipe ? (
          <Reveal index={2}>
            <Card style={styles.resume} onPress={() => router.push(`/cook/${session.recipeId}`)}>
              <LinearGradient
                colors={[colors.goldSoft, colors.card]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 38 }}>{activeRecipe.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <Pulse><View style={styles.liveDot} /></Pulse>
                    <Text style={styles.resumeKicker}>
                      {session.pausedAt ? 'PAUSED · RESUME WHERE YOU LEFT OFF' : 'NOW COOKING'}
                    </Text>
                  </View>
                  <Text style={styles.resumeTitle} numberOfLines={1}>{session.recipeTitle}</Text>
                  <Text style={type.caption}>Step {session.stepIndex + 1} of {activeRecipe.steps.length}</Text>
                </View>
                <Text style={{ color: colors.terracotta, fontSize: 22 }}>›</Text>
              </View>
            </Card>
          </Reveal>
        ) : null}

        {/* Cover story */}
        {cover ? (
          <Reveal index={2}>
            <View style={{ marginTop: spacing.lg }}>
              <FeatureCard recipe={cover} kicker="The Cover Dish" onPress={() => go(cover.id)} />
            </View>
          </Reveal>
        ) : null}

        {/* AI recipes, if any */}
        {aiRecipes.length > 0 && (
          <Reveal index={3}>
            <Rule label="Composed for you" style={{ marginTop: spacing.xl }} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rail}>
              {aiRecipes.map((r) => <MiniCard key={r.id} recipe={r} onPress={() => go(r.id)} />)}
            </ScrollView>
          </Reveal>
        )}

        {/* The Contents — numbered index */}
        <Reveal index={3}>
          <Rule label="The Contents" style={{ marginTop: spacing.xl }} />
          <View style={{ marginTop: spacing.xs }}>
            {contents.map((r, i) => (
              <IndexRow
                key={r.id}
                recipe={r}
                n={i + 1}
                onPress={() => go(r.id)}
                last={i === contents.length - 1}
              />
            ))}
          </View>
        </Reveal>

        {/* Pull quote — the editorial breath */}
        {twoUp.length === 2 && (
          <Reveal index={2}>
            <View style={{ marginTop: spacing.xl }}>
              <PullQuote
                quote="A recipe tells you what to do. A sous-chef tells you when it's right."
                attribution="The SOUS-CHEF Philosophy"
                invert
              />
            </View>
          </Reveal>
        )}

        {/* Asymmetric two-up */}
        {twoUp.length === 2 && (
          <Reveal index={2}>
            <Kicker>{twoUp[0].difficulty === 'Easy' ? 'Weeknight Standbys' : 'Worth The Effort'}</Kicker>
            <View style={{ marginTop: spacing.md }}>
              <TwoUp
                lead={twoUp[0]}
                companion={twoUp[1]}
                onLead={() => go(twoUp[0].id)}
                onCompanion={() => go(twoUp[1].id)}
              />
            </View>
          </Reveal>
        )}

        {/* Department: quick dinners */}
        {quick.length > 0 && (
          <Reveal index={2}>
            <Rule label="In Thirty Minutes" style={{ marginTop: spacing.xl }} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rail}>
              {quick.map((r) => <MiniCard key={r.id} recipe={r} onPress={() => go(r.id)} />)}
            </ScrollView>
          </Reveal>
        )}

        {/* The rest, as a second numbered run for a full table of contents */}
        {rest.length > 0 && (
          <Reveal index={2}>
            <Rule label="Also In This Issue" style={{ marginTop: spacing.xl }} />
            <View style={{ marginTop: spacing.xs }}>
              {rest.map((r, i) => (
                <IndexRow
                  key={r.id}
                  recipe={r}
                  n={contents.length + i + 1}
                  onPress={() => go(r.id)}
                  last={i === rest.length - 1}
                />
              ))}
            </View>
          </Reveal>
        )}

        {/* Colophon — what makes it different, as an editorial list */}
        <Reveal index={2}>
          <Rule label="The Masthead" style={{ marginTop: spacing.xl }} />
          <View style={{ marginTop: spacing.md }}>
            <ColophonRow n="i" title="Chef's Eye" body="Your camera, watching the pan — telling you the moment the onions truly caramelize." />
            <ColophonRow n="ii" title="A Voice Beside You" body="Hands in the flour? The sous-chef talks you through every step, aloud." />
            <ColophonRow n="iii" title="Substitutions, On the Fly" body="Out of sherry? A chef-grade swap with exact ratios, instantly." />
            <ColophonRow n="iv" title="The Cellar" body="Every dish arrives with a wine pairing — and a zero-proof equal." last />
          </View>
        </Reveal>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ColophonRow({ n, title, body, last }: { n: string; title: string; body: string; last?: boolean }) {
  return (
    <View style={[styles.colophon, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.rule }]}>
      <Text style={styles.colophonNum}>{n}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.colophonTitle}>{title}</Text>
        <Text style={[type.bodySecondary, { fontSize: 13.5, marginTop: 2 }]}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.xs },
  rail: { marginHorizontal: -spacing.md, paddingLeft: spacing.md, marginTop: spacing.md },
  resume: { marginTop: spacing.lg, overflow: 'hidden' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.live },
  resumeKicker: { color: colors.terracotta, fontSize: 10, fontFamily: fonts.sansExtraBold, letterSpacing: 1.4 },
  resumeTitle: { ...type.heading, fontSize: 17, marginTop: 2 },
  colophon: { flexDirection: 'row', gap: spacing.md, paddingVertical: 14, alignItems: 'flex-start' },
  colophonNum: {
    fontFamily: fonts.serifItalic, fontSize: 22, color: colors.terracotta, width: 30, lineHeight: 26,
  },
  colophonTitle: { fontFamily: fonts.serif, fontSize: 17, color: colors.ink, letterSpacing: -0.2 },
});

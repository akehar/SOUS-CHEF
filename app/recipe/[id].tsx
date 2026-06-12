import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { getRecipe } from '../../src/data/recipes';
import { suggestSubstitute } from '../../src/services/chef';
import { useCart, useChat, useCookSession, usePreferences } from '../../src/store';
import { colors, fonts, radius, spacing, type } from '../../src/theme';
import { Card, Eyebrow, GradientButton, Pill, SectionTitle, tap } from '../../src/components/ui';
import { Reveal } from '../../src/components/motion';
import { MacroLegend, MacroRing } from '../../src/components/MacroRing';

const HERO_H = 300;

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const aiRecipes = useChat((s) => s.aiRecipes);
  const recipe = getRecipe(id) ?? aiRecipes.find((r) => r.id === id);
  const { prefs } = usePreferences();
  const cart = useCart();
  const startCooking = useCookSession((s) => s.start);
  const [subFor, setSubFor] = useState<string | null>(null);
  const [subText, setSubText] = useState<string>('');
  const [added, setAdded] = useState(false);

  // GSAP-scrub-style parallax: hero scales up when over-pulled, drifts and
  // fades as content scrolls over it.
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [-HERO_H, 0, HERO_H], [-HERO_H / 2, 0, HERO_H * 0.45]) },
      { scale: interpolate(scrollY.value, [-HERO_H, 0], [1.6, 1], 'clamp') },
    ],
    opacity: interpolate(scrollY.value, [0, HERO_H * 0.9], [1, 0.25], 'clamp'),
  }));
  const plateStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [0, HERO_H], [0, HERO_H * 0.18], 'clamp') },
      { scale: interpolate(scrollY.value, [0, HERO_H], [1, 0.82], 'clamp') },
    ],
  }));

  if (!recipe) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={[type.body, { padding: spacing.lg }]}>Recipe not found.</Text>
      </SafeAreaView>
    );
  }

  const allergenHits = recipe.allergens.filter((a) =>
    prefs.allergens.some((ua) => a.toLowerCase().includes(ua.toLowerCase())),
  );

  const askSubstitute = async (name: string) => {
    setSubFor(name);
    setSubText('Asking the chef…');
    const suggestion = await suggestSubstitute(name, recipe.title, prefs);
    setSubText(suggestion);
  };

  return (
    <View style={styles.safe}>
      {/* Parallax hero */}
      <Animated.View style={[styles.hero, heroStyle]}>
        {recipe.image ? (
          <Image source={{ uri: recipe.image }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <LinearGradient
            colors={[recipe.heroColor, colors.bg]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1.05 }}
            style={StyleSheet.absoluteFill}
          >
            <View style={styles.glowGold} />
          </LinearGradient>
        )}
        <Animated.View style={[styles.plateWrap, plateStyle]}>
          <View style={styles.plate}>
            <Text style={{ fontSize: 76 }}>{recipe.emoji}</Text>
          </View>
        </Animated.View>
        <LinearGradient colors={['transparent', colors.bg]} style={styles.heroFade} />
      </Animated.View>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Pressable style={styles.back} onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: HERO_H - 76 }}
        >
          <View style={styles.sheet}>
            {/* Editorial header */}
            <Reveal>
              <View style={{ alignItems: 'flex-start' }}>
                <Eyebrow>{recipe.cuisine}</Eyebrow>
                <Text style={[type.title, { marginTop: 10, fontSize: 28, lineHeight: 34 }]}>{recipe.title}</Text>
                <Text style={[type.bodySecondary, { marginTop: 6, fontFamily: fonts.serifItalic, fontSize: 15.5 }]}>
                  {recipe.tagline}
                </Text>
                <View style={styles.metaRow}>
                  <Pill tone="gold">⏱ {recipe.totalMin} min</Pill>
                  <Pill>{recipe.difficulty}</Pill>
                  <Pill>Serves {recipe.servings}</Pill>
                  {recipe.generatedByAI ? <Pill tone="flame">✦ Made for you</Pill> : null}
                </View>
              </View>
            </Reveal>

            {/* Allergen warning personalized to the profile */}
            {allergenHits.length > 0 && (
              <Reveal index={1}>
                <Card style={{ borderColor: colors.danger, marginTop: spacing.md }}>
                  <Text style={{ color: colors.danger, fontFamily: fonts.sansBold, fontSize: 14 }}>
                    ⚠️ Contains your allergens: {allergenHits.join(', ')}
                  </Text>
                  <Text style={[type.bodySecondary, { fontSize: 13, marginTop: 4 }]}>
                    Check the ingredient list — built-in substitutions can make this safe.
                  </Text>
                </Card>
              </Reveal>
            )}

            {/* Macros */}
            <Reveal index={1}>
              <SectionTitle>Macros per serving</SectionTitle>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
                <MacroRing macros={recipe.macros} targets={prefs.macroTargets} />
                <View style={{ flex: 1 }}>
                  <MacroLegend macros={recipe.macros} />
                  <Text style={[type.caption, { marginTop: spacing.sm }]}>
                    Rings show % of your daily targets ({prefs.macroTargets.calories} kcal)
                  </Text>
                </View>
              </Card>
            </Reveal>

            {/* Ingredients with live substitution */}
            <Reveal index={2}>
              <SectionTitle>Ingredients</SectionTitle>
              <Card style={{ padding: 0 }}>
                {recipe.ingredients.map((ing, idx) => (
                  <View key={ing.id} style={[styles.ingRow, idx < recipe.ingredients.length - 1 && styles.rowBorder]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontSize: 14.5, fontFamily: fonts.sansSemiBold }}>
                        {ing.name}
                        {ing.allergens?.some((a) => prefs.allergens.some((ua) => a.toLowerCase().includes(ua.toLowerCase()))) && (
                          <Text style={{ color: colors.danger }}>  ⚠️</Text>
                        )}
                      </Text>
                      <Text style={type.caption}>
                        {ing.quantity} {ing.unit}{ing.note ? ` · ${ing.note}` : ''}
                      </Text>
                      {ing.substitutes?.map((s) => (
                        <Text key={s.name} style={[type.caption, { color: colors.herb, marginTop: 2 }]}>
                          ⇄ {s.name} ({s.ratio}){s.note ? ` — ${s.note}` : ''}
                        </Text>
                      ))}
                      {subFor === ing.name && (
                        <Text style={[type.caption, { color: colors.butter, marginTop: 4 }]}>✦ {subText}</Text>
                      )}
                    </View>
                    <Pressable hitSlop={8} onPress={() => { tap(); askSubstitute(ing.name); }}>
                      <Text style={{ color: colors.terracotta, fontSize: 12, fontFamily: fonts.sansExtraBold, letterSpacing: 1 }}>SWAP</Text>
                    </Pressable>
                  </View>
                ))}
              </Card>
            </Reveal>

            {/* Wine pairing */}
            <Reveal index={3}>
              <SectionTitle>Sommelier's pick</SectionTitle>
              <Card style={{ borderColor: '#E2D5F0', backgroundColor: '#FCFAFE' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 32 }}>🍷</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...type.heading, fontSize: 17 }}>{recipe.winePairing.wine}</Text>
                    <Text style={[type.caption, { color: colors.wine }]}>{recipe.winePairing.style} · {recipe.winePairing.budget}</Text>
                  </View>
                </View>
                <Text style={[type.bodySecondary, { marginTop: spacing.sm, fontSize: 13.5 }]}>{recipe.winePairing.why}</Text>
                {recipe.winePairing.altNonAlcoholic && (
                  <Text style={[type.caption, { marginTop: spacing.sm }]}>
                    Zero-proof: {recipe.winePairing.altNonAlcoholic}
                  </Text>
                )}
              </Card>
            </Reveal>

            {/* Steps preview */}
            <Reveal index={4}>
              <SectionTitle>The plan · {recipe.steps.length} steps</SectionTitle>
              <Card style={{ padding: 0 }}>
                {recipe.steps.map((step, idx) => (
                  <View key={step.id} style={[styles.stepRow, idx < recipe.steps.length - 1 && styles.rowBorder]}>
                    <View style={styles.stepNum}>
                      <Text style={{ color: colors.terracotta, fontFamily: fonts.sansExtraBold, fontSize: 13 }}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontFamily: fonts.sansSemiBold, fontSize: 14.5 }}>{step.title}</Text>
                      {step.durationMin ? <Text style={type.caption}>~{step.durationMin} min</Text> : null}
                    </View>
                  </View>
                ))}
              </Card>
            </Reveal>

            <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
              <GradientButton
                title="Cook with me — live"
                icon="🔴"
                onPress={() => {
                  startCooking(recipe.id, recipe.title);
                  router.push(`/cook/${recipe.id}`);
                }}
              />
              <GradientButton
                title={added ? 'Added to cart ✓' : 'Add ingredients to cart'}
                icon="🛒"
                variant="ghost"
                onPress={() => {
                  cart.addRecipe(recipe);
                  setAdded(true);
                }}
              />
            </View>
            <View style={{ height: spacing.xxl }} />
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HERO_H,
    overflow: 'hidden',
  },
  glowGold: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(251,192,45,0.30)',
  },
  plateWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 24 },
  plate: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#3A2E1E',
    shadowOpacity: 0.22,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  heroFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90 },
  back: {
    position: 'absolute',
    top: 54,
    left: spacing.md,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  backText: { color: colors.text, fontSize: 14, fontFamily: fonts.sansSemiBold },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md },
  ingRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  stepRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  stepNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.terracottaSoft,
    alignItems: 'center', justifyContent: 'center',
  },
});

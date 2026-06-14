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
import { getArt } from '../../src/data/recipeArt';
import { suggestSubstitute } from '../../src/services/chef';
import { useCart, useChat, useCookSession, usePreferences } from '../../src/store';
import { colors, fonts, radius, spacing, type } from '../../src/theme';
import { Card, GradientButton, Pill, tap } from '../../src/components/ui';
import { DropCapText, Rule } from '../../src/components/editorial';
import { Reveal } from '../../src/components/motion';
import { MacroLegend, MacroRing } from '../../src/components/MacroRing';

const HERO_H = 400;

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
  const cover = recipe ? getArt(recipe.id)?.cover ?? (recipe.image ? { uri: recipe.image } : undefined) : undefined;

  // Scroll-scrubbed parallax: hero scales when over-pulled, drifts + fades out.
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [-HERO_H, 0, HERO_H], [-HERO_H / 2, 0, HERO_H * 0.4]) },
      { scale: interpolate(scrollY.value, [-HERO_H, 0], [1.5, 1], 'clamp') },
    ],
    opacity: interpolate(scrollY.value, [0, HERO_H * 0.9], [1, 0.2], 'clamp'),
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

  const intro = `${recipe.tagline}. A ${recipe.difficulty.toLowerCase()} ${recipe.cuisine} dish for ${recipe.servings}, on the table in about ${recipe.totalMin} minutes — and the sous-chef is watching every step with you.`;

  const askSubstitute = async (name: string) => {
    setSubFor(name);
    setSubText('Asking the chef…');
    const suggestion = await suggestSubstitute(name, recipe.title, prefs);
    setSubText(suggestion);
  };

  return (
    <View style={styles.safe}>
      {/* Cinematic parallax hero */}
      <Animated.View style={[styles.hero, heroStyle]}>
        {cover ? (
          <Image source={cover} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
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
        {!cover && (
          <Animated.View style={[styles.plateWrap, plateStyle]}>
            <View style={styles.plate}>
              <Text style={{ fontSize: 80 }}>{recipe.emoji}</Text>
            </View>
          </Animated.View>
        )}
        <LinearGradient colors={['transparent', colors.bg]} style={styles.heroFade} />
      </Animated.View>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Pressable style={styles.back} onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: HERO_H - 64 }}
        >
          <View style={styles.sheet}>
            {/* Editorial masthead header — centered */}
            <Reveal>
              <View style={styles.headerWrap}>
                <Text style={styles.cuisineKicker}>
                  {recipe.cuisine.toUpperCase()}
                  {recipe.generatedByAI ? '   ·   COMPOSED FOR YOU' : ''}
                </Text>
                <Text style={styles.articleTitle}>{recipe.title}</Text>
                <Text style={styles.articleDeck}>{recipe.tagline}</Text>

                {/* Credits / byline rule */}
                <View style={styles.credits}>
                  <View style={styles.creditCell}>
                    <Text style={styles.creditLabel}>TIME</Text>
                    <Text style={styles.creditValue}>{recipe.totalMin} min</Text>
                  </View>
                  <View style={styles.creditDivider} />
                  <View style={styles.creditCell}>
                    <Text style={styles.creditLabel}>SKILL</Text>
                    <Text style={styles.creditValue}>{recipe.difficulty}</Text>
                  </View>
                  <View style={styles.creditDivider} />
                  <View style={styles.creditCell}>
                    <Text style={styles.creditLabel}>SERVES</Text>
                    <Text style={styles.creditValue}>{recipe.servings}</Text>
                  </View>
                </View>
              </View>
            </Reveal>

            {/* Drop-cap intro */}
            <Reveal index={1}>
              <View style={{ marginTop: spacing.lg }}>
                <DropCapText>{intro}</DropCapText>
              </View>
            </Reveal>

            {/* Allergen warning */}
            {allergenHits.length > 0 && (
              <Reveal index={1}>
                <Card style={{ borderColor: colors.danger, marginTop: spacing.lg }}>
                  <Text style={{ color: colors.danger, fontFamily: fonts.sansBold, fontSize: 14 }}>
                    ⚠️ Contains your allergens: {allergenHits.join(', ')}
                  </Text>
                  <Text style={[type.bodySecondary, { fontSize: 13, marginTop: 4 }]}>
                    Check the ingredients below — built-in substitutions can make this safe.
                  </Text>
                </Card>
              </Reveal>
            )}

            {/* Nutrition */}
            <Reveal index={1}>
              <Rule label="The Numbers" style={{ marginTop: spacing.xl }} />
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.md }}>
                <MacroRing macros={recipe.macros} targets={prefs.macroTargets} />
                <View style={{ flex: 1 }}>
                  <MacroLegend macros={recipe.macros} />
                  <Text style={[type.caption, { marginTop: spacing.sm }]}>
                    Rings show % of your daily targets ({prefs.macroTargets.calories} kcal)
                  </Text>
                </View>
              </Card>
            </Reveal>

            {/* Ingredients */}
            <Reveal index={2}>
              <Rule label="What You'll Need" style={{ marginTop: spacing.xl }} />
              <View style={{ marginTop: spacing.sm }}>
                {recipe.ingredients.map((ing, idx) => (
                  <View key={ing.id} style={[styles.ingRow, idx < recipe.ingredients.length - 1 && styles.rowBorder]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ingName}>
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
                      <Text style={styles.swap}>SWAP</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </Reveal>

            {/* Wine */}
            <Reveal index={3}>
              <Rule label="From The Cellar" style={{ marginTop: spacing.xl }} />
              <Card style={{ borderColor: '#E6DAF2', backgroundColor: '#FCFAFE', marginTop: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 34 }}>🍷</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...type.heading, fontSize: 18 }}>{recipe.winePairing.wine}</Text>
                    <Text style={[type.caption, { color: colors.wine }]}>{recipe.winePairing.style} · {recipe.winePairing.budget}</Text>
                  </View>
                </View>
                <Text style={[type.body, { marginTop: spacing.sm, fontFamily: fonts.serifItalic, fontSize: 15 }]}>
                  {recipe.winePairing.why}
                </Text>
                {recipe.winePairing.altNonAlcoholic && (
                  <Text style={[type.caption, { marginTop: spacing.sm }]}>
                    Zero-proof — {recipe.winePairing.altNonAlcoholic}
                  </Text>
                )}
              </Card>
            </Reveal>

            {/* Method — numbered with serif numerals */}
            <Reveal index={4}>
              <Rule label={`The Method · ${recipe.steps.length} Steps`} style={{ marginTop: spacing.xl }} />
              <View style={{ marginTop: spacing.md }}>
                {recipe.steps.map((step, idx) => (
                  <View key={step.id} style={[styles.methodRow, idx < recipe.steps.length - 1 && styles.methodBorder]}>
                    <Text style={styles.methodNum}>{String(idx + 1).padStart(2, '0')}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.methodTitle}>{step.title}</Text>
                      <Text style={[type.body, { marginTop: 3, color: colors.textSecondary }]}>{step.instruction}</Text>
                      {step.durationMin ? (
                        <Text style={[type.caption, { marginTop: 4 }]}>~{step.durationMin} min</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            </Reveal>

            <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
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
  hero: { position: 'absolute', top: 0, left: 0, right: 0, height: HERO_H, overflow: 'hidden' },
  glowGold: {
    position: 'absolute', top: -70, right: -50, width: 260, height: 260,
    borderRadius: 130, backgroundColor: 'rgba(251,192,45,0.30)',
  },
  plateWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 24 },
  plate: {
    width: 158, height: 158, borderRadius: 79,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 5, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#3A2E1E', shadowOpacity: 0.22, shadowRadius: 30, shadowOffset: { width: 0, height: 18 }, elevation: 12,
  },
  heroFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },
  back: {
    position: 'absolute', top: 50, left: spacing.md, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  backText: { color: colors.ink, fontSize: 24, fontFamily: fonts.serif, marginTop: -3 },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  headerWrap: { alignItems: 'center' },
  cuisineKicker: { fontSize: 10.5, fontFamily: fonts.sansBold, color: colors.terracotta, letterSpacing: 2.6 },
  articleTitle: {
    fontFamily: fonts.serifBlack, fontSize: 36, lineHeight: 40, color: colors.ink,
    textAlign: 'center', letterSpacing: -0.6, marginTop: 12,
  },
  articleDeck: {
    fontFamily: fonts.serifItalic, fontSize: 17, color: colors.textSecondary,
    textAlign: 'center', lineHeight: 24, marginTop: 10, paddingHorizontal: spacing.sm,
  },
  credits: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.lg, paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.rule,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.rule,
    paddingBottom: spacing.md, alignSelf: 'stretch',
  },
  creditCell: { flex: 1, alignItems: 'center' },
  creditDivider: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: colors.rule },
  creditLabel: { fontSize: 9, fontFamily: fonts.sansBold, color: colors.textMuted, letterSpacing: 1.8 },
  creditValue: { fontFamily: fonts.serif, fontSize: 17, color: colors.ink, marginTop: 3 },
  ingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.rule },
  ingName: { color: colors.ink, fontSize: 15, fontFamily: fonts.sansSemiBold },
  swap: { color: colors.terracotta, fontSize: 11, fontFamily: fonts.sansExtraBold, letterSpacing: 1.4 },
  methodRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md },
  methodBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.rule },
  methodNum: { fontFamily: fonts.serifBlack, fontSize: 26, color: colors.terracotta, width: 40, letterSpacing: -1 },
  methodTitle: { fontFamily: fonts.serif, fontSize: 18, color: colors.ink, letterSpacing: -0.2 },
});

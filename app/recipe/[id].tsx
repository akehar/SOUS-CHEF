import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getRecipe } from '../../src/data/recipes';
import { suggestSubstitute } from '../../src/services/chef';
import { useCart, useChat, useCookSession, usePreferences } from '../../src/store';
import { colors, radius, spacing, type } from '../../src/theme';
import { Card, GradientButton, Pill, SectionTitle, tap } from '../../src/components/ui';
import { MacroLegend, MacroRing } from '../../src/components/MacroRing';

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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={[recipe.heroColor, colors.bg]} style={styles.hero}>
          <Pressable style={styles.back} onPress={() => router.back()} hitSlop={10}>
            <Text style={{ color: colors.text, fontSize: 17 }}>‹ Back</Text>
          </Pressable>
          <Text style={{ fontSize: 84 }}>{recipe.emoji}</Text>
          <Text style={[type.title, { textAlign: 'center', marginTop: spacing.sm }]}>{recipe.title}</Text>
          <Text style={[type.bodySecondary, { textAlign: 'center', marginTop: 4 }]}>{recipe.tagline}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: spacing.md }}>
            <Pill tone="flame">⏱ {recipe.totalMin} min</Pill>
            <Pill>{recipe.difficulty}</Pill>
            <Pill>{recipe.cuisine}</Pill>
            <Pill>Serves {recipe.servings}</Pill>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: spacing.md }}>
          {/* Allergen warning personalized to the profile */}
          {allergenHits.length > 0 && (
            <Card style={{ borderColor: colors.danger, marginTop: spacing.md }}>
              <Text style={{ color: colors.danger, fontWeight: '700', fontSize: 14 }}>
                ⚠️ Contains your allergens: {allergenHits.join(', ')}
              </Text>
              <Text style={[type.bodySecondary, { fontSize: 13, marginTop: 4 }]}>
                Check the ingredient list — built-in substitutions can make this safe.
              </Text>
            </Card>
          )}

          {/* Macros */}
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

          {/* Ingredients with live substitution */}
          <SectionTitle>Ingredients</SectionTitle>
          <Card style={{ padding: 0 }}>
            {recipe.ingredients.map((ing, idx) => (
              <View key={ing.id} style={[styles.ingRow, idx < recipe.ingredients.length - 1 && styles.rowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 14.5, fontWeight: '600' }}>
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
                  <Text style={{ color: colors.flame, fontSize: 12.5, fontWeight: '700' }}>SWAP</Text>
                </Pressable>
              </View>
            ))}
          </Card>

          {/* Wine pairing */}
          <SectionTitle>Sommelier's pick</SectionTitle>
          <Card style={{ borderColor: colors.wine }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 32 }}>🍷</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{recipe.winePairing.wine}</Text>
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

          {/* Steps preview */}
          <SectionTitle>The plan · {recipe.steps.length} steps</SectionTitle>
          <Card style={{ padding: 0 }}>
            {recipe.steps.map((step, idx) => (
              <View key={step.id} style={[styles.stepRow, idx < recipe.steps.length - 1 && styles.rowBorder]}>
                <View style={styles.stepNum}>
                  <Text style={{ color: colors.flame, fontWeight: '800', fontSize: 13 }}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14.5 }}>{step.title}</Text>
                  {step.durationMin ? <Text style={type.caption}>~{step.durationMin} min</Text> : null}
                </View>
              </View>
            ))}
          </Card>

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  hero: { alignItems: 'center', paddingTop: spacing.sm, paddingBottom: spacing.lg, paddingHorizontal: spacing.md },
  back: { alignSelf: 'flex-start', marginBottom: spacing.sm },
  ingRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  stepRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  stepNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.flameSoft,
    alignItems: 'center', justifyContent: 'center',
  },
});

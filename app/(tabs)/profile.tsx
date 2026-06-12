import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreferences } from '../../src/store';
import { colors, fonts, radius, spacing, type } from '../../src/theme';
import { Card, Chip, SectionTitle } from '../../src/components/ui';

const DIETS = ['Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 'Mediterranean', 'Halal', 'Kosher', 'Gluten-free', 'Dairy-free'];
const ALLERGENS = ['Peanuts', 'Tree nuts', 'Dairy', 'Eggs', 'Gluten', 'Soy', 'Shellfish', 'Fish', 'Sesame'];
const SKILLS = ['Beginner', 'Home cook', 'Confident', 'Chef-curious'] as const;

export default function Profile() {
  const { prefs, setPrefs, toggleListItem } = usePreferences();

  const macroField = (key: keyof typeof prefs.macroTargets, label: string, unit: string) => (
    <View style={styles.macroField}>
      <Text style={type.caption}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <TextInput
          style={styles.macroInput}
          keyboardType="number-pad"
          value={String(prefs.macroTargets[key])}
          onChangeText={(v) =>
            setPrefs({ macroTargets: { ...prefs.macroTargets, [key]: Number(v.replace(/\D/g, '')) || 0 } })
          }
        />
        <Text style={type.caption}>{unit}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={type.title}>Your kitchen profile</Text>
        <Text style={[type.bodySecondary, { marginTop: 4 }]}>
          Everything here flows into every recipe, every chat, every substitution.
        </Text>

        <SectionTitle>About you</SectionTitle>
        <Card>
          <Text style={type.caption}>Name</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="What should the chef call you?"
            placeholderTextColor={colors.textMuted}
            value={prefs.name}
            onChangeText={(name) => setPrefs({ name })}
          />
          <Text style={[type.caption, { marginTop: spacing.md }]}>Cooking for</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 6 }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Pressable
                key={n}
                onPress={() => setPrefs({ householdSize: n })}
                style={[styles.numBtn, prefs.householdSize === n && styles.numBtnActive]}
              >
                <Text style={{ color: prefs.householdSize === n ? '#FFFFFF' : colors.textSecondary, fontFamily: fonts.sansBold }}>
                  {n}{n === 6 ? '+' : ''}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[type.caption, { marginTop: spacing.md }]}>Skill level</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
            {SKILLS.map((s) => (
              <Chip key={s} label={s} selected={prefs.skillLevel === s} onPress={() => setPrefs({ skillLevel: s })} />
            ))}
          </View>
        </Card>

        <SectionTitle>Diets & lifestyles</SectionTitle>
        <Card>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {DIETS.map((d) => (
              <Chip key={d} label={d} tone="herb" selected={prefs.diets.includes(d)} onPress={() => toggleListItem('diets', d)} />
            ))}
          </View>
        </Card>

        <SectionTitle>Allergens — hard limits</SectionTitle>
        <Card>
          <Text style={[type.bodySecondary, { marginBottom: spacing.sm, fontSize: 13.5 }]}>
            The chef will never suggest these, and flags them in every recipe.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {ALLERGENS.map((a) => (
              <Chip key={a} label={a} tone="danger" selected={prefs.allergens.includes(a)} onPress={() => toggleListItem('allergens', a)} />
            ))}
          </View>
        </Card>

        <SectionTitle>Daily macro targets</SectionTitle>
        <Card>
          <View style={styles.macroRow}>
            {macroField('calories', 'Calories', 'kcal')}
            {macroField('protein', 'Protein', 'g')}
          </View>
          <View style={[styles.macroRow, { marginTop: spacing.md }]}>
            {macroField('carbs', 'Carbs', 'g')}
            {macroField('fat', 'Fat', 'g')}
          </View>
        </Card>

        <SectionTitle>Live cooking</SectionTitle>
        <Card>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontFamily: fonts.sansSemiBold, fontSize: 15 }}>Voice coaching</Text>
              <Text style={[type.caption, { marginTop: 2 }]}>
                The sous-chef speaks feedback aloud while you cook
              </Text>
            </View>
            <Switch
              value={prefs.voiceEnabled}
              onValueChange={(voiceEnabled) => setPrefs({ voiceEnabled })}
              trackColor={{ true: colors.flame, false: colors.border }}
              thumbColor={colors.cream}
            />
          </View>
        </Card>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  nameInput: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
    marginTop: 6,
  },
  numBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numBtnActive: { backgroundColor: colors.flame, borderColor: colors.flame },
  macroRow: { flexDirection: 'row', gap: spacing.md },
  macroField: { flex: 1 },
  macroInput: {
    color: colors.text,
    fontSize: 22,
    fontFamily: fonts.sansExtraBold,
    borderBottomWidth: 2,
    borderBottomColor: colors.flame,
    paddingVertical: 4,
    marginRight: 6,
    minWidth: 60,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
});

import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { chatWithChef, generateRecipe } from '../../src/services/chef';
import { speak } from '../../src/services/voice';
import { useChat, usePantry, usePreferences } from '../../src/store';
import { colors, radius, spacing, type } from '../../src/theme';
import { Chip, Pill, tap } from '../../src/components/ui';
import { ChatMessage } from '../../src/types';

const SUGGESTIONS = [
  'High-protein dinner with what\'s in my pantry',
  'Date-night pasta under 45 minutes',
  'I\'m keto and bored — surprise me',
  'Kid-friendly, no nuts, 30 minutes',
];

export default function ChefChat() {
  const router = useRouter();
  const { messages, push, update, addAiRecipe } = useChat();
  const { prefs } = usePreferences();
  const pantry = usePantry((s) => s.items.map((i) => i.name));
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [recipeMode, setRecipeMode] = useState(false);
  const listRef = useRef<FlatList>(null);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput('');
    setBusy(true);
    tap();

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    const chefId = `c-${Date.now()}`;
    push(userMsg);
    push({ id: chefId, role: 'chef', text: '', pending: true });

    try {
      if (recipeMode) {
        update(chefId, { text: 'Building your recipe — measuring macros, checking your allergens, picking the wine… 🍷' });
        const recipe = await generateRecipe(trimmed, prefs, pantry);
        if (recipe) {
          addAiRecipe(recipe);
          update(chefId, {
            pending: false,
            text: `Here's what I made for you — every ingredient respects your profile, and the macros are dialed in. Tap to cook it with me. 👇`,
            recipe,
          });
          if (prefs.voiceEnabled) speak(`Your recipe is ready: ${recipe.title}. ${recipe.tagline}`);
        } else {
          update(chefId, {
            pending: false,
            text: 'I couldn\'t reach the recipe engine (is the backend running?). Try again, or browse Discover — those recipes adapt to your profile too.',
          });
        }
      } else {
        const history = [...messages, userMsg]
          .filter((m) => m.text)
          .map((m) => ({ role: m.role === 'user' ? ('user' as const) : ('assistant' as const), content: m.text }));
        let acc = '';
        await chatWithChef(history, prefs, pantry, (chunk) => {
          acc += chunk;
          update(chefId, { text: acc, pending: false });
        });
        update(chefId, { pending: false });
      }
    } finally {
      setBusy(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.bubbleRow, item.role === 'user' && { justifyContent: 'flex-end' }]}>
      {item.role === 'chef' && <Text style={styles.avatar}>👨‍🍳</Text>}
      <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.chefBubble]}>
        <Text style={[type.body, item.role === 'user' && { color: '#16110B' }]}>
          {item.text || (item.pending ? 'Thinking…' : '')}
        </Text>
        {item.recipe && (
          <Pressable
            style={styles.recipeCard}
            onPress={() => router.push(`/recipe/${item.recipe!.id}`)}
          >
            <Text style={{ fontSize: 34 }}>{item.recipe.emoji}</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.recipeTitle}>{item.recipe.title}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
                <Pill tone="flame">⏱ {item.recipe.totalMin} min</Pill>
                <Pill tone="herb">{item.recipe.macros.protein}g protein</Pill>
                <Pill tone="wine">🍷 {item.recipe.winePairing.wine}</Pill>
              </View>
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={type.title}>Sous-Chef</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <View style={styles.onlineDot} />
            <Text style={type.caption}>In your kitchen · knows your profile & pantry</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {messages.length === 0 ? (
          <ScrollView contentContainerStyle={styles.empty}>
            <Text style={{ fontSize: 56 }}>👨‍🍳</Text>
            <Text style={[type.heading, { textAlign: 'center', marginTop: spacing.md }]}>
              Tell me what you're craving,{'\n'}what you have, or how you feel.
            </Text>
            <Text style={[type.bodySecondary, { textAlign: 'center', marginTop: spacing.sm }]}>
              I'll respect your allergens, hit your macros, and pour the right wine.
            </Text>
            <View style={{ marginTop: spacing.lg, width: '100%' }}>
              {SUGGESTIONS.map((s) => (
                <Pressable key={s} style={styles.suggestion} onPress={() => send(s)}>
                  <Text style={{ color: colors.flame, fontSize: 14, fontWeight: '600' }}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.lg }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        <View style={styles.composer}>
          <View style={{ flexDirection: 'row', marginBottom: spacing.sm }}>
            <Chip
              label={recipeMode ? '✨ Recipe mode ON' : '✨ Recipe mode'}
              selected={recipeMode}
              onPress={() => setRecipeMode((v) => !v)}
              tone="herb"
            />
            <Chip label={`🧺 ${pantry.length} pantry items`} tone="flame" />
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder={recipeMode ? 'Describe the recipe you want…' : 'Ask your sous-chef anything…'}
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => send(input)}
              returnKeyType="send"
              multiline
            />
            <Pressable
              style={[styles.sendBtn, (!input.trim() || busy) && { opacity: 0.35 }]}
              onPress={() => send(input)}
              disabled={!input.trim() || busy}
            >
              <Text style={{ fontSize: 18 }}>{busy ? '⏳' : '🔥'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.herb },
  empty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  suggestion: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: spacing.sm,
  },
  bubbleRow: { flexDirection: 'row', marginBottom: spacing.md, alignItems: 'flex-end' },
  avatar: { fontSize: 24, marginRight: 8 },
  bubble: { maxWidth: '82%', borderRadius: radius.lg, padding: 14 },
  chefBubble: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 6 },
  userBubble: { backgroundColor: colors.flame, borderBottomRightRadius: 6 },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.flame,
    padding: 12,
    marginTop: 10,
  },
  recipeTitle: { color: colors.text, fontWeight: '700', fontSize: 14.5 },
  composer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
    maxHeight: 110,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.flame,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

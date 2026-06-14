import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { openAmazonFresh, openInstacart, shareList } from '../../src/services/cart';
import { useCart, usePantry } from '../../src/store';
import { colors, fonts, radius, spacing, type } from '../../src/theme';
import { Card, GradientButton, SectionTitle, tap } from '../../src/components/ui';
import { Kicker } from '../../src/components/editorial';

export default function PantryAndCart() {
  const pantry = usePantry();
  const cart = useCart();
  const [newItem, setNewItem] = useState('');

  const unchecked = cart.items.filter((i) => !i.checked).length;

  const addPantryItem = () => {
    if (!newItem.trim()) return;
    pantry.add(newItem);
    setNewItem('');
    tap();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Kicker>The Larder</Kicker>
        <Text style={[type.hero, { marginTop: 10 }]}>Pantry & Cart</Text>
        <Text style={[type.deck, { marginTop: 6 }]}>
          What you have shapes what the chef suggests. What you need ships to your door.
        </Text>

        {/* ---- Grocery cart ---- */}
        <SectionTitle action={cart.items.length ? 'Clear' : undefined} onAction={() => cart.clear()}>
          Grocery cart {cart.items.length ? `· ${unchecked} to buy` : ''}
        </SectionTitle>
        {cart.items.length === 0 ? (
          <Card>
            <Text style={type.bodySecondary}>
              Your cart is empty. Open any recipe and tap "Add ingredients to cart" — then ship the whole list
              to your door with one tap.
            </Text>
          </Card>
        ) : (
          <>
            <Card style={{ padding: 0 }}>
              {cart.items.map((item, idx) => (
                <Pressable
                  key={item.id}
                  onPress={() => { tap(); cart.toggle(item.id); }}
                  style={[styles.cartRow, idx < cart.items.length - 1 && styles.rowBorder]}
                >
                  <Text style={{ fontSize: 18 }}>{item.checked ? '✅' : '⬜️'}</Text>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.cartName, item.checked && styles.strike]}>
                      {item.name} <Text style={type.caption}>({item.quantity} {item.unit})</Text>
                    </Text>
                    <Text style={type.caption}>{item.recipeTitle}</Text>
                  </View>
                  <Pressable hitSlop={10} onPress={() => cart.remove(item.id)}>
                    <Text style={{ color: colors.textMuted, fontSize: 16 }}>×</Text>
                  </Pressable>
                </Pressable>
              ))}
            </Card>
            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
              <GradientButton title="Ship via Instacart" icon="🚚" onPress={() => openInstacart(cart.items)} />
              <GradientButton title="Amazon Fresh" icon="📦" variant="ghost" onPress={() => openAmazonFresh(cart.items)} />
              <GradientButton title="Share list" icon="📤" variant="ghost" onPress={() => shareList(cart.items)} />
            </View>
          </>
        )}

        {/* ---- Pantry ---- */}
        <SectionTitle action={pantry.items.length ? 'Clear' : undefined} onAction={() => pantry.clear()}>
          My pantry · {pantry.items.length} items
        </SectionTitle>
        <Card>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Add an ingredient you have…"
              placeholderTextColor={colors.textMuted}
              value={newItem}
              onChangeText={setNewItem}
              onSubmitEditing={addPantryItem}
              returnKeyType="done"
            />
            <Pressable style={styles.addBtn} onPress={addPantryItem}>
              <Text style={{ color: '#FFFFFF', fontFamily: fonts.sansExtraBold, fontSize: 20 }}>+</Text>
            </Pressable>
          </View>
          {pantry.items.length > 0 && (
            <View style={styles.pantryWrap}>
              {pantry.items.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.pantryChip}
                  onLongPress={() => pantry.remove(item.id)}
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      pantry.remove(item.id);
                    } else {
                      Alert.alert(item.name, 'Remove from pantry?', [
                        { text: 'Keep', style: 'cancel' },
                        { text: 'Remove', style: 'destructive', onPress: () => pantry.remove(item.id) },
                      ]);
                    }
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 13.5 }}>{item.name}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <Text style={[type.caption, { marginTop: spacing.sm }]}>
            Tip: the Sous-Chef chat reads your pantry — say "use what I have" and it builds around these items.
          </Text>
        </Card>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  cartRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  cartName: { color: colors.text, fontSize: 14.5, fontFamily: fonts.sansSemiBold },
  strike: { textDecorationLine: 'line-through', color: colors.textMuted },
  inputRow: { flexDirection: 'row', gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14.5,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: colors.flame,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pantryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.md },
  pantryChip: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
});

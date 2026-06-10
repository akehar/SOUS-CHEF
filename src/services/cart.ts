import { Linking, Share } from 'react-native';
import { CartItem } from '../types';

// Grocery delivery hand-off. Instacart's universal search links work without
// a partner key, so the cart ships day one; swap in the Instacart Developer
// Platform connect API when partner credentials land.

export function cartToText(items: CartItem[]): string {
  const grouped = new Map<string, CartItem[]>();
  for (const item of items) {
    const list = grouped.get(item.recipeTitle) ?? [];
    list.push(item);
    grouped.set(item.recipeTitle, list);
  }
  let out = '🛒 SOUS-CHEF shopping list\n';
  for (const [recipe, list] of grouped) {
    out += `\n— ${recipe} —\n`;
    for (const i of list) out += `• ${i.name} (${i.quantity} ${i.unit})\n`;
  }
  return out;
}

export async function openInstacart(items: CartItem[]) {
  const query = encodeURIComponent(items.map((i) => i.name).join(', '));
  await Linking.openURL(`https://www.instacart.com/store/s?k=${query}`);
}

export async function openAmazonFresh(items: CartItem[]) {
  const query = encodeURIComponent(items.map((i) => i.name).join(' '));
  await Linking.openURL(`https://www.amazon.com/s?k=${query}&i=amazonfresh`);
}

export async function shareList(items: CartItem[]) {
  await Share.share({ message: cartToText(items) });
}

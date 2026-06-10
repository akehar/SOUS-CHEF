import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CartItem,
  ChatMessage,
  CookSession,
  PantryItem,
  Recipe,
  UserPreferences,
} from '../types';

const storage = createJSONStorage(() => AsyncStorage);

// ---------- User preferences ----------

interface PreferencesState {
  prefs: UserPreferences;
  setPrefs: (patch: Partial<UserPreferences>) => void;
  toggleListItem: (key: 'diets' | 'allergens' | 'dislikes', value: string) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      prefs: {
        name: '',
        diets: [],
        allergens: [],
        dislikes: [],
        macroTargets: { calories: 2000, protein: 120, carbs: 200, fat: 70 },
        skillLevel: 'Home cook',
        householdSize: 2,
        voiceEnabled: true,
      },
      setPrefs: (patch) => set((s) => ({ prefs: { ...s.prefs, ...patch } })),
      toggleListItem: (key, value) =>
        set((s) => {
          const list = s.prefs[key];
          const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
          return { prefs: { ...s.prefs, [key]: next } };
        }),
    }),
    { name: 'souschef-prefs', storage },
  ),
);

// ---------- Cook session (pause / resume) ----------

interface CookState {
  session: CookSession | null;
  start: (recipeId: string, recipeTitle: string) => void;
  resume: () => void;
  pause: () => void;
  setStep: (index: number) => void;
  completeStep: (stepId: string) => void;
  setVisionAutoCheck: (on: boolean) => void;
  end: () => void;
}

export const useCookSession = create<CookState>()(
  persist(
    (set) => ({
      session: null,
      start: (recipeId, recipeTitle) =>
        set((s) => {
          // Re-entering the same recipe resumes where you left off.
          if (s.session?.recipeId === recipeId) {
            return { session: { ...s.session, pausedAt: null } };
          }
          return {
            session: {
              recipeId,
              recipeTitle,
              stepIndex: 0,
              completedSteps: [],
              startedAt: Date.now(),
              pausedAt: null,
              visionAutoCheck: false,
            },
          };
        }),
      resume: () =>
        set((s) => (s.session ? { session: { ...s.session, pausedAt: null } } : s)),
      pause: () =>
        set((s) => (s.session ? { session: { ...s.session, pausedAt: Date.now() } } : s)),
      setStep: (index) =>
        set((s) => (s.session ? { session: { ...s.session, stepIndex: index } } : s)),
      completeStep: (stepId) =>
        set((s) =>
          s.session
            ? {
                session: {
                  ...s.session,
                  completedSteps: s.session.completedSteps.includes(stepId)
                    ? s.session.completedSteps
                    : [...s.session.completedSteps, stepId],
                },
              }
            : s,
        ),
      setVisionAutoCheck: (on) =>
        set((s) => (s.session ? { session: { ...s.session, visionAutoCheck: on } } : s)),
      end: () => set({ session: null }),
    }),
    { name: 'souschef-cook', storage },
  ),
);

// ---------- Pantry ----------

interface PantryState {
  items: PantryItem[];
  add: (name: string, qty?: string) => void;
  addMany: (names: string[]) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const usePantry = create<PantryState>()(
  persist(
    (set) => ({
      items: [],
      add: (name, qty) =>
        set((s) => ({
          items: [...s.items, { id: `${Date.now()}-${Math.random()}`, name: name.trim(), qty }],
        })),
      addMany: (names) =>
        set((s) => {
          const existing = new Set(s.items.map((i) => i.name.toLowerCase()));
          const added = names
            .map((n) => n.trim())
            .filter((n) => n && !existing.has(n.toLowerCase()))
            .map((n) => ({ id: `${Date.now()}-${Math.random()}`, name: n }));
          return { items: [...s.items, ...added] };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'souschef-pantry', storage },
  ),
);

// ---------- Grocery cart ----------

interface CartState {
  items: CartItem[];
  addRecipe: (recipe: Recipe) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addRecipe: (recipe) =>
        set((s) => {
          const fresh = recipe.ingredients
            .filter((ing) => !s.items.some(
              (c) => c.name.toLowerCase() === ing.name.toLowerCase() && c.recipeTitle === recipe.title,
            ))
            .map((ing) => ({
              id: `${recipe.id}-${ing.id}`,
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              recipeTitle: recipe.title,
              checked: false,
            }));
          return { items: [...s.items, ...fresh] };
        }),
      toggle: (id) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'souschef-cart', storage },
  ),
);

// ---------- Chat (kept in memory; cheap to rebuild) ----------

interface ChatState {
  messages: ChatMessage[];
  aiRecipes: Recipe[]; // recipes generated in chat, viewable like curated ones
  push: (m: ChatMessage) => void;
  update: (id: string, patch: Partial<ChatMessage>) => void;
  addAiRecipe: (r: Recipe) => void;
  reset: () => void;
}

export const useChat = create<ChatState>((set) => ({
  messages: [],
  aiRecipes: [],
  push: (m) => set((s) => ({ messages: [...s.messages, m] })),
  update: (id, patch) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),
  addAiRecipe: (r) =>
    set((s) => ({ aiRecipes: [r, ...s.aiRecipes.filter((x) => x.id !== r.id)] })),
  reset: () => set({ messages: [] }),
}));

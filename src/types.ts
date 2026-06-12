// Shared domain types for SOUS-CHEF.

export interface Macros {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  note?: string;
  substitutes?: Substitute[];
  allergens?: string[];
}

export interface Substitute {
  name: string;
  ratio: string; // e.g. "1:1", "use half"
  note?: string;
}

export interface RecipeStep {
  id: string;
  title: string;
  instruction: string;
  durationMin?: number;
  timerSec?: number;
  visualCue?: string; // what "done" looks like — used by Chef's Eye vision checks
  chefTip?: string;
  heat?: 'low' | 'medium' | 'medium-high' | 'high' | 'off';
}

export interface WinePairing {
  wine: string;
  style: string;
  why: string;
  budget: string; // e.g. "$12–18"
  altNonAlcoholic?: string;
}

export interface Recipe {
  id: string;
  title: string;
  tagline: string;
  emoji: string;
  heroColor: string;
  image?: string; // optional cover photo/render URL — card turns photo-forward when set
  cuisine: string;
  difficulty: 'Easy' | 'Intermediate' | 'Advanced';
  totalMin: number;
  servings: number;
  macros: Macros; // per serving
  tags: string[];
  allergens: string[];
  ingredients: Ingredient[];
  steps: RecipeStep[];
  winePairing: WinePairing;
  generatedByAI?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'chef';
  text: string;
  recipe?: Recipe; // chef messages can carry a generated recipe card
  pending?: boolean;
}

export interface CookSession {
  recipeId: string;
  recipeTitle: string;
  stepIndex: number;
  completedSteps: string[];
  startedAt: number;
  pausedAt: number | null;
  visionAutoCheck: boolean;
}

export interface VisionVerdict {
  status: 'perfect' | 'keep_going' | 'adjust' | 'unclear';
  headline: string; // short verdict, e.g. "Almost there"
  feedback: string; // what the AI sees + coaching
  speak: string; // short sentence spoken aloud
}

export interface UserPreferences {
  name: string;
  diets: string[]; // e.g. vegetarian, keto…
  allergens: string[];
  dislikes: string[];
  macroTargets: Macros;
  skillLevel: 'Beginner' | 'Home cook' | 'Confident' | 'Chef-curious';
  householdSize: number;
  voiceEnabled: boolean;
}

export interface PantryItem {
  id: string;
  name: string;
  qty?: string;
}

export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  recipeTitle: string;
  checked: boolean;
}

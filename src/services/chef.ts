import { postJSON, postStream } from './api';
import { Recipe, RecipeStep, UserPreferences, VisionVerdict } from '../types';

// All AI calls go through the SOUS-CHEF backend proxy (server/) so API keys
// never ship in the app bundle. Every function degrades gracefully when the
// backend is unreachable, so the app demos fully offline.

function prefsContext(prefs: UserPreferences): string {
  const parts: string[] = [];
  if (prefs.name) parts.push(`Name: ${prefs.name}`);
  if (prefs.diets.length) parts.push(`Diets: ${prefs.diets.join(', ')}`);
  if (prefs.allergens.length) parts.push(`ALLERGENS (never include): ${prefs.allergens.join(', ')}`);
  if (prefs.dislikes.length) parts.push(`Dislikes: ${prefs.dislikes.join(', ')}`);
  parts.push(
    `Daily macro targets: ${prefs.macroTargets.calories} kcal, ${prefs.macroTargets.protein}g protein, ${prefs.macroTargets.carbs}g carbs, ${prefs.macroTargets.fat}g fat`,
  );
  parts.push(`Skill level: ${prefs.skillLevel}. Household: ${prefs.householdSize} people.`);
  return parts.join('\n');
}

// ---------- Streaming chat with the sous-chef ----------

export async function chatWithChef(
  history: { role: 'user' | 'assistant'; content: string }[],
  prefs: UserPreferences,
  pantry: string[],
  onChunk: (text: string) => void,
): Promise<string> {
  try {
    return await postStream(
      '/api/chat',
      { messages: history, preferences: prefsContext(prefs), pantry },
      onChunk,
    );
  } catch {
    const fallback =
      "I'm cooking offline right now (the AI backend isn't reachable), but here's my chef instinct: " +
      'tell me 3 ingredients you have and one constraint — like "high protein" or "under 30 minutes" — ' +
      'and check the Discover tab, where every recipe adapts to the preferences in your profile. ' +
      'Once the backend is connected I can build fully custom recipes, swap any ingredient on the fly, and watch your pan live. 👨‍🍳';
    onChunk(fallback);
    return fallback;
  }
}

// ---------- Chef's Eye: live vision check ----------

export async function checkCookingFrame(
  imageBase64: string,
  step: RecipeStep,
  recipeTitle: string,
): Promise<VisionVerdict> {
  try {
    return await postJSON<VisionVerdict>(
      '/api/vision',
      {
        image: imageBase64,
        recipeTitle,
        stepTitle: step.title,
        instruction: step.instruction,
        visualCue: step.visualCue ?? 'food cooked correctly for this step',
      },
      20000,
    );
  } catch {
    return {
      status: 'unclear',
      headline: 'Chef\'s Eye offline',
      feedback:
        `I can't reach the vision AI right now. Your target for this step: ${step.visualCue ?? step.instruction}`,
      speak: 'I cannot see the pan right now, but here is what you are looking for: ' + (step.visualCue ?? 'follow the instruction on screen.'),
    };
  }
}

// ---------- Custom recipe generation ----------

export async function generateRecipe(
  request: string,
  prefs: UserPreferences,
  pantry: string[],
): Promise<Recipe | null> {
  try {
    const recipe = await postJSON<Recipe>(
      '/api/recipe',
      { request, preferences: prefsContext(prefs), pantry },
      90000,
    );
    return { ...recipe, generatedByAI: true };
  } catch {
    return null;
  }
}

// ---------- On-the-fly substitution ----------

export async function suggestSubstitute(
  ingredient: string,
  recipeTitle: string,
  prefs: UserPreferences,
): Promise<string> {
  try {
    const res = await postJSON<{ suggestion: string }>(
      '/api/substitute',
      { ingredient, recipeTitle, preferences: prefsContext(prefs) },
      20000,
    );
    return res.suggestion;
  } catch {
    return `Common swaps for ${ingredient}: check the ingredient row for built-in substitutes, or keep ratios 1:1 with the closest match in texture and fat content.`;
  }
}

// ---------- Pantry photo scan ----------

export async function scanPantryPhoto(imageBase64: string): Promise<string[]> {
  try {
    const res = await postJSON<{ items: string[] }>('/api/pantry-scan', { image: imageBase64 }, 25000);
    return res.items;
  } catch {
    return [];
  }
}

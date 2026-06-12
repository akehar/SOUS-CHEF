// AUTO-GENERATED ART MAP — populated by `npm run generate:art`.
// That script renders a cover + one photo per step for every recipe via
// Gemini image generation (consistent natural-light/iPhone art direction)
// into assets/recipes/<recipeId>/ and rewrites this file with static
// require() entries so Metro can bundle them.
//
// Safe to ship empty: the UI falls back to the editorial plate heroes.

export type ArtSource = number | { uri: string };

export interface RecipeArt {
  cover?: ArtSource;
  steps: Record<string, ArtSource>;
}

export const RECIPE_ART: Record<string, RecipeArt> = {};

export function getArt(recipeId: string): RecipeArt | undefined {
  return RECIPE_ART[recipeId];
}

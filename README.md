# 👨‍🍳 SOUS-CHEF

**The AI sous-chef that actually stays in the kitchen with you.**

One codebase → **iOS, Android, and Web** (Expo / React Native + TypeScript). Chat with a chef who knows your allergens and macros, generate fully-structured custom recipes, and cook in a live mode where the AI **watches your pan through the camera and talks back** — *"your onions are golden but not caramelized yet; add a pinch of salt to speed it up."*

📐 Full product thinking in [STRATEGY.md](./STRATEGY.md).

## What's inside

| | Feature |
|---|---|
| 🍳 | **Discover** — curated recipes personalized to your diets/allergens, "Made for you" rail of AI-generated dishes, resume-cooking card |
| 👨‍🍳 | **Sous-Chef chat** — streaming conversation that knows your profile + pantry; flip on *Recipe mode* to generate complete recipes (macros, allergens, substitutes, wine pairing, per-step visual cues) |
| 🔴 | **Live Cook Mode** — step-by-step with heat levels, timers, chef tips, spoken instructions, and **pause/resume that survives app restarts** |
| 👁 | **Chef's Eye** — point the camera at the pan; on-demand or auto every 30s, the vision AI judges that step's doneness target and **speaks coaching aloud** |
| 🔄 | **Live substitutions** — SWAP button on any ingredient returns a chef-grade swap with exact ratios |
| 📊 | **Macro rings** — every recipe rendered against *your* daily targets |
| 🍷 | **Sommelier** — wine pairing + budget + zero-proof alternative on every recipe |
| 🛒 | **Grocery cart** — consolidate ingredients across recipes, one tap to Instacart / Amazon Fresh, or share the list |
| 🧺 | **Pantry** — feeds the chef ("use what I have"); fridge-photo scan endpoint ready |

## Quick start

```bash
# 1. The app (iOS / Android / Web)
npm install
npm run web        # or: npm run ios / npm run android / npm start

# 2. The AI backend (separate terminal)
cd server
npm install
cp .env.example .env     # add your ANTHROPIC_API_KEY
npm run dev              # http://localhost:8787
```

The app is fully usable without the backend (curated recipes, cook mode, timers, voice, cart). The backend powers chat, recipe generation, Chef's Eye vision checks, substitutions, and pantry scans.

On a physical device, the app auto-targets your Metro host's IP for the backend; override with `EXPO_PUBLIC_API_URL=http://<your-ip>:8787`.

## Models & cost

| Job | Default model | Why |
|---|---|---|
| Chat + recipe generation | `claude-opus-4-8` | Best culinary reasoning; adaptive thinking; JSON-schema-enforced recipes |
| Chef's Eye vision + pantry scan | `claude-haiku-4-5` | ~1–2s verdicts at ~$0.002/frame — the live loop stays cheap and snappy |

Both are env-swappable (`SOUS_CHAT_MODEL`, `SOUS_VISION_MODEL` in `server/.env`) — see the trade-off table in STRATEGY.md §3.

## Project layout

```
app/                 expo-router screens
  (tabs)/            Discover · Sous-Chef chat · Pantry & Cart · Profile
  recipe/[id].tsx    recipe detail (macros, swaps, wine, steps)
  cook/[id].tsx      Live Cook Mode (camera, vision, voice, timers)
src/
  components/        UI kit, MacroRing (SVG), RecipeCard
  services/          api (SSE streaming), chef (AI calls), voice (TTS), cart
  store/             zustand + AsyncStorage (prefs, cook session, pantry, cart)
  data/recipes.ts    curated recipes with per-step visual cues
  theme/             "Midnight Kitchen" design tokens
server/
  src/index.ts       Express AI proxy — /api/chat /api/recipe /api/vision
                     /api/substitute /api/pantry-scan
```

## Ship it

- **iOS / Android:** `npx eas build` (EAS) — camera/mic permission strings are already configured in `app.json`.
- **Web:** `npx expo export --platform web` → deploy `dist/` to any static host; run `server/` on any Node host and set `EXPO_PUBLIC_API_URL`.

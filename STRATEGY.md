# SOUS-CHEF — Product Strategy

> **The pitch in one line:** Every other cooking app gives you a recipe and walks away. SOUS-CHEF stays in the kitchen with you — watching the pan, talking you through it, and fixing problems before they happen.

---

## 1. The market gap

| Player | What they do | What they can't do |
|---|---|---|
| NYT Cooking, Tasty, Yummly | Recipe libraries with filters | Static text. No feedback once you start cooking. |
| ChatGPT / Gemini as "recipe bots" | Generate recipe text | No cook mode, no state, no camera, no cart, no structure. |
| HelloFresh / Blue Apron | Ingredients to your door | Locked to their menu; zero in-kitchen guidance. |
| Samsung Food, SideChef | Step-by-step modes, some voice | Scripted steps. The app can't *see* — it doesn't know if your onions are pale or burnt. |

**Nobody closes the loop between *seeing*, *coaching*, and *shopping*.** The moment of highest anxiety for a home cook — "is this done? did I ruin it?" — is exactly where every existing product is silent. That moment is SOUS-CHEF's core product.

## 2. The hero experience: Live Cook Mode

1. User picks (or generates) a recipe and taps **"Cook with me — live."**
2. Each step shows the instruction **plus "what done looks like"** — a sensory target written for both the human and the vision model.
3. **Chef's Eye:** the camera points at the pan. On demand ("Check my food") or hands-free every 30 seconds, a frame goes to a vision model that judges *that exact step's* doneness criteria and answers in three forms: a verdict chip (`perfect / keep going / adjust`), written coaching, and a **spoken sentence** — *"They're golden but not caramelized yet — add a pinch of salt to pull the moisture out and give it eight more minutes."*
4. Built-in step timers, hands-free voice readout of every step, **pause anywhere** — the session persists (step, progress, settings) and the home screen offers to resume exactly where you left off, even days later.
5. Finish → plating guidance, wine poured, recipe saved to your history.

It must *feel* live: streaming text, sub-2s spoken verdicts, haptics, a pulsing LIVE indicator. The benchmark is "a chef at your shoulder," not "a smart recipe page."

## 3. Vision AI: build vs. buy, and what it costs

The user-facing requirement is **photo/frame analysis with conversational coaching at very low cost and latency**. Options evaluated:

| Option | Latency | Cost per check | Verdict |
|---|---|---|---|
| **Claude Haiku 4.5** (default) | ~1–2s | ~**$0.002–0.004** (one ~1,600-token image + ~300 output tokens at $1/$5 per MTok) | ✅ Shipping default. Strong food reasoning, native JSON-schema outputs, same SDK as the chat brain. |
| Claude Opus 4.8 | ~2–4s | ~$0.02–0.05 | Optional "max acuity" env flag for premium tier. |
| Gemini Flash-class models | ~1–2s | sub-cent | Viable backup; second vendor for redundancy. |
| NVIDIA NIM hosted VLMs (the "NVDA" option) | varies | free dev credits, then per-GPU | Good for experimentation; production reliability/SLAs and food-domain reasoning are weaker than frontier APIs. |
| On-device models (e.g. small VLMs) | ~0ms network | $0 | Future cost-killer for the *auto-check* loop: run a tiny on-device "did anything change?" gate, only escalate interesting frames to the cloud model. |

**Architecture decision:** all AI traffic flows through one thin backend (`server/`), so the vision provider is a single env var (`SOUS_VISION_MODEL`). We can swap or A/B providers without an app release. True video streaming is unnecessary — cooking changes over seconds-to-minutes, so **sampled frames (on-demand + every 30s in auto mode)** deliver the "live" feeling at ~1/100th the cost of a video pipeline.

**Why frames go to a model with real culinary reasoning:** "are these onions caramelized?" is not object detection — it's judging color stage, moisture, fond development *in the context of the step's target*. Each request carries the step's `visualCue` ("deep amber-brown, jammy, collapsed to a third of original volume"), turning a generic VLM into a doneness specialist.

**Unit economics of a full cooked meal:** ~10 vision checks (~$0.03) + chat/recipe generation (~$0.05–0.10 on Opus) ≈ **under $0.15 per cooked meal** — comfortably inside a $7.99/mo subscription at 20 meals/month.

## 4. The brain: chat, recipes, substitutions

- **Conversational sous-chef** (streaming): knows the user's profile (diets, allergens as *hard constraints*, macro targets, skill, household size) and pantry. Asks sharp narrowing questions like a real chef.
- **Recipe mode:** one toggle turns the chat into a generator that emits a *fully structured* recipe (JSON-schema-enforced) — macros computed per serving, allergen list, substitutes with ratios, a wine pairing, and a `visualCue` on every step so the generated recipe is immediately compatible with Chef's Eye. Generated recipes appear in Discover under "Made for you."
- **On-the-fly substitutions:** every ingredient row has a SWAP button — "out of sherry?" returns the best swap *you likely already have*, with exact ratio and technique change.
- **Sommelier built in:** every recipe (curated or generated) ships with a wine pairing, the why, a budget band, and a zero-proof alternative.

## 5. Grocery loop

Recipe → "Add ingredients to cart" → consolidated cart grouped by recipe → **one tap to Instacart or Amazon Fresh** (universal search links ship today, zero partnership required) or share the list. Phase 2: Instacart Developer Platform / Kroger API for true in-app checkout with affiliate revenue per basket. The strategic point: SOUS-CHEF owns the *intent* moment (the user just committed to cooking this), which is the most valuable hand-off in grocery e-commerce.

## 6. Features beyond the brief (the "daily-use" hooks)

| Feature | Why it creates habit |
|---|---|
| **Fridge scan** (shipped: `/api/pantry-scan`) | Photo of your fridge → pantry auto-populated → "use what I have" recipes. Kills the #1 daily question. |
| **Macro rings vs. *your* targets** | Each recipe renders protein/carbs/fat as % of the user's personal goals — fitness users check it daily. |
| **Taste memory** (roadmap) | Every cooked meal, vision verdict, and substitution trains a taste profile: "you like more acid than most — I adjusted the dressing." |
| **Leftover remix** (roadmap) | Sunday's roast chicken → Monday's suggestions, from the pantry + history. |
| **Skill progression** (roadmap) | Chef's Eye scores technique over time — "your sears have improved 40% this month." Duolingo-style streaks for cooking. |
| **Cook-along rooms** (roadmap) | Friends cook the same recipe in synced sessions; the AI coaches everyone. |
| **Dinner-party mode** (roadmap) | Multi-dish timeline orchestration so everything lands hot at 7 pm. |

## 7. Architecture

```
┌─ Expo / React Native + TypeScript (ONE codebase → iOS, Android, Web) ─┐
│  expo-router screens · zustand + AsyncStorage (pause/resume persist)  │
│  expo-camera (frames) · expo-speech (TTS all platforms) · SVG rings   │
└──────────────────────────────┬────────────────────────────────────────┘
                               │ HTTPS + SSE
┌──────────────────────────────▼────────────────────────────────────────┐
│  server/ — Node + Express + @anthropic-ai/sdk (keys never in app)     │
│  /api/chat        streaming chef chat   (claude-opus-4-8, adaptive)   │
│  /api/recipe      structured recipe gen (JSON-schema enforced)        │
│  /api/vision      Chef's Eye verdicts   (claude-haiku-4-5, ~$0.002)   │
│  /api/substitute  instant swaps                                       │
│  /api/pantry-scan fridge photo → ingredient list                      │
└───────────────────────────────────────────────────────────────────────┘
```

Latency playbook: streaming tokens render as they arrive; vision responses are schema-constrained (no prose preamble to wait through); the spoken sentence (`speak`) is intentionally short; prompt caching pins the chef persona so repeat calls are cheap and fast; image frames upload at 0.4 JPEG quality (plenty for doneness, 10x smaller).

Offline resilience: every AI call degrades gracefully — the app demos fully (curated recipes, cook mode, timers, voice, cart) with no backend at all.

## 8. Business model

- **Free:** curated recipes, cook mode + timers + voice readout, cart links, 3 Chef's Eye checks/day.
- **SOUS-CHEF Pro ($7.99/mo):** unlimited Chef's Eye + auto-check, unlimited recipe generation, taste memory, dinner-party mode.
- **Margin:** ~$0.15 AI cost per cooked meal → >80% gross margin at typical usage.
- **Second revenue line:** grocery affiliate fees on cart hand-offs (Instacart/Kroger pay per converted basket); later, wine retail affiliates (Vivino/Drizly) off the pairing card.

## 9. Moat

1. **The doneness dataset.** Every Chef's Eye check pairs a real home-kitchen photo with a step context and an expert verdict users accept or correct. That corpus — millions of labeled "is it done?" judgments — is unobtainable elsewhere and compounds into a proprietary fine-tuned doneness model (cheaper *and* better over time).
2. **Taste memory.** Per-user preference graphs make the 100th recipe dramatically better than the 1st; switching away means starting over.
3. **Recipe schema as a platform.** Because every recipe (human or AI) carries machine-readable visual cues, timers, macros and pairings, new surfaces (watch, smart display, voice-only) are rendering targets, not rebuilds.

## 10. Roadmap

| Phase | Scope |
|---|---|
| **v1 (this repo)** | All four tabs, Live Cook Mode + Chef's Eye + voice, recipe generation, substitutions, macro rings, wine pairings, pause/resume, cart links, fridge scan API. |
| v1.1 | Auth + cloud sync, recipe history, taste memory v0, in-app fridge-scan camera flow, push "your dough has proofed" timers. |
| v1.2 | Instacart Developer Platform checkout, wine affiliate, voice *input* (hands-free "next step", "how's it looking?"). |
| v2 | Streak/skill system, leftover remix, cook-along rooms, dinner-party orchestration, watch app, on-device vision pre-filter. |

import Anthropic from '@anthropic-ai/sdk';
import cors from 'cors';
import express from 'express';

// SOUS-CHEF AI proxy. Keys live here, never in the app bundle.
// Chat + recipe generation run on Opus for quality; the live vision loop runs
// on Haiku by default so a frame check stays fast and costs ~$0.002.

const client = new Anthropic();
const CHAT_MODEL = process.env.SOUS_CHAT_MODEL ?? 'claude-opus-4-8';
const VISION_MODEL = process.env.SOUS_VISION_MODEL ?? 'claude-haiku-4-5';
const PORT = Number(process.env.PORT ?? 8787);

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' })); // camera frames arrive base64-encoded

const CHEF_PERSONA = `You are SOUS-CHEF, a warm, sharp, Michelin-trained AI sous-chef who lives in the user's kitchen.
You coach in real time: concrete, sensory, encouraging. You think in smells, sounds, and visuals ("listen for the sizzle to quiet down", "the edges should look lacy and brown").
Rules:
- NEVER suggest anything containing the user's listed allergens. Treat them as hard safety constraints.
- Respect diets and dislikes. Hit macro targets when asked.
- Prefer ingredients from the user's pantry when relevant.
- Keep chat replies tight: 2-5 short paragraphs max, no headers, kitchen-side tone.
- When asked what to cook, propose 2-3 concrete ideas with time + protein count, then ask one sharp question to narrow it down.`;

app.get('/health', (_req, res) => res.json({ ok: true, chat: CHAT_MODEL, vision: VISION_MODEL }));

// ---------- Streaming chat ----------

app.post('/api/chat', async (req, res) => {
  const { messages, preferences, pantry } = req.body as {
    messages: { role: 'user' | 'assistant'; content: string }[];
    preferences: string;
    pantry: string[];
  };

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const stream = client.messages.stream({
      model: CHAT_MODEL,
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      system: [
        { type: 'text', text: CHEF_PERSONA, cache_control: { type: 'ephemeral' } },
        {
          type: 'text',
          text: `USER PROFILE:\n${preferences}\n\nPANTRY ON HAND: ${pantry?.length ? pantry.join(', ') : '(empty)'}`,
        },
      ],
      messages,
    });

    stream.on('text', (delta) => {
      res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
    });

    await stream.finalMessage();
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('chat error', err);
    res.write(`data: ${JSON.stringify({ text: 'Kitchen mishap on my end — give me another try in a moment.' })}\n\n`);
    res.end();
  }
});

// ---------- Chef's Eye vision check ----------

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['perfect', 'keep_going', 'adjust', 'unclear'] },
    headline: { type: 'string', description: 'Verdict in 2-5 words, e.g. "Almost caramelized"' },
    feedback: {
      type: 'string',
      description: 'What you observe in the image and concrete coaching: what to change, how much longer, what to look/listen/smell for.',
    },
    speak: {
      type: 'string',
      description: 'One or two short conversational sentences to be spoken aloud, like a chef at the user\'s shoulder. Include one actionable tip, e.g. "add a touch of salt to speed it up".',
    },
  },
  required: ['status', 'headline', 'feedback', 'speak'],
  additionalProperties: false,
} as const;

app.post('/api/vision', async (req, res) => {
  const { image, recipeTitle, stepTitle, instruction, visualCue } = req.body as {
    image: string;
    recipeTitle: string;
    stepTitle: string;
    instruction: string;
    visualCue: string;
  };

  try {
    const response = await client.messages.create({
      model: VISION_MODEL,
      max_tokens: 600,
      system:
        'You are SOUS-CHEF\'s eyes: an expert chef judging doneness from a single photo of a home cook\'s pan or board. Be precise and honest — undercooked is undercooked. Judge ONLY this cooking step. If the image does not clearly show food for this step, use status "unclear".',
      output_config: { format: { type: 'json_schema', schema: VERDICT_SCHEMA } },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
            {
              type: 'text',
              text: `Recipe: ${recipeTitle}\nCurrent step: ${stepTitle}\nInstruction: ${instruction}\nTarget visual: ${visualCue}\n\nLook at the photo. Is this step done correctly / ready to move on? What should the cook do right now?`,
            },
          ],
        },
      ],
    });

    const text = response.content.find((b) => b.type === 'text');
    res.json(JSON.parse(text && text.type === 'text' ? text.text : '{}'));
  } catch (err) {
    console.error('vision error', err);
    res.status(500).json({ error: 'vision check failed' });
  }
});

// ---------- Custom recipe generation ----------

const RECIPE_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string', description: 'kebab-case slug' },
    title: { type: 'string' },
    tagline: { type: 'string', description: 'One appetizing sentence' },
    emoji: { type: 'string', description: 'Single food emoji' },
    heroColor: { type: 'string', description: 'Dark muted hex color matching the dish, e.g. #2B1D1D' },
    cuisine: { type: 'string' },
    difficulty: { type: 'string', enum: ['Easy', 'Intermediate', 'Advanced'] },
    totalMin: { type: 'integer' },
    servings: { type: 'integer' },
    macros: {
      type: 'object',
      properties: {
        calories: { type: 'integer' }, protein: { type: 'integer' },
        carbs: { type: 'integer' }, fat: { type: 'integer' },
      },
      required: ['calories', 'protein', 'carbs', 'fat'],
      additionalProperties: false,
    },
    tags: { type: 'array', items: { type: 'string' } },
    allergens: { type: 'array', items: { type: 'string' } },
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          note: { type: 'string' },
          substitutes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' }, ratio: { type: 'string' }, note: { type: 'string' },
              },
              required: ['name', 'ratio'],
              additionalProperties: false,
            },
          },
        },
        required: ['id', 'name', 'quantity', 'unit'],
        additionalProperties: false,
      },
    },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          instruction: { type: 'string' },
          durationMin: { type: 'integer' },
          timerSec: { type: 'integer' },
          visualCue: { type: 'string', description: 'What "done" looks like for live camera checks' },
          chefTip: { type: 'string' },
          heat: { type: 'string', enum: ['low', 'medium', 'medium-high', 'high', 'off'] },
        },
        required: ['id', 'title', 'instruction', 'visualCue'],
        additionalProperties: false,
      },
    },
    winePairing: {
      type: 'object',
      properties: {
        wine: { type: 'string' }, style: { type: 'string' }, why: { type: 'string' },
        budget: { type: 'string' }, altNonAlcoholic: { type: 'string' },
      },
      required: ['wine', 'style', 'why', 'budget'],
      additionalProperties: false,
    },
  },
  required: [
    'id', 'title', 'tagline', 'emoji', 'heroColor', 'cuisine', 'difficulty', 'totalMin',
    'servings', 'macros', 'tags', 'allergens', 'ingredients', 'steps', 'winePairing',
  ],
  additionalProperties: false,
} as const;

app.post('/api/recipe', async (req, res) => {
  const { request, preferences, pantry } = req.body as {
    request: string;
    preferences: string;
    pantry: string[];
  };

  try {
    const stream = client.messages.stream({
      model: CHAT_MODEL,
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      system: [
        {
          type: 'text',
          text:
            CHEF_PERSONA +
            '\n\nYou are generating a complete, cookable recipe as JSON. Every step needs a vivid visualCue (used by a live camera doneness-checker). Macros must be realistic per serving. Wine pairing must genuinely match the dish. Make the id a unique kebab-case slug with a random 4-char suffix.',
          cache_control: { type: 'ephemeral' },
        },
        {
          type: 'text',
          text: `USER PROFILE:\n${preferences}\n\nPANTRY ON HAND: ${pantry?.length ? pantry.join(', ') : '(empty)'}`,
        },
      ],
      output_config: { format: { type: 'json_schema', schema: RECIPE_SCHEMA } },
      messages: [{ role: 'user', content: `Create a recipe: ${request}` }],
    });
    const response = await stream.finalMessage();
    const text = response.content.find((b) => b.type === 'text');
    res.json(JSON.parse(text && text.type === 'text' ? text.text : '{}'));
  } catch (err) {
    console.error('recipe error', err);
    res.status(500).json({ error: 'recipe generation failed' });
  }
});

// ---------- On-the-fly substitution ----------

app.post('/api/substitute', async (req, res) => {
  const { ingredient, recipeTitle, preferences } = req.body as {
    ingredient: string;
    recipeTitle: string;
    preferences: string;
  };

  try {
    const response = await client.messages.create({
      model: CHAT_MODEL,
      max_tokens: 300,
      system: CHEF_PERSONA,
      messages: [
        {
          role: 'user',
          content: `USER PROFILE:\n${preferences}\n\nI'm making "${recipeTitle}" but I'm out of ${ingredient}. Give me the single best substitute I likely have at home, the exact ratio, and any technique change. 2 sentences max.`,
        },
      ],
    });
    const text = response.content.find((b) => b.type === 'text');
    res.json({ suggestion: text && text.type === 'text' ? text.text : 'No suggestion available.' });
  } catch (err) {
    console.error('substitute error', err);
    res.status(500).json({ error: 'substitution failed' });
  }
});

// ---------- Pantry photo scan ----------

app.post('/api/pantry-scan', async (req, res) => {
  const { image } = req.body as { image: string };

  try {
    const response = await client.messages.create({
      model: VISION_MODEL,
      max_tokens: 500,
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: { items: { type: 'array', items: { type: 'string' } } },
            required: ['items'],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
            { type: 'text', text: 'List every distinct food ingredient visible in this fridge/pantry photo. Short names only ("eggs", "cheddar", "scallions").' },
          ],
        },
      ],
    });
    const text = response.content.find((b) => b.type === 'text');
    res.json(JSON.parse(text && text.type === 'text' ? text.text : '{"items":[]}'));
  } catch (err) {
    console.error('pantry-scan error', err);
    res.status(500).json({ error: 'pantry scan failed' });
  }
});

app.listen(PORT, () => {
  console.log(`👨‍🍳 SOUS-CHEF AI server on http://localhost:${PORT}`);
  console.log(`   chat/recipes: ${CHAT_MODEL} · vision: ${VISION_MODEL}`);
});

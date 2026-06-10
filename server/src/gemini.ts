// Gemini as an alternative vision provider (set VISION_PROVIDER=gemini).
// Uses the REST API directly — structured JSON output via responseSchema —
// so no extra SDK dependency is needed.

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface GeminiSchema {
  type: string;
  [key: string]: unknown;
}

export async function geminiVisionJSON<T>(opts: {
  apiKey: string;
  model: string;
  imageBase64: string;
  prompt: string;
  systemInstruction: string;
  schema: GeminiSchema;
}): Promise<T> {
  const res = await fetch(`${GEMINI_BASE}/${opts.model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': opts.apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.systemInstruction }] },
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: opts.imageBase64 } },
            { text: opts.prompt },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: opts.schema,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  return JSON.parse(text) as T;
}

// Gemini's responseSchema dialect (OpenAPI-style, uppercase types).

export const GEMINI_VERDICT_SCHEMA: GeminiSchema = {
  type: 'OBJECT',
  properties: {
    status: { type: 'STRING', enum: ['perfect', 'keep_going', 'adjust', 'unclear'] },
    headline: { type: 'STRING', description: 'Verdict in 2-5 words, e.g. "Almost caramelized"' },
    feedback: {
      type: 'STRING',
      description: 'What you observe in the image and concrete coaching: what to change, how much longer, what to look for.',
    },
    speak: {
      type: 'STRING',
      description: 'One or two short conversational sentences spoken aloud, like a chef at the cook\'s shoulder, with one actionable tip.',
    },
  },
  required: ['status', 'headline', 'feedback', 'speak'],
};

export const GEMINI_PANTRY_SCHEMA: GeminiSchema = {
  type: 'OBJECT',
  properties: {
    items: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['items'],
};

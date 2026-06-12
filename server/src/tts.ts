// Gemini TTS for the sous-chef's voice. Returns a playable WAV (the API
// emits raw 24kHz/16-bit/mono PCM, so we wrap it in a WAV header here).
// Responses are memo-cached by text+voice so repeated steps cost nothing.

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const cache = new Map<string, Buffer>();
const CACHE_MAX = 300;

function wavFromPCM(pcm: Buffer, sampleRate = 24000, channels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export async function geminiTTS(opts: {
  apiKey: string;
  model: string;
  text: string;
  voice: string;
}): Promise<Buffer> {
  const key = `${opts.voice}::${opts.text}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const res = await fetch(`${GEMINI_BASE}/${opts.model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': opts.apiKey },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              // Gemini TTS takes style direction in natural language.
              text: `Say this in a warm, unhurried, encouraging voice — like a friendly chef coaching at your shoulder in a home kitchen: ${opts.text}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: opts.voice } },
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini TTS ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { inlineData?: { data?: string } }[] } }[];
  };
  const b64 = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData?.data;
  if (!b64) throw new Error('Gemini TTS returned no audio');

  const wav = wavFromPCM(Buffer.from(b64, 'base64'));
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, wav);
  return wav;
}

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Resolves the AI backend URL. On a device, Metro's host IP lets the phone
// reach the server running on your laptop. Override with EXPO_PUBLIC_API_URL.
export function apiBase(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  if (Platform.OS === 'web') return 'http://localhost:8787';
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return host ? `http://${host}:8787` : 'http://localhost:8787';
}

export async function postJSON<T>(path: string, body: unknown, timeoutMs = 30000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${apiBase()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// Streams server-sent text chunks from the backend. Falls back to a single
// non-streamed response body where ReadableStream isn't available (older RN).
export async function postStream(
  path: string,
  body: unknown,
  onChunk: (text: string) => void,
): Promise<string> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);

  const reader = (res.body as ReadableStream<Uint8Array> | null)?.getReader?.();
  if (!reader) {
    const text = await res.text();
    onChunk(text);
    return text;
  }

  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data) as { text?: string };
        if (parsed.text) {
          full += parsed.text;
          onChunk(parsed.text);
        }
      } catch {
        // ignore malformed keep-alive lines
      }
    }
  }
  return full;
}

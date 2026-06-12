import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { apiBase } from './api';

// The sous-chef's voice. Primary: natural Gemini TTS served by the backend
// (/api/tts, ~half a cent per spoken step, cached). Fallback: the on-device
// system voice so coaching never goes silent offline.

let player: AudioPlayer | null = null;
let speaking = false;
let configured = false;

// text → playable local uri (file:// on native, blob: on web)
const audioCache = new Map<string, string>();

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    out += chars[a >> 2];
    out += chars[((a & 3) << 4) | (b === undefined ? 0 : b >> 4)];
    out += b === undefined ? '=' : chars[((b & 15) << 2) | (c === undefined ? 0 : c >> 6)];
    out += c === undefined ? '=' : chars[c & 63];
  }
  return out;
}

async function ensureAudioMode() {
  if (configured) return;
  configured = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
  } catch {
    // web or unsupported — fine
  }
}

async function fetchNaturalVoice(text: string): Promise<string | null> {
  const key = hash(text);
  const cached = audioCache.get(key);
  if (cached) return cached;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(`${apiBase()}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();

    let uri: string;
    if (Platform.OS === 'web') {
      uri = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
    } else {
      uri = `${FileSystem.cacheDirectory}tts-${key}.wav`;
      await FileSystem.writeAsStringAsync(uri, arrayBufferToBase64(buf), {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
    audioCache.set(key, uri);
    return uri;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function playUri(uri: string) {
  stopPlayback();
  player = createAudioPlayer({ uri });
  speaking = true;
  player.addListener('playbackStatusUpdate', (status) => {
    if (status.didJustFinish) speaking = false;
  });
  player.play();
}

function stopPlayback() {
  if (player) {
    try {
      player.pause();
      player.remove();
    } catch {
      // already released
    }
    player = null;
  }
}

function speakWithSystemVoice(text: string, rate?: number) {
  try {
    Speech.stop();
    speaking = true;
    Speech.speak(text, {
      rate: rate ?? 1.0,
      pitch: 1.0,
      onDone: () => { speaking = false; },
      onStopped: () => { speaking = false; },
      onError: () => { speaking = false; },
    });
  } catch {
    speaking = false;
  }
}

export function speak(text: string, opts?: { rate?: number }) {
  void (async () => {
    await ensureAudioMode();
    // Stop whatever is talking before the next line begins.
    stopSpeaking();
    const uri = await fetchNaturalVoice(text);
    if (uri) {
      playUri(uri);
    } else {
      speakWithSystemVoice(text, opts?.rate);
    }
  })();
}

export function stopSpeaking() {
  stopPlayback();
  try {
    Speech.stop();
  } catch {
    // no-op
  }
  speaking = false;
}

export function isSpeaking() {
  return speaking;
}

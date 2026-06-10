import * as Speech from 'expo-speech';

// Spoken feedback for the live sous-chef. expo-speech wraps the native TTS on
// iOS/Android and speechSynthesis on web, so one call covers all platforms.

let speaking = false;

export function speak(text: string, opts?: { rate?: number }) {
  try {
    Speech.stop();
    speaking = true;
    Speech.speak(text, {
      rate: opts?.rate ?? 1.0,
      pitch: 1.0,
      onDone: () => {
        speaking = false;
      },
      onStopped: () => {
        speaking = false;
      },
      onError: () => {
        speaking = false;
      },
    });
  } catch {
    speaking = false;
  }
}

export function stopSpeaking() {
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

// Csepi's voice. Uses the browser's Hungarian text-to-speech until recorded audio replaces it.
// Every call is a no-op when speech is unavailable or switched off in the parents' corner.

let enabled = true;
/** Slow suits the youngest; parents can switch to normal. */
let rate = 0.85;
let voice: SpeechSynthesisVoice | null = null;

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
}

function pickVoice(): void {
  const s = synth();
  if (!s) return;
  const voices = s.getVoices();
  voice = voices.find((v) => v.lang.toLowerCase().startsWith('hu')) ?? null;
}

const s0 = synth();
if (s0) {
  pickVoice();
  s0.addEventListener?.('voiceschanged', pickVoice);
}

export function setSpeechRate(speed: 'slow' | 'normal'): void {
  rate = speed === 'slow' ? 0.85 : 1.0;
}

export function setSpeechEnabled(on: boolean): void {
  enabled = on;
  if (!on) synth()?.cancel();
}

interface SpeakOptions {
  /** Wait for the current sentence instead of interrupting it. */
  queue?: boolean;
}

export function speak(text: string, { queue = false }: SpeakOptions = {}): void {
  const s = synth();
  if (!s || !enabled || !text) return;
  try {
    if (!queue) s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'hu-HU';
    if (voice) u.voice = voice;
    u.rate = rate;
    u.pitch = 1.15;
    s.speak(u);
  } catch {
    // Speech is a nice-to-have; the bubble always shows the same text.
  }
}

export function stopSpeaking(): void {
  synth()?.cancel();
}

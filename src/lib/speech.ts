// Csepi's and Csavar's voices. Uses the browser's Hungarian text-to-speech until recorded audio replaces it.
// Every call is a no-op when speech is unavailable or switched off in the parents' corner.

import { robotChirp } from './sound';

let enabled = true;
/** Slow suits the youngest; parents can switch to normal. */
let rate = 0.85;
let voice: SpeechSynthesisVoice | null = null;
/** Csavar uses a man's voice when the device has one, so he sounds different even where pitch is ignored. */
let robotVoice: SpeechSynthesisVoice | null = null;

const MALE = /tam[aá]s|szabolcs|\bmale\b|férfi/i;

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
}

function pickVoice(): void {
  const s = synth();
  if (!s) return;
  const voices = s.getVoices();
  const hu = voices.filter((v) => v.lang.toLowerCase().startsWith('hu'));
  voice = hu.find((v) => !MALE.test(v.name)) ?? hu[0] ?? null;
  // Prefer a voice on the device: online voices (Edge's "Natural" ones) ignore pitch and lag on many short pieces.
  robotVoice =
    hu.find((v) => v.localService && MALE.test(v.name)) ?? hu.find((v) => MALE.test(v.name)) ?? hu.find((v) => v.localService) ?? voice;
}

const s0 = synth();
if (s0) {
  pickVoice();
  s0.addEventListener?.('voiceschanged', pickVoice);
}

export function setSpeechRate(speed: 'slow' | 'normal'): void {
  rate = speed === 'slow' ? 0.85 : 1.0;
}

export type Speaker = 'csepi' | 'robot';
let speaker: Speaker = 'csepi';

/**
 * Csepi speaks a little high. Csavar, the robot, says "bip-bup" and then speaks low and flat, one word at a time.
 * With an online voice (Edge without an installed Hungarian voice) pitch is ignored and word-by-word queues stall,
 * so there he speaks whole sentences in a man's voice.
 */
export function setSpeaker(who: Speaker): void {
  speaker = who;
}

function utter(text: string, v: SpeechSynthesisVoice | null, pitch: number, rateScale: number): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'hu-HU';
  if (v) u.voice = v;
  u.rate = rate * rateScale;
  u.pitch = pitch;
  return u;
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
    if (speaker === 'robot') {
      if (!queue) robotChirp();
      if (robotVoice && !robotVoice.localService) {
        s.speak(utter(text, robotVoice, 0.3, 1.1));
      } else {
        // Separate utterances leave a small gap between words: the even, choppy beat of a robot.
        // The words themselves go a bit quicker so the gaps don't drag the whole sentence out.
        for (const word of text.split(/\s+/).filter(Boolean)) s.speak(utter(word, robotVoice, 0.3, 1.3));
      }
    } else {
      s.speak(utter(text, voice, 1.15, 1));
    }
  } catch {
    // Speech is a nice-to-have; the bubble always shows the same text.
  }
}

export function stopSpeaking(): void {
  synth()?.cancel();
}

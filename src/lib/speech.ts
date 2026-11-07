// Csepi's and Csavar's voices. Uses the browser's Hungarian text-to-speech until recorded audio replaces it.
// Every call is a no-op when speech is unavailable or switched off in the parents' corner.

import { robotChirp } from './sound';

let enabled = true;
/** Slow suits the youngest; parents can switch to normal. */
let rate = 0.85;
let voice: SpeechSynthesisVoice | null = null;
/** Csavar uses a man's voice when the device has one, so he sounds different even where pitch is ignored. */
let robotVoice: SpeechSynthesisVoice | null = null;

/** Voice names parents chose in the advanced settings; '' lets the app pick. */
let chosen: Record<Speaker, string> = { csepi: '', robot: '' };
const listeners = new Set<() => void>();
let huVoices: SpeechSynthesisVoice[] = [];

const MALE = /tam[aá]s|szabolcs|\bmale\b|férfi/i;

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
}

function pickVoice(): void {
  const s = synth();
  if (!s) return;
  const hu = s.getVoices().filter((v) => v.lang.toLowerCase().startsWith('hu'));
  huVoices = hu;
  const byName = (name: string) => (name ? hu.find((v) => v.name === name) : undefined);
  voice = byName(chosen.csepi) ?? hu.find((v) => !MALE.test(v.name)) ?? hu[0] ?? null;
  // Prefer a voice on the device: online voices (Edge's "Natural" ones) ignore pitch and lag on many short pieces.
  robotVoice =
    byName(chosen.robot) ??
    hu.find((v) => v.localService && MALE.test(v.name)) ??
    hu.find((v) => MALE.test(v.name)) ??
    hu.find((v) => v.localService) ??
    voice;
  listeners.forEach((l) => l());
}

const s0 = synth();
if (s0) {
  pickVoice();
  s0.addEventListener?.('voiceschanged', pickVoice);
}

/** The Hungarian voices on this device; some browsers fill the list a moment after start. */
export function hungarianVoices(): SpeechSynthesisVoice[] {
  return huVoices;
}

export function onVoicesChanged(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** A chosen voice that is missing on this device (another browser, uninstalled) falls back to the automatic pick. */
export function setVoiceChoice(csepi: string, robot: string): void {
  chosen = { csepi, robot };
  pickVoice();
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

/** True when a voice can actually be heard: the browser speaks and parents haven't switched it off. */
export function canSpeak(): boolean {
  return enabled && synth() !== null;
}

interface SpeakOptions {
  /** Wait for the current sentence instead of interrupting it. */
  queue?: boolean;
  /** Say it in this character's voice instead of the current speaker's (the parents' voice preview). */
  as?: Speaker;
  /**
   * Said instead of `text` when the voice is not on the device. An online voice sends the text to the browser
   * maker's server, so a line with a child's name gives one without it here.
   */
  online?: string;
}

/** True unless the speaker's voice runs on this device. No Hungarian voice means the browser picks one we can't vouch for. */
function isOnline(as: Speaker): boolean {
  const v = as === 'robot' ? robotVoice : voice;
  return !v?.localService;
}

/**
 * Spellings for words the Hungarian voices get wrong. Only what is said changes; the bubble keeps the real word.
 * "matrica" comes out as "matrika", while "ts" reads as the c it should be (matricát, matricáim too).
 */
const SAY_AS: [RegExp, string][] = [[/(m)atric/gi, '$1atrits']];

export function pronounce(text: string): string {
  return SAY_AS.reduce((t, [from, to]) => t.replace(from, to), text);
}

export function speak(text: string, { queue = false, as = speaker, online }: SpeakOptions = {}): void {
  const s = synth();
  if (!s || !enabled || !text) return;
  if (online !== undefined && isOnline(as)) text = online;
  text = pronounce(text);
  try {
    if (!queue) s.cancel();
    if (as === 'robot') {
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

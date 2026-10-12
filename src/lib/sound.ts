// Small synthesised sound effects (no audio files, so they work offline from the first launch).
// Every call is a no-op when Web Audio is unavailable or sounds are switched off in the parents' corner.

let enabled = true;
let ctx: AudioContext | null = null;

/** C major pentatonic, so any run of pops sounds like a little tune. */
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];

function audio(): AudioContext | null {
  if (!enabled || typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx ??= new Ctor();
    // Browsers start audio suspended until a user gesture; every sound here follows a touch.
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

/** A soft rising "blip" from `from` to `to` Hz. */
function blip(a: AudioContext, from: number, to: number, at: number, length: number, volume: number): void {
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + length * 0.6);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(gain).connect(a.destination);
  osc.start(at);
  osc.stop(at + length + 0.02);
}

/** Bubble pop for a honey drop; `step` climbs the scale so a stroke plays upwards. */
export function popBubble(step = 0): void {
  const a = audio();
  if (!a) return;
  const f = SCALE[Math.max(0, step) % SCALE.length];
  blip(a, f * 0.55, f, a.currentTime, 0.11, 0.22);
}

/** A stroke is finished: two quick notes. */
export function chime(): void {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  blip(a, 784, 784, t, 0.22, 0.18);
  blip(a, 1046.5, 1046.5, t + 0.12, 0.3, 0.18);
}

/** The whole digit is written: a short rising run. */
export function fanfare(): void {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => blip(a, f, f, t + i * 0.1, i === 3 ? 0.5 : 0.18, 0.18));
}

/** A tiny tap on devices that can vibrate (most Android tablets; iPads ignore it). */
export function buzz(ms = 12): void {
  if (!enabled) return;
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Not supported: the sound and the pop animation carry the feedback.
  }
}

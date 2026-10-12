import { article, numberCount } from '../../lib/numbers';
import type { Mood, Tone } from '../../lib/types';

// Mézút: trace the digits 0–9 by leading the bee along a dotted honey trail.
// Pure geometry so it can be tested: each digit is a list of strokes, each stroke an evenly
// sampled polyline in a 200 × 300 box. Tracing only ever moves forward along the trail, so a
// wobbly finger still leaves a neat line: the honey follows the trail, not the finger.

export interface Pt {
  x: number;
  y: number;
}

export const BOX_W = 200;
export const BOX_H = 300;
/** Distance between samples on a trail. */
export const STEP = 3;
/** How far the finger may wander from the trail and still lead the bee. */
export const TOLERANCE = 40;
/** How far ahead of the bee the finger may land; keeps an 8 from jumping across its middle. */
export const LOOKAHEAD = 66;
/** Behind the bee counts as "on the trail" too (no progress, but no straying). */
const LOOKBACK = 30;
/** This close to the end, a stroke is finished. */
export const END_SNAP = 16;
/** A honey drop to pop every this many units of trail. */
export const CHECKPOINT_GAP = 42;

// ---------- path builders ----------

const line = (a: Pt, b: Pt): Pt[] => [a, b];

function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, n = 40): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
    };
  });
}

/** Elliptical arc from angle a0 to a1 in degrees (0 = right, 90 = down, as on screen). */
function arc(c: Pt, rx: number, ry: number, a0: number, a1: number, n = 72): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return { x: c.x + rx * Math.cos(a), y: c.y + ry * Math.sin(a) };
  });
}

const p = (x: number, y: number): Pt => ({ x, y });

/** Joins pieces end to start (dropping the repeated joint) and resamples to even steps. */
function stroke(...pieces: Pt[][]): Pt[] {
  const pts = pieces.flatMap((piece, i) => (i === 0 ? piece : piece.slice(1)));
  return resample(pts, STEP);
}

export function resample(pts: Pt[], step: number): Pt[] {
  if (pts.length < 2) return pts.slice();
  const out: Pt[] = [pts[0]];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    let d = step - carry;
    while (d <= len) {
      const t = d / len;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      d += step;
    }
    carry = len - (d - step);
  }
  const last = pts[pts.length - 1];
  const tail = out[out.length - 1];
  if (Math.hypot(last.x - tail.x, last.y - tail.y) > 0.5) out.push(last);
  return out;
}

// ---------- the digits, written the way Hungarian first graders learn them ----------

export interface DigitShape {
  digit: number;
  strokes: Pt[][];
}

const SHAPES: Record<number, Pt[][]> = {
  0: [stroke(arc(p(100, 150), 66, 126, -90, -450))],
  1: [stroke(line(p(52, 100), p(130, 22)), line(p(130, 22), p(130, 282)))],
  2: [stroke(cubic(p(44, 92), p(40, 8), p(168, 8), p(160, 96)), cubic(p(160, 96), p(154, 150), p(84, 200), p(40, 280)), line(p(40, 280), p(170, 280)))],
  3: [
    stroke(
      cubic(p(44, 66), p(70, 2), p(170, 10), p(160, 84)),
      cubic(p(160, 84), p(154, 128), p(116, 142), p(88, 146)),
      cubic(p(88, 146), p(150, 146), p(176, 186), p(166, 230)),
      cubic(p(166, 230), p(152, 298), p(60, 296), p(38, 250))
    )
  ],
  4: [stroke(line(p(118, 22), p(30, 196)), line(p(30, 196), p(176, 196))), stroke(line(p(140, 100), p(140, 284)))],
  5: [
    stroke(line(p(64, 26), p(54, 132)), cubic(p(54, 132), p(110, 96), p(176, 118), p(170, 196)), cubic(p(170, 196), p(164, 288), p(70, 296), p(38, 248))),
    stroke(line(p(64, 26), p(158, 26)))
  ],
  6: [
    stroke(
      cubic(p(152, 40), p(112, 6), p(48, 52), p(44, 172)),
      cubic(p(44, 172), p(40, 262), p(86, 286), p(110, 286)),
      cubic(p(110, 286), p(160, 286), p(170, 240), p(166, 210)),
      cubic(p(166, 210), p(162, 166), p(124, 150), p(102, 150)),
      cubic(p(102, 150), p(70, 150), p(48, 176), p(46, 204))
    )
  ],
  7: [stroke(line(p(38, 30), p(166, 30)), line(p(166, 30), p(80, 286))), stroke(line(p(82, 160), p(162, 160)))],
  8: [
    stroke(
      cubic(p(140, 66), p(140, 18), p(60, 18), p(60, 70)),
      cubic(p(60, 70), p(60, 120), p(146, 138), p(146, 210)),
      cubic(p(146, 210), p(146, 292), p(54, 292), p(54, 210)),
      cubic(p(54, 210), p(54, 138), p(140, 120), p(140, 66))
    )
  ],
  9: [stroke(cubic(p(150, 88), p(150, 26), p(56, 22), p(54, 90)), cubic(p(54, 90), p(52, 152), p(148, 156), p(150, 88)), line(p(150, 88), p(140, 286)))]
};

/** Rounds go 1, 2, … 9, then 0, then start again. */
export const TRACE_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

export function digitShape(digit: number): DigitShape {
  const strokes = SHAPES[digit];
  if (!strokes) throw new RangeError(`No trail for digit ${digit}`);
  return { digit, strokes };
}

export function buildTraceRound(round: number): DigitShape {
  const r = Math.max(0, Math.floor(round));
  return digitShape(TRACE_ORDER[r % TRACE_ORDER.length]);
}

/** SVG path data for a sampled stroke. */
export function pathData(pts: Pt[]): string {
  return pts.map((q, i) => `${i ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join('');
}

/** Sample indices where honey drops sit: spread evenly, never on the very start, always on the end. */
export function checkpoints(pts: Pt[]): number[] {
  const last = pts.length - 1;
  const every = Math.max(1, Math.round(CHECKPOINT_GAP / STEP));
  const out: number[] = [];
  for (let i = every; i < last - every / 2; i += every) out.push(i);
  out.push(last);
  return out;
}

// ---------- following the finger ----------

export interface Follow {
  /** How far along the trail the bee is (sample index). */
  idx: number;
  /** The finger is too far from the trail: the bee waits and shows the way back. */
  strayed: boolean;
  done: boolean;
}

/**
 * Moves the bee forward to the trail point nearest the finger, searching only a short way ahead.
 * Never moves backwards and never fails: off the trail the bee simply waits where it is.
 */
export function follow(pts: Pt[], idx: number, finger: Pt): Follow {
  const last = pts.length - 1;
  const ahead = Math.min(last, idx + Math.round(LOOKAHEAD / STEP));
  const behind = Math.max(0, idx - Math.round(LOOKBACK / STEP));
  let best = idx;
  let bestD = Infinity;
  let nearestD = Infinity;
  for (let i = behind; i <= ahead; i++) {
    const d = Math.hypot(pts[i].x - finger.x, pts[i].y - finger.y);
    nearestD = Math.min(nearestD, d);
    if (i >= idx && d < bestD) {
      bestD = d;
      best = i;
    }
  }
  const strayed = nearestD > TOLERANCE;
  let next = !strayed && bestD <= TOLERANCE ? Math.max(idx, best) : idx;
  if (last - next <= Math.round(END_SNAP / STEP)) next = last;
  return { idx: next, strayed, done: next === last };
}

/** A touch may (re)start tracing anywhere close to the bee or a little ahead of it. */
export function canGrab(pts: Pt[], idx: number, finger: Pt): boolean {
  const ahead = Math.min(pts.length - 1, idx + Math.round(LOOKAHEAD / STEP));
  for (let i = Math.max(0, idx - Math.round(LOOKBACK / STEP)); i <= ahead; i++) {
    if (Math.hypot(pts[i].x - finger.x, pts[i].y - finger.y) <= TOLERANCE * 1.4) return true;
  }
  return false;
}

/** Direction of travel at a sample, in degrees (0 = right, 90 = down). */
export function heading(pts: Pt[], idx: number): number {
  const a = pts[Math.max(0, Math.min(idx, pts.length - 2))];
  const b = pts[Math.min(pts.length - 1, Math.max(idx, 0) + 4)];
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

// ---------- Csepi's words ----------

/** "egyes", "kettes", "hármas": a digit as a written figure. */
const DIGIT_NAMES = ['nullás', 'egyes', 'kettes', 'hármas', 'négyes', 'ötös', 'hatos', 'hetes', 'nyolcas', 'kilences'];

export function digitName(d: number): string {
  return DIGIT_NAMES[d];
}

export function digitWord(d: number): string {
  return d === 0 ? 'nulla' : numberCount(d);
}

export interface TraceFeedback {
  text: string;
  speech: string;
  mood: Mood;
  tone: Tone;
}

export function startFeedback(shape: DigitShape): TraceFeedback {
  const name = digitName(shape.digit);
  const strokes = shape.strokes.length > 1 ? ' Két vonalból áll.' : '';
  return {
    text: `Írjunk egy ${name}t! Vezesd a méhecskét a mézes úton.${strokes}`,
    speech: `Írjunk egy ${name}t! Tedd az ujjad a méhecskére, és vezesd végig a mézes úton.${strokes}`,
    mood: 'smile',
    tone: 'plain'
  };
}

export const NEXT_STROKE: TraceFeedback = {
  text: 'Szép! Most jön a második vonal.',
  speech: 'Szép! A méhecske már vár a második vonal elején.',
  mood: 'cheer',
  tone: 'plain'
};

export const STRAYED: TraceFeedback = {
  text: 'Gyere vissza a mézes útra!',
  speech: 'Hoppá, a méhecske itt vár. Gyere vissza a mézes útra!',
  mood: 'think',
  tone: 'oops'
};

export const GRAB_THE_BEE: TraceFeedback = {
  text: 'Kezdd a méhecskénél!',
  speech: 'Tedd az ujjad a méhecskére, ő mutatja az utat.',
  mood: 'think',
  tone: 'plain'
};

export function doneFeedback(digit: number): TraceFeedback {
  const name = digitName(digit);
  const word = digitWord(digit);
  return {
    text: `Ügyes vagy! Ez ${article(name)} ${name}: ${digit}.`,
    speech: `Ügyes vagy, szépen vezetted! Ez ${article(name)} ${name}: ${word}.`,
    mood: 'cheer',
    tone: 'good'
  };
}

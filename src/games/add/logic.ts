import { article, capitalize, numberAttr, numberCount } from '../../lib/numbers';
import type { Mood, Tone } from '../../lib/types';
import { rng } from '../flash/layout';

// Méhecske: addition from "3 + 2" up to "38 + 25". Two groups, "a + b = ?", the child picks the total.
// From 20 upward a bouquet (csokor) of ten flowers stands for a ten; loose flowers are the ones.
// The bee is the helper: tap a flower or bouquet and it flies there and counts.

/** Méhecske opens once the child has met all ten numbers in Számvetés (or a parent opens everything). */
export const UNLOCK_ADD_AFTER = 10;
/** Correct answers in a row needed to move up a level. */
export const LEVEL_UP_STREAK = 5;

export const SCENE_W = 1000;
export const SCENE_H = 250;
export const LEFT_X = 0;
export const RIGHT_X = 600;
export const BOX_W = 400;

type Pick = (lo: number, hi: number) => number;

export interface AddLevel {
  /** Shown to parents. */
  name: string;
  /** all: count everything. on: the first group is a basket with its number, count on from it. */
  strategy: 'all' | 'on';
  /** Draw tens as bouquets. */
  bundles: boolean;
  /** Wrong answers offered: near misses by one (and two), or by one and by ten. */
  distractors: 'small' | 'tens';
  make: (pick: Pick) => [number, number];
}

export const ADD_LEVELS: AddLevel[] = [
  {
    name: '5-ig',
    strategy: 'all',
    bundles: false,
    distractors: 'small',
    make: (pick) => {
      const b = pick(1, 4);
      return [pick(1, 5 - b), b];
    }
  },
  {
    name: '10-ig',
    strategy: 'all',
    bundles: false,
    distractors: 'small',
    make: (pick) => {
      const b = pick(1, 5);
      return [pick(1, 10 - b), b];
    }
  },
  {
    name: '10-ig, továbbszámolással',
    strategy: 'on',
    bundles: false,
    distractors: 'small',
    make: (pick) => {
      const b = pick(1, 4);
      return [pick(3, 10 - b), b];
    }
  },
  {
    name: '20-ig',
    strategy: 'all',
    bundles: true,
    distractors: 'small',
    make: (pick) => {
      const x = pick(0, 5);
      return [10 + x, pick(1, 9 - x)];
    }
  },
  {
    name: '20-ig, tízes átlépéssel',
    strategy: 'all',
    bundles: true,
    distractors: 'small',
    make: (pick) => {
      const a = pick(6, 9);
      return [a, pick(11 - a, 9)];
    }
  },
  {
    name: 'Kerek tízesek 100-ig',
    strategy: 'all',
    bundles: true,
    distractors: 'tens',
    make: (pick) => {
      const ta = pick(1, 5);
      return [ta * 10, pick(1, Math.min(5, 10 - ta)) * 10];
    }
  },
  {
    name: '100-ig',
    strategy: 'all',
    bundles: true,
    distractors: 'tens',
    make: (pick) => {
      const ta = pick(1, 5);
      const oa = pick(1, 8);
      const tb = pick(1, Math.min(4, 9 - ta));
      return [ta * 10 + oa, tb * 10 + pick(1, 9 - oa)];
    }
  },
  {
    name: '100-ig, tízes átlépéssel',
    strategy: 'all',
    bundles: true,
    distractors: 'tens',
    make: (pick) => {
      const ta = pick(1, 4);
      const oa = pick(2, 9);
      const tb = pick(1, Math.min(4, 8 - ta));
      return [ta * 10 + oa, tb * 10 + pick(10 - oa, 9)];
    }
  }
];

export function clampLevel(level: number): number {
  return Math.min(ADD_LEVELS.length - 1, Math.max(0, Math.floor(level)));
}

// Adaptive levels. The game never moves the child on its own: it offers one step and the child chooses.

/** Tasks in a row that needed help (any wrong pick) before an easier level is offered. */
export const STEP_DOWN_MISSES = 3;

export type Offer = 'up' | 'down' | null;

export interface AdaptState {
  level: number;
  streak: number;
  misses: number;
}

/**
 * A task is finished. `firstTry` = solved without a wrong pick.
 * First try: the streak grows (up to five) and "harder?" is offered at five.
 * Needed help: the streak is already gone; the help count grows and "easier?" is offered at three.
 */
export function afterTask(s: AdaptState, firstTry: boolean): AdaptState & { offer: Offer } {
  const top = ADD_LEVELS.length - 1;
  if (firstTry) {
    const streak = Math.min(LEVEL_UP_STREAK, s.streak + 1);
    return { level: s.level, streak, misses: 0, offer: streak >= LEVEL_UP_STREAK && s.level < top ? 'up' : null };
  }
  const misses = s.misses + 1;
  return { level: s.level, streak: 0, misses, offer: misses >= STEP_DOWN_MISSES && s.level > 0 ? 'down' : null };
}

/** The child's answer to an offer: take the step, or stay. Either way the counters start again. */
export function chooseOffer(s: AdaptState, offer: Exclude<Offer, null>, accept: boolean): AdaptState {
  const step = accept ? (offer === 'up' ? 1 : -1) : 0;
  return { level: clampLevel(s.level + step), streak: 0, misses: 0 };
}

export interface AddItem {
  id: string;
  group: 'a' | 'b';
  kind: 'ten' | 'one';
  value: number;
  x: number;
  y: number;
}

export interface AddRound {
  a: number;
  b: number;
  sum: number;
  levelIndex: number;
  level: AddLevel;
  items: AddItem[];
  choices: number[];
  petalA: string;
  petalB: string;
}

const PETAL_PAIRS: [string, string][] = [
  ['#F2709C', '#7DA7F5'],
  ['#FFC93C', '#B07CE8'],
  ['#F2603A', '#FFFFFF'],
  ['#FFB347', '#7DA7F5']
];

/** Bouquets in a row on top, loose flowers in rows of five below, centred in the group box. */
function placeGroup(n: number, group: 'a' | 'b', boxX: number, bundles: boolean): AddItem[] {
  const tens = bundles ? Math.floor(n / 10) : 0;
  const ones = n - tens * 10;
  const oneRows = Math.ceil(ones / 5);
  const rows = (tens > 0 ? 1 : 0) + oneRows;
  const rowGap = rows >= 3 ? 80 : 100;
  const top = SCENE_H / 2 - ((rows - 1) * rowGap) / 2;
  const cx = boxX + BOX_W / 2;
  const items: AddItem[] = [];

  for (let i = 0; i < tens; i++) {
    items.push({ id: `${group}t${i}`, group, kind: 'ten', value: 10, x: cx + (i - (tens - 1) / 2) * 72, y: top });
  }
  const oneTop = top + (tens > 0 ? rowGap : 0);
  for (let i = 0; i < ones; i++) {
    const row = Math.floor(i / 5);
    const inRow = Math.min(5, ones - row * 5);
    items.push({ id: `${group}o${i}`, group, kind: 'one', value: 1, x: cx + ((i % 5) - (inRow - 1) / 2) * 72, y: oneTop + row * rowGap });
  }
  return items;
}

export function buildAddRound(round: number, levelIndex: number): AddRound {
  const li = clampLevel(levelIndex);
  const level = ADD_LEVELS[li];
  const rand = rng(round + 503 + li * 7919);
  const pick: Pick = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));

  const [a, b] = level.make(pick);
  const sum = a + b;

  const items = [...(level.strategy === 'all' ? placeGroup(a, 'a', LEFT_X, level.bundles) : []), ...placeGroup(b, 'b', RIGHT_X, level.bundles)];

  const near = level.distractors === 'tens' ? [sum - 10, sum + 10, sum - 1, sum + 1] : [sum - 2, sum - 1, sum + 1, sum + 2];
  const candidates = near.filter((n) => n >= 2 && n <= 100 && n !== sum);
  const others: number[] = [];
  while (others.length < 2 && candidates.length > 0) {
    others.push(candidates.splice(Math.floor(rand() * candidates.length), 1)[0]);
  }
  const [petalA, petalB] = PETAL_PAIRS[Math.floor(rand() * PETAL_PAIRS.length)];

  return { a, b, sum, levelIndex: li, level, items, choices: [sum, ...others].sort((x, y) => x - y), petalA, petalB };
}

/** The order the bee tours after a wrong pick: tens first (tíz, húsz …), then the ones. */
export function tourOrder(r: AddRound): AddItem[] {
  return [...r.items.filter((i) => i.kind === 'ten'), ...r.items.filter((i) => i.kind === 'one')];
}

/** Running total the bee says after visiting these items (counting on starts at the basket). */
export function runningTotal(r: AddRound, visited: AddItem[]): number {
  const start = r.level.strategy === 'on' ? r.a : 0;
  return start + visited.reduce((s, i) => s + i.value, 0);
}

export interface AddFeedback {
  text: string;
  speech: string;
  mood: Mood;
  tone: Tone;
}

export function questionFeedback(r: AddRound): AddFeedback {
  if (r.level.strategy === 'on') {
    return {
      text: `A kosárban ${r.a} virág van, mellette még ${r.b}. Hány virág van összesen?`,
      speech: `A kosárban ${numberAttr(r.a)} virág van, mellette még ${numberCount(r.b)}. Hány virág van összesen?`,
      mood: 'smile',
      tone: 'plain'
    };
  }
  return {
    text: `${r.a} virág meg ${r.b} virág. Hány virág van összesen?`,
    speech: `${capitalize(numberAttr(r.a))} virág meg ${numberAttr(r.b)} virág. Hány virág van összesen?`,
    mood: 'smile',
    tone: 'plain'
  };
}

/** "Három meg kettő, az öt." */
export function sumSentence(a: number, b: number): string {
  const s = numberCount(a + b);
  return `${capitalize(numberCount(a))} meg ${numberCount(b)}, ${article(s)} ${s}.`;
}

export function rightFeedback(r: AddRound, offer: Offer = null): AddFeedback {
  const base = { mood: 'cheer' as const, tone: 'good' as const };
  if (offer === 'up') {
    return {
      ...base,
      text: `Igen! ${r.a} + ${r.b} = ${r.sum}. Öt jó válasz egymás után! Jöhet a nehezebb, vagy maradunk még?`,
      speech: `Igen! ${sumSentence(r.a, r.b)} Öt jó válasz egymás után! Jöhet a nehezebb, vagy maradunk még?`
    };
  }
  if (offer === 'down') {
    return {
      ...base,
      mood: 'smile',
      text: `Igen! ${r.a} + ${r.b} = ${r.sum}. Ez most nehéz volt. Próbáljunk egy kicsit könnyebbet?`,
      speech: `Igen! ${sumSentence(r.a, r.b)} Ez most nehéz volt. Próbáljunk egy kicsit könnyebbet?`
    };
  }
  return {
    ...base,
    text: `Igen! ${r.a} + ${r.b} = ${r.sum}. Ügyes vagy!`,
    speech: `Igen! ${sumSentence(r.a, r.b)} Ügyes vagy!`
  };
}

/** A wrong pick: the bee visits everything and counts out loud; never a "wrong" word. */
export function tourFeedback(r: AddRound): AddFeedback {
  if (r.level.strategy === 'on') {
    return {
      text: `Hoppá! Kezdjük a kosárnál: ${r.a}, és számoljunk tovább!`,
      speech: `Hoppá! Kezdjük a kosárnál: ${numberCount(r.a)}, és számoljunk tovább!`,
      mood: 'oops',
      tone: 'oops'
    };
  }
  if (r.level.bundles && r.sum > 10) {
    return {
      text: 'Hoppá! Számoljunk együtt: előbb a csokrokat tízesével, aztán a többit.',
      speech: 'Hoppá! Számoljunk együtt: előbb a csokrokat tízesével, aztán a többit.',
      mood: 'oops',
      tone: 'oops'
    };
  }
  return { text: 'Hoppá! Számoljuk meg együtt a méhecskével!', speech: 'Hoppá! Számoljuk meg együtt a méhecskével!', mood: 'oops', tone: 'oops' };
}

export function addLockedSpeech(learned: number): string {
  const left = Math.max(1, UNLOCK_ADD_AFTER - learned);
  return `Ez a kertrész még alszik. Ismerj meg még ${numberAttr(left)} számot a Számvetésben, és kinyílik!`;
}

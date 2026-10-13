import { article, capitalize, numberAttr, numberCount } from '../../lib/numbers';
import type { Mood, Tone } from '../../lib/types';
import { rng } from '../flash/layout';

// Méhecske: addition from "3 + 2" up to "38 + 25", plus taking away up to ten. Two groups, "a + b = ?", the child picks the total.
// The first levels are hands-on and digit-free: the child taps flowers so the bee carries them into one bed
// (gather) or off to the hive (take), and answers with dot cards; the digit appears only after the right answer.
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
  /**
   * all: count everything. on: the first group is a basket with its number, count on from it.
   * gather: the child taps the second group over into the first bed before answering.
   * take: subtraction; the child taps b of the a flowers and the bee carries them to the hive.
   */
  strategy: 'all' | 'on' | 'gather' | 'take';
  /** Answer cards: dots only (no digits on screen until solved), dots with the digit, or the digit alone. */
  answers: 'dots' | 'both' | 'digits';
  /** Draw tens as bouquets. */
  bundles: boolean;
  /** Wrong answers offered: near misses by one (and two), or by one and by ten. */
  distractors: 'small' | 'tens';
  make: (pick: Pick) => [number, number];
}

export const ADD_LEVELS: AddLevel[] = [
  {
    name: 'Gyűjtés 5-ig',
    strategy: 'gather',
    answers: 'dots',
    bundles: false,
    distractors: 'small',
    make: (pick) => {
      const b = pick(1, 4);
      return [pick(1, 5 - b), b];
    }
  },
  {
    name: 'Elvétel 5-ig',
    strategy: 'take',
    answers: 'dots',
    bundles: false,
    distractors: 'small',
    make: (pick) => {
      const a = pick(2, 5);
      return [a, pick(1, a - 1)];
    }
  },
  {
    name: '5-ig',
    strategy: 'all',
    answers: 'both',
    bundles: false,
    distractors: 'small',
    make: (pick) => {
      const b = pick(1, 4);
      return [pick(1, 5 - b), b];
    }
  },
  {
    name: '10-ig, gyűjtéssel',
    strategy: 'gather',
    answers: 'digits',
    bundles: false,
    distractors: 'small',
    make: (pick) => {
      const b = pick(1, 5);
      return [pick(1, 10 - b), b];
    }
  },
  {
    name: 'Elvétel 10-ig',
    strategy: 'take',
    answers: 'digits',
    bundles: false,
    distractors: 'small',
    make: (pick) => {
      const a = pick(4, 10);
      return [a, pick(1, Math.min(5, a - 1))];
    }
  },
  {
    name: '10-ig, továbbszámolással',
    strategy: 'on',
    answers: 'digits',
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
    answers: 'digits',
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
    answers: 'digits',
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
    answers: 'digits',
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
    answers: 'digits',
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
    answers: 'digits',
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

/** Bumped when levels are inserted; saved progress from an older ladder is migrated with migrateAddLevel. */
export const ADD_LEVELS_VERSION = 2;

/** A level index saved before the gather and take levels existed, mapped onto today's ladder. */
export function migrateAddLevel(oldLevel: number): number {
  const l = Math.max(0, Math.floor(oldLevel));
  return clampLevel(l < 2 ? l + 2 : l + 3);
}

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
  /** a + b, or a − b on a take level. */
  answer: number;
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

export interface Slot {
  kind: 'ten' | 'one';
  x: number;
  y: number;
}

/** Bouquets in a row on top, loose flowers in rows of five below, centred in the group box. */
export function groupSlots(n: number, boxX: number, bundles: boolean): Slot[] {
  const tens = bundles ? Math.floor(n / 10) : 0;
  const ones = n - tens * 10;
  const oneRows = Math.ceil(ones / 5);
  const rows = (tens > 0 ? 1 : 0) + oneRows;
  const rowGap = rows >= 3 ? 80 : 100;
  const top = SCENE_H / 2 - ((rows - 1) * rowGap) / 2;
  const cx = boxX + BOX_W / 2;
  const slots: Slot[] = [];

  for (let i = 0; i < tens; i++) slots.push({ kind: 'ten', x: cx + (i - (tens - 1) / 2) * 72, y: top });
  const oneTop = top + (tens > 0 ? rowGap : 0);
  for (let i = 0; i < ones; i++) {
    const row = Math.floor(i / 5);
    const inRow = Math.min(5, ones - row * 5);
    slots.push({ kind: 'one', x: cx + ((i % 5) - (inRow - 1) / 2) * 72, y: oneTop + row * rowGap });
  }
  return slots;
}

function placeGroup(n: number, group: 'a' | 'b', boxX: number, bundles: boolean): AddItem[] {
  let t = 0;
  let o = 0;
  return groupSlots(n, boxX, bundles).map((s) =>
    s.kind === 'ten' ? { id: `${group}t${t++}`, group, value: 10, ...s } : { id: `${group}o${o++}`, group, value: 1, ...s }
  );
}

/** Gather levels: where the flowers of the first bed stand once `moved` of the second group have joined it. */
export function gatheredSlots(r: AddRound, moved: number): Slot[] {
  return groupSlots(r.a + moved, LEFT_X, false);
}

export function buildAddRound(round: number, levelIndex: number): AddRound {
  const li = clampLevel(levelIndex);
  const level = ADD_LEVELS[li];
  const rand = rng(round + 503 + li * 7919);
  const pick: Pick = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));

  const [a, b] = level.make(pick);
  const take = level.strategy === 'take';
  const answer = take ? a - b : a + b;

  const items = take
    ? placeGroup(a, 'a', LEFT_X, false)
    : [...(level.strategy === 'on' ? [] : placeGroup(a, 'a', LEFT_X, level.bundles)), ...placeGroup(b, 'b', RIGHT_X, level.bundles)];

  const near = level.distractors === 'tens' ? [answer - 10, answer + 10, answer - 1, answer + 1] : [answer - 2, answer - 1, answer + 1, answer + 2];
  const lowest = take ? 1 : 2;
  const candidates = near.filter((n) => n >= lowest && n <= 100 && n !== answer);
  const others: number[] = [];
  while (others.length < 2 && candidates.length > 0) {
    others.push(candidates.splice(Math.floor(rand() * candidates.length), 1)[0]);
  }
  const [petalA, petalB] = PETAL_PAIRS[Math.floor(rand() * PETAL_PAIRS.length)];

  return { a, b, answer, levelIndex: li, level, items, choices: [answer, ...others].sort((x, y) => x - y), petalA, petalB };
}

/** Gather and take levels: the child moves b flowers first, and only then are the answers shown. */
export function needsMoves(r: AddRound): boolean {
  return r.level.strategy === 'gather' || r.level.strategy === 'take';
}

/**
 * The order the bee tours after a wrong pick: tens first (tíz, húsz …), then the ones.
 * `gone` are flowers the bee already carried to the hive; they are not counted.
 */
export function tourOrder(r: AddRound, gone: string[] = []): AddItem[] {
  const left = r.items.filter((i) => !gone.includes(i.id));
  return [...left.filter((i) => i.kind === 'ten'), ...left.filter((i) => i.kind === 'one')];
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

/** "kettőt" in "elvisz kettőt", 1–10. */
const ACCUSATIVE = ['', 'egyet', 'kettőt', 'hármat', 'négyet', 'ötöt', 'hatot', 'hetet', 'nyolcat', 'kilencet', 'tízet'];

/** Dot-card levels keep digits off the screen: the bubble shows the spoken words. */
function words(r: AddRound, fb: AddFeedback): AddFeedback {
  return r.level.answers === 'dots' ? { ...fb, text: fb.speech } : fb;
}

/** `moved` = flowers already carried over (gather) or away (take). */
export function questionFeedback(r: AddRound, moved = 0): AddFeedback {
  const plain = { mood: 'smile' as const, tone: 'plain' as const };
  if (r.level.strategy === 'gather') {
    if (moved === 0) {
      const ask = r.b === 1 ? 'Koppints rá, és a méhecske átviszi!' : 'Koppints rájuk, és a méhecske átviszi őket!';
      return words(r, {
        ...plain,
        text: `Itt ${r.a} virág nyílik, ott még ${r.b}. ${ask}`,
        speech: `Itt ${numberAttr(r.a)} virág nyílik, ott még ${numberCount(r.b)}. ${ask}`
      });
    }
    if (moved < r.b) return words(r, { ...plain, text: `Még ${r.b - moved} virág vár.`, speech: `Még ${numberAttr(r.b - moved)} virág vár.` });
    return { ...plain, text: 'Most mind együtt vannak. Hány virág van összesen?', speech: 'Most mind együtt vannak. Hány virág van összesen?' };
  }
  if (r.level.strategy === 'take') {
    if (moved === 0) {
      return words(r, {
        ...plain,
        text: `${r.a} virág nyílik. A méhecske elvisz ${r.b} virágot a kaptárba. Koppints ${r.b} virágra!`,
        speech: `${capitalize(numberAttr(r.a))} virág nyílik. A méhecske elvisz ${ACCUSATIVE[r.b]} a kaptárba. Koppints ${numberAttr(r.b)} virágra!`
      });
    }
    if (moved < r.b) {
      return words(r, { ...plain, text: `Még ${r.b - moved} virágot vigyen el!`, speech: `Még ${numberAttr(r.b - moved)} virágot vigyen el!` });
    }
    return { ...plain, text: 'Hány virág maradt?', speech: 'Hány virág maradt?' };
  }
  if (r.level.strategy === 'on') {
    return {
      text: `A kosárban ${r.a} virág van, mellette még ${r.b}. Hány virág van összesen?`,
      speech: `A kosárban ${numberAttr(r.a)} virág van, mellette még ${numberCount(r.b)}. Hány virág van összesen?`,
      mood: 'smile',
      tone: 'plain'
    };
  }
  return words(r, {
    text: `${r.a} virág meg ${r.b} virág. Hány virág van összesen?`,
    speech: `${capitalize(numberAttr(r.a))} virág meg ${numberAttr(r.b)} virág. Hány virág van összesen?`,
    mood: 'smile',
    tone: 'plain'
  });
}

/** "Három meg kettő, az öt." */
export function sumSentence(a: number, b: number): string {
  const s = numberCount(a + b);
  return `${capitalize(numberCount(a))} meg ${numberCount(b)}, ${article(s)} ${s}.`;
}

/** "Öt virágból kettőt elvitt a méhecske, maradt három." */
export function takeSentence(a: number, b: number): string {
  return `${capitalize(numberAttr(a))} virágból ${ACCUSATIVE[b]} elvitt a méhecske, maradt ${numberCount(a - b)}.`;
}

export function rightFeedback(r: AddRound, offer: Offer = null): AddFeedback {
  const base = { mood: 'cheer' as const, tone: 'good' as const };
  const eq = `${r.a} ${r.level.strategy === 'take' ? '−' : '+'} ${r.b} = ${r.answer}`;
  const said = r.level.strategy === 'take' ? takeSentence(r.a, r.b) : sumSentence(r.a, r.b);
  if (offer === 'up') {
    return words(r, {
      ...base,
      text: `Igen! ${eq}. Öt jó válasz egymás után! Jöhet a nehezebb, vagy maradunk még?`,
      speech: `Igen! ${said} Öt jó válasz egymás után! Jöhet a nehezebb, vagy maradunk még?`
    });
  }
  if (offer === 'down') {
    return words(r, {
      ...base,
      mood: 'smile',
      text: `Igen! ${eq}. Ez most nehéz volt. Próbáljunk egy kicsit könnyebbet?`,
      speech: `Igen! ${said} Ez most nehéz volt. Próbáljunk egy kicsit könnyebbet?`
    });
  }
  return words(r, { ...base, text: `Igen! ${eq}. Ügyes vagy!`, speech: `Igen! ${said} Ügyes vagy!` });
}

/** A wrong pick: the bee visits everything and counts out loud; never a "wrong" word. */
export function tourFeedback(r: AddRound): AddFeedback {
  if (r.level.strategy === 'take') {
    return { text: 'Hoppá! Számoljuk meg együtt, hány virág maradt!', speech: 'Hoppá! Számoljuk meg együtt, hány virág maradt!', mood: 'oops', tone: 'oops' };
  }
  if (r.level.strategy === 'on') {
    return {
      text: `Hoppá! Kezdjük a kosárnál: ${r.a}, és számoljunk tovább!`,
      speech: `Hoppá! Kezdjük a kosárnál: ${numberCount(r.a)}, és számoljunk tovább!`,
      mood: 'oops',
      tone: 'oops'
    };
  }
  if (r.level.bundles && r.answer > 10) {
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

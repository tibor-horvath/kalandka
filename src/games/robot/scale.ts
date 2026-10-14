import { numberCount } from '../../lib/numbers';
import type { Mood, Tone } from '../../lib/types';
import { rng } from '../flash/layout';

// Mérleg: a balance scale with weights on its two pans.
// First the beam is held level and the child says which side will go down (later: or are they the same);
// then the child puts weights on the right pan until the beam levels out, first with ones, then with
// twos as well; last, a weight is missing or hidden in a crate, and the child picks how much it weighs.
// Nothing fails: a wrong pick has Csavar count the two sides, or the scale shows what that weight would do.

/** A single weight is 1, the wide one is 2. */
export type Weight = 1 | 2;
export type Side = 'left' | 'right' | 'equal';

export interface ScaleLevel {
  /** Shown to parents. */
  name: string;
  /** compare: say which side is heavier; balance: add weights until level; choose: pick the missing or hidden weight. */
  mode: 'compare' | 'balance' | 'choose';
  /** Tasks in one round (one bolt per round). */
  tasks: number;
  /** Compare: "the same" is one of the answers. */
  equal?: boolean;
  /** Balance: the twos are on the tray (and on the left pan). */
  twos?: boolean;
  /** Choose: the unknown weight is in a closed crate on the left (otherwise a gap on the right). */
  secret?: boolean;
  /** The heavier side's total. */
  range: [number, number];
}

export const SCALE_ROUNDS_PER_LEVEL = 5;

/**
 * Seven levels: which side is heavier, up to 5 (4+); heavier or the same, up to 8; make it level up to 7
 * and up to 10 (5+); with twos (6+); the missing weight; the weight of the closed crate (7).
 */
export const SCALE_LEVELS: ScaleLevel[] = [
  { name: 'Melyik a nehezebb?', mode: 'compare', tasks: 3, range: [3, 5] },
  { name: 'Nehezebb vagy egyforma?', mode: 'compare', tasks: 3, equal: true, range: [2, 8] },
  { name: 'Tedd egyensúlyba!', mode: 'balance', tasks: 2, range: [3, 7] },
  { name: 'Egyensúly tízig', mode: 'balance', tasks: 2, range: [6, 10] },
  { name: 'Kettes súlyok', mode: 'balance', tasks: 2, twos: true, range: [5, 10] },
  { name: 'Hiányzó súly', mode: 'choose', tasks: 3, range: [4, 10] },
  { name: 'Titkos doboz', mode: 'choose', tasks: 3, secret: true, range: [4, 10] }
];

/** Five solved rounds per level, then the next level. */
export function scaleLevelIndex(solved: number): number {
  return Math.min(SCALE_LEVELS.length - 1, Math.floor(Math.max(0, solved) / SCALE_ROUNDS_PER_LEVEL));
}

export interface CompareTask {
  kind: 'compare';
  left: Weight[];
  right: Weight[];
  answer: Side;
}

export interface BalanceTask {
  kind: 'balance';
  left: Weight[];
  /** Weights already on the right pan at the start (the child may take them off too). */
  right: Weight[];
  /** What the tray offers. */
  tray: Weight[];
}

export interface ChooseTask {
  kind: 'choose';
  /** The known weights on each pan; the unknown one stands beside them on the `unknown` side. */
  left: Weight[];
  right: Weight[];
  unknown: 'left' | 'right';
  /** It is in a closed crate (otherwise a dashed gap). */
  secret: boolean;
  answer: number;
  /** Three answers, ascending, one of them right. */
  choices: number[];
}

export type ScaleTask = CompareTask | BalanceTask | ChooseTask;

export interface ScaleRound {
  level: ScaleLevel;
  tasks: ScaleTask[];
}

/** Most weights one pan holds: three rows of five. */
export const PAN_SLOTS = 15;
/** The right pan takes up to this much in the balancing tasks. */
export const BALANCE_MAX = 12;

export function total(ws: Weight[]): number {
  return ws.reduce((s, w) => s + w, 0);
}

/** Which side goes down. */
export function heavier(left: number, right: number): Side {
  return left === right ? 'equal' : left > right ? 'left' : 'right';
}

/** The beam's angle in degrees, clockwise (right side down) positive: more difference, more tilt, up to a stop. */
export const MAX_TILT = 14;
export function tilt(left: number, right: number): number {
  const d = right - left;
  return d === 0 ? 0 : Math.sign(d) * Math.min(MAX_TILT, 5 + 3 * Math.abs(d));
}

/** The totals of a choose task with `x` as the unknown weight (null: not placed yet). */
export function chooseTotals(t: ChooseTask, x: number | null): { left: number; right: number } {
  const add = x ?? 0;
  return {
    left: total(t.left) + (t.unknown === 'left' ? add : 0),
    right: total(t.right) + (t.unknown === 'right' ? add : 0)
  };
}

const ones = (n: number): Weight[] => Array.from({ length: n }, () => 1 as Weight);

function int(rand: () => number, min: number, max: number): number {
  return min + (Math.floor(rand() * (max - min + 1)) % (max - min + 1));
}

/** Three answers around the right one, ascending, never below 1. */
function choicesFor(answer: number, rand: () => number): number[] {
  const near = [answer - 2, answer - 1, answer + 1, answer + 2].filter((n) => n >= 1);
  const picked = new Set([answer]);
  while (picked.size < 3) picked.add(near[Math.floor(rand() * near.length) % near.length]);
  return [...picked].sort((a, b) => a - b);
}

function compareTask(level: ScaleLevel, same: boolean, rand: () => number): CompareTask {
  const [min, max] = level.range;
  const big = int(rand, min, max);
  // Without "the same", the sides differ by two or more, so counting settles it at a glance;
  // with it, the near ones (one apart) come in too.
  const small = same ? big : int(rand, 1, big - (level.equal ? 1 : 2));
  const leftHeavy = rand() < 0.5;
  const [l, r] = leftHeavy ? [big, small] : [small, big];
  return { kind: 'compare', left: ones(l), right: ones(r), answer: heavier(l, r) };
}

/** A mix of twos and ones adding up to n, with at least one two; twos first, as they stand on the pan. */
function withTwos(n: number, rand: () => number): Weight[] {
  const twos = int(rand, 1, Math.floor(n / 2));
  return [...Array.from({ length: twos }, () => 2 as Weight), ...ones(n - 2 * twos)];
}

function balanceTask(level: ScaleLevel, rand: () => number): BalanceTask {
  const [min, max] = level.range;
  const n = int(rand, min, max);
  if (level.twos) return { kind: 'balance', left: withTwos(n, rand), right: [], tray: [1, 2] };
  return { kind: 'balance', left: ones(n), right: ones(int(rand, 0, Math.min(3, n - 2))), tray: [1] };
}

function chooseTask(level: ScaleLevel, rand: () => number): ChooseTask {
  const [min, max] = level.range;
  const n = int(rand, min, max);
  // The unknown weight is 1–5 (a crate 2–6), so the answer stays one countable block.
  const answer = level.secret ? int(rand, 2, Math.min(6, n)) : int(rand, 1, Math.min(5, n - 1));
  const rest = n - answer;
  if (level.secret) {
    return { kind: 'choose', left: ones(rest), right: ones(n), unknown: 'left', secret: true, answer, choices: choicesFor(answer, rand) };
  }
  return { kind: 'choose', left: ones(n), right: ones(rest), unknown: 'right', secret: false, answer, choices: choicesFor(answer, rand) };
}

/** The same round every time for a level and round number. */
export function buildScaleRound(levelIndex: number, round: number): ScaleRound {
  const level = SCALE_LEVELS[Math.max(0, Math.min(SCALE_LEVELS.length - 1, levelIndex))];
  const rand = rng(round * 37 + levelIndex * 1009 + 11);
  // With "the same" among the answers, one task of each round is level.
  const sameAt = level.equal ? int(rand, 0, level.tasks - 1) : -1;
  const tasks = Array.from({ length: level.tasks }, (_, i): ScaleTask => {
    if (level.mode === 'compare') return compareTask(level, i === sameAt, rand);
    if (level.mode === 'balance') return balanceTask(level, rand);
    return chooseTask(level, rand);
  });
  return { level, tasks };
}

/**
 * Where each weight stands on a pan: slots in rows of five from the bottom, a two takes two slots
 * side by side and never breaks across a row.
 */
export function panSlots(ws: Weight[]): { col: number; row: number; w: Weight }[] {
  const out: { col: number; row: number; w: Weight }[] = [];
  let col = 0;
  let row = 0;
  for (const w of ws) {
    if (col + w > 5) {
      col = 0;
      row++;
    }
    out.push({ col, row, w });
    col += w;
  }
  return out;
}

// ---------- Csavar's lines ----------

export interface ScaleFeedback {
  text: string;
  speech: string;
  mood: Mood;
  tone: Tone;
}

const SIDE_NAME = { left: 'bal', right: 'jobb' } as const;
const say = (text: string, speech = text, mood: Mood = 'smile', tone: Tone = 'plain'): ScaleFeedback => ({ text, speech, mood, tone });

export function startFeedback(level: ScaleLevel, task: ScaleTask): ScaleFeedback {
  if (task.kind === 'compare') {
    if (level.equal) return say('Melyik oldal nehezebb? Vagy egyformák?', 'Melyik oldal nehezebb? Vagy egyforma a kettő? Számold meg a súlyokat, aztán koppints!');
    return say('Melyik oldal nehezebb? Koppints rá!', 'Fogom a mérleget. Melyik oldala megy le, ha elengedem? Számold meg a súlyokat, és koppints a nehezebb oldalra!');
  }
  if (task.kind === 'balance') {
    if (level.twos) return say('A széles súly kettőt ér! Tedd egyensúlyba a mérleget!', 'Nézd, a széles súly kettőt ér, mint két kicsi együtt! Tegyél súlyokat a jobb oldalra, hogy egyensúlyban legyen a mérleg!');
    return say('Tegyél súlyokat a jobb oldalra, hogy egyensúlyban legyen!', 'Tegyél súlyokat a jobb oldalra, amíg a mérleg egyensúlyba nem kerül! Ha túl sok lesz, a Levesz gombbal leveszek egyet.');
  }
  if (task.secret) return say('A mérleg egyensúlyban van. Mennyit nyom a titkos doboz?', 'Nézd, a mérleg egyensúlyban van. Vajon mennyit nyom a titkos doboz? Válassz egy számot!');
  return say('Melyik súly hiányzik, hogy egyensúlyban legyen?', 'A jobb oldalról hiányzik egy súly. Mennyi kell, hogy a mérleg egyensúlyban legyen? Válassz egy számot!');
}

/** A compare answer that was not right: count both sides together, then ask again; after that the right answer lights up. */
export function compareMissFeedback(t: CompareTask): ScaleFeedback {
  const l = total(t.left);
  const r = total(t.right);
  const counted = l === r ? `Mindkét oldalon ${numberCount(l)} súly van.` : `A bal oldalon ${numberCount(l)} súly van, a jobb oldalon ${numberCount(r)}.`;
  const ask = l === r ? 'Akkor nehezebb valamelyik?' : 'Melyik a több?';
  return say('Hoppá! Számoljuk meg együtt!', `Hoppá! Számoljuk meg együtt! ${counted} ${ask}`, 'oops', 'oops');
}

export function compareRightFeedback(t: CompareTask): ScaleFeedback {
  if (t.answer === 'equal') return say('Úgy van! Egyformák, a mérleg egyensúlyban van!', undefined, 'cheer', 'good');
  const n = total(t.answer === 'left' ? t.left : t.right);
  const text = `Úgy van! A ${SIDE_NAME[t.answer]} oldal nehezebb.`;
  return say(text, `${text} Ott ${numberCount(n)} súly van.`, 'cheer', 'good');
}

export function balanceFeedback(left: number, right: number, twos: boolean): ScaleFeedback | null {
  if (right > left) return say('Hoppá, most a jobb oldal nehezebb! Vegyél le egy súlyt!', 'Hoppá, most a jobb oldal lett nehezebb! Nyomd meg a Levesz gombot!', 'oops', 'oops');
  if (right === left) {
    const both = twos ? `Mindkét oldal súlya ${numberCount(left)}.` : `Mindkét oldalon ${numberCount(left)} súly van.`;
    return say(`Egyensúlyban! Mindkét oldal ${left}.`, `Egyensúlyban van! ${both}`, 'cheer', 'good');
  }
  return null;
}

export const FULL_FEEDBACK = say('Ennél több nem fér a tányérra.', 'Ennél több nem fér a tányérra. Vegyél le egyet!', 'think');

/** A choose answer that does not balance: say which way it tipped; from the second miss, count what is still needed. */
export function chooseMissFeedback(t: ChooseTask, x: number, misses: number): ScaleFeedback {
  const { left, right } = chooseTotals(t, x);
  const heavy = heavier(left, right);
  const what = t.secret ? 'a doboz' : 'ez a súly';
  const tipped = heavy === 'left' ? 'a bal oldal' : 'a jobb oldal';
  if (misses >= 2) {
    const known = total(t.unknown === 'left' ? t.left : t.right);
    const other = total(t.unknown === 'left' ? t.right : t.left);
    const here = known ? `csak ${numberCount(known)}` : 'még semmi';
    return say(
      `Számoljuk meg! Itt ${known}, ott ${other}. Mennyi kell még?`,
      `Számoljuk meg! Az egyik oldalon ${numberCount(other)} súly van, a másikon ${here}. Mennyi kell még, hogy egyforma legyen?`,
      'think',
      'oops'
    );
  }
  const amount = heavy === t.unknown ? 'sok' : 'kevés';
  return say(`Hoppá! Ha ${what} ${x} lenne, ${tipped} lenne nehezebb. Ez ${amount}.`, undefined, 'oops', 'oops');
}

/** Misses on a compare or choose task before the right answer lights up. */
export const SHOW_ANSWER_AFTER = 3;

export function chooseRightFeedback(t: ChooseTask): ScaleFeedback {
  const known = total(t.unknown === 'left' ? t.left : t.right);
  const other = total(t.unknown === 'left' ? t.right : t.left);
  const sum = known ? `${t.answer} + ${known} = ${other}` : `${t.answer} = ${other}`;
  const head = t.secret ? `Ez az! A doboz súlya ${t.answer}.` : 'Ez az! Egyensúlyban van!';
  const spoken = known ? `${numberCount(t.answer)} meg ${numberCount(known)} az ${numberCount(other)}.` : '';
  return say(`${head} ${sum}`, `${head} ${spoken}`.trim(), 'cheer', 'good');
}

export function solvedFeedback(): ScaleFeedback {
  return say('Ügyes vagy! Mindent kimértél!', 'Ügyes vagy! Mindent pontosan kimértél!', 'cheer', 'good');
}

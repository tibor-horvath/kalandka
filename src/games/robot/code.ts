import type { Mood, Tone } from '../../lib/types';
import { capitalize, numberCount } from '../../lib/numbers';
import { rng } from '../flash/layout';
import { COLORS, COLOR_NAMES, type Color } from './sort';

// Kódzár: a crate shut with a code lock. The lock shows the code in signs and the child presses the
// keypad to fill its slots in order. First the lamps are copied (for 5-year-olds), then a code key
// says what each lamp means, then dice dots stand for numerals, then a picture message is turned into
// lamps for Kutyabot (the key read backwards), and last one row of the key is covered and has to be
// worked out from a note. Nothing fails: a wrong button sits in the slot a moment and pops back out,
// Csavar says what to look at, and after a second miss the right button lights up.

/** The workshop pictures a lamp can stand for, each with its own outline. */
export type Pic = 'gear' | 'battery' | 'spanner' | 'magnet';
export const PICS: Pic[] = ['gear', 'battery', 'spanner', 'magnet'];

export type Sign = { kind: 'lamp'; color: Color } | { kind: 'pic'; pic: Pic } | { kind: 'dots'; n: number } | { kind: 'digit'; n: number };

export type CodeKind = 'copy' | 'long' | 'key' | 'newkey' | 'dots' | 'send' | 'missing';

export interface CodeLevel {
  /** Shown to parents. */
  name: string;
  kind: CodeKind;
  /** Tasks in one round. */
  tasks: number;
}

export const CODE_ROUNDS_PER_LEVEL = 5;

/**
 * Seven levels: copying two lamps (5), longer codes, a code key, a key mixed up every task (6), dice
 * dots, sending a message (6–7), and the covered key row (7).
 */
export const CODE_LEVELS: CodeLevel[] = [
  { name: 'Színzár', kind: 'copy', tasks: 3 },
  { name: 'Hosszabb zár', kind: 'long', tasks: 3 },
  { name: 'Kódtábla', kind: 'key', tasks: 3 },
  { name: 'Új kódtábla', kind: 'newkey', tasks: 3 },
  { name: 'Pöttykód', kind: 'dots', tasks: 3 },
  { name: 'Üzenet', kind: 'send', tasks: 3 },
  { name: 'Hiányzó jel', kind: 'missing', tasks: 2 }
];

/** One row of the code key: a sign and what it means. */
export interface KeyRow {
  sign: Sign;
  meaning: Sign;
}

export interface CodeTask {
  /** What the lock (or the transmitter) shows, in order. */
  code: Sign[];
  /** What goes in each slot, in order. */
  answer: Sign[];
  /** The keypad buttons, each sign once. */
  keypad: Sign[];
  /** The code key, sign → meaning; empty when the code is copied. */
  key: KeyRow[];
  /** Hiányzó jel: the covered key row, the note that gives it away, and the cards to pick its meaning from. */
  hidden?: { row: number; note: KeyRow[]; choices: Sign[] };
}

export interface CodeRound {
  level: CodeLevel;
  tasks: CodeTask[];
}

export const lamp = (color: Color): Sign => ({ kind: 'lamp', color });
export const pic = (p: Pic): Sign => ({ kind: 'pic', pic: p });

export function sameSign(a: Sign, b: Sign): boolean {
  if (a.kind === 'lamp' && b.kind === 'lamp') return a.color === b.color;
  if (a.kind === 'pic' && b.kind === 'pic') return a.pic === b.pic;
  if ((a.kind === 'dots' && b.kind === 'dots') || (a.kind === 'digit' && b.kind === 'digit')) return a.n === b.n;
  return false;
}

/** The key row whose sign this is (decoding), or −1. */
export function rowOfSign(key: KeyRow[], s: Sign): number {
  return key.findIndex((r) => sameSign(r.sign, s));
}

/** The key row whose meaning this is (sending a message: the key read backwards), or −1. */
export function rowOfMeaning(key: KeyRow[], s: Sign): number {
  return key.findIndex((r) => sameSign(r.meaning, s));
}

/** The key row the child has to read for a slot: by its sign, or by its meaning when sending. */
export function rowFor(task: CodeTask, slot: number, kind: CodeKind): number {
  return kind === 'send' ? rowOfMeaning(task.key, task.code[slot]) : rowOfSign(task.key, task.code[slot]);
}

// ---------- building rounds ----------

function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const pickOne = <T>(items: T[], rand: () => number): T => items[Math.floor(rand() * items.length)];

/** `n` colours: two lamps are always different; longer codes may repeat, but never all one colour. */
function colorCode(n: number, rand: () => number): Color[] {
  if (n === 2) return shuffle(COLORS, rand).slice(0, 2);
  for (;;) {
    const out = Array.from({ length: n }, () => pickOne(COLORS, rand));
    if (new Set(out).size > 1) return out;
  }
}

/** Three lamps, each standing for a different picture; the rows stand in colour order, so only the pictures move. */
function lampKey(rand: () => number): KeyRow[] {
  const pics = shuffle(PICS, rand);
  return COLORS.map((c, i) => ({ sign: lamp(c), meaning: pic(pics[i]) }));
}

const decode = (key: KeyRow[], code: Sign[]) => code.map((s) => key[rowOfSign(key, s)].meaning);

function copyTask(n: number, rand: () => number): CodeTask {
  const code = colorCode(n, rand).map(lamp);
  return { code, answer: code, keypad: shuffle(COLORS, rand).map(lamp), key: [] };
}

/** Lamps on the lock, pictures on the keypad. `extra` adds the picture no lamp stands for, as a fourth button. */
function keyTask(key: KeyRow[], n: number, extra: boolean, rand: () => number): CodeTask {
  const code = colorCode(n, rand).map(lamp);
  const used = key.map((r) => r.meaning);
  const spare = PICS.filter((p) => !used.some((u) => sameSign(u, pic(p)))).map(pic);
  return { code, answer: decode(key, code), keypad: shuffle(extra ? [...used, ...spare] : used, rand), key };
}

/** Dice faces to numerals: the numerals in the code, and their neighbours as the other buttons. */
function dotsTask(n: number, rand: () => number): CodeTask {
  const nums = shuffle([1, 2, 3, 4, 5, 6], rand).slice(0, n);
  const pad = new Set(nums);
  // Nearest neighbours first (±1), further out only when the code sits at the end of 1–6.
  for (let far = 1; pad.size < 4; far++) {
    for (const x of shuffle([-far, far], rand).flatMap((d) => nums.map((v) => v + d))) {
      if (pad.size < 4 && x >= 1 && x <= 6) pad.add(x);
    }
  }
  const digits = [...pad].sort((a, b) => a - b);
  return {
    code: nums.map((x): Sign => ({ kind: 'dots', n: x })),
    answer: nums.map((x): Sign => ({ kind: 'digit', n: x })),
    keypad: shuffle(digits, rand).map((x): Sign => ({ kind: 'digit', n: x })),
    key: digits.map((x) => ({ sign: { kind: 'dots', n: x }, meaning: { kind: 'digit', n: x } }))
  };
}

/** A picture message to turn into lamps: the key read from the meaning back to its sign. */
function sendTask(key: KeyRow[], n: number, rand: () => number): CodeTask {
  const lamps = colorCode(n, rand).map(lamp);
  return { code: decode(key, lamps), answer: lamps, keypad: shuffle(COLORS, rand).map(lamp), key };
}

/**
 * One key row covered. The note shows two different lamps, the covered one among them, with what they
 * mean; the cards are its meaning, another row's meaning and the picture no lamp stands for.
 */
function missingTask(key: KeyRow[], rand: () => number): CodeTask {
  const row = Math.floor(rand() * key.length);
  const other = pickOne(
    key.map((_, i) => i).filter((i) => i !== row),
    rand
  );
  const note = shuffle([key[row], key[other]], rand);
  const third = key.findIndex((_, i) => i !== row && i !== other);
  const spare = PICS.find((p) => !key.some((r) => sameSign(r.meaning, pic(p))))!;
  // The code holds the covered lamp at least once.
  let code: Sign[];
  do code = colorCode(3, rand).map(lamp);
  while (!code.some((s) => sameSign(s, key[row].sign)));
  return {
    code,
    answer: decode(key, code),
    keypad: shuffle(key.map((r) => r.meaning), rand),
    key,
    hidden: { row, note, choices: shuffle([key[row].meaning, key[third].meaning, pic(spare)], rand) }
  };
}

function buildTask(level: CodeLevel, round: number, t: number, key: KeyRow[], rand: () => number): CodeTask {
  // Codes start short and grow through the round.
  const short = t === 0;
  switch (level.kind) {
    case 'copy':
      return copyTask(2, rand);
    case 'long':
      return copyTask(3 + ((round + t) % 2), rand);
    case 'key':
      return keyTask(key, short ? 2 : 3, false, rand);
    case 'newkey':
      return keyTask(lampKey(rand), 3 + ((round + t) % 2), true, rand);
    case 'dots':
      return dotsTask(short ? 2 : 3, rand);
    case 'send':
      return sendTask(key, short ? 2 : 3, rand);
    case 'missing':
      return missingTask(key, rand);
  }
}

const sameCode = (a: Sign[], b: Sign[]) => a.length === b.length && a.every((s, i) => sameSign(s, b[i]));

/** The same round every time for a level and round number. */
export function buildCodeRound(levelIndex: number, round: number): CodeRound {
  const level = CODE_LEVELS[Math.max(0, Math.min(CODE_LEVELS.length - 1, levelIndex))];
  const rand = rng(round * 37 + levelIndex * 983 + 5);
  // Kódtábla, Üzenet and Hiányzó jel keep one key for the round; Új kódtábla mixes it up every task.
  const key = lampKey(rand);
  const tasks: CodeTask[] = [];
  for (let t = 0; t < level.tasks; t++) {
    let task = buildTask(level, round, t, key, rand);
    while (tasks.length && sameCode(task.code, tasks[tasks.length - 1].code)) task = buildTask(level, round, t, key, rand);
    tasks.push(task);
  }
  return { level, tasks };
}

// ---------- naming ----------

export const PIC_NAMES: Record<Pic, string> = { gear: 'fogaskerék', battery: 'elem', spanner: 'villáskulcs', magnet: 'mágnes' };
const DIGIT_NAMES = ['nullás', 'egyes', 'kettes', 'hármas', 'négyes', 'ötös', 'hatos'];
const ORDINALS = ['első', 'második', 'harmadik', 'negyedik'];

/** "piros lámpa", "fogaskerék", "három pötty", "hármas". */
export function signName(s: Sign): string {
  switch (s.kind) {
    case 'lamp':
      return `${COLOR_NAMES[s.color]} lámpa`;
    case 'pic':
      return PIC_NAMES[s.pic];
    case 'dots':
      return `${numberCount(s.n)} pötty`;
    case 'digit':
      return DIGIT_NAMES[s.n];
  }
}

/** "a piros lámpa", "az elem", "a hármas". */
export function theSign(s: Sign): string {
  const name = signName(s);
  return `${/^[aáeéiíoóöőuúüű]/i.test(name) ? 'az' : 'a'} ${name}`;
}

/** What a key row says: "A piros lámpa: fogaskerék." */
export function keyRowSpeech(r: KeyRow): string {
  return `${capitalize(theSign(r.sign))}: ${signName(r.meaning)}.`;
}

// ---------- Csavar's lines ----------

export interface CodeFeedback {
  text: string;
  speech: string;
  mood: Mood;
  tone: Tone;
}

const plain = (text: string, speech = text): CodeFeedback => ({ text, speech, mood: 'smile', tone: 'plain' });
const oops = (text: string, speech = text): CodeFeedback => ({ text, speech, mood: 'oops', tone: 'oops' });

export function startFeedback(level: CodeLevel, task: CodeTask, first: boolean): CodeFeedback {
  const hello = first ? 'Ezt a ládát egy kódzár őrzi. ' : '';
  switch (level.kind) {
    case 'copy':
    case 'long':
      return plain('Nyomd meg ugyanezeket a színeket!', `${hello}Nyomd meg ugyanezeket a színeket, sorban, balról jobbra!`);
    case 'key':
    case 'newkey':
      return plain(
        `Mit jelent ${theSign(task.code[0])}? Nézd meg a kódtáblán!`,
        `${hello}${level.kind === 'newkey' ? 'Új kódtábla! ' : ''}A kódtáblán látod, mit jelent a lámpa. Melyik képet kell megnyomni?`
      );
    case 'dots':
      return plain('Hány pötty? Nyomd meg a számát!', 'Számold meg a pöttyöket, és nyomd meg a számát!');
    case 'send':
      return plain(
        `Küldjük el Kutyabotnak! Melyik lámpa jelenti ${theSignAcc(task.code[0])}?`,
        'Küldjünk üzenetet Kutyabotnak! Keresd meg a képet a kódtáblán, és nyomd meg a lámpát mellette!'
      );
    case 'missing': {
      const covered = task.hidden ? theSign(task.key[task.hidden.row].sign) : '';
      return plain(`Mit jelent ${covered}? Nézd meg a cetlit!`, `Valaki letakarta a kódtábla egyik sorát! Mit jelent ${covered}? A cetlin megtalálod.`);
    }
  }
}

const PIC_ACC: Record<Pic, string> = { gear: 'a fogaskereket', battery: 'az elemet', spanner: 'a villáskulcsot', magnet: 'a mágnest' };

/** The sign as an object: "a piros lámpát", "a mágnest", "az elemet". */
export function theSignAcc(s: Sign): string {
  if (s.kind === 'pic') return PIC_ACC[s.pic];
  if (s.kind === 'lamp') return `a ${COLOR_NAMES[s.color]} lámpát`;
  return theSign(s);
}

/** Tapping a sign on the lock, a button or a picture: Csavar says what it is. */
export function tapFeedback(s: Sign): CodeFeedback {
  if (s.kind === 'dots') return plain(`Ezen ${numberCount(s.n)} pötty van.`);
  return plain(`Ez ${theSign(s)}.`);
}

/** Tapping a key row. */
export function keyRowFeedback(r: KeyRow | null): CodeFeedback {
  return r ? plain(keyRowSpeech(r)) : plain('Ez a sor le van takarva. Nézd meg a cetlit!');
}

/** A right button: Csavar names what went in, so the child hears the code being read. */
export function slotFeedback(s: Sign): CodeFeedback {
  const text = `${capitalize(signName(s))}!`;
  return { text, speech: text, mood: 'cheer', tone: 'good' };
}

/** Misses on one slot before the right button lights up. */
export const SHOW_ANSWER_AFTER = 2;
/** Misses on the covered row before the right card lights up. */
export const SHOW_HIDDEN_AFTER = 2;

/** A wrong button: Csavar says what to look at for this slot. */
export function wrongFeedback(level: CodeLevel, task: CodeTask, slot: number): CodeFeedback {
  const sign = task.code[slot];
  const which = ORDINALS[slot] ?? 'következő';
  switch (level.kind) {
    case 'copy':
    case 'long':
      return oops(`Hoppá! Nézd meg ${which === 'első' ? 'az' : 'a'} ${which} lámpát!`);
    case 'dots': {
      const n = sign.kind === 'dots' ? sign.n : 0;
      const counted = Array.from({ length: n }, (_, i) => numberCount(i + 1)).join(', ');
      return oops('Hoppá! Számoljuk meg a pöttyöket!', `Hoppá! Számoljuk meg együtt: ${counted}.`);
    }
    case 'send':
      return oops(`Hoppá! Keresd meg ${theSignAcc(sign)} a kódtáblán! Melyik lámpa áll mellette?`);
    default:
      return oops(`Hoppá! Keresd meg ${theSignAcc(sign)} a kódtáblán!`);
  }
}

/** "Mutasd!": where to look for this slot. */
export function showFeedback(level: CodeLevel, task: CodeTask, slot: number): CodeFeedback {
  const sign = task.code[slot];
  const want = task.answer[slot];
  if (level.kind === 'copy' || level.kind === 'long') return plain(`Ide ${theSign(want)} kell.`);
  if (level.kind === 'send') return plain(`Nézd: ${theSign(want)} jelenti ${theSignAcc(sign)}.`);
  return plain(`Nézd: ${theSign(sign)} mellett ${theSign(want)} van.`);
}

/** Hiányzó jel: a card picked for the covered row. */
export function hiddenWrongFeedback(task: CodeTask, picked: Sign): CodeFeedback {
  const owner = rowOfMeaning(task.key, picked);
  const covered = task.hidden ? theSign(task.key[task.hidden.row].sign) : '';
  if (owner >= 0) return oops(`Hoppá! ${capitalize(theSign(picked))} már ${theSign(task.key[owner].sign)} jele. Nézd meg a cetlit!`);
  return oops(`Hoppá! Nézd meg a cetlin, mi áll ${covered} alatt!`);
}

/** Tapping the note (or "Mutasd!" before the covered row is found): Csavar reads it. */
export function noteFeedback(task: CodeTask): CodeFeedback {
  return plain(`A cetlin ez áll: ${(task.hidden?.note ?? []).map((r) => keyRowSpeech(r)).join(' ')}`);
}

export function hiddenFoundFeedback(task: CodeTask): CodeFeedback {
  const row = task.hidden ? task.key[task.hidden.row] : task.key[0];
  const text = `Megvan! ${keyRowSpeech(row)} Most nyisd ki a zárat!`;
  return { text, speech: text, mood: 'cheer', tone: 'good' };
}

const OPENED = ['Kinyílt!', 'Ez az, kinyílt!', 'Kinyílt! Ügyes!', 'Pontosan, kinyílt!'];

/** The last slot filled: the crate opens (or the message goes). */
export function openFeedback(level: CodeLevel, task: CodeTask, n: number): CodeFeedback {
  if (level.kind === 'send') {
    const text = `Elküldve! Kutyabot hozza ${theSignAcc(task.code[0])}.`;
    return { text, speech: text, mood: 'cheer', tone: 'good' };
  }
  const text = OPENED[n % OPENED.length];
  return { text, speech: text, mood: 'cheer', tone: 'good' };
}

export function solvedFeedback(level: CodeLevel): CodeFeedback {
  const text = level.kind === 'send' ? 'Ügyes vagy! Kutyabot minden üzenetet megkapott!' : 'Ügyes vagy! Minden ládát kinyitottál!';
  return { text, speech: text, mood: 'cheer', tone: 'good' };
}

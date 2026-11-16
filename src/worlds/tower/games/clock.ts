import { rng } from '../../../lib/rng';
import { digital, dialHour, nextHour, timeWords, type ClockTime } from '../../../lib/time';
import { numberAttr, numberCount } from '../../../lib/numbers';
import { SHOW_AFTER, say, seedOf, shuffle, type Say } from './common';
import { capital } from './activities';

// The three clock games: Óraállító (set the hands), Hány óra? (read the dial) and Digitóra (match the dial
// to a digital display). Each climbs the same steps: whole hours with only the short hand, both hands,
// half hours, quarters, then five minutes; Digitóra ends with the afternoon's 24-hour reading.

export type ClockStep = 'hourOnly' | 'whole' | 'half' | 'quarter' | 'five' | 'afternoon';

export interface ClockLevel {
  name: string;
  step: ClockStep;
}

/** The minutes each step asks for. */
const MINUTES: Record<ClockStep, number[]> = {
  hourOnly: [0],
  whole: [0],
  half: [30],
  quarter: [15, 45],
  five: [5, 10, 20, 25, 35, 40, 50, 55],
  afternoon: [0]
};

export const SET_LEVELS: ClockLevel[] = [
  { name: 'Csak a kis mutató', step: 'hourOnly' },
  { name: 'Két mutató', step: 'whole' },
  { name: 'Fél órák', step: 'half' },
  { name: 'Negyedek', step: 'quarter' },
  { name: 'Öt percek', step: 'five' }
];

export const READ_LEVELS: ClockLevel[] = [
  { name: 'Csak a kis mutató', step: 'hourOnly' },
  { name: 'Egész órák', step: 'whole' },
  { name: 'Fél órák', step: 'half' },
  { name: 'Negyedek', step: 'quarter' },
  { name: 'Öt percek', step: 'five' }
];

export const DIGI_LEVELS: ClockLevel[] = [
  { name: 'Egész órák', step: 'whole' },
  { name: 'Fél órák', step: 'half' },
  { name: 'Negyedek', step: 'quarter' },
  { name: 'Öt percek', step: 'five' },
  { name: 'Délután', step: 'afternoon' }
];

const clampLevel = (levels: ClockLevel[], level: number) => levels[Math.max(0, Math.min(levels.length - 1, level))];

/** A time for this step. The afternoon asks 1 … 8 o'clock (13:00 … 20:00), when a child is awake. */
export function timeFor(step: ClockStep, rand: () => number): ClockTime {
  const minutes = MINUTES[step];
  const h = step === 'afternoon' ? 1 + Math.floor(rand() * 8) : 1 + Math.floor(rand() * 12);
  return { h, m: minutes[Math.floor(rand() * minutes.length)] };
}

/** Times a child easily mixes up with `t` on this step: the hour left instead of the one coming, the hands swapped, the other quarter. */
function nearMisses(t: ClockTime, step: ClockStep): ClockTime[] {
  const prev = dialHour(t.h - 1);
  const next = nextHour(t.h);
  switch (step) {
    case 'hourOnly':
    case 'whole':
    case 'afternoon':
      return [{ h: next, m: 0 }, { h: prev, m: 0 }, ...(t.h !== 12 && step === 'whole' ? [{ h: 12, m: 0 }] : [])];
    case 'half':
      return [{ h: prev, m: 30 }, { h: 6, m: 0 }, { h: next, m: 30 }];
    case 'quarter':
      return [{ h: prev, m: t.m }, { h: t.h, m: 60 - t.m }, { h: dialHour(t.m / 5), m: 0 }];
    case 'five':
      // First and always offered: the number the long hand points at, read as minutes (3:20 as "három óra négy perc").
      return [numberAsMinutes(t), { h: prev, m: t.m }, { h: t.h, m: 60 - t.m }, { h: next, m: t.m }];
  }
}

/** The five-minute mix-up: the long hand's number taken for the minutes. */
export function numberAsMinutes(t: ClockTime): ClockTime {
  return { h: t.h, m: t.m / 5 };
}

const same = (a: ClockTime, b: ClockTime) => dialHour(a.h) === dialHour(b.h) && a.m === b.m;

/** Two different near misses of `t`. On the five-minute step the number-as-minutes card is always one of them. */
function distractors(t: ClockTime, step: ClockStep, rand: () => number): ClockTime[] {
  const out: ClockTime[] = [];
  const misses = nearMisses(t, step);
  const order = step === 'five' ? [misses[0], ...shuffle(misses.slice(1), rand)] : shuffle(misses, rand);
  for (const c of order) {
    if (!same(c, t) && !out.some((o) => same(o, c))) out.push(c);
    if (out.length === 2) break;
  }
  return out;
}

// ---------- Óraállító ----------

export interface SetRound {
  level: ClockLevel;
  target: ClockTime;
  /** Where the hands stand at the start, never on the answer. */
  start: ClockTime;
}

export function buildSetRound(level: number, round: number): SetRound {
  const l = clampLevel(SET_LEVELS, level);
  const rand = rng(seedOf(3, level, round));
  const target = timeFor(l.step, rand);
  let startHour = dialHour(target.h + 3 + Math.floor(rand() * 6));
  if (startHour === target.h) startHour = nextHour(startHour);
  return { level: l, target, start: { h: startHour, m: 0 } };
}

/** Whether the hands the child set show the target: the hour hand on its hour (it leans on with the minutes by itself), the minute hand on its minute. */
export function setRight(r: SetRound, hour: number, minute: number): boolean {
  return dialHour(hour) === dialHour(r.target.h) && (r.level.step === 'hourOnly' || minute === r.target.m);
}

export function setStart(r: SetRound): Say {
  const words = timeWords(r.target);
  if (r.level.step === 'hourOnly') return say(`${capital(words)} van. Húzd a kis mutatót a ${numberSuffix(r.target.h)}!`);
  if (r.level.step === 'whole') return say(`${capital(words)} van. A nagy mutató a tizenkettesen, a kis mutató a ${numberSuffix(r.target.h)}. Állítsd be!`);
  return say(`Állítsd be: ${words}!`);
}

/** What is wrong with the hands, one thing at a time: the minutes first, as a grown-up reads a clock. */
export function setWrong(r: SetRound, hour: number, minute: number, misses: number): Say {
  const t = r.target;
  const show = misses >= SHOW_AFTER;
  if (r.level.step !== 'hourOnly' && minute !== t.m) {
    const at = t.m === 0 ? 12 : t.m / 5;
    return say(`Hoppá! Nézd a nagy mutatót: ${show ? `a ${numberSuffix(at)} kell állnia.` : t.m === 0 ? 'egész órakor felfelé néz.' : `${numberCount(t.m)} perc kell.`}`, 'think', 'oops');
  }
  if (t.m === 0) return say(`Hoppá! A kis mutató most a ${numberSuffix(dialHour(hour))} mutat. ${show ? `A ${numberSuffix(t.h)} kell.` : 'Keresd meg a jó számot!'}`, 'think', 'oops');
  const left = dialHour(t.h);
  return say(
    `Hoppá! ${t.m === 30 ? 'Fél' : t.m === 15 ? 'Negyed' : t.m === 45 ? 'Háromnegyed' : 'Ilyenkor'} ${t.m === 30 || t.m === 15 || t.m === 45 ? `${numberCount(nextHour(left))}kor` : ''} a kis mutató már elhagyta a ${numberSuffix(left, 'elhagyta')}, ${show ? `a ${numberSuffix(nextHour(left), 'fele')} tart.` : 'és a következő felé tart.'}`.replace(/\s+/g, ' '),
    'think',
    'oops'
  );
}

export function setSolved(r: SetRound): Say {
  return say(`Kakukk! Pontosan ${timeWords(r.target)}.`, 'cheer', 'good');
}

// ---------- Hány óra? ----------

export interface ReadRound {
  level: ClockLevel;
  time: ClockTime;
  /** The cards, in words; `answer` is the right one's index. */
  choices: string[];
  answer: number;
}

export function buildReadRound(level: number, round: number): ReadRound {
  const l = clampLevel(READ_LEVELS, level);
  const rand = rng(seedOf(4, level, round));
  const time = timeFor(l.step, rand);
  const cards = shuffle([time, ...distractors(time, l.step, rand)], rand);
  return { level: l, time, choices: cards.map(timeWords), answer: cards.findIndex((c) => same(c, time)) };
}

export function readStart(r: ReadRound): Say {
  return say(r.level.step === 'hourOnly' ? 'Hova mutat a kis mutató? Hány óra van?' : 'Hány óra van?');
}

export function readWrong(r: ReadRound, wrong: number, misses: number): Say {
  const t = r.time;
  const show = misses >= SHOW_AFTER;
  if (show) return say(`Hoppá! ${capital(timeWords(t))} van. Nézd, világít.`, 'think', 'oops');
  if (t.m === 0) return say(`Hoppá! Nézd a kis mutatót: melyik számra mutat?`, 'think', 'oops');
  const said = r.choices[wrong];
  if (said === timeWords(numberAsMinutes(t))) return say(fiveHint(t), 'think', 'oops');
  if (said.endsWith(' óra') && t.m === 30) return say('Hoppá! A hosszú mutató a percet mutatja. Nézd a rövidet!', 'think', 'oops');
  if (t.m === 30 || t.m === 15 || t.m === 45) {
    return say(`Hoppá! Nézd a kis mutatót: már elhagyta a ${numberSuffix(t.h, 'elhagyta')}, és a ${numberSuffix(nextHour(t.h), 'fele')} tart.`, 'think', 'oops');
  }
  return say(`Hoppá! Nézd meg a nagy mutatót: hányasra mutat? Egy szám öt perc.`, 'think', 'oops');
}

export function readSolved(r: ReadRound): Say {
  return say(`Kakukk! ${capital(timeWords(r.time))}.`, 'cheer', 'good');
}

// ---------- Digitóra ----------

export interface DigiRound {
  level: ClockLevel;
  time: ClockTime;
  /** The digital readings on the cards; `answer` is the right one's index. */
  choices: string[];
  answer: number;
}

export function buildDigiRound(level: number, round: number): DigiRound {
  const l = clampLevel(DIGI_LEVELS, level);
  const rand = rng(seedOf(5, level, round));
  const time = timeFor(l.step, rand);
  const pm = l.step === 'afternoon';
  if (pm) {
    // Délután: the 24-hour reading, against the morning reading (the twelve not added) and an hour off.
    const right = digital(time, true);
    const off = rand() < 0.5 ? `${time.h + 11}:00` : `${time.h + 13}:00`;
    const cards = shuffle([right, digital(time), off], rand);
    return { level: l, time, choices: cards, answer: cards.indexOf(right) };
  }
  const cards = shuffle([time, ...distractors(time, l.step, rand)], rand);
  return { level: l, time, choices: cards.map((c) => digital(c)), answer: cards.findIndex((c) => same(c, time)) };
}

export function digiStart(r: DigiRound): Say {
  if (r.level.step === 'afternoon') return say(`Délután ${timeWords(r.time)} van. Hogyan mutatja ezt a digitális óra?`);
  return say(`${capital(timeWords(r.time))} van. Melyik kijelző mutatja ugyanezt?`);
}

export function digiWrong(r: DigiRound, wrong: number, misses: number): Say {
  const t = r.time;
  if (misses >= SHOW_AFTER) return say(`Hoppá! ${capital(timeWords(t))}: ${r.choices[r.answer]}. Nézd, világít.`, 'think', 'oops');
  if (r.level.step === 'afternoon' && r.choices[wrong] === digital(t)) {
    return say(`Hoppá! ${digital(t)} ${dialHour(t.h) <= 5 ? 'éjjel van, akkor alszunk' : 'reggel van'}. Délben tizenkét óra van, délután innen számolunk tovább: egy óra az tizenhárom.`, 'think', 'oops');
  }
  if (r.level.step === 'afternoon') return say('Hoppá! Délben tizenkét óra van, délután innen számolunk tovább: egy óra az tizenhárom.', 'think', 'oops');
  const [hh, mm] = r.choices[wrong].split(':').map(Number);
  if (r.level.step === 'five' && hh === dialHour(t.h) && mm === t.m / 5) return say(fiveHint(t), 'think', 'oops');
  if (mm !== t.m) return say(`Hoppá! A kettőspont után a percek állnak. Most ${t.m === 0 ? 'nulla' : numberCount(t.m)} perc van.`, 'think', 'oops');
  if (hh === nextHour(t.h)) return say(`Hoppá! ${capital(timeWords(t))}: a ${numberCount(nextHour(t.h))} felé tartunk, de még ${numberCount(dialHour(t.h))} óra múlt.`, 'think', 'oops');
  return say('Hoppá! Nézd meg a kis mutatót: hány óra múlt?', 'think', 'oops');
}

export function digiSolved(r: DigiRound): Say {
  return say(`Kakukk! ${capital(timeWords(r.time))}: ${r.choices[r.answer]}.`, 'cheer', 'good');
}

/** "A nagy mutató a négyesre mutat, de az nem négy perc …": the hint for the number-as-minutes card. */
function fiveHint(t: ClockTime): string {
  const n = t.m / 5;
  return `Hoppá! A nagy mutató a ${numberSuffix(n)} mutat, de az nem ${numberAttr(n)} perc: minden szám öt percet ér. Számolj ötösével!`;
}

// ---------- the numbers in sentences ----------

/**
 * A dial number with the case ending a sentence wants: "a hármasra" (onto), "a hármast" (left it), "a hármas felé".
 * The dial's numbers are named as the numerals' nouns: egyes, kettes, hármas … tizenkettes.
 */
const NUMERAL_NOUN = ['', 'egyes', 'kettes', 'hármas', 'négyes', 'ötös', 'hatos', 'hetes', 'nyolcas', 'kilences', 'tízes', 'tizenegyes', 'tizenkettes'];

export function numeralNoun(h: number): string {
  return NUMERAL_NOUN[dialHour(h)];
}

export function numberSuffix(h: number, kind: 'onto' | 'elhagyta' | 'fele' = 'onto'): string {
  const noun = numeralNoun(h);
  if (kind === 'elhagyta') return `${noun}t`;
  if (kind === 'fele') return `${noun} felé`;
  return `${noun}${/[aáoóuú][^aáeéiíoóöőuúüű]*$/.test(noun) ? 'ra' : 're'}`;
}

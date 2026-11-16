import { rng } from '../../../lib/rng';
import { ACTIVITIES, DAY, DAY_PARTS, capital, the, type ActivityId, type DayPart } from './activities';
import { SHOW_AFTER, praise, say, seedOf, shuffle, type Say } from './common';

// Napirend: the order of a day. First what comes next of two cards, then three and four cards to put in
// order, then which part of the day a picture belongs to, and last which of two things came first. No
// numbers and no clock: the way into the Óratorony for the youngest.

export interface DayLevel {
  name: string;
  mode: 'seq' | 'part' | 'before';
  /** seq: cards in the row, and how many stand there from the start. */
  slots?: number;
  given?: number;
}

export const DAY_LEVELS: DayLevel[] = [
  { name: 'Mi jön utána?', mode: 'seq', slots: 2, given: 1 },
  { name: 'Három kártya sorban', mode: 'seq', slots: 3, given: 1 },
  { name: 'Négy kártya sorban', mode: 'seq', slots: 4, given: 0 },
  { name: 'Napszakok', mode: 'part' },
  { name: 'Mi volt előbb?', mode: 'before' }
];

/** A row to put in order: `sequence` is the right order, the first `given` stand there already. */
export interface SeqRound {
  mode: 'seq';
  sequence: ActivityId[];
  given: number;
  /** The cards to place, in the order they lie (the "what comes next" level adds one that came earlier). */
  choices: ActivityId[];
}

export interface PartRound {
  mode: 'part';
  activity: ActivityId;
  answer: DayPart;
}

export interface BeforeRound {
  mode: 'before';
  /** The two cards as they lie, left and right. */
  pair: [ActivityId, ActivityId];
  answer: ActivityId;
}

export type DayRound = SeqRound | PartRound | BeforeRound;

/** Things with a clear part of the day, for Napszakok. */
const WITH_PART = DAY.filter((id) => ACTIVITIES[id].part);

export function buildDayRound(level: number, round: number): DayRound {
  const l = DAY_LEVELS[Math.max(0, Math.min(DAY_LEVELS.length - 1, level))];
  const rand = rng(seedOf(1, level, round));
  if (l.mode === 'part') {
    const activity = WITH_PART[Math.floor(rand() * WITH_PART.length)];
    return { mode: 'part', activity, answer: ACTIVITIES[activity].part! };
  }
  if (l.mode === 'before') {
    const [a, b] = shuffle(DAY, rand).slice(0, 2);
    const answer = ACTIVITIES[a].order! < ACTIVITIES[b].order! ? a : b;
    return { mode: 'before', pair: [a, b], answer };
  }
  const slots = l.slots!;
  const given = l.given!;
  // The first level adds one card that came before the shown one, so "next" means later, not any card.
  const extra = given === 1 && slots === 2 ? 1 : 0;
  const picked = shuffle(DAY, rand)
    .slice(0, slots + extra)
    .sort((a, b) => ACTIVITIES[a].order! - ACTIVITIES[b].order!);
  const sequence = picked.slice(extra);
  const choices = shuffle([...sequence.slice(given), ...picked.slice(0, extra)], rand);
  return { mode: 'seq', sequence, given, choices };
}

export function dayStart(r: DayRound): Say {
  if (r.mode === 'part') return say(`Mikor van ${the(r.activity)}? Reggel, délben, délután vagy este?`);
  if (r.mode === 'before') return say(`Mi volt előbb: ${the(r.pair[0])} vagy ${the(r.pair[1])}?`);
  if (r.given === 0) return say('Mi történik először? Tedd sorba a képeket!');
  const last = r.sequence[r.given - 1];
  return say(`${capital(the(last))} már megvolt. Mi jön utána?`);
}

/** A card placed in the row, the next one asked for. */
export function dayPlaced(r: SeqRound, placed: number, count: number): Say {
  return say(`${praise(count)} Mi jön ${the(r.sequence[placed - 1])} után?`, 'cheer', 'good');
}

/** A wrong card in the row: it came earlier, or later. */
export function dayWrongSeq(r: SeqRound, placed: number, wrong: ActivityId, misses: number): Say {
  const want = r.sequence[placed];
  const earlier = ACTIVITIES[wrong].order! < ACTIVITIES[want].order!;
  const before = placed > 0 ? r.sequence[placed - 1] : null;
  const why = earlier
    ? before && ACTIVITIES[wrong].order! < ACTIVITIES[before].order!
      ? `${capital(the(wrong))} már korábban volt.`
      : `${capital(the(wrong))} jó lesz, de nem most.`
    : `${capital(the(wrong))} később jön.`;
  const ask = placed === 0 ? 'Mi történik a legelőször?' : `Mi jön ${the(before!)} után?`;
  return say(`Hoppá! ${why} ${misses >= SHOW_AFTER ? `Nézd, ez világít: ${the(want)}.` : ask}`, 'think', 'oops');
}

const PART_WHEN: Record<DayPart, string> = { reggel: 'reggel', délben: 'délben', délután: 'délután', este: 'este' };

export function dayWrongPart(r: PartRound, wrong: DayPart, misses: number): Say {
  const hint = misses >= SHOW_AFTER ? `${capital(the(r.activity))} ${PART_WHEN[r.answer]} van.` : `Gondold végig a napodat: mikor szoktál ${verb(r.activity)}?`;
  return say(`Hoppá! ${capital(PART_WHEN[wrong])} nem ez van. ${hint}`, 'think', 'oops');
}

export function dayWrongBefore(r: BeforeRound, misses: number): Say {
  const later = r.pair[0] === r.answer ? r.pair[1] : r.pair[0];
  return say(
    `Hoppá! ${capital(the(later))} később van. ${misses >= SHOW_AFTER ? `${capital(the(r.answer))} volt előbb.` : 'Melyik volt korábban a napban?'}`,
    'think',
    'oops'
  );
}

export function daySolved(r: DayRound): Say {
  if (r.mode === 'part') return say(`Kakukk! ${capital(the(r.activity))} ${PART_WHEN[r.answer]} van.`, 'cheer', 'good');
  if (r.mode === 'before') return say(`Kakukk! ${capital(the(r.answer))} volt előbb.`, 'cheer', 'good');
  return say(`Kakukk! Sorban vannak: ${r.sequence.map((id) => ACTIVITIES[id].noun).join(', ')}.`, 'cheer', 'good');
}

/** "Mikor szoktál reggelizni?" */
function verb(id: ActivityId): string {
  const VERBS: Partial<Record<ActivityId, string>> = {
    wake: 'felkelni',
    kindergarten: 'oviba indulni',
    breakfast: 'reggelizni',
    lunch: 'ebédelni',
    playground: 'a játszótéren játszani',
    dinner: 'vacsorázni',
    bath: 'fürdeni'
  };
  return VERBS[id] ?? ACTIVITIES[id].noun;
}

export { DAY_PARTS };

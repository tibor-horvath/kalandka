import { rng } from '../../../lib/rng';
import { ACTIVITIES, SPANS, capital, the, type ActivityId, type Span } from './activities';
import { SHOW_AFTER, say, seedOf, shuffle, type Say } from './common';

// Homokóra: a feeling for how long things take. Which of two takes longer, which is shorter, then the longest and
// the shortest of three, and last whether something takes a moment, minutes or hours. No clock and no numbers, so
// the youngest can play it too.

export interface SandLevel {
  name: string;
  mode: 'longer' | 'shorter' | 'longest' | 'shortest' | 'span';
}

export const SAND_LEVELS: SandLevel[] = [
  { name: 'Melyik tart tovább?', mode: 'longer' },
  { name: 'Melyik rövidebb?', mode: 'shorter' },
  { name: 'Melyik a leghosszabb?', mode: 'longest' },
  { name: 'Melyik a legrövidebb?', mode: 'shortest' },
  { name: 'Pillanat, perc vagy óra?', mode: 'span' }
];

const ALL = Object.keys(ACTIVITIES) as ActivityId[];

export type SandRound =
  | { mode: 'longer' | 'shorter'; pair: [ActivityId, ActivityId]; answer: number }
  | { mode: 'longest' | 'shortest'; trio: [ActivityId, ActivityId, ActivityId]; answer: number }
  | { mode: 'span'; activity: ActivityId; answer: Span };

/** Two things whose lengths are far enough apart to tell at once: one at least ten times the other. */
function farApart(a: ActivityId, b: ActivityId): boolean {
  const [x, y] = [ACTIVITIES[a].seconds, ACTIVITIES[b].seconds].sort((p, q) => p - q);
  return y >= x * 10;
}

export function buildSandRound(level: number, round: number): SandRound {
  const l = SAND_LEVELS[Math.max(0, Math.min(SAND_LEVELS.length - 1, level))];
  const rand = rng(seedOf(7, level, round));
  if (l.mode === 'span') {
    const span = SPANS[Math.floor(rand() * SPANS.length)];
    const pool = ALL.filter((id) => ACTIVITIES[id].span === span);
    const activity = pool[Math.floor(rand() * pool.length)];
    return { mode: 'span', activity, answer: span };
  }
  if (l.mode === 'longest' || l.mode === 'shortest') {
    // One of each: a moment, a few minutes (two at most) and hours, so every two are far apart.
    const of = (ok: (id: ActivityId) => boolean) => {
      const pool = ALL.filter(ok);
      return pool[Math.floor(rand() * pool.length)];
    };
    const trio = shuffle(
      [of((id) => ACTIVITIES[id].span === 'pillanat'), of((id) => ACTIVITIES[id].span === 'perc' && ACTIVITIES[id].seconds <= 120), of((id) => ACTIVITIES[id].span === 'óra')],
      rand
    ) as [ActivityId, ActivityId, ActivityId];
    const secs = trio.map((id) => ACTIVITIES[id].seconds);
    const pick = l.mode === 'longest' ? Math.max(...secs) : Math.min(...secs);
    return { mode: l.mode, trio, answer: secs.indexOf(pick) };
  }
  const pairs: [ActivityId, ActivityId][] = [];
  for (const a of ALL) for (const b of ALL) if (a < b && farApart(a, b)) pairs.push([a, b]);
  const pair = shuffle(pairs[Math.floor(rand() * pairs.length)], rand) as [ActivityId, ActivityId];
  const longer = ACTIVITIES[pair[0]].seconds > ACTIVITIES[pair[1]].seconds ? 0 : 1;
  return { mode: l.mode === 'longer' ? 'longer' : 'shorter', pair, answer: l.mode === 'longer' ? longer : 1 - longer };
}

export const SPAN_WORDS: Record<Span, string> = { pillanat: 'egy pillanat', perc: 'néhány perc', óra: 'órákig tart' };

export function sandStart(r: SandRound): Say {
  if (r.mode === 'span') return say(`${capital(ACTIVITIES[r.activity].name)}: egy pillanat, néhány perc, vagy órákig tart?`);
  if ('trio' in r) {
    return say(`Melyik tart a ${r.mode === 'longest' ? 'leghosszabb' : 'legrövidebb'} ideig: ${the(r.trio[0])}, ${the(r.trio[1])} vagy ${the(r.trio[2])}?`);
  }
  const q = r.mode === 'longer' ? 'Melyik tart tovább' : 'Melyik rövidebb';
  return say(`${q}: ${the(r.pair[0])} vagy ${the(r.pair[1])}?`);
}

export function sandWrong(r: SandRound, misses: number): Say {
  const show = misses >= SHOW_AFTER;
  if (r.mode === 'span') {
    return say(`Hoppá! ${show ? `${capital(the(r.activity))}: ${SPAN_WORDS[r.answer]}.` : 'Játszd el! Meddig tart?'}`, 'think', 'oops');
  }
  if ('trio' in r) {
    const right = r.trio[r.answer];
    const most = r.mode === 'longest' ? 'tart a leghosszabb ideig' : 'a legrövidebb';
    return say(`Hoppá! ${show ? `${capital(the(right))} ${most}.` : 'Rakd őket sorba fejben: mi ér véget a leghamarabb, és mi tart a legtovább?'}`, 'think', 'oops');
  }
  const right = r.pair[r.answer];
  const hint = r.mode === 'longer' ? `${capital(the(right))} tart tovább.` : `${capital(the(right))} a rövidebb.`;
  return say(`Hoppá! ${show ? hint : 'Gondold végig: melyik ér hamarabb véget?'}`, 'think', 'oops');
}

export function sandSolved(r: SandRound): Say {
  if (r.mode === 'span') return say(`Kakukk! ${capital(the(r.activity))}: ${SPAN_WORDS[r.answer]}.`, 'cheer', 'good');
  if ('trio' in r) {
    return say(`Kakukk! ${capital(the(r.trio[r.answer]))} ${r.mode === 'longest' ? 'tart a leghosszabb ideig' : 'a legrövidebb'}.`, 'cheer', 'good');
  }
  const right = r.pair[r.answer];
  return say(`Kakukk! ${capital(the(right))} ${r.mode === 'longer' ? 'tart tovább' : 'a rövidebb'}.`, 'cheer', 'good');
}

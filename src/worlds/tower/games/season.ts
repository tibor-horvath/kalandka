import { rng } from '../../../lib/rng';
import { capital } from './activities';
import { SHOW_AFTER, say, seedOf, shuffle, type Say } from './common';

// Évszakok: the year and the week. Which season a tree shows, the seasons in their circle, the days of
// the week in a row, yesterday and tomorrow, the day after and the day before, and last which season a
// month belongs to. Still no clock: these come before telling the time.

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];
export const SEASON_NAMES: Record<Season, string> = { spring: 'tavasz', summer: 'nyár', autumn: 'ősz', winter: 'tél' };

export const WEEK = ['hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat', 'vasárnap'] as const;
export const MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'] as const;

/** The season a month (0 = január) belongs to. */
export function seasonOfMonth(m: number): Season {
  if (m === 11 || m <= 1) return 'winter';
  if (m <= 4) return 'spring';
  if (m <= 7) return 'summer';
  return 'autumn';
}

export interface SeasonLevel {
  name: string;
  mode: 'which' | 'cycle' | 'week' | 'near' | 'far' | 'month';
}

export const SEASON_LEVELS: SeasonLevel[] = [
  { name: 'Melyik évszak?', mode: 'which' },
  { name: 'Sorban jönnek', mode: 'cycle' },
  { name: 'A hét napjai', mode: 'week' },
  { name: 'Tegnap és holnap', mode: 'near' },
  { name: 'Holnapután', mode: 'far' },
  { name: 'Hónapok', mode: 'month' }
];

/** One question: the scene and the cards. Seasons and days are named by index into SEASONS or WEEK. */
export type SeasonRound =
  | { mode: 'which'; season: Season; choices: Season[] }
  | { mode: 'cycle'; row: Season[]; gap: number; choices: Season[] }
  | { mode: 'week'; gap: number; choices: number[] }
  | { mode: 'near' | 'far'; today: number; ask: 'before' | 'after'; answer: number; choices: number[] }
  | { mode: 'month'; month: number; choices: Season[] };

/** The right card, as an index into the round's choices. */
export function answerOf(r: SeasonRound): number {
  switch (r.mode) {
    case 'which':
      return r.choices.indexOf(r.season);
    case 'cycle':
      return r.choices.indexOf(r.row[r.gap]);
    case 'week':
      return r.choices.indexOf(r.gap);
    case 'near':
    case 'far':
      return r.choices.indexOf(r.answer);
    case 'month':
      return r.choices.indexOf(seasonOfMonth(r.month));
  }
}

const day = (d: number) => ((d % 7) + 7) % 7;

export function buildSeasonRound(level: number, round: number): SeasonRound {
  const l = SEASON_LEVELS[Math.max(0, Math.min(SEASON_LEVELS.length - 1, level))];
  const rand = rng(seedOf(2, level, round));
  const int = (n: number) => Math.floor(rand() * n);
  switch (l.mode) {
    case 'which': {
      const season = SEASONS[int(4)];
      return { mode: 'which', season, choices: [...SEASONS] };
    }
    case 'cycle': {
      const start = int(4);
      const row = [0, 1, 2, 3].map((i) => SEASONS[(start + i) % 4]);
      const gap = int(4);
      const others = shuffle(SEASONS.filter((s) => s !== row[gap]), rand).slice(0, 2);
      return { mode: 'cycle', row, gap, choices: shuffle([row[gap], ...others], rand) };
    }
    case 'week': {
      const gap = int(7);
      // The neighbours are the days most easily mixed up.
      const others = shuffle([day(gap - 1), day(gap + 1), day(gap + 2), day(gap - 2)], rand).slice(0, 2);
      return { mode: 'week', gap, choices: shuffle([gap, ...others], rand) };
    }
    case 'near':
    case 'far': {
      const today = int(7);
      const ask = rand() < 0.5 ? 'before' : 'after';
      const step = l.mode === 'near' ? 1 : 2;
      const answer = day(today + (ask === 'after' ? step : -step));
      const wrong = l.mode === 'near' ? [day(today - (ask === 'after' ? 1 : -1)), today] : [day(today + (ask === 'after' ? 1 : -1)), day(today - (ask === 'after' ? 2 : -2))];
      return { mode: l.mode, today, ask, answer, choices: shuffle([answer, ...wrong], rand) };
    }
    case 'month':
      return { mode: 'month', month: int(12), choices: [...SEASONS] };
  }
}

/** "Ma szerda van. Mi lesz holnap?" */
function nearQuestion(r: Extract<SeasonRound, { mode: 'near' | 'far' }>): string {
  const when = r.mode === 'near' ? (r.ask === 'after' ? 'holnap' : 'tegnap') : r.ask === 'after' ? 'holnapután' : 'tegnapelőtt';
  const verb = r.ask === 'after' ? 'lesz' : 'volt';
  return `Ma ${WEEK[r.today]} van. Mi ${verb} ${when}?`;
}

export function seasonStart(r: SeasonRound): Say {
  switch (r.mode) {
    case 'which':
      return say('Nézd meg a fát! Melyik évszak van?');
    case 'cycle':
      return say(`${r.gap === 0 ? 'Melyik évszak jön előbb?' : 'Melyik évszak hiányzik a sorból?'} Az évszakok körbe-körbe jönnek.`);
    case 'week':
      return say('Melyik nap hiányzik a hétből?');
    case 'near':
    case 'far':
      return say(nearQuestion(r));
    case 'month':
      return say(`Melyik évszakban van ${MONTHS[r.month]}?`);
  }
}

export function seasonSolved(r: SeasonRound): Say {
  switch (r.mode) {
    case 'which':
      return say(`Kakukk! Ez ${SEASON_NAMES[r.season]}.`, 'cheer', 'good');
    case 'cycle':
      return say(`Kakukk! ${capital(r.row.map((s) => SEASON_NAMES[s]).join(', '))}.`, 'cheer', 'good');
    case 'week':
      return say(`Kakukk! ${capital(WEEK.join(', '))}.`, 'cheer', 'good');
    case 'near':
    case 'far':
      return say(`Kakukk! ${capital(WEEK[r.answer])}.`, 'cheer', 'good');
    case 'month':
      return say(`Kakukk! ${capital(MONTHS[r.month])} ${SEASON_NAMES[seasonOfMonth(r.month)]}i hónap.`, 'cheer', 'good');
  }
}

/** A tree that shows its season: what to look at. */
const SEASON_LOOK: Record<Season, string> = {
  spring: 'virágzik a fa',
  summer: 'zöld a lomb és érik a gyümölcs',
  autumn: 'sárgul és hullik a levél',
  winter: 'kopasz a fa és havazik'
};

export function seasonWrong(r: SeasonRound, wrong: number, misses: number): Say {
  const show = misses >= SHOW_AFTER;
  switch (r.mode) {
    case 'which':
      return say(`Hoppá! ${show ? `Nézd: ${SEASON_LOOK[r.season]}. Ez ${SEASON_NAMES[r.season]}.` : 'Nézd meg jól a fát: virág, gyümölcs, sárga levél vagy hó?'}`, 'think', 'oops');
    case 'cycle': {
      const before = r.row[(r.gap + 3) % 4];
      return say(`Hoppá! ${show ? `${capital(SEASON_NAMES[before])} után ${SEASON_NAMES[r.row[r.gap]]} jön.` : `Mi jön ${SEASON_NAMES[before]} után?`}`, 'think', 'oops');
    }
    case 'week': {
      const before = day(r.gap - 1);
      return say(`Hoppá! ${show ? `${capital(WEEK[before])} után ${WEEK[r.gap]} jön.` : `Mondd végig a napokat: mi jön ${WEEK[before]} után?`}`, 'think', 'oops');
    }
    case 'near':
    case 'far': {
      const picked = r.choices[wrong];
      const hint = picked === r.today ? `${capital(WEEK[picked])} ma van.` : `${capital(WEEK[picked])} nem jó.`;
      return say(`Hoppá! ${hint} ${show ? `${capital(WEEK[r.answer])} a jó.` : 'Lépj a hét napjain egyesével!'}`, 'think', 'oops');
    }
    case 'month':
      return say(`Hoppá! ${show ? `${capital(MONTHS[r.month])} ${SEASON_NAMES[seasonOfMonth(r.month)]}.` : 'Gondold végig: hideg van akkor, vagy meleg?'}`, 'think', 'oops');
  }
}

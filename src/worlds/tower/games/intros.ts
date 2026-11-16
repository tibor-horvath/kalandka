import type { GameId } from '../../../state/games';
import type { ActivityId } from './activities';

// Szint-bemutató: before a level that brings a new idea, Kakukk shows it in a few slides ("1 óra = 60 perc,
// mi a fél óra?"). The child turns the slides with Tovább; nothing moves on its own. An intro shows by itself
// only the first time its idea comes up (in any game), and the "?" button in the top bar replays it any time.

/** What a slide shows. Clock times are on the 12-hour dial; `wedge` tints the dial between two angles. */
export type IntroArt =
  | { kind: 'clock'; h: number; m: number; hourOnly?: boolean; wedge?: [number, number]; glow?: number; digital?: string }
  | { kind: 'sleep'; from: [number, number]; to: [number, number] }
  | { kind: 'quarters' }
  | { kind: 'pics'; ids: ActivityId[] }
  | { kind: 'parts' }
  | { kind: 'seasons' }
  | { kind: 'chips'; items: string[]; mark?: Partial<Record<number, string>> };

export interface IntroSlide {
  title: string;
  /** Shown under the picture and read out by Kakukk. */
  text: string;
  art: IntroArt;
}

export interface LevelIntro {
  /** The idea's id: seen once, it no longer opens by itself in any game. */
  id: string;
  /** The "?" button's words in the top bar. */
  ask: string;
  slides: IntroSlide[];
}

const DAYS = ['hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat', 'vasárnap'];
const MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];

export const INTROS: Record<string, LevelIntro> = {
  hourHand: {
    id: 'hourHand',
    ask: 'Mi a kis mutató?',
    slides: [
      { title: 'A kis mutató az órát mutatja', text: 'Az óra rövid, vastag mutatója mutatja, hány óra van.', art: { kind: 'clock', h: 3, m: 0, hourOnly: true } },
      { title: 'Amerre néz, annyi óra van', text: 'Ha a kis mutató a 3-asra néz, akkor 3 óra van.', art: { kind: 'clock', h: 3, m: 0, hourOnly: true, glow: 3 } },
      { title: 'Próbáld ki!', text: 'Hová néz most a kis mutató? A 8-asra: 8 óra van.', art: { kind: 'clock', h: 8, m: 0, hourOnly: true, glow: 8 } }
    ]
  },
  whole: {
    id: 'whole',
    ask: 'Mi az egész óra?',
    slides: [
      { title: 'A nagy mutató a perceket mutatja', text: 'A hosszú mutató gyorsabban jár körbe: ő mutatja a perceket.', art: { kind: 'clock', h: 4, m: 0 } },
      { title: 'Egész óra', text: 'Ha a nagy mutató fent áll, a 12-esen, akkor egész óra van. Most pont 4 óra.', art: { kind: 'clock', h: 4, m: 0, glow: 12 } }
    ]
  },
  half: {
    id: 'half',
    ask: 'Mi a fél óra?',
    slides: [
      { title: 'Egy óra = 60 perc', text: 'Egy óra alatt a nagy mutató egyszer körbejár. Ez 60 perc.', art: { kind: 'clock', h: 2, m: 0, wedge: [0, 359.5] } },
      { title: 'Fél óra = 30 perc', text: 'Fél óra alatt a nagy mutató csak a kör feléig jut, le a 6-osig. Ez 30 perc.', art: { kind: 'clock', h: 2, m: 30, wedge: [0, 180], glow: 6 } },
      {
        title: 'Fél három',
        text: 'A kis mutató már a 2 és a 3 között jár. A fél mindig a következő órát mondja: ez fél három.',
        art: { kind: 'clock', h: 2, m: 30, wedge: [60, 90], glow: 3 }
      },
      { title: 'Próbáld ki!', text: 'A nagy mutató a 6-oson, a kis mutató a 3 és a 4 között. Ez fél négy!', art: { kind: 'clock', h: 3, m: 30 } }
    ]
  },
  quarter: {
    id: 'quarter',
    ask: 'Mi a negyed?',
    slides: [
      { title: 'Negyed, fél, háromnegyed', text: 'Ha a nagy mutató a 3-ason áll, negyed; ha a 6-oson, fél; ha a 9-esen, háromnegyed.', art: { kind: 'quarters' } },
      { title: 'Ez is a következő órát mondja', text: 'Negyed három: 2 óra 15 perc. Háromnegyed három: 2 óra 45 perc.', art: { kind: 'clock', h: 2, m: 45, wedge: [0, 270], glow: 9 } }
    ]
  },
  five: {
    id: 'five',
    ask: 'Mi az öt perc?',
    slides: [
      { title: 'Minden szám 5 perc', text: 'A nagy mutatónak minden szám öt percet ér: az 1-es 5 perc, a 2-es 10 perc, a 4-es 20 perc.', art: { kind: 'clock', h: 2, m: 20, wedge: [0, 120], glow: 4 } },
      { title: 'Számolj ötösével!', text: '5, 10, 15, 20. Most 2 óra 20 perc van.', art: { kind: 'clock', h: 2, m: 20, digital: '2:20' } }
    ]
  },
  digital: {
    id: 'digital',
    ask: 'Mi a digitális óra?',
    slides: [
      { title: 'A kettőspont előtt az óra', text: 'A digitális óra számokkal írja ki az időt. A kettőspont előtt az óra áll.', art: { kind: 'clock', h: 4, m: 0, digital: '4:00' } },
      { title: 'Utána a percek', text: 'A kettőspont után jönnek a percek. A 4:30 az fél öt.', art: { kind: 'clock', h: 4, m: 30, digital: '4:30' } }
    ]
  },
  afternoon: {
    id: 'afternoon',
    ask: 'Mi a 13 óra?',
    slides: [
      { title: 'Délben 12 óra', text: 'Délben a két mutató fent találkozik: 12 óra, 12:00.', art: { kind: 'clock', h: 12, m: 0, digital: '12:00' } },
      { title: 'Délután 1 óra = 13 óra', text: 'Délután tovább számolunk: 1 óra az 13:00, 2 óra az 14:00.', art: { kind: 'clock', h: 1, m: 0, digital: '13:00' } },
      { title: 'Adj hozzá 12-t!', text: 'Délután 3 óra: 3 meg 12, az 15. Ez 15:00.', art: { kind: 'clock', h: 3, m: 0, digital: '15:00' } }
    ]
  },
  sleepCount: {
    id: 'sleepCount',
    ask: 'Hogyan számolom?',
    slides: [
      { title: 'Elaludt, felébredt', text: 'Kakukk 8 órakor elaludt, és 11 órakor ébredt fel.', art: { kind: 'sleep', from: [8, 0], to: [11, 0] } },
      { title: 'Lépkedj a kis mutatóval!', text: '9, 10, 11: ez három lépés. Kakukk 3 órát aludt.', art: { kind: 'clock', h: 11, m: 0, hourOnly: true, wedge: [240, 330] } }
    ]
  },
  overTwelve: {
    id: 'overTwelve',
    ask: 'Mi jön a 12 után?',
    slides: [{ title: 'A 12 után újra 1 jön', text: 'Az óra körbe jár: a 12 után újra az 1 következik. 11-től 2-ig: 12, 1, 2. Ez 3 óra.', art: { kind: 'clock', h: 2, m: 0, hourOnly: true, wedge: [330, 420] } }]
  },
  sleepHalf: {
    id: 'sleepHalf',
    ask: 'Mi a másfél óra?',
    slides: [{ title: 'Másfél óra', text: 'Egy óra meg még egy fél óra: ez másfél óra, vagyis 90 perc.', art: { kind: 'sleep', from: [2, 0], to: [3, 30] } }]
  },
  woke: {
    id: 'woke',
    ask: 'Mikor ébredt?',
    slides: [{ title: 'Előre számolunk', text: 'Kakukk 9 órakor elaludt, és 2 órát aludt. Lépj kettőt: 10, 11. 11 órakor ébredt!', art: { kind: 'sleep', from: [9, 0], to: [11, 0] } }]
  },
  day: {
    id: 'day',
    ask: 'Mi a napirend?',
    slides: [{ title: 'A nap sorban jön', text: 'Reggel felkelünk, délben ebédelünk, délután játszunk, este lefekszünk.', art: { kind: 'pics', ids: ['wake', 'lunch', 'playground', 'sleep'] } }]
  },
  parts: {
    id: 'parts',
    ask: 'Mik a napszakok?',
    slides: [{ title: 'Négy napszak', text: 'Reggel, délben, délután, este. Mindegyikhez mást csinálunk.', art: { kind: 'parts' } }]
  },
  before: {
    id: 'before',
    ask: 'Mi volt előbb?',
    slides: [{ title: 'Előbb, aztán', text: 'Előbb reggelizünk, aztán ebédelünk. Ami előbb volt, az a sorban elöl áll.', art: { kind: 'pics', ids: ['breakfast', 'lunch'] } }]
  },
  seasons: {
    id: 'seasons',
    ask: 'Mik az évszakok?',
    slides: [{ title: 'Négy évszak', text: 'Tavasz, nyár, ősz, tél. Körbe-körbe jönnek: a tél után újra tavasz lesz.', art: { kind: 'seasons' } }]
  },
  week: {
    id: 'week',
    ask: 'Mik a hét napjai?',
    slides: [{ title: 'Hét nap egy hét', text: 'Hétfő, kedd, szerda, csütörtök, péntek, szombat, vasárnap. Aztán újra hétfő.', art: { kind: 'chips', items: DAYS } }]
  },
  near: {
    id: 'near',
    ask: 'Mi a tegnap és a holnap?',
    slides: [{ title: 'Tegnap, ma, holnap', text: 'Ha ma szerda van, tegnap kedd volt, holnap csütörtök lesz.', art: { kind: 'chips', items: DAYS, mark: { 1: 'tegnap', 2: 'ma', 3: 'holnap' } } }]
  },
  far: {
    id: 'far',
    ask: 'Mi a holnapután?',
    slides: [{ title: 'Holnapután', text: 'A holnap utáni nap a holnapután. Ha ma szerda, holnapután péntek.', art: { kind: 'chips', items: DAYS, mark: { 2: 'ma', 3: 'holnap', 4: 'holnapután' } } }]
  },
  month: {
    id: 'month',
    ask: 'Mik a hónapok?',
    slides: [{ title: 'Tizenkét hónap', text: 'Egy évben 12 hónap van, januártól decemberig.', art: { kind: 'chips', items: MONTHS } }]
  },
  sand: {
    id: 'sand',
    ask: 'Mi tart tovább?',
    slides: [{ title: 'Pillanat, perc, óra', text: 'Egy taps csak egy pillanat. A fogmosás pár perc. A kirándulás órákig tart.', art: { kind: 'pics', ids: ['clap', 'brush', 'trip'] } }]
  }
};

/** Which level of which game brings which idea (by level index). Levels left out bring nothing new. */
const BY_LEVEL: Partial<Record<GameId, (string | null)[]>> = {
  day: ['day', null, null, 'parts', 'before'],
  season: ['seasons', null, 'week', 'near', 'far', 'month'],
  set: ['hourHand', 'whole', 'half', 'quarter', 'five'],
  read: ['hourHand', 'whole', 'half', 'quarter', 'five'],
  digi: ['digital', 'half', 'quarter', 'five', 'afternoon'],
  sleep: ['sleepCount', null, 'overTwelve', 'sleepHalf', 'woke'],
  sand: ['sand']
};

/**
 * The intro for a level: its own one (`own`, so it may open by itself), else the closest one before it, which
 * the "?" button still replays. Null for a game with none.
 */
export function introFor(game: GameId, level: number): { intro: LevelIntro; own: boolean } | null {
  const ids = BY_LEVEL[game];
  if (!ids) return null;
  for (let l = Math.min(level, ids.length - 1); l >= 0; l--) {
    const id = ids[l];
    if (id) return { intro: INTROS[id], own: l === level };
  }
  return null;
}

/** An intro opens by itself on its own level until the child has seen it once. */
export function opensByItself(game: GameId, level: number, seen: string[]): boolean {
  const found = introFor(game, level);
  return !!found && found.own && !seen.includes(found.intro.id);
}

export const BY_LEVEL_FOR_TESTS = BY_LEVEL;

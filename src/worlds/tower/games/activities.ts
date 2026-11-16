// The things a child does in a day, as Napirend and Homokóra show them: when in the day each comes, and
// roughly how long it takes. The pictures are in art.tsx (ActivityPic).

export type ActivityId =
  | 'wake'
  | 'breakfast'
  | 'kindergarten'
  | 'lunch'
  | 'playground'
  | 'dinner'
  | 'bath'
  | 'sleep'
  | 'clap'
  | 'jump'
  | 'brush'
  | 'handwash'
  | 'shoes'
  | 'trip'
  | 'oviDay';

/** The parts of the day Napirend asks about. */
export type DayPart = 'reggel' | 'délben' | 'délután' | 'este';
export const DAY_PARTS: DayPart[] = ['reggel', 'délben', 'délután', 'este'];

/** How long something takes, the three words Homokóra sorts by. */
export type Span = 'pillanat' | 'perc' | 'óra';
export const SPANS: Span[] = ['pillanat', 'perc', 'óra'];

export interface Activity {
  id: ActivityId;
  /** As a card says it: "Felkelés". */
  name: string;
  /** In a sentence, after "a" / "az": "felkelés". */
  noun: string;
  /** Its place in a usual day (smaller is earlier); null for things that happen any time. */
  order: number | null;
  /** The part of the day it belongs to, when it clearly has one. */
  part?: DayPart;
  /** About how long it takes, in seconds, and the word for it. */
  seconds: number;
  span: Span;
}

export const ACTIVITIES: Record<ActivityId, Activity> = {
  wake: { id: 'wake', name: 'Felkelés', noun: 'felkelés', order: 0, part: 'reggel', seconds: 60, span: 'perc' },
  breakfast: { id: 'breakfast', name: 'Reggeli', noun: 'reggeli', order: 1, part: 'reggel', seconds: 15 * 60, span: 'perc' },
  kindergarten: { id: 'kindergarten', name: 'Indulás az oviba', noun: 'oviba indulás', order: 2, seconds: 10 * 60, span: 'perc' },
  lunch: { id: 'lunch', name: 'Ebéd', noun: 'ebéd', order: 3, part: 'délben', seconds: 20 * 60, span: 'perc' },
  playground: { id: 'playground', name: 'Játszótér', noun: 'játszótér', order: 4, part: 'délután', seconds: 3600, span: 'óra' },
  dinner: { id: 'dinner', name: 'Vacsora', noun: 'vacsora', order: 5, part: 'este', seconds: 20 * 60, span: 'perc' },
  bath: { id: 'bath', name: 'Fürdés', noun: 'fürdés', order: 6, part: 'este', seconds: 15 * 60, span: 'perc' },
  sleep: { id: 'sleep', name: 'Alvás egész éjjel', noun: 'alvás', order: 7, seconds: 10 * 3600, span: 'óra' },
  clap: { id: 'clap', name: 'Egy taps', noun: 'taps', order: null, seconds: 1, span: 'pillanat' },
  jump: { id: 'jump', name: 'Egy ugrás', noun: 'ugrás', order: null, seconds: 1, span: 'pillanat' },
  brush: { id: 'brush', name: 'Fogmosás', noun: 'fogmosás', order: null, seconds: 120, span: 'perc' },
  handwash: { id: 'handwash', name: 'Kézmosás', noun: 'kézmosás', order: null, seconds: 60, span: 'perc' },
  shoes: { id: 'shoes', name: 'Cipőfelvétel', noun: 'cipőfelvétel', order: null, seconds: 90, span: 'perc' },
  trip: { id: 'trip', name: 'Kirándulás', noun: 'kirándulás', order: null, seconds: 4 * 3600, span: 'óra' },
  /** The whole day there, for Homokóra; Napirend's card is setting off (kindergarten). */
  oviDay: { id: 'oviDay', name: 'Egy nap az oviban', noun: 'ovis nap', order: null, seconds: 7 * 3600, span: 'óra' }
};

/** The day in order, as Napirend's cards come. */
export const DAY: ActivityId[] = (Object.keys(ACTIVITIES) as ActivityId[])
  .filter((id) => ACTIVITIES[id].order !== null)
  .sort((a, b) => ACTIVITIES[a].order! - ACTIVITIES[b].order!);

/** "a reggeli", "az ebéd", "az ovi". */
export function the(id: ActivityId): string {
  const noun = ACTIVITIES[id].noun;
  return `${/^[aáeéiíoóöőuúüű]/i.test(noun) ? 'az' : 'a'} ${noun}`;
}

export function capital(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

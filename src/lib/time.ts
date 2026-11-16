import { numberAttr, numberCount } from './numbers';

// Hungarian clock times, said the way a child hears them at home: "három óra", "fél három", "negyed három",
// "háromnegyed három". The half and the quarters name the hour the hour hand is heading to, not the one it
// left: 2:30 is "fél három". Every game, hint and printed sheet of the Óratorony says the time through here.

/** A time on a 12-hour dial: `h` 1 … 12, `m` 0 … 59. */
export interface ClockTime {
  h: number;
  m: number;
}

/** Any hour (0 … 23, or 1 … 12) as it stands on the dial: 1 … 12. */
export function dialHour(h: number): number {
  const r = ((Math.round(h) % 12) + 12) % 12;
  return r === 0 ? 12 : r;
}

/** The hour after `h` on the dial: 12 → 1. */
export function nextHour(h: number): number {
  return dialHour(dialHour(h) + 1);
}

/** "három óra", "két óra", "tizenkét óra". */
export function wholeHour(h: number): string {
  return `${numberAttr(dialHour(h))} óra`;
}

/**
 * The time in words. Whole, half and quarter hours in the everyday form; any other minute as
 * "három óra tíz perc". A time not on the dial's minutes (m outside 0 … 59) throws.
 */
export function timeWords({ h, m }: ClockTime): string {
  if (!Number.isInteger(m) || m < 0 || m > 59) throw new RangeError(`Minutes 0 … 59, got ${m}`);
  const next = numberCount(nextHour(h));
  if (m === 0) return wholeHour(h);
  if (m === 15) return `negyed ${next}`;
  if (m === 30) return `fél ${next}`;
  if (m === 45) return `háromnegyed ${next}`;
  return `${wholeHour(h)} ${numberAttr(m)} perc`;
}

/** The same time on a digital clock: "7:15", "12:05"; with `afternoon`, the 24-hour reading ("15:00"). */
export function digital({ h, m }: ClockTime, afternoon = false): string {
  const hh = dialHour(h) + (afternoon && dialHour(h) !== 12 ? 12 : 0);
  return `${hh}:${String(m).padStart(2, '0')}`;
}

/** Where the hands point, in degrees clockwise from 12: the hour hand moves on with the minutes. */
export function handAngles({ h, m }: ClockTime): { hour: number; minute: number } {
  return { hour: (dialHour(h) % 12) * 30 + m / 2, minute: m * 6 };
}

/** Whole hours from `from` to `to` going round the dial: 11 → 2 is 3. */
export function hoursBetween(from: number, to: number): number {
  const d = (dialHour(to) - dialHour(from) + 12) % 12;
  return d === 0 ? 12 : d;
}

/** Minutes from one time to a later one, going round the dial at most once (0 … 719). */
export function minutesBetween(from: ClockTime, to: ClockTime): number {
  const a = (dialHour(from.h) % 12) * 60 + from.m;
  const b = (dialHour(to.h) % 12) * 60 + to.m;
  return (b - a + 720) % 720;
}

/** "két óra", "másfél óra", "fél óra": a stretch of time in half hours, as a child says it. */
export function durationWords(minutes: number): string {
  if (minutes % 30 !== 0 || minutes <= 0) throw new RangeError(`Half hours only, got ${minutes} minutes`);
  const halves = minutes / 30;
  if (halves === 1) return 'fél óra';
  if (halves === 3) return 'másfél óra';
  const hours = Math.floor(halves / 2);
  return halves % 2 === 0 ? `${numberAttr(hours)} óra` : `${numberAttr(hours)} és fél óra`;
}

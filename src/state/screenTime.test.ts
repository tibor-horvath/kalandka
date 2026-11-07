import { describe, expect, it } from 'vitest';
import { DEFAULT_PROGRESS } from './progress';
import { BONUS_SECONDS, addBonus, addPlay, formatMinutes, isEveningRest, lastSevenDays, playedIn, playedToday, remainingSeconds, restNow, today } from './screenTime';

const DAY = '2026-10-12';
const NEXT = '2026-10-13';

describe('screen time', () => {
  it('counts the time between two looks at the clock, carrying the part of a second', () => {
    expect(playedIn(5000)).toEqual({ seconds: 5, usedMs: 5000 });
    // Leaving a game halfway through a tick still counts what was played.
    expect(playedIn(3700)).toEqual({ seconds: 3, usedMs: 3000 });
    expect(playedIn(400)).toEqual({ seconds: 0, usedMs: 0 });
    // A tablet that slept for an hour counts one tick, not the hour.
    expect(playedIn(3_600_000)).toEqual({ seconds: 5, usedMs: 3_600_000 });
  });


  it('formats the local day', () => {
    expect(today(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  it('has a 15-minute limit by default', () => {
    expect(remainingSeconds(DEFAULT_PROGRESS, DAY)).toBe(15 * 60);
  });

  it('counts down from the daily limit', () => {
    let p = { ...DEFAULT_PROGRESS, screenLimitMin: 15 };
    p = addPlay(p, 300, DAY);
    expect(playedToday(p, DAY)).toBe(300);
    expect(remainingSeconds(p, DAY)).toBe(600);
    p = addPlay(p, 900, DAY);
    expect(remainingSeconds(p, DAY)).toBe(0);
  });

  it('starts again on a new day, bonus included', () => {
    let p = addBonus(addPlay({ ...DEFAULT_PROGRESS, screenLimitMin: 10 }, 600, DAY), DAY);
    expect(remainingSeconds(p, DAY)).toBe(BONUS_SECONDS);
    expect(remainingSeconds(p, NEXT)).toBe(600);
    p = addPlay(p, 5, NEXT);
    expect(p.bonusSeconds).toBe(0);
    expect(playedToday(p, NEXT)).toBe(5);
  });

  it('adds ten minutes for today', () => {
    const p = addBonus(addPlay({ ...DEFAULT_PROGRESS, screenLimitMin: 10 }, 600, DAY), DAY);
    expect(remainingSeconds(p, DAY)).toBe(600);
  });

  it('adds five minutes for today', () => {
    const p = addBonus(addPlay({ ...DEFAULT_PROGRESS, screenLimitMin: 5 }, 300, DAY), DAY, 300);
    expect(remainingSeconds(p, DAY)).toBe(300);
  });

  it('keeps a per-day history for the weekly chart, at most two weeks', () => {
    let p = { ...DEFAULT_PROGRESS };
    for (let d = 1; d <= 20; d++) p = addPlay(p, 60 * d, `2026-10-${String(d).padStart(2, '0')}`);
    expect(Object.keys(p.playHistory)).toHaveLength(14);
    expect(p.playHistory['2026-10-20']).toBe(1200);
    const week = lastSevenDays(p, new Date(2026, 9, 20));
    expect(week.map((d) => d.minutes)).toEqual([14, 15, 16, 17, 18, 19, 20]);
    expect(week[6].label).toBe('K');
  });

  it('"Pihenő most" ends play for today, and extra time lifts it', () => {
    let p = restNow({ ...DEFAULT_PROGRESS, screenLimitMin: 0 }, DAY);
    expect(remainingSeconds(p, DAY)).toBe(0);
    expect(remainingSeconds(p, NEXT)).toBe(Infinity);
    p = addBonus(p, DAY);
    expect(remainingSeconds(p, DAY)).toBe(Infinity);
  });

  it('evening rest runs from the chosen hour until 7 in the morning', () => {
    const p = { ...DEFAULT_PROGRESS, eveningRest: true, eveningFrom: 19 };
    expect(isEveningRest(p, new Date(2026, 9, 12, 18, 59))).toBe(false);
    expect(isEveningRest(p, new Date(2026, 9, 12, 19, 0))).toBe(true);
    expect(isEveningRest(p, new Date(2026, 9, 13, 6, 30))).toBe(true);
    expect(isEveningRest(p, new Date(2026, 9, 13, 7, 0))).toBe(false);
    expect(isEveningRest({ ...p, eveningRest: false }, new Date(2026, 9, 12, 21, 0))).toBe(false);
  });

  it('shows whole minutes', () => {
    expect(formatMinutes(30)).toBe('kevesebb mint 1 perc');
    expect(formatMinutes(725)).toBe('12 perc');
  });
});

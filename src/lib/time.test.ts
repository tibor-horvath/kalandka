import { describe, expect, it } from 'vitest';
import { dialHour, digital, durationWords, handAngles, hoursBetween, minutesBetween, nextHour, timeWords } from './time';

describe('Hungarian clock times', () => {
  it('names the whole hours with the attributive number', () => {
    expect(timeWords({ h: 3, m: 0 })).toBe('három óra');
    expect(timeWords({ h: 2, m: 0 })).toBe('két óra');
    expect(timeWords({ h: 12, m: 0 })).toBe('tizenkét óra');
    expect(timeWords({ h: 1, m: 0 })).toBe('egy óra');
  });

  it('names the half and the quarters by the hour the hand is heading to', () => {
    expect(timeWords({ h: 2, m: 30 })).toBe('fél három');
    expect(timeWords({ h: 1, m: 30 })).toBe('fél kettő');
    expect(timeWords({ h: 7, m: 15 })).toBe('negyed nyolc');
    expect(timeWords({ h: 7, m: 45 })).toBe('háromnegyed nyolc');
    expect(timeWords({ h: 11, m: 30 })).toBe('fél tizenkettő');
    expect(timeWords({ h: 12, m: 30 })).toBe('fél egy');
    expect(timeWords({ h: 12, m: 15 })).toBe('negyed egy');
  });

  it('says every quarter of every hour, each differently', () => {
    const all = new Set<string>();
    for (let h = 1; h <= 12; h++) for (const m of [0, 15, 30, 45]) all.add(timeWords({ h, m }));
    expect(all.size).toBe(48);
  });

  it('says other minutes as hours and minutes', () => {
    expect(timeWords({ h: 3, m: 10 })).toBe('három óra tíz perc');
    expect(timeWords({ h: 2, m: 25 })).toBe('két óra huszonöt perc');
    expect(() => timeWords({ h: 2, m: 60 })).toThrow();
  });

  it('keeps hours on the dial', () => {
    expect([0, 12, 13, 24, -1].map(dialHour)).toEqual([12, 12, 1, 12, 11]);
    expect(nextHour(12)).toBe(1);
  });

  it('writes the digital reading, and the afternoon one', () => {
    expect(digital({ h: 7, m: 15 })).toBe('7:15');
    expect(digital({ h: 12, m: 5 })).toBe('12:05');
    expect(digital({ h: 3, m: 0 }, true)).toBe('15:00');
    expect(digital({ h: 12, m: 0 }, true)).toBe('12:00');
  });

  it('turns the hour hand on with the minutes', () => {
    expect(handAngles({ h: 3, m: 0 })).toEqual({ hour: 90, minute: 0 });
    expect(handAngles({ h: 2, m: 30 })).toEqual({ hour: 75, minute: 180 });
    expect(handAngles({ h: 12, m: 45 })).toEqual({ hour: 22.5, minute: 270 });
  });

  it('counts the time between two readings round the dial', () => {
    expect(hoursBetween(1, 3)).toBe(2);
    expect(hoursBetween(11, 2)).toBe(3);
    expect(minutesBetween({ h: 1, m: 0 }, { h: 2, m: 30 })).toBe(90);
    expect(minutesBetween({ h: 11, m: 30 }, { h: 1, m: 0 })).toBe(90);
    expect(durationWords(30)).toBe('fél óra');
    expect(durationWords(90)).toBe('másfél óra');
    expect(durationWords(120)).toBe('két óra');
    expect(durationWords(150)).toBe('két és fél óra');
  });
});

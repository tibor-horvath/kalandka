import { describe, expect, it } from 'vitest';
import { article, numberAttr, numberCount } from './numbers';

describe('Hungarian number words', () => {
  it('uses "két" before a noun and "kettő" when counting', () => {
    expect(numberAttr(2)).toBe('két');
    expect(numberCount(2)).toBe('kettő');
    expect(numberAttr(12)).toBe('tizenkét');
    expect(numberCount(12)).toBe('tizenkettő');
    expect(numberAttr(32)).toBe('harminckét');
    expect(numberCount(32)).toBe('harminckettő');
  });

  it('covers 1 to 100', () => {
    expect(numberAttr(1)).toBe('egy');
    expect(numberAttr(10)).toBe('tíz');
    expect(numberCount(20)).toBe('húsz');
    expect(numberCount(21)).toBe('huszonegy');
    expect(numberCount(47)).toBe('negyvenhét');
    expect(numberCount(90)).toBe('kilencven');
    expect(numberCount(99)).toBe('kilencvenkilenc');
    expect(numberCount(100)).toBe('száz');
  });

  it('picks the article from the spoken word', () => {
    expect(article(numberCount(5))).toBe('az');
    expect(article(numberCount(50))).toBe('az');
    expect(article(numberCount(20))).toBe('a');
  });

  it('goes past 100, so a big basket can still be read out', () => {
    expect(numberAttr(101)).toBe('százegy');
    expect(numberCount(102)).toBe('százkettő');
    expect(numberAttr(102)).toBe('százkét');
    expect(numberAttr(200)).toBe('kétszáz');
    expect(numberCount(345)).toBe('háromszáznegyvenöt');
    expect(numberAttr(1000)).toBe('ezer');
    expect(numberCount(1999)).toBe('ezerkilencszázkilencvenkilenc');
    expect(numberAttr(2000)).toBe('kétezer');
    expect(numberCount(2002)).toBe('kétezer-kettő');
    expect(numberAttr(12_500)).toBe('tizenkétezer-ötszáz');
  });

  it('rejects numbers outside 1–999 999', () => {
    expect(() => numberAttr(0)).toThrow(RangeError);
    expect(() => numberCount(1_000_000)).toThrow(RangeError);
    expect(() => numberCount(1.5)).toThrow(RangeError);
  });
});

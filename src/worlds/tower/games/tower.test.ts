import { describe, expect, it } from 'vitest';
import { minutesBetween, timeWords } from '../../../lib/time';
import { ACTIVITIES, DAY } from './activities';
import { DIGI_LEVELS, READ_LEVELS, SET_LEVELS, buildDigiRound, buildReadRound, buildSetRound, numberSuffix, setRight, setWrong } from './clock';
import { DAY_LEVELS, buildDayRound, dayStart, dayWrongSeq } from './day';
import { SAND_LEVELS, buildSandRound } from './sand';
import { SEASON_LEVELS, answerOf, buildSeasonRound, seasonOfMonth } from './season';
import { SLEEP_LEVELS, buildSleepRound, cardText } from './sleep';

const ROUNDS = 60;

describe('Napirend', () => {
  it('builds the same round every time', () => {
    for (let l = 0; l < DAY_LEVELS.length; l++) expect(buildDayRound(l, 7)).toEqual(buildDayRound(l, 7));
  });

  it('puts the cards of a row in the order of the day, and offers every card still to place', () => {
    for (let l = 0; l < DAY_LEVELS.length; l++) {
      for (let r = 0; r < ROUNDS; r++) {
        const round = buildDayRound(l, r);
        if (round.mode !== 'seq') continue;
        const orders = round.sequence.map((id) => ACTIVITIES[id].order!);
        expect([...orders].sort((a, b) => a - b)).toEqual(orders);
        for (const id of round.sequence.slice(round.given)) expect(round.choices).toContain(id);
        expect(new Set(round.choices).size).toBe(round.choices.length);
      }
    }
  });

  it('starts the youngest on one card and two to choose from, one of them earlier', () => {
    for (let r = 0; r < ROUNDS; r++) {
      const round = buildDayRound(0, r);
      if (round.mode !== 'seq') throw new Error('seq');
      expect(round.sequence).toHaveLength(2);
      expect(round.given).toBe(1);
      expect(round.choices).toHaveLength(2);
      const other = round.choices.find((c) => c !== round.sequence[1])!;
      expect(ACTIVITIES[other].order!).toBeLessThan(ACTIVITIES[round.sequence[0]].order!);
      expect(dayStart(round).text).toMatch(/Mi jön utána\?$/);
    }
  });

  it('says why a card does not fit yet', () => {
    const round = { mode: 'seq' as const, sequence: DAY.slice(0, 3), given: 1, choices: DAY.slice(1, 3) };
    expect(dayWrongSeq(round, 1, DAY[2], 1).text).toContain('később jön');
  });

  it('asks which came first with one of the two earlier', () => {
    for (let r = 0; r < ROUNDS; r++) {
      const round = buildDayRound(4, r);
      if (round.mode !== 'before') throw new Error('before');
      expect(round.pair).toContain(round.answer);
      expect(round.pair[0]).not.toBe(round.pair[1]);
    }
  });
});

describe('Évszakok', () => {
  it('has one right card in every round', () => {
    for (let l = 0; l < SEASON_LEVELS.length; l++) {
      for (let r = 0; r < ROUNDS; r++) {
        const round = buildSeasonRound(l, r);
        const choices = round.choices as unknown[];
        expect(answerOf(round), `${l} ${r}`).toBeGreaterThanOrEqual(0);
        expect(new Set(choices).size).toBe(choices.length);
      }
    }
  });

  it('puts every month in its season', () => {
    expect([11, 0, 1].map(seasonOfMonth)).toEqual(['winter', 'winter', 'winter']);
    expect([2, 5, 8].map(seasonOfMonth)).toEqual(['spring', 'summer', 'autumn']);
  });
});

describe('the clock games', () => {
  it('only ask the minutes of their level', () => {
    const allowed: Record<string, number[]> = { hourOnly: [0], whole: [0], half: [30], quarter: [15, 45], afternoon: [0] };
    for (let l = 0; l < READ_LEVELS.length; l++) {
      for (let r = 0; r < ROUNDS; r++) {
        const { time, level } = buildReadRound(l, r);
        if (allowed[level.step]) expect(allowed[level.step]).toContain(time.m);
        else expect(time.m % 5).toBe(0);
      }
    }
  });

  it('offers three different readings, one of them right', () => {
    for (let l = 0; l < READ_LEVELS.length; l++) {
      for (let r = 0; r < ROUNDS; r++) {
        const round = buildReadRound(l, r);
        expect(round.choices).toHaveLength(3);
        expect(new Set(round.choices).size).toBe(3);
        expect(round.choices[round.answer]).toBe(timeWords(round.time));
      }
    }
    for (let l = 0; l < DIGI_LEVELS.length; l++) {
      for (let r = 0; r < ROUNDS; r++) {
        const round = buildDigiRound(l, r);
        expect(new Set(round.choices).size).toBe(3);
        expect(round.answer).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('reads the afternoon on the 24-hour clock', () => {
    const last = DIGI_LEVELS.length - 1;
    for (let r = 0; r < ROUNDS; r++) {
      const round = buildDigiRound(last, r);
      expect(round.choices[round.answer]).toBe(`${round.time.h + 12}:00`);
    }
  });

  it('never starts the hands on the answer, and checks only the hour hand on the first level', () => {
    for (let l = 0; l < SET_LEVELS.length; l++) {
      for (let r = 0; r < ROUNDS; r++) {
        const round = buildSetRound(l, r);
        expect(setRight(round, round.start.h, round.start.m)).toBe(false);
        expect(setRight(round, round.target.h, round.target.m)).toBe(true);
      }
    }
    const first = buildSetRound(0, 3);
    expect(setRight(first, first.target.h, 25)).toBe(true);
  });

  it('points at the minute hand first when it is off', () => {
    const round = { ...buildSetRound(2, 1) };
    expect(setWrong(round, round.target.h, 0, 1).text).toContain('nagy mutató');
  });

  it('puts the right case ending on the dial numbers', () => {
    expect([1, 3, 5, 6, 10].map((h) => numberSuffix(h))).toEqual(['egyesre', 'hármasra', 'ötösre', 'hatosra', 'tízesre']);
    expect(numberSuffix(2, 'elhagyta')).toBe('kettest');
    expect(numberSuffix(3, 'fele')).toBe('hármas felé');
  });
});

describe('Kakuk alszik', () => {
  it('sleeps as long as the clocks say, within the level', () => {
    for (let l = 0; l < SLEEP_LEVELS.length; l++) {
      const level = SLEEP_LEVELS[l];
      for (let r = 0; r < ROUNDS; r++) {
        const round = buildSleepRound(l, r);
        expect(minutesBetween(round.from, round.to)).toBe(round.minutes);
        expect(round.minutes).toBeGreaterThanOrEqual(level.min * 60);
        expect(round.minutes).toBeLessThanOrEqual(level.max * 60);
        const startMin = (round.from.h % 12) * 60 + round.from.m;
        expect(startMin + round.minutes > 720, `${l} ${r}`).toBe(level.overTwelve);
        expect(round.choices[round.answer]).toBe(round.minutes);
        expect(new Set(round.choices).size).toBe(3);
      }
    }
  });

  it('names a nap in words a child uses', () => {
    expect(cardText(120)).toBe('2 óra');
    expect(cardText(90)).toBe('másfél óra');
  });
});

describe('Homokóra', () => {
  it('compares only things far apart in length', () => {
    for (let l = 0; l < 2; l++) {
      for (let r = 0; r < ROUNDS; r++) {
        const round = buildSandRound(l, r);
        if (round.mode === 'span') throw new Error('pair');
        const [a, b] = round.pair.map((id) => ACTIVITIES[id].seconds);
        const right = round.answer === 0 ? a : b;
        const other = round.answer === 0 ? b : a;
        if (SAND_LEVELS[l].mode === 'longer') expect(right).toBeGreaterThanOrEqual(other * 10);
        else expect(right * 10).toBeLessThanOrEqual(other);
      }
    }
  });

  it('sorts by the span each thing takes', () => {
    for (let r = 0; r < ROUNDS; r++) {
      const round = buildSandRound(2, r);
      if (round.mode !== 'span') throw new Error('span');
      expect(ACTIVITIES[round.activity].span).toBe(round.answer);
    }
  });
});

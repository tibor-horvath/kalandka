import { describe, expect, it } from 'vitest';
import {
  BOX_H,
  BOX_W,
  STEP,
  TOLERANCE,
  TRACE_LEVELS,
  TRACE_ORDER,
  arrowPoints,
  buildTraceRound,
  lapOrder,
  canGrab,
  checkpoints,
  digitShape,
  doneFeedback,
  follow,
  resample,
  startArrowPoint,
  startFeedback,
  type Pt
} from './logic';

/** Walks a finger along the trail with a sideways wobble, the way a five-year-old might. */
function traceWithWobble(pts: Pt[], wobble: number): number {
  let idx = 0;
  for (let i = 0; i < pts.length; i += 2) {
    const side = (i % 8 < 4 ? 1 : -1) * wobble;
    idx = follow(pts, idx, { x: pts[i].x + side, y: pts[i].y - side }).idx;
  }
  return idx;
}

describe('digit trails', () => {
  it('has every digit 0–9, inside the box, evenly sampled', () => {
    expect([...TRACE_ORDER].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const d of TRACE_ORDER) {
      for (const s of digitShape(d).strokes) {
        expect(s.length).toBeGreaterThan(20);
        for (const q of s) {
          expect(q.x).toBeGreaterThanOrEqual(0);
          expect(q.x).toBeLessThanOrEqual(BOX_W);
          expect(q.y).toBeGreaterThanOrEqual(0);
          expect(q.y).toBeLessThanOrEqual(BOX_H);
        }
        for (let i = 1; i < s.length - 1; i++) {
          // Spacing is measured along the path, so a chord across a sharp corner can be shorter.
          expect(Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y)).toBeLessThanOrEqual(STEP + 0.01);
        }
      }
    }
  });

  it('4, 5 and 7 take two strokes, the rest one', () => {
    const two = TRACE_ORDER.filter((d) => digitShape(d).strokes.length === 2).sort();
    expect(two).toEqual([4, 5, 7]);
  });

  it('the full-trail levels go 1 to 5, then 6 to 9 and 0, in writing order', () => {
    expect([0, 1, 2, 3, 4].map((n) => buildTraceRound(0, n).digit)).toEqual([1, 2, 3, 4, 5]);
    expect([0, 1, 2, 3, 4].map((n) => buildTraceRound(1, n).digit)).toEqual([6, 7, 8, 9, 0]);
    expect(buildTraceRound(0, 5).digit).toBe(1);
    expect(buildTraceRound(0, 0).faded).toBe(false);
    expect(buildTraceRound(1, 0).faded).toBe(false);
  });

  it('the faded levels mix the same digits on a faint trail', () => {
    for (const level of [2, 3]) {
      const half = TRACE_LEVELS[level - 2].digits;
      const rounds = half.map((_, n) => buildTraceRound(level, n));
      expect(rounds.every((r) => r.faded)).toBe(true);
      expect(rounds.map((r) => r.digit).sort()).toEqual([...half].sort());
      expect(rounds.map((r) => r.digit)).not.toEqual(half);
    }
  });

  it('the mixed levels walk all ten digits on a faint trail, a new mix each lap', () => {
    for (const level of [4, 5]) {
      for (let lap = 0; lap < 3; lap++) {
        const rounds = TRACE_ORDER.map((_, n) => buildTraceRound(level, lap * 10 + n));
        expect(rounds.every((r) => r.faded)).toBe(true);
        expect(rounds.map((r) => r.digit).sort()).toEqual([...TRACE_ORDER].sort());
        expect(rounds.map((r) => r.digit)).not.toEqual(TRACE_ORDER);
      }
      expect(buildTraceRound(level, 0).digit).not.toBe(buildTraceRound(level, 10).digit);
    }
    expect(buildTraceRound(4, 0).bare).toBe(false);
    expect(buildTraceRound(5, 0).bare).toBe(true);
    expect(TRACE_LEVELS.slice(0, 4).every((_, l) => !buildTraceRound(l, 0).bare)).toBe(true);
  });

  it('a bare trail shows its arrow near the start of every stroke', () => {
    for (const d of TRACE_ORDER) {
      for (const pts of digitShape(d).strokes) {
        const k = startArrowPoint(pts);
        expect(k).toBeGreaterThan(0);
        expect(k).toBeLessThan(pts.length / 2);
      }
    }
    expect(startFeedback(buildTraceRound(5, 0)).text).toContain('csak a kezdőpont');
  });

  it('printed laps mix every digit, without repeating one across laps', () => {
    for (let lap = 1; lap < 6; lap++) {
      expect([...lapOrder(lap)].sort()).toEqual([...TRACE_ORDER].sort());
      expect(lapOrder(lap)).not.toEqual(TRACE_ORDER);
      expect(lapOrder(lap)[0]).not.toBe(lapOrder(lap - 1).at(-1));
    }
  });

  it('a faded trail shows an arrow or two along every stroke, away from its ends', () => {
    for (const d of TRACE_ORDER) {
      for (const pts of digitShape(d).strokes) {
        const arrows = arrowPoints(pts);
        expect(arrows.length).toBeGreaterThan(0);
        expect(arrows.every((k) => k > 0 && k < pts.length - 1)).toBe(true);
      }
    }
  });

  it('Csepi talks about the faded trail', () => {
    const r = buildTraceRound(2, 0);
    expect(startFeedback(r).text).toContain('halvány');
    expect(doneFeedback(r.digit, true).text).toContain('Emlékezetből');
  });

  it('resample keeps both ends', () => {
    const r = resample([{ x: 0, y: 0 }, { x: 10, y: 0 }], 3);
    expect(r[0]).toEqual({ x: 0, y: 0 });
    expect(r.at(-1)).toEqual({ x: 10, y: 0 });
  });
});

describe('following the finger', () => {
  it('a wobbly finger still finishes every stroke of every digit', () => {
    for (const d of TRACE_ORDER) {
      for (const s of digitShape(d).strokes) {
        expect(traceWithWobble(s, TOLERANCE * 0.6)).toBe(s.length - 1);
      }
    }
  });

  it('never moves backwards', () => {
    const s = digitShape(1).strokes[0];
    const r = follow(s, 30, s[10]);
    expect(r.idx).toBe(30);
    expect(r.strayed).toBe(false);
  });

  it('off the trail the bee waits and nothing fails', () => {
    const s = digitShape(1).strokes[0];
    const r = follow(s, 20, { x: s[20].x + TOLERANCE * 2, y: s[20].y });
    expect(r).toEqual({ idx: 20, strayed: true, done: false });
  });

  it('cannot skip ahead to a far part of the trail', () => {
    const s = digitShape(2).strokes[0];
    const r = follow(s, 0, s.at(-1)!);
    expect(r.idx).toBe(0);
  });

  it('does not jump across the middle of the 8', () => {
    const s = digitShape(8).strokes[0];
    // Just before the crossing on the way down, touch the crossing itself: the bee moves a little, not to the way back up.
    const crossing = s.reduce((best, q, i) => (i > s.length / 2 && Math.abs(q.y - 146) < Math.abs(s[best].y - 146) ? i : best), Math.floor(s.length / 2));
    const before = Math.floor(s.length * 0.2);
    const r = follow(s, before, s[crossing]);
    expect(r.idx).toBeLessThan(s.length / 2);
  });

  it('snaps to the end when the finger is nearly there', () => {
    const s = digitShape(1).strokes[0];
    const r = follow(s, s.length - 8, s[s.length - 3]);
    expect(r.done).toBe(true);
    expect(r.idx).toBe(s.length - 1);
  });

  it('a touch near the bee may start, a touch far away may not', () => {
    const s = digitShape(3).strokes[0];
    expect(canGrab(s, 0, { x: s[0].x + 20, y: s[0].y })).toBe(true);
    expect(canGrab(s, 0, s.at(-1)!)).toBe(false);
  });
});

describe('honey drops', () => {
  it('sit along the trail and always on its end', () => {
    for (const d of TRACE_ORDER) {
      for (const s of digitShape(d).strokes) {
        const cps = checkpoints(s);
        expect(cps.at(-1)).toBe(s.length - 1);
        expect(cps[0]).toBeGreaterThan(0);
        expect(cps).toEqual([...cps].sort((a, b) => a - b));
      }
    }
  });
});

describe("Csepi's words", () => {
  it('names the digit with the right article', () => {
    expect(startFeedback(digitShape(3)).text).toContain('egy hármast');
    expect(doneFeedback(1).speech).toContain('az egyes: egy');
    expect(doneFeedback(2).speech).toContain('a kettes: kettő');
    expect(doneFeedback(0).speech).toContain('a nullás: nulla');
    expect(startFeedback(digitShape(4)).text).toContain('Két vonalból');
  });
});

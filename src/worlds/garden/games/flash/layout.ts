// Seed layouts shared by Számmagok and Villámszem.

export const FIELD_W = 600;
export const FIELD_H = 280;

export interface SeedPos {
  x: number;
  y: number;
  rot: number;
}

/** Dice faces in a unit square. */
const DICE: [number, number][][] = [
  [],
  [[0.5, 0.5]],
  [[0.25, 0.25], [0.75, 0.75]],
  [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
  [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
  [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]]
];

export function diceFace(n: number): [number, number][] {
  if (n < 1 || n > 5) throw new RangeError(`Dice face needs 1–5, got ${n}`);
  return DICE[n];
}

function diceBox(n: number, cx: number, cy: number, size: number): { x: number; y: number }[] {
  return diceFace(n).map(([u, v]) => ({ x: cx + (u - 0.5) * size, y: cy + (v - 0.5) * size }));
}

const MIN_GAP = 70;
const MARGIN = 40;

function scatterPoints(n: number, rand: () => number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  let tries = 0;
  while (out.length < n && tries < 2000) {
    tries++;
    const p = { x: MARGIN + rand() * (FIELD_W - 2 * MARGIN), y: MARGIN + rand() * (FIELD_H - 2 * MARGIN) };
    if (out.every((q) => Math.hypot(p.x - q.x, p.y - q.y) >= MIN_GAP)) out.push(p);
  }
  return out;
}

/** A ten-frame (two rows of five), filled row by row from the top left. */
function tenFrame(n: number, cx: number, cy: number, gapX = 50, gapY = 64): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, i) => ({ x: cx + ((i % 5) - 2) * gapX, y: cy + (Math.floor(i / 5) - 0.5) * gapY }));
}

export type Layout = 'dice' | 'scatter' | 'groups' | 'frame';

/** The big single ten-frame of 6–10 on a frame level: it has the whole field to itself. */
const BIG_GAP_X = 84;
const BIG_GAP_Y = 96;
/** The two ten-frames of 11–20 on a frame level: rows spread so the empty spaces show, columns close so the frames stand apart. */
const PAIR_GAP_X = 46;
const PAIR_GAP_Y = 90;

function twoFrames(count: number, gapX: number, gapY: number): { x: number; y: number }[] {
  return [...tenFrame(10, FIELD_W * 0.27, FIELD_H / 2, gapX, gapY), ...tenFrame(count - 10, FIELD_W * 0.73, FIELD_H / 2, gapX, gapY)];
}

/**
 * dice: one dice face (1–5). groups: a five and the rest (6–10). frame: one big ten-frame (up to 10).
 * Above 10 always: a full ten-frame and the rest in a second frame (11–20).
 * scatter: random, never overlapping.
 */
export function layoutSeeds(count: number, layout: Layout, rand: () => number): SeedPos[] {
  let points: { x: number; y: number }[];
  if (count > 10) {
    points = layout === 'frame' ? twoFrames(count, PAIR_GAP_X, PAIR_GAP_Y) : twoFrames(count, 50, 64);
  } else if (layout === 'frame') {
    points = tenFrame(count, FIELD_W / 2, FIELD_H / 2, BIG_GAP_X, BIG_GAP_Y);
  } else if (layout === 'scatter') {
    points = scatterPoints(count, rand);
  } else if (layout === 'groups' || count > 5) {
    points = [...diceBox(5, FIELD_W * 0.28, FIELD_H / 2, 200), ...diceBox(count - 5, FIELD_W * 0.72, FIELD_H / 2, 200)];
  } else {
    points = diceBox(count, FIELD_W / 2, FIELD_H / 2, 220);
  }
  return points.map((p) => ({ ...p, rot: Math.round(rand() * 80 - 40) }));
}

/** Every space of the ten-frames the seeds of a frame level stand in, empty ones too: one frame up to 10, two above. */
export function frameCells(count: number): SeedPos[] {
  const points = count > 10 ? twoFrames(20, PAIR_GAP_X, PAIR_GAP_Y) : tenFrame(10, FIELD_W / 2, FIELD_H / 2, BIG_GAP_X, BIG_GAP_Y);
  return points.map((p) => ({ ...p, rot: 0 }));
}

/** The groups stand at about 27.5 % and 72.5 % of the field; folded, both centre on the half field. */
const FOLD_SHIFT = FIELD_W * 0.275 - FIELD_W / 4;

/**
 * Portrait phones: a five (or ten) and the rest, side by side, become one above the other in a
 * field half as wide and twice as tall, so the seeds can be drawn bigger. Seeds keep their order,
 * and both frames keep the same left edge so the rows still line up. Null for 1–5 seeds: one dice
 * face or a scatter, drawn as it is.
 */
export function foldSeeds(seeds: SeedPos[]): { width: number; height: number; seeds: SeedPos[] } | null {
  // Above five the seeds always come as two groups (layoutSeeds: groups or two ten-frames).
  if (seeds.length <= 5) return null;
  const mid = FIELD_W / 2;
  return {
    width: FIELD_W / 2,
    height: FIELD_H * 2,
    seeds: seeds.map((s) => (s.x < mid ? { ...s, x: s.x - FOLD_SHIFT } : { ...s, x: s.x - mid + FOLD_SHIFT, y: s.y + FIELD_H }))
  };
}

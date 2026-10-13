import { ADD_LEVELS } from '../games/add/logic';
import { FLASH_ROUNDS_PER_LEVEL, LEVELS as FLASH_LEVELS } from '../games/flash/logic';
import { LEARN_MAX } from '../games/learn/logic';
import { SHAPE_ORDER } from '../games/patterns/logic';
import { POTS_LEVELS, POTS_ROUNDS_PER_LEVEL } from '../games/pots/logic';
import { TRACE_ORDER } from '../games/trace/logic';
import { PLANTS } from '../games/water/logic';
import { PATH_LEVELS, PATH_ROUNDS_PER_LEVEL } from '../games/robot/path';
import type { GameId } from '../screens/Home';
import type { RobotGameId } from '../screens/robot/RobotHome';
import type { Progress } from './progress';
import type { WorldId } from './worlds';

// The reward loop: every solved task earns a seed; seeds are planted in the child's own garden
// (Kiskert); plants grow as the child keeps playing; a grown garden brings visitors; and each new
// skill earns a sticker for the album. Rewards are only ever added: nothing wilts, nothing is taken
// away, nothing is random and nothing depends on time played.

export type PlantKind = 'flower' | 'bush' | 'tree';

export interface PlantOption {
  id: PlantKind;
  name: string;
  cost: number;
  /** Solved tasks (seeds earned) after planting until it is grown: the bigger the plant, the longer it takes. */
  grows: number;
}

export const PLANT_OPTIONS: PlantOption[] = [
  { id: 'flower', name: 'Virág', cost: 3, grows: 3 },
  { id: 'bush', name: 'Áfonyabokor', cost: 6, grows: 5 },
  { id: 'tree', name: 'Körtefa', cost: 10, grows: 8 }
];

/** Beds in the garden, five in a row like a ten-frame. */
export const BEDS = 10;

export interface Bed {
  kind: PlantKind;
  /** Seeds earned in total when it was planted; growth counts the seeds earned since. */
  at: number;
}

/** Seeds the child can still plant. `seeds` counts every seed ever earned. */
export function seedBalance(p: Progress): number {
  return Math.max(0, p.seeds - p.seedsSpent);
}

export function bedAt(p: Progress, i: number): Bed | null {
  return p.beds[i] ?? null;
}

/** Solved tasks a plant of this kind needs to grow. */
export function growAfter(kind: PlantKind): number {
  return PLANT_OPTIONS.find((o) => o.id === kind)!.grows;
}

/** 0 … growAfter(kind): how far a planting has grown. */
export function growthOf(bed: Bed, seeds: number): number {
  return Math.min(growAfter(bed.kind), Math.max(0, seeds - bed.at));
}

export function isGrown(bed: Bed, seeds: number): boolean {
  return growthOf(bed, seeds) >= growAfter(bed.kind);
}

export function grownCount(p: Progress): number {
  return p.beds.filter((b): b is Bed => !!b && isGrown(b, p.seeds)).length;
}

export function canPlant(p: Progress, i: number, kind: PlantKind): boolean {
  const option = PLANT_OPTIONS.find((o) => o.id === kind);
  return !!option && i >= 0 && i < BEDS && !bedAt(p, i) && seedBalance(p) >= option.cost;
}

/** Plants in an empty bed; unchanged when the bed is taken or the seeds are not enough. */
export function plant(p: Progress, i: number, kind: PlantKind): Progress {
  if (!canPlant(p, i, kind)) return p;
  const cost = PLANT_OPTIONS.find((o) => o.id === kind)!.cost;
  const beds = Array.from({ length: BEDS }, (_, k) => bedAt(p, k));
  beds[i] = { kind, at: p.seeds };
  return { ...p, beds, seedsSpent: p.seedsSpent + cost };
}

// ---------- visitors ----------

export type VisitorId = 'hedgehog' | 'ladybug' | 'butterfly' | 'blackbird';

export interface Visitor {
  id: VisitorId;
  name: string;
  /** Grown plants that bring it. */
  after: number;
  /** Csepi's line when it arrives. */
  speech: string;
}

export const VISITORS: Visitor[] = [
  { id: 'hedgehog', name: 'Süni', after: 3, speech: 'Nézd, ki jött! Süni beköltözött a kertedbe. Itt marad veled.' },
  { id: 'ladybug', name: 'Katica', after: 5, speech: 'Nézd, ki jött! Katica leszállt a kertedbe. Itt marad veled.' },
  { id: 'butterfly', name: 'Pillangó', after: 8, speech: 'Nézd, ki jött! Egy pillangó táncol a virágaid között.' },
  { id: 'blackbird', name: 'Rigó', after: 10, speech: 'Nézd, ki jött! A rigó fészket rakott a kertedben. Tele van a kert!' }
];

export function visitorsOf(p: Progress): Visitor[] {
  const grown = grownCount(p);
  return VISITORS.filter((v) => grown >= v.after);
}

/** The next visitor that arrived but has not been welcomed yet. */
export function newVisitor(p: Progress): Visitor | null {
  return visitorsOf(p)[p.visitorsSeen] ?? null;
}

// ---------- stickers ----------

export interface Sticker {
  id: string;
  game: GameId | RobotGameId;
  /** Printed on the sticker. */
  mark: string;
  label: string;
  /** Csepi's line when it is collected. */
  praise: string;
  earned: (p: Progress) => boolean;
  /** A later skill step of the game (Mézút's faded trail), shown as its own row when it pops. */
  set?: number;
}

export interface StickerGame {
  id: GameId | RobotGameId;
  name: string;
  color: string;
  ink: string;
  /** The world whose album page the game is on. */
  world: WorldId;
}

/** Album order and each game's sticker colour (light ones carry dark ink). */
export const STICKER_GAMES: StickerGame[] = [
  { id: 'learn', name: 'Számvetés', color: '#2E86DE', ink: '#FFFFFF', world: 'garden' },
  { id: 'water', name: 'Locsolás', color: '#9FCDF3', ink: '#10233A', world: 'garden' },
  { id: 'patterns', name: 'Virágsor', color: '#F4A3C4', ink: '#10233A', world: 'garden' },
  { id: 'flash', name: 'Magvillantás', color: '#8A5A3B', ink: '#FFFFFF', world: 'garden' },
  { id: 'add', name: 'Méhecske', color: '#FFC93C', ink: '#10233A', world: 'garden' },
  { id: 'trace', name: 'Mézút', color: '#D9741A', ink: '#FFFFFF', world: 'garden' },
  { id: 'pots', name: 'Cserépbarátok', color: '#2F7D32', ink: '#FFFFFF', world: 'garden' },
  { id: 'path', name: 'Robotút', color: '#138A86', ink: '#FFFFFF', world: 'robot' }
];

/** Robotút stickers: a course solved on a level (the first solved course of that level and on). */
const pathLevel = (name: string) => PATH_LEVELS.findIndex((l) => l.name === name);
const pathPassed = (name: string) => (p: Progress) => p.pathSolved > pathLevel(name) * PATH_ROUNDS_PER_LEVEL;

/** Méhecske levels that close a number range: the last level up to 5, up to 10, and round tens. */
const ADD_PAST_5 = ADD_LEVELS.findIndex((l) => l.name === '10-ig, gyűjtéssel');
const ADD_PAST_10 = ADD_LEVELS.findIndex((l) => l.name === '20-ig');
const ADD_HUNDRED = ADD_LEVELS.findIndex((l) => l.name === 'Kerek tízesek 100-ig');
const addReached = (level: number) => (p: Progress) => p.addSolved > 0 && p.addLevel >= level;

export const STICKERS: Sticker[] = [
  { id: 'learn-5', game: 'learn', mark: '1–5', label: 'Ismerem 5-ig', praise: 'Már ötig ismered a számokat!', earned: (p) => p.learnSolved >= 5 },
  { id: 'learn-10', game: 'learn', mark: '1–10', label: 'Ismerem 10-ig', praise: 'Már tízig ismered a számokat!', earned: (p) => p.learnSolved >= 10 },
  { id: 'learn-20', game: 'learn', mark: '1–20', label: 'Ismerem 20-ig', praise: 'Már húszig ismered a számokat!', earned: (p) => p.learnSolved >= LEARN_MAX },
  { id: 'water-1', game: 'water', mark: '1', label: 'Első virág', praise: 'Kinőtt az első virágod!', earned: (p) => p.garden.length >= 1 },
  { id: 'water-10', game: 'water', mark: '10', label: 'Tízes keret', praise: 'Minden virágot meglocsoltál tízig!', earned: (p) => p.garden.length >= PLANTS.length },
  { id: 'water-20', game: 'water', mark: '20', label: 'Két keret', praise: 'Már húsz cseppig locsolsz!', earned: (p) => p.garden.length >= PLANTS.length * 2 },
  { id: 'patterns-ab', game: 'patterns', mark: 'AB', label: 'Kettes sor', praise: 'Folytattad az első virágsort!', earned: (p) => p.patternsSolved >= 1 },
  { id: 'patterns-abc', game: 'patterns', mark: 'ABC', label: 'Hármas sor', praise: 'Már a hármas sort is folytatod!', earned: (p) => p.patternsSolved >= 2 },
  { id: 'patterns-all', game: 'patterns', mark: 'AAB', label: 'Minden minta', praise: 'Mind a négy virágmintát kitaláltad!', earned: (p) => p.patternsSolved >= SHAPE_ORDER.length },
  { id: 'flash-3', game: 'flash', mark: '3', label: 'Egy pillantás', praise: 'Egy pillantásra látod, hány mag van!', earned: (p) => p.flashSolved >= FLASH_ROUNDS_PER_LEVEL },
  { id: 'flash-5', game: 'flash', mark: '5', label: 'Öt mag', praise: 'Már öt magot is egy pillantásra látsz!', earned: (p) => p.flashSolved >= FLASH_ROUNDS_PER_LEVEL * (FLASH_LEVELS.length - 1) },
  { id: 'flash-10', game: 'flash', mark: '10', label: 'Tíz mag', praise: 'Már tíz magot is egy pillantásra látsz!', earned: (p) => p.flashSolved >= FLASH_ROUNDS_PER_LEVEL * FLASH_LEVELS.length },
  { id: 'add-5', game: 'add', mark: '+5', label: 'Adok 5-ig', praise: 'Már ötig adsz össze és veszel el!', earned: addReached(ADD_PAST_5) },
  { id: 'add-10', game: 'add', mark: '+10', label: 'Adok 10-ig', praise: 'Már tízig adsz össze és veszel el!', earned: addReached(ADD_PAST_10) },
  { id: 'add-100', game: 'add', mark: '100', label: 'Százig', praise: 'Már a százas számokkal is számolsz!', earned: addReached(ADD_HUNDRED) },
  { id: 'trace-5', game: 'trace', mark: '1–5', label: 'Írom 5-ig', praise: 'Már ötig írod a számokat!', earned: (p) => p.traceSolved >= 5 },
  { id: 'trace-9', game: 'trace', mark: '6–9', label: 'Írom 9-ig', praise: 'Már kilencig írod a számokat!', earned: (p) => p.traceSolved >= 9 },
  { id: 'trace-0', game: 'trace', mark: '0', label: 'Minden szám', praise: 'Minden számot meg tudsz írni!', earned: (p) => p.traceSolved >= TRACE_ORDER.length },
  { id: 'trace-fade', game: 'trace', mark: '5', label: 'Halvány út', praise: 'Már halvány úton is írod a számokat!', earned: (p) => p.traceFadedSolved >= 5, set: 1 },
  { id: 'trace-memory', game: 'trace', mark: '0–9', label: 'Fejből írom', praise: 'Minden számot emlékezetből írsz!', earned: (p) => p.traceFadedSolved >= TRACE_ORDER.length, set: 1 },
  { id: 'pots-5', game: 'pots', mark: '5', label: 'Öt barátai', praise: 'Ismered az öt barátait!', earned: (p) => p.potsSolved >= POTS_ROUNDS_PER_LEVEL },
  { id: 'pots-10', game: 'pots', mark: '10', label: 'Tíz barátai', praise: 'Ismered a tíz barátait!', earned: (p) => p.potsSolved >= POTS_ROUNDS_PER_LEVEL * 2 },
  { id: 'path-first', game: 'path', mark: '1', label: 'Első út', praise: 'Elvezetted a robotot az elemhez!', earned: (p) => p.pathSolved >= 1 },
  { id: 'path-plan', game: 'path', mark: '▶', label: 'Tervező', praise: 'Előre megtervezted a robot útját!', earned: pathPassed('Tervezz előre') },
  { id: 'path-turn', game: 'path', mark: '↻', label: 'Fordulós', praise: 'A robot arra megy, amerre néz, és te tudod, merre fordítsd!', earned: pathPassed('Fordulj!') },
  { id: 'path-repeat', game: 'path', mark: '×3', label: 'Ismétlő', praise: 'Az ismétléssel rövid lett a programod!', earned: pathPassed('Ismételd és fordulj'), set: 1 },
  { id: 'path-two', game: 'path', mark: '2', label: 'Két elem', praise: 'Egy programmal két elemet is összegyűjtöttél!', earned: pathPassed('Két elem'), set: 1 },
  { id: 'pots-mix', game: 'pots', mark: '10?', label: 'Szórt cserepek', praise: 'A szórt cserepeknél is megtalálod a tíz barátait!', earned: (p) => p.potsSolved >= POTS_ROUNDS_PER_LEVEL * POTS_LEVELS.length }
];

export function gameOf(s: Sticker): StickerGame {
  return STICKER_GAMES.find((g) => g.id === s.game)!;
}

export function earnedStickers(p: Progress): Sticker[] {
  return STICKERS.filter((s) => s.earned(p));
}

/** Stickers earned but not celebrated yet, in album order; with a world, only that world's (each pops on its own home screen). */
export function newStickers(p: Progress, world?: WorldId): Sticker[] {
  return earnedStickers(p).filter((s) => !p.stickersSeen.includes(s.id) && (!world || gameOf(s).world === world));
}

export function markStickerSeen(p: Progress, id: string): Progress {
  return p.stickersSeen.includes(id) ? p : { ...p, stickersSeen: [...p.stickersSeen, id] };
}

/**
 * Counts every sticker earned so far as celebrated, without the animation. Used when progress jumps
 * without the child playing for it (older saves, a parent choosing a starting level), so the child
 * is only ever celebrated for what they did.
 */
export function markEarnedSeen(p: Progress): Progress {
  const fresh = newStickers(p);
  return fresh.length === 0 ? p : { ...p, stickersSeen: [...p.stickersSeen, ...fresh.map((s) => s.id)] };
}

import { describe, expect, it } from 'vitest';
import { ADD_LEVELS } from '../worlds/garden/games/add/logic';
import { SORT_LEVELS } from '../worlds/robot/games/sort';
import { LADDER_LEVELS, LADDER_RULES, afterSolve, ladderOf, startAt, withLadder, type LadderGame } from './ladder';
import { DEFAULT_PROGRESS, readProgress, type Progress } from './progress';
import { FRIENDS, PARTS } from './robotParts';
import { stickerRow } from './rewards';
import {
  BEDS,
  PLOT_BEDS,
  basketBerries,
  basketPears,
  canMake,
  emptyBeds,
  gardenFull,
  growAfter,
  make,
  openBeds,
  pantryCount,
  treatsOf,
  STICKERS,
  LEVEL_STICKERS,
  carryOverStickers,
  STICKER_GAMES,
  VISITORS,
  canPlant,
  earnedStickers,
  grownCount,
  markEarnedSeen,
  markPageDone,
  pageReward,
  markStickerSeen,
  newStickers,
  todaysStickers,
  newVisitor,
  visitorProgress,
  pagesDoneIn,
  plant,
  seedBalance
} from './rewards';

const withSeeds = (seeds: number, extra: Partial<Progress> = {}): Progress => ({ ...DEFAULT_PROGRESS, seeds, ...extra });

describe('Kiskert', () => {
  it('spends seeds from the balance but never lowers the seeds earned', () => {
    const p = plant(withSeeds(7), 0, 'flower');
    expect(p.seeds).toBe(7);
    expect(seedBalance(p)).toBe(4);
    expect(p.beds[0]).toEqual({ kind: 'flower', at: 0 });
    expect(p.beds).toHaveLength(BEDS);
  });

  it('does not plant without enough seeds, in a taken bed or outside the garden', () => {
    const p = withSeeds(5);
    expect(canPlant(p, 0, 'bush')).toBe(false);
    expect(plant(p, 0, 'bush')).toBe(p);
    const planted = plant(p, 0, 'flower');
    expect(plant(planted, 0, 'flower')).toBe(planted);
    expect(canPlant(withSeeds(50), BEDS, 'flower')).toBe(false);
  });

  it('grows a planting after a few more solved tasks', () => {
    const p = plant(withSeeds(3), 2, 'flower');
    expect(grownCount(p)).toBe(0);
    expect(grownCount({ ...p, gardenTasks: p.gardenTasks + growAfter('flower') - 1 })).toBe(0);
    expect(grownCount({ ...p, gardenTasks: p.gardenTasks + growAfter('flower') })).toBe(1);
  });

  it('grows bigger plants more slowly: flower, then bush, then tree', () => {
    expect(growAfter('flower')).toBeLessThan(growAfter('bush'));
    expect(growAfter('bush')).toBeLessThan(growAfter('tree'));
    let p = plant(plant(withSeeds(13), 0, 'flower'), 1, 'tree');
    p = { ...p, gardenTasks: p.gardenTasks + growAfter('flower') };
    expect(grownCount(p)).toBe(1);
    p = { ...p, gardenTasks: p.gardenTasks + growAfter('tree') - growAfter('flower') };
    expect(grownCount(p)).toBe(2);
  });

  it('brings each visitor once, in order, as the garden grows', () => {
    let p = withSeeds(100);
    for (let i = 0; i < VISITORS[0].after; i++) p = plant(p, i, 'flower');
    expect(newVisitor(p)).toBeNull();
    p = { ...p, gardenTasks: p.gardenTasks + growAfter('flower') };
    expect(newVisitor(p)?.id).toBe('hedgehog');
    p = { ...p, visitorsSeen: 1 };
    expect(newVisitor(p)).toBeNull();
  });

  it('shows the way to the next visitor: grown plants since the one before, and the ones still growing', () => {
    let p = withSeeds(100);
    expect(visitorProgress(p)).toEqual({ need: VISITORS[0].after, done: 0, coming: 0 });
    p = plant(plant(p, 0, 'flower'), 1, 'flower');
    expect(visitorProgress(p)).toEqual({ need: 3, done: 0, coming: 2 });
    p = plant({ ...p, gardenTasks: p.gardenTasks + growAfter('flower') }, 2, 'flower');
    expect(visitorProgress(p)).toEqual({ need: 3, done: 2, coming: 1 });
    // Süni came at 3 and was welcomed: the way to Katica (5) starts again from there.
    p = { ...plant({ ...p, gardenTasks: p.gardenTasks + growAfter('flower') }, 3, 'flower'), visitorsSeen: 1 };
    expect(visitorProgress(p)).toEqual({ need: VISITORS[1].after - VISITORS[0].after, done: 0, coming: 1 });
    expect(visitorProgress({ ...p, visitorsSeen: VISITORS.length })).toBeNull();
  });

  it('can reach every visitor within the beds', () => {
    expect(Math.max(...VISITORS.map((v) => v.after))).toBeLessThanOrEqual(BEDS);
  });
});

describe('Kiskert plots', () => {
  it('opens the second plot once every bed of the first is planted', () => {
    let p = withSeeds(100);
    expect(openBeds(p)).toBe(PLOT_BEDS);
    expect(canPlant(p, PLOT_BEDS, 'flower')).toBe(false);
    for (let i = 0; i < PLOT_BEDS - 1; i++) p = plant(p, i, 'flower');
    expect(openBeds(p)).toBe(PLOT_BEDS);
    p = plant(p, PLOT_BEDS - 1, 'flower');
    expect(openBeds(p)).toBe(BEDS);
    expect(emptyBeds(p)[0]).toBe(PLOT_BEDS);
    expect(canPlant(p, PLOT_BEDS, 'flower')).toBe(true);
    expect(gardenFull(p)).toBe(false);
  });

  it('is full only when both plots are planted', () => {
    let p = withSeeds(100);
    for (let i = 0; i < BEDS; i++) p = plant(p, i, 'flower');
    expect(gardenFull(p)).toBe(true);
    expect(emptyBeds(p)).toEqual([]);
  });
});

describe('Kamra', () => {
  const basket = (pears: number, berries: number, extra: Partial<Progress> = {}): Progress => ({ ...DEFAULT_PROGRESS, pears, berries, ...extra });

  it('makes fruit from the basket into a treat, keeping the fruit ever picked', () => {
    const p = make(basket(4, 1), 'compote');
    expect(treatsOf(p, 'compote')).toBe(1);
    expect(basketPears(p)).toBe(1);
    expect(basketBerries(p)).toBe(1);
    expect(p.pears).toBe(4);
    expect(pantryCount(p)).toBe(1);
  });

  it('does not make a treat without enough fruit', () => {
    const p = basket(2, 2);
    expect(canMake(p, 'jam')).toBe(false);
    expect(make(p, 'jam')).toBe(p);
    expect(treatsOf(make(p, 'pie'), 'pie')).toBe(1);
  });

  it('bakes the seed loaf only once the whole garden is planted', () => {
    let p = withSeeds(1000);
    expect(canMake(p, 'loaf')).toBe(false);
    for (let i = 0; i < BEDS; i++) p = plant(p, i, 'flower');
    expect(canMake(p, 'loaf')).toBe(true);
    const before = seedBalance(p);
    p = make(p, 'loaf');
    expect(seedBalance(p)).toBe(before - 5);
    expect(treatsOf(p, 'loaf')).toBe(1);
  });

  it('reads older saves without a pantry', () => {
    const old = readProgress({ pears: 3, berries: 2, stickersSeen: [] });
    expect(basketPears(old)).toBe(3);
    expect(pantryCount(old)).toBe(0);
  });
});

describe('stickers', () => {
  const solvedUpTo = (game: LadderGame, solvedTop: number, p: Progress = DEFAULT_PROGRESS): Progress =>
    withLadder(p, game, { ...ladderOf(p, game), level: solvedTop, reached: solvedTop, solvedTop });
  const ids = (p: Progress, game?: string) => earnedStickers(p).map((s) => s.id).filter((id) => !game || id.startsWith(`${game}-`));

  it('give every levelled game one sticker per level, with unique ids', () => {
    expect(new Set(STICKERS.map((s) => s.id)).size).toBe(STICKERS.length);
    for (const [game, levels] of Object.entries(LADDER_LEVELS) as [LadderGame, readonly unknown[]][]) {
      const own = LEVEL_STICKERS[game];
      expect(own).toHaveLength(levels.length);
      own.forEach((s, i) => expect(s.from).toBe(i));
      expect(STICKERS.filter((s) => s.game === game).map((s) => s.mark)).toEqual(own.map((s) => s.mark));
    }
    for (const game of ['learn', 'kiskert']) expect(STICKERS.filter((s) => s.game === game)).toHaveLength(3);
    expect(STICKERS.filter((s) => s.game === 'robotepito')).toHaveLength(5);
    for (const game of ['paper-garden', 'paper-robot']) expect(STICKERS.filter((s) => s.game === game).map((s) => s.mark)).toEqual(['1', '2', '3', '5', '8', '13', '21', '34', '55']);
  });

  it('keeps each world’s stickers to its own album page and home screen', () => {
    expect(STICKER_GAMES.filter((g) => g.world === 'robot').map((g) => g.id)).toEqual(['path', 'sort', 'scale', 'seq', 'mirror', 'code', 'fix', 'robotepito', 'paper-robot']);
    const p = solvedUpTo('path', 0, { ...DEFAULT_PROGRESS, learnSolved: 5 });
    expect(newStickers(p, 'garden').map((s) => s.id)).toEqual(['learn-5']);
    expect(newStickers(p, 'robot').map((s) => s.id)).toEqual(['path-szint-1']);
    expect(newStickers(p)).toHaveLength(2);
  });

  it('gives a level’s sticker with the first task solved on it', () => {
    expect(ids(DEFAULT_PROGRESS)).toEqual([]);
    expect(ids(solvedUpTo('sort', 0), 'sort')).toEqual(['sort-level-1']);
    expect(ids(solvedUpTo('sort', 2), 'sort')).toEqual(['sort-level-1', 'sort-level-2', 'sort-level-3']);
    expect(ids(solvedUpTo('sort', SORT_LEVELS.length - 1), 'sort')).toHaveLength(7);
    // A child who keeps needing help on the first level still has its sticker.
    expect(ids({ ...DEFAULT_PROGRESS, ladders: { water: { ...ladderOf(DEFAULT_PROGRESS, 'water'), solvedTop: 0, helpRun: 5 } } }, 'water')).toEqual(['water-level-1']);
  });

  it('gives the long ladders a sticker for every level too', () => {
    expect(ids(solvedUpTo('path', 1), 'path')).toEqual(['path-szint-1', 'path-szint-2']);
    expect(ids(solvedUpTo('path', 7), 'path')).toHaveLength(8);
    expect(ids(solvedUpTo('add', 4), 'add')).toEqual(['add-szint-1', 'add-szint-2', 'add-szint-3', 'add-szint-4', 'add-szint-5']);
    expect(ids(solvedUpTo('add', ADD_LEVELS.length - 1), 'add')).toHaveLength(ADD_LEVELS.length);
  });

  it('turns the old Méhkas and Robotút group stickers into the stickers of the levels done in them, once', () => {
    // Old Méhkas sticker 2 stood for levels 4–6; the child had done levels 1, 4 and 5. Old Robotút sticker 2 (levels 3–4) with neither done.
    const add = { ...ladderOf(DEFAULT_PROGRESS, 'add'), level: 4, reached: 4, solvedTop: 4, solved: [0, 3, 4] };
    const p = readProgress({ ...DEFAULT_PROGRESS, ladders: { add }, stickersSeen: ['add-level-1', 'add-level-2', 'path-level-2', 'learn-5'], stickersDay: '2026-11-07', stickersToday: ['add-level-2'] });
    expect(p.stickersSeen).toEqual(['add-szint-1', 'add-szint-4', 'add-szint-5', 'path-szint-3', 'learn-5']);
    expect(p.stickersToday).toEqual(['add-szint-4', 'add-szint-5']);
    expect(newStickers(p)).toEqual([]);
    expect(readProgress(p)).toEqual(p);
    // Level 6 done later: its own sticker pops.
    expect(newStickers(withLadder(p, 'add', { ...add, solved: [0, 3, 4, 5], solvedTop: 5 })).map((s) => s.id)).toEqual(['add-szint-6']);
  });

  it('gives Robotépítő stickers for the first part, the second robot and every robot friend', () => {
    const robot = (owned: string[], robot2Owned: string[] = []) => ids({ ...DEFAULT_PROGRESS, robotOwned: owned, robot2Owned }, 'robotepito');
    expect(robot([])).toEqual([]);
    // A starting part is not a new one.
    expect(robot(['head-round'])).toEqual([]);
    expect(robot(['head-square'])).toEqual(['robotepito-part']);
    const six = ['head-square', 'head-dome', 'head-ears', 'antenna-spring', 'antenna-star', 'antenna-dish'];
    expect(robot(six)).toEqual(['robotepito-part', 'robotepito-second']);
    const all = PARTS.filter((part) => part.cost > 0).map((part) => part.id);
    expect(robot(all, all)).toEqual(['robotepito-part', 'robotepito-second', 'robotepito-friends']);
  });

  it('gives Robotépítő stickers for a gift to every friend and for the full shelf', () => {
    const all = PARTS.filter((part) => part.cost > 0).map((part) => part.id);
    const gifts = (n: number) => ids({ ...DEFAULT_PROGRESS, robotOwned: all, robot2Owned: all, friendGifts: Object.fromEntries(FRIENDS.map((f) => [f.id, n])) }, 'robotepito');
    expect(gifts(0)).not.toContain('robotepito-gifts');
    expect(gifts(1)).toContain('robotepito-gifts');
    expect(gifts(1)).not.toContain('robotepito-shelf');
    expect(gifts(5)).toEqual(['robotepito-part', 'robotepito-second', 'robotepito-friends', 'robotepito-gifts', 'robotepito-shelf']);
  });

  it('keeps a sticker that was stuck in, whatever happens to the level', () => {
    const p = { ...DEFAULT_PROGRESS, stickersSeen: ['scale-level-4'] };
    expect(ids(p)).toEqual(['scale-level-4']);
    expect(newStickers(p)).toEqual([]);
  });

  it('carries the stickers of the old hand-picked list over to their level stickers, once', () => {
    const p = readProgress({ stickersSeen: ['learn-5', 'path-plan', 'trace-9', 'trace-0', 'pots-mix'] });
    expect(p.stickersSeen).toEqual(['learn-5', 'path-plan', 'trace-9', 'trace-0', 'pots-mix', 'path-szint-3', 'trace-level-2', 'pots-level-3']);
    expect(ids(p)).toEqual(['learn-5', 'trace-level-2', 'pots-level-3', 'path-szint-3']);
    expect(newStickers(p)).toEqual([]);
    expect(readProgress(p)).toEqual(p);
  });

  it('has a level sticker for every sticker of the old list', () => {
    const old = ['water-1', 'water-10', 'water-20', 'patterns-ab', 'patterns-abc', 'patterns-all', 'flash-3', 'flash-5', 'flash-10', 'add-5', 'add-10', 'add-100', 'trace-5', 'trace-9', 'trace-0', 'trace-fade', 'trace-memory', 'pots-5', 'pots-10', 'pots-mix']
      .concat(...['path', 'sort', 'scale', 'seq', 'mirror', 'code', 'fix'].map((g) => [`${g}-first`]))
      .concat(['path-plan', 'path-turn', 'path-repeat', 'path-two', 'sort-shape', 'sort-odd', 'sort-two', 'sort-rule', 'scale-even', 'scale-two', 'scale-missing', 'scale-secret'])
      .concat(['seq-both', 'seq-turn', 'seq-fix', 'seq-translate', 'mirror-picture', 'mirror-flat', 'mirror-pick', 'mirror-fix', 'code-key', 'code-dots', 'code-send', 'code-crack', 'fix-crates', 'fix-times', 'fix-turn', 'fix-two']);
    for (const id of old) expect(carryOverStickers({ ...DEFAULT_PROGRESS, stickersSeen: [id] }).stickersSeen, id).toHaveLength(2);
  });

  it('keeps the old fifteen-page Feladatlapok sticker as the thirteen-page one', () => {
    for (const world of ['garden', 'robot']) {
      const p = carryOverStickers({ ...DEFAULT_PROGRESS, stickersSeen: [`paper-${world}-15`] });
      expect(earnedStickers(p).map((s) => s.id)).toEqual([1, 2, 3, 5, 8, 13].map((n) => `paper-${world}-${n}`));
    }
  });

  it('does not celebrate the new Feladatlapok steps below a sticker the child already has', () => {
    const pages = (n: number) => Array.from({ length: n }, (_, i) => `learn.1.0.n.7.${i}`);
    const old = (n: number, seen: string[]) => carryOverStickers({ ...DEFAULT_PROGRESS, pagesDone: pages(n), stickersSeen: seen });
    const paperNew = (p: Progress) => newStickers(p).filter((s) => s.game === 'paper-garden').map((s) => s.id);
    expect(paperNew(old(6, ['paper-garden-1', 'paper-garden-5']))).toEqual([]);
    expect(paperNew(old(16, ['paper-garden-1', 'paper-garden-5', 'paper-garden-15']))).toEqual([]);
    // Steps above the last sticker stuck in still pop, as do steps not earned yet once they are.
    expect(paperNew(old(9, ['paper-garden-1', 'paper-garden-5']))).toEqual(['paper-garden-8']);
    expect(paperNew(old(3, ['paper-garden-1']))).toEqual(['paper-garden-3', 'paper-garden-2']);
  });

  it('leaves the stickers of a save from before the ladders in place', () => {
    const old = { ...DEFAULT_PROGRESS, waterRound: 18, garden: Array<string>(18).fill('tulipan'), patternRound: 4, patternsSolved: 4, traceRound: 20, traceSolved: 20, traceFadedSolved: 10 };
    expect(ids(old)).toEqual(expect.arrayContaining(['water-level-1', 'water-level-2', 'water-level-3', 'patterns-level-1', 'trace-level-1', 'trace-level-2']));
  });

  it('celebrates each new sticker once', () => {
    let p: Progress = { ...DEFAULT_PROGRESS, learnSolved: 5 };
    expect(newStickers(p).map((s) => s.id)).toEqual(['learn-5']);
    p = markStickerSeen(p, 'learn-5');
    expect(newStickers(p)).toEqual([]);
    expect(markStickerSeen(p, 'learn-5')).toBe(p);
  });

  it('lists the day’s stickers newest first, the uncelebrated ones before the rest', () => {
    let p: Progress = { ...DEFAULT_PROGRESS, learnSolved: 5 };
    p = markStickerSeen(p, 'learn-5', '2026-11-06');
    expect(todaysStickers(p, '2026-11-07')).toEqual([]);
    p = solvedUpTo('path', 0, { ...p, learnSolved: 10 });
    p = markStickerSeen(p, 'learn-10', '2026-11-07');
    expect(todaysStickers(p, '2026-11-07').map((s) => s.id)).toEqual(['path-szint-1', 'learn-10']);
    p = markStickerSeen(p, 'path-szint-1', '2026-11-07');
    expect(p.stickersToday).toEqual(['learn-10', 'path-szint-1']);
    expect(todaysStickers(p, '2026-11-07').map((s) => s.id)).toEqual(['path-szint-1', 'learn-10']);
  });

  it('files away stickers from a jump in progress without a celebration', () => {
    const p = markEarnedSeen({ ...DEFAULT_PROGRESS, potsSolved: 10 });
    expect(earnedStickers(p)).toHaveLength(2);
    expect(newStickers(p)).toEqual([]);
  });

  it('files away what an older save had earned, but keeps newer saves as they are', () => {
    const old = readProgress({ seeds: 12, learnSolved: 10 });
    expect(newStickers(old)).toEqual([]);
    expect(seedBalance(old)).toBe(12);
    const current = readProgress({ learnSolved: 10, stickersSeen: [] });
    expect(newStickers(current).map((s) => s.id)).toEqual(['learn-10', 'learn-5']);
  });

  it('gives Feladatlapok stickers for pages marked done, on the page’s own world', () => {
    const pages = (game: string, n: number) => Array.from({ length: n }, (_, i) => `${game}.1.0.n.7.${i}`);
    const mark = (keys: string[]) => keys.reduce((p, key) => markPageDone(p, key, 1), DEFAULT_PROGRESS);
    const isPaper = (s: { game: string }) => s.game.startsWith('paper-');
    const paper = (keys: string[]) => earnedStickers(mark(keys)).filter(isPaper).map((s) => s.id);
    expect(paper(pages('learn', 1))).toEqual(['paper-garden-1']);
    expect(paper(pages('code', 1))).toEqual(['paper-robot-1']);
    expect(paper(pages('learn', 4))).toEqual(['paper-garden-1', 'paper-garden-2', 'paper-garden-3']);
    expect(paper([...pages('learn', 3), ...pages('water', 2)])).toEqual(['paper-garden-1', 'paper-garden-2', 'paper-garden-3', 'paper-garden-5']);
    expect(paper(pages('fix', 15))).toEqual(['paper-robot-1', 'paper-robot-2', 'paper-robot-3', 'paper-robot-5', 'paper-robot-8', 'paper-robot-13']);
    expect(paper(pages('fix', 55)).at(-1)).toBe('paper-robot-55');
    expect(newStickers(mark(pages('code', 1)), 'robot').filter(isPaper).map((s) => s.id)).toEqual(['paper-robot-1']);
    expect(newStickers(mark(pages('code', 1)), 'garden')).toEqual([]);
  });

  it('gives a finished sheet the game’s own sticker for the level it was printed on', () => {
    const game = (key: string, g: string) => earnedStickers(markPageDone(DEFAULT_PROGRESS, key, 1)).filter((s) => s.game === g).map((s) => s.id);
    // Level as printed: the third part of the page key.
    expect(game('code.1.0.n.7.0', 'code')).toEqual(['code-level-1']);
    // Only its own level: a higher sheet does not earn the stickers below it.
    expect(game('code.1.2.n.7.0', 'code')).toEqual(['code-level-3']);
    expect(game('add.1.3.n.7.0', 'add')).toEqual(['add-szint-4']);
    expect(game('add.1.4.n.7.0', 'add')).toEqual(['add-szint-5']);
    // Sheets whose levels are not the game's own.
    expect(game('water.1.0.n.7.0', 'water')).toEqual(['water-level-1', 'water-level-2']);
    expect(game('water.1.1.n.7.0', 'water')).toEqual(['water-level-3']);
    expect(game('patterns.1.3.n.7.0', 'patterns')).toEqual(['patterns-level-3']);
    expect(game('patterns.1.4.n.7.0', 'patterns')).toEqual(['patterns-level-4']);
    expect(game('trace.1.2.n.7.0', 'trace')).toEqual(['trace-level-3', 'trace-level-4']);
    expect(game('learn.1.0.n.7.0', 'learn')).toEqual(['learn-5']);
    expect(game('learn.1.1.n.7.0', 'learn')).toEqual(['learn-10']);
    expect(game('learn.1.2.n.7.0', 'learn')).toEqual([]);
    expect(game('learn.1.3.n.7.0', 'learn')).toEqual(['learn-20']);
    // It pops on the game's own world, with the Feladatlapok sticker.
    expect(newStickers(markPageDone(DEFAULT_PROGRESS, 'path.1.0.n.7.0', 1), 'robot').map((s) => s.id)).toEqual(['path-szint-1', 'paper-robot-1']);
    // Sheets done in any order: each earns its own, and the row's top new one pops first.
    const both = markPageDone(markPageDone(DEFAULT_PROGRESS, 'patterns.1.4.n.7.0', 1), 'patterns.1.0.n.7.0', 1);
    expect(newStickers(both, 'garden').map((s) => s.id)).toEqual(['patterns-level-4', 'patterns-level-1', 'paper-garden-2', 'paper-garden-1']);
  });

  it('wants each level solved in the game for its sticker, in any order', () => {
    const game = (p: Progress) => earnedStickers(p).filter((s) => s.game === 'patterns').map((s) => s.id);
    // Solved on level 3 only (a parent started the child there): only that level's sticker.
    const started = withLadder(DEFAULT_PROGRESS, 'patterns', startAt(ladderOf(DEFAULT_PROGRESS, 'patterns'), 3));
    expect(game(started)).toEqual([]);
    const solved = withLadder(started, 'patterns', afterSolve(ladderOf(started, 'patterns'), LADDER_RULES.patterns, false).ladder);
    expect(game(solved)).toEqual(['patterns-level-4']);
    // A save from before the solved list: every level up to the highest solved one counts.
    expect(game(solvedUpTo('patterns', 2))).toEqual(['patterns-level-1', 'patterns-level-2', 'patterns-level-3']);
  });

  it('counts a marked page once, and fills only its own world’s reward pod with its tasks', () => {
    const once = markPageDone(DEFAULT_PROGRESS, 'learn.1.0.n.7.0', 9);
    expect(markPageDone(once, 'learn.1.0.n.7.0', 9)).toBe(once);
    expect(pagesDoneIn(once, 'garden')).toBe(1);
    expect(once).toEqual({ ...DEFAULT_PROGRESS, pagesDone: ['learn.1.0.n.7.0'], gardenTasks: 9, seeds: 4 });
    expect(markPageDone(DEFAULT_PROGRESS, 'code.1.0.b.3.1', 4)).toEqual({ ...DEFAULT_PROGRESS, pagesDone: ['code.1.0.b.3.1'], robotTasks: 4, bolts: 1 });
    // A part-filled pod: half of it full already, so a two-task page pays one.
    const filled = { ...DEFAULT_PROGRESS, gardenTasks: 3 };
    expect(pageReward(filled, 'water.1.0.n.7.0', 2)).toEqual({ seeds: 1, bolts: 0 });
    expect(markPageDone(filled, 'water.1.0.n.7.0', 2)).toMatchObject({ gardenTasks: 5, seeds: 1 });
  });

  it('starts the task clocks of older saves from the seeds and bolts they earned one per task', () => {
    expect(readProgress({ seeds: 30, bolts: 12, stickersSeen: [] })).toMatchObject({ seeds: 30, gardenTasks: 30, bolts: 12, robotTasks: 12 });
    expect(readProgress({ seeds: 30, gardenTasks: 41, stickersSeen: [] }).gardenTasks).toBe(41);
  });

  it('starts older saves with no pages done', () => {
    expect(readProgress({ seeds: 3 }).pagesDone).toEqual([]);
  });
});

describe('stickerRow (the Jutalmak page)', () => {
  it('counts a game row and names the next sticker with the ladder level it stands for', () => {
    const fresh = stickerRow(DEFAULT_PROGRESS, 'water');
    expect(fresh).toMatchObject({ earned: 0, total: LEVEL_STICKERS.water.length });
    expect(fresh.next?.id).toBe('water-level-1');
    expect(fresh.next?.level).toBe(0);

    const p = withLadder(DEFAULT_PROGRESS, 'water', { ...ladderOf(DEFAULT_PROGRESS, 'water'), level: 2, reached: 2, solvedTop: 2 });
    const row = stickerRow(p, 'water');
    expect(row.earned).toBe(3);
    expect(row.next?.level).toBe(3);
    expect(LADDER_LEVELS.water[row.next!.level!].name).toBeTruthy();
  });

  it('every level sticker points at a real ladder level, and other rows have none', () => {
    for (const s of STICKERS) {
      if (s.game in LEVEL_STICKERS) expect(LADDER_LEVELS[s.game as LadderGame][s.level!]).toBeDefined();
      else expect(s.level).toBeUndefined();
    }
  });

  it('has no next sticker once the row is full', () => {
    const p = { ...DEFAULT_PROGRESS, stickersSeen: STICKERS.filter((s) => s.game === 'kiskert').map((s) => s.id) };
    expect(stickerRow(p, 'kiskert')).toMatchObject({ earned: 3, total: 3, next: null });
  });
});

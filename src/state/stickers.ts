import { LEARN_MAX } from '../worlds/garden/games/learn/logic';
import { GAMES, gamesIn, type GameId } from './games';
import { GAME_DEFS, LADDER_DEFS } from '../worlds/defs';
import type { LevelSticker } from '../worlds/types';
import type { Progress } from './progress';
import { WORLD_IDS, type WorldId } from './worlds';
import { LADDER_LEVELS, LADDER_RULES, afterPage, type Ladder, type PageStep, clearedLevels, ladderOf, solvedLevels, tallyOf, withLadder, type LadderGame } from './ladder';
import { FRIENDS, FRIEND_GIFTS_EACH, boughtCount, friendGiftCount, friendGiftsOf, friendsOf, secondRobotOpen } from './robotParts';
import { creditTasks, paidFor } from './pod';
import { today } from './screenTime';
import { VISITORS, decorCount, gardenDone, giftsOf } from './garden';
import { BUILDINGS, STAGES, builtCount, giftCount, giftsOf as townGiftsOf, stageOf, upgradeCount } from './town';

// The sticker album: a row per game and per reward place, level stickers, finished paper sheets, and which are new.

// ---------- stickers ----------

/** Each world's reward place (Kiskert, Robotépítő) and finished paper sheets have album rows of their own, next to the games. */
export type StickerGameId = GameId | 'kiskert' | 'robotepito' | 'kisvaros' | 'paper-garden' | 'paper-robot' | 'paper-tower';

export interface Sticker {
  id: string;
  game: StickerGameId;
  /** Printed on the sticker. */
  mark: string;
  label: string;
  /** Csepi's line when it is collected. */
  praise: string;
  earned: (p: Progress) => boolean;
  /** Feladatlapok stickers carry a drawn sheet under the mark: one page, or a stack once there are five or more. */
  sheets?: 'one' | 'stack';
  /** The last sticker of a row, with a gold ring. */
  gold?: boolean;
  /** Level stickers: the first ladder level (0-based) it stands for, whose name tells grown-ups the skill. */
  level?: number;
}

export interface StickerGame {
  id: StickerGameId;
  name: string;
  color: string;
  ink: string;
  /** The world whose album page the game is on. */
  world: WorldId;
}

/** A game's album row: name, world and sticker colours from the game list and its definition. */
function gameRow(id: GameId): StickerGame {
  const { color, ink, albumName } = GAME_DEFS[id].look;
  return { id, name: albumName ?? GAMES[id].name, color, ink, world: GAMES[id].world };
}

/** Each world's reward place and its finished paper sheets: album rows after the world's games. */
const PLACE_ROWS: Record<WorldId, StickerGame[]> = {
  garden: [
    { id: 'kiskert', name: 'Kiskert', color: '#7A4FB5', ink: '#FFFFFF', world: 'garden' },
    { id: 'paper-garden', name: 'Feladat­lapok', color: '#F3E3B3', ink: '#10233A', world: 'garden' }
  ],
  robot: [
    { id: 'robotepito', name: 'Robot­építő', color: '#7A4FB5', ink: '#FFFFFF', world: 'robot' },
    { id: 'paper-robot', name: 'Feladat­lapok', color: '#D5DEE6', ink: '#10233A', world: 'robot' }
  ],
  tower: [
    { id: 'kisvaros', name: 'Kisváros', color: '#C8553D', ink: '#FFFFFF', world: 'tower' },
    { id: 'paper-tower', name: 'Feladat­lapok', color: '#E3DEF5', ink: '#10233A', world: 'tower' }
  ]
};

/** Album order: each world's games in hub order, then its reward place and paper sheets. */
export const STICKER_GAMES: StickerGame[] = WORLD_IDS.flatMap((w) => [...gamesIn(w).map((g) => gameRow(g.id)), ...PLACE_ROWS[w]]);

/** Pages done from this world's games: a sticker waits on the page's own world, like the game's. */
export function pagesDoneIn(p: Progress, world: WorldId): number {
  return p.pagesDone.filter((key) => pageWorld(key) === world).length;
}

/** A sheet's world: its game's, or the world named in a Vegyes kör sheet's id (mixgarden). */
function sheetWorld(id: string): WorldId | undefined {
  return STICKER_GAMES.find((g) => g.id === id)?.world ?? WORLD_IDS.find((w) => id === `mix${w}`);
}

function pageWorld(key: string): WorldId | undefined {
  return sheetWorld(key.split('.')[0]);
}

/** What a finished page of `tasks` tasks pays now: its tasks fill the reward pod like solved tasks in its world's games. */
export function pageReward(p: Progress, key: string, tasks: number): number {
  const world = pageWorld(key);
  return world ? paidFor(p, world, tasks) : 0;
}

/** Where a page's right answers are counted: its game's sheets of one level (`id.rev.level`), page after page. */
const levelKey = (key: string) => key.split('.').slice(0, 3).join('.');

/**
 * Right answers on a sheet level's pages that earn its sticker: STICKER_TASKS, as tasks solved on a level do in the game.
 * Null for a game with no ladder (Számmagok): there, as in the game, every number done counts, so finishing the page is enough.
 */
export function sheetNeed(key: string): number | null {
  return isLadderGame(key.split('.')[0] as StickerGameId) ? STICKER_TASKS : null;
}

/** What a page's answers do: the right answers on its level so far (with the earlier pages'), and whether that is enough. */
export interface PageTally {
  need: number | null;
  /** Right answers on the level's pages before this one. */
  from: number;
  /** With this page's right answers. */
  to: number;
  /** Enough right answers for the level's sticker. Always true where none are needed. */
  cleared: boolean;
}

/**
 * Counts a page's right answers onto its level's, as the game counts tasks solved on a level. Wrong ones count for
 * nothing (on paper there was no help to finish them), and unchecked ones (null) are never guessed.
 */
export function pageTally(p: Progress, key: string, right: (boolean | null)[]): PageTally {
  const need = sheetNeed(key);
  if (need === null) return { need, from: 0, to: 0, cleared: true };
  const from = p.sheetRight[levelKey(key)] ?? 0;
  const to = from + right.filter((r) => r === true).length;
  return { need, from, to, cleared: to >= need };
}

/**
 * A grown-up checked a finished page, answer by answer (`right`). It counts once, and its answers count on the game's
 * ladder, where paper only ever moves the child up (see `pageLevelStep`). All its tasks
 * fill the reward pod (see `pageReward`), as every task done does in the game, and it counts towards the Feladatlapok
 * stickers. Its level's own sticker comes as in the game: once STICKER_TASKS answers on that level's pages were right,
 * on this page or with the earlier ones. Until then the page goes into `pagesPractised`. There is no taking it back:
 * a sticker that has been stuck in stays.
 */
export function markPageDone(p: Progress, key: string, right: boolean[]): Progress {
  if (p.pagesDone.includes(key)) return p;
  const world = pageWorld(key);
  const tally = pageTally(p, key, right);
  const done: Progress = {
    ...p,
    pagesDone: [...p.pagesDone, key],
    pagesPractised: tally.cleared ? p.pagesPractised : [...p.pagesPractised, key],
    sheetRight: tally.need === null ? p.sheetRight : { ...p.sheetRight, [levelKey(key)]: tally.to }
  };
  const page = pageLadder(p, key, right);
  const leveled = page ? withLadder(done, page.game, page.step.ladder) : done;
  return world ? creditTasks(leveled, world, right.length) : leveled;
}

/** A page's step up on its game's ladder: the game, the levels before and after, and the new level's name. */
export interface PageLevelStep {
  game: LadderGame;
  change: 'up' | 'mastered';
  /** 0-based levels, before and after the page. */
  from: number;
  to: number;
  /** The level's name the child plays on now, for the grown-up; on mastering, the top level's. */
  name: string;
}

/** A page's game and what its answers do on that game's ladder (see `afterPage`); null for Számmagok and old joined sheets. */
function pageLadder(p: Progress, key: string, right: boolean[]): { game: LadderGame; before: Ladder; step: PageStep } | null {
  const [id, rev, sheet] = key.split('.');
  if (!isLadderGame(id as StickerGameId)) return null;
  const game = id as LadderGame;
  // Only a page printed on one ladder level counts; old sheets that joined several levels never move the child.
  const levels = ladderLevelsOf(game, Number(rev), Number(sheet));
  if (levels.length !== 1) return null;
  const before = ladderOf(p, game);
  return { game, before, step: afterPage(before, LADDER_RULES[game], levels[0], right) };
}

/** The step up a checked page brings on its game's ladder, for the grown-up's summary; null when it brings none. */
export function pageLevelStep(p: Progress, key: string, right: boolean[]): PageLevelStep | null {
  const page = pageLadder(p, key, right);
  const change = page?.step.change;
  if (!page || !change) return null;
  const { game, before, step } = page;
  const names = LADDER_LEVELS[game];
  return { game, change, from: before.level, to: step.ladder.level, name: names[step.ladder.level].name };
}

/** Feladatlapok stickers: pages done in a world. */
const pagesIn = (world: WorldId, count: number) => (p: Progress) => pagesDoneIn(p, world) >= count;

/** The sheet levels (0-based, as in the page key) of this game with a page marked done, with the revision each was printed from. */
function sheetsDone(p: Progress, game: GameId): { key: string; rev: number; level: number }[] {
  return p.pagesDone.flatMap((key) => {
    const [id, rev, level] = key.split('.');
    return id === game ? [{ key, rev: Number(rev), level: Number(level) }] : [];
  });
}

/**
 * The ladder levels each printed sheet level stood for on the revisions whose sheets were not the game's own levels:
 * a sheet joined or split some levels (Locsolás's first sheet was both small-drop levels, Virágsor had no sheet for
 * AABB or the bunches, Mézút's faded sheet had all ten digits). `before` is the first revision with a sheet for every
 * level. A page done keeps its revision in its key, so an old page still earns what it earned when it was printed.
 */
const OLD_SHEET_LADDER: Partial<Record<LadderGame, { before: number; levels: number[][] }>> = {
  water: { before: 3, levels: [[0, 1], [2]] },
  patterns: { before: 3, levels: [[0], [1], [2], [2], [3], [7], [8], [9]] },
  trace: { before: 2, levels: [[0], [1], [2, 3, 4]] }
};

/** The ladder levels of today's sheets, where they are not one sheet a level: Virágsor prints AAB and ABB apart. */
export const SHEET_LADDER: Partial<Record<LadderGame, number[][]>> = {
  patterns: [[0], [1], [2], [2], [3], [4], [5], [6], [7], [8], [9]]
};

/** The ladder levels one printed sheet level stands for, on the revision it was printed from. */
function ladderLevelsOf(game: LadderGame, rev: number, level: number): number[] {
  const old = OLD_SHEET_LADDER[game];
  return (old && rev < old.before ? old.levels : SHEET_LADDER[game])?.[level] ?? [level];
}

/**
 * The ladder levels done on paper: those of the pages that brought enough right answers (see `markPageDone`). Pages
 * marked before the answers were checked are not in `pagesPractised`, so they keep the stickers they earned then.
 */
function sheetLevels(p: Progress, game: LadderGame): number[] {
  return sheetsDone(p, game)
    .filter(({ key }) => !p.pagesPractised.includes(key))
    .flatMap(({ rev, level }) => ladderLevelsOf(game, rev, level));
}

/**
 * Tasks solved on a level, helped or not, that earn its sticker even before the level is finished: so a child
 * who keeps needing help there still gets it in the end, but not for a single task.
 */
export const STICKER_TASKS = 4;

/**
 * A game's level stickers, easiest first: one per level, so every level done (in the game or on a sheet) has a
 * sticker of its own. `from` is the level (0-based) the sticker stands for: it is earned when that level is
 * finished (stepped up from, or the top one mastered), or once STICKER_TASKS tasks were solved on it. `legacy`
 * names the stickers of the old hand-picked list it replaces.
 */

/**
 * Méhkas and Robotút once had one sticker per few levels (no more than seven a row). Their per-level stickers
 * carry new ids, so an old `add-level-n` in a save always means the old group, never a level: the old groups'
 * first levels, by sticker.
 */
const REGROUPED: Partial<Record<LadderGame, number[]>> = {
  add: [0, 3, 6, 8, 10, 12, 14],
  path: [0, 2, 4, 5, 6, 8, 9]
};

/** A level sticker's id: its number (from 1) in the game's row. */
function levelStickerId(game: LadderGame, i: number): string {
  return `${game}-${REGROUPED[game] ? 'szint' : 'level'}-${i + 1}`;
}

export const LEVEL_STICKERS = Object.fromEntries(Object.entries(LADDER_DEFS).map(([g, d]) => [g, d.stickers])) as Record<LadderGame, readonly LevelSticker[]>;

const LADDER_GAMES = Object.keys(LEVEL_STICKERS) as LadderGame[];

const isLadderGame = (id: StickerGameId): id is LadderGame => (LADDER_GAMES as string[]).includes(id);

/**
 * A game's level stickers: number n (from 1) stands for its level on the ladder (from its `from` up to the next
 * sticker's). It wants that very level done, in the game or on a finished sheet, in any order: a higher level
 * done does not earn the stickers below it, but always earns its own.
 */
function levelStickers(game: LadderGame): Sticker[] {
  const rows = LEVEL_STICKERS[game];
  return rows.map((s, i) => ({
    id: levelStickerId(game, i),
    game,
    mark: s.mark,
    label: s.label,
    praise: s.praise,
    level: s.from,
    earned: (p: Progress) => {
      const to = rows[i + 1]?.from ?? LADDER_RULES[game].levels;
      const inRow = (level: number) => level >= s.from && level < to;
      const l = ladderOf(p, game);
      const played = (level: number) => inRow(level) && tallyOf(l, level) >= STICKER_TASKS;
      return clearedLevels(l).some(inRow) || Array.from({ length: to - s.from }, (_, k) => s.from + k).some(played) || sheetLevels(p, game).some(inRow);
    }
  }));
}

/** Számmagok's sheet levels start at 1, 6, 11 and 16, then Vegyesen (1–20): a finished page of one of `levels` earns its sticker. */
const learnSheet =
  (...levels: number[]) =>
  (p: Progress) =>
    sheetsDone(p, 'learn').some((d) => levels.includes(d.level));

/**
 * Számmagok has no ladder: its stickers count the numbers the child knows, in the game or on a finished sheet.
 * The reward places count what was done.
 */
const OTHER_STICKERS: Sticker[] = [
  { id: 'learn-5', game: 'learn', mark: '1–5', label: 'Ismerem 5-ig', praise: 'Már ötig ismered a számokat!', earned: (p) => p.games.learn.solved >= 5 || learnSheet(0)(p) },
  { id: 'learn-10', game: 'learn', mark: '1–10', label: 'Ismerem 10-ig', praise: 'Már tízig ismered a számokat!', earned: (p) => p.games.learn.solved >= 10 || learnSheet(1)(p) },
  { id: 'learn-20', game: 'learn', mark: '1–20', label: 'Ismerem 20-ig', praise: 'Már húszig ismered a számokat!', earned: (p) => p.games.learn.solved >= LEARN_MAX || learnSheet(3, 4)(p) },
  { id: 'learn-mix', game: 'learn', mark: '?', label: 'Vegyesen is', praise: 'Összekeverve is felismered a számokat!', earned: (p) => p.learnMixSolved >= 1 },
  { id: 'kiskert-gift', game: 'kiskert', mark: '1', label: 'Első ajándék', praise: 'Megajándékoztad az első lakót a kertedben!', earned: (p) => decorCount(p) >= 1 },
  { id: 'kiskert-all', game: 'kiskert', mark: '12', label: 'Minden lakónak', praise: 'Mind a tizenkét lakó kapott tőled ajándékot!', earned: (p) => VISITORS.every((v) => giftsOf(p, v.id) >= 1) },
  { id: 'kiskert-done', game: 'kiskert', mark: '60', label: 'Kész a kert', praise: 'Kész a kert! Minden lakó megkapta az ajándékát.', earned: gardenDone },
  { id: 'robotepito-part', game: 'robotepito', mark: '1', label: 'Első alkatrész', praise: 'Felszerelted az első új alkatrészt a robotodra!', earned: (p) => boughtCount(p) >= 1 },
  { id: 'robotepito-second', game: 'robotepito', mark: '2', label: 'Második robot', praise: 'Megérkezett a második robotod a munkapadra!', earned: secondRobotOpen },
  { id: 'robotepito-friends', game: 'robotepito', mark: '6', label: 'Minden barát', praise: 'Mind a hat robotbarát beköltözött a műhelybe!', earned: (p) => friendsOf(p).length === FRIENDS.length },
  { id: 'robotepito-gifts', game: 'robotepito', mark: '♥', label: 'Minden barátnak', praise: 'Mind a hat robotbarát kapott tőled ajándékot!', earned: (p) => FRIENDS.every((f) => friendGiftsOf(p, f.id) >= 1) },
  { id: 'kisvaros-first', game: 'kisvaros', mark: '1', label: 'Első ház', praise: 'Felépült az első ház a Kisvárosban!', earned: (p) => builtCount(p) >= 1 },
  { id: 'kisvaros-half', game: 'kisvaros', mark: '5', label: 'Fél város', praise: 'Már öt épület áll a Kisvárosban!', earned: (p) => builtCount(p) >= 5 },
  { id: 'kisvaros-all', game: 'kisvaros', mark: String(BUILDINGS.length), label: 'Kész a város', praise: 'Kész a Kisváros! Minden épület áll, és jár a toronyóra.', earned: (p) => builtCount(p) >= BUILDINGS.length },
  { id: 'kisvaros-gift', game: 'kisvaros', mark: '♥', label: 'Első ajándék', praise: 'Megajándékoztad az első lakót a Kisvárosban!', earned: (p) => giftCount(p) >= 1 },
  { id: 'kisvaros-every', game: 'kisvaros', mark: '10♥', label: 'Minden lakónak', praise: 'Mind a tíz lakó kapott tőled ajándékot!', earned: (p) => BUILDINGS.every((b) => townGiftsOf(p, b.id) >= 1) },
  { id: 'kisvaros-upgrade', game: 'kisvaros', mark: '↑', label: 'Első bővítés', praise: 'Kibővítetted az első házat!', earned: (p) => upgradeCount(p) >= 1 },
  { id: 'kisvaros-festive', game: 'kisvaros', mark: '★', label: 'Díszváros', praise: 'Minden ház a legszebb lett! Zászlók lengenek az egész Kisvárosban.', earned: (p) => BUILDINGS.every((b) => stageOf(p, b.id) === STAGES) },
  { id: 'robotepito-shelf', game: 'robotepito', mark: '30', label: 'Teli polc', praise: 'Teli a polc! Minden robotbarát megkapta mind az öt ajándékát.', earned: (p) => friendGiftCount(p) === FRIENDS.length * FRIEND_GIFTS_EACH }
];

/** Pages done for each Feladatlapok sticker: the Fibonacci numbers, so the first ones come quickly and the later ones ask for a little more each time. */
export const PAGE_STEPS = [1, 2, 3, 5, 8, 13, 21, 34, 55];

const PAGE_WORDS: Record<number, string> = {
  2: 'két',
  3: 'három',
  5: 'öt',
  8: 'nyolc',
  13: 'tizenhárom',
  21: 'huszonegy',
  34: 'harmincnégy',
  55: 'ötvenöt'
};

const capital = (word: string) => word[0].toUpperCase() + word.slice(1);

/** A world's Feladatlapok stickers, one per step in PAGE_STEPS. */
function pageStickers(world: WorldId): Sticker[] {
  const game: StickerGameId = `paper-${world}`;
  return PAGE_STEPS.map((n, i) => {
    const last = i === PAGE_STEPS.length - 1;
    const word = PAGE_WORDS[n];
    return {
      id: `${game}-${n}`,
      game,
      mark: String(n),
      label: n === 1 ? 'Első lap' : `${capital(word)} lap`,
      praise: n === 1 ? 'Kész az első feladatlapod!' : last ? `${capital(word)} feladatlap! Igazi lapgyűjtő vagy!` : `Már ${word} feladatlapot befejeztél!`,
      earned: pagesIn(world, n),
      sheets: n < 5 ? 'one' : 'stack',
      gold: last
    };
  });
}

const PAGE_STICKERS = WORLD_IDS.flatMap((w) => pageStickers(w));

/** Every sticker, in album order. */
export const STICKERS: Sticker[] = STICKER_GAMES.flatMap(({ id }) =>
  isLadderGame(id) ? levelStickers(id) : [...OTHER_STICKERS, ...PAGE_STICKERS].filter((s) => s.game === id)
);

/** The level sticker that took the place of each sticker of the old hand-picked list. */
const LEGACY_STICKERS: Record<string, string> = {
  ...Object.fromEntries(
    LADDER_GAMES.flatMap((game) => LEVEL_STICKERS[game].flatMap((s, i) => (s.legacy ?? []).map((old) => [old, levelStickerId(game, i)])))
  ),
  // The old fifteen-page Feladatlapok sticker: its place went to thirteen pages.
  'paper-garden-15': 'paper-garden-13',
  'paper-robot-15': 'paper-robot-13'
};

/**
 * Saves from before the level stickers (or the Fibonacci Feladatlapok row): a sticker the child had stuck in stays, as the sticker that took
 * its place, even where that level has no solved task yet (the old list gave some for stepping onto a level).
 */
export function carryOverStickers(saved: Progress): Progress {
  const p = ungroupStickers(saved);
  const carried = [...new Set(p.stickersSeen.map((id) => LEGACY_STICKERS[id]).filter((id) => id && !p.stickersSeen.includes(id)))];
  const seen = [...p.stickersSeen, ...carried];
  // The Fibonacci row put new steps between the old 1, 5 and 15 pages: below a sticker already stuck in, they count as
  // celebrated, so the child does not get a row of pops for pages finished long ago. Stickers come in album order, so a
  // new save never has a later step seen before an earlier one.
  const between = PAGE_STICKERS.filter((s) => !seen.includes(s.id) && PAGE_STICKERS.some((t) => t.game === s.game && seen.includes(t.id) && Number(t.mark) > Number(s.mark)));
  const added = [...carried, ...between.map((s) => s.id)];
  return added.length === 0 ? p : { ...p, stickersSeen: [...p.stickersSeen, ...added] };
}

/**
 * Saves from when Méhkas and Robotút had one sticker per few levels: each old group sticker becomes the stickers of
 * the levels in its group the child has done (they were celebrated with it, so none pops again), or its first level's
 * when none is done any more (a sticker once stuck in stays). The old ids go, so this runs once.
 */
function ungroupStickers(p: Progress): Progress {
  const swap = (id: string): string[] | null => {
    const m = /^(add|path)-level-(\d+)$/.exec(id);
    const game = m?.[1] as LadderGame | undefined;
    const starts = game && REGROUPED[game];
    if (!game || !starts) return null;
    const k = Number(m![2]) - 1;
    if (k < 0 || k >= starts.length) return [];
    const to = starts[k + 1] ?? LADDER_RULES[game].levels;
    const done = new Set([...solvedLevels(ladderOf(p, game)), ...sheetLevels(p, game)]);
    const levels = Array.from({ length: to - starts[k] }, (_, j) => starts[k] + j).filter((l) => done.has(l));
    return (levels.length > 0 ? levels : [starts[k]]).map((l) => levelStickerId(game, l));
  };
  const remap = (ids: string[]) => [...new Set(ids.flatMap((id) => swap(id) ?? [id]))];
  if (!p.stickersSeen.some((id) => swap(id)) && !p.stickersToday.some((id) => swap(id))) return p;
  return { ...p, stickersSeen: remap(p.stickersSeen), stickersToday: remap(p.stickersToday) };
}

export function gameOf(s: Sticker): StickerGame {
  return STICKER_GAMES.find((g) => g.id === s.game)!;
}

/** A sticker once stuck in stays, whatever happens to the level or the rule it came from. */
export function earnedStickers(p: Progress): Sticker[] {
  return STICKERS.filter((s) => s.earned(p) || p.stickersSeen.includes(s.id));
}

/** One album row for grown-ups: how many of its stickers the child has, and the first one still to come (null: all). */
export function stickerRow(p: Progress, game: StickerGameId): { earned: number; total: number; next: Sticker | null } {
  const row = STICKERS.filter((s) => s.game === game);
  const have = new Set(earnedStickers(p).map((s) => s.id));
  return { earned: row.filter((s) => have.has(s.id)).length, total: row.length, next: row.find((s) => !have.has(s.id)) ?? null };
}

/**
 * Album rows in order, each row's stickers top first: a finished last-level sheet earns every level below it
 * at once, and the level the child actually reached should be the one that pops first.
 */
export function topFirst(list: Sticker[]): Sticker[] {
  return STICKER_GAMES.flatMap(({ id }) => list.filter((s) => s.game === id).reverse());
}

/** Stickers earned but not celebrated yet, rows in album order with each row's top sticker first; with a world, only that world's (each pops on its own home screen). */
export function newStickers(p: Progress, world?: WorldId): Sticker[] {
  return topFirst(earnedStickers(p).filter((s) => !p.stickersSeen.includes(s.id) && (!world || gameOf(s).world === world)));
}

export function markStickerSeen(p: Progress, id: string, day = today()): Progress {
  if (p.stickersSeen.includes(id)) return p;
  const before = p.stickersDay === day ? p.stickersToday : [];
  return { ...p, stickersSeen: [...p.stickersSeen, id], stickersDay: day, stickersToday: [...before, id] };
}

/** The day's stickers, newest first: those still waiting for their celebration, then the ones celebrated that day. */
export function todaysStickers(p: Progress, day = today()): Sticker[] {
  const celebrated = p.stickersDay === day ? [...p.stickersToday].reverse() : [];
  const ids = [...new Set([...newStickers(p).map((s) => s.id), ...celebrated])];
  return ids.map((id) => STICKERS.find((s) => s.id === id)).filter((s): s is Sticker => s !== undefined);
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

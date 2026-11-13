import { LEARN_MAX } from '../worlds/garden/games/learn/logic';
import { GAMES, type GameId } from './games';
import type { Progress } from './progress';
import type { WorldId } from './worlds';
import { LADDER_RULES, ladderOf, solvedLevels, type LadderGame } from './ladder';
import { FRIENDS, FRIEND_GIFTS_EACH, boughtCount, friendGiftCount, friendGiftsOf, friendsOf, secondRobotOpen } from './robotParts';
import { creditTasks, rewardFor } from './pod';
import { today } from './screenTime';
import { VISITORS, decorCount, gardenDone, giftsOf } from './garden';

// The sticker album: a row per game and per reward place, level stickers, finished paper sheets, and which are new.

// ---------- stickers ----------

/** Each world's reward place (Kiskert, Robotépítő) and finished paper sheets have album rows of their own, next to the games. */
export type StickerGameId = GameId | 'kiskert' | 'robotepito' | 'paper-garden' | 'paper-robot';

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

/** A game's album row: its name and world from the game list; `name` only to hyphenate a long one. */
function gameRow(id: GameId, color: string, ink: string, name = GAMES[id].name): StickerGame {
  return { id, name, color, ink, world: GAMES[id].world };
}

/** Album order and each game's sticker colour (light ones carry dark ink). Soft hyphens keep long names whole in the album's narrow columns. */
export const STICKER_GAMES: StickerGame[] = [
  gameRow('learn', '#2E86DE', '#FFFFFF'),
  gameRow('water', '#9FCDF3', '#10233A'),
  gameRow('patterns', '#F4A3C4', '#10233A'),
  gameRow('flash', '#8A5A3B', '#FFFFFF'),
  gameRow('add', '#FFC93C', '#10233A'),
  gameRow('trace', '#D9741A', '#FFFFFF'),
  gameRow('pots', '#2F7D32', '#FFFFFF', 'Cserép­barátok'),
  { id: 'kiskert', name: 'Kiskert', color: '#7A4FB5', ink: '#FFFFFF', world: 'garden' },
  { id: 'paper-garden', name: 'Feladat­lapok', color: '#F3E3B3', ink: '#10233A', world: 'garden' },
  gameRow('path', '#138A86', '#FFFFFF'),
  gameRow('sort', '#5E7184', '#FFFFFF', 'Válogató­gép'),
  gameRow('scale', '#F2B33D', '#10233A'),
  gameRow('seq', '#2E5FA8', '#FFFFFF'),
  gameRow('mirror', '#7FE9F0', '#10233A'),
  gameRow('code', '#C98F4E', '#10233A'),
  gameRow('fix', '#D9741A', '#FFFFFF', 'Hiba­vadász'),
  { id: 'robotepito', name: 'Robot­építő', color: '#7A4FB5', ink: '#FFFFFF', world: 'robot' },
  { id: 'paper-robot', name: 'Feladat­lapok', color: '#D5DEE6', ink: '#10233A', world: 'robot' }
];

/** Pages done from this world's games: a sticker waits on the page's own world, like the game's. */
export function pagesDoneIn(p: Progress, world: WorldId): number {
  return p.pagesDone.filter((key) => STICKER_GAMES.find((g) => g.id === key.split('.')[0])?.world === world).length;
}

function pageWorld(key: string): WorldId | undefined {
  return STICKER_GAMES.find((g) => g.id === key.split('.')[0])?.world;
}

/** What a finished page of `tasks` tasks pays now: its tasks fill the reward pod like solved tasks in its world's games. */
export function pageReward(p: Progress, key: string, tasks: number): { seeds: number; bolts: number } {
  const world = pageWorld(key);
  const pay = world ? rewardFor(p, world, tasks) : 0;
  return { seeds: world === 'garden' ? pay : 0, bolts: world === 'robot' ? pay : 0 };
}

/**
 * A grown-up saw the page finished. It counts once, for finishing, never for how many answers were right,
 * and it changes no level. Its `tasks` fill the reward pod (see `pageReward`). There is no taking it back: a sticker that has been stuck in stays.
 */
export function markPageDone(p: Progress, key: string, tasks: number): Progress {
  if (p.pagesDone.includes(key)) return p;
  const world = pageWorld(key);
  const done = { ...p, pagesDone: [...p.pagesDone, key] };
  return world ? creditTasks(done, world, tasks) : done;
}

/** Feladatlapok stickers: pages done in a world. */
const pagesIn = (world: WorldId, count: number) => (p: Progress) => pagesDoneIn(p, world) >= count;

/** The sheet levels (0-based, as in the page key) of this game with a page marked done, with the revision each was printed from. */
function sheetsDone(p: Progress, game: GameId): { rev: number; level: number }[] {
  return p.pagesDone.flatMap((key) => {
    const [id, rev, level] = key.split('.');
    return id === game ? [{ rev: Number(rev), level: Number(level) }] : [];
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

/** The ladder levels a finished sheet of this game stands for, each done explicitly on paper. */
function sheetLevels(p: Progress, game: LadderGame): number[] {
  const old = OLD_SHEET_LADDER[game];
  return sheetsDone(p, game).flatMap(({ rev, level }) => (old && rev < old.before ? old.levels : SHEET_LADDER[game])?.[level] ?? [level]);
}

/**
 * A game's level stickers, easiest first: one per level, so every level done (in the game or on a sheet) has a
 * sticker of its own. `from` is the level (0-based) the sticker stands for: it is earned with the first task
 * solved there, so a child who keeps needing help on a level still has its sticker. `legacy` names the stickers
 * of the old hand-picked list it replaces.
 */
interface LevelSticker {
  from: number;
  mark: string;
  label: string;
  praise: string;
  legacy?: string[];
}

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

export const LEVEL_STICKERS: Record<LadderGame, LevelSticker[]> = {
  water: [
    { from: 0, mark: '1', label: 'Első virág', praise: 'Kinőtt az első virágod!', legacy: ['water-1'] },
    { from: 1, mark: '10', label: 'Tízes keret', praise: 'Már tíz cseppig locsolsz!', legacy: ['water-10'] },
    { from: 2, mark: '20', label: 'Két keret', praise: 'Már húsz cseppig locsolsz!', legacy: ['water-20'] },
    { from: 3, mark: '+', label: 'Továbbszámolás', praise: 'Már tovább tudsz számolni!' },
    { from: 4, mark: '10+', label: 'Tízen át', praise: 'Már a tízesen is átlocsolsz!' },
    { from: 5, mark: '2, 4', label: 'Kettesével', praise: 'Már kettesével is számolsz!' }
  ],
  patterns: [
    { from: 0, mark: 'AB', label: 'Kettes sor', praise: 'Folytattad az első virágsort!', legacy: ['patterns-ab'] },
    { from: 1, mark: 'ABC', label: 'Hármas sor', praise: 'Már a hármas sort is folytatod!', legacy: ['patterns-abc'] },
    { from: 2, mark: 'AAB', label: 'Kettő-egy', praise: 'Már a kettő-egy sort is kitalálod!' },
    { from: 3, mark: '?', label: 'Hiányzó virág', praise: 'Megtalálod a hiányzó virágot is!', legacy: ['patterns-all'] },
    { from: 4, mark: 'AABB', label: 'Kettő-kettő', praise: 'Már a kettő-kettő sort is folytatod!' },
    { from: 5, mark: '+1', label: 'Növő csokor', praise: 'Látod, hogyan nő a csokor!' },
    { from: 6, mark: '+2', label: 'Kettővel több', praise: 'Már a kettesével növő csokrot is kitalálod!' },
    { from: 7, mark: 'ABAC', label: 'Négyes minta', praise: 'Már a négyes mintát is folytatod!' },
    { from: 8, mark: 'A?B', label: 'Vegyes sor', praise: 'Bármelyik sorból megtalálod a hiányzó virágot!' },
    { from: 9, mark: '??', label: 'Két hiányzó', praise: 'Már két hiányzó virágot is megtalálsz!' }
  ],
  flash: [
    { from: 0, mark: '3', label: 'Egy pillantás', praise: 'Egy pillantásra látod, hány mag van!', legacy: ['flash-3'] },
    { from: 1, mark: '5', label: 'Öt mag', praise: 'Már öt magot is egy pillantásra látsz!' },
    { from: 2, mark: '•5', label: 'Szórt magok', praise: 'A szórt magokat is egy pillantásra látod!', legacy: ['flash-5'] },
    { from: 3, mark: '10', label: 'Tíz mag', praise: 'Már tíz magot is egy pillantásra látsz!', legacy: ['flash-10'] },
    { from: 4, mark: '5+3', label: 'Tízes keret', praise: 'A tízes keretet is egy pillantásra látod!' },
    { from: 5, mark: '20', label: 'Húsz mag', praise: 'Már húsz magot is egy pillantásra látsz!' }
  ],
  add: [
    { from: 0, mark: '+5', label: 'Gyűjtés ötig', praise: 'Már ötig adsz össze!' },
    { from: 1, mark: '−5', label: 'Elvétel ötig', praise: 'Már ötig veszel el!' },
    { from: 2, mark: '5', label: 'Ötig', praise: 'Már ötig adsz össze és veszel el!' },
    { from: 3, mark: '+10', label: 'Gyűjtés tízig', praise: 'Már tízig adsz össze!', legacy: ['add-5'] },
    { from: 4, mark: '−10', label: 'Elvétel tízig', praise: 'Már tízig veszel el!' },
    { from: 5, mark: '10', label: 'Továbbszámolás', praise: 'Már tízig továbbszámolva adsz össze!' },
    { from: 6, mark: '+20', label: 'Húszig', praise: 'Már húszig adsz össze!', legacy: ['add-10'] },
    { from: 7, mark: '−20', label: 'Elvétel húszig', praise: 'Már húszig veszel el!' },
    { from: 8, mark: '20+', label: 'Tízes átlépés', praise: 'Már a tízesen is átlépsz!' },
    { from: 9, mark: '20−', label: 'Átlépés elvétellel', praise: 'Elvételnél is átlépsz a tízesen!' },
    { from: 10, mark: '+40', label: 'Kerek tízesek', praise: 'Már a kerek tízesekkel is számolsz!', legacy: ['add-100'] },
    { from: 11, mark: '−40', label: 'Kerek elvétel', praise: 'Már kerek tízeseket is elveszel!' },
    { from: 12, mark: '+100', label: 'Százig', praise: 'Már százig adsz össze!' },
    { from: 13, mark: '−100', label: 'Elvétel százig', praise: 'Már százig veszel el!' },
    { from: 14, mark: '100+', label: 'Nagy átlépés', praise: 'Százig is átlépsz a tízesen!' },
    { from: 15, mark: '100−', label: 'Nagy elvétel', praise: 'Százig elvételnél is átlépsz a tízesen!' }
  ],
  trace: [
    { from: 0, mark: '1–5', label: 'Írom 5-ig', praise: 'Már ötig írod a számokat!', legacy: ['trace-5'] },
    { from: 1, mark: '0–9', label: 'Minden szám', praise: 'Minden számot meg tudsz írni!', legacy: ['trace-9', 'trace-0'] },
    { from: 2, mark: '5', label: 'Halvány út', praise: 'Már halvány úton is írod a számokat!', legacy: ['trace-fade'] },
    { from: 3, mark: '10', label: 'Fejből írom', praise: 'Minden számot emlékezetből írsz!', legacy: ['trace-memory'] },
    { from: 4, mark: '?', label: 'Vegyes számok', praise: 'Összekeverve is emlékezetből írod a számokat!' },
    { from: 5, mark: '•', label: 'Út nélkül', praise: 'Már mézes út nélkül is leírod a számokat!' }
  ],
  pots: [
    { from: 0, mark: '5', label: 'Öt barátai', praise: 'Ismered az öt barátait!', legacy: ['pots-5'] },
    { from: 1, mark: '10', label: 'Tíz barátai', praise: 'Ismered a tíz barátait!', legacy: ['pots-10'] },
    { from: 2, mark: '10?', label: 'Szórt cserepek', praise: 'A szórt cserepeknél is megtalálod a tíz barátait!', legacy: ['pots-mix'] },
    { from: 3, mark: '6–9', label: 'Új barátok', praise: 'Már a hat, hét, nyolc és kilenc barátait is ismered!' },
    { from: 4, mark: '20', label: 'Húsz barátai', praise: 'Ismered a húsz barátait!' },
    { from: 5, mark: '?', label: 'Fejből', praise: 'Fejből tudod a tíz barátait!' }
  ],
  path: [
    { from: 0, mark: '1', label: 'Első út', praise: 'Elvezetted a robotot az elemhez!', legacy: ['path-first'] },
    { from: 1, mark: '▣', label: 'Dobozok között', praise: 'A dobozok között is elvezetted a robotot!' },
    { from: 2, mark: '▶', label: 'Tervező', praise: 'Előre megtervezted a robot útját!', legacy: ['path-plan'] },
    { from: 3, mark: '▶▣', label: 'Kerülő terv', praise: 'Előre megtervezted a kerülőutat is!' },
    { from: 4, mark: '→→', label: 'Hosszú út', praise: 'A hosszú úton is elvezetted a robotot!' },
    { from: 5, mark: '×3', label: 'Ismétlő', praise: 'Az ismétléssel rövid lett a programod!' },
    { from: 6, mark: '↻', label: 'Fordulós', praise: 'A robot arra megy, amerre néz, és te tudod, merre fordítsd!', legacy: ['path-turn'] },
    { from: 7, mark: '↻▣', label: 'Fordulj, kerüld ki', praise: 'Fordulva is kikerülöd a dobozokat!' },
    { from: 8, mark: '×↻', label: 'Ismételd és fordulj', praise: 'Egy programban ismételsz és fordulsz is!', legacy: ['path-repeat'] },
    { from: 9, mark: '2', label: 'Két elem', praise: 'Egy programmal két elemet is összegyűjtöttél!', legacy: ['path-two'] }
  ],
  sort: [
    { from: 0, mark: '2', label: 'Első válogatás', praise: 'Minden darabot a helyére tettél!', legacy: ['sort-first'] },
    { from: 1, mark: '3', label: 'Három szín', praise: 'Már három színt is szétválogatsz!' },
    { from: 2, mark: '▲', label: 'Formák', praise: 'Már formák szerint is válogatsz!', legacy: ['sort-shape'] },
    { from: 3, mark: '●•', label: 'Nagy és kicsi', praise: 'Már nagyság szerint is válogatsz!' },
    { from: 4, mark: '?', label: 'Kakukktojás', praise: 'Megtalálod, melyik nem illik a többihez!', legacy: ['sort-odd'] },
    { from: 5, mark: '2+', label: 'Két szabály', praise: 'Egyszerre két dologra is figyelsz!', legacy: ['sort-two'] },
    { from: 6, mark: '!', label: 'Szabálykereső', praise: 'Kitaláltad a gép titkos szabályát!', legacy: ['sort-rule'] }
  ],
  scale: [
    { from: 0, mark: '↓', label: 'Első mérés', praise: 'Megmondtad, melyik oldal a nehezebb!', legacy: ['scale-first'] },
    { from: 1, mark: '≈', label: 'Egyforma', praise: 'Észreveszed, ha a két oldal egyforma nehéz!' },
    { from: 2, mark: '=', label: 'Egyensúly', praise: 'Egyensúlyba hoztad a mérleget!', legacy: ['scale-even'] },
    { from: 3, mark: '10', label: 'Egyensúly tízig', praise: 'Már tízig is egyensúlyba hozod a mérleget!' },
    { from: 4, mark: '2', label: 'Kettes súly', praise: 'Már a kettes súlyokkal is kiméred!', legacy: ['scale-two'] },
    { from: 5, mark: '?', label: 'Hiányzó súly', praise: 'Kitaláltad, melyik súly hiányzik!', legacy: ['scale-missing'] },
    { from: 6, mark: 'x', label: 'Titkos doboz', praise: 'Kitaláltad, mennyit nyom a titkos doboz!', legacy: ['scale-secret'] }
  ],
  seq: [
    { from: 0, mark: 'AB', label: 'Első minta', praise: 'Folytattad a gép első mintáját!', legacy: ['seq-first'] },
    { from: 1, mark: 'ABB', label: 'Hosszú minta', praise: 'A hosszabb mintát is folytatod!' },
    { from: 2, mark: '●■', label: 'Szín és forma', praise: 'Egyszerre figyeled a színt és a formát!', legacy: ['seq-both'] },
    { from: 3, mark: '123', label: 'Növekvő sor', praise: 'Tudod, hogyan nő tovább a sor!' },
    { from: 4, mark: '↻', label: 'Forgató', praise: 'Tudod, merre fordul a nyíl!', legacy: ['seq-turn'] },
    { from: 5, mark: '!', label: 'Hibavadász', praise: 'Megtalálod, hol csúszott el a gép!', legacy: ['seq-fix'] },
    { from: 6, mark: '⇄', label: 'Mintafordító', praise: 'Ugyanazt a mintát nyilakkal is felismered!', legacy: ['seq-translate'] }
  ],
  mirror: [
    { from: 0, mark: '•|•', label: 'Első tükör', praise: 'Megtaláltad az első tükörképet!', legacy: ['mirror-first'] },
    { from: 1, mark: '••|', label: 'Több lámpa', praise: 'Több lámpát is jól tükrözöl!' },
    { from: 2, mark: '♥', label: 'Fél kép', praise: 'A tükörrel egész képet rajzolsz!', legacy: ['mirror-picture'] },
    { from: 3, mark: '◐', label: 'Színes kép', praise: 'A színes képet is pontosan tükrözöd!' },
    { from: 4, mark: '⇅', label: 'Fel-le tükör', praise: 'A fekvő tükörrel is boldogulsz!', legacy: ['mirror-flat'] },
    { from: 5, mark: 'b|d', label: 'Tükörkép', praise: 'Már nem téveszted össze a tükörképet a másolattal!', legacy: ['mirror-pick'] },
    { from: 6, mark: '!', label: 'Tükörjavító', praise: 'Megtalálod, hol tévedett a tükörgép!', legacy: ['mirror-fix'] }
  ],
  code: [
    { from: 0, mark: '●●', label: 'Első zár', praise: 'Kinyitottad az első kódzárat!', legacy: ['code-first'] },
    { from: 1, mark: '●●●', label: 'Hosszú zár', praise: 'A hosszabb zárat is kinyitod!' },
    { from: 2, mark: '●→', label: 'Kódtábla', praise: 'Már a kódtáblát is el tudod olvasni!', legacy: ['code-key'] },
    { from: 3, mark: '■→', label: 'Új kódtábla', praise: 'Az új kódtáblát is el tudod olvasni!' },
    { from: 4, mark: '•3', label: 'Pöttykód', praise: 'A pöttyökből számot csinálsz!', legacy: ['code-dots'] },
    { from: 5, mark: '→●', label: 'Üzenetküldő', praise: 'Titkos üzenetet küldtél Kutyabotnak!', legacy: ['code-send'] },
    { from: 6, mark: '?', label: 'Kódfejtő', praise: 'Kitaláltad a letakart jelet!', legacy: ['code-crack'] }
  ],
  fix: [
    { from: 0, mark: '↑✓', label: 'Első javítás', praise: 'Megjavítottad az első programot!', legacy: ['fix-first'] },
    { from: 1, mark: '↑↑', label: 'Hosszú program', praise: 'A hosszabb programban is megtalálod a hibát!' },
    { from: 2, mark: '▣', label: 'Dobozkerülő', praise: 'A dobozok között is megtalálod a hibát!', legacy: ['fix-crates'] },
    { from: 3, mark: '✕', label: 'Kártyaszedő', praise: 'Megtalálod a felesleges kártyát!' },
    { from: 4, mark: '×3', label: 'Számjavító', praise: 'Már a rossz számot is kijavítod!', legacy: ['fix-times'] },
    { from: 5, mark: '↰', label: 'Fordulójavító', praise: 'A fordulós programban is megtalálod a hibát!', legacy: ['fix-turn'] },
    { from: 6, mark: '!!', label: 'Dupla javítás', praise: 'Két hibát is megtaláltál egy programban!', legacy: ['fix-two'] }
  ]
};

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
      return solvedLevels(ladderOf(p, game)).some(inRow) || sheetLevels(p, game).some(inRow);
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
  { id: 'learn-5', game: 'learn', mark: '1–5', label: 'Ismerem 5-ig', praise: 'Már ötig ismered a számokat!', earned: (p) => p.learnSolved >= 5 || learnSheet(0)(p) },
  { id: 'learn-10', game: 'learn', mark: '1–10', label: 'Ismerem 10-ig', praise: 'Már tízig ismered a számokat!', earned: (p) => p.learnSolved >= 10 || learnSheet(1)(p) },
  { id: 'learn-20', game: 'learn', mark: '1–20', label: 'Ismerem 20-ig', praise: 'Már húszig ismered a számokat!', earned: (p) => p.learnSolved >= LEARN_MAX || learnSheet(3, 4)(p) },
  { id: 'learn-mix', game: 'learn', mark: '?', label: 'Vegyesen is', praise: 'Összekeverve is felismered a számokat!', earned: (p) => p.learnMixSolved >= 1 },
  { id: 'kiskert-gift', game: 'kiskert', mark: '1', label: 'Első ajándék', praise: 'Megajándékoztad az első lakót a kertedben!', earned: (p) => decorCount(p) >= 1 },
  { id: 'kiskert-all', game: 'kiskert', mark: '12', label: 'Minden lakónak', praise: 'Mind a tizenkét lakó kapott tőled ajándékot!', earned: (p) => VISITORS.every((v) => giftsOf(p, v.id) >= 1) },
  { id: 'kiskert-done', game: 'kiskert', mark: '60', label: 'Kész a kert', praise: 'Kész a kert! Minden lakó megkapta az ajándékát.', earned: gardenDone },
  { id: 'robotepito-part', game: 'robotepito', mark: '1', label: 'Első alkatrész', praise: 'Felszerelted az első új alkatrészt a robotodra!', earned: (p) => boughtCount(p) >= 1 },
  { id: 'robotepito-second', game: 'robotepito', mark: '2', label: 'Második robot', praise: 'Megérkezett a második robotod a munkapadra!', earned: secondRobotOpen },
  { id: 'robotepito-friends', game: 'robotepito', mark: '6', label: 'Minden barát', praise: 'Mind a hat robotbarát beköltözött a műhelybe!', earned: (p) => friendsOf(p).length === FRIENDS.length },
  { id: 'robotepito-gifts', game: 'robotepito', mark: '♥', label: 'Minden barátnak', praise: 'Mind a hat robotbarát kapott tőled ajándékot!', earned: (p) => FRIENDS.every((f) => friendGiftsOf(p, f.id) >= 1) },
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
  const game: StickerGameId = world === 'garden' ? 'paper-garden' : 'paper-robot';
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

const PAGE_STICKERS = [...pageStickers('garden'), ...pageStickers('robot')];

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

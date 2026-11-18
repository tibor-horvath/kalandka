import type { GameDefsOf } from '../types';
import { ADD_LEVELS } from './games/add/logic';
import { LEVELS as FLASH_LEVELS } from './games/flash/logic';
import { MIXED_SHAPES, PATTERN_LEVELS } from './games/patterns/logic';
import { POTS_LEVELS } from './games/pots/logic';
import { TRACE_LEVELS } from './games/trace/logic';
import { WATER_LEVELS } from './games/water/logic';

// What shared code needs to know about each of the world's games, besides its name in the manifest: its look in the
// album and the parents' corner, and for a levelled game its ladder, the words and notes about it, and its level stickers.
// Shared tables (ladder rules, stickers, parents' notes and tiles) are built from these; a new game adds its entry here.

/** Virágsor's mixed levels draw from every shape: the row that steps up shows each shape once. */
const PATTERN_MIXED_UP = Object.fromEntries(
  PATTERN_LEVELS.flatMap((l, i) => (l.shapes === MIXED_SHAPES ? [[i, MIXED_SHAPES.length]] : []))
);

export const gardenDefs = {
  learn: {
    look: { skill: 'számok 1–20', mode: 'Sorban halad 20-ig', glyph: '12', tile: 'pa-tile--blue', color: '#2E86DE', ink: '#FFFFFF' }
  },
  water: {
    look: { skill: 'számolás', glyph: '10', tile: 'pa-tile--sky', color: '#9FCDF3', ink: '#10233A', backdrop: 'lawn' },
    ladder: {
      levels: WATER_LEVELS,
      up: 4,
      down: 3,
      stepWords: { good: 'jó virág', hard: 'túlöntözött', note: 'kannával lehet túlönteni' },
      notes: {
        where: 'A Locsolásban',
        unit: 'növény',
        hard: 'Többször is túlöntözte a növényt, mielőtt kijött a pontos szám.',
        home: 'Töltsetek egy pohárba pontosan annyi kanál vizet, amennyit kitaláltok.'
      },
      counted: 'virág',
      ageStart: { '6': 1, '7+': 2 },
      stickers: [
        { from: 0, mark: '1', label: 'Első virág', praise: 'Kinőtt az első virágod!', legacy: ['water-1'] },
        { from: 1, mark: '10', label: 'Tízes keret', praise: 'Már tíz cseppig locsolsz!', legacy: ['water-10'] },
        { from: 2, mark: '20', label: 'Két keret', praise: 'Már húsz cseppig locsolsz!', legacy: ['water-20'] },
        { from: 3, mark: '+', label: 'Továbbszámolás', praise: 'Már tovább tudsz számolni!' },
        { from: 4, mark: '10+', label: 'Tízen át', praise: 'Már a tízesen is átlocsolsz!' },
        { from: 5, mark: '2, 4', label: 'Kettesével', praise: 'Már kettesével is számolsz!' }
      ]
    }
  },
  patterns: {
    look: { skill: 'mintázatok', glyph: 'AB', tile: 'pa-tile--pink', color: '#F4A3C4', ink: '#10233A' },
    ladder: {
      levels: PATTERN_LEVELS,
      up: 4,
      down: 3,
      upAt: PATTERN_MIXED_UP,
      stepWords: { good: 'jó válasz', hard: 'nehéz feladat', longer: 'a vegyes szinteken' },
      notes: {
        where: 'A Virágsorban',
        unit: 'sor',
        hard: 'A legutóbbi soroknál többször is mellényúlt, mielőtt megtalálta a jó virágot.',
        home: 'Rakjatok sort kanálból és villából, és kérdezd meg, mi jön ezután.'
      },
      counted: 'sor',
      ageStart: { '6': 1, '7+': 2 },
      stickers: [
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
      ]
    }
  },
  flash: {
    look: { skill: 'mennyiség ránézésre', glyph: '5', tile: 'pa-tile--sand', color: '#8A5A3B', ink: '#FFFFFF' },
    ladder: {
      levels: FLASH_LEVELS,
      up: 4,
      down: 3,
      stepWords: { good: 'jó válasz', hard: 'nehéz feladat' },
      notes: {
        where: 'A Villámszemben',
        unit: 'feladat',
        hard: 'Gyakran kéri újra a magokat, vagy egyenként számolja meg őket.',
        home: 'Dobókockával: mondja meg, hány pötty van, számolás nélkül.'
      },
      ageStart: { '6': 1, '7+': 2 },
      stickers: [
        { from: 0, mark: '3', label: 'Egy pillantás', praise: 'Egy pillantásra látod, hány mag van!', legacy: ['flash-3'] },
        { from: 1, mark: '5', label: 'Öt mag', praise: 'Már öt magot is egy pillantásra látsz!' },
        { from: 2, mark: '•5', label: 'Szórt magok', praise: 'A szórt magokat is egy pillantásra látod!', legacy: ['flash-5'] },
        { from: 3, mark: '10', label: 'Tíz mag', praise: 'Már tíz magot is egy pillantásra látsz!', legacy: ['flash-10'] },
        { from: 4, mark: '5+3', label: 'Tízes keret', praise: 'A tízes keretet is egy pillantásra látod!' },
        { from: 5, mark: '20', label: 'Húsz mag', praise: 'Már húsz magot is egy pillantásra látsz!' }
      ]
    }
  },
  add: {
    look: { skill: 'összeadás és kivonás', glyph: '+', tile: 'pa-tile--sun', color: '#FFC93C', ink: '#10233A' },
    ladder: {
      levels: ADD_LEVELS,
      up: 5,
      down: 3,
      stepWords: { good: 'jó válasz', hard: 'nehéz feladat' },
      notes: {
        where: 'A Méhkasban',
        unit: 'feladat',
        hard: 'Az utolsó feladatoknál többször kért segítséget.',
        home: 'Közös számolás az ujjakon vagy kanalakkal sokat segít.'
      },
      ageStart: { '6': 2, '7+': 5 },
      stickers: [
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
      ]
    }
  },
  trace: {
    look: { skill: 'számírás', glyph: '1–5', sheetGlyph: '3', tile: 'pa-tile--sun', color: '#D9741A', ink: '#FFFFFF' },
    ladder: {
      levels: TRACE_LEVELS,
      up: TRACE_LEVELS[0].digits.length,
      down: 3,
      stepWords: { good: 'szám', hard: 'nehéz szám' },
      notes: {
        where: 'A Mézútban',
        unit: 'számjegy',
        hard: 'Több számjegynél letért az útról, vagy megkérte Csepit, hogy mutassa meg.',
        home: 'Írjatok számokat ujjal lisztbe, homokba vagy a párás ablakra.'
      },
      counted: 'leírt szám',
      ageStart: { '7+': 2 },
      stickers: [
        { from: 0, mark: '1–5', label: 'Írom 5-ig', praise: 'Már ötig írod a számokat!', legacy: ['trace-5'] },
        { from: 1, mark: '0–9', label: 'Minden szám', praise: 'Minden számot meg tudsz írni!', legacy: ['trace-9', 'trace-0'] },
        { from: 2, mark: '5', label: 'Halvány út', praise: 'Már halvány úton is írod a számokat!', legacy: ['trace-fade'] },
        { from: 3, mark: '10', label: 'Fejből írom', praise: 'Minden számot emlékezetből írsz!', legacy: ['trace-memory'] },
        { from: 4, mark: '?', label: 'Vegyes számok', praise: 'Összekeverve is emlékezetből írod a számokat!' },
        { from: 5, mark: '•', label: 'Út nélkül', praise: 'Már mézes út nélkül is leírod a számokat!' }
      ]
    }
  },
  pots: {
    look: { skill: 'számbarátok 5–20', glyph: '3+7', tile: 'pa-tile--pink', color: '#2F7D32', ink: '#FFFFFF', albumName: 'Cserép­barátok' },
    ladder: {
      levels: POTS_LEVELS,
      up: 5,
      down: 3,
      stepWords: { good: 'jó válasz', hard: 'nehéz feladat' },
      notes: {
        where: 'A Cserépbarátokban',
        unit: 'kör',
        hard: 'Gyakran kellett, hogy Csepi együtt számolja vele az üres cserepeket.',
        home: 'Két kéz, tíz ujj: mutass fel néhányat, hány hiányzik a tízhez?'
      },
      ageStart: { '7+': 1 },
      stickers: [
        { from: 0, mark: '5', label: 'Öt barátai', praise: 'Ismered az öt barátait!', legacy: ['pots-5'] },
        { from: 1, mark: '10', label: 'Tíz barátai', praise: 'Ismered a tíz barátait!', legacy: ['pots-10'] },
        { from: 2, mark: '10?', label: 'Szórt cserepek', praise: 'A szórt cserepeknél is megtalálod a tíz barátait!', legacy: ['pots-mix'] },
        { from: 3, mark: '6–9', label: 'Új barátok', praise: 'Már a hat, hét, nyolc és kilenc barátait is ismered!' },
        { from: 4, mark: '20', label: 'Húsz barátai', praise: 'Ismered a húsz barátait!' },
        { from: 5, mark: '?', label: 'Fejből', praise: 'Fejből tudod a tíz barátait!' }
      ]
    }
  }
} satisfies GameDefsOf<'garden'>;

import { ADD_LEVELS } from '../games/add/logic';
import { LEVELS as FLASH_LEVELS } from '../games/flash/logic';
import { LEARN_MAX } from '../games/learn/logic';
import { POTS_LEVELS } from '../games/pots/logic';
import { SHAPE_ORDER } from '../games/patterns/logic';
import { PATH_LEVELS } from '../games/robot/path';
import { SCALE_LEVELS } from '../games/robot/scale';
import { CODE_LEVELS } from '../games/robot/code';
import { MIRROR_LEVELS } from '../games/robot/mirror';
import { SEQ_LEVELS } from '../games/robot/seq';
import { SORT_LEVELS } from '../games/robot/sort';
import { PLANTS } from '../games/water/logic';
import { ladderOf, startAt, withLadder } from './ladder';
import type { Progress } from './progress';
import type { WorldId } from './worlds';

// Per-game level settings for the parents' corner.
// Each setting reads the game's current level from progress and writes a new starting point;
// from there every game keeps progressing on its own.

export interface LevelOption {
  value: number;
  label: string;
}

export interface LevelSetting {
  id: 'learn' | 'water' | 'patterns' | 'flash' | 'add' | 'pots' | 'path' | 'sort' | 'scale' | 'seq' | 'mirror' | 'code';
  world: WorldId;
  game: string;
  hint: string;
  options: LevelOption[];
  current: (p: Progress) => number;
  apply: (p: Progress, value: number) => Progress;
}

const LEARN_STARTS: LevelOption[] = [
  { value: 0, label: '1-től' },
  { value: 5, label: '6-tól' },
  { value: 10, label: '11-től' },
  { value: 15, label: '16-tól' }
];

const PATTERN_LABELS: Record<string, string> = {
  AB: 'AB – két virág váltakozik',
  ABC: 'ABC – három virág váltakozik',
  AAB: 'AAB – kettő-egy',
  ABB: 'ABB – egy-kettő'
};

export const LEVEL_SETTINGS: LevelSetting[] = [
  {
    id: 'learn',
    world: 'garden',
    game: 'Számvetés',
    hint: 'Innen tanulja sorban a számokat, 20-ig.',
    options: LEARN_STARTS,
    current: (p) => {
      const r = p.learnRound % LEARN_MAX;
      return [...LEARN_STARTS].reverse().find((o) => r >= o.value)!.value;
    },
    apply: (p, v) => ({ ...p, learnRound: v })
  },
  {
    id: 'water',
    world: 'garden',
    game: 'Locsolás',
    hint: 'Hány cseppet kér egy virág.',
    options: [
      { value: 0, label: '2–10 csepp (egy tízes keret)' },
      { value: PLANTS.length, label: '11–20 csepp (két tízes keret)' }
    ],
    current: (p) => (p.waterRound >= PLANTS.length ? PLANTS.length : 0),
    apply: (p, v) => ({ ...p, waterRound: v === 0 ? 0 : Math.max(p.waterRound, PLANTS.length) })
  },
  {
    id: 'patterns',
    world: 'garden',
    game: 'Virágsor',
    hint: 'Ezzel a mintával indul, aztán körbejárnak.',
    options: SHAPE_ORDER.map((shape, i) => ({ value: i, label: PATTERN_LABELS[shape] })),
    current: (p) => p.patternRound % SHAPE_ORDER.length,
    apply: (p, v) => ({ ...p, patternRound: v })
  },
  {
    id: 'flash',
    world: 'garden',
    game: 'Magvillantás',
    hint: '4 jó válasz egymás után: nehezebb szint, 3 nehéz feladat egymás után: könnyebb. Ez alá nem lép vissza.',
    options: FLASH_LEVELS.map((l, i) => ({ value: i, label: `${i + 1}. ${l.name}` })),
    current: (p) => ladderOf(p, 'flash').level,
    apply: (p, v) => withLadder(p, 'flash', startAt(ladderOf(p, 'flash'), v))
  },
  {
    id: 'add',
    world: 'garden',
    game: 'Méhecske',
    hint: '5 jó válasz egymás után: nehezebb szint, 3 nehéz feladat egymás után: könnyebb. Ez alá nem lép vissza.',
    options: ADD_LEVELS.map((l, i) => ({ value: i, label: `${i + 1}. ${l.name}` })),
    current: (p) => ladderOf(p, 'add').level,
    apply: (p, v) => withLadder(p, 'add', startAt(ladderOf(p, 'add'), v))
  },
  {
    id: 'pots',
    world: 'garden',
    game: 'Cserépbarátok',
    hint: '5 jó válasz egymás után: nehezebb szint, 3 nehéz feladat egymás után: könnyebb. Ez alá nem lép vissza.',
    options: POTS_LEVELS.map((l, i) => ({ value: i, label: `${i + 1}. ${l.name}` })),
    current: (p) => ladderOf(p, 'pots').level,
    apply: (p, v) => withLadder(p, 'pots', startAt(ladderOf(p, 'pots'), v))
  },
  {
    id: 'path',
    world: 'robot',
    game: 'Robotút',
    hint: 'Robotműhely. 4 jó pálya egymás után: nehezebb szint, 2 nehéz pálya egymás után: könnyebb. Ez alá nem lép vissza.',
    options: PATH_LEVELS.map((l, i) => ({ value: i, label: `${i + 1}. ${l.name}` })),
    current: (p) => ladderOf(p, 'path').level,
    apply: (p, v) => withLadder(p, 'path', startAt(ladderOf(p, 'path'), v))
  },
  {
    id: 'sort',
    world: 'robot',
    game: 'Válogatógép',
    hint: 'Robotműhely. 4 jó kör egymás után: nehezebb szint, 2 nehéz kör egymás után: könnyebb. Ez alá nem lép vissza.',
    options: SORT_LEVELS.map((l, i) => ({ value: i, label: `${i + 1}. ${l.name}` })),
    current: (p) => ladderOf(p, 'sort').level,
    apply: (p, v) => withLadder(p, 'sort', startAt(ladderOf(p, 'sort'), v))
  },
  {
    id: 'scale',
    world: 'robot',
    game: 'Mérleg',
    hint: 'Robotműhely. 4 jó kör egymás után: nehezebb szint, 2 nehéz kör egymás után: könnyebb. Ez alá nem lép vissza.',
    options: SCALE_LEVELS.map((l, i) => ({ value: i, label: `${i + 1}. ${l.name}` })),
    current: (p) => ladderOf(p, 'scale').level,
    apply: (p, v) => withLadder(p, 'scale', startAt(ladderOf(p, 'scale'), v))
  },
  {
    id: 'seq',
    world: 'robot',
    game: 'Mintagép',
    hint: 'Robotműhely. 4 jó kör egymás után: nehezebb szint, 2 nehéz kör egymás után: könnyebb. Ez alá nem lép vissza.',
    options: SEQ_LEVELS.map((l, i) => ({ value: i, label: `${i + 1}. ${l.name}` })),
    current: (p) => ladderOf(p, 'seq').level,
    apply: (p, v) => withLadder(p, 'seq', startAt(ladderOf(p, 'seq'), v))
  },
  {
    id: 'mirror',
    world: 'robot',
    game: 'Tükörgép',
    hint: 'Robotműhely. 4 jó kör egymás után: nehezebb szint, 2 nehéz kör egymás után: könnyebb. Ez alá nem lép vissza.',
    options: MIRROR_LEVELS.map((l, i) => ({ value: i, label: `${i + 1}. ${l.name}` })),
    current: (p) => ladderOf(p, 'mirror').level,
    apply: (p, v) => withLadder(p, 'mirror', startAt(ladderOf(p, 'mirror'), v))
  },
  {
    id: 'code',
    world: 'robot',
    game: 'Kódzár',
    hint: 'Robotműhely. 4 jó kör egymás után: nehezebb szint, 2 nehéz kör egymás után: könnyebb. Ez alá nem lép vissza.',
    options: CODE_LEVELS.map((l, i) => ({ value: i, label: `${i + 1}. ${l.name}` })),
    current: (p) => ladderOf(p, 'code').level,
    apply: (p, v) => withLadder(p, 'code', startAt(ladderOf(p, 'code'), v))
  }
];

import { ADD_LEVELS, clampLevel } from '../games/add/logic';
import { FLASH_ROUNDS_PER_LEVEL, LEVELS as FLASH_LEVELS, levelFor } from '../games/flash/logic';
import { LEARN_MAX } from '../games/learn/logic';
import { POTS_LEVELS, POTS_ROUNDS_PER_LEVEL, potsLevelFor } from '../games/pots/logic';
import { SHAPE_ORDER } from '../games/patterns/logic';
import { PATH_LEVELS, PATH_ROUNDS_PER_LEVEL, pathLevelIndex } from '../games/robot/path';
import { SORT_LEVELS, SORT_ROUNDS_PER_LEVEL, sortLevelIndex } from '../games/robot/sort';
import { PLANTS } from '../games/water/logic';
import type { Progress } from './progress';

// Per-game level settings for the parents' corner.
// Each setting reads the game's current level from progress and writes a new starting point;
// from there every game keeps progressing on its own.

export interface LevelOption {
  value: number;
  label: string;
}

export interface LevelSetting {
  id: 'learn' | 'water' | 'patterns' | 'flash' | 'add' | 'pots' | 'path' | 'sort';
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
    game: 'Virágsor',
    hint: 'Ezzel a mintával indul, aztán körbejárnak.',
    options: SHAPE_ORDER.map((shape, i) => ({ value: i, label: PATTERN_LABELS[shape] })),
    current: (p) => p.patternRound % SHAPE_ORDER.length,
    apply: (p, v) => ({ ...p, patternRound: v })
  },
  {
    id: 'flash',
    game: 'Magvillantás',
    hint: '4 jó válasz után magától lép tovább.',
    options: FLASH_LEVELS.map((l, i) => ({ value: i, label: `${i + 1}. ${l.name}` })),
    current: (p) => FLASH_LEVELS.indexOf(levelFor(p.flashSolved)),
    apply: (p, v) => ({ ...p, flashSolved: v * FLASH_ROUNDS_PER_LEVEL })
  },
  {
    id: 'add',
    game: 'Méhecske',
    hint: '5 jó válasz után Csepi nehezebbet ajánl, 3 nehéz feladat után könnyebbet. A gyerek dönt.',
    options: ADD_LEVELS.map((l, i) => ({ value: i, label: `${i + 1}. ${l.name}` })),
    current: (p) => clampLevel(p.addLevel),
    apply: (p, v) => ({ ...p, addLevel: v, addStreak: 0, addMisses: 0 })
  },
  {
    id: 'pots',
    game: 'Cserépbarátok',
    hint: '5 jó válasz után magától lép tovább.',
    options: POTS_LEVELS.map((l, i) => ({ value: i, label: `${i + 1}. ${l.name}` })),
    current: (p) => POTS_LEVELS.indexOf(potsLevelFor(p.potsSolved)),
    apply: (p, v) => ({ ...p, potsSolved: v * POTS_ROUNDS_PER_LEVEL })
  },
  {
    id: 'path',
    game: 'Robotút',
    hint: 'Robotműhely. 5 pálya után magától lép tovább.',
    options: PATH_LEVELS.map((l, i) => ({ value: i, label: `${i + 1}. ${l.name}` })),
    current: (p) => pathLevelIndex(p.pathSolved),
    apply: (p, v) => ({ ...p, pathSolved: v * PATH_ROUNDS_PER_LEVEL })
  },
  {
    id: 'sort',
    game: 'Válogatógép',
    hint: 'Robotműhely. 5 kör után magától lép tovább.',
    options: SORT_LEVELS.map((l, i) => ({ value: i, label: `${i + 1}. ${l.name}` })),
    current: (p) => sortLevelIndex(p.sortSolved),
    apply: (p, v) => ({ ...p, sortSolved: v * SORT_ROUNDS_PER_LEVEL })
  }
];

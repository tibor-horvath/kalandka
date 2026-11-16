import type { ComponentType } from 'react';
import { gardenMarks } from './garden/marks';
import type { WorldId } from './index';
import { robotMarks } from './robot/marks';
import { towerMarks } from './tower/marks';

// Each world's small signs that shared screens draw: its reward (seed, bolt, bell) and its mark on paper stickers.
// Art only, so the album and the parents' corner can show every world without loading its screens.

export interface WorldMarks {
  RewardIcon: ComponentType<{ size?: number }>;
  /** The world's sign on a Feladatlapok sticker's badge, in the sticker's 100 × 100 box; `color` is the badge's. */
  SheetMark: ComponentType<{ color: string }>;
}

export const WORLD_MARKS: Record<WorldId, WorldMarks> = { garden: gardenMarks, robot: robotMarks, tower: towerMarks };

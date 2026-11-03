import type { ComponentType } from 'react';
import type { GameId } from '../state/games';
import { Add } from './Add';
import { Flash } from './Flash';
import { Learn } from './Learn';
import { Patterns } from './Patterns';
import { Pots } from './Pots';
import { Trace } from './Trace';
import { Water } from './Water';
import { Code } from './robot/Code';
import { Fix } from './robot/Fix';
import { Mirror } from './robot/Mirror';
import { Path } from './robot/Path';
import { Scale } from './robot/Scale';
import { Seq } from './robot/Seq';
import { Sort } from './robot/Sort';

/** Each game's screen. App keys it by the game's round, so every task starts with fresh state. */
export const GAME_SCREENS: Record<GameId, ComponentType<{ onBack: () => void }>> = {
  learn: Learn,
  water: Water,
  patterns: Patterns,
  flash: Flash,
  add: Add,
  trace: Trace,
  pots: Pots,
  path: Path,
  sort: Sort,
  scale: Scale,
  seq: Seq,
  mirror: Mirror,
  code: Code,
  fix: Fix
};

import type { ComponentType, LazyExoticComponent } from 'react';
import type { GameId } from '../state/games';
import { Add } from './Add';
import { Flash } from './Flash';
import { Learn } from './Learn';
import { Patterns } from './Patterns';
import { Pots } from './Pots';
import { Trace } from './Trace';
import { Water } from './Water';
import { robotScreen } from './robot/lazy';

type GameScreen = ComponentType<{ onBack: () => void }>;

/** Each game's screen. App keys it by the game's round, so every task starts with fresh state. The workshop's load with their world (see robot/lazy.ts). */
export const GAME_SCREENS: Record<GameId, GameScreen | LazyExoticComponent<GameScreen>> = {
  learn: Learn,
  water: Water,
  patterns: Patterns,
  flash: Flash,
  add: Add,
  trace: Trace,
  pots: Pots,
  path: robotScreen('Path'),
  sort: robotScreen('Sort'),
  scale: robotScreen('Scale'),
  seq: robotScreen('Seq'),
  mirror: robotScreen('Mirror'),
  code: robotScreen('Code'),
  fix: robotScreen('Fix')
};

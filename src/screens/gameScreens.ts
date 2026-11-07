import type { ComponentType, LazyExoticComponent } from 'react';
import type { GameId } from '../state/games';
import { Add } from '../worlds/garden/screens/Add';
import { Flash } from '../worlds/garden/screens/Flash';
import { Learn } from '../worlds/garden/screens/Learn';
import { Patterns } from '../worlds/garden/screens/Patterns';
import { Pots } from '../worlds/garden/screens/Pots';
import { Trace } from '../worlds/garden/screens/Trace';
import { Water } from '../worlds/garden/screens/Water';
import { robotScreen } from '../worlds/robot/screens/lazy';

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

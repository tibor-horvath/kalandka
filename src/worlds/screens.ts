import type { ComponentType } from 'react';
import type { HubActions } from '../components/WorldHub';
import { gardenScreens } from './garden/ui';
import type { GameId, GameIdOf, WorldId } from './index';
import { robotScreens } from './robot/ui';
import { towerScreens } from './tower/ui';

// Each world's screens, for App: its home screen, its reward place and its games. Only App reads this list, so the
// shared screens and components never pull a world's screens in with them.

export type HubProps = HubActions & { onOpen: (game: GameId) => void; onReward: () => void };
export type PlaceProps = { onBack: () => void };

type GamesOf<W extends WorldId> = GameIdOf<W>;

export interface WorldScreens<W extends WorldId> {
  hub: ComponentType<HubProps>;
  reward: ComponentType<PlaceProps>;
  /** Fetches the world's chunk ahead of time; App starts it once the first screen is up. Missing: it loads with the app. */
  preload?: () => Promise<unknown>;
  games: Record<GamesOf<W>, ComponentType<PlaceProps>>;
}

export const WORLD_SCREENS: { [W in WorldId]: WorldScreens<W> } = {
  garden: gardenScreens,
  robot: robotScreens,
  tower: towerScreens
};

/** Each game's screen, whichever world it is in. App keys it by the game's round, so every task starts with fresh state. */
export const GAME_SCREENS = Object.assign({}, ...Object.values(WORLD_SCREENS).map((w) => w.games)) as Record<GameId, ComponentType<PlaceProps>>;

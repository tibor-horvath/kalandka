import type { WorldScreens } from '../screens';
import { gardenScreen, loadGardenWorld } from './screens/lazy';

/** The garden's screens, in a chunk of their own (see screens/lazy.ts), so the landing page loads without them. */
export const gardenScreens: WorldScreens<'garden'> = {
  hub: gardenScreen('Home'),
  reward: gardenScreen('Garden'),
  preload: loadGardenWorld,
  games: {
    learn: gardenScreen('Learn'),
    water: gardenScreen('Water'),
    patterns: gardenScreen('Patterns'),
    flash: gardenScreen('Flash'),
    add: gardenScreen('Add'),
    trace: gardenScreen('Trace'),
    pots: gardenScreen('Pots')
  }
};

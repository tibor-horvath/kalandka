import type { WorldScreens } from '../screens';
import { Add } from './screens/Add';
import { Flash } from './screens/Flash';
import { Garden } from './screens/Garden';
import { Home } from './screens/Home';
import { Learn } from './screens/Learn';
import { Patterns } from './screens/Patterns';
import { Pots } from './screens/Pots';
import { Trace } from './screens/Trace';
import { Water } from './screens/Water';

/** The garden's screens. They load with the app: the garden is where a new child starts. */
export const gardenScreens: WorldScreens<'garden'> = {
  hub: Home,
  reward: Garden,
  games: { learn: Learn, water: Water, patterns: Patterns, flash: Flash, add: Add, trace: Trace, pots: Pots }
};

import type { WorldScreens } from '../screens';
import { loadTowerWorld, towerScreen } from './screens/lazy';

/** The Óratorony's screens, in a chunk of their own (see screens/lazy.ts). */
export const towerScreens: WorldScreens<'tower'> = {
  hub: towerScreen('TowerHome'),
  reward: towerScreen('Town'),
  preload: loadTowerWorld,
  games: {
    day: towerScreen('Day'),
    season: towerScreen('SeasonGame'),
    set: towerScreen('SetClock'),
    read: towerScreen('ReadClock'),
    digi: towerScreen('Digital'),
    sleep: towerScreen('Sleep'),
    sand: towerScreen('Sand')
  }
};

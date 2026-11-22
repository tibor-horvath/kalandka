import type { WorldScreens } from '../screens';
import { loadRobotWorld, robotScreen } from './screens/lazy';

/** The workshop's screens, in a chunk of their own (see screens/lazy.ts): a child in the garden never runs them. */
export const robotScreens: WorldScreens<'robot'> = {
  hub: robotScreen('RobotHome'),
  reward: robotScreen('Workshop'),
  preload: loadRobotWorld,
  games: {
    path: robotScreen('Path'),
    sort: robotScreen('Sort'),
    scale: robotScreen('Scale'),
    seq: robotScreen('Seq'),
    mirror: robotScreen('Mirror'),
    code: robotScreen('Code'),
    fix: robotScreen('Fix')
  }
};

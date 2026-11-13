import { lazy } from 'react';

type TowerWorld = typeof import('./world');

/** Loads the Óratorony. App starts it once the app is on screen, like the workshop, so it is ready before a child sails there. */
export const loadTowerWorld = () => import('./world');

/** One Óratorony screen, drawn once the chunk is in (App wraps the screens in Suspense). */
export const towerScreen = <K extends keyof TowerWorld>(name: K) => lazy(async () => ({ default: (await loadTowerWorld())[name] }));

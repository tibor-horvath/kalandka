import { lazy } from 'react';

type RobotWorld = typeof import('./world');

/**
 * Loads the workshop world. The service worker has every chunk on the device, so this is quick; App still starts it
 * as soon as the app is on screen, so the workshop's screens are ready before a child sails there.
 */
export const loadRobotWorld = () => import('./world');

/** One workshop screen, drawn once the chunk is in (App wraps the screens in Suspense). */
export const robotScreen = <K extends keyof RobotWorld>(name: K) => lazy(async () => ({ default: (await loadRobotWorld())[name] }));

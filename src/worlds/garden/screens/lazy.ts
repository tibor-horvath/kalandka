import { lazy } from 'react';

type GardenWorld = typeof import('./world');

/**
 * Loads the garden. It is where a new child starts, but the landing page comes first and does not need it, so it
 * stays out of the first download (it was the bulk of it). App starts it once the app is on screen, like the other
 * worlds, and the service worker keeps it on the device, so the garden is ready before a child opens the game.
 */
export const loadGardenWorld = () => import('./world');

/** One garden screen, drawn once the chunk is in (App wraps the screens in Suspense). */
export const gardenScreen = <K extends keyof GardenWorld>(name: K) => lazy(async () => ({ default: (await loadGardenWorld())[name] }));

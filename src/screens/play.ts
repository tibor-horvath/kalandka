import { lazy } from 'react';

// The game's own screens outside the worlds (the map, the picker, the album, the rest screen), in a chunk of their
// own: the landing page paints without them. App starts loading them once the page is up, with the worlds' chunks.

type PlayScreens = typeof import('./playScreens');

export const loadPlayScreens = () => import('./playScreens');

const playScreen = <K extends keyof PlayScreens>(name: K) => lazy(async () => ({ default: (await loadPlayScreens())[name] }));

export const WorldMap = playScreen('WorldMap');
export const Picker = playScreen('Picker');
export const Album = playScreen('Album');
export const Rest = playScreen('Rest');
export const TimeBanner = playScreen('TimeBanner');
export const ReviewDone = playScreen('ReviewDone');

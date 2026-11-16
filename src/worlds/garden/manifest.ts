import type { WorldManifest } from '../types';

/** Számkertész, Csepi's world. */
export const garden = {
  id: 'garden',
  name: 'Számkertész',
  guide: 'Csepi',
  about: 'Számok, számolás, minták',
  speaker: 'csepi',
  color: '#2F7D32',
  // Seeds are what the Kiskert runs on, so they come every second task.
  reward: { unit: 'mag', yours: 'magod', tasksPer: 2, task: 'feladat' },
  games: [
    { id: 'learn', name: 'Számmagok' },
    { id: 'water', name: 'Locsolás', solvedFromPlants: true },
    { id: 'patterns', name: 'Virágsor' },
    { id: 'flash', name: 'Villámszem' },
    { id: 'add', name: 'Méhkas' },
    { id: 'trace', name: 'Mézút' },
    { id: 'pots', name: 'Cserépbarátok' }
  ]
} as const satisfies WorldManifest;

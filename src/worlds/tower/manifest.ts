import type { WorldManifest } from '../types';

/** Óratorony, Kakukk's world. */
export const tower = {
  id: 'tower',
  name: 'Óratorony',
  guide: 'Kakukk',
  about: 'Napszakok, napok, óra',
  // Kakukk speaks in Csepi's voice: the voice settings have one voice for the robot and one for the other guides.
  speaker: 'csepi',
  color: '#5B4B9A',
  reward: { unit: 'harang', yours: 'harangod', object: 'harangot', theirs: 'harangjai', tasksPer: 2, task: 'feladat' },
  games: [
    { id: 'day', name: 'Napirend' },
    { id: 'season', name: 'Évszakok' },
    { id: 'set', name: 'Óraállító' },
    { id: 'read', name: 'Hány óra?' },
    { id: 'digi', name: 'Digitóra' },
    { id: 'sleep', name: 'Kakukk alszik' },
    { id: 'sand', name: 'Homokóra' }
  ]
} as const satisfies WorldManifest;

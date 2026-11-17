import type { WorldManifest } from '../types';

/** Robotműhely, Csavar's world. */
export const robot = {
  id: 'robot',
  name: 'Robotműhely',
  guide: 'Csavar',
  about: 'Programozás, logika · nagyobbaknak',
  speaker: 'robot',
  color: '#5E7184',
  reward: { unit: 'csavar', yours: 'csavarod', object: 'csavart', theirs: 'csavarjai', tasksPer: 4, task: 'kör' },
  games: [
    { id: 'path', name: 'Robotút' },
    { id: 'sort', name: 'Válogatógép' },
    { id: 'scale', name: 'Mérleg' },
    { id: 'seq', name: 'Mintagép' },
    { id: 'mirror', name: 'Tükörgép' },
    { id: 'code', name: 'Kódzár' },
    { id: 'fix', name: 'Hibavadász' }
  ]
} as const satisfies WorldManifest;

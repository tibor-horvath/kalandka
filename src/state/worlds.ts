import type { Progress } from './progress';

// Kalandka's worlds. Every child may pick any world on the Kalandka map; the app opens in the one they chose last.

export type WorldId = 'garden' | 'robot';

export interface WorldInfo {
  id: WorldId;
  name: string;
  guide: string;
  /** Who it suits, shown on the map. */
  about: string;
}

export const WORLDS: WorldInfo[] = [
  { id: 'garden', name: 'Számkertész', guide: 'Csepi', about: 'Számok, számolás, minták' },
  { id: 'robot', name: 'Robotműhely', guide: 'Csavar', about: 'Programozás, logika · nagyobbaknak' }
];

export function currentWorld(p: Progress): WorldId {
  return p.world === 'robot' ? 'robot' : 'garden';
}

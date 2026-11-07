import type { WorldId } from '../state/worlds';

export interface WorldLook {
  /** The back button's label on the world's screens: back to its home. */
  back: string;
  /** Classes after `screen` that re-colour the shared parts. */
  className: string;
  /** The ground under a game, and under the world's reward place. */
  gameGround: string;
  placeGround: string;
  guide: 'csepi' | 'csavar';
}

/** How each world dresses the screens it shares with the others: games, its reward place and the guide's line. */
export const WORLD_LOOK: Record<WorldId, WorldLook> = {
  garden: { back: 'Vissza a kertbe', className: '', gameGround: 'meadow', placeGround: 'meadow', guide: 'csepi' },
  robot: { back: 'Vissza a műhelybe', className: ' world--robot', gameGround: 'floor', placeGround: 'hill floor', guide: 'csavar' }
};

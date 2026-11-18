import type { LadderGame } from '../state/games';
import { gardenDefs } from './garden/defs';
import { GAME_IDS, type GameId } from './index';
import { robotDefs } from './robot/defs';
import { towerDefs } from './tower/defs';
import type { GameDef, LadderDef } from './types';

// Every game's definition (worlds/<id>/defs.ts), for the shared tables built from them: ladder rules, level stickers,
// album rows, the parents' notes and tiles. A levelled game must bring its ladder; the type checker holds it to that.

type GameDefs = { readonly [G in GameId]: G extends LadderGame ? GameDef & { readonly ladder: LadderDef } : GameDef };

export const GAME_DEFS: GameDefs = { ...gardenDefs, ...robotDefs, ...towerDefs };

/** Each levelled game's ladder, in game order. */
export const LADDER_DEFS = Object.fromEntries(
  GAME_IDS.flatMap((id) => {
    const ladder = (GAME_DEFS[id] as GameDef).ladder;
    return ladder ? [[id, ladder]] : [];
  })
) as Record<LadderGame, LadderDef>;

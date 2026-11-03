import { describe, expect, it } from 'vitest';
import { PRINT_SHEETS } from '../print/catalog';
import { GAME_IDS, GAMES, gamesIn } from './games';
import { gameNotes } from './insights';
import { DEFAULT_PROGRESS } from './progress';
import { STICKER_GAMES, STICKERS } from './rewards';

// The lists the type checker cannot hold to the game list: a new game must appear in each of them.

describe('every game in the game list', () => {
  it('has its row in the sticker album, on its own world\'s page', () => {
    for (const id of GAME_IDS) expect(STICKER_GAMES.find((g) => g.id === id)?.world).toBe(GAMES[id].world);
  });

  it('has stickers to earn', () => {
    for (const id of GAME_IDS) expect(STICKERS.some((s) => s.game === id)).toBe(true);
  });

  it('has printable sheets in its own world', () => {
    for (const id of GAME_IDS) expect(PRINT_SHEETS.find((s) => s.id === id)?.world).toBe(GAMES[id].world);
  });

  it('gets a note in the parents\' overview', () => {
    const named = gameNotes(DEFAULT_PROGRESS, '2026-11-03').map((n) => n.game);
    expect(named.sort()).toEqual(GAME_IDS.map((id) => GAMES[id].name).sort());
  });

  it('fits on its world\'s island, which has room for seven games', () => {
    for (const world of ['garden', 'robot'] as const) expect(gamesIn(world).length).toBeLessThanOrEqual(7);
  });
});

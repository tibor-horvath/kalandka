import { describe, expect, it } from 'vitest';
import { WORLD_LOOK } from '../components/worldLook';
import { PRINT_SHEETS } from '../print/catalog';
import { GAME_DEFS, LADDER_DEFS } from '../worlds/defs';
import { WORLD_MARKS } from '../worlds/marks';
import { GAME_SCREENS, WORLD_SCREENS } from '../worlds/screens';
import { GAME_IDS, GAMES, LADDER_GAMES, gamesIn } from './games';
import { gameNotes } from './insights';
import { DEFAULT_PROGRESS } from './progress';
import { STICKER_GAMES, STICKERS } from './stickers';
import { WORLD_IDS } from './worlds';

// What the type checker cannot hold to the game and world lists: a new game or world must appear in each of these.

describe('every game in the game list', () => {
  it('has a definition, and a ladder exactly when it is a levelled game', () => {
    for (const id of GAME_IDS) expect(GAME_DEFS[id]?.look).toBeDefined();
    expect(Object.keys(LADDER_DEFS)).toEqual(LADDER_GAMES);
  });

  it('has a screen', () => {
    for (const id of GAME_IDS) expect(GAME_SCREENS[id]).toBeDefined();
  });

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
});

describe('every levelled game\'s definition', () => {
  it.each(LADDER_GAMES)('%s: level stickers start on the first level, climb, and stay on the ladder', (id) => {
    const { levels, stickers, ageStart, upAt } = LADDER_DEFS[id];
    expect(stickers[0]?.from).toBe(0);
    for (let i = 1; i < stickers.length; i++) expect(stickers[i].from).toBeGreaterThan(stickers[i - 1].from);
    expect(stickers.at(-1)!.from).toBeLessThan(levels.length);
    for (const level of Object.values(ageStart ?? {})) expect(level).toBeLessThan(levels.length);
    for (const level of Object.keys(upAt ?? {})) expect(Number(level)).toBeLessThan(levels.length);
  });
});

describe('every world on the map', () => {
  it.each(WORLD_IDS)('%s has its screens, look and marks', (world) => {
    expect(WORLD_SCREENS[world]).toBeDefined();
    expect(WORLD_LOOK[world]).toBeDefined();
    expect(WORLD_MARKS[world]).toBeDefined();
  });

  it.each(WORLD_IDS)('%s has games, room for them on its island (seven), and album rows past its games', (world) => {
    const games = gamesIn(world);
    expect(games.length).toBeGreaterThan(0);
    expect(games.length).toBeLessThanOrEqual(7);
    // The reward place and the paper sheets have rows of their own on the world's album page.
    expect(STICKER_GAMES.filter((g) => g.world === world).length).toBeGreaterThan(games.length);
  });
});

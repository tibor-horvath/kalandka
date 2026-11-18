// The shape of a world's manifest (worlds/<id>/manifest.ts): everything shared code needs to know about a world,
// as plain data. Manifests import nothing at run time, so any shared module may read them without an import loop.
// The world's screens and art are listed apart, in worlds/<id>/ui.tsx (see worlds/ui.ts).

export interface GameManifest {
  readonly id: string;
  readonly name: string;
  /** Locsolás counts the plants in its garden instead of a solved count of its own. */
  readonly solvedFromPlants?: true;
}

export interface WorldManifest {
  readonly id: string;
  readonly name: string;
  readonly guide: string;
  /** Who it suits, shown on the map. */
  readonly about: string;
  /** Whose voice the guide speaks in (see lib/speech.ts): Kakukk speaks in Csepi's. */
  readonly speaker: 'csepi' | 'robot';
  /** The world's colour on its stickers' badges. */
  readonly color: string;
  readonly reward: {
    /** One of the rewards, as a word: "mag". */
    readonly unit: string;
    /** "Your …", for Csepi's lines: "magod". */
    readonly yours: string;
    /** As an object: "magot", "csavart", "harangot". */
    readonly object: string;
    /** The child's, for the parents' corner: "Panni magjai". */
    readonly theirs: string;
    /** Solved tasks that fill the reward pod and pay one. */
    readonly tasksPer: number;
    /** What a solved task is called in the parents' corner: "feladat", or the workshop's "kör". */
    readonly task: string;
  };
  /** The world's games, in hub order. */
  readonly games: readonly GameManifest[];
}

// ---------- game definitions (worlds/<id>/defs.ts) ----------
// Unlike the manifest, a world's game definitions may import its games' logic (the level lists), so only modules
// that already read the ladders import them (see worlds/defs.ts).

/** How a game looks where shared screens list it: the parents' corner, the print shelf, the sticker album. */
export interface GameLook {
  /** Short skill under the game's name in the parents' corner. */
  readonly skill: string;
  /** Said instead of the ladder's step rule, for a game without a ladder (Számmagok). */
  readonly mode?: string;
  /** The few characters on the game's tile, and its tile colour class (`pa-tile--sky`). */
  readonly glyph: string;
  readonly tile: string;
  /** The tile's glyph on the print shelf, where it differs. */
  readonly sheetGlyph?: string;
  /** The game's sticker colour, and the ink on it (light colours carry dark ink). */
  readonly color: string;
  readonly ink: string;
  /** The name in the album's narrow columns, with soft hyphens, where it is long. */
  readonly albumName?: string;
  /** Another backdrop than the world's own game ground (Locsolás's lawn). */
  readonly backdrop?: string;
}

/** One level sticker: it stands for its ladder level `from` (0-based); `legacy` names the old stickers it replaces. */
export interface LevelSticker {
  readonly from: number;
  readonly mark: string;
  readonly label: string;
  readonly praise: string;
  readonly legacy?: readonly string[];
}

/** A levelled game's ladder, and what the parents' corner says about it. */
export interface LadderDef {
  /** Its levels, easiest first; only their names are read by shared code. */
  readonly levels: readonly { readonly name: string }[];
  /** Tasks in a row without help that step up; `upAt` asks more on some levels. Tasks in a row that needed help step down. */
  readonly up: number;
  readonly upAt?: Partial<Record<number, number>>;
  readonly down: number;
  /** How the level hint names a task solved alone and one that needed help. */
  readonly stepWords: {
    readonly good: string;
    readonly hard: string;
    /** Explains what "needing help" means where it is not obvious. */
    readonly note?: string;
    /** Names the levels that want a longer row, as in "a vegyes szinteken". */
    readonly longer?: string;
  };
  /** The parents' note: where ("A Virágsorban"), what one task is called, what needing help looks like, and an idea for home. */
  readonly notes: { readonly where: string; readonly unit: string; readonly hard: string; readonly home: string };
  /** What the overview counts on the game's line ("virág"); without it the line shows the level alone. */
  readonly counted?: string;
  /** Where a new child of this age starts (0-based); left out: the bottom. */
  readonly ageStart?: Partial<Record<'6' | '7+', number>>;
  /** One sticker per level or group of levels, easiest first. */
  readonly stickers: readonly LevelSticker[];
}

export interface GameDef {
  readonly look: GameLook;
  readonly ladder?: LadderDef;
}

/** A world's game definitions: one for each game in its manifest. */
export type GameDefsOf<W extends import('./index').WorldId> = Record<import('./index').GameIdOf<W>, GameDef>;

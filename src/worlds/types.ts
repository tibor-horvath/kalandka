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

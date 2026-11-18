import { describe, expect, it } from 'vitest';
import { DEFAULT_PROGRESS } from '../state/progress';
import { markPageDone, pagesDoneIn } from '../state/stickers';
import { buildPages, sheetFor } from './catalog';
import { MIX_STAGES, stageLevels, type MixTask } from './mix';

describe('Vegyes kör sheets', () => {
  it('share every game’s levels out over the stages, easiest first, missing none', () => {
    for (const n of [1, 2, 3, 4, 5, 7, 10]) {
      const all = MIX_STAGES.flatMap((_, k) => stageLevels(n, k));
      expect(new Set(all)).toEqual(new Set(Array.from({ length: n }, (_, i) => i)));
      MIX_STAGES.forEach((_, k) => expect(stageLevels(n, k).length).toBeGreaterThan(0));
    }
  });

  it('mix the world’s own games, never one twice in a row, and leave Számmagok out', () => {
    const s = sheetFor('mixgarden');
    const [page] = buildPages(s, { level: 1, density: 'many', pages: 1, batch: 3 });
    const tasks = page.tasks as MixTask[];
    expect(tasks).toHaveLength(9);
    for (const t of tasks) expect(sheetFor(t.id).world).toBe('garden');
    expect(tasks.map((t) => t.id)).not.toContain('learn');
    tasks.slice(1).forEach((t, i) => expect(t.id).not.toBe(tasks[i].id));
  });

  it('count as a page of their world, pay into its pod, and move no game’s level', () => {
    const p = markPageDone(DEFAULT_PROGRESS, 'mixrobot.1.0.n.3.0', [true, true, true, true, true, true]);
    expect(pagesDoneIn(p, 'robot')).toBe(1);
    expect(p.worlds.robot.tasks).toBe(6);
    expect(p.ladders).toEqual(DEFAULT_PROGRESS.ladders);
  });
});

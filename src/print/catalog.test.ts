import { describe, expect, it } from 'vitest';
import { DEFAULT_PROGRESS } from '../state/progress';
import { PRINT_SHEETS, buildPages, tasksPerPage } from './catalog';
import { DENSITIES } from './sheet';

describe('printable sheets', () => {
  it('has a sheet for every game', () => {
    expect(PRINT_SHEETS.map((s) => s.id).sort()).toEqual(['add', 'code', 'fix', 'flash', 'learn', 'mirror', 'path', 'patterns', 'pots', 'scale', 'seq', 'sort', 'trace', 'water']);
  });

  it('fills every page of every level and size', () => {
    for (const s of PRINT_SHEETS) {
      for (let level = 0; level < s.levels.length; level++) {
        for (const { id: density } of DENSITIES) {
          const pages = buildPages(s, { level, density, pages: 2, batch: 3 });
          const count = tasksPerPage(s, level, density);
          expect(pages, `${s.id} ${level} ${density}`).toHaveLength(2);
          for (const p of pages) expect(p.tasks, `${s.id} ${level} ${density}`).toHaveLength(count);
        }
      }
    }
  });

  it('puts more tasks on a page the smaller they are', () => {
    for (const s of PRINT_SHEETS) {
      for (let level = 0; level < s.levels.length; level++) {
        const [big, normal, many] = DENSITIES.map((d) => tasksPerPage(s, level, d.id));
        expect(big, s.id).toBeLessThan(normal);
        expect(normal, s.id).toBeLessThan(many);
        expect(big, s.id).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('prints the same tasks for the same choice, and new ones for the next batch only where "Új feladatok" is offered', () => {
    for (const s of PRINT_SHEETS) {
      for (let level = 0; level < s.levels.length; level++) {
        const at = (batch: number) => buildPages(s, { level, density: 'normal', pages: 1, batch });
        expect(at(1)).toEqual(at(1));
        if (s.reshuffles?.(level) ?? true) expect(at(2), `${s.id} ${level}`).not.toEqual(at(1));
        else expect(at(2), `${s.id} ${level}`).toEqual(at(1));
      }
    }
  });

  it('copes with any printout number the page may pick', () => {
    for (const s of PRINT_SHEETS) {
      for (let level = 0; level < s.levels.length; level++) {
        expect(() => buildPages(s, { level, density: 'many', pages: 5, batch: 9_999 }), `${s.id} ${level}`).not.toThrow();
      }
    }
  });

  it('starts a new child on the first level', () => {
    for (const s of PRINT_SHEETS) expect(s.current(DEFAULT_PROGRESS), s.id).toBe(0);
  });
});

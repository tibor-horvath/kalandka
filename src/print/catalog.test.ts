import { describe, expect, it } from 'vitest';
import { DEFAULT_PROGRESS } from '../state/progress';
import { markPageDone, pagesDoneIn } from '../state/rewards';
import { PRINT_SHEETS, buildPages, openLink, pageRef, sheetFor, tasksPerPage } from './catalog';
import { linkHash, pageKey, readLink, readScanned } from './link';
import REVISIONS from './revisions.json';
import { DENSITIES, MAX_PAGES } from './sheet';

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

describe('answer links', () => {
  it('leads every page of every game, level and size back to its own tasks', () => {
    for (const s of PRINT_SHEETS) {
      for (let level = 0; level < s.levels.length; level++) {
        for (const { id: density } of DENSITIES) {
          const choice = { level, density, pages: MAX_PAGES, batch: 9_999 };
          buildPages(s, choice).forEach((p, page) => {
            const opened = openLink(readLink(linkHash(pageRef(s, choice, page)))!);
            expect(opened.kind === 'page' && opened.tasks, `${s.id} ${level} ${density} ${page}`).toEqual(p.tasks);
          });
        }
      }
    }
  });

  it('fits a version 4 code on the real address, so the printed square stays about 20 mm', () => {
    const longest = PRINT_SHEETS.map((s) => `https://www.kalandka.hu/${linkHash(pageRef(s, { level: 9, density: 'normal', pages: 5, batch: 999_999 }, 4))}`);
    for (const url of longest) expect(url.length, url).toBeLessThanOrEqual(62);
  });

  it('counts a finished page of every game in that game’s world', () => {
    for (const s of PRINT_SHEETS) {
      const key = pageKey(pageRef(s, { level: 0, density: 'normal', pages: 1, batch: 1 }, 0));
      expect(pagesDoneIn(markPageDone(DEFAULT_PROGRESS, key, 1), s.world), s.id).toBe(1);
    }
  });

  it('opens a scanned sheet with the very tasks printed on it, from any copy of the app', () => {
    for (const s of PRINT_SHEETS) {
      const choice = { level: s.levels.length - 1, density: 'normal' as const, pages: 3, batch: 4242 };
      const opened = openLink(readScanned(`https://www.kalandka.hu/${linkHash(pageRef(s, choice, 2))}`)!);
      expect(opened.kind === 'page' && opened.tasks, s.id).toEqual(buildPages(s, choice)[2].tasks);
    }
    expect(readScanned('https://example.com/')).toBeNull();
    expect(readScanned('WIFI:S:otthon;;')).toBeNull();
  });

  it('sees through links it did not print', () => {
    expect(readLink('')).toBeNull();
    expect(readLink('#valami')).toBeNull();
    for (const hash of ['#lap1=', '#lap1=code', '#lap1=code.1.2.x.1.0', '#lap1=code.1.2.n.-1.0', '#lap1=code.1.2.n.007.0', '#lap01=code.1.2.n.7.0']) {
      expect(readLink(hash), hash).toEqual({ kind: 'bad' });
    }
    expect(openLink(readLink('#lap1=nincs.1.0.n.1.0')!)).toEqual({ kind: 'bad' });
    expect(openLink(readLink('#lap1=code.1.99.n.1.0')!)).toEqual({ kind: 'bad' });
    expect(openLink(readLink(`#lap1=code.1.0.n.1.${MAX_PAGES}`)!)).toEqual({ kind: 'bad' });
  });

  it('never shows the answers of another revision', () => {
    const s = sheetFor('code');
    const hash = (rev: number) => linkHash({ id: s.id, rev, level: 0, density: 'normal', batch: 1, page: 0 });
    expect(openLink(readLink(hash(s.rev))!).kind).toBe('page');
    expect(openLink(readLink(hash(s.rev - 1))!).kind).toBe('older');
    expect(openLink(readLink(hash(s.rev + 1))!).kind).toBe('newer');
    expect(openLink(readLink('#lap2=code.1.0.n.1.0')!).kind).toBe('newer');
  });

  /** A short fingerprint of everything the game puts on paper. */
  function fingerprint(s: (typeof PRINT_SHEETS)[number]): string {
    const pages = s.levels.flatMap((_, level) => DENSITIES.flatMap(({ id: density }) => [0, 1, 9_999].map((batch) => buildPages(s, { level, density, pages: 2, batch }))));
    let h = 0x811c9dc5;
    for (const c of JSON.stringify(pages)) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193);
    return (h >>> 0).toString(16);
  }

  it('makes every change to the tasks raise the game\'s revision', () => {
    const known: Record<string, string> = REVISIONS;
    for (const s of PRINT_SHEETS) {
      const key = `${s.id}@${s.rev}`;
      // New tasks: raise `rev` in the game's PrintSpec and add this line to revisions.json, keeping the old lines.
      expect(`${key} ${known[key]}`, `${s.id}: its tasks changed, so old printed pages would show wrong answers`).toBe(`${key} ${fingerprint(s)}`);
    }
  });
});

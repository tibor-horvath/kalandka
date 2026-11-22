import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ExplainSheet } from '../../print/sheet';
import { TOWER_SHEETS } from './print';

describe('magyarázó lap', () => {
  // The footer prints the site's address, read from the page; the tests run without one.
  beforeAll(() => vi.stubGlobal('window', { location: { host: 'www.kalandka.hu' } }));
  afterAll(() => vi.unstubAllGlobals());

  it('draws every Óratorony level’s explanation on paper, one picture per slide', () => {
    for (const s of TOWER_SHEETS) {
      s.levels.forEach((_, level) => {
        const explainer = s.explain?.(level);
        expect(explainer, `${s.id} ${level}`).toBeTruthy();
        const html = renderToStaticMarkup(<ExplainSheet spec={s} level={level} explainer={explainer!} />);
        expect(html.match(/class="ps-explain__slide"/g)?.length).toBe(explainer!.slides.length);
        expect(html).not.toContain('ps-foot__qr');
      });
    }
  });
});

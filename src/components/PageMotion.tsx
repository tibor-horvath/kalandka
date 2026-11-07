import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';

const SLIDE_MS = 320;
const FADE_MS = 120;
/** How far the new page starts off to the side, as a share of the stage's width. */
const SLIDE_SHIFT = '18%';
const EASING = 'cubic-bezier(.2, .8, .2, 1)';
/** A game opened through its place's door: the top bar drops in, then the play rises. */
const BAR_MS = 250;
const PLAY_MS = 300;
const PLAY_DELAY = 80;

/** Moves a part of the new page in from `y` px away, on top of wherever its own styles put it. */
function arrive(part: Element, y: number, duration: number, delay = 0) {
  part.animate([{ translate: `0 ${y}px` }, { translate: '0 0' }], { duration, delay, easing: EASING, fill: 'backwards', composite: 'add' });
  part.animate([{ opacity: 0 }, { opacity: 1 }], { duration, delay, easing: EASING, fill: 'backwards' });
}

/**
 * Plays a short, one-off motion as a new page comes in: going deeper (a higher `depth`) it slides in
 * from the right, going back up from the left, and between pages at the same depth it fades in.
 * Only the incoming page moves and taps are never blocked. Changing `page` remounts the children,
 * so a page that remounts itself (a new round) does not replay the motion.
 * Through a `door` (a game opened from its place, and back) the island draws the way itself: a game
 * then only brings in its top bar and play, and the island coming back does not move at all.
 * `settling` lets the old game's play sink away before it is left.
 */
export function PageMotion({ page, depth, door, settling, children }: { page: string; depth: number; door: boolean; settling: boolean; children: ReactNode }) {
  const el = useRef<HTMLDivElement>(null);
  const lastDepth = useRef<number | null>(null);

  // Before paint, so the first frame of the new page is already the start of the motion.
  useLayoutEffect(() => {
    const before = lastDepth.current;
    lastDepth.current = depth;
    if (before === null || !el.current?.animate) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || before === depth) {
      el.current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS, easing: 'ease-out' });
      return;
    }
    if (door) {
      const screen = el.current.querySelector(':scope > .screen');
      const bar = screen?.querySelector(':scope > .topbar');
      if (depth < before || !screen || !bar) return;
      arrive(bar, -24, BAR_MS);
      for (const part of screen.children) {
        if (part !== bar && part.getAttribute('aria-hidden') !== 'true') arrive(part, 20, PLAY_MS, PLAY_DELAY);
      }
      return;
    }
    const from = depth > before ? SLIDE_SHIFT : `-${SLIDE_SHIFT}`;
    el.current.animate(
      [
        { translate: `${from} 0`, opacity: 0 },
        { translate: '0 0', opacity: 1 }
      ],
      { duration: SLIDE_MS, easing: EASING }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `page` is the trigger; `depth` is read from the same render.
  }, [page]);

  // Focus starts on the new page's heading, not lost on the old page that just went away, unless the page already
  // moved it (a popup's autoFocus). The first page keeps the browser's own start.
  const shown = useRef(false);
  useEffect(() => {
    const first = !shown.current;
    shown.current = true;
    const root = el.current;
    if (first || !root || root.contains(document.activeElement)) return;
    const target = root.querySelector<HTMLElement>('h1') ?? root.querySelector<HTMLElement>('h2') ?? root;
    if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }, [page]);

  return (
    <div key={page} ref={el} className={settling ? 'page page--settling' : 'page'}>
      {children}
    </div>
  );
}

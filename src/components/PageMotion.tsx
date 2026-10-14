import { useLayoutEffect, useRef, type ReactNode } from 'react';

const SLIDE_MS = 320;
const FADE_MS = 120;
/** How far the new page starts off to the side, as a share of the stage's width. */
const SLIDE_SHIFT = '18%';
const EASING = 'cubic-bezier(.2, .8, .2, 1)';

/**
 * Plays a short, one-off motion as a new page comes in: going deeper (a higher `depth`) it slides in
 * from the right, going back up from the left, and between pages at the same depth it fades in.
 * Only the incoming page moves and taps are never blocked. Changing `page` remounts the children,
 * so a page that remounts itself (a new round) does not replay the motion.
 */
export function PageMotion({ page, depth, children }: { page: string; depth: number; children: ReactNode }) {
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
    const from = depth > before ? SLIDE_SHIFT : `-${SLIDE_SHIFT}`;
    el.current.animate(
      [
        { translate: `${from} 0`, opacity: 0 },
        { translate: '0 0', opacity: 1 }
      ],
      { duration: SLIDE_MS, easing: EASING }
    );
    // `page` is the trigger; `depth` is read from the same render.
  }, [page]);

  return (
    <div key={page} ref={el} className="page">
      {children}
    </div>
  );
}

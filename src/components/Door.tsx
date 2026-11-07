import { useEffect, useRef } from 'react';
import type { GameId } from '../state/games';
import type { WorldId } from '../state/worlds';
import { GameBackdrop } from './GameShell';
import { PlaceBackdrop } from './PlaceShell';

/** What a place on the island opens: one of the world's games, or its reward place (Kiskertem, Robotépítő). */
export type DoorPlace = GameId | 'reward';

/** The place's screen, empty: its sky and ground without anything on them. */
function Backdrop({ place, world }: { place: DoorPlace; world: WorldId }) {
  return place === 'reward' ? <PlaceBackdrop world={world} /> : <GameBackdrop game={place} />;
}

/** Opening (ms): the game's backdrop grows out of the tapped place, after the place's first hop. */
const OPEN_DELAY = 100;
const OPEN_MS = 350;
/** Closing (ms): the backdrop shrinks back into the place the child came out of. */
const CLOSE_MS = 320;

/**
 * The way into a place and back out: its empty screen, cut to a circle around the place on the island.
 * `in` grows it from the place until it fills the screen; `out` starts full and shrinks back into the place,
 * then tells the island it has landed. It lies over the whole page and never takes a tap.
 */
export function Door({ place, world, way, onDone }: { place: DoorPlace; world: WorldId; way: 'in' | 'out'; onDone?: () => void }) {
  const el = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    let anim: Animation | null = null;
    // A frame later, so a phone island has already scaled itself to its room before the place is measured.
    const frame = requestAnimationFrame(() => {
      const door = el.current;
      const disc = door?.parentElement?.querySelector(`[data-place="${place}"] .spot__disc`);
      if (!door?.animate || !disc) {
        done.current?.();
        return;
      }
      // Everything in the stage's own px: the stage is scaled to fit the window.
      const box = door.getBoundingClientRect();
      const k = box.width / door.offsetWidth || 1;
      const d = disc.getBoundingClientRect();
      const x = (d.left + d.width / 2 - box.left) / k;
      const y = (d.top + d.height / 2 - box.top) / k;
      const corners = [
        [-box.left, -box.top],
        [window.innerWidth - box.left, -box.top],
        [-box.left, window.innerHeight - box.top],
        [window.innerWidth - box.left, window.innerHeight - box.top]
      ];
      const far = Math.max(...corners.map(([cx, cy]) => Math.hypot(cx / k - x, cy / k - y)));
      const shut = `circle(${Math.min(d.width, d.height) / 2 / k}px at ${x}px ${y}px)`;
      const wide = `circle(${far}px at ${x}px ${y}px)`;
      anim =
        way === 'in'
          ? door.animate([{ clipPath: shut }, { clipPath: wide }], { duration: OPEN_MS, delay: OPEN_DELAY, easing: 'cubic-bezier(.6, 0, .2, 1)', fill: 'both' })
          : door.animate(
              [
                { clipPath: wide, opacity: 1 },
                { clipPath: shut, opacity: 1, offset: 0.85 },
                { clipPath: shut, opacity: 0 }
              ],
              { duration: CLOSE_MS, easing: 'cubic-bezier(.4, 0, .6, 1)', fill: 'both' }
            );
      anim.onfinish = () => done.current?.();
    });
    return () => {
      cancelAnimationFrame(frame);
      anim?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Plays once, when the door appears.
  }, []);

  return (
    <div ref={el} className={`door door--${way}`} aria-hidden="true">
      <Backdrop place={place} world={world} />
    </div>
  );
}

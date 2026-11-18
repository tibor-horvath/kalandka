import { useEffect } from 'react';
import { DoneTick, GuideBubble, NextIcon } from '../components/ui';
import { WORLD_LOOK } from '../components/worldLook';
import { speak } from '../lib/speech';
import { gameName } from '../state/games';
import type { ReviewTask } from '../state/review';
import type { WorldId } from '../state/worlds';

const LINES: Record<WorldId, string> = {
  garden: 'Kész a vegyes kör! Minden kertes játékból tudtál valamit.',
  robot: 'Bip-bup! Kész a vegyes kör! Minden gép működik.',
  tower: 'Kakukk! Kész a vegyes kör! Ügyes voltál.'
};

/** The world's own button colour, as its games' "Következő". */
const BUTTON: Record<WorldId, string> = { garden: 'big-btn', robot: 'big-btn big-btn--robot', tower: 'big-btn big-btn--tower' };

/**
 * The end of a Vegyes kör: the guide's line and every task of the round with its tick, so it is plain the round is
 * done, then the way back to the island. It stands still: no confetti, no looping motion.
 */
export function ReviewDone({ world, tasks, onBack }: { world: WorldId; tasks: ReviewTask[]; onBack: () => void }) {
  const look = WORLD_LOOK[world];
  useEffect(() => {
    speak(LINES[world]);
  }, [world]);

  return (
    <div className={`screen review-done${look.className}`}>
      <div className={look.gameGround} aria-hidden="true" />
      <div className="review-done__body">
        <GuideBubble guide={look.guide} mood="cheer" tone="good" csepiWidth={90}>
          <span className="review-done__title">Kész a vegyes kör!</span>
        </GuideBubble>
        <ol className="review-done__tasks" aria-label={`${tasks.length} feladat kész`}>
          {tasks.map((t, i) => (
            <li key={i} className="review-done__task">
              <DoneTick />
              <span>{gameName(t.game)}</span>
            </li>
          ))}
        </ol>
        <button type="button" className={BUTTON[world]} onClick={onBack}>
          {look.back} <NextIcon />
        </button>
      </div>
    </div>
  );
}

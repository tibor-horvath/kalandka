import { useEffect, useRef, useState } from 'react';
import { Seed } from './art';
import { SeedSack } from './kiskert';
import { popBubble } from '../../lib/sound';
import { capitalize, numberCount } from '../../lib/numbers';
import { speak } from '../../lib/speech';

/** How long the full tray stays in view before the seeds are spent, so the child sees what they counted. */
const SETTLE_MS = 700;

/**
 * Counting seeds out: one hole per seed the thing costs, in rows of five like a ten-frame. Each tap (on the
 * tray or the sack) drops the next seed into the next hole, Csepi says its number and the sack's count goes
 * down by one. Nothing is spent until the last hole fills; leaving before that keeps every seed.
 */
export function SeedCount({
  cost,
  balance,
  label,
  onCount,
  onDone
}: {
  cost: number;
  /** Seeds in the sack before counting. */
  balance: number;
  /** What the seeds are for, read out by screen readers: "Körtefa". */
  label: string;
  /** Each seed counted, 1 … cost, for the guide's line. */
  onCount?: (n: number) => void;
  onDone: () => void;
}) {
  const [n, setN] = useState(0);
  const done = n >= cost;
  const finish = useRef(onDone);
  finish.current = onDone;

  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => finish.current(), SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [done]);

  const drop = () => {
    if (done) return;
    const next = n + 1;
    setN(next);
    popBubble(Math.min(next, 5));
    speak(`${capitalize(numberCount(next))}!`);
    onCount?.(next);
  };

  // Rows of five; a short last row stays at the left, as on a ten-frame.
  const rows = Math.ceil(cost / 5);
  return (
    <button
      type="button"
      className={`seed-count${done ? ' is-done' : ''}`}
      onClick={drop}
      aria-label={done ? `${label}: mind a ${cost} mag a helyén.` : `Tegyél bele egy magot. ${cost} kell, ${n} már bent van. A zsákban ${balance - n} mag.`}
    >
      <span className="seed-count__tray" style={{ gridTemplateRows: `repeat(${rows}, auto)` }} aria-hidden="true">
        {Array.from({ length: cost }, (_, k) => (
          <span key={k} className={`seed-count__hole${k < n ? ' is-full' : ''}`}>
            {k < n && (
              <span className="seed-count__seed">
                <Seed size={30} />
              </span>
            )}
          </span>
        ))}
      </span>
      <span className="seed-count__sack" aria-hidden="true">
        <SeedSack />
        <span className="seed-count__left">
          <Seed size={22} />
          {balance - n}
        </span>
      </span>
    </button>
  );
}

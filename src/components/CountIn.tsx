import { useEffect, useRef, useState, type ReactNode } from 'react';
import { popBubble } from '../lib/sound';
import { capitalize, numberCount } from '../lib/numbers';
import { speak } from '../lib/speech';

/** How long the full tray stays in view before the reward is spent, so the child sees what they counted. */
const SETTLE_MS = 700;

/**
 * Counting a price out: one hole per seed (or bolt) the thing costs, in rows of five like a ten-frame. Each tap (on
 * the tray or the store) drops the next one into the next hole, the guide says its number and the store's count
 * goes down by one. Nothing is spent until the last hole fills; leaving before that keeps everything.
 */
export function CountIn({
  cost,
  balance,
  label,
  unit,
  unitObj,
  token,
  store,
  className = '',
  onCount,
  onDone
}: {
  cost: number;
  /** What is in the store before counting. */
  balance: number;
  /** What the price is for, read out by screen readers: "Körtefa". */
  label: string;
  /** "mag", "csavar": one of what is counted, for the screen reader. */
  unit: string;
  /** The same as an object: "magot", "csavart". */
  unitObj: string;
  /** One counted thing at a size, drawn in a hole and beside the store's count. */
  token: (size: number) => ReactNode;
  /** The sack or box the things come from. */
  store: ReactNode;
  /** A modifier for the world's colours. */
  className?: string;
  /** Each one counted, 1 … cost, for the guide's line. */
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
      className={`seed-count${done ? ' is-done' : ''}${className ? ` ${className}` : ''}`}
      onClick={drop}
      aria-label={done ? `${label}: mind a ${cost} ${unit} a helyén.` : `Tegyél bele egy ${unitObj}. ${cost} kell, ${n} már bent van. Még ${balance - n} ${unit} van.`}
    >
      <span className="seed-count__tray" style={{ gridTemplateRows: `repeat(${rows}, auto)` }} aria-hidden="true">
        {Array.from({ length: cost }, (_, k) => (
          <span key={k} className={`seed-count__hole${k < n ? ' is-full' : ''}`}>
            {k < n && <span className="seed-count__seed">{token(30)}</span>}
          </span>
        ))}
      </span>
      <span className="seed-count__sack" aria-hidden="true">
        {store}
        <span className="seed-count__left">
          {token(22)}
          {balance - n}
        </span>
      </span>
    </button>
  );
}

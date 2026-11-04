import { useEffect, useRef, useState } from 'react';
import type { ArrivalProgress } from '../state/rewards';

/** Ring arcs around the "?", one per plant (or part) the next arrival needs, with a small gap between them. */
function arcs(n: number): string[] {
  const gap = n > 6 ? 8 : 12;
  const at = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${(36 + 32 * Math.cos(a)).toFixed(2)} ${(36 + 32 * Math.sin(a)).toFixed(2)}`;
  };
  const step = 360 / n;
  return Array.from({ length: n }, (_, i) => `M ${at(i * step + gap / 2)} A 32 32 0 0 1 ${at((i + 1) * step - gap / 2)}`);
}

function SproutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21V11" stroke="#1e5520" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M12 12C12 7 8 5 4 5c0 5 3 7 8 7zM12 10c0-4 3-6 8-6 0 4-3 6-8 6z" fill="#2f7d32" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="5" fill="none" stroke="#0c5f5c" strokeWidth="2.6" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="#0c5f5c" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Who comes next, in the Kiskert's visitor row and the workshop's friend row: the "?" with a ring of one segment per
 * grown plant (or bought part) the next arrival needs, filled as they come, and "még 2" under it to count down.
 * Plants still growing show as dotted segments, on the way. A full ring flashes gold once as the arrival comes.
 */
export function ArrivalRing({ progress, unit }: { progress: ArrivalProgress; unit: 'plant' | 'part' }) {
  const { need, done, coming } = progress;
  const left = need - done;
  const seen = useRef(done);
  const [fresh, setFresh] = useState(-1);

  useEffect(() => {
    if (done > seen.current) setFresh(done - 1);
    seen.current = done;
  }, [done]);

  const full = left === 0;
  const what = unit === 'plant' ? 'kinőtt növény' : 'új alkatrész';
  const label = full ? 'Valaki most beköltözik!' : `Még ${left} ${what}, és valaki beköltözik.${coming > 0 ? ` ${coming} már nő.` : ''}`;
  return (
    <div className={`visitors__next${full ? ' is-full' : ''}`} role="img" aria-label={label}>
      <span className="visitors__badge">
        <svg className="visitors__ring" viewBox="0 0 72 72" aria-hidden="true">
          {arcs(need).map((d, i) => (
            <path
              key={`${need}-${i}`}
              d={d}
              className={`visitors__seg${i < done ? ' is-done' : i < done + coming ? ' is-coming' : ''}${i === fresh ? ' is-fresh' : ''}`}
            />
          ))}
        </svg>
        <span className="visitors__q" aria-hidden="true">
          {full ? '!' : '?'}
        </span>
      </span>
      <span className="visitors__when" aria-hidden="true">
        {full ? 'Megjött!' : `még ${left}`}
        {!full && (unit === 'plant' ? <SproutIcon /> : <GearIcon />)}
      </span>
    </div>
  );
}

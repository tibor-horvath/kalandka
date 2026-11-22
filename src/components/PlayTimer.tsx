import { useId, type ReactNode } from 'react';
import { HourglassGauge } from '../worlds/tower/art';
import { useProgress } from '../state/progress';
import { WARN_SECONDS, allowanceSeconds, remainingSeconds, today } from '../state/screenTime';
import type { WorldId } from '../state/worlds';

const DROP = 'M28 4 C22 14 6 30 6 42 a22 22 0 0 0 44 0 C50 30 34 14 28 4 Z';

/** Csepi's water drop, full in the morning; the water sinks as the garden is watered. */
function DropGauge({ left }: { left: number }) {
  const clip = useId();
  const y = Math.round(66 - left * 62);
  return (
    <svg className="play-timer__gauge" width="56" height="66" viewBox="0 0 56 66" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <path d={DROP} />
        </clipPath>
      </defs>
      <path d={DROP} className="play-timer__empty" />
      <g clipPath={`url(#${clip})`}>
        <rect x="0" y={y} width="56" height="66" className="play-timer__fill" />
        <path d={`M0 ${y} q7 -4 14 0 q7 4 14 0 q7 -4 14 0 q7 4 14 0 v4 h-56 z`} className="play-timer__fill" />
      </g>
      <path d={DROP} fill="none" className="play-timer__outline" strokeWidth="4" strokeLinejoin="round" />
      <ellipse cx="19" cy="40" rx="4" ry="7" fill="#FFFFFF" opacity="0.7" />
    </svg>
  );
}

/** Csavar's battery with its bolt; it runs down while the machines run. */
function BatteryGauge({ left }: { left: number }) {
  return (
    <svg className="play-timer__gauge" width="98" height="56" viewBox="0 0 98 56" aria-hidden="true">
      <rect x="3" y="5" width="82" height="46" rx="11" className="play-timer__empty play-timer__outline" strokeWidth="5" />
      <rect x="86" y="18" width="9" height="20" rx="3" className="play-timer__cap" />
      <rect x="11" y="13" width={Math.round(66 * left)} height="30" rx="6" className="play-timer__fill" />
      <path d="M46 14 L36 30 H44 L40 42 L52 25 H44 L48 14 Z" fill="#FFC93C" className="play-timer__outline" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Each world's gauge: one thing from its own story that empties as today's play time is used (`left` from 1 to 0).
 * A new world adds its gauge here and its two colours in the stylesheet; the sign around it stays the same.
 */
const GAUGES: Record<WorldId, (left: number) => ReactNode> = {
  garden: (left) => <DropGauge left={left} />,
  robot: (left) => <BatteryGauge left={left} />,
  tower: (left) => <HourglassGauge left={left} />
};

/** Today's play time when parents set a limit and some is left; null otherwise (no limit, or resting). */
export function useTimeLeft(): { remaining: number; allowance: number } | null {
  const { progress } = useProgress();
  const day = today();
  const remaining = remainingSeconds(progress, day);
  if (!Number.isFinite(remaining) || remaining <= 0) return null;
  return { remaining, allowance: allowanceSeconds(progress, day) };
}

/** How many of the sign's bars stand for today's time: five, the last one stays until the time is up. */
export const TIMER_BARS = 5;
export const barsLeft = (left: number) => (left <= 0 ? 0 : Math.max(1, Math.ceil(left * TIMER_BARS - 1e-9)));

/**
 * Today's play time left, on a sign in the world: the world's gauge empties and five bars beside it go out one by one,
 * so it reads without reading or knowing what a minute is (the minutes are in the label, for adults and screen readers).
 * `paused` adds the pause badge: the clock stands here (it runs only in games and reward places).
 * In the last two minutes it turns warm orange, like the spoken warning. Without a `label` it is hidden from screen readers.
 */
export function PlayTimer({ world, remaining, total, paused, label }: { world: WorldId; remaining: number; total: number; paused: boolean; label?: string }) {
  const left = Math.min(1, Math.max(0, remaining / Math.max(1, total)));
  const low = remaining <= WARN_SECONDS;
  const on = barsLeft(left);
  return (
    <div className={`play-timer play-timer--${world}${low ? ' is-low' : ''}`} {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}>
      <div className="play-timer__sign">
        {GAUGES[world](left)}
        <span className="play-timer__bars" aria-hidden="true">
          {Array.from({ length: TIMER_BARS }, (_, i) => (
            <i key={i} className={i < on ? 'is-on' : undefined} />
          ))}
        </span>
        {paused && (
          <span className="play-timer__pause">
            <i />
            <i />
          </span>
        )}
      </div>
    </div>
  );
}

/** What a screen reader hears for a paused sign. */
export const pausedLabel = (remaining: number) => `Ma még ${Math.ceil(remaining / 60)} perc játék. Most áll az óra.`;

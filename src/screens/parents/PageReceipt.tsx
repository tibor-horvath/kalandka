import { useEffect, useState } from 'react';
import { Seed } from '../../worlds/garden/art';
import { POD_QUARTERS } from '../../components/LevelMeter';
import { Bolt } from '../../worlds/robot/art';
import { TASKS_PER_REWARD } from '../../state/pod';
import { gameOf, type Sticker } from '../../state/rewards';
import type { WorldId } from '../../state/worlds';

/** What marking a page done did, kept from the moment it was marked. */
export interface PageWin {
  tasks: number;
  /** The child's pod and total to spend before the page counted. */
  fill: number;
  total: number;
  pay: number;
  stickers: Sticker[];
}

interface Frame {
  /** Tasks of the page already poured into the pod. */
  used: number;
  fill: number;
  total: number;
  gold: boolean;
  /** Rewards on their way into the total, one per full pod so far. */
  flying: number[];
  bump: number;
  finished: boolean;
}

const prefersLess = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * The timeline of a marked page: its tasks drop into the child's pod one by one, as in the games, and every
 * full pod turns gold and sends a seed (or bolt) into the total. A long page goes faster, so it stays a few seconds.
 */
function timeline(win: PageWin): { at: number; frame: Partial<Frame> }[] {
  const taskMs = Math.max(60, Math.min(140, 1600 / Math.max(1, win.tasks)));
  const payMs = win.pay > 3 ? 450 : 700;
  const steps: { at: number; frame: Partial<Frame> }[] = [];
  let fill = win.fill;
  let paid = 0;
  let t = 450;
  for (let used = 1; used <= win.tasks; used++) {
    fill += 1;
    if (fill < TASKS_PER_REWARD) {
      steps.push({ at: t, frame: { used, fill } });
      t += taskMs;
      continue;
    }
    paid += 1;
    const n = paid;
    steps.push({ at: t, frame: { used, fill: TASKS_PER_REWARD, gold: true } });
    steps.push({ at: t + payMs * 0.37, frame: { flying: Array.from({ length: n }, (_, k) => k + 1) } });
    steps.push({ at: t + payMs * 0.9, frame: { total: win.total + n, fill: 0, gold: false, bump: n } });
    fill = 0;
    t += payMs;
  }
  steps.push({ at: t + 200, frame: { finished: true } });
  return steps;
}

function endFrame(win: PageWin): Frame {
  return { used: win.tasks, fill: (win.fill + win.tasks) % TASKS_PER_REWARD, total: win.total + win.pay, gold: false, flying: [], bump: 0, finished: true };
}

/**
 * Below "Kész lap": the page's tasks, the child's reward pod and their total, played once (about 3–4 s), then a
 * plain summary and any new sticker. With reduced motion it shows the end straight away.
 */
export function PageReceipt({ win, world, worldName, name }: { win: PageWin; world: WorldId; worldName: string; name: string }) {
  const [frame, setFrame] = useState<Frame>(() =>
    prefersLess() ? endFrame(win) : { used: 0, fill: win.fill, total: win.total, gold: false, flying: [], bump: 0, finished: false }
  );

  useEffect(() => {
    if (prefersLess()) return;
    const timers = timeline(win).map(({ at, frame: next }) => window.setTimeout(() => setFrame((f) => ({ ...f, ...next })), at));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [win]);

  const icon = world === 'robot' ? <Bolt size={24} /> : <Seed size={24} />;
  const unit = world === 'robot' ? 'csavar' : 'mag';
  const left = TASKS_PER_REWARD - endFrame(win).fill;

  return (
    <>
      <div className="ps-receipt" aria-hidden="true">
        <div className="ps-receipt__part">
          <span className="ps-receipt__label">A lap feladatai</span>
          <span className="ps-receipt__chips">
            {Array.from({ length: win.tasks }, (_, i) => (
              <span key={i} className={`ps-chip${i < frame.used ? ' is-used' : ''}`} />
            ))}
          </span>
        </div>
        <svg className="ps-receipt__arrow" width="28" height="16" viewBox="0 0 28 16">
          <path d="M2 8h22M18 2l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="ps-receipt__part ps-receipt__part--center">
          <span className={`ps-pod${frame.gold ? ' is-gold' : ''}`}>
            <svg className="ps-pod__ring" viewBox="0 0 44 44">
              {POD_QUARTERS.map((d, i) => (
                <path key={i} d={d} className={`ps-pod__quarter${i < frame.fill ? ' is-full' : ''}`} />
              ))}
            </svg>
            <span className="ps-pod__reward">
              {icon}
            </span>
          </span>
          <span className="ps-receipt__label">Jutalomtartó</span>
        </div>
        <div className="ps-receipt__part ps-receipt__part--center">
          <span className="ps-total-box">
            {frame.flying.map((n) => (
              <span key={n} className="ps-total__fly">
                {icon}
              </span>
            ))}
            {/* Keyed by the payouts so far, so each one bumps it once. */}
            <span key={frame.bump} className={`ps-total${frame.bump ? ' is-bump' : ''}`}>
              {icon}
              {frame.total}
            </span>
          </span>
          <span className="ps-receipt__label">
            {name} {unit === 'mag' ? 'magjai' : 'csavarjai'}
          </span>
        </div>
      </div>
      {frame.finished && (
        <div className="ps-result" role="status">
          <p className="pa-muted">
            <b>{win.pay > 0 ? `${name} ${win.pay} ${unit === 'mag' ? 'magot' : 'csavart'} kapott` : `${name} jutalomtartója telt`}</b>
            {' · '}még {left} feladat a következő {unit === 'mag' ? 'magig' : 'csavarig'}.
          </p>
          {win.stickers.map((s) => {
            const game = gameOf(s);
            return (
              <span key={s.id} className="ps-sticker">
                <span className="ps-sticker__mark" style={{ background: game.color, color: game.ink }}>
                  {s.mark}
                </span>
                <span>
                  <b>Új matrica: {s.label}</b>
                  <span className="ps-sticker__where">A {worldName} kezdőképernyőjén kapja meg.</span>
                </span>
              </span>
            );
          })}
        </div>
      )}
    </>
  );
}

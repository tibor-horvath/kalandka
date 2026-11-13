import { useRef, useState, type PointerEvent } from 'react';
import { GameShell } from '../../../components/GameShell';
import { useLadderRound } from '../../../components/ladderRound';
import { dialHour, timeWords } from '../../../lib/time';
import { popBubble } from '../../../lib/sound';
import { useProgress } from '../../../state/progress';
import { ClockFace } from '../art';
import { buildSetRound, setRight, setSolved, setStart, setWrong } from '../games/clock';
import { say } from '../games/common';
import { KakukSays, NextButton, useQuestion } from './kit';

/** Where the dial's centre sits in the cuckoo-clock drawing, as a share of its width and height (see ClockFace's house viewBox). */
const CENTRE = { x: 130 / 260, y: 178 / 330 };

/** "Kakukk, kakukk, kakukk!": the cuckoo calls the hour, once per hour up to twelve. */
function calls(h: number): string {
  const n = dialHour(h);
  return `${Array.from({ length: n }, () => 'kakukk').join(', ').replace(/^k/, 'K')}!`;
}

/** Óraállító: drag the hands of the cuckoo clock to the time Kakuk asks for, then press Kész. */
export function SetClock({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  const { level, step, win, meter, goNext } = useLadderRound('set');
  const [round] = useState(() => buildSetRound(level, progress.setRound));
  const hourOnly = round.level.step === 'hourOnly';
  /** The minutes a drag of the long hand snaps to: quarters until the five-minute level. */
  const snap = round.level.step === 'five' ? 5 : 15;
  const q = useQuestion(setStart(round));
  /** The hour the short hand points at (1 … 12); it leans on towards the next one with the minutes. */
  const [hour, setHour] = useState(round.start.h);
  const [minute, setMinute] = useState(hourOnly ? 0 : (round.target.m + 20) % 60);
  const [held, setHeld] = useState<'hour' | 'minute' | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const solved = q.solved !== null;

  const angleAt = (e: PointerEvent<SVGSVGElement>) => {
    const r = svg.current!.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width * CENTRE.x);
    const dy = e.clientY - (r.top + r.height * CENTRE.y);
    return { deg: ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360, far: Math.hypot(dx, dy) / (r.width * (94 / 260)) };
  };

  const moveTo = (hand: 'hour' | 'minute', deg: number) => {
    if (hand === 'minute') {
      const m = (Math.round(deg / 6 / snap) * snap) % 60;
      if (m !== minute) popBubble(1);
      setMinute(m);
      return;
    }
    const h = dialHour(Math.round((deg - minute / 2) / 30));
    if (h !== hour) popBubble(1);
    setHour(h);
  };

  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (solved) return;
    const { deg, far } = angleAt(e);
    // Without a minute hand everything turns the short one; otherwise the hand nearer the touch.
    const hourDeg = (hour % 12) * 30 + minute / 2;
    const diff = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
    const hand = hourOnly ? 'hour' : far > 0.62 ? 'minute' : diff(deg, hourDeg) <= diff(deg, minute * 6) ? 'hour' : 'minute';
    setHeld(hand);
    svg.current?.setPointerCapture(e.pointerId);
    moveTo(hand, deg);
  };
  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (held) moveTo(held, angleAt(e).deg);
  };
  const up = () => setHeld(null);

  const check = () => {
    if (solved) return;
    if (setRight(round, hour, minute)) {
      const line = setSolved(round);
      q.hit(0, round.target.m === 0 ? say(`${calls(round.target.h)} ${line.text.replace(/^Kakukk! /, '')}`, 'cheer', 'good') : line);
      win(q.helped());
    } else q.miss(0, (m) => setWrong(round, hour, minute, m));
  };

  // After two misses the number the short hand belongs at lights up (on the half hours the one it left).
  const glow = q.glow && !solved ? dialHour(round.target.h) : null;
  const nudge = (hand: 'hour' | 'minute', by: number) => {
    if (solved) return;
    popBubble(1);
    if (hand === 'hour') setHour((h) => dialHour(h + by));
    else setMinute((m) => (m + by * snap + 60) % 60);
  };

  return (
    <GameShell game="set" className="screen--tower screen--set" title="Óraállító" meter={meter} justSolved={solved && !step?.helped} onBack={onBack} onReplay={() => q.tell(q.line)}>
      <KakukSays line={q.line} />
      <div className="set-play">
        <ClockFace
          ref={svg}
          house
          size={300}
          hour={(hour % 12) * 30 + (hourOnly ? 0 : minute / 2)}
          minute={hourOnly ? null : minute * 6}
          glow={glow}
          grab={solved ? null : held ?? (hourOnly ? 'hour' : null)}
          label={`Kakukkos óra. A mutatók most ennyit mutatnak: ${hourOnly ? `${dialHour(hour)} óra` : timeWords({ h: hour, m: minute })}.`}
          className={`set-clock${held ? ' is-held' : ''}${solved ? ' is-done' : ''}`}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        />
        <div className="set-side">
          <div className="set-target" aria-hidden="true">
            <span className="set-target__kicker">Ennyi az idő:</span>
            <span className="set-target__time">{hourOnly ? dialHour(round.target.h) : timeWords(round.target)}</span>
          </div>
          <div className="set-nudge" role="group" aria-label="Kis mutató">
            <button type="button" className="round-btn round-btn--white" onClick={() => nudge('hour', -1)} aria-label="Kis mutató vissza egy számmal" disabled={solved}>
              ◀
            </button>
            <span>kis mutató</span>
            <button type="button" className="round-btn round-btn--white" onClick={() => nudge('hour', 1)} aria-label="Kis mutató előre egy számmal" disabled={solved}>
              ▶
            </button>
          </div>
          {!hourOnly && (
            <div className="set-nudge set-nudge--minute" role="group" aria-label="Nagy mutató">
              <button type="button" className="round-btn round-btn--white" onClick={() => nudge('minute', -1)} aria-label="Nagy mutató vissza" disabled={solved}>
                ◀
              </button>
              <span>nagy mutató</span>
              <button type="button" className="round-btn round-btn--white" onClick={() => nudge('minute', 1)} aria-label="Nagy mutató előre" disabled={solved}>
                ▶
              </button>
            </div>
          )}
          {!solved && (
            <button type="button" className="big-btn big-btn--tower" onClick={check}>
              Kész
            </button>
          )}
        </div>
      </div>
      <NextButton show={solved} onNext={goNext} />
    </GameShell>
  );
}

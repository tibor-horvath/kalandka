import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Bee } from '../components/art';
import { FitBox } from '../components/FitBox';
import { useLadderRound } from '../components/ladderRound';
import { GameShell } from '../components/GameShell';
import { DotFace } from '../components/seeds';
import { GuideBubble, NextIcon } from '../components/ui';
import {
  BOX_H,
  BOX_W,
  GRAB_THE_BEE,
  NEXT_STROKE,
  STEP,
  STRAYED,
  TOLERANCE,
  arrowPoints,
  buildTraceRound,
  canGrab,
  checkpoints,
  digitWord,
  doneFeedback,
  follow,
  heading,
  pathData,
  startFeedback,
  type Pt,
  type TraceFeedback
} from '../games/trace/logic';
import { speak } from '../lib/speech';
import { buzz, chime, fanfare, popBubble } from '../lib/sound';

const PAD_X = 30;
const PAD_Y = 22;
const VIEW = `${-PAD_X} ${-PAD_Y} ${BOX_W + 2 * PAD_X} ${BOX_H + 2 * PAD_Y}`;
const BOARD_H = 628;
const BOARD_W = Math.round((BOARD_H * (BOX_W + 2 * PAD_X)) / (BOX_H + 2 * PAD_Y));
/** The white board around the trail, with its padding and shadow: what FitBox scales on phones. */
const CARD_W = BOARD_W + 44;
const CARD_H = BOARD_H + 32 + 10;
/** Bee size in trail units, and the offset that puts its body on the trail point. */
const BEE_W = 54;
const BEE_C = { x: (42 * BEE_W) / 80, y: (36 * BEE_W) / 80 };
/** Demo bee speed in trail units per second. */
const DEMO_SPEED = 150;
/** Untouched this long, Csepi shows the way again. */
const IDLE_MS = 9000;
/** Csepi says "come back" at most this often. */
const STRAY_TALK_MS = 5000;
/** Samples ahead of the bee highlighted as the way back. */
const GUIDE_AHEAD = 22;

interface Burst {
  id: number;
  x: number;
  y: number;
}

const SPARKS = [0, 60, 120, 180, 240, 300].map((deg) => {
  const a = (deg * Math.PI) / 180;
  return { dx: Math.cos(a) * 22, dy: Math.sin(a) * 22 };
});

/** The bee drawn on the trail, turned towards where it is going and always the right way up. */
function TrailBee({ at, angle, className }: { at: Pt; angle: number; className?: string }) {
  const right = Math.cos((angle * Math.PI) / 180) >= 0;
  // The art faces left: mirror it for rightward travel, and tilt by the rest of the angle.
  const rot = right ? angle : angle - 180;
  const style: CSSProperties = {
    transform: `translate(${at.x}px, ${at.y}px) rotate(${rot}deg) scale(${right ? -1 : 1}, 1) translate(${-BEE_C.x}px, ${-BEE_C.y}px)`
  };
  return (
    <g className={`trail-bee ${className ?? ''}`} style={style}>
      <Bee width={BEE_W} />
    </g>
  );
}

/** A faint arrow on a faded trail, pointing the way the stroke goes. */
function TrailArrow({ at, angle }: { at: Pt; angle: number }) {
  return (
    <g className="trail__arrow" transform={`translate(${at.x} ${at.y}) rotate(${angle})`}>
      <path d="M-7 -10 L5 0 L-7 10" />
    </g>
  );
}

/**
 * Mézút: lead the bee along the dotted honey trail to write a digit. No failure: off the trail the bee waits.
 * On the upper levels the trail is faded (Halvány út) and the see-through bee only comes when asked or after a quiet spell.
 */
export function Trace({ onBack }: { onBack: () => void }) {
  const { start, step, win, meter, goNext } = useLadderRound('trace');
  const shape = useMemo(() => buildTraceRound(start.level, start.sinceChange), [start]);
  const drops = useMemo(() => shape.strokes.map(checkpoints), [shape]);
  const multi = shape.strokes.length > 1;

  const [strokeNo, setStrokeNo] = useState(0);
  const [idx, setIdx] = useState(0);
  const [strayed, setStrayed] = useState(false);
  const [finger, setFinger] = useState<Pt | null>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  /** Sample index of the see-through demo bee, while it shows the way. */
  const [demo, setDemo] = useState<number | null>(null);
  const [flying, setFlying] = useState(false);
  const [fb, setFb] = useState<TraceFeedback>(() => startFeedback(shape));
  const done = strokeNo >= shape.strokes.length;

  const svg = useRef<SVGSVGElement>(null);
  const live = useRef({ strokeNo: 0, idx: 0, dragging: false });
  const burstId = useRef(0);
  const demoFrame = useRef<number | null>(null);
  const idleTimer = useRef<number | null>(null);
  const lastStrayTalk = useRef(0);
  /** For the parents' notes: times Csepi called the bee back, and whether the child asked for the way. */
  const strayTalks = useRef(0);
  const askedWay = useRef(false);

  const pts = shape.strokes[Math.min(strokeNo, shape.strokes.length - 1)];
  const beeAt = done ? shape.strokes[shape.strokes.length - 1].at(-1)! : pts[idx];
  const beeAngle = heading(pts, done ? pts.length - 1 : idx);

  const stopDemo = () => {
    if (demoFrame.current !== null) cancelAnimationFrame(demoFrame.current);
    demoFrame.current = null;
    setDemo(null);
  };

  /** A see-through bee flies the rest of the current stroke once, to show the way. */
  const runDemo = () => {
    stopDemo();
    const { strokeNo: s, idx: from, dragging } = live.current;
    const trail = shape.strokes[s];
    // Not over a child already leading the bee: the demo could outlive the stroke it shows.
    if (!trail || dragging) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      const i = from + Math.floor(((now - t0) / 1000) * (DEMO_SPEED / STEP));
      // Rest a moment at the end before vanishing.
      if (i > trail.length + 10) {
        demoFrame.current = null;
        setDemo(null);
        return;
      }
      setDemo(Math.min(i, trail.length - 1));
      demoFrame.current = requestAnimationFrame(tick);
    };
    demoFrame.current = requestAnimationFrame(tick);
  };

  const armIdle = () => {
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      if (live.current.strokeNo >= shape.strokes.length || live.current.dragging) return;
      setFb(GRAB_THE_BEE);
      speak(GRAB_THE_BEE.speech);
      runDemo();
      armIdle();
    }, IDLE_MS);
  };

  useEffect(() => {
    speak(startFeedback(shape).speech);
    const t = shape.faded ? undefined : window.setTimeout(runDemo, 900);
    armIdle();
    return () => {
      window.clearTimeout(t);
      if (demoFrame.current !== null) cancelAnimationFrame(demoFrame.current);
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    };
    // One round per mount: App keys this screen by round.
  }, []);

  const toTrail = (e: PointerEvent): Pt | null => {
    const m = svg.current?.getScreenCTM();
    if (!m) return null;
    const q = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: q.x, y: q.y };
  };

  const burst = (at: Pt) => {
    const id = ++burstId.current;
    setBursts((b) => [...b, { id, x: at.x, y: at.y }]);
    window.setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 650);
  };

  const finishStroke = () => {
    // The demo's sample index belongs to the stroke just finished; on a shorter next stroke it would point past its end.
    stopDemo();
    const next = live.current.strokeNo + 1;
    live.current = { strokeNo: next, idx: 0, dragging: false };
    setStrokeNo(next);
    setIdx(0);
    setStrayed(false);
    setFinger(null);
    if (next < shape.strokes.length) {
      chime();
      setFlying(true);
      window.setTimeout(() => setFlying(false), 600);
      setFb(NEXT_STROKE);
      speak(NEXT_STROKE.speech);
      armIdle();
      return;
    }
    fanfare();
    buzz(40);
    const f = doneFeedback(shape.digit, shape.faded);
    setFb(f);
    speak(f.speech);
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    win(askedWay.current || strayTalks.current >= 2, { extra: (p) => ({ ...p, traceFadedSolved: p.traceFadedSolved + (shape.faded ? 1 : 0) }) });
  };

  const move = (at: Pt) => {
    const { strokeNo: s, idx: from } = live.current;
    const trail = shape.strokes[s];
    const r = follow(trail, from, at);
    setFinger(at);

    if (r.strayed !== strayed) setStrayed(r.strayed);
    if (r.strayed) {
      const now = Date.now();
      if (now - lastStrayTalk.current > STRAY_TALK_MS) {
        lastStrayTalk.current = now;
        strayTalks.current += 1;
        setFb(STRAYED);
        speak(STRAYED.speech);
      }
      return;
    }
    if (fb === STRAYED || fb === GRAB_THE_BEE) setFb(s === 0 ? startFeedback(shape) : NEXT_STROKE);
    if (r.idx === from) return;

    // Pop every honey drop the bee passed on this move.
    drops[s].forEach((cp, k) => {
      if (cp > from && cp <= r.idx) {
        popBubble(k);
        buzz();
        burst(trail[cp]);
      }
    });
    live.current.idx = r.idx;
    setIdx(r.idx);
    if (r.done) finishStroke();
  };

  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    // The ref, not just the render: a second finger can land before the last stroke's render.
    if (done || live.current.strokeNo >= shape.strokes.length) return;
    const at = toTrail(e);
    if (!at) return;
    stopDemo();
    armIdle();
    const { strokeNo: s, idx: from } = live.current;
    if (!canGrab(shape.strokes[s], from, at)) {
      setFb(GRAB_THE_BEE);
      speak(GRAB_THE_BEE.speech);
      setStrayed(true);
      setFinger(at);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    live.current.dragging = true;
    move(at);
  };

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!live.current.dragging) return;
    const at = toTrail(e);
    if (at) move(at);
  };

  const onUp = () => {
    live.current.dragging = false;
    setFinger(null);
    setStrayed(false);
    armIdle();
  };

  // App keys this screen by round, so the next digit remounts with fresh state.

  const guide = strayed && !done ? pts.slice(idx, idx + GUIDE_AHEAD) : null;

  return (
    <GameShell
      game="trace"
      className="screen--trace"
      title="Mézút"
      meter={meter}
      justSolved={done && !step?.helped}
      onBack={onBack}
      onReplay={() => speak(fb.speech)}
    >

      <div className="trace-body">
        <FitBox className="trace-fit" width={CARD_W} height={CARD_H}>
          <div className={`trace-board${done ? ' is-done' : ''}${shape.faded ? ' is-faded' : ''}`}>
            <svg
              ref={svg}
              className="trace-svg"
              width={BOARD_W}
              height={BOARD_H}
              viewBox={VIEW}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              role="img"
              aria-label={`Írd le: ${shape.digit}`}
            >
              {shape.strokes.map((trail, s) => {
                const d = pathData(trail);
                const isDone = s < strokeNo;
                const isNow = s === strokeNo;
                const filled = isDone ? trail : isNow ? trail.slice(0, idx + 1) : [];
                return (
                  <g key={s}>
                    {!isDone && !shape.faded && <path d={d} className="trail__lane" strokeWidth={TOLERANCE * 1.3} />}
                    <path d={d} className={`trail__dots${isNow ? ' is-now' : ''}${shape.faded && !isDone ? ' is-faint' : ''}`} />
                    {shape.faded &&
                      !isDone &&
                      arrowPoints(trail)
                        .filter((k) => !isNow || k > idx)
                        .map((k) => <TrailArrow key={k} at={trail[k]} angle={heading(trail, k)} />)}
                    {filled.length > 1 && (
                      <>
                        <path d={pathData(filled)} className="trail__honey" />
                        <path d={pathData(filled)} className="trail__shine" />
                      </>
                    )}
                    {!isDone &&
                      !shape.faded &&
                      drops[s]
                        .filter((cp) => !isNow || cp > idx)
                        .map((cp) => (
                          <g key={cp} className="honey-drop" transform={`translate(${trail[cp].x} ${trail[cp].y})`}>
                            <circle r="8" />
                            <circle r="2.6" cx="-2.6" cy="-2.6" className="honey-drop__shine" />
                          </g>
                        ))}
                    {multi && (isNow || s > strokeNo) && (
                      <g className={`trail__start${isNow ? ' is-now' : ''}`} transform={`translate(${trail[0].x} ${trail[0].y})`}>
                        <circle r="17" />
                        <text y="6">{s + 1}</text>
                      </g>
                    )}
                  </g>
                );
              })}
  
              {!done && idx === 0 && <circle cx={pts[0].x} cy={pts[0].y} r="26" className="trail__ring" />}
  
              {guide && guide.length > 1 && <path d={pathData(guide)} className="trail__guide" />}
              {strayed && finger && !done && <line x1={finger.x} y1={finger.y} x2={beeAt.x} y2={beeAt.y} className="trail__tether" />}
  
              {bursts.map((b) => (
                <g key={b.id} transform={`translate(${b.x} ${b.y})`}>
                  <circle r="12" className="burst__ring" />
                  {SPARKS.map((s, i) => (
                    <circle key={i} r="3.5" className="burst__spark" style={{ '--dx': `${s.dx}px`, '--dy': `${s.dy}px` } as CSSProperties} />
                  ))}
                </g>
              ))}
  
              {demo !== null && !done && <TrailBee at={pts[demo]} angle={heading(pts, demo)} className="is-ghost" />}
              <TrailBee at={beeAt} angle={beeAngle} className={`${flying ? 'is-flying' : ''}${strayed ? ' is-waiting' : ''}${done ? ' is-happy' : ''}`} />
            </svg>
          </div>
        </FitBox>

        <div className="trace-side">
          <GuideBubble mood={fb.mood} tone={fb.tone}>
            {fb.text}
          </GuideBubble>

          <div className={`number-card trace-card${done ? ' is-shown' : ''}`}>
            {done ? (
              <>
                <span className="choice__numeral">{shape.digit}</span>
                {shape.digit > 0 && <DotFace n={shape.digit} size={shape.digit > 5 ? 52 : 70} />}
                <span className="number-card__word">{digitWord(shape.digit)}</span>
              </>
            ) : (
              <span className="trace-card__steps" aria-label={`${Math.min(strokeNo, shape.strokes.length)} / ${shape.strokes.length} vonal kész`}>
                {shape.strokes.map((_, s) => (
                  <span key={s} className={`trace-step${s < strokeNo ? ' is-on' : s === strokeNo ? ' is-now' : ''}`}>
                    {s + 1}. vonal
                  </span>
                ))}
              </span>
            )}
          </div>

          <div className="trace-actions">
            {!done && (
              <button
                type="button"
                className="peek-btn peek-btn--light"
                onClick={() => {
                  askedWay.current = true;
                  runDemo();
                }}
              >
                Mutasd az utat!
              </button>
            )}
            {done && (
              <button type="button" className="big-btn" onClick={goNext}>
                Következő szám <NextIcon />
              </button>
            )}
          </div>
        </div>
      </div>

    </GameShell>
  );
}

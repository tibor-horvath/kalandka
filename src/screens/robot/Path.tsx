import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { LevelMeter, LevelUpCard, useLevelUp } from '../../components/LevelMeter';
import { FitBox } from '../../components/FitBox';
import { Battery, Bolt, CmdIcon, Crate, Rover } from '../../components/robot';
import { BackIcon, GuideBubble, NextIcon, PlayIcon, RoundButton, SpeakerIcon } from '../../components/ui';
import {
  ARROWS,
  CMD_LABELS,
  EMPTY_FEEDBACK,
  FULL_FEEDBACK,
  MAX_TIMES,
  OFFER_FEEDBACK,
  ONE_MORE_FEEDBACK,
  ROUTE_FEEDBACK,
  SHORT_FEEDBACK,
  TOO_LONG_FEEDBACK,
  TURNS,
  buildPuzzle,
  bumpFeedback,
  collect,
  emptyChargeFeedback,
  routeCells,
  run,
  shortest,
  solvedFeedback,
  startFeedback,
  step,
  stepCount,
  type Block,
  type Card,
  type Cell,
  type Cmd,
  type Dir,
  type PathFeedback,
  type Pose,
} from '../../games/robot/path';
import { speak } from '../../lib/speech';
import { buzz, chime, fanfare, popBubble, powerDown, thud } from '../../lib/sound';
import { EASIER_SPEECH, LADDER_RULES, afterSolve, ladderMeter, ladderOf, withLadder, type LadderStep } from '../../state/ladder';
import { useProgress } from '../../state/progress';
import { logTask, ROUND_HELP_AFTER } from '../../state/taskLog';

/** One floor tile, in board units. */
const CELL = 100;
/** The board's frame on the tablet: the largest course (6 × 5) fits it. */
const FRAME_W = 6 * CELL + 40;
const FRAME_H = 5 * CELL + 40;
/** Time per robot step while a program runs: room to turn first, then drive. */
const STEP_MS = 600;
/** When a step turns the robot and moves it, it turns on the spot for this long before driving. */
const TURN_MS = 260;
/** After a bump or a short program, the robot rests a moment, then rolls back to the start. */
const BACK_MS = 1300;
/** How long the dotted way stays on the floor. */
const ROUTE_MS = 3600;
/** Out of charge, in ms from the moment it runs out: the robot sputters and dims, then the missing steps show, then back to the start. */
const EMPTY_DOTS_MS = 1400;
const EMPTY_BACK_MS = 3800;
/** How long a bump plays: drive in, squash, bounce back. */
const HIT_MS = 700;
/** Impact sparks: angles fanned round the way back from the point of contact (0 = up). */
const SPARKS = [-70, -35, 0, 35, 70];

/** Ghost cells drawn past the battery for a plan that is too long (the chip says the rest). */
const MAX_GHOSTS = 4;
const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

/** Tries before Csavar offers to show the way (once per course): programs that did not get there, or bumps while stepping. */
const OFFER_AFTER_RUNS = 2;
const OFFER_AFTER_BUMPS = 3;

const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;

/** The lightning on the energy bar. */
function Charge() {
  return (
    <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24">
      <path d="M13.5 2 L5 13.5 H11 L9.5 22 L19 9.5 H12.5 Z" fill="#F2B33D" stroke="#7A5300" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/** The strip of floor edge between the robot's cell and the wall it drove into (the cell outside the floor). */
function edgeRect(outside: Cell, dir: Dir): { x: number; y: number; width: number; height: number } {
  const x = (outside.x - DX[dir]) * CELL;
  const y = (outside.y - DY[dir]) * CELL;
  if (dir === 0) return { x: x + 12, y: y - 3, width: CELL - 24, height: 8 };
  if (dir === 2) return { x: x + 12, y: y + CELL - 5, width: CELL - 24, height: 8 };
  if (dir === 3) return { x: x - 3, y: y + 12, width: 8, height: CELL - 24 };
  return { x: x + CELL - 5, y: y + 12, width: 8, height: CELL - 24 };
}

/** Turning the shortest way round, so the robot never spins a full circle between 270° and 0°. */
function turnBy(from: Dir, to: Dir): number {
  return ((((to - from + 4) % 4) + 1) % 4) - 1;
}

/** Robotút: lead the robot to its battery, first one arrow at a time, then with a whole program. */
export function Path({ onBack }: { onBack: () => void }) {
  const { progress, update } = useProgress();
  // The ladder when this round started: the round keeps its level even after its win steps up or down.
  const [startLadder] = useState(() => ladderOf(progress, 'path'));
  const levelIndex = startLadder.level;
  /** This round's win on the ladder: the meter shows it, and it may step up or down. */
  const [ladderStep, setLadderStep] = useState<LadderStep | null>(null);
  const puzzle = useMemo(() => buildPuzzle(levelIndex, progress.pathRound), [levelIndex, progress.pathRound]);
  const { level } = puzzle;
  const plan = level.mode === 'plan';

  const [pose, setPose] = useState<Pose>(puzzle.start);
  const [angle, setAngle] = useState(puzzle.start.dir * 90);
  /** The bump playing now, if any; its id restarts the animation on every new bump. */
  const [hit, setHit] = useState<{ id: number; dir: Dir; block: Block; at: Cell } | null>(null);
  const hitId = useRef(0);
  /** Delay before the robot drives, so a turn is seen before the move. */
  const [driveDelay, setDriveDelay] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [running, setRunning] = useState(false);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [wrongCard, setWrongCard] = useState<number | null>(null);
  const [route, setRoute] = useState<Cell[] | null>(null);
  const [solved, setSolved] = useState(false);
  /** Single steps used on the current run, for the energy bar. */
  const [used, setUsed] = useState(0);
  /** The charge ran out: the robot sputters, dims and shows the steps it was short of. */
  const [empty, setEmpty] = useState(false);
  const [missingCells, setMissingCells] = useState<Cell[] | null>(null);
  /** Batteries the robot has reached so far (indices into puzzle.goals). */
  const [collected, setCollected] = useState<number[]>([]);
  const [fb, setFb] = useState<PathFeedback>(() => startFeedback(level));

  const live = useRef({ pose: puzzle.start, tries: 0, collected: [] as number[] });
  const timers = useRef<number[]>([]);
  const rewarded = useRef(false);
  /** The child asked for the way (parents' notes). */
  const askedWay = useRef(false);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const say = (f: PathFeedback) => {
    setFb(f);
    speak(f.speech);
  };

  useEffect(() => {
    speak(startFeedback(level).speech);
    return () => timers.current.forEach((t) => window.clearTimeout(t));
    // One course per mount: App keys this screen by round.
  }, []);

  const moveTo = (next: Pose) => {
    const from = live.current.pose;
    const turns = turnBy(from.dir, next.dir);
    setDriveDelay(turns !== 0 && !sameCell(from, next) ? TURN_MS : 0);
    setAngle((a) => a + turns * 90);
    live.current.pose = next;
    setPose(next);
  };

  /** A bump: the robot drives into what is in the way, squashes, bounces back and blinks; a crate wobbles, a wall edge flashes. */
  const bump = (dir: Dir, block: Block) => {
    const at = live.current.pose;
    const id = ++hitId.current;
    setHit({ id, dir, block, at: { x: at.x + DX[dir], y: at.y + DY[dir] } });
    thud();
    buzz(30);
    later(() => setHit((h) => (h && h.id === id ? null : h)), HIT_MS);
  };

  const win = () => {
    setSolved(true);
    setRoute(null);
    fanfare();
    buzz(40);
    say(solvedFeedback(level));
    if (!rewarded.current) {
      rewarded.current = true;
      const helped = askedWay.current || live.current.tries >= ROUND_HELP_AFTER;
      const s = afterSolve(startLadder, LADDER_RULES.path, helped);
      setLadderStep(s);
      if (s.change === 'down') speak(EASIER_SPEECH, { queue: true });
      update((p) => withLadder(logTask({ ...p, bolts: p.bolts + 1, pathSolved: p.pathSolved + 1 }, 'path', helped), 'path', s.ladder));
    }
  };

  /** Counts a try that did not reach the battery; true exactly once, when it is time to offer help. */
  const missed = (after: number) => {
    live.current.tries += 1;
    return live.current.tries === after;
  };

  // ---------- step mode: each arrow moves at once ----------

  const tapArrow = (cmd: Cmd) => {
    if (solved) return;
    setRoute(null);
    const r = step(puzzle, live.current.pose, cmd);
    moveTo(r.pose);
    if (r.bumped) {
      bump(r.pose.dir, r.bumped);
      say(missed(OFFER_AFTER_BUMPS) ? OFFER_FEEDBACK : bumpFeedback(r.bumped, null));
      return;
    }
    popBubble(Math.abs(r.pose.x - puzzle.start.x) + Math.abs(r.pose.y - puzzle.start.y));
    const got = collect(puzzle.goals, r.pose, live.current.collected);
    if (got !== live.current.collected) {
      chime();
      live.current.collected = got;
      setCollected(got);
    }
    if (got.length === puzzle.goals.length) win();
    else if (fb.tone === 'oops') setFb(startFeedback(level));
  };

  // ---------- plan mode: lay out the cards, then play ----------

  const addCard = (cmd: Cmd) => {
    if (running || solved) return;
    if (cards.length >= level.slots) {
      say(FULL_FEEDBACK);
      return;
    }
    popBubble(cards.length);
    const nextCards = [...cards, { cmd, times: 1 }];
    setCards(nextCards);
    setWrongCard(null);
    warnIfTooLong(nextCards);
  };

  /** Csavar says so the moment a plan grows longer than the charge (once per crossing). */
  const warnIfTooLong = (next: Card[]) => {
    if (puzzle.energy === null) return setFb(startFeedback(level));
    const before = stepCount(cards) > puzzle.energy;
    const after = stepCount(next) > puzzle.energy;
    if (after && !before) say(TOO_LONG_FEEDBACK);
    else if (!after) setFb(startFeedback(level));
  };

  const removeCard = (i: number) => {
    if (running || solved) return;
    popBubble(1);
    const nextCards = cards.filter((_, k) => k !== i);
    setCards(nextCards);
    setWrongCard(null);
    warnIfTooLong(nextCards);
  };

  const repeatLast = (n: number) => {
    if (running || solved) return;
    if (cards.length === 0) {
      say(EMPTY_FEEDBACK);
      return;
    }
    chime();
    const nextCards = cards.map((card, k) => (k === cards.length - 1 ? { ...card, times: card.times === n ? 1 : n } : card));
    setCards(nextCards);
    warnIfTooLong(nextCards);
  };

  const backToStart = () => {
    setActiveCard(null);
    setCollected([]);
    setUsed(0);
    setEmpty(false);
    setMissingCells(null);
    moveTo(puzzle.start);
    setRunning(false);
  };

  /** The charge is gone: power down where the robot stands, then dot the steps it still needed. */
  const runOutOfCharge = (got: number[], offer: boolean) => {
    const at = live.current.pose;
    const goals = puzzle.goals.filter((_, i) => !got.includes(i));
    const course = { ...puzzle, start: at, goals };
    const cmds = shortest(course, level.moves) ?? [];
    setEmpty(true);
    powerDown();
    buzz(30);
    later(() => {
      setMissingCells(routeCells(course, cmds.map((cmd) => ({ cmd, times: 1 }))).slice(1));
      say(offer ? OFFER_FEEDBACK : emptyChargeFeedback(cmds.length));
    }, EMPTY_DOTS_MS);
    later(backToStart, EMPTY_BACK_MS);
  };

  const play = () => {
    if (running || solved) return;
    if (cards.length === 0) {
      say(EMPTY_FEEDBACK);
      return;
    }
    setRoute(null);
    setWrongCard(null);
    setRunning(true);
    // Always from the start: a new try is a new run of the whole program.
    live.current.pose = puzzle.start;
    setPose(puzzle.start);
    setCollected([]);
    setUsed(0);
    const result = run(puzzle, cards);
    result.frames.forEach((f, i) => {
      later(() => {
        setActiveCard(f.card);
        setUsed(i + 1);
        moveTo(f.pose);
        if (f.bumped) bump(f.pose.dir, f.bumped);
        else popBubble(i);
        setCollected((c) => {
          if (f.collected.length > c.length && f.collected.length < puzzle.goals.length) chime();
          return f.collected;
        });
      }, (i + 1) * STEP_MS);
    });
    const end = (result.frames.length + 1) * STEP_MS;
    later(() => {
      if (result.outcome === 'goal') {
        setActiveCard(null);
        setRunning(false);
        win();
        return;
      }
      const offer = missed(OFFER_AFTER_RUNS);
      if (result.outcome === 'bump') {
        setWrongCard(result.card);
        say(offer ? OFFER_FEEDBACK : bumpFeedback(result.frames.at(-1)!.bumped, result.card));
      } else if (result.outcome === 'empty') {
        runOutOfCharge(result.frames.at(-1)?.collected ?? [], offer);
        return;
      } else {
        const some = result.frames.at(-1)?.collected.length ?? 0;
        say(offer ? OFFER_FEEDBACK : some > 0 ? ONE_MORE_FEEDBACK : SHORT_FEEDBACK);
      }
      later(backToStart, BACK_MS);
    }, end);
  };

  /** "Mutasd az utat!": dots on the floor along a shortest way, from where the robot can start now. */
  const showRoute = () => {
    if (running || solved) return;
    // Stepping: from where the robot stands, to the batteries still waiting.
    const from = plan ? puzzle.start : live.current.pose;
    const goals = plan ? puzzle.goals : puzzle.goals.filter((_, i) => !live.current.collected.includes(i));
    const course = { ...puzzle, start: from, goals };
    const cmds = shortest(course, level.moves);
    if (!cmds) return;
    setRoute(routeCells(course, cmds.map((cmd) => ({ cmd, times: 1 }))));
    say(ROUTE_FEEDBACK);
    later(() => setRoute(null), ROUTE_MS);
  };

  const next = () => update((p) => ({ ...p, pathRound: p.pathRound + 1 }));
  const meter = ladderMeter(startLadder, LADDER_RULES.path, ladderStep);
  const levelUp = useLevelUp(meter, next);

  const boardW = puzzle.cols * CELL;
  const boardH = puzzle.rows * CELL;
  const robotX = pose.x * CELL;
  const robotY = pose.y * CELL;
  const palette = level.moves === 'absolute' ? ARROWS : TURNS;
  const planned = stepCount(cards);
  const over = puzzle.energy === null ? 0 : Math.max(0, planned - puzzle.energy);
  const charge = puzzle.energy ?? 0;
  const chip = over ? 'Túl hosszú' : `${charge - (running || empty ? used : planned)} marad`;
  const sideways = pose.dir === 1 || pose.dir === 3;
  const facing = {
    '--jx': `${DX[pose.dir] * 12}px`,
    '--jy': `${DY[pose.dir] * 12}px`,
    // Squash flat against what it hit: thinner along the way it drives, wider across.
    '--sx': sideways ? 0.86 : 1.1,
    '--sy': sideways ? 1.1 : 0.86
  } as CSSProperties;
  // The edge of the floor that flashes when the robot drives into the wall.
  const wallEdge = hit && hit.block === 'wall' ? edgeRect(hit.at, hit.dir) : null;

  return (
    <div className="screen screen--path world--robot">
      <div className="floor" aria-hidden="true" />

      <header className="topbar topbar--meter">
        <RoundButton label="Vissza a műhelybe" onClick={onBack}>
          <BackIcon />
        </RoundButton>
        <div className="topbar__title">
          <h1 className="screen-title">Robotút</h1>
          <LevelMeter meter={meter} world="robot" justSolved={solved} />
        </div>
        <RoundButton label="Meghallgatom újra" onClick={() => speak(fb.speech)}>
          <SpeakerIcon />
        </RoundButton>
      </header>

      <div className={`path-body${plan ? ' is-plan' : ''}`}>
        <div className="path-left">
        <FitBox className="path-fit" width={FRAME_W} height={FRAME_H}>
          <div className="path-frame">
            <div className={`path-board${solved ? ' is-done' : ''}`}>
              <svg
                width={boardW}
                height={boardH}
                viewBox={`0 0 ${boardW} ${boardH}`}
                role="img"
                aria-label={`Pálya: ${puzzle.cols} × ${puzzle.rows} mező, ${puzzle.crates.length} doboz. A robot a(z) ${pose.x + 1}. oszlopban, ${pose.y + 1}. sorban áll. ${puzzle.goals.map((g) => `Elem: ${g.x + 1}. oszlop, ${g.y + 1}. sor.`).join(' ')}`}
              >
                {Array.from({ length: puzzle.cols * puzzle.rows }, (_, i) => {
                  const x = i % puzzle.cols;
                  const y = Math.floor(i / puzzle.cols);
                  return <rect key={i} x={x * CELL + 3} y={y * CELL + 3} width={CELL - 6} height={CELL - 6} rx="14" className={`path-tile${(x + y) % 2 ? ' is-alt' : ''}`} />;
                })}
                {sameCell(pose, puzzle.start) && !solved && (
                  <rect x={puzzle.start.x * CELL + 10} y={puzzle.start.y * CELL + 10} width={CELL - 20} height={CELL - 20} rx="12" className="path-start" />
                )}
                {route &&
                  route.slice(1).map((c, i) => (
                    <circle key={`${c.x},${c.y}`} cx={c.x * CELL + CELL / 2} cy={c.y * CELL + CELL / 2} r="11" className="path-route" style={{ animationDelay: `${i * 0.12}s` }} />
                  ))}
                {missingCells &&
                  missingCells.map((c, i) => (
                    <circle key={`m${c.x},${c.y}`} cx={c.x * CELL + CELL / 2} cy={c.y * CELL + CELL / 2} r="12" className="path-missing" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                {puzzle.crates.map((c) => {
                  const struck = hit && hit.block === 'crate' && sameCell(hit.at, c);
                  return (
                    <g key={`${c.x},${c.y}`} transform={`translate(${c.x * CELL} ${c.y * CELL})`}>
                      <g key={struck ? hit.id : 'still'} className={struck ? 'path-crate is-hit' : 'path-crate'}>
                        <Crate />
                      </g>
                    </g>
                  );
                })}
                {wallEdge && <rect key={hit!.id} {...wallEdge} rx="4" className="path-wallhit" />}
                {puzzle.goals.map((g, i) => {
                  const got = solved || collected.includes(i);
                  return (
                    <g key={i} transform={`translate(${g.x * CELL} ${g.y * CELL})`} className={got ? 'path-battery is-charged' : 'path-battery'}>
                      <Battery charged={got} />
                    </g>
                  );
                })}
              </svg>
              {/* The robot is an HTML layer over the floor: turning and driving animate the same in every browser. */}
              <div
                className={`path-robot${hit ? ' is-hit' : ''}${solved ? ' is-happy' : ''}${empty ? ' is-empty' : ''}`}
                style={{ width: CELL, height: CELL, transform: `translate(${robotX}px, ${robotY}px)`, transitionDelay: `${driveDelay}ms` }}
                aria-hidden="true"
              >
                {/* Sag layer: the sputter jolts along the way the robot faces, then it leans over. */}
                <div key={hit ? `hit${hit.id}` : 'sag'} className="path-robot__sag" style={facing}>
                  <div className="path-robot__turn" style={{ transform: `rotate(${angle}deg)` }}>
                    <svg width={CELL} height={CELL} viewBox="0 0 100 100">
                      <Rover />
                    </svg>
                  </div>
                </div>
                {hit && (
                  <span key={`sparks${hit.id}`} className="path-sparks" style={{ left: CELL / 2 + DX[hit.dir] * 46, top: CELL / 2 + DY[hit.dir] * 46 }}>
                    {SPARKS.map((a) => (
                      <span key={a} className="path-spark" style={{ '--a': `${hit.dir * 90 + 180 + a}deg` } as CSSProperties} />
                    ))}
                  </span>
                )}
                {empty && (
                  <>
                    <span className="path-puff" style={{ left: 38, width: 18, height: 18, animationDelay: '0.3s', '--dx': '-10px' } as CSSProperties} />
                    <span className="path-puff" style={{ left: 52, width: 22, height: 22, animationDelay: '0.45s', '--dx': '6px' } as CSSProperties} />
                    <span className="path-puff" style={{ left: 44, width: 16, height: 16, animationDelay: '0.6s', '--dx': '-2px' } as CSSProperties} />
                    <span className="path-empty-badge">
                      <svg width="34" height="20" viewBox="0 0 34 20">
                        <rect x="2" y="2" width="26" height="16" rx="4" fill="#fff1e0" stroke="#d9741a" strokeWidth="3" />
                        <rect x="29" y="6" width="3" height="8" rx="1.5" fill="#d9741a" />
                      </svg>
                    </span>
                  </>
                )}
              </div>
            </div>
            {solved && (
              <div className="path-win" role="status">
                <span className="path-win__rays" aria-hidden="true" />
                <span className="path-win__title">Feltöltve!</span>
                <span className="path-win__reward">
                  +1 <Bolt size={34} /> csavar
                </span>
                <button type="button" className="big-btn big-btn--robot" onClick={levelUp.advance}>
                  Következő pálya <NextIcon />
                </button>
              </div>
            )}
          </div>
        </FitBox>
          {plan && puzzle.energy !== null && (
            <div
              className={`path-energy${over ? ' is-over' : ''}${empty ? ' is-empty' : ''}`}
              role="img"
              aria-label={`A robot energiája ${charge} lépésre elég. A terv ${planned} lépés.${over ? ' Túl hosszú.' : ''}`}
            >
              <span className="path-energy__pack" aria-hidden="true">
                <span className={`path-energy__battery${charge > 12 ? ' is-many' : ''}`}>
                  {Array.from({ length: charge }, (_, i) => (
                    <span key={i} className={`path-energy__cell${i < used ? ' is-spent' : i < planned ? ' is-planned' : ''}`} />
                  ))}
                </span>
                <span className="path-energy__nub" />
                {over > 0 && (
                  <span className="path-energy__ghosts">
                    {Array.from({ length: Math.min(over, MAX_GHOSTS) }, (_, i) => (
                      <span key={i} className="path-energy__ghost" />
                    ))}
                  </span>
                )}
              </span>
              <span className="path-energy__chip" aria-hidden="true">
                <Charge />
                {chip}
              </span>
            </div>
          )}

        </div>

        <div className="path-side">
          <GuideBubble guide="csavar" mood={fb.mood} tone={fb.tone} csepiWidth={60}>
            {fb.text}
          </GuideBubble>

          {plan && (
            <ol className={`path-program${level.slots > 8 ? ' is-long' : ''}`} aria-label={`Program: ${cards.length} / ${level.slots} kártya`} style={{ '--slots': level.slots } as CSSProperties}>
              {Array.from({ length: level.slots }, (_, i) => {
                const card = cards[i];
                if (!card) return <li key={i} className="path-slot" aria-hidden="true" />;
                const state = wrongCard === i ? ' is-wrong' : activeCard === i ? ' is-now' : '';
                return (
                  <li key={i} className="path-slot">
                    <button
                      type="button"
                      className={`path-card${state}`}
                      onClick={() => removeCard(i)}
                      disabled={running || solved}
                      aria-label={`${i + 1}. kártya: ${CMD_LABELS[card.cmd]}${card.times > 1 ? `, ${card.times}-szor` : ''}. Koppints, és kiveszem.`}
                    >
                      <span className="path-card__no">{i + 1}</span>
                      <CmdIcon cmd={card.cmd} size={40} />
                      {card.times > 1 && <span className="path-card__times">×{card.times}</span>}
                    </button>
                  </li>
                );
              })}
            </ol>
          )}

          {!solved && (
            <div className={`path-palette path-palette--${level.mode === 'step' ? 'cross' : level.moves}`}>
              {palette.map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  className={`path-cmd path-cmd--${cmd}`}
                  onClick={() => (plan ? addCard(cmd) : tapArrow(cmd))}
                  disabled={running}
                  aria-label={plan ? `${CMD_LABELS[cmd]} kártya a sor végére` : CMD_LABELS[cmd]}
                >
                  <CmdIcon cmd={cmd} size={level.mode === 'step' ? 48 : 40} />
                  <span className="path-cmd__label">{CMD_LABELS[cmd]}</span>
                </button>
              ))}
              {level.repeat &&
                Array.from({ length: MAX_TIMES - 1 }, (_, k) => k + 2).map((n) => (
                  <button key={n} type="button" className="path-cmd path-cmd--times" onClick={() => repeatLast(n)} disabled={running} aria-label={`Az utolsó kártya ${n}-szor fut`}>
                    <span className="path-cmd__times">×{n}</span>
                    <span className="path-cmd__label">{n === 2 ? 'kétszer' : 'háromszor'}</span>
                  </button>
                ))}
            </div>
          )}

          <div className="path-actions">
            {!solved && (
              <button type="button" className="peek-btn peek-btn--robot" onClick={() => {
                  askedWay.current = true;
                  showRoute();
                }}
                disabled={running}
              >
                Mutasd az utat!
              </button>
            )}
            {plan && !solved && (
              <button type="button" className="big-btn big-btn--robot" onClick={play} disabled={running}>
                <PlayIcon /> Indulás
              </button>
            )}
          </div>
        </div>
      </div>

      {levelUp.open && <LevelUpCard meter={meter} world="robot" onNext={levelUp.finish} />}
    </div>
  );
}

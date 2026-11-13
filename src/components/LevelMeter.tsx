import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { speak } from '../lib/speech';
import type { LevelMeterState } from '../state/levelMeter';
import { podFill, tasksIn, tasksPerReward } from '../state/pod';
import { useProgress } from '../state/progress';
import { seedBalance } from '../state/garden';
import { boltBalance, wishOf } from '../state/robotParts';

type World = 'garden' | 'robot';

/** Said when the top level's row fills for the first time; from then on the game is mixed practice. */
const MASTERED_SPEECH = 'Mester vagy! Minden szintet megcsináltál! Mostantól vegyes feladatokkal gyakorolhatsz.';

/** How long a level-up plays in the meter; a pod filled by the same win pays after it. */
export const LEVEL_UP_MS = 3000;
/** How long a full pod takes to pay: the reward colours in, flies into the total, and the pod empties. */
const PAY_MS = 2000;

function MeterSeed() {
  return (
    <svg viewBox="0 0 30 30" aria-hidden="true">
      <ellipse cx="15" cy="16" rx="9" ry="12" fill="#B77B45" />
      <path d="M15 6 C12 12 12 20 15 27" stroke="#8A5A2E" strokeWidth="2" fill="none" />
    </svg>
  );
}

function MeterBolt() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2l8.66 5v10L12 22l-8.66-5V7z" fill="#f2b33d" stroke="#0c5f5c" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3.6" fill="#ffffff" stroke="#0c5f5c" strokeWidth="2" />
    </svg>
  );
}

/** A resting pod: today's practice seeds or bolts are all paid. */
function MeterMoon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15.5 3.5a8.5 8.5 0 1 0 5 15.2A7 7 0 0 1 15.5 3.5z" fill="#ffd66b" stroke="#2d4a60" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function StairsIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2 13h3V9h3V6h3V3h3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Where a step's top middle is inside the staircase, for the star's hop. */
function topOf(el: HTMLElement | undefined): [number, number] {
  return el ? [el.offsetLeft + el.offsetWidth / 2, el.offsetTop] : [0, 0];
}

const STAR = 'M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z';

/**
 * One step per level: the levels done dark, the current one gold-outlined and filling up with its
 * solved rounds. On a level-up (`climbing`) the full step locks in dark and a star hops onto the next.
 * Mastering the top level (`mastering`) locks it in the same way and the star lands on it to stay; a
 * finished game (`finished`) shows every step done with the star resting on top.
 */
function Stairs({ level, levels, fill, fresh, climbing, mastering, finished }: { level: number; levels: number; fill: number; fresh: boolean; climbing: boolean; mastering: boolean; finished: boolean }) {
  const box = useRef<HTMLSpanElement>(null);
  const [hop, setHop] = useState<CSSProperties>({});
  const starred = climbing || mastering || finished;

  useLayoutEffect(() => {
    if (!starred || !box.current) return;
    const steps = box.current.children as HTMLCollectionOf<HTMLElement>;
    const [x0, y0] = topOf(steps[level]);
    const [x1, y1] = topOf(steps[climbing ? level + 1 : level]);
    setHop({ '--x0': `${x0}px`, '--y0': `${y0}px`, '--x1': `${x1}px`, '--y1': `${y1}px`, '--ym': `${Math.min(y0, y1) - 16}px` } as CSSProperties);
  }, [starred, climbing, level]);

  const moving = climbing || mastering;
  // The staircase keeps one track width; each step takes its share of it by the level count (see the CSS).
  return (
    <span ref={box} className={`level-meter__stairs${moving ? ' is-climbing' : ''}`} style={{ ...hop, '--levels': levels } as CSSProperties} aria-hidden="true">
      {Array.from({ length: levels }, (_, i) => (
        <span
          key={i}
          className={`level-meter__step${i < level || finished ? ' is-past' : i === level ? ' is-now' : ''}${i === level + 1 ? ' is-next' : ''}${i === level && fresh && !finished ? ' is-fresh' : ''}`}
          style={{ height: `${35 + (65 * (i + 1)) / levels}%`, ...(i === level ? { '--fill': `${Math.round(fill * 100)}%` } : {}) } as CSSProperties}
        />
      ))}
      {(mastering || finished) && (
        <svg className={`level-meter__star ${mastering ? 'is-landing' : 'is-resting'}`} viewBox="0 0 24 24">
          <path d={STAR} />
        </svg>
      )}
      {moving && (
        <>
          {climbing && (
            <svg className="level-meter__star" viewBox="0 0 24 24">
              <path d={STAR} />
            </svg>
          )}
          <span className="level-meter__rays">
            {[0, 60, 120, 180, 240, 300].map((r) => (
              <span key={r} style={{ '--r': `${r}deg` } as CSSProperties} />
            ))}
          </span>
        </>
      )}
    </span>
  );
}

/** The pod's parts (halves in the garden, quarters in the workshop) as ring arcs around the reward, with a small gap between them; the parents' page receipt draws the same pod. */
const POD_R = 17;
const POD_GAP = 14;
export function podArcs(parts: number): string[] {
  return Array.from({ length: parts }, (_, i) => {
    const at = (deg: number) => {
      const a = ((deg - 90) * Math.PI) / 180;
      return `${(22 + POD_R * Math.cos(a)).toFixed(2)} ${(22 + POD_R * Math.sin(a)).toFixed(2)}`;
    };
    const step = 360 / parts;
    return `M ${at(i * step + POD_GAP / 2)} A ${POD_R} ${POD_R} 0 0 1 ${at((i + 1) * step - POD_GAP / 2)}`;
  });
}

/** Where an element's middle is inside the bank, for the reward's flight into the total. */
function middleOf(el: Element | null, bank: HTMLElement): [number, number] {
  if (!el) return [0, 0];
  const r = el.getBoundingClientRect();
  const b = bank.getBoundingClientRect();
  // The meter may be scaled (FitBox), so measure in the bank's own pixels.
  const k = bank.offsetWidth / (b.width || 1);
  return [(r.left + r.width / 2 - b.left) * k, (r.top + r.height / 2 - b.top) * k];
}

/**
 * The reward pod and the total beside it: a quarter fills with every solved task, clockwise from the
 * top, around the seed (or bolt) it fills up to. The fourth quarter colours the reward in, it hops into
 * the total, which counts up by one, and the pod empties. A level-up from the same win plays first.
 */
function RewardBank({ world, wait, rested }: { world: World; wait: number; rested: boolean }) {
  const { progress } = useProgress();
  const tasks = tasksIn(progress, world);
  const parts = tasksPerReward(world);
  const balance = world === 'robot' ? boltBalance(progress) : seedBalance(progress);
  const seen = useRef(tasks);
  const bank = useRef<HTMLSpanElement>(null);
  const [fresh, setFresh] = useState<{ quarter: number; paid: boolean } | null>(null);
  const [flight, setFlight] = useState<CSSProperties>({});

  useEffect(() => {
    if (tasks <= seen.current) return;
    seen.current = tasks;
    // A resting pod pays nothing more today, so it has nothing to show.
    if (rested) return;
    const fill = tasks % parts;
    if (fill !== 0) {
      setFresh({ quarter: fill - 1, paid: false });
      return;
    }
    setFresh({ quarter: parts - 1, paid: true });
    const empty = window.setTimeout(() => setFresh(null), wait + PAY_MS);
    return () => window.clearTimeout(empty);
  }, [tasks, wait, rested, parts]);

  const paid = !!fresh?.paid;
  useLayoutEffect(() => {
    if (!paid || !bank.current) return;
    const [x0, y0] = middleOf(bank.current.querySelector('.reward-pod__reward'), bank.current);
    const [x1, y1] = middleOf(bank.current.querySelector('.reward-total__icon'), bank.current);
    setFlight({ '--fx0': `${x0}px`, '--fy0': `${y0}px`, '--fx1': `${x1}px`, '--fy1': `${y1}px`, '--fxm': `${(x0 + x1) / 2}px` } as CSSProperties);
  }, [paid]);

  const filled = rested ? 0 : paid ? parts : tasks % parts;
  const Icon = world === 'robot' ? MeterBolt : MeterSeed;
  return (
    <span ref={bank} className={`reward-bank${paid ? ' is-paid' : ''}${rested ? ' is-rested' : ''}`} style={{ '--pay-wait': `${wait}ms`, ...flight } as CSSProperties} aria-hidden="true">
      <span className="reward-pod">
        <svg className="reward-pod__ring" viewBox="0 0 44 44">
          {podArcs(parts).map((d, i) => (
            <path key={i} d={d} className={`reward-pod__quarter${i < filled ? ' is-full' : ''}${fresh?.quarter === i ? ' is-fresh' : ''}`} />
          ))}
        </svg>
        <span className="reward-pod__reward">{rested ? <MeterMoon /> : <Icon />}</span>
      </span>
      <span className="reward-total">
        <span className="reward-total__icon">
          <Icon />
        </span>
        <span className="reward-total__roll">
          {/* While paying, the number rolls up from the total before this reward. */}
          <span className="reward-total__col">
            {paid && <span>{balance - 1}</span>}
            <span>{balance}</span>
          </span>
        </span>
      </span>
      {paid && (
        <span className="reward-bank__flyer">
          <Icon />
        </span>
      )}
    </span>
  );
}

function MeterHeart() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7.5 2.8C19.5 16.4 12 21 12 21z" fill="#E2689A" stroke="#A23A66" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The part the child is saving up for in Robotépítő (B · Ezt szeretném): a heart and the bolts still missing,
 * beside the bolt total. When a paid bolt makes it enough, the chip turns gold and Csavar says so, once.
 */
function WishChip({ wait }: { wait: number }) {
  const { progress } = useProgress();
  const wish = wishOf(progress);
  const need = wish?.need ?? null;
  const was = useRef(need);

  useEffect(() => {
    const before = was.current;
    was.current = need;
    if (need !== 0 || !before || !wish) return;
    // Said after the bolt has landed in the total.
    const say = window.setTimeout(() => speak(`Megvan a csavar arra, amit kértél: ${wish.part.name.toLowerCase()}! A Robotépítőben felcsavarozhatod.`, { queue: true }), wait + PAY_MS);
    return () => window.clearTimeout(say);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Only a change in what is missing matters.
  }, [need]);

  if (!wish) return null;
  return (
    <span className={`reward-wish${wish.need === 0 ? ' is-ready' : ''}`}>
      <MeterHeart />
      <span>{wish.need === 0 ? 'megvan' : `még ${wish.need}`}</span>
    </span>
  );
}

/** Where the child is inside a round of several tasks (the workshop's rounds): `at` of `of`, `done` once it is solved. */
export interface RoundTasks {
  at: number;
  of: number;
  done: boolean;
  /** What one is called in the spoken label: a task, or a row (Kakukktojás). */
  unit?: string;
}

/** One pip per task in the round: the solved ones filled, the current one ringed. */
function TaskPips({ at, of, done }: RoundTasks) {
  return (
    <span className="level-meter__tasks" aria-hidden="true">
      {Array.from({ length: of }, (_, i) => (
        <span key={i} className={`level-meter__task${i < at || (i === at && done) ? ' is-done' : i === at ? ' is-now' : ''}`} />
      ))}
    </span>
  );
}

/**
 * The level meter under a game's title: a staircase with one step per level (the current one gold,
 * filling up with this level's solved rounds), and the reward pod with the seeds (or bolts) to spend
 * beside it; four solved tasks fill the pod and pay one. A win that fills a level's row plays the
 * level-up here, with Csepi saying so, instead of a card between rounds. A round of several tasks
 * (`tasks`) shows them as pips in front of the staircase, since the steps and the pod only move once the round is won.
 */
export function LevelMeter({ meter, world, justSolved = false, tasks }: { meter: LevelMeterState; world: World; justSolved?: boolean; tasks?: RoundTasks }) {
  const { level, levels, done, rounds, levelUp, mastered = false, finished = false, rested = false } = meter;
  const { progress } = useProgress();
  const left = tasksPerReward(world) - podFill(progress, world);
  const balance = world === 'robot' ? `${boltBalance(progress)} csavarod` : `${seedBalance(progress)} magod`;
  const reward = world === 'robot' ? 'csavarig' : 'magig';

  useEffect(() => {
    if (!levelUp && !mastered) return;
    // Said as the chip comes up, after the round's own praise.
    const line = mastered ? MASTERED_SPEECH : 'Új szint! Ügyes vagy!';
    const say = window.setTimeout(() => speak(line, { queue: true }), 1200);
    return () => window.clearTimeout(say);
  }, [levelUp, mastered]);

  const where = levelUp
    ? `Új szint: ${level + 2}. szint`
    : mastered
      ? 'Minden szint kész, mester vagy'
      : finished
        ? 'Minden szint kész, vegyes gyakorlás'
        : `${level + 1}. szint, ${rounds} körből ${done} kész`;
  const wish = world === 'robot' ? wishOf(progress) : null;
  const wishLine = wish ? (wish.need === 0 ? ` Megvan a csavar erre: ${wish.part.name.toLowerCase()}.` : ` Erre gyűjtesz: ${wish.part.name.toLowerCase()}, még ${wish.need} csavar.`) : '';
  const next = rested ? `mára megvan a gyakorlás öt ${world === 'robot' ? 'csavarja' : 'magja'}` : `még ${left} feladat a következő ${reward}`;
  const pips = tasks && tasks.of > 1 ? tasks : null;
  const inRound = pips ? `${pips.at + 1}. ${pips.unit ?? 'feladat'} a ${pips.of}-ből. ` : '';

  return (
    <div
      className={`level-meter${levelUp || mastered ? ' is-climbing' : ''}`}
      role="img"
      aria-label={`${inRound}${where}. ${balance} van, ${next}.${wishLine}`}
    >
      {pips && (
        <>
          <TaskPips {...pips} />
          <span className="level-meter__rule" aria-hidden="true" />
        </>
      )}
      <Stairs level={level} levels={levels} fill={done / rounds} fresh={justSolved && !levelUp} climbing={levelUp} mastering={mastered} finished={finished} />
      <span className="level-meter__rule" aria-hidden="true" />
      <RewardBank world={world} wait={levelUp || mastered ? LEVEL_UP_MS : 0} rested={rested} />
      {world === 'robot' && <WishChip wait={levelUp || mastered ? LEVEL_UP_MS : 0} />}
      {(levelUp || mastered) && (
        <span className="level-meter__chip" aria-hidden="true">
          <StairsIcon />
          {mastered ? 'Mester!' : 'Új szint!'}
        </span>
      )}
    </div>
  );
}

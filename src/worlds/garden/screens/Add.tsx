import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Basket, Bee, Bouquet, Hive, RoundFlower } from '../art';
import { FitBox } from '../../../components/FitBox';
import { useLadderRound } from '../../../components/ladderRound';
import { GameShell } from '../../../components/GameShell';
import { useForm } from '../../../components/Stage';
import { DoneTick, GuideBubble, NextIcon } from '../../../components/ui';
import {
  BOX_W,
  LEFT_X,
  SCENE_H,
  SCENE_W,
  TOO_MANY_SPEECH,
  UNTIE_SPEECH,
  bedWidth,
  carriedValue,
  buildAddRound,
  gatheredSlots,
  hiveX,
  needsMoves,
  questionFeedback,
  rightFeedback,
  runningTotal,
  tourFeedback,
  takeLayout,
  takeTap,
  tourOrder,
  untie,
  type AddItem,
  type AddRound,
} from '../games/add/logic';
import { numberCount } from '../../../lib/numbers';
import { fanfare, popBubble } from '../../../lib/sound';
import { speak } from '../../../lib/speech';
import { useProgress } from '../../../state/progress';

type Phase = 'ask' | 'tour' | 'solved';

const HOME = { x: SCENE_W / 2, y: 40 };
const BASKET = { x: LEFT_X + BOX_W / 2, y: SCENE_H / 2 + 10 };
const HIVE_Y = 78;
/** Space between the two beds. */
const BED_GAP = 40;
const TOUR_STEP_MS = 850;
/** The bee's flight to a flower; matches the .bee transition. */
const PICKUP_MS = 550;
/** Carrying it to its new place, plus a moment to set it down. */
const CARRY_MS = 700;
const LIFT_FRAME_MS = 40;
/** One hop of the victory lap; the flowers' hop wave uses the same beat. */
const CHEER_STEP_MS = 150;

/** Portrait phones: the space between the left bed and the right bed folded under it. */
const FOLD_GAP = 90;

interface Point {
  x: number;
  y: number;
}

/**
 * The scene as drawn (two beds side by side, 1000×250), or folded for a portrait phone:
 * the right bed moves under the left one. `place` maps a point of the drawn scene into it,
 * so the game logic keeps working in the drawn scene's coordinates.
 */
function sceneGeometry(round: AddRound, wide: boolean, fold: boolean) {
  const leftW = bedWidth(round);
  const rightW = wide ? SCENE_W - leftW - BED_GAP : BOX_W;
  const rightX = SCENE_W - rightW;
  const bedH = SCENE_H - 16;
  if (!fold) {
    return {
      width: SCENE_W,
      height: SCENE_H,
      place: (p: Point) => p,
      beds: [
        { left: LEFT_X, top: 8, width: leftW, height: bedH },
        { left: rightX, top: 8, width: rightW, height: bedH }
      ],
      plusY: SCENE_H / 2,
      home: HOME
    };
  }
  const width = Math.max(leftW, rightW);
  const leftDx = (width - leftW) / 2;
  const rightDx = (width - rightW) / 2 - rightX;
  const rightDy = SCENE_H + FOLD_GAP;
  const split = (leftW + rightX) / 2;
  return {
    width,
    height: SCENE_H * 2 + FOLD_GAP,
    place: (p: Point) => (p.x < split ? { x: p.x + leftDx, y: p.y } : { x: p.x + rightDx, y: p.y + rightDy }),
    beds: [
      { left: leftDx, top: 8, width: leftW, height: bedH },
      { left: (width - rightW) / 2, top: rightDy + 8, width: rightW, height: bedH }
    ],
    plusY: SCENE_H + FOLD_GAP / 2,
    home: { x: width - 40, y: SCENE_H + FOLD_GAP / 2 }
  };
}

/** Petals bursting from the right answer card: twelve directions, alternating near and far. */
const PETALS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const reach = i % 2 ? 150 : 115;
  return { dx: Math.round(Math.cos(angle) * reach), dy: Math.round(Math.sin(angle) * reach), turn: (i % 3) * 120 + 90 };
});

/** Where the k-th of n carried-away flowers sits under the hive (up to ten, without bouquets). */
function hiveSpot(hx: number, k: number, n: number) {
  return { x: hx + (k - (n - 1) / 2) * 56, y: 196 };
}

/** n dots in rows of five, like a ten-frame: the answer before the digit. */
function Dots({ n }: { n: number }) {
  return (
    <span className="dot-card" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} />
      ))}
    </span>
  );
}

/**
 * Méhkas: a + b = ? Tap flowers or bouquets and the bee counts them; pick the total.
 * Gather levels: tap the right-hand flowers first and the bee carries them into the left bed.
 * Take levels: tap b flowers and the bee carries them to the hive; then say how many are left.
 * A bouquet goes as a whole ten; when fewer are needed, tapping it unties it into ten loose flowers.
 */
export function Add({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  const [wrong, setWrong] = useState<number | null>(null);
  // The row is the first-try streak; a wrong pick empties it at once, and a full row steps up.
  const { level, step, win, meter, goNext } = useLadderRound('add', { missed: wrong !== null });
  const [round] = useState(() => buildAddRound(progress.addRound, level));
  const form = useForm();
  const countingOn = round.level.strategy === 'on';
  const gathering = round.level.strategy === 'gather';
  const taking = round.level.strategy === 'take';
  const [phase, setPhase] = useState<Phase>('ask');
  /** Ids of the flowers the bee has carried over (gather) or away to the hive (take), in order. */
  const [moved, setMoved] = useState<string[]>([]);
  /** Take levels: the bed's flowers, changing when a bouquet is untied. */
  const [items, setItems] = useState(round.items);
  /** Loose flowers that just came out of an untied bouquet. */
  const [fresh, setFresh] = useState<string[]>([]);
  const [visited, setVisited] = useState<AddItem[]>([]);
  const [bee, setBee] = useState(HOME);
  /** This task needed help (a wrong pick happened). */
  const missed = useRef(false);
  const tour = useRef<number | null>(null);
  /** The flower the bee is fetching or carrying right now; other taps wait until it lands. */
  const [flying, setFlying] = useState<string | null>(null);
  /** Take levels: the carried copy still stands where it was picked up, for the one frame before its flight starts. */
  const [liftOff, setLiftOff] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  /** The bee spins for joy after a right answer. */
  const [cheer, setCheer] = useState(false);

  /** Bouquet take levels: carried flowers go into the hive instead of lining up under it. */
  const wide = taking && round.level.bundles;
  const hive = { x: hiveX(round), y: HIVE_Y };
  /** How much has been moved: flowers over (gather) or value carried away (take). */
  const done = taking ? carriedValue(items, moved) : moved.length;
  const ready = !needsMoves(round) || (done >= round.b && flying === null);
  /** The flowers that make up the answer, in counting order: the bee's victory lap and the hop wave follow it. */
  const lap = tourOrder(round, taking ? moved : [], items);
  const fb = phase === 'solved' ? rightFeedback(round, step?.change ?? null) : phase === 'tour' ? tourFeedback(round) : questionFeedback(round, done);
  const layout = taking ? takeLayout(round, items) : null;
  const hasBouquets = round.items.some((i) => i.kind === 'ten');
  const showEquation = round.level.answers !== 'dots' || phase === 'solved';

  /** Where a flower stands: gathered flowers close ranks in the left bed. */
  const spot = (item: AddItem, carried: string[] = moved) => {
    if (layout) return layout.get(item.id) ?? item;
    if (!gathering) return item;
    const slots = gatheredSlots(round, carried.length);
    if (item.group === 'a') return slots[round.items.indexOf(item)];
    const k = carried.indexOf(item.id);
    return k >= 0 ? slots[round.a + k] : item;
  };

  useEffect(() => {
    speak(questionFeedback(round).speech);
    const pending = timers.current;
    return () => {
      if (tour.current !== null) window.clearInterval(tour.current);
      pending.forEach((t) => window.clearTimeout(t));
    };
  }, [round]);

  const stopTour = () => {
    if (tour.current !== null) window.clearInterval(tour.current);
    tour.current = null;
  };

  const flyTo = (item: AddItem) => {
    const p = spot(item);
    setBee({ x: p.x, y: p.y - (item.kind === 'ten' ? 60 : 46) });
  };

  /**
   * The bee carries one flower over to the left bed, or away to the hive:
   * it flies to the flower, picks it up, and the two travel together until the flower lands.
   */
  const carry = (item: AddItem) => {
    const from = spot(item);
    const above = item.kind === 'ten' ? 60 : 46;
    setFlying(item.id);
    setBee({ x: from.x, y: from.y - above });
    later(PICKUP_MS, () => {
      const next = [...moved, item.id];
      const doneNext = taking ? carriedValue(items, next) : next.length;
      popBubble(next.length);
      setMoved(next);
      const lift = () => {
        const to = gathering ? spot(item, next) : wide ? { x: hive.x, y: HIVE_Y + 20 } : hiveSpot(hive.x, next.length - 1, next.length);
        setBee({ x: to.x, y: to.y - above });
      };
      if (gathering) lift();
      else {
        // The copy appears on the picked flower first, so its move to the hive is animated.
        setLiftOff(item.id);
        later(LIFT_FRAME_MS, () => {
          setLiftOff(null);
          lift();
        });
      }
      later(CARRY_MS, () => {
        setFlying(null);
        speak(questionFeedback(round, doneNext).speech);
      });
    });
  };

  /** The bee unties a bouquet: ten loose flowers spring up and join the rows. */
  const untieBouquet = (item: AddItem) => {
    const next = untie(items, item.id);
    setItems(next);
    setFresh(next.filter((i) => i.id.startsWith(`${item.id}.`)).map((i) => i.id));
    flyTo(item);
    popBubble(10);
    speak(UNTIE_SPEECH);
  };

  const tap = (item: AddItem) => {
    if (phase === 'solved' || flying) return;
    const isMoved = moved.includes(item.id);
    if (gathering && item.group === 'b' && !isMoved) return carry(item);
    if (taking) {
      if (isMoved) return;
      const act = takeTap(items, moved, item, round.b - done);
      if (act === 'carry') return carry(item);
      if (act === 'untie') return untieBouquet(item);
      if (act === 'too-many') {
        flyTo(item);
        speak(TOO_MANY_SPEECH);
        return;
      }
    }
    visit(item);
  };

  const visit = (item: AddItem) => {
    if (phase === 'solved') return;
    stopTour();
    flyTo(item);
    if (visited.some((v) => v.id === item.id)) return;
    const next = [...visited, item];
    setVisited(next);
    speak(numberCount(runningTotal(round, next)));
  };

  const tapBasket = () => {
    if (phase === 'solved') return;
    setBee({ x: BASKET.x, y: BASKET.y - 90 });
    speak(`A kosárban ${numberCount(round.a)}.`);
  };

  /** After a wrong pick the bee tours everything on its own: tens first, then ones, counting aloud. */
  const startTour = () => {
    stopTour();
    setPhase('tour');
    setVisited([]);
    speak(tourFeedback(round).speech);
    if (countingOn) setBee({ x: BASKET.x, y: BASKET.y - 90 });
    const order = tourOrder(round, taking ? moved : [], items);
    let i = 0;
    tour.current = window.setInterval(() => {
      const item = order[i];
      if (!item) {
        stopTour();
        return;
      }
      i++;
      flyTo(item);
      const seen = order.slice(0, i);
      setVisited(seen);
      speak(numberCount(runningTotal(round, seen)), { queue: true });
    }, TOUR_STEP_MS);
  };

  /** Right answer: the bee takes a quick lap over the counted flowers, then spins for joy back home. */
  const celebrate = () => {
    fanfare();
    lap.forEach((item, k) => later(k * CHEER_STEP_MS, () => flyTo(item)));
    later(lap.length * CHEER_STEP_MS, () => {
      setBee(HOME);
      setCheer(true);
    });
  };

  const answer = (n: number) => {
    if (phase === 'solved') return;
    if (n === round.answer) {
      stopTour();
      setPhase('solved');
      setWrong(null);
      celebrate();
      // Csepi's own line says when the next sum gets easier.
      const s = win(missed.current, { quiet: true });
      speak(rightFeedback(round, s.change).speech);
    } else {
      setWrong(n);
      missed.current = true;
      startTour();
    }
  };


  const isVisited = (id: string) => visited.some((v) => v.id === id);

  // Phones: the scene is folded on a portrait phone and scaled (FitBox) to the room between the equation and the answers.
  const geo = sceneGeometry(round, wide, form === 'portrait');
  const place = geo.place;
  const beeAt = bee === HOME ? geo.home : place(bee);

  return (
    <GameShell
      game="add"
      className="screen--add"
      aside={
        showEquation && (
          <div className={`equation${round.level.answers === 'dots' ? ' is-reveal' : ''}`} aria-label={`${round.a} ${taking ? 'mínusz' : 'meg'} ${round.b}, mennyi?`}>
            <span className="equation__a">{round.a}</span>
            <span>{taking ? '−' : '+'}</span>
            <span className="equation__b">{round.b}</span>
            <span>=</span>
            <span className={`equation__sum${phase === 'solved' ? ' is-solved' : ''}`}>{phase === 'solved' ? round.answer : '?'}</span>
          </div>
        )
      }
      meter={meter}
      justSolved={phase === 'solved' && !step?.helped}
      onBack={onBack}
      onReplay={() => speak(fb.speech)}
    >

      <FitBox className="add-scene-box" width={geo.width} height={geo.height}>
        <div className={`add-scene${form === 'portrait' ? ' is-folded' : ''}`} style={{ width: geo.width, height: geo.height }}>
          {geo.beds.map((b, i) => (
            <div key={i} className="add-scene__bed" style={b} />
          ))}
          {!taking && (
            <div className="add-scene__plus" style={{ top: geo.plusY }} aria-hidden="true">
              +
            </div>
          )}

          {taking && (
            <>
              <span className="add-hive" style={{ left: place(hive).x, top: place(hive).y }} aria-hidden="true">
                <Hive />
              </span>
              {moved.map((id, k) => {
                const picked = items.find((i) => i.id === id);
                if (!picked) return null;
                const at = place(liftOff === id ? spot(picked) : wide ? { x: hive.x, y: HIVE_Y + 20 } : hiveSpot(hive.x, k, moved.length));
                const state = liftOff === id ? ' is-lifting' : flying === id ? ' is-flying' : wide ? ' is-stored' : '';
                return (
                  <span key={id} className={`add-carried${state}`} style={{ left: at.x, top: at.y }} aria-hidden="true">
                    {picked.kind === 'ten' ? <Bouquet petal={round.petalA} width={56} /> : <RoundFlower petal={round.petalA} width={round.level.bundles ? 54 : 64} />}
                  </span>
                );
              })}
            </>
          )}

          {countingOn && (
            <button type="button" className="basket" style={{ left: place(BASKET).x, top: place(BASKET).y }} onClick={tapBasket} aria-label={`Kosár, benne ${round.a} virág`}>
              <Basket petal={round.petalA} count={round.a} />
              <span className="basket__label">{round.a}</span>
            </button>
          )}

          {(taking ? items : round.items).map((item) => {
            const petal = item.group === 'a' ? round.petalA : round.petalB;
            const at = place(spot(item));
            const gone = taking && moved.includes(item.id);
            const waiting = (gathering && item.group === 'b' && !moved.includes(item.id)) || (taking && !ready && !gone);
            const label = gone
              ? 'Üres hely – innen elvitte a méhecske'
              : waiting
                ? gathering
                  ? 'Virág – koppints rá, és a méhecske átviszi'
                  : 'Virág – koppints rá, és a méhecske elviszi'
                : item.kind === 'ten'
                  ? 'Csokor: tíz virág'
                  : isVisited(item.id)
                    ? 'Megszámolt virág'
                    : 'Virág – koppints rá, és a méhecske megszámolja';
            return (
              <button
                key={item.id}
                type="button"
                className={`add-flower add-flower--${item.kind}${isVisited(item.id) ? ' is-visited' : ''}${gone ? ' is-gone' : ''}${fresh.includes(item.id) ? ' is-fresh' : ''}${gathering && flying === item.id && moved.includes(item.id) ? ' is-flying' : ''}${phase === 'solved' && !gone ? ' is-happy' : ''}`}
                style={{ left: at.x, top: at.y, '--d': `${Math.max(0, lap.indexOf(item)) * CHEER_STEP_MS}ms` } as CSSProperties}
                onClick={() => tap(item)}
                disabled={gone}
                aria-label={label}
              >
                {item.kind === 'ten' ? <Bouquet petal={petal} width={56} /> : <RoundFlower petal={petal} width={round.level.bundles ? 54 : 64} />}
              </button>
            );
          })}

          <span className={`bee${cheer ? ' is-cheering' : ''}`} style={{ left: beeAt.x, top: beeAt.y }} aria-hidden="true">
            <Bee width={70} />
          </span>
        </div>
      </FitBox>

      {hasBouquets && (
        <div className="legend" aria-label="Egy csokorban tíz virág van">
          <Bouquet petal="#FFFFFF" width={26} /> = 10 virág
        </div>
      )}

      <div className="add-guide">
        <GuideBubble mood={fb.mood} tone={fb.tone}>
          {fb.text}
        </GuideBubble>
      </div>

      {!ready ? (
        <div className="choices choices--add" aria-hidden="true">
          <div className="add-wait" />
        </div>
      ) : (
      <div className="choices choices--add">
        {round.choices.map((n) => {
          const state = phase === 'solved' && n === round.answer ? ' is-right' : wrong === n && phase === 'tour' ? ' is-wrong' : '';
          const { answers } = round.level;
          return (
            <button key={n} type="button" className={`choice choice--number choice--short${state}`} onClick={() => answer(n)} aria-label={`${n}`}>
              {answers !== 'digits' && <Dots n={n} />}
              {answers !== 'dots' && <span className={`choice__numeral${answers === 'both' ? ' choice__numeral--small' : ''}`}>{n}</span>}
              {state === ' is-right' && <DoneTick />}
              {state === ' is-right' && (
                <span className="cheer" aria-hidden="true">
                  {PETALS.map((p, i) => (
                    <span
                      key={i}
                      style={{ '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, '--turn': `${p.turn}deg`, background: i % 2 ? round.petalA : round.petalB } as CSSProperties}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
        {phase === 'solved' && (
          <button type="button" className="big-btn" onClick={goNext}>
            Következő <NextIcon />
          </button>
        )}
      </div>
      )}
    </GameShell>
  );
}

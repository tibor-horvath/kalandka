import { useEffect, useMemo, useRef, useState } from 'react';
import { Cloud, Drop, GrowingPlant, Pot, WateringCan } from '../art';
import { useLadderRound } from '../../../components/ladderRound';
import { GameShell } from '../../../components/GameShell';
import { useForm } from '../../../components/Stage';
import { CAN_DROPS, addDrop, feedback, growth, introSpeech, maxDropsFor, plantForLevel, removeDrop, slotKinds } from '../games/water/logic';
import { numberCount } from '../../../lib/numbers';
import { speak } from '../../../lib/speech';
import { useProgress } from '../../../state/progress';
import { GuideSays, NextButton } from '../../../components/round';

function TapIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11V5a2 2 0 0 1 4 0v6" />
      <path d="M13 9a2 2 0 0 1 4 0v3a7 7 0 0 1-7 7h-1a5 5 0 0 1-4.6-3L3 12.5a1.8 1.8 0 0 1 3-1.8L9 14" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg aria-hidden="true" width="20" height="14" viewBox="0 0 22 16">
      <path d="M2 8h16M12 2l6 6-6 6" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * How the slots work, drawn instead of written: an empty slot becomes a drop, a drop becomes an empty slot.
 * The sentence stays for screen readers; Csepi says it when the round starts.
 */
function SlotHowTo({ perTap }: { perTap: number }) {
  const text =
    perTap > 1
      ? 'Koppints egy cseppre, és elveszel kettőt. Koppints egy üres helyre, és adsz kettőt.'
      : 'Koppints egy cseppre, és elveszed. Koppints egy üres helyre, és adsz egyet.';
  return (
    <div className="slot-howto" role="img" aria-label={text}>
      {/* Tap an empty slot (the hand) and a drop appears: one more. */}
      <span className="slot-howto__pair">
        <i className="slot-howto__slot slot-howto__slot--empty">
          <span className="slot-howto__tap">
            <TapIcon />
          </span>
        </i>
        <Arrow />
        <i className="slot-howto__slot slot-howto__slot--drop">
          <Drop size={14} />
        </i>
        <b className="slot-howto__n">+{perTap}</b>
      </span>
      {/* Tap a drop and it goes: one less. */}
      <span className="slot-howto__pair">
        <i className="slot-howto__slot slot-howto__slot--drop">
          <Drop size={14} />
          <span className="slot-howto__tap">
            <TapIcon />
          </span>
        </i>
        <Arrow />
        <i className="slot-howto__slot slot-howto__slot--gone" />
        <b className="slot-howto__n">−{perTap}</b>
      </span>
    </div>
  );
}

export function Water({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  // On phones Csepi talks above the scene instead of inside the panel.
  const phone = useForm() !== 'tablet';
  const round = progress.games.water.round;
  const { level, step, win, meter, goNext } = useLadderRound('water');
  // One plant object per round: effects below key on it, so it must not change between renders.
  const plant = useMemo(() => plantForLevel(level, round), [level, round]);
  /** Drops already in the frame (counting on), and drops per tap of the cloud (counting in twos). */
  const given = plant.given ?? 0;
  const perTap = plant.step ?? 1;
  const [count, setCount] = useState(given);
  /** Drops currently in the air; dx spreads a can's pour so the drops don't overlap. */
  const [falling, setFalling] = useState<{ id: number; dx: number }[]>([]);
  const dropId = useRef(0);
  const pourTimers = useRef<number[]>([]);
  const pouring = useRef(false);
  /** Mirrors `pouring` for rendering: tilts the can while it pours. */
  const [isPouring, setIsPouring] = useState(false);
  /** This plant got too much water at some point ("Hoppá"): the task needed help. */
  const overflowed = useRef(false);

  const fb = feedback(count, plant);
  // A pour is judged where it ends: drops passing the target on their way to too many are no bloom.
  const done = fb.status === 'done' && !isPouring;
  /** The plant bloomed this round: the cloud sleeps and the drops stay put, so one more tap can't undo the win. */
  const [bloomed, setBloomed] = useState(false);

  const stopPouring = () => {
    pourTimers.current.forEach((t) => window.clearTimeout(t));
    pourTimers.current = [];
    pouring.current = false;
    setIsPouring(false);
  };

  useEffect(() => {
    stopPouring();
    setCount(plant.given ?? 0);
    setFalling([]);
    setBloomed(false);
    overflowed.current = false;
    speak(introSpeech(plant));
    return stopPouring;
  }, [round, plant]);

  // First time this round's plant blooms: a seed and a flower for the garden.
  useEffect(() => {
    if (!done) return;
    setBloomed(true);
    win(overflowed.current, { extra: (p) => ({ ...p, garden: [...p.garden, plant.id] }) });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Runs once, when the plant blooms; win and the plant are read from that render.
  }, [done]);

  const change = (next: number) => {
    if (next === count) return;
    setCount(next);
    const nextFb = feedback(next, plant);
    if (nextFb.status === 'over') overflowed.current = true;
    if (next > 0) speak(numberCount(next));
    if (nextFb.status !== 'under' || next === 0) speak(nextFb.speech, { queue: next > 0 });
  };

  const maxDrops = maxDropsFor(plant.target);
  const double = maxDrops > 10;
  // Counting on and counting in twos have only the cloud: the child counts each tap, not a pour of five.
  const showCan = double && perTap === 1 && given === 0;

  const dropOne = (dx = 0) => {
    const id = ++dropId.current;
    setFalling((f) => [...f, { id, dx }]);
    window.setTimeout(() => setFalling((f) => f.filter((d) => d.id !== id)), 650);
  };

  const add = (amount = perTap) => {
    if (bloomed || pouring.current || count >= maxDrops) return;
    const end = addDrop(count, plant.target, amount);
    const steps = end - count;
    // The can counts every drop it pours; a pair from the cloud is counted as its total ("kettő, négy, hat").
    const inTwos = amount === perTap && perTap > 1;
    if (steps === 1) {
      dropOne();
      change(end);
      return;
    }
    // The can pours its drops one at a time: each one falls, fills a space and is counted.
    pouring.current = true;
    setIsPouring(true);
    for (let i = 1; i <= steps; i++) {
      pourTimers.current.push(
        window.setTimeout(() => {
          const n = count + i;
          dropOne((i - (steps + 1) / 2) * 26);
          setCount(n);
          if (!inTwos || i === steps) speak(numberCount(n), { queue: i > 1 && !inTwos });
          if (i === steps) {
            pouring.current = false;
            setIsPouring(false);
            pourTimers.current = [];
            const f = feedback(n, plant);
            if (f.status === 'over') overflowed.current = true;
            if (f.status !== 'under') speak(f.speech, { queue: true });
          }
        }, (i - 1) * 320)
      );
    }
  };
  const remove = () => {
    if (!bloomed && !pouring.current) change(removeDrop(count, given, perTap));
  };

  const guide = (
    <GuideSays line={fb} />
  );

  const kinds = slotKinds(count, plant.target, given);
  const scale = growth(count, plant.target);

  return (
    <GameShell
      game="water"
      className="screen--water"
      meter={meter}
      justSolved={done && !step?.helped}
      onBack={onBack}
      onReplay={() => speak(`${introSpeech(plant)} ${fb.speech}`)}
    >

      <div className="water-body">
        {phone && <div className="water-guide">{guide}</div>}
        <div className="scene">
          <div className="sky-tools">
            <button
              type="button"
              className={`cloud-btn${bloomed ? ' is-asleep' : ''}`}
              onClick={() => add()}
              disabled={bloomed}
              aria-label={bloomed ? 'A felhő alszik: a virág kinyílt' : perTap > 1 ? 'Koppints a felhőre két cseppért' : 'Koppints a felhőre egy cseppért'}
            >
              <Cloud asleep={bloomed} />
              {/* A picture, not a sentence: a tapping hand, how many drops, a drop. Csepi's bubble is the one voice. */}
              <span className="cloud-btn__label" aria-hidden="true">
                <TapIcon />+{perTap} <Drop size={16} />
              </span>
            </button>
            {showCan && (
              <button
                type="button"
                className={`can-btn${isPouring ? ' is-pouring' : ''}`}
                onClick={() => add(CAN_DROPS)}
                aria-label="Locsolókanna: öt csepp egyszerre"
              >
                <span className="can-btn__can">
                  <WateringCan />
                  <span className="can-stream" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                </span>
                <span className="cloud-btn__label">
                  <Drop size={16} /> 5 csepp
                </span>
              </button>
            )}
          </div>

          <div className="planter">
            {falling.map((d) => (
              <span key={d.id} className="falling-drop" style={{ marginLeft: -17 + d.dx }} aria-hidden="true">
                <Drop size={34} />
              </span>
            ))}
            {fb.status === 'over' && <span className="puddle" aria-hidden="true" />}
            <div className="plant" style={{ transform: `rotate(${fb.status === 'over' ? 12 : 0}deg) scale(${scale})` }}>
              <GrowingPlant species={plant.id} petal={plant.petal} bloom={done} />
            </div>
            <Pot />
          </div>
        </div>

        <div className="panel">
          <div className="panel__head">
            <div>
              <div className="panel__label">{plant.dative}</div>
              <div className="panel__need">
                <span className="panel__number">{plant.target}</span>
                <span className="panel__unit">csepp kell</span>
                <Drop size={40} />
              </div>
            </div>
            <div className="counter">
              <div className="counter__value">{count}</div>
              <div className="counter__label">eddig</div>
            </div>
          </div>

          <div className={`ten-frame${double ? ' ten-frame--double' : ''}`}>
            {kinds.map((kind, k) => {
              const filled = kind === 'filled' || kind === 'extra';
              const label =
                kind === 'given' ? `${k + 1}. csepp, már ott volt.` : filled ? `${k + 1}. csepp. Koppints rá, és elveszed.` : `${k + 1}. üres hely. Koppints rá egy cseppért.`;
              return (
                <button
                  key={k}
                  type="button"
                  className={`slot slot--${kind}`}
                  disabled={bloomed && kind !== 'given'}
                  onClick={kind === 'given' ? undefined : filled ? remove : () => add()}
                  aria-label={label}
                >
                  {(filled || kind === 'given') && <Drop size={double ? 28 : 40} />}
                </button>
              );
            })}
          </div>

          {!phone && guide}

          <div className="panel__foot">
            {!done && <SlotHowTo perTap={perTap} />}
            <NextButton show={done} onNext={goNext} label="Következő virág" />
          </div>
        </div>
      </div>

    </GameShell>
  );
}

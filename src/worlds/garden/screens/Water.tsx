import { useEffect, useMemo, useRef, useState } from 'react';
import { Cloud, Drop, GrowingPlant, Pot, WateringCan } from '../art';
import { useLadderRound } from '../../../components/ladderRound';
import { GameShell } from '../../../components/GameShell';
import { useForm } from '../../../components/Stage';
import { GuideBubble, NextIcon } from '../../../components/ui';
import { CAN_DROPS, addDrop, feedback, growth, introSpeech, maxDropsFor, plantForLevel, removeDrop, slotKinds } from '../games/water/logic';
import { numberCount } from '../../../lib/numbers';
import { speak } from '../../../lib/speech';
import { useProgress } from '../../../state/progress';

export function Water({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  // On phones Csepi talks above the scene instead of inside the panel.
  const phone = useForm() !== 'tablet';
  const round = progress.waterRound;
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
    overflowed.current = false;
    speak(introSpeech(plant));
    return stopPouring;
  }, [round, plant]);

  // First time this round's plant blooms: a seed and a flower for the garden.
  useEffect(() => {
    if (done) win(overflowed.current, { extra: (p) => ({ ...p, garden: [...p.garden, plant.id] }) });
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
    if (pouring.current || count >= maxDrops) return;
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
    if (!pouring.current) change(removeDrop(count, given, perTap));
  };

  const guide = (
    <GuideBubble mood={fb.mood} tone={fb.tone}>
      {fb.text}
    </GuideBubble>
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
            <button type="button" className="cloud-btn" onClick={() => add()} aria-label={perTap > 1 ? 'Koppints a felhőre két cseppért' : 'Koppints a felhőre egy cseppért'}>
              <Cloud />
              <span className="cloud-btn__label">
                <Drop size={16} /> {perTap > 1 ? `${perTap} csepp` : double ? '1 csepp' : 'Koppints rám egy cseppért!'}
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
            {!done && (
              <p className="panel__hint">
                {perTap > 1
                  ? 'Koppints egy cseppre, és elveszel kettőt. Koppints egy üres helyre, és adsz kettőt.'
                  : 'Koppints egy cseppre, és elveszed. Koppints egy üres helyre, és adsz egyet.'}
              </p>
            )}
            {done && (
              <button type="button" className="big-btn" onClick={goNext}>
                Következő virág <NextIcon />
              </button>
            )}
          </div>
        </div>
      </div>

    </GameShell>
  );
}

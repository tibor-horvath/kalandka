import { useEffect, useMemo, useRef, useState } from 'react';
import { Cloud, Drop, GrowingPlant, Pot, WateringCan } from '../components/art';
import { useForm } from '../components/Stage';
import { BackIcon, GuideBubble, NextIcon, RoundButton, SpeakerIcon } from '../components/ui';
import { CAN_DROPS, addDrop, feedback, growth, introSpeech, maxDropsFor, plantForRound, removeDrop, slotKinds } from '../games/water/logic';
import { numberCount } from '../lib/numbers';
import { speak } from '../lib/speech';
import { useProgress } from '../state/progress';

const DOTS = 5;

export function Water({ onBack }: { onBack: () => void }) {
  const { progress, update } = useProgress();
  // On phones Csepi talks above the scene instead of inside the panel.
  const phone = useForm() !== 'tablet';
  const round = progress.waterRound;
  // One plant object per round: effects below key on it, so it must not change between renders.
  const plant = useMemo(() => plantForRound(round), [round]);
  const [count, setCount] = useState(0);
  /** Drops currently in the air; dx spreads a can's pour so the drops don't overlap. */
  const [falling, setFalling] = useState<{ id: number; dx: number }[]>([]);
  const dropId = useRef(0);
  const pourTimers = useRef<number[]>([]);
  const pouring = useRef(false);
  /** Mirrors `pouring` for rendering: tilts the can while it pours. */
  const [isPouring, setIsPouring] = useState(false);
  const rewarded = useRef<number | null>(null);

  const fb = feedback(count, plant);
  const done = fb.status === 'done';

  const stopPouring = () => {
    pourTimers.current.forEach((t) => window.clearTimeout(t));
    pourTimers.current = [];
    pouring.current = false;
    setIsPouring(false);
  };

  useEffect(() => {
    stopPouring();
    setCount(0);
    setFalling([]);
    speak(introSpeech(plant));
    return stopPouring;
  }, [round, plant]);

  // First time this round's plant blooms: a seed and a flower for the garden.
  useEffect(() => {
    if (done && rewarded.current !== round) {
      rewarded.current = round;
      update((p) => ({ ...p, seeds: p.seeds + 1, garden: [...p.garden, plant.id] }));
    }
  }, [done, round, plant.id, update]);

  const change = (next: number) => {
    if (next === count) return;
    setCount(next);
    const nextFb = feedback(next, plant);
    if (next > 0) speak(numberCount(next));
    if (nextFb.status !== 'under' || next === 0) speak(nextFb.speech, { queue: next > 0 });
  };

  const maxDrops = maxDropsFor(plant.target);
  const double = maxDrops > 10;

  const dropOne = (dx = 0) => {
    const id = ++dropId.current;
    setFalling((f) => [...f, { id, dx }]);
    window.setTimeout(() => setFalling((f) => f.filter((d) => d.id !== id)), 650);
  };

  const add = (amount = 1) => {
    if (pouring.current || count >= maxDrops) return;
    const end = addDrop(count, plant.target, amount);
    const steps = end - count;
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
          speak(numberCount(n), { queue: i > 1 });
          if (i === steps) {
            pouring.current = false;
            setIsPouring(false);
            pourTimers.current = [];
            const f = feedback(n, plant);
            if (f.status !== 'under') speak(f.speech, { queue: true });
          }
        }, (i - 1) * 320)
      );
    }
  };
  const remove = () => {
    if (!pouring.current) change(removeDrop(count));
  };
  const next = () => update((p) => ({ ...p, waterRound: p.waterRound + 1 }));

  const guide = (
    <GuideBubble mood={fb.mood} tone={fb.tone}>
      {fb.text}
    </GuideBubble>
  );

  const kinds = slotKinds(count, plant.target);
  const scale = growth(count, plant.target);
  const dotIndex = round % DOTS;

  return (
    <div className="screen screen--water">
      <div className="lawn" aria-hidden="true" />

      <header className="topbar">
        <RoundButton label="Vissza a kertbe" onClick={onBack}>
          <BackIcon />
        </RoundButton>
        <div className="dots" aria-label={`${dotIndex + 1}. virág az ötből`}>
          {Array.from({ length: DOTS }, (_, k) => (
            <span key={k} className={`dot${k < dotIndex ? ' dot--done' : k === dotIndex ? ' dot--now' : ''}`} />
          ))}
        </div>
        <RoundButton label="Meghallgatom újra" onClick={() => speak(`${introSpeech(plant)} ${fb.speech}`)}>
          <SpeakerIcon />
        </RoundButton>
      </header>

      <div className="water-body">
        {phone && <div className="water-guide">{guide}</div>}
        <div className="scene">
          <div className="sky-tools">
            <button type="button" className="cloud-btn" onClick={() => add()} aria-label="Koppints a felhőre egy cseppért">
              <Cloud />
              <span className="cloud-btn__label">
                <Drop size={16} /> {double ? '1 csepp' : 'Koppints rám egy cseppért!'}
              </span>
            </button>
            {double && (
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
              <GrowingPlant petal={plant.petal} bloom={done} />
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
              return (
                <button
                  key={k}
                  type="button"
                  className={`slot slot--${kind}`}
                  onClick={filled ? remove : () => add()}
                  aria-label={filled ? `${k + 1}. csepp. Koppints rá, és elveszed.` : `${k + 1}. üres hely. Koppints rá egy cseppért.`}
                >
                  {filled && <Drop size={double ? 28 : 40} />}
                </button>
              );
            })}
          </div>

          {!phone && guide}

          <div className="panel__foot">
            {!done && <p className="panel__hint">Koppints egy cseppre, és elveszed. Koppints egy üres helyre, és adsz egyet.</p>}
            {done && (
              <button type="button" className="big-btn" onClick={next}>
                Következő virág <NextIcon />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

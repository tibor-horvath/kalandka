import { useEffect, useRef, useState } from 'react';
import { speak } from '../lib/speech';
import type { LevelMeterState } from '../state/levelMeter';
import { useModal } from './Modal';
import { NextIcon } from './ui';

type World = 'garden' | 'robot';

function MeterFlower() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="5.5" r="4.2" fill="#e86a92" />
      <circle cx="5.8" cy="10" r="4.2" fill="#e86a92" />
      <circle cx="18.2" cy="10" r="4.2" fill="#e86a92" />
      <circle cx="8.2" cy="17.2" r="4.2" fill="#e86a92" />
      <circle cx="15.8" cy="17.2" r="4.2" fill="#e86a92" />
      <circle cx="12" cy="11.6" r="3.6" fill="#ffc93c" />
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

function Stairs({ level, levels }: { level: number; levels: number }) {
  // Long ladders draw as one stepped ramp so they keep the meter's width.
  return (
    <span className={`level-meter__stairs${levels > 8 ? ' is-ramp' : ''}`} aria-hidden="true">
      {Array.from({ length: levels }, (_, i) => (
        <span
          key={i}
          className={`level-meter__step${i < level ? ' is-past' : i === level ? ' is-now' : ''}`}
          style={{ height: `${35 + (65 * (i + 1)) / levels}%` }}
        />
      ))}
    </span>
  );
}

/**
 * The level meter under a game's title: a staircase with one step per level (the current one gold)
 * and a slot per round of this level. A solved round plants a flower, or a bolt in the workshop.
 */
export function LevelMeter({ meter, world, justSolved = false }: { meter: LevelMeterState; world: World; justSolved?: boolean }) {
  const { level, levels, done, rounds } = meter;
  const Icon = world === 'robot' ? MeterBolt : MeterFlower;
  return (
    <div className={`level-meter${rounds > 6 ? ' level-meter--many' : ''}`} role="img" aria-label={`${level + 1}. szint, ${rounds} körből ${done} kész`}>
      <Stairs level={level} levels={levels} />
      <span className="level-meter__rule" aria-hidden="true" />
      <span className="level-meter__pips" aria-hidden="true">
        {Array.from({ length: rounds }, (_, i) => (
          <span key={i} className={`level-meter__pip${i < done ? ' is-done' : ''}${justSolved && i === done - 1 ? ' is-fresh' : ''}`}>
            {i < done && <Icon />}
          </span>
        ))}
      </span>
    </div>
  );
}

/** "Következő" opens the level-up card first when this win filled the row; "Tovább" there (`finish`) moves on. */
export function useLevelUp(meter: LevelMeterState, next: () => void) {
  const [open, setOpen] = useState(false);
  return {
    open,
    advance: () => (meter.levelUp ? setOpen(true) : next()),
    // Some screens stay mounted between rounds, so the card closes itself.
    finish: () => {
      setOpen(false);
      next();
    }
  };
}

/** Shown once between rounds when a level's row is full: the staircase climbs a step. */
export function LevelUpCard({ meter, world, onNext }: { meter: LevelMeterState; world: World; onNext: () => void }) {
  const button = useRef<HTMLButtonElement>(null);
  const Icon = world === 'robot' ? MeterBolt : MeterFlower;
  const modal = useModal<HTMLDivElement>();

  useEffect(() => {
    speak('Új szint! Ügyes vagy!');
    button.current?.focus();
  }, []);

  return (
    <div ref={modal} className="level-up" role="dialog" aria-modal="true" aria-labelledby="level-up-title">
      <div className="level-up__card">
        <Stairs level={meter.level + 1} levels={meter.levels} />
        <h2 id="level-up-title" className="level-up__title">
          Új szint!
        </h2>
        <span className="level-up__row" aria-hidden="true">
          {Array.from({ length: meter.rounds }, (_, i) => (
            <span key={i} className="level-meter__pip is-done">
              <Icon />
            </span>
          ))}
        </span>
        <button ref={button} type="button" className={`big-btn${world === 'robot' ? ' big-btn--robot' : ''}`} onClick={onNext}>
          Tovább <NextIcon />
        </button>
      </div>
    </div>
  );
}

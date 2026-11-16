import { useEffect, useRef, useState, type ReactNode } from 'react';
import { DoneTick, GuideBubble, NextIcon } from '../../../components/ui';
import { speak } from '../../../lib/speech';
import { buzz, chime, fanfare } from '../../../lib/sound';
import { SHOW_AFTER, type Say } from '../games/common';

// What the Óratorony's games share: Kakukk's bubble, a row of answer cards, and the way on to the next task.
// One question per task: a wrong card shakes once and stays dimmed, two misses light the right one up, and a
// right card gets the tick, Kakukk's "Kakukk!" and the meter's step.

/**
 * One question's state: Kakukk's line, the misses, which cards were tried, and whether it is solved. `answer`
 * returns true when the pick was right; the screen hands it the lines to say. The first line is said on mount,
 * unless `quiet` (a level intro is open).
 */
export function useQuestion(start: Say, quiet = false) {
  const [line, setLine] = useState<Say>(start);
  const [misses, setMisses] = useState(0);
  const [tried, setTried] = useState<number[]>([]);
  /** The card tapped wrong last, keyed so its shake plays again on every miss. */
  const [shake, setShake] = useState<{ i: number; id: number } | null>(null);
  const [solved, setSolved] = useState<number | null>(null);
  const said = useRef(false);
  /** Misses over the whole task, for the ladder: a task with any miss needed help. */
  const total = useRef(0);

  useEffect(() => {
    if (said.current) return;
    said.current = true;
    // A level's intro is showing: it speaks first, and the game says its line when the intro closes.
    if (!quiet) speak(start.speech);
  }, [start.speech, quiet]);

  const tell = (s: Say) => {
    setLine(s);
    speak(s.speech);
  };

  /** A wrong card: the line for this miss (counting it) comes from `say`. */
  const miss = (i: number, say: (misses: number) => Say) => {
    const m = misses + 1;
    total.current += 1;
    setMisses(m);
    setTried((t) => (t.includes(i) ? t : [...t, i]));
    setShake((s) => ({ i, id: (s?.id ?? 0) + 1 }));
    buzz(30);
    tell(say(m));
  };

  /** The right card: the tick, the cuckoo's fanfare and Kakukk's line. */
  const hit = (i: number, say: Say, last = true) => {
    if (last) {
      setSolved(i);
      fanfare();
      buzz(40);
    } else chime();
    setShake(null);
    tell(say);
  };

  /** On to the next pick of the same task (Napirend's next card): the misses and dimmed cards start again. */
  const next = () => {
    setMisses(0);
    setTried([]);
    setShake(null);
  };

  return { line, misses, tried, shake, solved, glow: misses >= SHOW_AFTER, helped: () => total.current > 0, tell, miss, hit, next };
}

export type Question = ReturnType<typeof useQuestion>;

export function KakukkSays({ line }: { line: Say }) {
  return (
    <div className="tower-guide">
      <GuideBubble guide="kakukk" mood={line.mood} tone={line.tone} csepiWidth={62}>
        {line.text}
      </GuideBubble>
    </div>
  );
}

export interface Card {
  key: string;
  /** The accessible name, said by screen readers. */
  label: string;
  body: ReactNode;
}

/**
 * The answer cards. `right` is the right card's index (lit after two misses); a card already tried stays
 * dimmed; once solved the right one keeps its tick and the rest grey out.
 */
export function Cards({ cards, right, q, onPick, className = '' }: { cards: Card[]; right: number; q: Question; onPick: (i: number) => void; className?: string }) {
  return (
    <div className={`choices tower-choices ${className}`.trim()}>
      {cards.map((c, i) => {
        const done = q.solved !== null;
        const state =
          q.solved === i ? ' is-right' : done ? ' is-dim' : q.shake?.i === i ? ' is-wrong' : q.tried.includes(i) ? ' is-tried' : q.glow && i === right ? ' is-glow' : '';
        return (
          <button
            key={`${c.key}${q.shake?.i === i ? `-${q.shake.id}` : ''}`}
            type="button"
            className={`choice tower-card${state}`}
            onClick={() => !done && onPick(i)}
            disabled={done && q.solved !== i}
            aria-label={c.label}
          >
            {c.body}
            {q.solved === i && <DoneTick />}
          </button>
        );
      })}
    </div>
  );
}

/** "Következő": on to the next task once this one is solved. */
export function NextButton({ show, onNext, label = 'Következő' }: { show: boolean; onNext: () => void; label?: string }) {
  if (!show) return null;
  return (
    <div className="tower-next">
      <button type="button" className="big-btn big-btn--tower" onClick={onNext}>
        {label} <NextIcon />
      </button>
    </div>
  );
}

import { useRef, useState } from 'react';
import { GuideSays, useLater, useSayOnOpen, type GuideLine } from '../../../components/round';
import { speak } from '../../../lib/speech';
import { buzz, chime, fanfare } from '../../../lib/sound';
import { ROUND_HELP_AFTER } from '../../../state/taskLog';

// What the workshop's machines share: Csavar's line and the corrections he gave, a round of several tasks that
// moves on by itself, Csavar's bubble and the cross on a wrong pick. Each machine brings only its board and its rules.

/**
 * Csavar's line for one round: shown in his bubble, spoken, and every correction ("oops") counted, so the round
 * knows whether it needed help (parents' notes). The first line is said when the screen opens.
 */
export function useCsavar<F extends GuideLine>(first: F) {
  const [line, setLine] = useState<F>(first);
  const later = useLater();
  const oops = useRef(0);
  useSayOnOpen(first.speech);

  const say = (f: F) => {
    if (f.tone === 'oops') oops.current += 1;
    setLine(f);
    speak(f.speech);
  };

  return {
    line,
    /** Shows a line without saying it (Mérleg's win card, after its spoken line). */
    show: setLine,
    say,
    later,
    /** A glow or "Mutasd!" was used: it counts towards the round needing help, like a correction. */
    noteHelp: () => {
      oops.current += 1;
    },
    /** Enough corrections that the round needed help. */
    helped: () => oops.current >= ROUND_HELP_AFTER,
    /** The round is won: the fanfare, a light buzz and Csavar's line. */
    cheer: (f: F) => {
      fanfare();
      buzz(40);
      say(f);
    },
    replay: () => speak(line.speech)
  };
}

interface TaskRoundOptions<F> {
  /** Tasks in the round. */
  count: number;
  /** Csavar's line as the round opens. */
  first: F;
  /** The line for task `i` (from 1), said after the pause; usually only its short text, as the child heard the whole instruction at the start. */
  next: (i: number) => F;
  /** The round's own line on the last right answer, said after that answer's praise. */
  won: () => F;
  /** The pause (ms) between a right answer's praise and the next task. */
  pause: number;
  /** The round is won; `helped` says whether it needed help. */
  onWin: (helped: boolean) => void;
}

/**
 * A round of several tasks (Mintagép, Tükörgép, Kódzár, Hibavadász): a right answer is praised with a chime,
 * and after a pause the next task comes; the last one wins the round with the fanfare.
 */
export function useTaskRound<F extends GuideLine>({ count, first, next, won, pause, onWin }: TaskRoundOptions<F>) {
  const csavar = useCsavar(first);
  const [taskIdx, setTaskIdx] = useState(0);
  const [solved, setSolved] = useState(false);

  /** The task is done; `right` is its praise. */
  const done = (right: F) => {
    if (taskIdx < count - 1) {
      chime();
      csavar.say(right);
      csavar.later(() => {
        setTaskIdx(taskIdx + 1);
        csavar.say(next(taskIdx + 1));
      }, pause);
      return;
    }
    const win = won();
    setSolved(true);
    csavar.cheer({ ...win, speech: `${right.speech} ${win.speech}` });
    onWin(csavar.helped());
  };

  return { ...csavar, taskIdx, solved, done, tasks: { at: taskIdx, of: count, done: solved } };
}

/** Csavar's bubble, in the screen's own place for it. */
export function CsavarSays({ line, className }: { line: GuideLine; className?: string }) {
  return <GuideSays guide="csavar" line={line} className={className} guideWidth={60} />;
}

/** Orange badge on a wrong pick: a cross, the counterpart of the green tick. */
export function MissMark() {
  return (
    <span className="seq-miss" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round">
        <path d="M7 7l10 10M17 7L7 17" />
      </svg>
    </span>
  );
}

/** "Next task's line, short": the line's text is all Csavar says again. */
export function short<F extends GuideLine>(f: F): F {
  return { ...f, speech: f.text };
}

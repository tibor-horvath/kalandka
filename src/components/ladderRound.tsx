import { useRef, useState } from 'react';
import { speak } from '../lib/speech';
import { creditSolve, nextRound, type LadderGame } from '../state/games';
import { EASIER_SPEECH, LADDER_RULES, afterSolve, ladderMeter, ladderOf, withLadder, type LadderStep } from '../state/ladder';
import { useProgress, type Progress } from '../state/progress';
import { logTask } from '../state/taskLog';
import { NextIcon } from './ui';

interface RoundOptions {
  /** False keeps this win off the meter until the screen shows it (Mérleg waits for its last task's line). */
  showStep?: boolean;
  /** A miss before the win already empties the row on the meter (Méhkas). */
  missed?: boolean;
}

interface WinOptions {
  /** What else the win earns, saved together with it: Locsolás's plant, Mézút's faded digit. */
  extra?: (p: Progress) => Progress;
  /** The screen says its own line about stepping down, so the usual one is left out. */
  quiet?: boolean;
}

/**
 * One task of a levelled game. The task keeps the level its ladder had when it started, even after its
 * win steps up or down; the win is counted once (a seed or a bolt, the task log and the new ladder),
 * and "Következő" moves on; a full row plays its level-up in the meter. App keys the screen by round.
 */
export function useLadderRound(game: LadderGame, { showStep = true, missed = false }: RoundOptions = {}) {
  const { progress, update } = useProgress();
  const rule = LADDER_RULES[game];
  const [start] = useState(() => ladderOf(progress, game));
  /** This task's win on the ladder: the meter shows it, and it may step up or down. */
  const [step, setStep] = useState<LadderStep | null>(null);
  const won = useRef<LadderStep | null>(null);

  const win = (helped: boolean, { extra, quiet = false }: WinOptions = {}): LadderStep => {
    if (won.current) return won.current;
    const s = afterSolve(start, rule, helped);
    won.current = s;
    setStep(s);
    if (s.change === 'down' && !quiet) speak(EASIER_SPEECH, { queue: true });
    update((p) => withLadder(logTask(creditSolve(extra ? extra(p) : p, game), game, helped), game, s.ladder));
    return s;
  };

  /** "Következő": the next round (a level-up already played in the meter when the win came). */
  const goNext = () => update((p) => nextRound(p, game));
  const meter = ladderMeter(missed && !step ? { ...start, streak: 0 } : start, rule, showStep ? step : null);

  return { level: start.level, start, step, win, meter, goNext };
}

/** The workshop's win card over the machine and the way on to the next round; the bolt it earned shows in the meter's reward pod. */
export function WinCard({ title = 'Kész!', next = 'Következő kör', className = 'sort-win', onNext }: { title?: string; next?: string; className?: string; onNext: () => void }) {
  return (
    <div className={`path-win ${className}`.trim()} role="status">
      <span className="path-win__rays" aria-hidden="true" />
      <span className="path-win__title">{title}</span>
      <button type="button" className="big-btn big-btn--robot" onClick={onNext}>
        {next} <NextIcon />
      </button>
    </div>
  );
}

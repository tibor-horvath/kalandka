import { useEffect, useRef, useState } from 'react';
import { Seed } from '../art';
import { useLadderRound } from '../../../components/ladderRound';
import { GameShell } from '../../../components/GameShell';
import { FitBox } from '../../../components/FitBox';
import { useForm } from '../../../components/Stage';
import { DotFace, MiniSprout } from '../seeds';
import { DoneTick, GuideBubble, NextIcon } from '../../../components/ui';
import { ASK, FIELD_H, FIELD_W, READY, foldSeeds, buildFlashRound, revealFeedback, rightFeedback } from '../games/flash/logic';
import { speak } from '../../../lib/speech';
import { useProgress } from '../../../state/progress';

type Phase = 'ready' | 'flash' | 'ask' | 'reveal' | 'solved';

/** Villámszem: ready → seeds shown → covered → child answers (peek again any time). */
export function Flash({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  const { level, win, meter, goNext } = useLadderRound('flash');
  const [round] = useState(() => buildFlashRound(progress.flashRound, level));
  // Portrait phones: the two groups stand one above the other, so the seeds can be bigger.
  // One big ten-frame (6–10 on a frame level) stays as it is: folding splits the field down the middle.
  const fold = useForm() === 'portrait' && !(round.cells && round.count <= 10);
  const folded = fold ? foldSeeds(round.seeds) : null;
  const field = folded ?? { width: FIELD_W, height: FIELD_H, seeds: round.seeds };
  const cells = round.cells && (fold ? foldSeeds(round.cells)?.seeds : round.cells);
  // The two ten-frames of 11–20 stand close: their seeds are drawn a little smaller.
  const seedSize = round.cells && round.count > 10 ? 36 : 44;
  const [phase, setPhase] = useState<Phase>('ready');
  const [wrong, setWrong] = useState<number | null>(null);
  /** A wrong pick or "Mutasd újra!" before the answer: the task needed help. */
  const helped = useRef(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    speak(READY.speech);
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const framed = round.cells !== undefined;
  const fb = phase === 'solved' ? rightFeedback(round.count) : phase === 'reveal' ? revealFeedback(round.count, framed) : phase === 'ask' ? ASK : READY;

  const show = () => {
    setPhase('flash');
    timer.current = window.setTimeout(() => {
      setPhase('ask');
      speak(ASK.speech);
    }, round.level.flashMs);
  };

  const answer = (n: number) => {
    if (phase !== 'ask' && phase !== 'reveal') return;
    if (n === round.count) {
      setPhase('solved');
      setWrong(null);
      speak(rightFeedback(n).speech);
      win(helped.current);
    } else {
      helped.current = true;
      setWrong(n);
      setPhase('reveal');
      speak(revealFeedback(round.count, framed).speech);
    }
  };


  const seedsVisible = phase === 'flash' || phase === 'reveal' || phase === 'solved';
  const answering = phase === 'ask' || phase === 'reveal';

  return (
    <GameShell
      game="flash"
      className="screen--flash"
      title="Hány magot láttál?"
      meter={meter}
      justSolved={phase === 'solved'}
      onBack={onBack}
      onReplay={() => speak(fb.speech)}
    >

      <FitBox className="seedbed-box" width={field.width} height={field.height}>
        <div className="seedbed" style={{ width: field.width, height: field.height }}>
          {seedsVisible &&
            cells?.map((c, i) => <span key={`cell${i}`} className={`seedbed__cell${round.count <= 10 ? ' seedbed__cell--big' : ''}`} style={{ left: c.x, top: c.y }} />)}
          {seedsVisible &&
            field.seeds.map((s, i) => (
              <span key={i} className="seedbed__seed" style={{ left: s.x, top: s.y, transform: `translate(-50%, -50%) rotate(${s.rot}deg)` }}>
                {phase === 'solved' ? <MiniSprout /> : <Seed size={seedSize} />}
              </span>
            ))}
          {(phase === 'ready' || phase === 'ask') && (
            <div className="seedbed__cover">
              {phase === 'ready' ? (
                <button type="button" className="big-btn" onClick={show}>
                  Mutasd a magokat!
                </button>
              ) : (
                <button
                  type="button"
                  className="peek-btn"
                  onClick={() => {
                    helped.current = true;
                    show();
                  }}
                >
                  Mutasd újra!
                </button>
              )}
            </div>
          )}
        </div>
      </FitBox>

      <div className="flash-guide">
        <GuideBubble mood={fb.mood} tone={fb.tone}>
          {fb.text}
        </GuideBubble>
      </div>

      <div className="choices">
        {round.choices.map((n) => {
          const state = phase === 'solved' && n === round.count ? ' is-right' : wrong === n && phase === 'reveal' ? ' is-wrong' : '';
          return (
            <button key={n} type="button" className={`choice choice--number${state}`} disabled={!answering && phase !== 'solved'} onClick={() => answer(n)} aria-label={`${n}`}>
              <span className="choice__numeral">{n}</span>
              {round.level.dotChoices && <DotFace n={n} size={56} />}
              {state === ' is-right' && <DoneTick />}
            </button>
          );
        })}
        {phase === 'solved' && (
          <button type="button" className="big-btn" onClick={goNext}>
            Újra! <NextIcon />
          </button>
        )}
      </div>

    </GameShell>
  );
}

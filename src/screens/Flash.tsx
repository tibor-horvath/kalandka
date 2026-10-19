import { useEffect, useRef, useState } from 'react';
import { Seed } from '../components/art';
import { LevelMeter, LevelUpCard, useLevelUp } from '../components/LevelMeter';
import { FitBox } from '../components/FitBox';
import { useForm } from '../components/Stage';
import { DotFace, MiniSprout } from '../components/seeds';
import { BackIcon, DoneTick, GuideBubble, NextIcon, RoundButton, SpeakerIcon } from '../components/ui';
import { ASK, FIELD_H, FIELD_W, READY, foldSeeds, buildFlashRound, revealFeedback, rightFeedback } from '../games/flash/logic';
import { speak } from '../lib/speech';
import { EASIER_SPEECH, LADDER_RULES, afterSolve, ladderMeter, ladderOf, withLadder, type LadderStep } from '../state/ladder';
import { useProgress } from '../state/progress';
import { logTask } from '../state/taskLog';

type Phase = 'ready' | 'flash' | 'ask' | 'reveal' | 'solved';

/** Magvillantás: ready → seeds shown → covered → child answers (peek again any time). */
export function Flash({ onBack }: { onBack: () => void }) {
  const { progress, update } = useProgress();
  // The ladder when this round started: the round keeps its level even after its win steps up or down.
  const [startLadder] = useState(() => ladderOf(progress, 'flash'));
  const [round] = useState(() => buildFlashRound(progress.flashRound, startLadder.level));
  const [step, setStep] = useState<LadderStep | null>(null);
  // Portrait phones: the two groups stand one above the other, so the seeds can be bigger.
  const folded = useForm() === 'portrait' ? foldSeeds(round.seeds) : null;
  const field = folded ?? { width: FIELD_W, height: FIELD_H, seeds: round.seeds };
  const [phase, setPhase] = useState<Phase>('ready');
  const [wrong, setWrong] = useState<number | null>(null);
  const rewarded = useRef(false);
  /** A wrong pick or "Mutasd újra!" before the answer: the task needed help. */
  const helped = useRef(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    speak(READY.speech);
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const fb = phase === 'solved' ? rightFeedback(round.count) : phase === 'reveal' ? revealFeedback(round.count) : phase === 'ask' ? ASK : READY;

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
      if (!rewarded.current) {
        rewarded.current = true;
        const s = afterSolve(startLadder, LADDER_RULES.flash, helped.current);
        setStep(s);
        if (s.change === 'down') speak(EASIER_SPEECH, { queue: true });
        update((p) => withLadder(logTask({ ...p, seeds: p.seeds + 1, flashSolved: p.flashSolved + 1 }, 'flash', s.helped), 'flash', s.ladder));
      }
    } else {
      helped.current = true;
      setWrong(n);
      setPhase('reveal');
      speak(revealFeedback(round.count).speech);
    }
  };

  // App keys this screen by round, so the next round remounts with fresh state.
  const next = () => update((p) => ({ ...p, flashRound: p.flashRound + 1 }));
  const meter = ladderMeter(startLadder, LADDER_RULES.flash, step);
  const levelUp = useLevelUp(meter, next);

  const seedsVisible = phase === 'flash' || phase === 'reveal' || phase === 'solved';
  const answering = phase === 'ask' || phase === 'reveal';

  return (
    <div className="screen screen--flash">
      <div className="meadow" aria-hidden="true" />

      <header className="topbar topbar--meter">
        <RoundButton label="Vissza a kertbe" onClick={onBack}>
          <BackIcon />
        </RoundButton>
        <div className="topbar__title">
          <h1 className="screen-title">Hány magot láttál?</h1>
          <LevelMeter meter={meter} world="garden" justSolved={phase === 'solved'} />
        </div>
        <RoundButton label="Meghallgatom újra" onClick={() => speak(fb.speech)}>
          <SpeakerIcon />
        </RoundButton>
      </header>

      <FitBox className="seedbed-box" width={field.width} height={field.height}>
        <div className="seedbed" style={{ width: field.width, height: field.height }}>
          {seedsVisible &&
            field.seeds.map((s, i) => (
              <span key={i} className="seedbed__seed" style={{ left: s.x, top: s.y, transform: `translate(-50%, -50%) rotate(${s.rot}deg)` }}>
                {phase === 'solved' ? <MiniSprout /> : <Seed size={44} />}
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
          <button type="button" className="big-btn" onClick={levelUp.advance}>
            Újra! <NextIcon />
          </button>
        )}
      </div>

      {levelUp.open && <LevelUpCard meter={meter} world="garden" onNext={levelUp.finish} />}
    </div>
  );
}

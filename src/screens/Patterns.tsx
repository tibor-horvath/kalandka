import { useEffect, useRef, useState } from 'react';
import { PatternFlower } from '../components/art';
import { LevelMeter, LevelUpCard, useLevelUp } from '../components/LevelMeter';
import { BackIcon, DoneTick, GuideBubble, NextIcon, RoundButton, SpeakerIcon } from '../components/ui';
import { CHOICES, FLOWER_LABELS, buildLevelRound, hintFeedback, isEndGap, screenTitle, solvedFeedback, startFeedback, type FlowerKind } from '../games/patterns/logic';
import { speak } from '../lib/speech';
import { EASIER_SPEECH, LADDER_RULES, afterSolve, ladderMeter, ladderOf, withLadder, type LadderStep } from '../state/ladder';
import { useProgress } from '../state/progress';
import { logTask } from '../state/taskLog';

export function Patterns({ onBack }: { onBack: () => void }) {
  const { progress, update } = useProgress();
  // The ladder when this row started: the row keeps its level even after its win steps up or down.
  const [startLadder] = useState(() => ladderOf(progress, 'patterns'));
  const [round] = useState(() => buildLevelRound(startLadder.level, progress.patternRound));
  const [picked, setPicked] = useState<FlowerKind | null>(null);
  const [wrong, setWrong] = useState<FlowerKind | null>(null);
  const [misses, setMisses] = useState(0);
  /** This row's win on the ladder: the meter shows it, and it may step up or down. */
  const [step, setStep] = useState<LadderStep | null>(null);
  const rewarded = useRef(false);

  const solved = picked === round.answer;
  const fb = solved ? solvedFeedback() : wrong ? hintFeedback(round, misses) : startFeedback(round);

  useEffect(() => {
    speak(startFeedback(round).speech);
    // One row per mount: App keys this screen by round.
  }, []);

  const pick = (kind: FlowerKind) => {
    if (solved) return;
    if (kind === round.answer) {
      setPicked(kind);
      setWrong(null);
      speak(solvedFeedback().speech);
      if (!rewarded.current) {
        rewarded.current = true;
        const helped = misses > 0;
        const s = afterSolve(startLadder, LADDER_RULES.patterns, helped);
        setStep(s);
        if (s.change === 'down') speak(EASIER_SPEECH, { queue: true });
        update((p) => withLadder(logTask({ ...p, seeds: p.seeds + 1, patternsSolved: p.patternsSolved + 1 }, 'patterns', helped), 'patterns', s.ladder));
      }
    } else {
      const m = misses + 1;
      setWrong(kind);
      setMisses(m);
      speak(hintFeedback(round, m).speech);
    }
  };

  const next = () => update((p) => ({ ...p, patternRound: p.patternRound + 1 }));
  const meter = ladderMeter(startLadder, LADDER_RULES.patterns, step);
  const levelUp = useLevelUp(meter, next);
  const slots: (FlowerKind | null)[] = round.shown.map((k, i) => (i === round.gap && solved ? round.answer : k));
  const gapLabel = isEndGap(round) ? 'Kérdőjel: ide jön a következő virág' : 'Kérdőjel: ide hiányzik egy virág';

  return (
    <div className="screen screen--patterns">
      <div className="meadow" aria-hidden="true" />

      <header className="topbar topbar--meter">
        <RoundButton label="Vissza a kertbe" onClick={onBack}>
          <BackIcon />
        </RoundButton>
        <div className="topbar__title">
          <h1 className="screen-title">{screenTitle(round)}</h1>
          <LevelMeter meter={meter} world="garden" justSolved={solved && !step?.helped} />
        </div>
        <RoundButton label="Meghallgatom újra" onClick={() => speak(fb.speech)}>
          <SpeakerIcon />
        </RoundButton>
      </header>

      <div className="bed">
        <div className="bed__row">
          {slots.map((kind, i) => (
            <div key={i} className="bed__slot">
              {kind ? (
                <span role="img" aria-label={FLOWER_LABELS[kind]} className={i === round.gap ? 'pop-in' : undefined}>
                  <PatternFlower kind={kind} />
                </span>
              ) : (
                <div className="bed__question" aria-label={gapLabel}>?</div>
              )}
            </div>
          ))}
        </div>
        <div className="bed__soil" aria-hidden="true" />
      </div>

      <div className="patterns-guide">
        <GuideBubble mood={fb.mood} tone={fb.tone}>
          {fb.text}
        </GuideBubble>
      </div>

      <div className="choices">
        {CHOICES.map((kind) => {
          const state = solved && kind === round.answer ? ' is-right' : wrong === kind && !solved ? ' is-wrong' : '';
          return (
            <button key={kind} type="button" className={`choice${state}`} onClick={() => pick(kind)} aria-label={`${FLOWER_LABELS[kind]} – ültesd el a kérdőjel helyére`}>
              <PatternFlower kind={kind} width={90} />
              <span>{FLOWER_LABELS[kind]}</span>
              {state === ' is-right' && <DoneTick />}
            </button>
          );
        })}
        {solved && (
          <button type="button" className="big-btn" onClick={levelUp.advance}>
            Új virágsor <NextIcon />
          </button>
        )}
      </div>

      {levelUp.open && <LevelUpCard meter={meter} world="garden" onNext={levelUp.finish} />}
    </div>
  );
}

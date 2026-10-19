import { useEffect, useRef, useState } from 'react';
import { PatternFlower } from '../components/art';
import { LevelMeter, LevelUpCard, useLevelUp } from '../components/LevelMeter';
import { BackIcon, DoneTick, GuideBubble, NextIcon, RoundButton, SpeakerIcon } from '../components/ui';
import { CHOICES, FLOWER_LABELS, SHAPE_ORDER, buildRound, hintFeedback, isEndGap, screenTitle, solvedFeedback, startFeedback, type FlowerKind } from '../games/patterns/logic';
import { speak } from '../lib/speech';
import { evenLevels, levelMeter } from '../state/levelMeter';
import { useProgress } from '../state/progress';
import { logTask } from '../state/taskLog';

export function Patterns({ onBack }: { onBack: () => void }) {
  const { progress, update } = useProgress();
  const roundNo = progress.patternRound;
  const round = buildRound(roundNo);
  const [picked, setPicked] = useState<FlowerKind | null>(null);
  const [wrong, setWrong] = useState<FlowerKind | null>(null);
  const [misses, setMisses] = useState(0);
  const rewarded = useRef<number | null>(null);

  const solved = picked === round.answer;
  const fb = solved ? solvedFeedback() : wrong ? hintFeedback(round, misses) : startFeedback(round);

  useEffect(() => {
    setPicked(null);
    setWrong(null);
    setMisses(0);
    speak(startFeedback(buildRound(roundNo)).speech);
  }, [roundNo]);

  const pick = (kind: FlowerKind) => {
    if (solved) return;
    if (kind === round.answer) {
      setPicked(kind);
      setWrong(null);
      speak(solvedFeedback().speech);
      if (rewarded.current !== roundNo) {
        rewarded.current = roundNo;
        update((p) => logTask({ ...p, seeds: p.seeds + 1, patternsSolved: p.patternsSolved + 1 }, 'patterns', misses > 0));
      }
    } else {
      const m = misses + 1;
      setWrong(kind);
      setMisses(m);
      speak(hintFeedback(round, m).speech);
    }
  };

  const next = () => update((p) => ({ ...p, patternRound: p.patternRound + 1 }));
  // Two levels: the first lap of shapes asks what comes next, later laps hide a flower inside the row.
  const meter = levelMeter(roundNo, evenLevels(2, SHAPE_ORDER.length), solved);
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
          <LevelMeter meter={meter} world="garden" justSolved={solved} />
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

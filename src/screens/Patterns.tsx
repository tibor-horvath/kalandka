import { useEffect, useState } from 'react';
import { PatternFlower } from '../components/art';
import { useLadderRound } from '../components/ladderRound';
import { GameShell } from '../components/GameShell';
import { DoneTick, GuideBubble, NextIcon } from '../components/ui';
import { CHOICES, FLOWER_LABELS, buildLevelRound, hintFeedback, isEndGap, screenTitle, solvedFeedback, startFeedback, type FlowerKind } from '../games/patterns/logic';
import { speak } from '../lib/speech';
import { useProgress } from '../state/progress';

export function Patterns({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  const { level, step, win, meter, levelUp } = useLadderRound('patterns');
  const [round] = useState(() => buildLevelRound(level, progress.patternRound));
  const [picked, setPicked] = useState<FlowerKind | null>(null);
  const [wrong, setWrong] = useState<FlowerKind | null>(null);
  const [misses, setMisses] = useState(0);

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
      win(misses > 0);
    } else {
      const m = misses + 1;
      setWrong(kind);
      setMisses(m);
      speak(hintFeedback(round, m).speech);
    }
  };

  const slots: (FlowerKind | null)[] = round.shown.map((k, i) => (i === round.gap && solved ? round.answer : k));
  const gapLabel = isEndGap(round) ? 'Kérdőjel: ide jön a következő virág' : 'Kérdőjel: ide hiányzik egy virág';

  return (
    <GameShell
      game="patterns"
      className="screen--patterns"
      title={screenTitle(round)}
      meter={meter}
      justSolved={solved && !step?.helped}
      levelUp={levelUp}
      onBack={onBack}
      onReplay={() => speak(fb.speech)}
    >

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

    </GameShell>
  );
}

import { useEffect, useState } from 'react';
import { PatternBunch, PatternFlower } from '../art';
import { useLadderRound } from '../../../components/ladderRound';
import { GameShell } from '../../../components/GameShell';
import { DoneTick, GuideBubble, NextIcon } from '../../../components/ui';
import {
  CHOICES,
  FLOWER_LABELS,
  PATTERN_LEVELS,
  buildGrowRound,
  buildLevelRound,
  growHintFeedback,
  growSolvedFeedback,
  growStartFeedback,
  hintFeedback,
  isEndGap,
  screenTitle,
  solvedFeedback,
  startFeedback,
  type FlowerKind
} from '../games/patterns/logic';
import { speak } from '../../../lib/speech';
import { useProgress } from '../../../state/progress';

type Ladder = ReturnType<typeof useLadderRound>;

export function Patterns({ onBack }: { onBack: () => void }) {
  const ladder = useLadderRound('patterns');
  // Picked once per task: a win that steps up onto the bunch levels must not swap the row being looked at.
  const [grow] = useState(() => PATTERN_LEVELS[ladder.level].grow !== undefined);
  return grow ? <GrowRows ladder={ladder} onBack={onBack} /> : <FlowerRows ladder={ladder} onBack={onBack} />;
}

function FlowerRows({ ladder, onBack }: { ladder: Ladder; onBack: () => void }) {
  const { progress } = useProgress();
  const { level, step, win, meter, goNext } = ladder;
  const [round] = useState(() => buildLevelRound(level, progress.patternRound));
  const [picked, setPicked] = useState<FlowerKind | null>(null);
  const [wrong, setWrong] = useState<FlowerKind | null>(null);
  const [misses, setMisses] = useState(0);

  const solved = picked === round.answer;
  const fb = solved ? solvedFeedback() : wrong ? hintFeedback(round, misses) : startFeedback(round);

  useEffect(() => {
    speak(startFeedback(round).speech);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- One row per mount: App keys this screen by round.
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
          <button type="button" className="big-btn" onClick={goNext}>
            Új virágsor <NextIcon />
          </button>
        )}
      </div>

    </GameShell>
  );
}

/** Eggyel / kettővel több virág: bunches that grow by a rule; the child picks the size of the next one. */
function GrowRows({ ladder, onBack }: { ladder: Ladder; onBack: () => void }) {
  const { progress } = useProgress();
  const { level, step, win, meter, goNext } = ladder;
  const [round] = useState(() => buildGrowRound(level, progress.patternRound));
  const [picked, setPicked] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);

  const solved = picked === round.answer;
  const fb = solved ? growSolvedFeedback(round) : wrong !== null ? growHintFeedback(round, misses) : growStartFeedback(round);

  useEffect(() => {
    speak(growStartFeedback(round).speech);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- One row per mount: App keys this screen by round.
  }, []);

  const pick = (n: number) => {
    if (solved) return;
    if (n === round.answer) {
      setPicked(n);
      setWrong(null);
      speak(growSolvedFeedback(round).speech);
      win(misses > 0);
    } else {
      const m = misses + 1;
      setWrong(n);
      setMisses(m);
      speak(growHintFeedback(round, m).speech);
    }
  };

  const slots: (number | null)[] = [...round.counts, solved ? round.answer : null];

  return (
    <GameShell
      game="patterns"
      className="screen--patterns"
      title="Hány virág jön ezután?"
      meter={meter}
      justSolved={solved && !step?.helped}
      onBack={onBack}
      onReplay={() => speak(fb.speech)}
    >

      <div className="bed bed--bunches">
        <div className="bed__row" style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))` }}>
          {slots.map((n, i) => (
            <div key={i} className="bed__slot">
              {n !== null ? (
                <span role="img" aria-label={`${n} virág`} className={`bed__bunch${i === round.counts.length ? ' pop-in' : ''}`}>
                  <PatternBunch kind={round.flower} n={n} />
                  <span className="bed__count">{n}</span>
                </span>
              ) : (
                <div className="bed__question" aria-label="Kérdőjel: ide jön a következő csokor">?</div>
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
        {round.choices.map((n) => {
          const state = solved && n === round.answer ? ' is-right' : wrong === n && !solved ? ' is-wrong' : '';
          return (
            <button key={n} type="button" className={`choice choice--bunch${state}`} onClick={() => pick(n)} aria-label={`${n} virág – ültesd el a kérdőjel helyére`}>
              <PatternBunch kind={round.flower} n={n} width={48} />
              <span className="choice__numeral">{n}</span>
              {state === ' is-right' && <DoneTick />}
            </button>
          );
        })}
        {solved && (
          <button type="button" className="big-btn" onClick={goNext}>
            Új virágsor <NextIcon />
          </button>
        )}
      </div>

    </GameShell>
  );
}

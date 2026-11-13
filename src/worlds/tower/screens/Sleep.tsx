import { useState } from 'react';
import { GameShell } from '../../../components/GameShell';
import { useLadderRound } from '../../../components/ladderRound';
import { handAngles, timeWords } from '../../../lib/time';
import { useProgress } from '../../../state/progress';
import { ClockFace, DayPartSign, Kakuk } from '../art';
import { buildSleepRound, cardText, sleepSolved, sleepStart, sleepWrong } from '../games/sleep';
import { Cards, KakukSays, NextButton, useQuestion } from './kit';

/** Kakuk alszik: two clocks, lying down and waking up; how long did Kakuk sleep? */
export function Sleep({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  const { level, step, win, meter, goNext } = useLadderRound('sleep');
  const [round] = useState(() => buildSleepRound(level, progress.sleepRound));
  const q = useQuestion(sleepStart(round));
  const solved = q.solved !== null;
  const from = handAngles(round.from);
  const to = handAngles(round.to);
  // After a miss the first clock shows the short hand's way to where the second one stands.
  const way: [number, number] | null = q.misses > 0 && !solved ? [from.hour, to.hour <= from.hour ? to.hour + 360 : to.hour] : null;

  const pick = (i: number) => {
    if (i === round.answer) {
      q.hit(i, sleepSolved(round));
      win(q.helped());
    } else q.miss(i, (m) => sleepWrong(round, i, m));
  };

  return (
    <GameShell game="sleep" className="screen--tower screen--sleep" title="Kakuk alszik" meter={meter} justSolved={solved && !step?.helped} onBack={onBack} onReplay={() => q.tell(q.line)}>
      <KakukSays line={q.line} />
      <div className="sleep-play">
        <figure className="sleep-clock sleep-clock--night">
          <ClockFace size={220} hour={from.hour} minute={from.minute} wedge={way} label={`Lefeküdt: ${timeWords(round.from)}`} />
          <figcaption>
            <DayPartSign part="este" size={34} />
            lefeküdt
          </figcaption>
        </figure>
        <div className="sleep-mid" aria-hidden="true">
          <Kakuk mood={solved ? 'cheer' : 'sleep'} width={70} />
        </div>
        <figure className="sleep-clock sleep-clock--day">
          <ClockFace size={220} hour={to.hour} minute={to.minute} label={`Felébredt: ${timeWords(round.to)}`} />
          <figcaption>
            <DayPartSign part="délben" size={34} />
            felébredt
          </figcaption>
        </figure>
      </div>
      <Cards
        q={q}
        right={round.answer}
        onPick={pick}
        className="tower-choices--short"
        cards={round.choices.map((m) => ({ key: String(m), label: cardText(m), body: <span className="tower-card__word tower-card__word--big">{cardText(m)}</span> }))}
      />
      <NextButton show={solved} onNext={goNext} />
    </GameShell>
  );
}

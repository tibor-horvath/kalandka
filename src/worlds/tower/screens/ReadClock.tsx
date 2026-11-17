import { useState } from 'react';
import { GameShell } from '../../../components/GameShell';
import { useLadderRound } from '../../../components/ladderRound';
import { handAngles, nextHour, timeWords } from '../../../lib/time';
import { useProgress } from '../../../state/progress';
import { ClockFace, DayPartSign, DigitalDisplay } from '../art';
import { buildDigiRound, buildReadRound, digiSolved, digiStart, digiWrong, readSolved, readStart, readWrong } from '../games/clock';
import { useLevelIntro } from './Intro';
import { Cards, KakukkSays, NextButton, useQuestion } from './kit';

/** After a miss on a half or quarter hour, the dial tints the hour hand's way between its two numbers. */
function wayOf(h: number, m: number): [number, number] | null {
  return m === 0 ? null : [(h % 12) * 30, (nextHour(h) % 12) * 30 || 360];
}

/**
 * Hány óra?: Kakukk says a time, and the child finds the clock that shows it among three dials, so reading the
 * clock never needs reading a word. After a miss on a half or quarter hour every dial tints the way between the
 * two numbers the hour hand should stand between.
 */
export function ReadClock({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  const { level, step, win, meter, goNext } = useLadderRound('read');
  const intro = useLevelIntro('read', level);
  const [round] = useState(() => buildReadRound(level, progress.games.read.round));
  const q = useQuestion(readStart(round), intro.open);
  const solved = q.solved !== null;
  const hourOnly = round.level.step === 'hourOnly';
  const way = q.misses > 0 && !solved ? wayOf(round.time.h, round.time.m) : null;

  const pick = (i: number) => {
    if (i === round.answer) {
      q.hit(i, readSolved(round));
      win(q.helped());
    } else q.miss(i, (m) => readWrong(round, i, m));
  };

  return (
    <GameShell game="read" className="screen--tower screen--read" title="Hány óra?" meter={meter} justSolved={solved && !step?.helped} onBack={onBack} onReplay={() => q.tell(q.line)} help={intro.help}>
      <KakukkSays line={q.line} />
      <Cards
        q={q}
        right={round.answer}
        onPick={pick}
        className="tower-choices--dials"
        cards={round.times.map((t, i) => {
          const a = handAngles(t);
          return {
            key: round.choices[i],
            label: `${i + 1}. óra: ${round.choices[i]}`,
            body: <ClockFace size={230} hour={a.hour} minute={hourOnly ? null : a.minute} wedge={way} label="" aria-hidden="true" className="tower-clock" />
          };
        })}
      />
      <NextButton show={solved} onNext={goNext} />
      {intro.render(() => q.tell(q.line))}
    </GameShell>
  );
}

/** Digitóra: find the digital display that shows the same time as the dial. */
export function Digital({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  const { level, step, win, meter, goNext } = useLadderRound('digi');
  const intro = useLevelIntro('digi', level);
  const [round] = useState(() => buildDigiRound(level, progress.games.digi.round));
  const q = useQuestion(digiStart(round), intro.open);
  const solved = q.solved !== null;
  const angles = handAngles(round.time);
  const pm = round.level.step === 'afternoon';

  const pick = (i: number) => {
    if (i === round.answer) {
      q.hit(i, digiSolved(round));
      win(q.helped());
    } else q.miss(i, (m) => digiWrong(round, i, m));
  };

  return (
    <GameShell game="digi" className="screen--tower screen--digi" title="Digitóra" meter={meter} justSolved={solved && !step?.helped} onBack={onBack} onReplay={() => q.tell(q.line)} help={intro.help}>
      <KakukkSays line={q.line} />
      <div className="clock-play">
        <div className="digi-dial">
          <ClockFace size={280} hour={angles.hour} minute={angles.minute} label={`Óra: ${pm ? 'délután ' : ''}${timeWords(round.time)}`} className="tower-clock" />
          {/* No words to read under the dial: Kakukk says the time. Afternoon shows as the day-part picture the clock can't show. */}
          {pm && (
            <span className="digi-dial__part" aria-hidden="true">
              <DayPartSign part="délután" size={44} />
            </span>
          )}
        </div>
        <Cards
          q={q}
          right={round.answer}
          onPick={pick}
          className="tower-choices--column"
          cards={round.choices.map((d) => ({ key: d, label: d, body: <DigitalDisplay text={d} /> }))}
        />
      </div>
      <NextButton show={solved} onNext={goNext} />
      {intro.render(() => q.tell(q.line))}
    </GameShell>
  );
}

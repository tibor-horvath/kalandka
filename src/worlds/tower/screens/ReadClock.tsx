import { useState } from 'react';
import { GameShell } from '../../../components/GameShell';
import { useLadderRound } from '../../../components/ladderRound';
import { handAngles, nextHour, timeWords } from '../../../lib/time';
import { useProgress } from '../../../state/progress';
import { ClockFace, DigitalDisplay } from '../art';
import { buildDigiRound, buildReadRound, digiSolved, digiStart, digiWrong, readSolved, readStart, readWrong } from '../games/clock';
import { capital } from '../games/activities';
import { useLevelIntro } from './Intro';
import { Cards, KakukkSays, NextButton, useQuestion } from './kit';

/** After a miss on a half or quarter hour, the dial tints the hour hand's way between its two numbers. */
function wayOf(h: number, m: number): [number, number] | null {
  return m === 0 ? null : [(h % 12) * 30, (nextHour(h) % 12) * 30 || 360];
}

/** Hány óra?: read the dial and pick the time in words. */
export function ReadClock({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  const { level, step, win, meter, goNext } = useLadderRound('read');
  const intro = useLevelIntro('read', level);
  const [round] = useState(() => buildReadRound(level, progress.readRound));
  const q = useQuestion(readStart(round), intro.open);
  const solved = q.solved !== null;
  const angles = handAngles(round.time);
  const hourOnly = round.level.step === 'hourOnly';

  const pick = (i: number) => {
    if (i === round.answer) {
      q.hit(i, readSolved(round));
      win(q.helped());
    } else q.miss(i, (m) => readWrong(round, i, m));
  };

  return (
    <GameShell game="read" className="screen--tower screen--read" title="Hány óra?" meter={meter} justSolved={solved && !step?.helped} onBack={onBack} onReplay={() => q.tell(q.line)} help={intro.help}>
      <KakukkSays line={q.line} />
      <div className="clock-play">
        <ClockFace
          size={300}
          hour={angles.hour}
          minute={hourOnly ? null : angles.minute}
          wedge={q.misses > 0 && !solved ? wayOf(round.time.h, round.time.m) : null}
          label={solved ? `Óra: ${timeWords(round.time)}` : 'Óra. Hány óra van?'}
          className="tower-clock"
        />
        <Cards
          q={q}
          right={round.answer}
          onPick={pick}
          className="tower-choices--column"
          cards={round.choices.map((w) => ({ key: w, label: w, body: <span className="tower-card__word tower-card__word--big">{capital(w)}</span> }))}
        />
      </div>
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
  const [round] = useState(() => buildDigiRound(level, progress.digiRound));
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
          <span className="digi-dial__words">
            {pm ? 'délután ' : ''}
            {timeWords(round.time)}
          </span>
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

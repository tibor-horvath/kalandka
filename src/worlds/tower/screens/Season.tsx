import { useState } from 'react';
import { GameShell } from '../../../components/GameShell';
import { useLadderRound } from '../../../components/ladderRound';
import { useProgress } from '../../../state/progress';
import { SeasonSign, SeasonTree } from '../art';
import { capital } from '../games/activities';
import { MONTHS, SEASON_NAMES, WEEK, answerOf, buildSeasonRound, seasonSolved, seasonStart, seasonWrong, type Season, type SeasonRound } from '../games/season';
import { Cards, KakukSays, NextButton, useQuestion, type Card } from './kit';

const seasonCard = (s: Season, tree = false): Card => ({
  key: s,
  label: capital(SEASON_NAMES[s]),
  body: tree ? (
    <SeasonTree season={s} size={130} />
  ) : (
    <>
      <SeasonSign season={s} size={70} />
      <span className="tower-card__word">{capital(SEASON_NAMES[s])}</span>
    </>
  )
});

const dayCard = (d: number): Card => ({ key: WEEK[d], label: capital(WEEK[d]), body: <span className="tower-card__word tower-card__word--big">{capital(WEEK[d])}</span> });

/** The scene above the cards: the tree, the season circle, the week, today, or the month. */
function Scene({ r, solved }: { r: SeasonRound; solved: boolean }) {
  switch (r.mode) {
    case 'which':
      return (
        <div className="season-scene">
          <SeasonTree season={r.season} size={240} label="Egy fa, ebben az évszakban" />
        </div>
      );
    case 'cycle':
      return (
        <ol className="season-row" aria-label="Az évszakok sorban">
          {r.row.map((s, i) => (
            <li key={s} className={`season-slot${i === r.gap && !solved ? ' is-gap' : ''}`}>
              {i === r.gap && !solved ? <span className="day-slot__q">?</span> : <SeasonTree season={s} size={120} label={SEASON_NAMES[s]} />}
              <span className="season-slot__name">{i === r.gap && !solved ? '' : SEASON_NAMES[s]}</span>
            </li>
          ))}
        </ol>
      );
    case 'week':
      return (
        <ol className="week-row" aria-label="A hét napjai">
          {WEEK.map((d, i) => (
            <li key={d} className={`week-day week-day--${i}${i === r.gap && !solved ? ' is-gap' : ''}`}>
              {i === r.gap && !solved ? '?' : d}
            </li>
          ))}
        </ol>
      );
    case 'near':
    case 'far':
      return (
        <ol className="week-row" aria-label="A hét napjai">
          {WEEK.map((d, i) => (
            <li key={d} className={`week-day week-day--${i}${i === r.today ? ' is-today' : ''}${solved && i === r.answer ? ' is-answer' : ''}`}>
              {i === r.today && <span className="week-day__today">ma</span>}
              {d}
            </li>
          ))}
        </ol>
      );
    case 'month':
      return (
        <div className="season-scene">
          <span className="month-card">{capital(MONTHS[r.month])}</span>
        </div>
      );
  }
}

/** Évszakok: the seasons, the week and the months. */
export function SeasonGame({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  const { level, step, win, meter, goNext } = useLadderRound('season');
  const [round] = useState(() => buildSeasonRound(level, progress.seasonRound));
  const q = useQuestion(seasonStart(round));
  const right = answerOf(round);
  const solved = q.solved !== null;

  const pick = (i: number) => {
    if (i === right) {
      q.hit(i, seasonSolved(round));
      win(q.helped());
    } else q.miss(i, (m) => seasonWrong(round, i, m));
  };

  const cards: Card[] =
    round.mode === 'which' || round.mode === 'month'
      ? round.choices.map((s) => seasonCard(s))
      : round.mode === 'cycle'
        ? round.choices.map((s) => seasonCard(s, true))
        : round.choices.map(dayCard);

  return (
    <GameShell game="season" className="screen--tower screen--season" title="Évszakok" meter={meter} justSolved={solved && !step?.helped} onBack={onBack} onReplay={() => q.tell(q.line)}>
      <KakukSays line={q.line} />
      <Scene r={round} solved={solved} />
      <Cards q={q} right={right} onPick={pick} cards={cards} className={round.mode === 'which' || round.mode === 'month' ? 'tower-choices--parts' : ''} />
      <NextButton show={solved} onNext={goNext} />
    </GameShell>
  );
}

import { useState } from 'react';
import { GameShell } from '../../../components/GameShell';
import { useLadderRound } from '../../../components/ladderRound';
import { useProgress } from '../../../state/progress';
import { DaySign, SeasonSign, SeasonTree } from '../art';
import { capital } from '../games/activities';
import { MONTHS, SEASON_NAMES, WEEK, answerOf, buildSeasonRound, seasonSolved, seasonStart, seasonWrong, type Season, type SeasonRound } from '../games/season';
import { useLevelIntro } from './Intro';
import { Cards, KakukkSays, NextButton, useQuestion, type Card } from './kit';

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

/** A day: its sign first (shape and colour, found without reading), its name small under it. */
const dayCard = (d: number, today = false): Card => ({
  key: WEEK[d],
  label: today ? `${capital(WEEK[d])}, ma` : capital(WEEK[d]),
  body: (
    <>
      {today && <span className="week-day__today">ma</span>}
      <DaySign day={d} size={64} />
      <span className="tower-card__word tower-card__word--small">{capital(WEEK[d])}</span>
    </>
  )
});

/** Yesterday and tomorrow are places in the week: the whole week is the row of cards, today marked "ma". */
const weekPlay = (r: SeasonRound): SeasonRound => (r.mode === 'near' || r.mode === 'far' ? { ...r, choices: WEEK.map((_, i) => i) } : r);

/** The scene above the cards: the tree, the season circle, the week with a gap, or the month in its year. */
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
          {WEEK.map((d, i) => {
            const gap = i === r.gap && !solved;
            return (
              <li key={d} className={`week-day week-day--sign${gap ? ' is-gap' : ''}`} aria-label={gap ? 'Ez a nap hiányzik' : d}>
                {gap ? '?' : <DaySign day={i} size={44} />}
                <span className="week-day__name">{gap ? '' : d}</span>
              </li>
            );
          })}
        </ol>
      );
    case 'near':
    case 'far':
      return null;
    case 'month':
      // The month's place in the year: twelve tiles in order, the asked one lit. Kakukk says its name.
      return (
        <ol className="year-row" aria-label={`Az év hónapjai, ${MONTHS[r.month]} kiemelve`}>
          {MONTHS.map((m, i) => (
            <li key={m} className={`year-month${i === r.month ? ' is-asked' : ''}`} aria-hidden="true">
              {i + 1}
            </li>
          ))}
        </ol>
      );
  }
}

/** Évszakok: the seasons, the week and the months. */
export function SeasonGame({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  const { level, step, win, meter, goNext } = useLadderRound('season');
  const intro = useLevelIntro('season', level);
  const [round] = useState(() => weekPlay(buildSeasonRound(level, progress.games.season.round)));
  const q = useQuestion(seasonStart(round), intro.open);
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
        : round.mode === 'near' || round.mode === 'far'
          ? round.choices.map((d) => dayCard(d, d === round.today))
          : round.choices.map((d) => dayCard(d));
  const look = round.mode === 'which' || round.mode === 'month' ? 'tower-choices--parts' : round.mode === 'near' || round.mode === 'far' ? 'tower-choices--week' : 'tower-choices--days';

  return (
    <GameShell game="season" className="screen--tower screen--season" title="Évszakok" meter={meter} justSolved={solved && !step?.helped} onBack={onBack} onReplay={() => q.tell(q.line)} help={intro.help}>
      <KakukkSays line={q.line} />
      <Scene r={round} solved={solved} />
      <Cards q={q} right={right} onPick={pick} cards={cards} className={look} />
      <NextButton show={solved} onNext={goNext} />
      {intro.render(() => q.tell(q.line))}
    </GameShell>
  );
}

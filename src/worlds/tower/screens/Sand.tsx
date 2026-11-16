import { useState } from 'react';
import { GameShell } from '../../../components/GameShell';
import { useLadderRound } from '../../../components/ladderRound';
import { useProgress } from '../../../state/progress';
import { ActivityPic, SandArt } from '../art';
import { ACTIVITIES, SPANS, capital } from '../games/activities';
import { SPAN_WORDS, buildSandRound, sandSolved, sandStart, sandWrong } from '../games/sand';
import { useLevelIntro } from './Intro';
import { Cards, KakukkSays, NextButton, useQuestion } from './kit';

/** Homokóra: which takes longer, which is shorter, a moment, minutes or hours. */
export function Sand({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  const { level, step, win, meter, goNext } = useLadderRound('sand');
  const intro = useLevelIntro('sand', level);
  const [round] = useState(() => buildSandRound(level, progress.games.sand.round));
  const q = useQuestion(sandStart(round), intro.open);
  const solved = q.solved !== null;
  const right = round.mode === 'span' ? SPANS.indexOf(round.answer) : round.answer;

  const pick = (i: number) => {
    if (i === right) {
      q.hit(i, sandSolved(round));
      win(q.helped());
    } else q.miss(i, (m) => sandWrong(round, m));
  };

  return (
    <GameShell game="sand" className="screen--tower screen--sand" title="Homokóra" meter={meter} justSolved={solved && !step?.helped} onBack={onBack} onReplay={() => q.tell(q.line)} help={intro.help}>
      <KakukkSays line={q.line} />
      {round.mode === 'span' ? (
        <>
          <div className="day-single">
            <span className="day-card day-card--big">
              <ActivityPic id={round.activity} size={200} label={ACTIVITIES[round.activity].name} />
              <span className="day-card__name">{ACTIVITIES[round.activity].name}</span>
            </span>
          </div>
          <Cards
            q={q}
            right={right}
            onPick={pick}
            className="tower-choices--short"
            cards={SPANS.map((s) => ({ key: s, label: SPAN_WORDS[s], body: <span className="tower-card__word tower-card__word--big">{capital(SPAN_WORDS[s])}</span> }))}
          />
        </>
      ) : (
        <div className="sand-pair">
          <Cards
            q={q}
            right={right}
            onPick={pick}
            className={'trio' in round ? 'tower-choices--trio' : 'tower-choices--pair'}
            cards={('trio' in round ? round.trio : round.pair).map((id) => ({
              key: id,
              label: ACTIVITIES[id].name,
              body: (
                <>
                  <ActivityPic id={id} size={170} />
                  <span className="tower-card__word">{ACTIVITIES[id].name}</span>
                </>
              )
            }))}
          />
          {!('trio' in round) && (
            <span className="sand-glass" aria-hidden="true">
              <SandArt />
            </span>
          )}
        </div>
      )}
      <NextButton show={solved} onNext={goNext} />
      {intro.render(() => q.tell(q.line))}
    </GameShell>
  );
}

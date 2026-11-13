import { useState } from 'react';
import { GameShell } from '../../../components/GameShell';
import { useLadderRound } from '../../../components/ladderRound';
import { useProgress } from '../../../state/progress';
import { ActivityPic, DayPartSign } from '../art';
import { ACTIVITIES, DAY_PARTS, capital, type ActivityId } from '../games/activities';
import { buildDayRound, dayPlaced, daySolved, dayStart, dayWrongBefore, dayWrongPart, dayWrongSeq, type SeqRound } from '../games/day';
import { Cards, KakukSays, NextButton, useQuestion } from './kit';

const PART_LABEL: Record<string, string> = { reggel: 'Reggel', délben: 'Délben', délután: 'Délután', este: 'Este' };

/** Napirend: the order of a day, for the youngest. */
export function Day({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  const { level, step, win, meter, goNext } = useLadderRound('day');
  const [round] = useState(() => buildDayRound(level, progress.dayRound));
  const q = useQuestion(dayStart(round));
  /** Cards placed in the row so far (beyond the ones given). */
  const [placed, setPlaced] = useState(0);
  const solved = q.solved !== null;

  const finish = (i: number) => {
    q.hit(i, daySolved(round));
    win(q.helped());
  };

  let scene = null;
  let cards = null;
  if (round.mode === 'seq') {
    const r: SeqRound = round;
    const filled = r.given + placed;
    const left = r.choices.filter((id) => !r.sequence.slice(r.given, filled).includes(id));
    const want = r.sequence[filled];
    const pick = (i: number) => {
      const id = left[i];
      if (id !== want) {
        q.miss(i, (m) => dayWrongSeq(r, filled, id, m));
        return;
      }
      const next = placed + 1;
      setPlaced(next);
      q.next();
      if (r.given + next === r.sequence.length) finish(i);
      else q.hit(i, dayPlaced(r, r.given + next, next), false);
    };
    scene = (
      <ol className="day-row" aria-label="A nap sorban">
        {r.sequence.map((id, i) => {
          const shown = i < filled || solved;
          return (
            <li key={id} className={`day-slot day-slot--${i < 1 ? 'morning' : i < r.sequence.length - 1 ? 'noon' : 'evening'}${shown ? ' is-full' : ''}${i === filled && !solved ? ' is-next' : ''}`}>
              {shown ? (
                <span className={`day-card${i >= r.given ? ' pop-in' : ''}`}>
                  <ActivityPic id={id} size={120} label={ACTIVITIES[id].name} />
                  <span className="day-card__name">{ACTIVITIES[id].name}</span>
                </span>
              ) : (
                <span className="day-slot__q" aria-label="Üres hely">
                  ?
                </span>
              )}
            </li>
          );
        })}
      </ol>
    );
    cards = !solved && (
      <Cards
        key={placed}
        q={q}
        right={left.indexOf(want)}
        onPick={pick}
        cards={left.map((id) => ({ key: id, label: `${ACTIVITIES[id].name} kártya`, body: <ActivityCard id={id} /> }))}
      />
    );
  } else if (round.mode === 'part') {
    const right = DAY_PARTS.indexOf(round.answer);
    scene = (
      <div className="day-single">
        <span className="day-card day-card--big">
          <ActivityPic id={round.activity} size={200} label={ACTIVITIES[round.activity].name} />
          <span className="day-card__name">{ACTIVITIES[round.activity].name}</span>
        </span>
      </div>
    );
    cards = (
      <Cards
        q={q}
        right={right}
        className="tower-choices--parts"
        onPick={(i) => (i === right ? finish(i) : q.miss(i, (m) => dayWrongPart(round, DAY_PARTS[i], m)))}
        cards={DAY_PARTS.map((p) => ({
          key: p,
          label: PART_LABEL[p],
          body: (
            <>
              <DayPartSign part={p} size={70} />
              <span className="tower-card__word">{PART_LABEL[p]}</span>
            </>
          )
        }))}
      />
    );
  } else {
    const right = round.pair.indexOf(round.answer);
    cards = (
      <Cards
        q={q}
        right={right}
        className="tower-choices--pair"
        onPick={(i) => (i === right ? finish(i) : q.miss(i, (m) => dayWrongBefore(round, m)))}
        cards={round.pair.map((id) => ({ key: id, label: capital(ACTIVITIES[id].name), body: <ActivityCard id={id} big /> }))}
      />
    );
  }

  return (
    <GameShell game="day" className="screen--tower screen--day" title="Napirend" meter={meter} justSolved={solved && !step?.helped} onBack={onBack} onReplay={() => q.tell(q.line)}>
      <KakukSays line={q.line} />
      {scene}
      {cards}
      <NextButton show={solved} onNext={goNext} />
    </GameShell>
  );
}

function ActivityCard({ id, big = false }: { id: ActivityId; big?: boolean }) {
  return (
    <>
      <ActivityPic id={id} size={big ? 170 : 120} />
      <span className="tower-card__word">{ACTIVITIES[id].name}</span>
    </>
  );
}

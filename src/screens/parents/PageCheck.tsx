import { useState } from 'react';
import { AnswerList, OtherAnswers, type PrintSpec } from '../../print/sheet';
import { useProgress } from '../../state/progress';
import { podFill } from '../../state/pod';
import { earnedStickers, markPageDone, pageLevelStep, pageReward, pageTally, topFirst, type PageTally } from '../../state/stickers';
import { balanceIn } from '../../state/balance';
import type { WorldId } from '../../state/worlds';
import { PageReceipt, type PageWin } from './PageReceipt';

const CHECK = (
  <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

/** A page being checked: each answer right, wrong or not yet (null), and "Lap kész" once all are marked. */
export function usePageCheck({ pageKey: key, tasks, world, onMarked }: { pageKey: string; tasks: unknown[]; world: WorldId; onMarked?: () => void }) {
  const { progress, update } = useProgress();
  const [judged, setJudged] = useState<(boolean | null)[]>(() => tasks.map(() => null));
  // What this mark did, played back after "Lap kész".
  const [won, setWon] = useState<PageWin | null>(null);
  const done = progress.pagesDone.includes(key);
  const left = judged.filter((j) => j === null).length;

  const mark = () => {
    const right = judged.map((j) => j === true);
    const had = new Set(earnedStickers(progress).map((s) => s.id));
    const after = markPageDone(progress, key, right);
    const stickers = topFirst(earnedStickers(after).filter((s) => !had.has(s.id)));
    setWon({ tasks: tasks.length, fill: podFill(progress, world), total: balanceIn(progress, world), pay: pageReward(progress, key, tasks.length), stickers, tally: pageTally(progress, key, right), level: pageLevelStep(progress, key, right) });
    update((p) => markPageDone(p, key, right));
    onMarked?.();
  };

  return {
    judged,
    judge: (i: number, right: boolean) => setJudged((js) => js.map((j, k) => (k === i ? right : j))),
    rest: () => setJudged((js) => js.map((j) => j ?? true)),
    left,
    rightCount: judged.filter((j) => j === true).length,
    tally: pageTally(progress, key, judged),
    done,
    won,
    mark
  };
}

/**
 * Checking a finished page in Nyomtatás, below its page buttons (the scanner has a page of its own, see ScanSheet):
 * the grown-up marks each answer right or wrong against the paper, then "Lap kész" counts it for the child. Its level's
 * sticker wants enough right answers on that level, as in the game (see `pageTally`); the meter above the answers
 * fills up with them, the earlier pages' included.
 */
export function PageCheck({
  spec,
  pageKey: key,
  level,
  tasks,
  world,
  worldName,
  name
}: {
  spec: PrintSpec<unknown>;
  pageKey: string;
  /** The sheet level the page was printed on (0-based). */
  level: number;
  tasks: unknown[];
  world: WorldId;
  worldName: string;
  name: string;
}) {
  const { judged, judge, rest, left, tally, done, won, mark } = usePageCheck({ pageKey: key, tasks, world });
  const [answers, setAnswers] = useState(false);
  const judging = !done && !won;

  const button = (
    <button
      type="button"
      className={`pa-btn sc__mark${done ? ' pa-btn--go' : ''}${won ? ' ps-done__btn' : ''}`}
      disabled={done || left > 0}
      onClick={mark}
    >
      {done && CHECK}
      {done ? `Kész lap: ${name}` : left > 0 ? `Még ${left} feladat ellenőrzése` : `Lap kész: ${name}`}
    </button>
  );

  if (!judging) {
    return (
      <>
        {button}
        {won ? (
          <PageReceipt win={won} world={world} worldName={worldName} name={name} />
        ) : (
          <p className="pa-muted">Ezt a lapot {name} már korábban megkapta, újra nem számít.</p>
        )}
        <button type="button" className="sc__answers" aria-expanded={answers} onClick={() => setAnswers((a) => !a)}>
          {answers ? 'Megoldások elrejtése' : 'Megoldások megnézése'}
        </button>
        {answers && (
          <div className="sc__list">
            <OtherAnswers spec={spec} level={level} />
            <AnswerList spec={spec} tasks={tasks} />
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {tally.need !== null && <LevelTally tally={tally} />}
      <div className="pc-tools">
        <span aria-live="polite">
          {tasks.length - left} / {tasks.length} ellenőrizve
        </span>
        {left > 0 && (
          <button type="button" className="pa-btn pc-tools__all" onClick={rest}>
            {left === tasks.length ? 'Mind jó' : 'A többi mind jó'}
          </button>
        )}
      </div>
      <div className="sc__list">
        <OtherAnswers spec={spec} level={level} />
        <AnswerList spec={spec} tasks={tasks} judged={judged} onJudge={judge} />
      </div>
      <div className="pc-foot">{button}</div>
    </>
  );
}

/** The right answers the level's sticker wants, slot by slot like the game's level meter, the earlier pages' first. */
export function LevelTally({ tally }: { tally: PageTally }) {
  const need = tally.need!;
  const filled = Math.min(need, tally.to);
  return (
    <div className={`pc-run${tally.cleared ? ' is-full' : ''}`}>
      <div className="pc-run__top">
        <span className="pc-run__label">Jó válaszok ezen a szinten</span>
        <span className="pc-run__count" aria-live="polite">
          {filled} / {need}
        </span>
      </div>
      <span className="pc-run__slots" aria-hidden="true">
        {Array.from({ length: need }, (_, i) => (
          <i key={i} className={i < filled ? (i < tally.from ? 'is-on is-before' : 'is-on') : ''} />
        ))}
      </span>
      <p className="pc-run__hint">
        {tally.cleared
          ? 'Megvan: ezzel a lappal jár a szint matricája.'
          : tally.from > 0
            ? `Az előző lapokról ${tally.from} jó válasz már megvan. ${need} kell a szint matricájához, mint a játékban.`
            : `${need} jó válasz kell ezen a szinten a szint matricájához, mint a játékban. Ha ezen a lapon nincs meg, a következő lap hozzáadódik.`}
      </p>
    </div>
  );
}

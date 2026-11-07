import { useEffect, useMemo, useRef, useState } from 'react';
import { useLadderRound, WinCard } from '../../../components/ladderRound';
import { GameShell } from '../../../components/GameShell';
import { BinSign, Crate, SortPart } from '../art';
import { DoneTick, GuideBubble } from '../../../components/ui';
import {
  SHOW_BIN_AFTER,
  SHOW_ODD_AFTER,
  binFor,
  binName,
  buildRound,
  describe,
  isOdd,
  oddRightFeedback,
  oddWrongFeedback,
  partFeedback,
  rightFeedback,
  sortSolvedFeedback,
  startFeedback,
  wrongFeedback,
  type OddRound,
  type Part,
  type SortFeedback,
  type SortRound,
} from '../games/sort';
import { speak } from '../../../lib/speech';
import { buzz, chime, fanfare, popBubble } from '../../../lib/sound';
import { useProgress } from '../../../state/progress';
import { ROUND_HELP_AFTER } from '../../../state/taskLog';

/** After the odd part is found, the row stays a moment so the child sees why, then the next row comes. */
const NEXT_ROW_MS = 2200;
/** Crates shown waiting on the belt behind the part in front. */
const QUEUE = 5;

function PartPic({ part, size }: { part: Part; size: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 100 100">
      <SortPart part={part} />
    </svg>
  );
}

/** Válogatógép: sort the parts coming down the belt into the right boxes, or find the odd one out. */
export function Sort({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  const { level: levelIndex, win: solve, meter, goNext } = useLadderRound('sort');
  const round = useMemo(() => buildRound(levelIndex, progress.sortRound), [levelIndex, progress.sortRound]);
  const [fb, setFb] = useState<SortFeedback>(() => startFeedback(round));
  const [solved, setSolved] = useState(false);
  /** Kakukktojás: the row the child is on, and whether its odd part is found, for the meter's pips. */
  const [oddAt, setOddAt] = useState<OddProgress>({ at: 0, found: false });
  const timers = useRef<number[]>([]);

  /** Corrections Csavar gave this round; enough of them and the round needed help (parents' notes). */
  const oops = useRef(0);
  const say = (f: SortFeedback) => {
    if (f.tone === 'oops') oops.current += 1;
    setFb(f);
    speak(f.speech);
  };

  useEffect(() => {
    speak(startFeedback(round).speech);
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- One round per mount: App keys this screen by round.
  }, []);

  const win = (f: SortFeedback) => {
    setSolved(true);
    fanfare();
    buzz(40);
    say(f);
    solve(oops.current >= ROUND_HELP_AFTER);
  };

  return (
    <GameShell
      game="sort"
      className="screen--sort"
      title={isOdd(round) ? 'Kakukktojás' : 'Válogatógép'}
      meter={meter}
      justSolved={solved}
      tasks={isOdd(round) ? { at: oddAt.at, of: round.rows.length, done: oddAt.found, unit: 'sor' } : undefined}
      onBack={onBack}
      onReplay={() => speak(fb.speech)}
    >

      <div className="sort-guide">
        <GuideBubble guide="csavar" mood={fb.mood} tone={fb.tone} csepiWidth={60}>
          {fb.text}
        </GuideBubble>
      </div>

      {isOdd(round) ? (
        <OddRows round={round} solved={solved} say={say} onWin={win} onProgress={setOddAt} later={(fn, ms) => timers.current.push(window.setTimeout(fn, ms))} />
      ) : (
        <Belt round={round} solved={solved} say={say} onWin={win} />
      )}

      {solved && <WinCard onNext={goNext} />}

    </GameShell>
  );
}

interface PlayProps<R> {
  round: R;
  solved: boolean;
  say: (f: SortFeedback) => void;
  onWin: (f: SortFeedback) => void;
}

/** Sorting: the part in front of the belt goes into the box the child taps. */
function Belt({ round, solved, say, onWin }: PlayProps<SortRound>) {
  const { parts, bins, preset } = round;
  /** The part in front of the belt. */
  const [at, setAt] = useState(preset);
  const [misses, setMisses] = useState(0);
  /** The box just tapped by mistake; its id restarts the wobble on every miss. */
  const [wrong, setWrong] = useState<{ bin: number; id: number } | null>(null);
  const rights = useRef(0);
  const hidden = !!round.level.hidden && !solved;

  const part = parts[at] as Part | undefined;
  const target = part ? binFor(bins, part) : -1;
  const glow = misses >= SHOW_BIN_AFTER ? target : -1;
  // Parts already put away, box by box, in the order they went in.
  const inBin = bins.map((_, b) => parts.slice(0, at).filter((p) => binFor(bins, p) === b));

  const drop = (b: number) => {
    if (!part || solved) return;
    if (b === target) {
      popBubble(at);
      setMisses(0);
      setWrong(null);
      setAt(at + 1);
      if (at + 1 === parts.length) {
        onWin(sortSolvedFeedback(round));
      } else {
        chime();
        say(rightFeedback(rights.current++));
      }
      return;
    }
    const m = misses + 1;
    setMisses(m);
    setWrong((w) => ({ bin: b, id: (w?.id ?? 0) + 1 }));
    buzz(30);
    say(wrongFeedback(round, part, m));
  };

  return (
    <>
      <div className="sort-machine">
        <div className="sort-belt" aria-label={`A szalagon ${parts.length - at} darab vár.`}>
          {/* The parts still to come wait in closed crates: drawn smaller, they would read as "small" parts. */}
          <div className="sort-belt__queue" aria-hidden="true">
            {Array.from({ length: Math.min(QUEUE, parts.length - at - 1) }, (_, i) => (
              <span key={i} className="sort-belt__next">
                <svg width={56} height={56} viewBox="0 0 100 100">
                  <Crate />
                </svg>
              </span>
            ))}
          </div>
          <div className="sort-belt__front">
            {part && (
              <button
                key={at}
                type="button"
                className="sort-belt__part"
                onClick={() => say(partFeedback(part))}
                aria-label={`Ez egy ${describe(part)}. Koppints, és Csavar megmondja, milyen.`}
              >
                <PartPic part={part} size={150} />
              </button>
            )}
          </div>
          <span className="sort-belt__rail" aria-hidden="true" />
        </div>
      </div>

      <div className={`sort-bins sort-bins--${bins.length}`}>
        {bins.map((bin, b) => {
          const state = glow === b ? ' is-glow' : wrong?.bin === b ? ' is-wrong' : '';
          const name = binName(bin).replace(/^az? /, '');
          return (
            <button
              key={b}
              type="button"
              className={`sort-bin${state}`}
              onClick={() => drop(b)}
              disabled={solved}
              aria-label={hidden ? `${b + 1}. doboz${inBin[b].length ? `, benne: ${inBin[b].map(describe).join(', ')}` : ''}` : `Doboz: ${binName(bin)}`}
            >
              <span key={wrong?.bin === b ? wrong.id : 0} className="sort-bin__sign">
                <BinSign match={bin.match} hidden={hidden} />
                {!hidden && <span className="sort-bin__name">{name}</span>}
              </span>
              <span className="sort-bin__inside" aria-hidden="true">
                {inBin[b].map((p, i) => (
                  <span key={i} className="sort-bin__part">
                    <PartPic part={p} size={72} />
                  </span>
                ))}
              </span>
              {inBin[b].length > 0 && (
                <span key={`count-${inBin[b].length}`} className="sort-bin__count" aria-hidden="true">
                  {inBin[b].length}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

/** Where Kakukktojás is: the row on now, and whether its odd part is found. */
interface OddProgress {
  at: number;
  found: boolean;
}

/** Kakukktojás: rows of four parts; tap the one that is different. `onProgress` hears each row's progress for the meter. */
function OddRows({
  round,
  solved,
  say,
  onWin,
  onProgress,
  later
}: PlayProps<OddRound> & { onProgress: (p: OddProgress) => void; later: (fn: () => void, ms: number) => void }) {
  const [rowIdx, setRowIdx] = useState(0);
  const [misses, setMisses] = useState(0);
  const [wrong, setWrong] = useState<{ i: number; id: number } | null>(null);
  const [found, setFound] = useState(false);
  useEffect(() => onProgress({ at: rowIdx, found }), [onProgress, rowIdx, found]);
  const row = round.rows[rowIdx];
  const last = rowIdx === round.rows.length - 1;
  const glow = misses >= SHOW_ODD_AFTER && !found ? row.odd : -1;

  const tap = (i: number) => {
    if (found || solved) return;
    if (i === row.odd) {
      setFound(true);
      setWrong(null);
      if (last) {
        onWin(oddRightFeedback(row, true));
        return;
      }
      chime();
      say(oddRightFeedback(row, false));
      later(() => {
        setRowIdx((r) => r + 1);
        setMisses(0);
        setFound(false);
        say(startFeedback(round));
      }, NEXT_ROW_MS);
      return;
    }
    const m = misses + 1;
    setMisses(m);
    setWrong((w) => ({ i, id: (w?.id ?? 0) + 1 }));
    buzz(30);
    say(oddWrongFeedback(row, m));
  };

  return (
    <div className="sort-odd">
      <div key={rowIdx} className="sort-odd__row">
        {row.parts.map((p, i) => {
          const state = found && i === row.odd ? ' is-right' : found ? ' is-dim' : glow === i ? ' is-glow' : wrong?.i === i ? ' is-wrong' : '';
          return (
            <button
              key={`${i}${wrong?.i === i ? `-${wrong.id}` : ''}`}
              type="button"
              className={`choice sort-odd__part${state}`}
              onClick={() => tap(i)}
              disabled={solved}
              aria-label={`${describe(p)}${found && i === row.odd ? ': ez a kakukktojás' : ''}`}
            >
              <PartPic part={p} size={140} />
              {state === ' is-right' && <DoneTick />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

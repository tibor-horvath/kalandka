import { useEffect, useRef, useState } from 'react';
import { Seed } from '../art';
import { FitBox } from '../../../components/FitBox';
import { GameShell } from '../../../components/GameShell';
import { useForm } from '../../../components/Stage';
import { DotFace, MiniSprout } from '../seeds';
import { DoneTick, GuideBubble, NextIcon } from '../../../components/ui';
import { FIELD_H, FIELD_W, foldSeeds } from '../games/flash/layout';
import {
  LEARN_CYCLE,
  LEARN_MIX_ASK,
  LEARN_MIX_READY,
  LEARN_READY,
  LEARN_STAGE,
  buildLearnRound,
  learnedFeedback,
  mixWrongFeedback,
  type LearnFeedback
} from '../games/learn/logic';
import { numberCount } from '../../../lib/numbers';
import { speak } from '../../../lib/speech';
import { creditSolve } from '../../../state/games';
import { evenLevels, levelMeter } from '../../../state/levelMeter';
import { useProgress } from '../../../state/progress';

/**
 * Számmagok: tap every seed, Csepi counts, then the number is named. No timer.
 * In the last stage (Vegyesen) the numbers come mixed, and after counting the child finds the numeral.
 */
export function Learn({ onBack }: { onBack: () => void }) {
  const { progress, update } = useProgress();
  const [round] = useState(() => buildLearnRound(progress.learnRound));
  // Five stages of five rounds (1–5, 6–10, 11–15, 16–20, Vegyesen), the same starts parents can pick.
  const [startRound] = useState(() => progress.learnRound % LEARN_CYCLE);
  // Portrait phones: the two groups stand one above the other, so the seeds can be bigger.
  const folded = useForm() === 'portrait' ? foldSeeds(round.seeds) : null;
  const field = folded ?? { width: FIELD_W, height: FIELD_H, seeds: round.seeds };
  const [tapped, setTapped] = useState<Set<number>>(() => new Set());
  /** Vegyesen: the wrong numeral picked last, shown crossed until the right one is found. */
  const [wrong, setWrong] = useState<number | null>(null);
  const [found, setFound] = useState(false);
  const rewarded = useRef(false);
  const mixed = round.choices !== undefined;
  const counted = tapped.size === round.count;
  const learned = counted && (!mixed || found);
  const ready = mixed ? LEARN_MIX_READY : LEARN_READY;
  const fb: LearnFeedback = learned ? learnedFeedback(round.count) : counted ? (wrong !== null ? mixWrongFeedback(wrong, round.count) : LEARN_MIX_ASK) : ready;

  useEffect(() => {
    speak(ready.speech);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- One round per mount: App keys this screen by round.
  }, []);

  const reward = () => {
    if (rewarded.current) return;
    rewarded.current = true;
    update((p) => {
      const solved = creditSolve(p, 'learn');
      return mixed ? { ...solved, learnMixSolved: solved.learnMixSolved + 1 } : solved;
    });
  };

  const tapSeed = (i: number) => {
    if (counted || tapped.has(i)) return;
    const next = new Set(tapped).add(i);
    setTapped(next);
    speak(numberCount(next.size));
    if (next.size !== round.count) return;
    if (mixed) {
      speak(LEARN_MIX_ASK.speech, { queue: true });
      return;
    }
    speak(learnedFeedback(round.count).speech, { queue: true });
    reward();
  };

  const pick = (n: number) => {
    if (!counted || learned) return;
    if (n === round.count) {
      setWrong(null);
      setFound(true);
      speak(learnedFeedback(round.count).speech);
      reward();
    } else {
      setWrong(n);
      speak(mixWrongFeedback(n, round.count).speech);
    }
  };

  // App keys this screen by round, so the next number remounts with fresh state.
  const next = () => update((p) => ({ ...p, learnRound: p.learnRound + 1 }));
  const meter = levelMeter(startRound, evenLevels(LEARN_CYCLE / LEARN_STAGE, LEARN_STAGE), learned);

  return (
    <GameShell
      game="learn"
      className="screen--flash screen--learn"
      title="Számoljuk meg együtt!"
      meter={meter}
      justSolved={learned}
      onBack={onBack}
      onReplay={() => speak(fb.speech)}
    >

      <FitBox className="seedbed-box" width={field.width} height={field.height}>
        <div className="seedbed" style={{ width: field.width, height: field.height }}>
          {field.seeds.map((s, i) => {
            const sprouted = tapped.has(i);
            return (
              <button
                key={i}
                type="button"
                className={`seedbed__seed seedbed__seed--tap${sprouted ? ' is-sprouted' : ''}`}
                style={{ left: s.x, top: s.y, transform: `translate(-50%, -50%) rotate(${sprouted ? 0 : s.rot}deg)` }}
                onClick={() => tapSeed(i)}
                aria-label={sprouted ? 'Megszámolt mag' : 'Mag – koppints rá a számoláshoz'}
              >
                {sprouted ? <MiniSprout big={round.count <= 10} /> : <Seed size={round.count > 10 ? 40 : round.count > 5 ? 52 : 64} />}
              </button>
            );
          })}
        </div>
      </FitBox>

      <div className="flash-guide">
        <GuideBubble mood={fb.mood} tone={fb.tone}>
          {fb.text}
        </GuideBubble>
      </div>

      <div className="choices">
        {mixed && counted ? (
          round.choices!.map((n) => {
            const state = learned && n === round.count ? ' is-right' : wrong === n ? ' is-wrong' : '';
            return (
              <button key={n} type="button" className={`choice choice--number${state}`} disabled={learned && n !== round.count} onClick={() => pick(n)} aria-label={`${n}`}>
                <span className="choice__numeral">{n}</span>
                {state === ' is-right' && <DoneTick />}
              </button>
            );
          })
        ) : (
          <div className={`number-card${learned ? ' is-shown' : ''}`}>
            {learned ? (
              <>
                <span className="choice__numeral">{round.count}</span>
                <DotFace n={round.count} size={round.count > 10 ? 110 : round.count > 5 ? 64 : 88} />
                <span className="number-card__word">{numberCount(round.count)}</span>
              </>
            ) : (
              <span className={`tally${round.count > 10 ? ' tally--small' : ''}`} aria-label={`${tapped.size} megszámolva`}>
                {Array.from({ length: round.count }, (_, i) => (
                  <span key={i} className={`tally__dot${i < tapped.size ? ' is-on' : ''}`} />
                ))}
              </span>
            )}
          </div>
        )}
        {learned && (
          <button type="button" className="big-btn" onClick={next}>
            Következő szám <NextIcon />
          </button>
        )}
      </div>

    </GameShell>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Seed } from '../components/art';
import { FitBox } from '../components/FitBox';
import { GameShell } from '../components/GameShell';
import { useLevelUp } from '../components/LevelMeter';
import { useForm } from '../components/Stage';
import { DotFace, MiniSprout } from '../components/seeds';
import { GuideBubble, NextIcon } from '../components/ui';
import { FIELD_H, FIELD_W, foldSeeds } from '../games/flash/layout';
import { LEARN_MAX, LEARN_READY, buildLearnRound, learnedFeedback } from '../games/learn/logic';
import { numberCount } from '../lib/numbers';
import { speak } from '../lib/speech';
import { evenLevels, levelMeter } from '../state/levelMeter';
import { useProgress } from '../state/progress';

const LEARN_BLOCK = 5;

/** Számmagok: tap every seed, Csepi counts, then the number is named. No timer. */
export function Learn({ onBack }: { onBack: () => void }) {
  const { progress, update } = useProgress();
  const [round] = useState(() => buildLearnRound(progress.learnRound));
  // The numbers come in blocks of five (1–5, 6–10, …), the same starts parents can pick.
  const [startRound] = useState(() => progress.learnRound % LEARN_MAX);
  // Portrait phones: the two groups stand one above the other, so the seeds can be bigger.
  const folded = useForm() === 'portrait' ? foldSeeds(round.seeds) : null;
  const field = folded ?? { width: FIELD_W, height: FIELD_H, seeds: round.seeds };
  const [tapped, setTapped] = useState<Set<number>>(() => new Set());
  const rewarded = useRef(false);
  const learned = tapped.size === round.count;
  const fb = learned ? learnedFeedback(round.count) : LEARN_READY;

  useEffect(() => {
    speak(LEARN_READY.speech);
  }, []);

  const tapSeed = (i: number) => {
    if (learned || tapped.has(i)) return;
    const next = new Set(tapped).add(i);
    setTapped(next);
    speak(numberCount(next.size));
    if (next.size === round.count) {
      speak(learnedFeedback(round.count).speech, { queue: true });
      if (!rewarded.current) {
        rewarded.current = true;
        update((p) => ({ ...p, seeds: p.seeds + 1, learnSolved: p.learnSolved + 1 }));
      }
    }
  };

  // App keys this screen by round, so the next number remounts with fresh state.
  const next = () => update((p) => ({ ...p, learnRound: p.learnRound + 1 }));
  const meter = levelMeter(startRound, evenLevels(LEARN_MAX / LEARN_BLOCK, LEARN_BLOCK), learned);
  const levelUp = useLevelUp(meter, next);

  return (
    <GameShell
      game="learn"
      className="screen--flash screen--learn"
      title="Számoljuk meg együtt!"
      meter={meter}
      justSolved={learned}
      levelUp={levelUp}
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
        <div className={`number-card${learned ? ' is-shown' : ''}`}>
          {learned ? (
            <>
              <span className="choice__numeral">{round.count}</span>
              <DotFace n={round.count} size={round.count > 10 ? 110 : round.count > 5 ? 64 : 88} />
              <span className="number-card__word">{numberCount(round.count)}</span>
            </>
          ) : (
            <span className={`tally${round.count > 10 ? " tally--small" : ""}`} aria-label={`${tapped.size} megszámolva`}>
              {Array.from({ length: round.count }, (_, i) => (
                <span key={i} className={`tally__dot${i < tapped.size ? ' is-on' : ''}`} />
              ))}
            </span>
          )}
        </div>
        {learned && (
          <button type="button" className="big-btn" onClick={levelUp.advance}>
            Következő szám <NextIcon />
          </button>
        )}
      </div>

    </GameShell>
  );
}

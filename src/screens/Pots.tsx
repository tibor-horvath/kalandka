import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { RoundFlower, SmallPot } from '../components/art';
import { FitBox } from '../components/FitBox';
import { LevelMeter, LevelUpCard, useLevelUp } from '../components/LevelMeter';
import { DotFace, MiniSprout } from '../components/seeds';
import { BackIcon, DoneTick, GuideBubble, NextIcon, RoundButton, SpeakerIcon } from '../components/ui';
import { POTS_LEVELS, POTS_ROUNDS_PER_LEVEL, askFeedback, boxSize, buildPotsRound, countedFeedback, potCells, revealFeedback, rightFeedback } from '../games/pots/logic';
import { numberCount } from '../lib/numbers';
import { fanfare, popBubble } from '../lib/sound';
import { speak } from '../lib/speech';
import { evenLevels, levelMeter } from '../state/levelMeter';
import { useProgress } from '../state/progress';

type Phase = 'ask' | 'reveal' | 'solved';

/** Seconds between pots when Csepi counts the empty ones after a wrong pick. */
const REVEAL_STEP_S = 0.55;

/** Cserépbarátok: some pots flower; how many more fill the box? Tapping an empty pot counts it. */
export function Pots({ onBack }: { onBack: () => void }) {
  const { progress, update } = useProgress();
  const [startSolved] = useState(() => progress.potsSolved);
  const [round] = useState(() => buildPotsRound(progress.potsRound, startSolved));
  const box = boxSize(round.total);
  const cells = potCells(round.total);
  const [phase, setPhase] = useState<Phase>('ask');
  // Empty pots in the order they were counted; the child's taps first, then Csepi's on a wrong pick.
  const [counted, setCounted] = useState<number[]>([]);
  const [tappedByChild, setTappedByChild] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const rewarded = useRef(false);

  useEffect(() => {
    speak(askFeedback(round).speech);
  }, []);

  const fb =
    phase === 'solved'
      ? rightFeedback(round)
      : phase === 'reveal'
        ? revealFeedback(round)
        : counted.length === round.need
          ? countedFeedback(round)
          : askFeedback(round);

  const tapPot = (i: number) => {
    if (phase !== 'ask' || round.filled[i] || counted.includes(i)) return;
    const next = [...counted, i];
    setCounted(next);
    setTappedByChild(next.length);
    popBubble(next.length);
    speak(next.length === round.need ? countedFeedback(round).speech : numberCount(next.length));
  };

  const answer = (n: number) => {
    if (phase === 'solved') return;
    if (n === round.need) {
      setPhase('solved');
      setWrong(null);
      fanfare();
      speak(rightFeedback(round).speech);
      if (!rewarded.current) {
        rewarded.current = true;
        update((p) => ({ ...p, seeds: p.seeds + 1, potsSolved: p.potsSolved + 1 }));
      }
    } else {
      setWrong(n);
      setPhase('reveal');
      const rest = round.filled.map((f, i) => (f || counted.includes(i) ? -1 : i)).filter((i) => i >= 0);
      setCounted([...counted, ...rest]);
      speak(revealFeedback(round).speech);
    }
  };

  // App keys this screen by round, so the next round remounts with fresh state.
  const next = () => update((p) => ({ ...p, potsRound: p.potsRound + 1 }));
  const meter = levelMeter(startSolved, evenLevels(POTS_LEVELS.length, POTS_ROUNDS_PER_LEVEL), phase === 'solved');
  const levelUp = useLevelUp(meter, next);

  return (
    <div className="screen screen--flash screen--pots">
      <div className="meadow" aria-hidden="true" />

      <header className="topbar topbar--meter">
        <RoundButton label="Vissza a kertbe" onClick={onBack}>
          <BackIcon />
        </RoundButton>
        <div className="topbar__title">
          <h1 className="screen-title">Hány virág kell még?</h1>
          <LevelMeter meter={meter} world="garden" justSolved={phase === 'solved'} />
        </div>
        <RoundButton label="Meghallgatom újra" onClick={() => speak(fb.speech)}>
          <SpeakerIcon />
        </RoundButton>
      </header>

      <FitBox className="seedbed-box" width={box.width} height={box.height}>
        <div className="potbox" style={{ width: box.width, height: box.height }}>
          {cells.map((c, i) => {
            const style = { left: c.x, top: c.y } as CSSProperties;
            if (round.filled[i]) {
              return (
                <div key={i} className="potbox__pot is-full" style={style} role="img" aria-label="Virágos cserép">
                  <RoundFlower petal={round.petal} width={70} />
                  <SmallPot />
                </div>
              );
            }
            const k = counted.indexOf(i);
            const delay = k >= tappedByChild ? { animationDelay: `${(k - tappedByChild) * REVEAL_STEP_S}s` } : undefined;
            return (
              <button
                key={i}
                type="button"
                className={`potbox__pot potbox__pot--empty${k >= 0 ? ' is-counted' : ''}`}
                style={style}
                onClick={() => tapPot(i)}
                aria-label={k >= 0 ? `Megszámolt üres cserép: ${k + 1}` : 'Üres cserép – koppints rá a számoláshoz'}
              >
                {phase === 'solved' ? (
                  <span className="pop-in">
                    <RoundFlower petal={round.friendPetal} width={70} />
                  </span>
                ) : k >= 0 ? (
                  <span className="potbox__count" style={delay}>
                    <MiniSprout />
                    <span className="potbox__num">{k + 1}</span>
                  </span>
                ) : (
                  <span className="potbox__space" />
                )}
                <SmallPot />
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
        {round.choices.map((n) => {
          const state = phase === 'solved' && n === round.need ? ' is-right' : wrong === n && phase === 'reveal' ? ' is-wrong' : '';
          return (
            <button key={n} type="button" className={`choice choice--number${state}`} disabled={phase === 'solved' && n !== round.need} onClick={() => answer(n)} aria-label={`${n}`}>
              <span className="choice__numeral">{n}</span>
              {round.level.dotChoices && <DotFace n={n} size={n > 5 ? 46 : 56} />}
              {state === ' is-right' && <DoneTick />}
            </button>
          );
        })}
        {phase === 'solved' && (
          <button type="button" className="big-btn" onClick={levelUp.advance}>
            Következő <NextIcon />
          </button>
        )}
      </div>

      {levelUp.open && <LevelUpCard meter={meter} world="garden" onNext={levelUp.finish} />}
    </div>
  );
}

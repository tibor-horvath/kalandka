import { useEffect, useState, type CSSProperties } from 'react';
import { RoundFlower, SmallPot } from '../art';
import { FitBox } from '../../../components/FitBox';
import { useLadderRound } from '../../../components/ladderRound';
import { GameShell } from '../../../components/GameShell';
import { DotFace, MiniSprout } from '../seeds';
import { DoneTick, GuideBubble, NextIcon } from '../../../components/ui';
import { askFeedback, boxSize, buildPotsRound, countedFeedback, potCells, revealFeedback, rightFeedback } from '../games/pots/logic';
import { numberCount } from '../../../lib/numbers';
import { fanfare, popBubble } from '../../../lib/sound';
import { speak } from '../../../lib/speech';
import { useProgress } from '../../../state/progress';

type Phase = 'ask' | 'reveal' | 'solved';

/** Seconds between pots when Csepi counts the empty ones after a wrong pick. */
const REVEAL_STEP_S = 0.55;
/** Widest the box is drawn on the stage: the twenty box (two ten-frames) is shrunk to this. */
const MAX_BOX_W = 1080;

/** Cserépbarátok: some pots flower; how many more fill the box? Tapping an empty pot counts it. */
export function Pots({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  const { level, win, meter, goNext } = useLadderRound('pots');
  const [round] = useState(() => buildPotsRound(progress.potsRound, level));
  const box = boxSize(round.total);
  const shrink = Math.min(1, MAX_BOX_W / box.width);
  const cells = potCells(round.total);
  const [phase, setPhase] = useState<Phase>('ask');
  // Empty pots in the order they were counted; the child's taps first, then Csepi's on a wrong pick.
  const [counted, setCounted] = useState<number[]>([]);
  const [tappedByChild, setTappedByChild] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);

  useEffect(() => {
    speak(askFeedback(round).speech);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- One round per mount: App keys this screen by round.
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
      win(wrong !== null);
    } else {
      setWrong(n);
      setPhase('reveal');
      const rest = round.filled.map((f, i) => (f || counted.includes(i) ? -1 : i)).filter((i) => i >= 0);
      setCounted([...counted, ...rest]);
      speak(revealFeedback(round).speech);
    }
  };


  return (
    <GameShell
      game="pots"
      className="screen--flash screen--pots"
      title="Hány virág kell még?"
      meter={meter}
      justSolved={phase === 'solved'}
      onBack={onBack}
      onReplay={() => speak(fb.speech)}
    >

      <FitBox className="seedbed-box" width={box.width * shrink} height={box.height * shrink}>
        <div className={shrink < 1 ? 'potbox-scaled' : undefined} style={shrink < 1 ? { width: box.width * shrink, height: box.height * shrink } : undefined}>
          <div className="potbox" style={{ width: box.width, height: box.height, ...(shrink < 1 && { transform: `scale(${shrink})` }) }}>
            {round.level.hidden && phase === 'ask' && (
              // The sum the right answer reads back ("9 + 1 = 10"), each number with its picture and word.
              <div className="potbox__cover" role="img" aria-label={`Takaró. ${round.have} virág virágzik, kérdőjel kell még, összesen ${round.total} cserép.`}>
                <span className="potbox__term">
                  <span className="potbox__pic">
                    <RoundFlower petal={round.petal} width={46} />
                    <SmallPot width={64} />
                  </span>
                  <span className="potbox__cover-num">{round.have}</span>
                  <span className="potbox__cover-word">virágzik</span>
                </span>
                <span className="potbox__op">+</span>
                <span className="potbox__term">
                  <span className="potbox__pic">
                    <SmallPot width={64} />
                  </span>
                  <span className="potbox__cover-num potbox__cover-num--ask">?</span>
                  <span className="potbox__cover-word">kell még</span>
                </span>
                <span className="potbox__op">=</span>
                <span className="potbox__term">
                  <span className="potbox__pic">
                    <span className="potbox__mini" aria-hidden="true">
                      {Array.from({ length: round.total }, (_, i) => (
                        <i key={i} />
                      ))}
                    </span>
                  </span>
                  <span className="potbox__cover-num">{round.total}</span>
                  <span className="potbox__cover-word">cserép</span>
                </span>
              </div>
            )}
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
          <button type="button" className="big-btn" onClick={goNext}>
            Következő <NextIcon />
          </button>
        )}
      </div>

    </GameShell>
  );
}

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { chime, fanfare, popBubble } from '../lib/sound';
import { speak } from '../lib/speech';
import { STICKERS, gameOf, type Sticker } from '../state/rewards';
import { StickerDisc, StickerSlot } from './garden';
import { GuideBubble } from './ui';

type Phase = 'measure' | 'fly' | 'landed';

const RAYS = ['#FFC93C', '#F4A3C4', '#2E86DE', '#FFC93C', '#8CC45E'];
/** When the sticker first lands big in the middle (see sticker-fly in rewards.css). */
const DROP_MS = 750;

/**
 * A new sticker: it spins in, sparkles and shines, then flies into its place on the game's album
 * page and settles there with a squash. Tap the stuck sticker to watch it again.
 * With reduced motion the animation is skipped and the sticker is simply in its place.
 */
export function StickerPop({ sticker, seen, onDone }: { sticker: Sticker; seen: string[]; onDone: () => void }) {
  const game = gameOf(sticker);
  const row = STICKERS.filter((s) => s.game === sticker.game && (s.set ?? 0) === (sticker.set ?? 0));
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState<Phase>('measure');
  const [flight, setFlight] = useState<CSSProperties>({});
  const flyer = useRef<HTMLSpanElement>(null);
  const target = useRef<HTMLSpanElement>(null);

  // Measure where the sticker lands, in stage pixels (the stage itself is scaled to the screen).
  useLayoutEffect(() => {
    if (phase !== 'measure' || !flyer.current || !target.current) return;
    const f = flyer.current.getBoundingClientRect();
    const t = target.current.getBoundingClientRect();
    const scale = f.width / flyer.current.offsetWidth || 1;
    setFlight({
      '--dx': `${(t.left + t.width / 2 - (f.left + f.width / 2)) / scale}px`,
      '--dy': `${(t.top + t.height / 2 - (f.top + f.height / 2)) / scale}px`,
      '--s': `${t.width / f.width}`
    } as CSSProperties);
    setPhase('fly');
  }, [phase, run]);

  useEffect(() => {
    if (phase !== 'fly') return;
    const id = window.setTimeout(() => popBubble(4), DROP_MS * 0.3);
    const id2 = window.setTimeout(fanfare, DROP_MS);
    return () => {
      window.clearTimeout(id);
      window.clearTimeout(id2);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'landed') return;
    chime();
    speak(sticker.praise);
  }, [phase]);

  const replay = () => {
    setPhase('measure');
    setRun((r) => r + 1);
  };

  return (
    <div className={`sticker-pop is-${phase}`} role="dialog" aria-modal="true" aria-labelledby="sticker-pop-title">
      <h2 id="sticker-pop-title" key={`t${run}`} className="sticker-pop__title">
        Új matrica!
      </h2>

      <div className="sticker-pop__stage" key={`s${run}`}>
        {phase === 'fly' && (
          <>
            <span className="sticker-pop__glow" aria-hidden="true" />
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className="sticker-pop__ray" style={{ '--a': `${i * 36 + 8}deg` } as CSSProperties} aria-hidden="true">
                <svg viewBox="-17 -17 34 34" width="34" height="34" style={{ animationDelay: `${0.55 + (i % 3) * 0.06}s` }}>
                  <path d="M0 -16l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" fill={RAYS[i % RAYS.length]} />
                </svg>
              </span>
            ))}
          </>
        )}
        {phase !== 'landed' && (
          <span
            ref={flyer}
            className="sticker-pop__flyer"
            style={flight}
            onAnimationEnd={(e) => {
              if (e.animationName === 'sticker-fly') setPhase('landed');
            }}
          >
            <StickerDisc sticker={sticker} />
            <span className="sticker-pop__shine" aria-hidden="true" />
          </span>
        )}
      </div>

      <section className="sticker-pop__card" aria-label={game.name}>
        <h3 className="sticker-pop__game">{game.name}</h3>
        <div className="sticker-pop__row">
          {row.map((s, i) => {
            const isNew = s.id === sticker.id;
            const tilt = [5, -6, 4][i % 3];
            return (
              <div key={s.id} className="sticker-pop__place">
                {isNew ? (
                  phase === 'landed' ? (
                    <button type="button" className="sticker-pop__stuck" onClick={replay} aria-label={`${s.label}: koppints, és újra beugrik`}>
                      <StickerDisc sticker={s} tilt={-6} />
                      <span className="sticker-pop__ring" aria-hidden="true" />
                    </button>
                  ) : (
                    <span ref={target}>
                      <StickerSlot sticker={s} />
                    </span>
                  )
                ) : seen.includes(s.id) ? (
                  <StickerDisc sticker={s} tilt={tilt} />
                ) : (
                  <StickerSlot sticker={s} />
                )}
                <span className={`sticker-pop__label${isNew || seen.includes(s.id) ? '' : ' is-open'}`}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="sticker-pop__foot">
        <div className="sticker-pop__say">
          <GuideBubble mood="cheer" tone="good" csepiWidth={56}>
            {sticker.praise}
          </GuideBubble>
        </div>
        <button type="button" className="big-btn sticker-pop__done" onClick={onDone}>
          Szuper!
        </button>
      </div>
    </div>
  );
}

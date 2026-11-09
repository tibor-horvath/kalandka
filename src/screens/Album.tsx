import { Fragment, useEffect, useState, type CSSProperties } from 'react';
import { StickerDisc, StickerSlot } from '../components/stickers';
import { GuideSay } from '../components/GuideSay';
import { PlaceShell } from '../components/PlaceShell';
import { popBubble } from '../lib/sound';
import { speak } from '../lib/speech';
import { useProgress } from '../state/progress';
import { STICKERS, STICKER_GAMES, earnedStickers, type Sticker } from '../state/rewards';
import { WORLDS, type WorldId } from '../state/worlds';

/** A little tilt per sticker, so the album looks stuck in by hand (always the same for a sticker). */
const TILTS = [-6, 4, -2, 5, -4, 3, -5];

function tiltOf(s: Sticker): number {
  return TILTS[STICKERS.indexOf(s) % TILTS.length];
}

/**
 * Matricáim: one sticker per skill step in every game, a page per world. Each game is a card in its own colour with
 * its stickers on a ladder: the line is solid up to the stickers earned and dashed on to the ones still waiting.
 */
export function Album({ onBack, world: startWorld = 'garden' }: { onBack: () => void; world?: WorldId }) {
  const { progress } = useProgress();
  const [world, setWorld] = useState<WorldId>(startWorld);
  const earned = earnedStickers(progress);
  const games = STICKER_GAMES.filter((g) => g.world === world);
  const intro = earned.length === 0 ? 'Itt gyűlnek a matricáid. Játssz, és jön az első!' : 'Koppints egy matricára!';
  const [line, setLine] = useState(intro);

  useEffect(() => {
    speak(earned.length === 0 ? intro : `Már ${earned.length} matricád van! Koppints egy matricára!`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Runs once per visit.
  }, []);

  const tap = (s: Sticker, got: boolean) => {
    popBubble(2);
    const text = got ? s.praise : `Ez a matrica még vár rád: ${s.label}.`;
    setLine(text);
    speak(text);
  };

  return (
    <PlaceShell
      className="screen--album"
      title="Matricáim"
      onBack={onBack}
      counters={
        <div className="pill album__count" aria-label={`${earned.length} matrica`}>
          {earned.length}
          <span className="pill__unit"> matrica</span>
        </div>
      }
    >

      <div className="album__worlds" role="tablist" aria-label="Világok">
        {WORLDS.map((w) => (
          <button
            key={w.id}
            type="button"
            role="tab"
            aria-selected={world === w.id}
            className={`album__world${world === w.id ? ' is-on' : ''}`}
            onClick={() => {
              popBubble(1);
              setWorld(w.id);
            }}
          >
            {w.name}
            <span className="album__world-count">
              {earned.filter((s) => STICKER_GAMES.find((g) => g.id === s.game)?.world === w.id).length}
            </span>
          </button>
        ))}
      </div>

      <div className="album" style={{ '--cols': games.length } as CSSProperties}>
        {games.map((g) => {
          const own = STICKERS.filter((s) => s.game === g.id);
          return (
          <section
            key={g.id}
            className={`album__game${own.length > 4 ? ' album__game--ladder' : own.length > 3 ? ' album__game--more' : ''}${own.length > 7 ? ' album__game--long' : ''}${own.length > 9 ? ' album__game--wrap' : ''}`}
            style={{ '--game': g.color, '--game-ink': g.ink, '--n': own.length } as CSSProperties}
            aria-label={g.name}
          >
            <h2 className="album__name">{g.name}</h2>
            <div className="album__stickers">
              {own.map((s, i) => {
                const got = earned.includes(s);
                return (
                  <Fragment key={s.id}>
                    {i > 0 && <span className={`album__link${got ? ' is-on' : ''}`} aria-hidden="true" />}
                    <button
                      type="button"
                      className={`album__sticker${got ? '' : ' is-open'}`}
                      aria-label={`${s.label}${got ? '' : ': még vár rád'}`}
                      onClick={() => tap(s, got)}
                    >
                      {got ? <StickerDisc sticker={s} tilt={tiltOf(s)} /> : <StickerSlot sticker={s} />}
                      <span className="album__label">{s.label}</span>
                    </button>
                  </Fragment>
                );
              })}
            </div>
          </section>
          );
        })}
      </div>

      <GuideSay world={world} mood="smile" text={line} className="album__guide" />
    </PlaceShell>
  );
}

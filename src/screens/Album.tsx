import { useEffect, useState, type CSSProperties } from 'react';
import { StickerDisc, StickerSlot } from '../components/garden';
import { BackIcon, GuideBubble, RoundButton, SpeakerIcon } from '../components/ui';
import { popBubble } from '../lib/sound';
import { speak } from '../lib/speech';
import { useProgress } from '../state/progress';
import { STICKERS, STICKER_GAMES, earnedStickers, type Sticker } from '../state/rewards';
import { WORLDS, type WorldId } from '../state/worlds';

/** Robotműhely machines still being built: an empty page column each, so the robot page is not one lonely column. */
const ROBOT_COMING = ['Mérleg', 'Mintagép'];

/** A little tilt per sticker, so the album looks stuck in by hand (always the same for a sticker). */
const TILTS = [-6, 4, -2, 5, -4, 3, -5];

function tiltOf(s: Sticker): number {
  return TILTS[STICKERS.indexOf(s) % TILTS.length];
}

/** Matricáim: one sticker per skill step in every game, a page per world; empty places show what comes next. */
export function Album({ onBack, world: startWorld = 'garden' }: { onBack: () => void; world?: WorldId }) {
  const { progress } = useProgress();
  const [world, setWorld] = useState<WorldId>(startWorld);
  const earned = earnedStickers(progress);
  const games = STICKER_GAMES.filter((g) => g.world === world);
  const coming = world === 'robot' ? ROBOT_COMING : [];
  const intro = earned.length === 0 ? 'Itt gyűlnek a matricáid. Játssz, és jön az első!' : 'Koppints egy matricára!';
  const [line, setLine] = useState(intro);

  useEffect(() => {
    speak(earned.length === 0 ? intro : `Már ${earned.length} matricád van! Koppints egy matricára!`);
    // Runs once per visit.
  }, []);

  const tap = (s: Sticker, got: boolean) => {
    popBubble(2);
    const text = got ? s.praise : `Ez a matrica még vár rád: ${s.label}.`;
    setLine(text);
    speak(text);
  };

  return (
    <div className="screen screen--album">
      <header className="topbar">
        <RoundButton label="Vissza" onClick={onBack}>
          <BackIcon />
        </RoundButton>
        <h1 className="screen-title">Matricáim</h1>
        <div className="pill album__count" aria-label={`${earned.length} matrica`}>
          {earned.length}
          <span className="pill__unit"> matrica</span>
        </div>
      </header>

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

      <div className="album" style={{ '--cols': games.length + coming.length } as CSSProperties}>
        {games.map((g) => {
          const own = STICKERS.filter((s) => s.game === g.id);
          return (
          <section key={g.id} className={`album__game${own.length > 3 ? ' album__game--more' : ''}`} aria-label={g.name}>
            <h2 className="album__name">{g.name}</h2>
            <div className="album__stickers">
              {own.map((s) => {
                const got = earned.includes(s);
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`album__sticker${got ? '' : ' is-open'}`}
                    aria-label={`${s.label}${got ? '' : ': még vár rád'}`}
                    onClick={() => tap(s, got)}
                  >
                    {got ? <StickerDisc sticker={s} tilt={tiltOf(s)} /> : <StickerSlot sticker={s} />}
                    <span className="album__label">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
          );
        })}
        {coming.map((name) => (
          <section key={name} className="album__game album__game--coming" aria-label={`${name}: még készül`}>
            <h2 className="album__name">{name}</h2>
            <p className="album__coming">Hamarosan</p>
          </section>
        ))}
      </div>

      <div className="album__guide">
        <GuideBubble guide={world === 'robot' ? 'csavar' : 'csepi'} mood="smile" csepiWidth={56}>
          {line}
        </GuideBubble>
        <RoundButton label="Meghallgatom újra" tint="blue" onClick={() => speak(line)}>
          <SpeakerIcon />
        </RoundButton>
      </div>
    </div>
  );
}

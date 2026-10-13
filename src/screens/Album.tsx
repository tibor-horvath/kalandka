import { useEffect, useState } from 'react';
import { StickerDisc, StickerSlot } from '../components/garden';
import { BackIcon, GuideBubble, RoundButton, SpeakerIcon } from '../components/ui';
import { popBubble } from '../lib/sound';
import { speak } from '../lib/speech';
import { useProgress } from '../state/progress';
import { STICKERS, STICKER_GAMES, earnedStickers, type Sticker } from '../state/rewards';

/** A little tilt per sticker, so the album looks stuck in by hand (always the same for a sticker). */
const TILTS = [-6, 4, -2, 5, -4, 3, -5];

function tiltOf(s: Sticker): number {
  return TILTS[STICKERS.indexOf(s) % TILTS.length];
}

/** Matricáim: one sticker per skill step in every game; empty places show what comes next. */
export function Album({ onBack }: { onBack: () => void }) {
  const { progress } = useProgress();
  const earned = earnedStickers(progress);
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

      <div className="album">
        {STICKER_GAMES.map((g) => (
          <section key={g.id} className="album__game" aria-label={g.name}>
            <h2 className="album__name">{g.name}</h2>
            <div className="album__stickers">
              {STICKERS.filter((s) => s.game === g.id).map((s) => {
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
        ))}
      </div>

      <div className="album__guide">
        <GuideBubble mood="smile" csepiWidth={56}>
          {line}
        </GuideBubble>
        <RoundButton label="Meghallgatom újra" tint="blue" onClick={() => speak(line)}>
          <SpeakerIcon />
        </RoundButton>
      </div>
    </div>
  );
}

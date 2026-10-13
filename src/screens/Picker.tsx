import { useEffect, type CSSProperties } from 'react';
import { Seed } from '../components/art';
import { AVATARS, Avatar } from '../components/avatars';
import { CsepiIcon } from '../components/Csepi';
import { GuideBubble, KalandkaWordmark, LockIcon, RoundButton, SpeakerIcon } from '../components/ui';
import { useForm } from '../components/Stage';
import { speak } from '../lib/speech';
import { MAX_KIDS, kidName, progressOf, useProfiles } from '../state/profiles';
import { remainingSeconds, today } from '../state/screenTime';

const SPEECH = 'Szia! Ki játszik most? Koppints a képedre!';

/** "Ki játszik?": each child taps their own figure. Adding a child goes through the parents' gate. */
export function Picker({ onPick, onAdd, onParents }: { onPick: (id: string) => void; onAdd: () => void; onParents: () => void }) {
  const { profiles } = useProfiles();
  const phone = useForm() !== 'tablet';
  const day = today();

  useEffect(() => {
    speak(SPEECH);
  }, []);

  return (
    <div className="screen screen--picker">
      <div className="hill" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <CsepiIcon size={56} />
          <div className="brand__text">
            <KalandkaWordmark size={phone ? 15 : 22} />
            <div className="brand__world">Számkertész</div>
          </div>
        </div>
        <button type="button" className="parents-btn" onClick={onParents}>
          <LockIcon size={22} />
          <span className="parents-btn__label">Szülőknek</span>
        </button>
      </header>

      <div className="home-guide">
        <GuideBubble mood="cheer" csepiWidth={80}>
          <div className="bubble__row">
            <div>
              <div className="bubble__kicker">Szia! Jó újra látni titeket.</div>
              <h1 className="bubble__title">Ki játszik most?</h1>
            </div>
            <RoundButton label="Meghallgatom újra" tint="blue" onClick={() => speak(SPEECH)}>
              <SpeakerIcon />
            </RoundButton>
          </div>
        </GuideBubble>
      </div>

      <nav className="kids" aria-label="Ki játszik?">
        {profiles.kids.map((kid) => {
          const p = progressOf(profiles, kid.id);
          const resting = remainingSeconds(p, day) <= 0;
          const name = kidName(kid);
          return (
            <button
              key={kid.id}
              type="button"
              className="kid-card"
              style={{ '--ring': AVATARS[kid.avatar].ring } as CSSProperties}
              aria-label={`${name}, ${p.seeds} mag${resting ? ', mára pihen' : ''}`}
              onClick={() => onPick(kid.id)}
            >
              {resting && <span className="kid-card__badge">Pihen</span>}
              <Avatar id={kid.avatar} size={148} />
              <span className="kid-card__name">{name}</span>
              <span className="kid-card__seeds">
                <Seed size={24} />
                {p.seeds} mag
              </span>
            </button>
          );
        })}
        {profiles.kids.length < MAX_KIDS && (
          <button type="button" className="kid-card kid-card--add" aria-label="Új gyerek hozzáadása (szülőknek)" onClick={onAdd}>
            <span className="kid-card__plus">
              <svg aria-hidden="true" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </span>
            <span className="kid-card__name">Új gyerek</span>
            <span className="kid-card__lock">
              <LockIcon size={16} />
              Szülőknek
            </span>
          </button>
        )}
      </nav>
    </div>
  );
}

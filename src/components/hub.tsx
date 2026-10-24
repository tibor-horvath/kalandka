import type { CSSProperties, ReactNode } from 'react';
import { setSpeechEnabled, speak } from '../lib/speech';
import { kidName, useActiveKid } from '../state/profiles';
import { useProgress } from '../state/progress';
import { AVATARS, Avatar } from './avatars';
import { LockIcon, SpeakerIcon, SpeakerOffIcon } from './ui';

// The top-bar controls every world's home screen shares: who is playing, the guide's voice, parents, the map.

function SwapIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h14" />
      <path d="M14 4l4 4-4 4" />
      <path d="M20 16H6" />
      <path d="M10 12l-4 4 4 4" />
    </svg>
  );
}

/** Active child on a home screen: tap to let someone else play. */
export function KidChip({ onSwitch }: { onSwitch: () => void }) {
  const kid = useActiveKid();
  return (
    <button
      type="button"
      className="kid-chip"
      style={{ '--ring': AVATARS[kid.avatar].ring } as CSSProperties}
      aria-label={`${kidName(kid)} játszik. Másik gyerek választása`}
      onClick={onSwitch}
    >
      <Avatar id={kid.avatar} size={46} />
      <span className="kid-chip__name">{kidName(kid)}</span>
      <span className="kid-chip__swap">
        <SwapIcon />
      </span>
    </button>
  );
}

/** Muting is one tap here; the parents' corner keeps the same switch next to the tempo setting. */
export function VoiceButton({ guide = 'Csepi' }: { guide?: string }) {
  const { progress, update } = useProgress();
  const toggle = () => {
    const on = !progress.voice;
    update((p) => ({ ...p, voice: on }));
    setSpeechEnabled(on);
    if (on) speak('Itt vagyok!');
  };
  return (
    <button type="button" className="voice-btn" aria-pressed={!progress.voice} aria-label={progress.voice ? `${guide} hangjának némítása` : `${guide} hangjának bekapcsolása`} onClick={toggle}>
      {progress.voice ? <SpeakerIcon size={26} /> : <SpeakerOffIcon size={26} />}
    </button>
  );
}

export function ParentsButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="parents-btn" onClick={onClick}>
      <LockIcon size={22} />
      <span className="parents-btn__label">Szülőknek</span>
    </button>
  );
}

function MapIcon() {
  return (
    <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round">
      <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}

/** Back to the Kalandka map, to change worlds. */
export function MapButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="map-btn" onClick={onClick} aria-label="Térkép: másik világ választása">
      <span className="map-btn__icon">
        <MapIcon />
      </span>
      <span className="map-btn__label">Térkép</span>
    </button>
  );
}

/**
 * A world's reward tile (Kiskertem, Robotépítő) beside the game tiles: wide and cream, the child's own
 * place in a round window and, in big numbers, what they can spend there, so the topbar needs no counter.
 */
export function RewardPlot({
  className,
  label,
  name,
  art,
  icon,
  count,
  unit,
  cta,
  badge,
  onClick
}: {
  className: string;
  label: string;
  name: string;
  art: ReactNode;
  icon: ReactNode;
  count: number;
  unit: string;
  cta: ReactNode;
  badge: string | null;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`plot plot--play plot--reward ${className}`} onClick={onClick} aria-label={`${label} · ${count} ${unit}`}>
      {badge && <span className="plot__badge">{badge}</span>}
      <span className="plot__window" aria-hidden="true">
        {art}
      </span>
      <span className="plot__side">
        <span className="plot__name">{name}</span>
        <span className="plot__balance" aria-hidden="true">
          {icon}
          <span className="plot__balance-text">
            <span className="plot__balance-num">{count}</span>
            <span className="plot__balance-unit">{unit}</span>
          </span>
        </span>
        <span className="plot__cta">{cta}</span>
      </span>
    </button>
  );
}

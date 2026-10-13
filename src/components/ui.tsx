import type { ReactNode } from 'react';
import type { Mood, Tone } from '../lib/types';
import { Csepi } from './Csepi';

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
};

export function SpeakerIcon({ size = 30 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" {...strokeProps} strokeWidth="2.4">
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 6a8.5 8.5 0 0 1 0 12" />
    </svg>
  );
}

export function SpeakerOffIcon({ size = 30 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" {...strokeProps} strokeWidth="2.4">
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
      <path d="M16.5 9.5l5 5" />
      <path d="M21.5 9.5l-5 5" />
    </svg>
  );
}

export function BackIcon() {
  return (
    <svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" {...strokeProps} strokeWidth="3">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function NextIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" {...strokeProps} strokeWidth="3.2">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 4.5v15l12-7.5z" />
    </svg>
  );
}

export function LockIcon({ size = 20 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" {...strokeProps} strokeWidth="2.6">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function RoundButton({ label, onClick, children, tint = 'white' }: { label: string; onClick: () => void; children: ReactNode; tint?: 'white' | 'blue' }) {
  return (
    <button type="button" className={`round-btn round-btn--${tint}`} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

/** Csepi next to a speech bubble whose colour follows the tone. */
export function GuideBubble({ mood, tone = 'plain', csepiWidth = 66, children, live = true }: { mood: Mood; tone?: Tone; csepiWidth?: number; children: ReactNode; live?: boolean }) {
  return (
    <div className="guide">
      <Csepi mood={mood} width={csepiWidth} className="guide__csepi" />
      <div className={`bubble bubble--${tone}`} aria-live={live ? 'polite' : undefined}>
        {children}
      </div>
    </div>
  );
}

export function KalandkaWordmark({ size = 22, color, accent }: { size?: number; color?: string; accent?: string }) {
  const letters = 'Kalandka'.split('');
  return (
    <span className="kalandka-mark" role="img" aria-label="Kalandka" style={{ fontSize: size, color }}>
      {letters.map((ch, i) => (
        <span key={i} aria-hidden="true" className={i % 2 ? 'up' : 'down'} style={i >= 6 ? { color: accent ?? '#1F6FC0' } : undefined}>
          {ch}
        </span>
      ))}
    </span>
  );
}

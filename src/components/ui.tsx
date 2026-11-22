import type { ReactNode } from 'react';
import type { Mood, Tone } from '../lib/types';
import { Csepi } from './Csepi';
import { Csavar } from '../worlds/robot/art';
import { Kakukk } from '../worlds/tower/art';

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

/** A tick: "check it", on buttons that hand the answer in (the clock's "Kész"). */
export function CheckIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" {...strokeProps} strokeWidth="3.4">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
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

/** Green badge on a right answer: the circle grows in, then the tick draws itself once. */
export function DoneTick() {
  return (
    <span className="done-tick" aria-hidden="true">
      <svg width="30" height="30" viewBox="0 0 24 24" {...strokeProps} strokeWidth="3.6">
        <path pathLength="1" d="M5.5 12.5l4.2 4.2 8.8-9.4" />
      </svg>
    </span>
  );
}

export function RoundButton({ label, onClick, children, tint = 'white' }: { label: string; onClick: () => void; children: ReactNode; tint?: 'white' | 'blue' }) {
  return (
    <button type="button" className={`round-btn round-btn--${tint}`} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

/** Each world's guide: Csepi in Számkertész, Csavar in Robotműhely, Kakukk in the Óratorony. */
export type GuideId = 'csepi' | 'csavar' | 'kakukk';

/** The world's guide next to a speech bubble whose colour follows the tone. */
/** A world's guide on their own: Csepi, Csavar or Kakukk. */
export function GuideFigure({ guide, mood = 'smile', width, className }: { guide: GuideId; mood?: Mood; width: number; className?: string }) {
  const Guide = guide === 'csavar' ? Csavar : guide === 'kakukk' ? Kakukk : Csepi;
  return <Guide mood={mood} width={width} className={className} />;
}

export function GuideBubble({
  mood,
  tone = 'plain',
  csepiWidth = 66,
  guide = 'csepi',
  children,
  live = true
}: {
  mood: Mood;
  tone?: Tone;
  csepiWidth?: number;
  guide?: GuideId;
  children: ReactNode;
  live?: boolean;
}) {
  return (
    <div className="guide">
      <GuideFigure guide={guide} mood={mood} width={csepiWidth} className="guide__csepi" />
      <div className={`bubble bubble--${tone}`} aria-live={live ? 'polite' : undefined}>
        {children}
      </div>
    </div>
  );
}

/** Kalandka's own mark: the colourful K on a rounded square, the same art as public/icon.svg. Worlds keep their guide's icon. */
export function KalandkaIcon({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
      <rect width="200" height="200" rx="48" fill="#FFC93C" />
      <path d="M92 102 L136 152" stroke="#10233A" strokeWidth="30" strokeLinecap="round" />
      <path d="M72 112 L128 58" stroke="#F26B4F" strokeWidth="30" strokeLinecap="round" />
      <path d="M66 50 L66 152" stroke="#2E86DE" strokeWidth="30" strokeLinecap="round" />
      <circle cx="59" cy="68" r="6" fill="#FFFFFF" />
      <circle cx="74" cy="68" r="6" fill="#FFFFFF" />
      <circle cx="60" cy="69" r="3" fill="#10233A" />
      <circle cx="75" cy="69" r="3" fill="#10233A" />
      <path d="M158 20 Q160 36 176 38 Q160 40 158 56 Q156 40 140 38 Q156 36 158 20 Z" fill="#1F5C9E" />
    </svg>
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

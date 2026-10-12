import type { Mood } from '../lib/types';

const INK = '#10233A';

function Body() {
  return (
    <>
      <path d="M100 38 V20" stroke="#3F8F3A" strokeWidth="6" strokeLinecap="round" />
      <path d="M100 26 C95 12 82 9 72 14 C77 25 89 30 100 26 Z" fill="#3F8F3A" />
      <path d="M100 23 C106 9 120 5 130 10 C125 21 112 27 100 23 Z" fill="#5BAA4A" />
      <path d="M100 34 C100 34 46 96 46 128 a54 54 0 0 0 108 0 C154 96 100 34 100 34 Z" fill="#2E86DE" />
      <ellipse cx="72" cy="104" rx="7" ry="14" transform="rotate(25 72 104)" fill="#FFFFFF" fillOpacity="0.4" />
      <ellipse cx="68" cy="142" rx="9" ry="5.5" fill="#F79AB8" />
      <ellipse cx="132" cy="142" rx="9" ry="5.5" fill="#F79AB8" />
    </>
  );
}

function Eyes({ dx = 0, dy = 0 }: { dx?: number; dy?: number }) {
  return (
    <>
      <circle cx={82 + dx} cy={124 + dy} r="8" fill={INK} />
      <circle cx={118 + dx} cy={124 + dy} r="8" fill={INK} />
      <circle cx={84.5 + dx} cy={121 + dy} r="2.8" fill="#FFFFFF" />
      <circle cx={120.5 + dx} cy={121 + dy} r="2.8" fill="#FFFFFF" />
    </>
  );
}

function Face({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'cheer':
      return (
        <>
          <Eyes />
          <path d="M84 140 Q100 166 116 140 Z" fill={INK} />
        </>
      );
    case 'oops':
      return (
        <>
          <Eyes />
          <ellipse cx="100" cy="149" rx="7" ry="9" fill={INK} />
        </>
      );
    case 'think':
      return (
        <>
          <Eyes dx={3} dy={-5} />
          <path d="M90 146 H112" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        </>
      );
    case 'sleep':
      return (
        <>
          <path d="M74 124 Q82 130 90 124" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M110 124 Q118 130 126 124" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M90 146 Q100 152 110 146" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      );
    default:
      return (
        <>
          <Eyes />
          <path d="M86 144 Q100 158 114 144" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      );
  }
}

/** Csepi standing, without the app-icon background. Height is 1.55 × width. */
export function Csepi({ mood = 'smile', width = 84, className }: { mood?: Mood; width?: number; className?: string }) {
  return (
    <svg className={className} role="img" aria-label="Csepi" width={width} height={Math.round(width * 1.55)} viewBox="40 0 120 186">
      <Body />
      <Face mood={mood} />
    </svg>
  );
}

/** Csepi on the yellow rounded square: the Kalandka app icon. */
export function CsepiIcon({ size = 56, label }: { size?: number; label?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <rect width="200" height="200" rx="48" fill="#FFC93C" />
      <Body />
      <Face mood="smile" />
    </svg>
  );
}

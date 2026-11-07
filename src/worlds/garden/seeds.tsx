import { diceFace } from './games/flash/layout';

export function MiniSprout({ big = false }: { big?: boolean }) {
  return (
    <svg aria-hidden="true" width={big ? 64 : 44} height={big ? 70 : 48} viewBox="0 0 44 48">
      <path d="M22 48 V22" stroke="#3F8F3A" strokeWidth="4" strokeLinecap="round" />
      <path d="M22 26 C22 16 14 12 6 13 C6 21 12 27 22 26 Z" fill="#5BAA4A" />
      <path d="M22 23 C22 13 30 8 38 9 C38 17 32 23 22 23 Z" fill="#7CC35C" />
    </svg>
  );
}

const DOT = '#B77B45';

/** A ten-frame of dots (2 × 5), filled row by row, with faint empty places. */
function FrameDots({ n, ox }: { n: number; ox: number }) {
  return (
    <>
      <rect x={ox + 1} y="1" width="58" height="26" rx="5" fill="none" stroke="#D9C2A8" strokeWidth="1.5" />
      {Array.from({ length: 10 }, (_, i) => (
        <circle key={i} cx={ox + 7 + (i % 5) * 11.5} cy={8 + Math.floor(i / 5) * 12} r="4" fill={i < n ? DOT : '#EFE4D6'} />
      ))}
    </>
  );
}

/**
 * Dot picture of a number: a dice face up to 5, a five plus the rest up to 10,
 * and a full ten-frame plus a second frame from 11 to 20.
 */
export function DotFace({ n, size = 64 }: { n: number; size?: number }) {
  if (n < 1 || n > 20) return null;
  if (n > 10) {
    return (
      <svg aria-hidden="true" width={size * 2.2} height={size * 0.5} viewBox="0 0 124 28">
        <FrameDots n={10} ox={0} />
        <FrameDots n={n - 10} ox={64} />
      </svg>
    );
  }
  const dots = (k: number, ox: number) =>
    diceFace(k).map(([u, v], i) => <circle key={`${ox}-${i}`} cx={ox + 6 + u * 32} cy={6 + v * 32} r="4.5" fill={DOT} />);
  if (n <= 5) {
    return (
      <svg aria-hidden="true" width={size} height={size} viewBox="0 0 44 44">
        {dots(n, 0)}
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" width={size * 2} height={size} viewBox="0 0 88 44">
      {dots(5, 0)}
      {dots(n - 5, 44)}
    </svg>
  );
}

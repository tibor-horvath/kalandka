import type { ReactNode, SVGProps } from 'react';
import type { Mood } from '../../lib/types';
import type { ActivityId, Span } from './games/activities';
import type { Season } from './games/season';
import { useNowText } from './useNow';

// Óratorony's drawings: Kakukk the cuckoo, the clock face every clock game shares, the bells, the pictures of a
// day's things and of the seasons, and each game's place on the island. Flat shapes with a dark ink outline,
// like Csepi and Csavar.

export const INK = '#10233A';
export const KAKUKK = '#7B68C8';
export const KAKUKK_DEEP = '#5B4B9A';
export const CREAM = '#F6EBD3';
export const ROOF = '#C8553D';
export const BELL = '#F2B33D';
/** The minute hand: lighter and thinner than the hour hand, so the two differ without colour too. */
export const MINUTE = '#2E86DE';

// ---------- Kakukk ----------

/** Real cuckoos have a yellow ring round each eye: open eyes sit in one, happy and sleeping eyes are ink arcs. */
function KakukkEyes({ mood }: { mood: Mood }) {
  if (mood === 'sleep' || mood === 'cheer') {
    const d = mood === 'sleep' ? 'M39 64 Q46 71 53 64 M67 64 Q74 71 81 64' : 'M39 66 Q46 57 53 66 M67 66 Q74 57 81 66';
    return <path d={d} fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />;
  }
  const [dx, dy] = mood === 'think' ? [2, -3] : mood === 'oops' ? [0, 2] : [0, 0];
  return (
    <g>
      <circle cx="46" cy="64" r="9" fill={BELL} stroke={INK} strokeWidth="2.5" />
      <circle cx="74" cy="64" r="9" fill={BELL} stroke={INK} strokeWidth="2.5" />
      <g transform={`translate(${dx} ${dy})`}>
        <circle cx="46" cy="64" r="5" fill={INK} />
        <circle cx="74" cy="64" r="5" fill={INK} />
        <circle cx="47.8" cy="62.2" r="1.8" fill="#FFFFFF" />
        <circle cx="75.8" cy="62.2" r="1.8" fill="#FFFFFF" />
      </g>
      {mood === 'oops' && <path d="M37 50 L50 46 M83 50 L70 46" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />}
    </g>
  );
}

/**
 * Kakukk's body in a 120 × 140 box: an upright purple cuckoo with a yellow eye-ring, a barred cream belly and a long
 * tail with white spots, like the real bird.
 */
function KakukkBody({ mood }: { mood: Mood }) {
  const cheer = mood === 'cheer';
  const think = mood === 'think';
  const beakOpen = cheer || mood === 'oops';
  const line = { stroke: INK, strokeWidth: 4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  return (
    <>
      <path d="M40 104 C28 110 14 118 4 126 C2 132 6 137 13 136 C24 130 36 122 46 116 Z" fill={KAKUKK_DEEP} {...line} />
      <g fill="#FFFFFF">
        <circle cx="31" cy="117" r="2.6" />
        <circle cx="21" cy="124" r="2.6" />
        <circle cx="11" cy="131" r="2.6" />
      </g>
      <path d="M70 46 C76 36 84 32 92 32 C88 40 82 46 74 50 Z" fill={KAKUKK_DEEP} {...line} strokeWidth="3.5" />
      {cheer && (
        <>
          <path d="M32 70 C22 62 12 56 2 56 C4 68 14 78 30 86 Z" fill={KAKUKK_DEEP} {...line} />
          <path d="M88 70 C98 62 108 56 118 56 C116 68 106 78 90 86 Z" fill={KAKUKK_DEEP} {...line} />
        </>
      )}
      <path d="M50 128 V133 M44 137 L50 133 L56 137 M70 128 V133 M64 137 L70 133 L76 137" fill="none" {...line} stroke="#E8833A" strokeWidth="4.5" />
      <ellipse cx="60" cy="86" rx="34" ry="44" fill={KAKUKK} {...line} />
      <ellipse cx="60" cy="104" rx="20" ry="21" fill={CREAM} />
      <path
        d="M50 92 q5 -2.5 10 0 q5 2.5 10 0 M45 100 q7.5 -3 15 0 q7.5 3 15 0 M45 108 q7.5 -3 15 0 q7.5 3 15 0 M48 116 q6 -2.5 12 0 q6 2.5 12 0"
        fill="none"
        stroke={KAKUKK_DEEP}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <g fill="#F79AB8" opacity={mood === 'sleep' ? 0.55 : 1}>
        <ellipse cx="39" cy="80" rx="5" ry="3" />
        <ellipse cx="81" cy="80" rx="5" ry="3" />
      </g>
      {!cheer && <path d="M30 70 C20 86 18 106 22 124 C32 112 36 92 34 72 Z" fill={KAKUKK_DEEP} {...line} />}
      {!cheer && !think && <path d="M90 70 C100 86 102 106 98 124 C88 112 84 92 86 72 Z" fill={KAKUKK_DEEP} {...line} />}
      {think && <path d="M92 74 C106 84 94 100 70 92 C78 86 84 78 92 74 Z" fill={KAKUKK_DEEP} {...line} />}
      <KakukkEyes mood={mood} />
      {beakOpen ? (
        <>
          <path d="M53 74 L67 74 L60 81 Z" fill={BELL} {...line} strokeWidth="3" />
          <path d="M55 83 L65 83 L60 89 Z" fill={BELL} {...line} strokeWidth="3" />
        </>
      ) : (
        <path d="M54 75 L66 75 L60 86 Z" fill={BELL} {...line} strokeWidth="3" />
      )}
      {mood === 'oops' && <path d="M98 50 C94 56 94 60 98 60 C102 60 102 56 98 50 Z" fill="#9AD3F5" {...line} strokeWidth="2.5" />}
    </>
  );
}

/** Kakukk standing: a round bird, so a little wider than Csepi for the same height in a guide bubble. */
export function Kakukk({ mood = 'smile', width = 84, className }: { mood?: Mood; width?: number; className?: string }) {
  return (
    <svg className={className} role="img" aria-label="Kakukk" width={Math.round(width * 1.2)} height={Math.round(width * 1.55)} viewBox="-4 22 128 166">
      <g transform="translate(0 50)">
        <KakukkBody mood={mood} />
      </g>
    </svg>
  );
}

/** Kakukk asleep in his nest under a moon: the rest screen after the Óratorony. Laid out by .rest-scene. */
export function KakukkResting({ night = false }: { night?: boolean }) {
  return (
    <svg className="rest-scene__art" viewBox="0 0 320 240" role="img" aria-label="Kakukk alszik a fészkében">
      {night && <path d="M262 30 a24 24 0 1 0 20 38 a18 18 0 1 1 -20 -38 Z" fill="#FFE08A" />}
      <ellipse cx="160" cy="210" rx="110" ry="22" fill={night ? '#3A2E6B' : '#E3DEF5'} />
      <path d="M70 190 Q160 240 250 190 Q240 220 160 222 Q80 220 70 190 Z" fill="#B88A5A" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <g transform="translate(100 64)">
        <KakukkBody mood="sleep" />
      </g>
      <text x="230" y="110" fontFamily="'Baloo 2', sans-serif" fontSize="26" fontWeight="800" fill={night ? '#FFFFFF' : KAKUKK_DEEP}>
        z
      </text>
      <text x="246" y="88" fontFamily="'Baloo 2', sans-serif" fontSize="20" fontWeight="800" fill={night ? '#FFFFFF' : KAKUKK_DEEP}>
        z
      </text>
    </svg>
  );
}

// ---------- the clock face ----------

/** Where the dial's numbers sit, centre (100, 100), radius 70. */
export const DIAL_NUMBERS = Array.from({ length: 12 }, (_, i) => {
  const n = i + 1;
  const a = (n * 30 * Math.PI) / 180;
  return { n, x: 100 + 70 * Math.sin(a), y: 100 - 70 * Math.cos(a) };
});

export interface ClockFaceProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /** Degrees from 12, clockwise; null leaves the hand off. */
  hour: number | null;
  minute: number | null;
  size?: number;
  /** A number to light up (the right one after two misses, or the one tapped). */
  glow?: number | null;
  /** A slice of the dial to tint, in degrees from 12: the hour hand's way between two numbers. */
  wedge?: [number, number] | null;
  /** The cuckoo-clock house around the dial (Óraállító), or the plain round wall clock. */
  house?: boolean;
  /** Draws a ring at a hand's tip to show it can be dragged. */
  grab?: 'hour' | 'minute' | null;
  label: string;
  overlay?: ReactNode;
}

const tip = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: 100 + r * Math.sin(a), y: 100 - r * Math.cos(a) };
};

/** Every clock of the Óratorony: twelve numbers, the short dark hour hand and the long, lighter minute hand. 200 × 200, centre in the middle. */
export function ClockFace({ hour, minute, size = 300, glow = null, wedge = null, house = false, grab = null, label, overlay, ...svg }: ClockFaceProps) {
  const hourTip = hour === null ? null : tip(hour, 46);
  const minTip = minute === null ? null : tip(minute, 74);
  const wedgePath = wedge && (() => {
    const a = tip(wedge[0], 88);
    const b = tip(wedge[1], 88);
    const large = wedge[1] - wedge[0] > 180 ? 1 : 0;
    return `M100 100 L${a.x.toFixed(1)} ${a.y.toFixed(1)} A88 88 0 ${large} 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)} Z`;
  })();
  const vb = house ? '-30 -78 260 330' : '0 0 200 200';
  const [w, h] = house ? [size, Math.round((size * 330) / 260)] : [size, size];
  return (
    <svg role="img" aria-label={label} width={w} height={h} viewBox={vb} {...svg}>
      {house && (
        <g>
          <path d="M-22 6 L100 -70 L222 6 Z" fill={ROOF} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
          <rect x="-4" y="2" width="208" height="214" rx="10" fill="#E9C99B" stroke={INK} strokeWidth="5" />
          <rect x="80" y="-40" width="40" height="36" rx="5" fill="#8A5A3B" stroke={INK} strokeWidth="4" />
          <path d="M100 -40 V-4" stroke={INK} strokeWidth="3" />
          <path d="M100 216 V236" stroke={INK} strokeWidth="4" />
          <circle cx="100" cy="242" r="10" fill={BELL} stroke={INK} strokeWidth="4" />
        </g>
      )}
      <circle cx="100" cy="100" r="94" fill="#FFFFFF" stroke={INK} strokeWidth="5" />
      {wedgePath && <path d={wedgePath} fill="#FFE08A" />}
      <g stroke={INK} strokeWidth="3.5" strokeLinecap="round">
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d="M100 10 V18" transform={`rotate(${i * 30} 100 100)`} />
        ))}
      </g>
      <g stroke={INK} strokeWidth="1.5" strokeLinecap="round" opacity="0.55">
        {Array.from({ length: 60 }, (_, i) => (i % 5 === 0 ? null : <path key={i} d="M100 10 V14" transform={`rotate(${i * 6} 100 100)`} />))}
      </g>
      {DIAL_NUMBERS.map(({ n, x, y }) => (
        <g key={n}>
          {glow === n && <circle cx={x} cy={y} r="15" fill="#FFE08A" stroke={BELL} strokeWidth="3" />}
          <text x={x} y={y + 8.5} textAnchor="middle" fontFamily="'Baloo 2', sans-serif" fontSize="24" fontWeight="800" fill={INK}>
            {n}
          </text>
        </g>
      ))}
      {minute !== null && <path d="M100 100 V26" stroke={MINUTE} strokeWidth="6" strokeLinecap="round" transform={`rotate(${minute} 100 100)`} />}
      {hour !== null && <path d="M100 100 V54" stroke={INK} strokeWidth="12" strokeLinecap="round" transform={`rotate(${hour} 100 100)`} />}
      {grab === 'hour' && hourTip && <circle cx={hourTip.x} cy={hourTip.y} r="14" fill="none" stroke={BELL} strokeWidth="4" strokeDasharray="6 5" />}
      {grab === 'minute' && minTip && <circle cx={minTip.x} cy={minTip.y} r="14" fill="none" stroke={MINUTE} strokeWidth="4" strokeDasharray="6 5" />}
      <circle cx="100" cy="100" r="8" fill={BELL} stroke={INK} strokeWidth="4" />
      {overlay}
    </svg>
  );
}

/** A digital display: "7:15" in light digits on a dark board. */
export function DigitalDisplay({ text, size = 1 }: { text: string; size?: number }) {
  return (
    <span className="digital" style={{ fontSize: `${48 * size}px` }} aria-hidden="true">
      {text}
    </span>
  );
}

// ---------- bells ----------

/** Óratorony's reward: a small gold bell. */
export function Bell({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 5 C11 5 9 13 9 20 V27 L5 31 H35 L31 27 V20 C31 13 29 5 20 5 Z" fill={BELL} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="20" cy="34" r="4" fill={INK} />
      <path d="M14 14 C15 11 17 10 19 10" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ---------- a day's things ----------

const ACTIVITY_ART: Record<ActivityId, ReactNode> = {
  wake: (
    <>
      <circle cx="104" cy="24" r="14" fill="#FFC93C" stroke={INK} strokeWidth="4" />
      <rect x="10" y="40" width="10" height="66" rx="3" fill="#8A5A3B" stroke={INK} strokeWidth="4" />
      <rect x="14" y="80" width="106" height="20" rx="5" fill="#C98B50" stroke={INK} strokeWidth="4" />
      <path d="M58 82 V64 a12 12 0 0 1 24 0 V82 Z" fill="#E8577D" stroke={INK} strokeWidth="4" />
      <circle cx="70" cy="46" r="13" fill="#F6D2B5" stroke={INK} strokeWidth="4" />
      <path d="M58 64 L44 46 M82 64 L96 46" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <path d="M80 72 H120 V80 H72 Z" fill="#7FB6E8" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    </>
  ),
  breakfast: (
    <>
      <circle cx="104" cy="22" r="12" fill="#FFC93C" stroke={INK} strokeWidth="4" />
      <ellipse cx="62" cy="96" rx="52" ry="10" fill="#E4DCCB" />
      <ellipse cx="62" cy="88" rx="48" ry="12" fill="#FFFFFF" stroke={INK} strokeWidth="4" />
      <path d="M36 60 h30 v24 a6 6 0 0 1 -6 6 h-18 a6 6 0 0 1 -6 -6 Z" fill="#FFFFFF" stroke={INK} strokeWidth="4" />
      <path d="M66 66 a8 8 0 0 1 0 14" fill="none" stroke={INK} strokeWidth="4" />
      <rect x="40" y="64" width="22" height="10" fill="#F6D2B5" />
      <path d="M76 82 q8 -16 22 -10 q6 10 -6 14 Z" fill="#E8B04A" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    </>
  ),
  kindergarten: (
    <>
      <path d="M44 30 a21 21 0 0 1 42 0" fill="none" stroke={INK} strokeWidth="5" />
      <rect x="34" y="28" width="62" height="74" rx="14" fill="#7FB6E8" stroke={INK} strokeWidth="4" />
      <path d="M34 52 H96 V60 C96 66 34 66 34 60 Z" fill="#FFC93C" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <rect x="46" y="74" width="38" height="18" rx="5" fill="#FFFFFF" stroke={INK} strokeWidth="4" />
    </>
  ),
  lunch: (
    <>
      <g fill="none" stroke="#8FA3B8" strokeWidth="5" strokeLinecap="round">
        <path d="M50 18 q-8 10 0 20 q8 10 0 20" />
        <path d="M72 12 q-8 10 0 20 q8 10 0 20" />
      </g>
      <path d="M18 66 H108 C106 90 90 102 63 102 C36 102 20 90 18 66 Z" fill="#FFFFFF" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
      <ellipse cx="63" cy="66" rx="45" ry="8" fill="#F2B33D" stroke={INK} strokeWidth="4" />
      <circle cx="50" cy="65" r="4" fill="#E8833A" />
      <circle cx="74" cy="66" r="4" fill="#3D8F3F" />
      <path d="M104 36 L88 66" stroke={INK} strokeWidth="6" strokeLinecap="round" />
    </>
  ),
  playground: (
    <>
      <path d="M20 104 L20 30 H52 L52 104" fill="none" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <path d="M20 46 H52 M20 62 H52 M20 78 H52" stroke={INK} strokeWidth="4" />
      <path d="M52 30 C80 30 96 80 120 100" fill="none" stroke="#E8577D" strokeWidth="12" strokeLinecap="round" />
      <circle cx="104" cy="22" r="12" fill="#FFC93C" stroke={INK} strokeWidth="4" />
    </>
  ),
  dinner: (
    <>
      <path d="M96 12 a14 14 0 1 0 12 22 a10 10 0 1 1 -12 -22 Z" fill="#FFE08A" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <ellipse cx="62" cy="86" rx="50" ry="14" fill="#FFFFFF" stroke={INK} strokeWidth="4.5" />
      <ellipse cx="62" cy="84" rx="30" ry="7" fill="#F3EEDC" />
      <path d="M44 80 q8 -14 18 -6 q10 -10 18 4 Z" fill="#E8B04A" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M8 60 V104 M120 60 V104" stroke={INK} strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  bath: (
    <>
      <g fill="#FFFFFF" stroke="#8FA3B8" strokeWidth="3">
        <circle cx="40" cy="38" r="9" />
        <circle cx="60" cy="26" r="7" />
        <circle cx="80" cy="40" r="10" />
        <circle cx="100" cy="28" r="6" />
      </g>
      <path d="M12 56 H118 V64 C118 88 100 98 65 98 C30 98 12 88 12 64 Z" fill="#7FB6E8" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
      <path d="M30 98 L26 106 M100 98 L104 106" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <path d="M20 30 V56 M20 30 H30" stroke={INK} strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  sleep: (
    <>
      <path d="M100 10 a16 16 0 1 0 14 24 a12 12 0 1 1 -14 -24 Z" fill="#FFE08A" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <rect x="10" y="40" width="10" height="66" rx="3" fill="#8A5A3B" stroke={INK} strokeWidth="4" />
      <rect x="14" y="80" width="106" height="20" rx="5" fill="#C98B50" stroke={INK} strokeWidth="4" />
      <rect x="22" y="62" width="30" height="18" rx="8" fill="#FFFFFF" stroke={INK} strokeWidth="4" />
      <circle cx="42" cy="62" r="12" fill="#F6D2B5" stroke={INK} strokeWidth="4" />
      <path d="M36 62 q3 3 6 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <path d="M52 64 H120 V82 H52 Z" fill={KAKUKK} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    </>
  ),
  clap: (
    <>
      <path d="M46 104 C30 90 28 66 34 40 C36 32 46 32 46 42 L48 58 L50 22 C50 14 62 14 62 22 L62 56" fill="#F6D2B5" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M84 104 C100 90 102 66 96 40 C94 32 84 32 84 42 L82 58 L80 22 C80 14 68 14 68 22 L68 56" fill="#F6D2B5" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round" />
      <g stroke={INK} strokeWidth="4" strokeLinecap="round">
        <path d="M65 8 V0" />
        <path d="M44 12 L40 6" />
        <path d="M86 12 L90 6" />
      </g>
    </>
  ),
  jump: (
    <>
      <ellipse cx="64" cy="106" rx="30" ry="5" fill="#E4DCCB" />
      <circle cx="64" cy="24" r="13" fill="#F6D2B5" stroke={INK} strokeWidth="4" />
      <path d="M64 38 V70" stroke="#E8577D" strokeWidth="14" strokeLinecap="round" />
      <path d="M64 46 L42 30 M64 46 L86 30 M64 70 L48 90 M64 70 L80 90" stroke={INK} strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  brush: (
    <>
      <path d="M30 34 C30 18 52 16 62 24 C72 16 94 18 94 34 C94 54 88 66 86 86 C84 104 74 106 72 92 C70 80 54 80 52 92 C50 106 40 104 38 86 C36 66 30 54 30 34 Z" fill="#FFFFFF" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
      <g transform="rotate(-35 96 96)">
        <rect x="70" y="92" width="64" height="11" rx="5" fill="#7FB6E8" stroke={INK} strokeWidth="4" />
        <rect x="74" y="76" width="22" height="16" rx="3" fill="#FFFFFF" stroke={INK} strokeWidth="4" />
      </g>
    </>
  ),
  handwash: (
    <>
      <path d="M20 40 H70 V48 H44 V58" fill="none" stroke="#8FA3B8" strokeWidth="8" strokeLinejoin="round" />
      <path d="M44 64 v10 M50 70 v10 M38 70 v10" stroke="#7FB6E8" strokeWidth="4" strokeLinecap="round" />
      <path d="M26 86 C26 76 60 74 70 80 C90 74 104 80 104 90 C104 100 70 104 60 100 C40 104 26 96 26 86 Z" fill="#F6D2B5" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <g fill="#FFFFFF" stroke="#8FA3B8" strokeWidth="2.5">
        <circle cx="96" cy="66" r="7" />
        <circle cx="110" cy="76" r="5" />
      </g>
    </>
  ),
  shoes: (
    <>
      <path d="M14 96 V70 C14 60 30 56 40 64 L60 78 C76 80 92 82 96 92 V100 H14 Z" fill={ROOF} stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
      <path d="M14 100 H96" stroke={INK} strokeWidth="6" strokeLinecap="round" />
      <path d="M40 70 l10 8 M48 64 l10 8" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
    </>
  ),
  oviDay: (
    <>
      <circle cx="106" cy="22" r="12" fill="#FFC93C" stroke={INK} strokeWidth="4" />
      <rect x="22" y="48" width="80" height="54" rx="4" fill={CREAM} stroke={INK} strokeWidth="4" />
      <path d="M14 50 L62 16 L110 50 Z" fill={ROOF} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <rect x="52" y="72" width="20" height="30" rx="3" fill="#8A5A3B" stroke={INK} strokeWidth="3.5" />
      <rect x="30" y="60" width="16" height="14" rx="2" fill="#7FB6E8" stroke={INK} strokeWidth="3" />
      <rect x="78" y="60" width="16" height="14" rx="2" fill="#7FB6E8" stroke={INK} strokeWidth="3" />
      <path d="M62 16 V4 L76 8 L62 12" fill="#E8577D" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    </>
  ),
  trip: (
    <>
      <path d="M8 104 L44 40 L66 72 L84 50 L122 104 Z" fill="#9CCB7A" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
      <path d="M44 40 L36 54 L44 52 L52 56 Z" fill="#FFFFFF" />
      <circle cx="102" cy="22" r="12" fill="#FFC93C" stroke={INK} strokeWidth="4" />
      <path d="M58 104 C62 90 70 84 74 76" fill="none" stroke="#C98B50" strokeWidth="5" strokeDasharray="2 7" strokeLinecap="round" />
    </>
  )
};

/** One of a day's things, drawn in a 130 × 110 box. */
export function ActivityPic({ id, size = 110, label }: { id: ActivityId; size?: number; label?: string }) {
  return (
    <svg width={size} height={Math.round((size * 110) / 130)} viewBox="0 0 130 110" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {ACTIVITY_ART[id]}
    </svg>
  );
}

/** The four parts of the day, as small signs: rising sun, high sun, sun going down, moon. */
export function DayPartSign({ part, size = 44 }: { part: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      {part === 'reggel' && (
        <>
          <path d="M4 30 H36" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <path d="M8 30 a12 12 0 0 1 24 0 Z" fill="#FFC93C" stroke={INK} strokeWidth="3" />
        </>
      )}
      {part === 'délben' && (
        <>
          <circle cx="20" cy="20" r="9" fill="#FFC93C" stroke={INK} strokeWidth="3" />
          <g stroke={INK} strokeWidth="3" strokeLinecap="round">
            <path d="M20 3v4M20 33v4M3 20h4M33 20h4" />
          </g>
        </>
      )}
      {part === 'délután' && (
        <>
          <circle cx="26" cy="16" r="9" fill="#FFB347" stroke={INK} strokeWidth="3" />
          <path d="M4 34 H36" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {part === 'este' && <path d="M24 6 a14 14 0 1 0 10 24 a11 11 0 1 1 -10 -24 Z" fill="#FFE08A" stroke={INK} strokeWidth="3" strokeLinejoin="round" />}
    </svg>
  );
}

// ---------- seasons ----------

/** The ground under a season's tree: a hill cut to the bottom of the sky disc. */
const TREE_GROUND = 'M-41 40 Q0 30 41 40 A57 57 0 0 1 -41 40 Z';
/** The same trunk with its two arms in every season, so it reads as one tree through the year. */
const TREE_TRUNK = 'M-6 48 L-4 12 L-22 -8 L-17 -13 L-2 2 L-3 -18 L3 -18 L3 0 L17 -14 L22 -9 L5 12 L7 48 Z';
const SEASON_SKY: Record<Season, string> = { spring: '#E3F3FF', summer: '#CDE9FF', autumn: '#FBEBD3', winter: '#DDE7F3' };

/** A crown of overlapping lobes with one outline round the whole: a thick ink layer, then the fills on top. */
function Crown({ lobes }: { lobes: [number, number, number, string][] }) {
  return (
    <>
      <g fill={INK} stroke={INK} strokeWidth="6.5">
        {lobes.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} />
        ))}
      </g>
      {lobes.map(([cx, cy, r, fill], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={fill} />
      ))}
    </>
  );
}

/** A leaf, falling or lying, centred on (x, y). */
const Leaf = ({ x, y, rot, fill }: { x: number; y: number; rot: number; fill: string }) => (
  <path d="M0 -6 C5 -3 5 3 0 6 C-5 3 -5 -3 0 -6 Z M0 -5 V5" fill={fill} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" transform={`translate(${x} ${y}) rotate(${rot})`} />
);

const BLOSSOMS: [number, number][] = [[-24, -20], [-10, -32], [5, -38], [14, -26], [25, -13], [-14, -8], [2, -18], [12, -8]];
const WINTER_TWIGS = 'M-17 -11 L-27 -26 M-12 -6 L-32 -4 M18 -12 L25 -28 M14 -9 L33 -16 M0 -16 L-6 -36 M0 -16 L7 -38';

const TREE_SEASON: Record<Season, ReactNode> = {
  // a small light crown full of blossom, flowers in fresh grass
  spring: (
    <>
      <path d={TREE_GROUND} fill="#A8D88A" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d={TREE_TRUNK} fill="#8A5A3B" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <Crown lobes={[[-18, -16, 14, '#C4E59A'], [0, -28, 16, '#C4E59A'], [18, -16, 14, '#C4E59A']]} />
      {BLOSSOMS.map(([cx, cy]) => (
        <g key={`${cx},${cy}`}>
          <circle cx={cx} cy={cy} r="5" fill="#FFFFFF" stroke={INK} strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r="2" fill="#F07EA0" />
        </g>
      ))}
      <path d="M-26 47 V38 M26 48 V39 M-18 50 V43" fill="none" stroke="#3D7A2E" strokeWidth="2.5" strokeLinecap="round" />
      <g stroke={INK} strokeWidth="1.5">
        <circle cx="-26" cy="36" r="4" fill="#FFC93C" />
        <circle cx="26" cy="37" r="4" fill="#F07EA0" />
        <circle cx="-18" cy="41" r="3.2" fill="#F07EA0" />
      </g>
    </>
  ),
  // a big dark crown hung with apples, the sun out, deep green grass
  summer: (
    <>
      <circle cx="34" cy="-36" r="7.5" fill="#FFC93C" stroke={INK} strokeWidth="3" />
      <path d={TREE_GROUND} fill="#6DBE5A" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d={TREE_TRUNK} fill="#8A5A3B" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <Crown lobes={[[-20, -12, 18, '#2F7D32'], [0, -24, 22, '#2F7D32'], [20, -12, 18, '#2F7D32'], [0, -2, 17, '#2F7D32']]} />
      <g fill="#E5484D" stroke={INK} strokeWidth="1.5">
        {[[-22, -14], [10, -32], [22, -8], [-4, 2], [-8, -28], [8, -12]].map(([cx, cy]) => (
          <circle key={`${cx},${cy}`} cx={cx} cy={cy} r="5.5" />
        ))}
      </g>
      <path d="M-34 46 l3 -6 l3 6 M24 45 l3 -6 l3 6" fill="none" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
    </>
  ),
  // a thin yellow-orange-red crown, leaves in the air and a pile on dry ground
  autumn: (
    <>
      <path d={TREE_GROUND} fill="#D8B26E" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d={TREE_TRUNK} fill="#8A5A3B" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <Crown lobes={[[-19, -16, 13, '#E8833A'], [1, -29, 15, '#FFC93C'], [20, -15, 12, '#D9542F']]} />
      <Leaf x={-34} y={4} rot={-30} fill="#FFC93C" />
      <Leaf x={30} y={14} rot={40} fill="#E8833A" />
      <Leaf x={-14} y={24} rot={70} fill="#D9542F" />
      <Leaf x={37} y={-5} rot={-60} fill="#FFC93C" />
      <Leaf x={-26} y={44} rot={80} fill="#D9542F" />
      <Leaf x={-16} y={46} rot={100} fill="#FFC93C" />
      <Leaf x={20} y={44} rot={75} fill="#E8833A" />
      <Leaf x={30} y={47} rot={110} fill="#D9542F" />
      <Leaf x={1.5} y={49.5} rot={95} fill="#E8833A" />
    </>
  ),
  // bare branches with snow lying on them, a snow drift, flakes falling
  winter: (
    <>
      <path d={WINTER_TWIGS} fill="none" stroke={INK} strokeWidth="8" strokeLinecap="round" />
      <path d={WINTER_TWIGS} fill="none" stroke="#8A5A3B" strokeWidth="4" strokeLinecap="round" />
      <path d={TREE_TRUNK} fill="#8A5A3B" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <g fill="#FFFFFF" stroke={INK} strokeWidth="1.5">
        <ellipse cx="-19.5" cy="-13" rx="6" ry="2.8" transform="rotate(45 -19.5 -13)" />
        <ellipse cx="19.5" cy="-13.5" rx="6" ry="2.8" transform="rotate(-45 19.5 -13.5)" />
        <ellipse cx="0" cy="-19.5" rx="4.5" ry="2.6" />
        <ellipse cx="-24" cy="-23" rx="3.6" ry="2.2" transform="rotate(55 -24 -23)" />
        <ellipse cx="24" cy="-25" rx="3.6" ry="2.2" transform="rotate(-65 24 -25)" />
        <ellipse cx="-27" cy="-6" rx="4" ry="2" transform="rotate(-5 -27 -6)" />
        <ellipse cx="28" cy="-15" rx="4" ry="2" transform="rotate(-20 28 -15)" />
      </g>
      <path d="M-41 40 Q-10 26 0 34 Q12 26 41 40 A57 57 0 0 1 -41 40 Z" fill="#FFFFFF" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <g fill="#FFFFFF" stroke="#8FA3B8" strokeWidth="2">
        {[[-34, -34, 3.5], [32, -38, 3.5], [-14, -46, 3], [16, -46, 3], [40, 2, 3.5], [-42, 12, 3.5], [28, 20, 3], [-22, 22, 3]].map(([cx, cy, r]) => (
          <circle key={`${cx},${cy}`} cx={cx} cy={cy} r={r} />
        ))}
      </g>
    </>
  )
};

/**
 * A tree in its season, in a 120 × 120 box on a sky disc: the same trunk every time, with three cues each —
 * blossom and flowers, apples and sun, falling leaves and a leaf pile, bare branches in snow.
 */
export function SeasonTree({ season, size = 110, label }: { season: Season; size?: number; label?: string }) {
  return (
    <svg width={size} height={size} viewBox="-60 -60 120 120" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <circle r="57" fill={SEASON_SKY[season]} />
      {TREE_SEASON[season]}
    </svg>
  );
}

/**
 * Each day of the week keeps one sign wherever it shows (the week row and its cards), so a child who can't read
 * the day's name still finds it: a shape and a colour, the shapes all different so colour is never the only clue.
 * Monday to Sunday: circle, square, triangle, star, heart, diamond, moon.
 */
const DAY_SIGN_FILL = ['#2E86DE', '#D9741A', '#2F7D32', '#C99A12', '#C2417A', '#0C6E6A', '#5B4B9A'];
const DAY_SIGN_PATH = [
  'M20 4 A16 16 0 1 1 19.99 4 Z',
  'M6 6 H34 V34 H6 Z',
  'M20 4 L36 34 H4 Z',
  'M20 3 L24.5 15 L37 15 L27 23 L31 36 L20 28 L9 36 L13 23 L3 15 L15.5 15 Z',
  'M20 36 C7 26 2 18 6 11 C10 4 18 6 20 12 C22 6 30 4 34 11 C38 18 33 26 20 36 Z',
  'M20 3 L37 20 L20 37 L3 20 Z',
  'M27 4 A16 16 0 1 0 36 28 A13 13 0 0 1 27 4 Z'
];

export function DaySign({ day, size = 40 }: { day: number; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path d={DAY_SIGN_PATH[day]} fill={DAY_SIGN_FILL[day]} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * How long something takes, drawn so a child needn't read it (Homokóra's last level, on screen and on paper):
 * a blink for a moment, an hourglass running out for a few minutes, the sun crossing to the moon for hours.
 * Each picture is longer than the one before; `size` is its width.
 */
export function SpanSign({ span, size }: { span: Span; size?: number }) {
  if (span === 'pillanat') {
    const w = size ?? 96;
    return (
      <svg width={w} height={(w * 44) / 56} viewBox="0 0 56 44" aria-hidden="true">
        <path d="M4 22 Q28 2 52 22" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        <path d="M14 27 L10 35 M28 29 V39 M42 27 L46 35" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }
  if (span === 'perc') {
    const w = size ? size * 0.6 : 56;
    return (
      <svg width={w} height={(w * 50) / 36} viewBox="0 0 36 50" aria-hidden="true">
        <path d="M4 3h28M4 47h28" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        <path d="M7 5 C7 18 18 21 18 25 C18 29 7 32 7 45 H29 C29 32 18 29 18 25 C18 21 29 18 29 5 Z" fill="#FFF8E1" stroke={INK} strokeWidth="3" />
        <path d="M10 45 C12 38 16 37 18 35 C20 37 24 38 26 45 Z" fill="#D9A21A" stroke={INK} strokeWidth="1.5" />
      </svg>
    );
  }
  const w = size ?? 110;
  return (
    <svg width={w} height={(w * 44) / 64} viewBox="0 0 64 44" aria-hidden="true">
      <path d="M6 38 A26 26 0 0 1 58 38" fill="none" stroke={INK} strokeWidth="2.5" strokeDasharray="3 6" />
      <circle cx="8" cy="36" r="7" fill="#FFC93C" stroke={INK} strokeWidth="2" />
      <path d="M58 26 A9 9 0 1 0 58 42 A7 7 0 0 1 58 26 Z" fill="#5B4B9A" stroke={INK} strokeWidth="1.5" />
    </svg>
  );
}

/** A season's small sign for its card: a flower, the sun, a leaf, a snowflake. */
export function SeasonSign({ season, size = 40 }: { season: Season; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      {season === 'spring' && (
        <g>
          {[0, 72, 144, 216, 288].map((r) => (
            <ellipse key={r} cx="20" cy="11" rx="6" ry="8" fill="#F59AB0" stroke={INK} strokeWidth="2" transform={`rotate(${r} 20 20)`} />
          ))}
          <circle cx="20" cy="20" r="5" fill="#FFC93C" stroke={INK} strokeWidth="2" />
        </g>
      )}
      {season === 'summer' && (
        <>
          <circle cx="20" cy="20" r="9" fill="#FFC93C" stroke={INK} strokeWidth="2.5" />
          <g stroke={INK} strokeWidth="2.5" strokeLinecap="round">
            <path d="M20 3v4M20 33v4M3 20h4M33 20h4M8 8l3 3M29 29l3 3M32 8l-3 3M8 32l3-3" />
          </g>
        </>
      )}
      {season === 'autumn' && <path d="M20 4 C30 10 34 22 20 36 C6 22 10 10 20 4 Z M20 10 V34" fill="#E8833A" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />}
      {season === 'winter' && (
        <g stroke="#2E86DE" strokeWidth="3" strokeLinecap="round">
          <path d="M20 4 V36 M6 12 L34 28 M6 28 L34 12" />
          <path d="M16 7 L20 11 L24 7 M16 33 L20 29 L24 33" fill="none" />
        </g>
      )}
    </svg>
  );
}

// ---------- the places on the island ----------

const placeSvg = (children: ReactNode) => (
  <svg width="140" height="120" viewBox="-70 -70 140 120" aria-hidden="true">
    {children}
  </svg>
);

/** Napirend: a house, its window half day and half night. */
export function DayArt() {
  return placeSvg(
    <>
      <rect x="-40" y="-26" width="80" height="62" rx="4" fill={CREAM} stroke={INK} strokeWidth="4" />
      <path d="M-50 -24 L0 -64 L50 -24 Z" fill={ROOF} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <rect x="-28" y="-14" width="56" height="34" rx="4" fill={KAKUKK_DEEP} stroke={INK} strokeWidth="3" />
      <path d="M-28 -14 H0 V20 H-28 Z" fill="#FFF4C2" />
      <circle cx="-14" cy="3" r="8" fill="#FFC93C" />
      <path d="M14 -6 a8 8 0 1 0 6 13 a6 6 0 1 1 -6 -13 Z" fill="#FFE08A" />
      <path d="M0 -14 V20" stroke={INK} strokeWidth="3" />
    </>
  );
}

/** Évszakok: a tree in four seasons at once. */
export function SeasonArt() {
  return placeSvg(
    <>
      <rect x="-6" y="0" width="12" height="40" fill="#8A5A3B" stroke={INK} strokeWidth="3" />
      <path d="M0 -20 L0 -60 A40 40 0 0 1 40 -20 Z" fill="#F59AB0" stroke={INK} strokeWidth="3" />
      <path d="M0 -20 L40 -20 A40 40 0 0 1 0 20 Z" fill="#3D8F3F" stroke={INK} strokeWidth="3" />
      <path d="M0 -20 L0 20 A40 40 0 0 1 -40 -20 Z" fill="#E8833A" stroke={INK} strokeWidth="3" />
      <path d="M0 -20 L-40 -20 A40 40 0 0 1 0 -60 Z" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
    </>
  );
}

/** Óraállító: a cuckoo clock with only its short hand. */
export function SetArt() {
  return placeSvg(
    <>
      <path d="M-42 -26 L0 -64 L42 -26 Z" fill={ROOF} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <rect x="-34" y="-28" width="68" height="64" rx="5" fill="#E9C99B" stroke={INK} strokeWidth="3.5" />
      <rect x="-8" y="-50" width="16" height="14" rx="3" fill="#8A5A3B" stroke={INK} strokeWidth="2.5" />
      <circle cx="0" cy="4" r="24" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
      <path d="M0 4 L14 -6" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <path d="M0 36 V44" stroke={INK} strokeWidth="3" />
      <circle cx="0" cy="46" r="5" fill={BELL} stroke={INK} strokeWidth="2.5" />
    </>
  );
}

/** Hány óra?: a street clock on its post. */
export function ReadArt() {
  return placeSvg(
    <>
      <rect x="-5" y="4" width="10" height="42" fill="#4F5F72" stroke={INK} strokeWidth="3" />
      <circle cx="0" cy="-22" r="36" fill="#FFFFFF" stroke={INK} strokeWidth="4" />
      <path d="M0 -22 V-50" stroke={MINUTE} strokeWidth="4" strokeLinecap="round" />
      <path d="M0 -22 L16 -12" stroke={INK} strokeWidth="6" strokeLinecap="round" />
      <circle cx="0" cy="-22" r="4" fill={INK} />
    </>
  );
}

/** Digitóra: a station board showing the time now on the device. */
export function DigiArt() {
  const now = useNowText();
  return placeSvg(
    <>
      <rect x="-6" y="0" width="12" height="44" fill="#4F5F72" stroke={INK} strokeWidth="3" />
      <rect x="-54" y="-46" width="108" height="54" rx="10" fill="#1E2B3C" stroke={INK} strokeWidth="4" />
      <text x="0" y="-8" textAnchor="middle" fontFamily="'Baloo 2', sans-serif" fontSize="34" fontWeight="800" fill="#FFC93C">
        {now}
      </text>
    </>
  );
}

/** Kakukk alszik: a birdhouse under the moon. */
export function SleepArt() {
  return placeSvg(
    <>
      <rect x="-30" y="-24" width="60" height="54" rx="4" fill="#E9C99B" stroke={INK} strokeWidth="3.5" />
      <path d="M-40 -22 L0 -56 L40 -22 Z" fill={KAKUKK_DEEP} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <circle cx="0" cy="2" r="12" fill={INK} />
      <path d="M0 30 V44" stroke="#8A5A3B" strokeWidth="6" />
      <path d="M44 -44 a10 10 0 1 0 8 16 a8 8 0 1 1 -8 -16 Z" fill="#FFE08A" stroke={INK} strokeWidth="2.5" />
    </>
  );
}

/** Homokóra: an hourglass, its sand half run through. */
export function SandArt() {
  return placeSvg(
    <>
      <path d="M-30 -50 H30 M-30 36 H30" stroke="#8A5A3B" strokeWidth="8" strokeLinecap="round" />
      <path d="M-24 -46 H24 L4 -6 L24 32 H-24 L-4 -6 Z" fill="#E3F1FC" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M-14 -26 H14 L2 -8 H-2 Z" fill="#F3C969" />
      <path d="M-18 32 L0 16 L18 32 Z" fill="#F3C969" />
    </>
  );
}

/** Kisváros: two little houses and the tower between them. */
export function TownArt() {
  return placeSvg(
    <>
      <rect x="-60" y="-8" width="34" height="40" fill={CREAM} stroke={INK} strokeWidth="3" />
      <path d="M-66 -6 L-43 -30 L-20 -6 Z" fill={ROOF} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <rect x="26" y="-8" width="34" height="40" fill="#FFE8B0" stroke={INK} strokeWidth="3" />
      <path d="M20 -6 L43 -30 L66 -6 Z" fill={KAKUKK_DEEP} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <rect x="-18" y="-46" width="36" height="78" rx="3" fill={CREAM} stroke={INK} strokeWidth="3" />
      <path d="M-24 -44 L0 -68 L24 -44 Z" fill={ROOF} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="0" cy="-22" r="12" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
      <path d="M0 -22 V-30 M0 -22 H6" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    </>
  );
}

// ---------- Kisváros buildings ----------

/** One building of the square in a 120 × 110 box; `ghost` draws its dashed outline before it is built. */
export function BuildingArt({
  id,
  ghost = false,
  stage = 1,
  windows = 'day',
  size = 120,
  gifts = []
}: {
  id: string;
  ghost?: boolean;
  stage?: number;
  windows?: 'day' | 'lit' | 'dark';
  size?: number;
  /** The resident's gifts so far, each drawn in its own place on and around the building. */
  gifts?: string[];
}) {
  const stroke = ghost ? '#B9AFD6' : INK;
  const f = (c: string) => (ghost ? 'none' : c);
  const dash = ghost ? '6 6' : undefined;
  const common = { stroke, strokeWidth: 3.5, strokeLinejoin: 'round' as const, strokeDasharray: dash };
  const wall = (fill: string, x = 20, w = 80, y = 44) => <rect x={x} y={y} width={w} height={104 - y} fill={f(fill)} {...common} />;
  const roof = (fill: string, x = 12, w = 96, y = 44, top = 14) => <path d={`M${x} ${y} L${x + w / 2} ${top} L${x + w} ${y} Z`} fill={f(fill)} {...common} />;
  const door = <rect x="50" y="76" width="20" height="28" rx="3" fill={f('#8A5A3B')} {...common} />;
  const pane = windows === 'lit' ? '#FFE08A' : windows === 'dark' ? '#3A4A63' : '#CFE3F5';
  const win = (x: number, y = 56) => <rect x={x} y={y} width="16" height="14" rx="2" fill={f(pane)} {...common} />;
  const sign = (text: string, fill: string) =>
    !ghost && (
      <text x="60" y="40" textAnchor="middle" fontFamily="'Baloo 2', sans-serif" fontSize="13" fontWeight="800" fill={fill}>
        {text}
      </text>
    );
  const art: Record<string, ReactNode> = {
    bakery: (
      <>
        {wall('#FFE8B0')}
        {roof(ROOF)}
        {door}
        {win(28)}
        {win(76)}
        {!ghost && <ellipse cx="60" cy="34" rx="14" ry="7" fill="#E8B04A" stroke={INK} strokeWidth="2.5" />}
      </>
    ),
    flowers: (
      <>
        {wall('#FDE2EC')}
        {roof('#E8577D')}
        {door}
        {win(28)}
        {!ghost && (
          <g>
            <circle cx="84" cy="96" r="6" fill="#FFC93C" stroke={INK} strokeWidth="2" />
            <circle cx="94" cy="92" r="6" fill="#F59AB0" stroke={INK} strokeWidth="2" />
            <rect x="78" y="98" width="22" height="8" fill="#C98B50" stroke={INK} strokeWidth="2" />
          </g>
        )}
      </>
    ),
    fountain: (
      <>
        <ellipse cx="60" cy="96" rx="44" ry="12" fill={f('#7FB6E8')} {...common} />
        <rect x="54" y="52" width="12" height="44" fill={f('#D8D2C4')} {...common} />
        <ellipse cx="60" cy="52" rx="22" ry="7" fill={f('#7FB6E8')} {...common} />
        {!ghost && <path d="M60 46 C56 30 50 26 44 30 M60 46 C64 30 70 26 76 30" fill="none" stroke="#2E86DE" strokeWidth="3" strokeLinecap="round" />}
      </>
    ),
    post: (
      <>
        {wall('#FFF4C2')}
        {roof('#F2B33D')}
        {door}
        {!ghost && <rect x="26" y="56" width="18" height="12" fill="#FFFFFF" stroke={INK} strokeWidth="2.5" />}
        {!ghost && <path d="M26 56 L35 63 L44 56" fill="none" stroke={INK} strokeWidth="2.5" />}
        {win(76)}
      </>
    ),
    playground: (
      <>
        <path d="M22 104 V54 H50 V104" fill="none" stroke={stroke} strokeWidth="4" strokeDasharray={dash} />
        <path d="M50 54 C76 54 86 90 104 104" fill="none" stroke={ghost ? stroke : '#E8577D'} strokeWidth={ghost ? 4 : 10} strokeLinecap="round" strokeDasharray={dash} />
        <path d="M22 70 H50 M22 86 H50" stroke={stroke} strokeWidth="3" strokeDasharray={dash} />
      </>
    ),
    school: (
      <>
        {wall('#E3F1FC', 10, 100)}
        {roof('#2E86DE', 4, 112)}
        {door}
        {win(18)}
        {win(86)}
        {!ghost && <circle cx="60" cy="32" r="7" fill="#FFFFFF" stroke={INK} strokeWidth="2.5" />}
      </>
    ),
    library: (
      <>
        {wall(CREAM)}
        {roof('#3D8F3F')}
        {door}
        {!ghost && (
          <g>
            <rect x="26" y="56" width="6" height="16" fill="#E8577D" />
            <rect x="33" y="58" width="6" height="14" fill="#2E86DE" />
            <rect x="40" y="56" width="5" height="16" fill="#F2B33D" />
          </g>
        )}
        {win(76)}
      </>
    ),
    station: (
      <>
        {wall('#EEF3F9', 8, 104, 52)}
        <rect x="4" y="40" width="112" height="12" rx="3" fill={f('#4F5F72')} {...common} />
        {door}
        {win(18, 62)}
        {win(86, 62)}
        {!ghost && (
          <g>
            <circle cx="60" cy="30" r="10" fill="#FFFFFF" stroke={INK} strokeWidth="2.5" />
            <path d="M60 30 V24 M60 30 H65" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          </g>
        )}
      </>
    ),
    cinema: (
      <>
        {wall('#3A2E6B')}
        {roof(KAKUKK_DEEP)}
        <rect x="30" y="52" width="60" height="16" rx="3" fill={f('#FFE08A')} {...common} />
        {sign('MOZI', INK)}
        {door}
      </>
    ),
    clock: (
      <>
        <rect x="40" y="30" width="40" height="74" rx="3" fill={f(CREAM)} {...common} />
        <path d="M34 32 L60 4 L86 32 Z" fill={f(ROOF)} {...common} />
        <circle cx="60" cy="52" r="14" fill={f('#FFFFFF')} {...common} />
        {!ghost && <path d="M60 52 V42 M60 52 H67" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />}
        <rect x="52" y="82" width="16" height="22" rx="3" fill={f('#8A5A3B')} {...common} />
      </>
    )
  };
  return (
    <svg width={size} height={Math.round((size * 122) / 120)} viewBox="0 -12 120 122" aria-hidden="true">
      {art[id]}
      {!ghost && stage >= 2 && (
        // The second stage: a lantern and a flower pot on each side of the door.
        <g>
          {[42, 78].map((x, i) => (
            <g key={x}>
              <path d={`M${x} 98 V86`} stroke={INK} strokeWidth="2" />
              <rect x={x - 3.5} y={80} width="7" height="7" rx="1.5" fill="#FFE08A" stroke={INK} strokeWidth="2" />
              <path d={`M${x - 6} 100 H${x + 6} L${x + 4} 108 H${x - 4} Z`} fill="#C98B50" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
              <circle cx={x} cy={97} r="4" fill={i ? '#F2B33D' : '#E8577D'} stroke={INK} strokeWidth="1.8" />
            </g>
          ))}
        </g>
      )}
      {!ghost && stage >= 3 && (
        // The third: a flag on a pole above the roof, and a gold star.
        <g>
          <path d="M104 46 V-8" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <path d="M104 -8 L118 -3 L104 2 Z" fill="#E8577D" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M14 -2 l2.4 5 5.4.6 -4 3.7 1.1 5.4 -4.9 -2.8 -4.9 2.8 1.1 -5.4 -4 -3.7 5.4 -.6z" fill={BELL} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
        </g>
      )}
      {!ghost && gifts.map((kind) => <g key={kind}>{GIFT_ON_HOUSE[kind]}</g>)}
    </svg>
  );
}

/**
 * Each gift's place on a building (in BuildingArt's 120 × 110 frame): the sign over the door, the flower box under the
 * left window, a garland of flags along the roof, a balloon at the top corner, the tree and the bike on the left, the
 * bench and the lamp on the right. A resident never gets the same kind twice, so the places never clash.
 */
const GIFT_ON_HOUSE: Record<string, ReactNode> = {
  sign: (
    <g>
      <path d="M48 60 V66 M72 60 V66" stroke={INK} strokeWidth="1.8" />
      <rect x="44" y="65" width="32" height="10" rx="2.5" fill="#E8B04A" stroke={INK} strokeWidth="2.2" />
      <path d="M50 70 H70" stroke="#8A5A3B" strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  flowerbox: (
    <g>
      <rect x="25" y="72" width="24" height="7" rx="2" fill="#C98B50" stroke={INK} strokeWidth="2" />
      <circle cx="30" cy="70" r="3.2" fill="#E8577D" stroke={INK} strokeWidth="1.5" />
      <circle cx="37" cy="69" r="3.2" fill="#F2B33D" stroke={INK} strokeWidth="1.5" />
      <circle cx="44" cy="70" r="3.2" fill="#E8577D" stroke={INK} strokeWidth="1.5" />
    </g>
  ),
  flag: (
    <g>
      <path d="M16 44 Q60 56 104 44" fill="none" stroke={INK} strokeWidth="1.6" />
      {[24, 38, 52, 66, 80, 94].map((x, i) => (
        <path key={x} d={`M${x - 5} ${46 + (x < 60 ? (x - 16) / 8 : (104 - x) / 8)} h10 l-5 9 Z`} fill={['#E8577D', '#F2B33D', '#2E86DE'][i % 3]} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
      ))}
    </g>
  ),
  balloon: (
    <g>
      <path d="M14 30 Q18 38 20 46" fill="none" stroke={INK} strokeWidth="1.4" />
      <ellipse cx="14" cy="22" rx="7" ry="9" fill="#E8577D" stroke={INK} strokeWidth="2" />
      <ellipse cx="11" cy="19" rx="2" ry="3" fill="#FFFFFF" opacity="0.7" />
    </g>
  ),
  tree: (
    <g>
      <rect x="7" y="78" width="4" height="20" fill="#8A5A3B" stroke={INK} strokeWidth="1.5" />
      <circle cx="9" cy="72" r="10" fill="#3D8F3F" stroke={INK} strokeWidth="2" />
    </g>
  ),
  bike: (
    <g>
      <circle cx="6" cy="102" r="5" fill="none" stroke={INK} strokeWidth="2" />
      <circle cx="24" cy="102" r="5" fill="none" stroke={INK} strokeWidth="2" />
      <path d="M6 102 L12 93 H21 L24 102 M12 93 L15 102 H21 M20 90 H24" fill="none" stroke="#2E86DE" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
    </g>
  ),
  bench: (
    <g>
      <path d="M86 98 H106 M89 98 V106 M103 98 V106" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <rect x="85" y="94" width="22" height="4" rx="1.5" fill="#C98B50" stroke={INK} strokeWidth="1.8" />
      <rect x="86" y="88" width="20" height="4" rx="1.5" fill="#C98B50" stroke={INK} strokeWidth="1.8" />
    </g>
  ),
  lamp: (
    <g>
      <path d="M113 106 V58" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M108 50 H118 L116 58 H110 Z" fill="#FFE08A" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M107 50 L113 45 L119 50 Z" fill={INK} />
    </g>
  )
};

// ---------- Kisváros residents and decorations ----------

/** A resident of the Kisváros, standing, in a 30 × 50 box with feet at the bottom. */
export function ResidentArt({ hat, coat, size = 46, label }: { hat: 'chef' | 'cap' | 'none' | 'bow' | 'top'; coat: string; size?: number; label?: string }) {
  const hats: Record<string, ReactNode> = {
    chef: <path d="M-7 -38 C-12 -46 -4 -50 0 -46 C4 -50 12 -46 7 -38 Z" fill="#FFFFFF" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />,
    cap: <path d="M-9 -36 C-9 -44 9 -44 9 -36 Z M9 -37 H14" fill={coat} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />,
    top: <path d="M-6 -38 V-48 H6 V-38 Z M-10 -38 H10" fill={INK} stroke={INK} strokeWidth="2.2" />,
    bow: <path d="M-4 -40 L-10 -44 V-36 Z M4 -40 L10 -44 V-36 Z" fill="#E8577D" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />,
    none: <path d="M-8 -36 C-8 -42 8 -42 8 -36" fill="none" stroke="#8A5A3B" strokeWidth="3" strokeLinecap="round" />
  };
  return (
    <svg width={Math.round(size * 0.6)} height={size} viewBox="-15 -50 30 50" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <path d="M-10 0 V-20 C-10 -29 10 -29 10 -20 V0 Z" fill={coat} stroke={INK} strokeWidth="2.2" />
      <circle cy="-32" r="8.5" fill="#F6D2B5" stroke={INK} strokeWidth="2.2" />
      <circle cx="-3" cy="-32" r="1.2" fill={INK} />
      <circle cx="3" cy="-32" r="1.2" fill={INK} />
      <path d="M-3 -28.5 q3 2.2 6 0" fill="none" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
      {hats[hat]}
    </svg>
  );
}

const DECOR_ART: Record<string, ReactNode> = {
  bench: <path d="M3 12 H21 V15 H3 Z M5 15 V20 M19 15 V20 M4 7 H20 V10 H4 Z" fill="#C98B50" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />,
  lamp: <path d="M11 21 V10 H13 V21 Z M8 4 H16 L14 9 H10 Z" fill="#FFE08A" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />,
  flowerbox: (
    <>
      <path d="M4 14 H20 L18 20 H6 Z" fill="#C98B50" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="8" cy="11" r="3" fill="#E8577D" stroke={INK} strokeWidth="1.4" />
      <circle cx="16" cy="11" r="3" fill="#F2B33D" stroke={INK} strokeWidth="1.4" />
    </>
  ),
  flag: <path d="M6 21 V3 M6 4 H18 L15 8 L18 12 H6" fill="#E8577D" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />,
  tree: (
    <>
      <rect x="11" y="14" width="2.5" height="7" fill="#8A5A3B" />
      <circle cx="12" cy="10" r="7" fill="#3D8F3F" stroke={INK} strokeWidth="1.6" />
    </>
  ),
  bike: (
    <>
      <circle cx="6" cy="16" r="4" fill="none" stroke={INK} strokeWidth="1.8" />
      <circle cx="18" cy="16" r="4" fill="none" stroke={INK} strokeWidth="1.8" />
      <path d="M6 16 L10 9 H16 L18 16 M10 9 L12 16 H16" fill="none" stroke="#2E86DE" strokeWidth="1.8" strokeLinejoin="round" />
    </>
  ),
  sign: <path d="M5 21 V9 M19 21 V9 M3 4 H21 V10 H3 Z" fill="#E8B04A" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />,
  balloon: (
    <>
      <path d="M12 16 V22" stroke={INK} strokeWidth="1.4" />
      <ellipse cx="12" cy="9" rx="6" ry="7" fill="#E8577D" stroke={INK} strokeWidth="1.6" />
    </>
  )
};

/** A gift's decoration, in a 24 × 24 box. */
export function DecorArt({ kind, size = 24 }: { kind: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {DECOR_ART[kind]}
    </svg>
  );
}

// ---------- the map ----------

/** Kakukk's island on the Kalandka map: the clock tower on a cobbled square, two houses. Centred on its point, about 420 wide. */
export function TowerMapArt() {
  return (
    <g>
      <ellipse cx="0" cy="34" rx="96" ry="30" fill="#E7D7BC" />
      <g transform="translate(-120 26)">
        <rect x="-26" y="-34" width="52" height="40" fill="#FFE8B0" stroke={INK} strokeWidth="4" />
        <path d="M-34 -32 L0 -62 L34 -32 Z" fill={KAKUKK_DEEP} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <rect x="-8" y="-16" width="16" height="22" fill="#8A5A3B" />
      </g>
      <g transform="translate(118 30)">
        <rect x="-24" y="-30" width="48" height="36" fill={CREAM} stroke={INK} strokeWidth="4" />
        <path d="M-32 -28 L0 -56 L32 -28 Z" fill={ROOF} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <rect x="-14" y="-20" width="12" height="12" fill="#FFE08A" stroke={INK} strokeWidth="2.5" />
      </g>
      <g transform="translate(0 30)">
        <rect x="-30" y="-150" width="60" height="150" rx="6" fill={CREAM} stroke={INK} strokeWidth="5" />
        <path d="M-42 -148 L0 -200 L42 -148 Z" fill={ROOF} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
        <circle cx="0" cy="-208" r="7" fill={BELL} stroke={INK} strokeWidth="3" />
        <circle cx="0" cy="-104" r="22" fill="#FFFFFF" stroke={INK} strokeWidth="4" />
        <path d="M0 -104 V-120" stroke={MINUTE} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M0 -104 L11 -104" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        <rect x="-11" y="-144" width="22" height="16" rx="8" fill={KAKUKK_DEEP} stroke={INK} strokeWidth="3" />
        <path d="M-12 0 V-22 a12 12 0 0 1 24 0 V0 Z" fill="#8A5A3B" stroke={INK} strokeWidth="4" />
      </g>
    </g>
  );
}

/** The day's time on the play-time sign: an hourglass whose top empties as play time is used. */
export function HourglassGauge({ left }: { left: number }) {
  const top = Math.max(0, Math.min(1, left));
  return (
    <svg className="play-timer__gauge" width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
      <path d="M12 6 H44 M12 50 H44" stroke="currentColor" strokeWidth="5" strokeLinecap="round" className="play-timer__outline" />
      <path d="M15 8 H41 L30 28 L41 48 H15 L26 28 Z" className="play-timer__empty play-timer__outline" strokeWidth="3.5" strokeLinejoin="round" />
      <path d={`M${15 + 11 * (1 - top)} ${8 + 18 * (1 - top)} H${41 - 11 * (1 - top)} L28 27 Z`} className="play-timer__fill" />
      <path d={`M${20 - 4 * (1 - top)} 47 L28 ${47 - 16 * (1 - top)} L${36 + 4 * (1 - top)} 47 Z`} className="play-timer__fill" />
    </svg>
  );
}

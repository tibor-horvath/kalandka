import type { ReactNode } from 'react';
import type { Cmd } from '../games/robot/path';
import type { Color, Part, Shape } from '../games/robot/sort';
import type { Mood } from '../lib/types';

// Robotműhely's drawings: Csavar the guide, the little robot on the Robotút floor, its battery, crates and bolts.

const INK = '#10233A';
const SCREEN = '#7FE9F0';
export const ROBOT_TEAL = '#2E9C97';
const TEAL_LIGHT = '#4FB7B3';
const STEEL = '#8FA3B8';

function CsavarFace({ mood }: { mood: Mood }) {
  const line = { stroke: SCREEN, strokeWidth: 5, fill: 'none', strokeLinecap: 'round' as const };
  switch (mood) {
    case 'cheer':
      return (
        <>
          <path d="M79 75 Q86 64 93 75" {...line} />
          <path d="M107 75 Q114 64 121 75" {...line} />
          <path d="M88 82 Q100 98 112 82 Z" fill={SCREEN} />
        </>
      );
    case 'oops':
      return (
        <>
          <circle cx="86" cy="72" r="6.5" fill={SCREEN} />
          <circle cx="114" cy="72" r="6.5" fill={SCREEN} />
          <ellipse cx="100" cy="88" rx="4.5" ry="5.5" fill={SCREEN} />
        </>
      );
    case 'think':
      return (
        <>
          <circle cx="89" cy="68" r="6" fill={SCREEN} />
          <circle cx="117" cy="68" r="6" fill={SCREEN} />
          <path d="M90 87 H110" {...line} />
        </>
      );
    case 'sleep':
      return (
        <>
          <path d="M79 73 Q86 78 93 73" {...line} />
          <path d="M107 73 Q114 78 121 73" {...line} />
          <path d="M93 87 Q100 91 107 87" {...line} strokeWidth={4} />
        </>
      );
    default:
      return (
        <>
          <circle cx="86" cy="72" r="6" fill={SCREEN} />
          <circle cx="114" cy="72" r="6" fill={SCREEN} />
          <path d="M88 84 Q100 95 112 84" {...line} />
        </>
      );
  }
}

function CsavarBody({ mood }: { mood: Mood }) {
  return (
    <>
      <path d="M100 42 V20" stroke={STEEL} strokeWidth="5" strokeLinecap="round" />
      <circle cx="100" cy="15" r="8" fill={mood === 'sleep' ? '#C9B27A' : '#FFC93C'} />
      <path d="M62 126 L48 148" stroke={STEEL} strokeWidth="8" strokeLinecap="round" />
      <path d="M138 126 L152 148" stroke={STEEL} strokeWidth="8" strokeLinecap="round" />
      <circle cx="47" cy="150" r="7" fill={TEAL_LIGHT} />
      <circle cx="153" cy="150" r="7" fill={TEAL_LIGHT} />
      <rect x="70" y="164" width="22" height="18" rx="8" fill={INK} />
      <rect x="108" y="164" width="22" height="18" rx="8" fill={INK} />
      <rect x="90" y="108" width="20" height="10" fill={STEEL} />
      <rect x="62" y="116" width="76" height="52" rx="16" fill={ROBOT_TEAL} />
      <circle cx="100" cy="140" r="10" fill="#FFC93C" />
      <path d="M101 133 L95 141 H101 L99 147 L105 139 H99 Z" fill={INK} />
      <circle cx="52" cy="76" r="8" fill={STEEL} />
      <circle cx="148" cy="76" r="8" fill={STEEL} />
      <rect x="56" y="40" width="88" height="70" rx="22" fill={TEAL_LIGHT} />
      <rect x="65" y="51" width="70" height="48" rx="14" fill={INK} />
      <ellipse cx="74" cy="92" rx="5" ry="3" fill="#F79AB8" fillOpacity="0.85" />
      <ellipse cx="126" cy="92" rx="5" ry="3" fill="#F79AB8" fillOpacity="0.85" />
      <CsavarFace mood={mood} />
    </>
  );
}

/** Csavar standing, the same size as Csepi (height is 1.55 × width) so he fits every guide bubble. */
export function Csavar({ mood = 'smile', width = 84, className }: { mood?: Mood; width?: number; className?: string }) {
  return (
    <svg className={className} role="img" aria-label="Csavar" width={width} height={Math.round(width * 1.55)} viewBox="40 0 120 186">
      <CsavarBody mood={mood} />
    </svg>
  );
}

/** The little robot seen from above, in a 100 × 100 box, its headlight facing up (rotate it to turn). */
export function Rover() {
  return (
    <g>
      <rect x="12" y="20" width="14" height="26" rx="5" fill={INK} />
      <rect x="74" y="20" width="14" height="26" rx="5" fill={INK} />
      <rect x="12" y="56" width="14" height="26" rx="5" fill={INK} />
      <rect x="74" y="56" width="14" height="26" rx="5" fill={INK} />
      <rect x="22" y="14" width="56" height="72" rx="18" fill={ROBOT_TEAL} />
      <rect x="32" y="18" width="36" height="16" rx="8" fill={INK} />
      <circle className="rover-eye" cx="43" cy="26" r="3.6" fill={SCREEN} />
      <circle className="rover-eye" cx="57" cy="26" r="3.6" fill={SCREEN} />
      <circle cx="50" cy="58" r="17" fill={TEAL_LIGHT} />
      <circle className="rover-light" cx="50" cy="58" r="6" fill="#FFC93C" />
    </g>
  );
}

/** The battery the robot drives to, in a 100 × 100 box. */
export function Battery({ charged = false }: { charged?: boolean }) {
  return (
    <g>
      <circle cx="50" cy="52" r="40" fill="#FFE08A" opacity={charged ? 0.9 : 0.45} />
      <rect x="42" y="12" width="16" height="10" rx="3" fill="#1E5520" />
      <rect x="30" y="20" width="40" height="64" rx="9" fill="#8CC45E" stroke="#1E5520" strokeWidth="5" />
      <path d="M53 30 L40 54 H50 L46 74 L61 47 H51 Z" fill="#FFC93C" stroke="#1E5520" strokeWidth="2.5" strokeLinejoin="round" />
    </g>
  );
}

/** A wooden crate the robot cannot pass, in a 100 × 100 box. */
export function Crate() {
  return (
    <g>
      <rect x="12" y="12" width="76" height="76" rx="8" fill="#C98B50" stroke="#8A5A3B" strokeWidth="5" />
      <path d="M22 22 L78 78 M78 22 L22 78" stroke="#8A5A3B" strokeWidth="6" strokeLinecap="round" />
      <rect x="12" y="12" width="76" height="76" rx="8" fill="none" stroke="#E2B07C" strokeWidth="2" transform="translate(4 4) scale(0.92)" />
    </g>
  );
}

/** A hex nut: what the child earns in Robotműhely. */
export function Bolt({ size = 30 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 40 40">
      <path d="M20 3 L35 11.5 V28.5 L20 37 L5 28.5 V11.5 Z" fill="#B7C4D2" stroke="#5E7184" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="20" cy="20" r="7" fill="#FFFFFF" stroke="#5E7184" strokeWidth="3" />
    </svg>
  );
}

const ARROW_ROT: Partial<Record<Cmd, number>> = { up: 0, right: 90, down: 180, left: 270, fwd: 0 };

/** The picture on a program card or a command button. */
export function CmdIcon({ cmd, size = 44 }: { cmd: Cmd; size?: number }) {
  const props = { fill: 'none', stroke: 'currentColor', strokeWidth: 3.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (cmd === 'turnL' || cmd === 'turnR') {
    return (
      <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" style={cmd === 'turnR' ? { transform: 'scaleX(-1)' } : undefined}>
        <path d="M17 20 V12 a5 5 0 0 0 -5 -5 H6" {...props} />
        <path d="M10 3 L6 7 L10 11" {...props} />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" style={{ transform: `rotate(${ARROW_ROT[cmd]}deg)` }}>
      <path d="M12 20 V5" {...props} />
      <path d="M6 11 L12 5 L18 11" {...props} />
      {cmd === 'fwd' && <path d="M8 20 H16" {...props} />}
    </svg>
  );
}

/** Robotút's tile on the Robotműhely home screen: the robot, three dots and the battery. */
export function PathArt() {
  return (
    <svg aria-hidden="true" className="path-art" width="200" height="83" viewBox="0 0 300 124">
      <g transform="translate(0 12) rotate(90 50 50)">
        <Rover />
      </g>
      {[124, 152, 180].map((x) => (
        <circle key={x} cx={x} cy="62" r="7" fill="#9FB3C8" />
      ))}
      <g transform="translate(200 12)">
        <Battery charged />
      </g>
    </svg>
  );
}

/** A gear, for the machines still being built in Robotműhely. */
export function Gear({ size = 52, color = '#9FB3C8' }: { size?: number; color?: string }) {
  const teeth = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 48 48">
      {teeth.map((a) => (
        <rect key={a} x="20" y="2" width="8" height="10" rx="2" fill={color} transform={`rotate(${a} 24 24)`} />
      ))}
      <circle cx="24" cy="24" r="15" fill={color} />
      <circle cx="24" cy="24" r="6" fill="#FFFFFF" />
    </svg>
  );
}

// ---------- Válogatógép ----------

/** Part colours, each with a darker edge; light yellow, mid red and dark blue differ in lightness too. */
const PART_FILL: Record<Color, [string, string]> = {
  red: ['#E5484D', '#9E2A2E'],
  blue: ['#2E5FA8', '#183A6E'],
  yellow: ['#FFC93C', '#A97C00']
};
const HOLE = '#F4F7FB';

function PartShape({ shape, fill, edge }: { shape: Shape; fill: string; edge: string }) {
  if (shape === 'round') {
    return (
      <>
        <circle cx="50" cy="50" r="38" fill={fill} stroke={edge} strokeWidth="6" />
        <circle cx="50" cy="50" r="11" fill={HOLE} stroke={edge} strokeWidth="4" />
      </>
    );
  }
  if (shape === 'square') {
    return (
      <>
        <rect x="14" y="14" width="72" height="72" rx="10" fill={fill} stroke={edge} strokeWidth="6" />
        {[27, 73].flatMap((x) => [27, 73].map((y) => <circle key={`${x},${y}`} cx={x} cy={y} r="4.5" fill={edge} />))}
        <circle cx="50" cy="50" r="11" fill={HOLE} stroke={edge} strokeWidth="4" />
      </>
    );
  }
  return (
    <>
      <path d="M50 10 L90 84 H10 Z" fill={fill} stroke={edge} strokeWidth="6" strokeLinejoin="round" />
      <circle cx="50" cy="60" r="10" fill={HOLE} stroke={edge} strokeWidth="4" />
    </>
  );
}

/** A machine part for Válogatógép, in a 100 × 100 box; a small one is drawn at 60%, standing on the same bottom edge. */
export function SortPart({ part }: { part: Part }) {
  const [fill, edge] = PART_FILL[part.color];
  return (
    <g transform={part.size === 'small' ? 'translate(20 36) scale(0.6)' : undefined}>
      <PartShape shape={part.shape} fill={fill} edge={edge} />
    </g>
  );
}

const LABEL_INK = '#5E7184';

/** The sign on a Válogatógép box: what goes in, drawn so a child who cannot read yet sees it. */
export function BinSign({ match, hidden = false, size = 56 }: { match: Partial<Part>; hidden?: boolean; size?: number }) {
  const svg = (children: ReactNode) => (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 100 100">
      {children}
    </svg>
  );
  if (hidden) {
    return svg(
      <text x="50" y="74" textAnchor="middle" fontSize="70" fontWeight="800" fill={LABEL_INK}>
        ?
      </text>
    );
  }
  const { color, shape, size: big } = match;
  if (color && shape) return svg(<SortPart part={{ color, shape, size: 'big' }} />);
  if (color) {
    const [fill, edge] = PART_FILL[color];
    return svg(<path d="M50 8 C72 36 84 52 84 66 A34 34 0 0 1 16 66 C16 52 28 36 50 8 Z" fill={fill} stroke={edge} strokeWidth="6" strokeLinejoin="round" />);
  }
  if (shape) return svg(<PartShape shape={shape} fill="#DDE5EE" edge={LABEL_INK} />);
  if (big) return svg(<SortPart part={{ color: 'blue', shape: 'square', size: big }} />);
  // The rest: three small mixed parts.
  return svg(
    <>
      <g transform="translate(0 4) scale(0.5)">
        <PartShape shape="round" fill="#DDE5EE" edge={LABEL_INK} />
      </g>
      <g transform="translate(50 4) scale(0.5)">
        <PartShape shape="triangle" fill="#DDE5EE" edge={LABEL_INK} />
      </g>
      <g transform="translate(25 50) scale(0.5)">
        <PartShape shape="square" fill="#DDE5EE" edge={LABEL_INK} />
      </g>
    </>
  );
}

/** Válogatógép's tile on the Robotműhely home screen: three parts above an open box. */
export function SortArt() {
  return (
    <svg aria-hidden="true" className="sort-art" width="200" height="83" viewBox="0 0 300 124">
      <g transform="translate(20 6) scale(0.62)">
        <SortPart part={{ color: 'red', shape: 'round', size: 'big' }} />
      </g>
      <g transform="translate(86 6) scale(0.62)">
        <SortPart part={{ color: 'yellow', shape: 'triangle', size: 'big' }} />
      </g>
      <g transform="translate(152 6) scale(0.62)">
        <SortPart part={{ color: 'blue', shape: 'square', size: 'big' }} />
      </g>
      <path d="M214 30 L238 50 L214 70" fill="none" stroke="#9FB3C8" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M244 64 H296 L288 118 H252 Z" fill="#C98B50" stroke="#8A5A3B" strokeWidth="5" strokeLinejoin="round" />
      <rect x="10" y="80" width="200" height="22" rx="11" fill="#5E7184" />
      {[30, 70, 110, 150, 190].map((x) => (
        <circle key={x} cx={x} cy="91" r="5" fill="#B7C4D2" />
      ))}
    </svg>
  );
}

// ---------- Mérleg ----------

const WEIGHT_FILL = '#7E93AB';
const WEIGHT_EDGE = '#3E5872';

/** A weight for Mérleg: a one is 48 × 48 with one dot, a two is twice as wide with two dots, drawn from (0, 0). */
export function WeightBlock({ w }: { w: 1 | 2 }) {
  const width = w === 2 ? 100 : 48;
  return (
    <g>
      <rect x="2" y="2" width={width - 4} height="44" rx="9" fill={WEIGHT_FILL} stroke={WEIGHT_EDGE} strokeWidth="4" />
      <rect x="8" y="7" width={width - 16} height="7" rx="3.5" fill="#B7C4D2" />
      {(w === 2 ? [27, 73] : [24]).map((cx) => (
        <circle key={cx} cx={cx} cy="28" r="7" fill="#FFFFFF" stroke={WEIGHT_EDGE} strokeWidth="3" />
      ))}
    </g>
  );
}

/** Mérleg's tile on the Robotműhely home screen: a balance tipped towards three weights. */
export function ScaleArt() {
  return (
    <svg aria-hidden="true" className="scale-art" width="200" height="83" viewBox="0 0 300 124">
      <g transform="translate(0 14)">
        <path d="M150 64 L132 108 H168 Z" fill="#5E7184" />
        <g transform="rotate(-8 150 64)">
          <rect x="40" y="58" width="220" height="12" rx="6" fill="#5E7184" />
          <rect x="30" y="44" width="80" height="10" rx="5" fill={WEIGHT_EDGE} />
          <rect x="190" y="44" width="80" height="10" rx="5" fill={WEIGHT_EDGE} />
          <g transform="translate(34 14) scale(0.6)">
            <WeightBlock w={1} />
          </g>
          <g transform="translate(66 14) scale(0.6)">
            <WeightBlock w={1} />
          </g>
          <g transform="translate(50 -14) scale(0.6)">
            <WeightBlock w={1} />
          </g>
          <g transform="translate(216 14) scale(0.6)">
            <WeightBlock w={1} />
          </g>
        </g>
        <circle cx="150" cy="64" r="9" fill="#F2B33D" stroke="#7A5300" strokeWidth="3" />
      </g>
    </svg>
  );
}

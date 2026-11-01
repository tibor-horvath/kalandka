import { createContext, useContext, type ReactNode } from 'react';
import type { Cmd } from '../games/robot/path';
import type { Dir } from '../games/robot/seq';
import type { Pic, Sign } from '../games/robot/code';
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

// ---------- Válogatógép ----------

/** Part colours, each with a darker edge; light yellow, mid red and dark blue differ in lightness too. */
const PART_FILL: Record<Color, [string, string]> = {
  red: ['#E5484D', '#9E2A2E'],
  blue: ['#2E5FA8', '#183A6E'],
  yellow: ['#FFC93C', '#A97C00']
};
const HOLE = '#F4F7FB';

/**
 * Paper only (src/print): on a black-and-white printer the colours turn to greys, so with `textured` red is
 * drawn striped and blue dotted over its colour (yellow stays plain). Each printed sheet defines its own patterns
 * and provides their fills here: a url(#id) finds the first element with that id in the page, and the on-screen
 * preview's copy is hidden when printing.
 */
export const TextureContext = createContext<Record<Color, string | null>>({ red: null, blue: null, yellow: null });

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
export function SortPart({ part, textured = false }: { part: Part; textured?: boolean }) {
  const [fill, edge] = PART_FILL[part.color];
  const textures = useContext(TextureContext);
  const texture = textured && textures[part.color];
  return (
    <g transform={part.size === 'small' ? 'translate(20 36) scale(0.6)' : undefined}>
      <PartShape shape={part.shape} fill={fill} edge={edge} />
      {texture && <PartShape shape={part.shape} fill={texture} edge="none" />}
    </g>
  );
}

const LABEL_INK = '#5E7184';

/** The sign on a Válogatógép box: what goes in, drawn so a child who cannot read yet sees it. */
export function BinSign({ match, hidden = false, size = 56, textured = false }: { match: Partial<Part>; hidden?: boolean; size?: number; textured?: boolean }) {
  const textures = useContext(TextureContext);
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
  if (color && shape) return svg(<SortPart part={{ color, shape, size: 'big' }} textured={textured} />);
  if (color) {
    const [fill, edge] = PART_FILL[color];
    const texture = textured && textures[color];
    const drop = 'M50 8 C72 36 84 52 84 66 A34 34 0 0 1 16 66 C16 52 28 36 50 8 Z';
    return svg(
      <>
        <path d={drop} fill={fill} stroke={edge} strokeWidth="6" strokeLinejoin="round" />
        {texture && <path d={drop} fill={texture} />}
      </>
    );
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

// ---------- Mintagép ----------

const ARROW_TEAL: [string, string] = ['#138A86', '#0C5F5C'];

/** A Mintagép arrow on a white tile, in a 100 × 100 box: 0 points up, each step a quarter turn clockwise. */
export function ArrowTile({ dir, color, textured = false }: { dir: Dir; color: Color | null; textured?: boolean }) {
  const [fill, edge] = color ? PART_FILL[color] : ARROW_TEAL;
  const textures = useContext(TextureContext);
  const texture = textured && color && textures[color];
  const arrow = 'M50 14 L80 50 H61 V86 H39 V50 H20 Z';
  return (
    <g>
      <rect x="6" y="6" width="88" height="88" rx="20" fill="#FFFFFF" stroke="#CFDBE8" strokeWidth="5" />
      <path d={arrow} fill={fill} stroke={edge} strokeWidth="4" strokeLinejoin="round" transform={`rotate(${dir * 90} 50 50)`} />
      {texture && <path d={arrow} fill={texture} transform={`rotate(${dir * 90} 50 50)`} />}
    </g>
  );
}

/** Height of one block in a Mintagép tower, in the tower's 100 × 200 box; eight fit. */
const BLOCK_H = 24;

/** A tower of n blocks standing on the bottom edge of a 100 × 200 box. */
export function BlockStack({ n }: { n: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x="18" y={200 - (i + 1) * BLOCK_H} width="64" height={BLOCK_H - 4} rx="6" fill="#F2B33D" stroke="#B07A12" strokeWidth="4" />
      ))}
    </g>
  );
}

/** Mintagép's tile on the Robotműhely home screen: red, blue, red, blue and a gap on the belt. */
export function SeqArt() {
  return (
    <svg aria-hidden="true" className="seq-art" width="200" height="83" viewBox="0 0 300 124">
      {(['red', 'blue', 'red', 'blue'] as Color[]).map((c, i) => (
        <g key={i} transform={`translate(${12 + i * 56} 18) scale(0.56)`}>
          <SortPart part={{ color: c, shape: 'round', size: 'big' }} />
        </g>
      ))}
      <rect x="240" y="22" width="50" height="50" rx="12" fill="#FFFFFF" stroke="#138A86" strokeWidth="5" strokeDasharray="9 6" />
      <text x="265" y="62" textAnchor="middle" fontSize="38" fontWeight="800" fill="#138A86">
        ?
      </text>
      <rect x="6" y="80" width="288" height="22" rx="11" fill="#5E7184" />
      {[30, 80, 130, 180, 230, 270].map((x) => (
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

// ---------- Tükörgép ----------

const SOCKET = '#DCE3EA';
const SOCKET_EDGE = '#A9B7C6';
export const MIRROR_GLASS = '#BFE6F2';

/** A lamp on the Tükörgép board, in a 100 × 100 box: a dark socket, or a bulb in a part colour with a soft halo. */
export function Lamp({ color, textured = false }: { color: Color | null; textured?: boolean }) {
  const textures = useContext(TextureContext);
  if (!color) return <circle cx="50" cy="50" r="24" fill={SOCKET} stroke={SOCKET_EDGE} strokeWidth="5" />;
  const [fill, edge] = PART_FILL[color];
  const texture = textured && textures[color];
  return (
    <g>
      <circle cx="50" cy="50" r="46" fill={fill} opacity="0.22" />
      <circle cx="50" cy="50" r="34" fill={fill} stroke={edge} strokeWidth="6" />
      {texture && <circle cx="50" cy="50" r="31" fill={texture} />}
      <ellipse cx="39" cy="38" rx="10" ry="7" fill="#FFFFFF" opacity="0.6" />
    </g>
  );
}

/** A shape of lamps in a size × size frame, for the Tükörgép cards. */
export function LampGrid({ cells, size, color, px, textured = false }: { cells: { r: number; c: number }[]; size: number; color: Color; px: number; textured?: boolean }) {
  return (
    <svg aria-hidden="true" width={px} height={px} viewBox={`0 0 ${size * 100} ${size * 100}`}>
      {Array.from({ length: size * size }, (_, i) => {
        const r = Math.floor(i / size);
        const c = i % size;
        const on = cells.some((p) => p.r === r && p.c === c);
        return (
          <g key={i} transform={`translate(${c * 100} ${r * 100})`}>
            <Lamp color={on ? color : null} textured={textured} />
          </g>
        );
      })}
    </svg>
  );
}

/** Tükörgép's tile on the Robotműhely home screen: three lamps, a mirror, and their reflections. */
export function MirrorArt() {
  const lamps: [number, number, Color][] = [
    [0, 1, 'red'],
    [1, 0, 'blue'],
    [2, 1, 'yellow']
  ];
  return (
    <svg aria-hidden="true" className="mirror-art" width="200" height="83" viewBox="0 0 300 124">
      <rect x="20" y="4" width="260" height="116" rx="16" fill="#F4F7FB" stroke="#5E7184" strokeWidth="5" />
      <rect x="143" y="10" width="14" height="104" rx="7" fill={MIRROR_GLASS} stroke={ROBOT_TEAL} strokeWidth="4" />
      {lamps.flatMap(([r, c, color]) =>
        [56 + c * 40, 244 - c * 40].map((x) => (
          <g key={`${r}-${x}`} transform={`translate(${x - 17} ${12 + r * 34}) scale(0.34)`}>
            <Lamp color={color} />
          </g>
        ))
      )}
    </svg>
  );
}

// ---------- Kódzár ----------

/** The pictures a lamp can stand for, in a 100 × 100 box: steel and teal, never a lamp colour, each with its own outline. */
export function CodePic({ pic }: { pic: Pic }) {
  switch (pic) {
    case 'gear':
      return (
        <g>
          <path
            d="M44 8h12l2 12 9 4 10-7 8 8-7 10 4 9 12 2v12l-12 2-4 9 7 10-8 8-10-7-9 4-2 12H44l-2-12-9-4-10 7-8-8 7-10-4-9-12-2V44l12-2 4-9-7-10 8-8 10 7 9-4z"
            fill={STEEL}
            stroke="#3E5872"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <circle cx="50" cy="50" r="14" fill="#FFFFFF" stroke="#3E5872" strokeWidth="5" />
        </g>
      );
    case 'battery':
      return (
        <g>
          <rect x="38" y="6" width="24" height="14" rx="4" fill="#0C5F5C" />
          <rect x="22" y="16" width="56" height="78" rx="12" fill={ROBOT_TEAL} stroke="#0C5F5C" strokeWidth="5" />
          <path d="M55 30 L38 58 H50 L45 82 L63 52 H51 Z" fill="#FFFFFF" stroke="#0C5F5C" strokeWidth="3" strokeLinejoin="round" />
        </g>
      );
    case 'spanner':
      return (
        <g transform="rotate(-40 50 50)">
          <rect x="41" y="40" width="18" height="56" rx="9" fill="#6F86A0" stroke="#2F4A63" strokeWidth="5" />
          <path d="M28 30 C28 14 38 6 42 5 L42 22 L58 22 L58 5 C62 6 72 14 72 30 C72 42 62 49 50 49 C38 49 28 42 28 30 Z" fill="#6F86A0" stroke="#2F4A63" strokeWidth="5" strokeLinejoin="round" />
        </g>
      );
    case 'magnet':
      return (
        <g>
          <path d="M30 16 V52 a20 20 0 0 0 40 0 V16" fill="none" stroke="#2F4A63" strokeWidth="24" />
          <path d="M30 18 V52 a20 20 0 0 0 40 0 V18" fill="none" stroke="#7A5BB5" strokeWidth="14" />
          <rect x="17" y="6" width="26" height="18" rx="4" fill="#E6EDF6" stroke="#2F4A63" strokeWidth="4" />
          <rect x="57" y="6" width="26" height="18" rx="4" fill="#E6EDF6" stroke="#2F4A63" strokeWidth="4" />
        </g>
      );
  }
}

/** Where the dots sit on a die face, in a 100 × 100 box. */
const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[30, 26], [70, 26], [30, 50], [70, 50], [30, 74], [70, 74]]
};

/** A die face, in a 100 × 100 box. */
export function Dice({ n }: { n: number }) {
  return (
    <g>
      <rect x="8" y="8" width="84" height="84" rx="20" fill="#FFFFFF" stroke="#3E5872" strokeWidth="6" />
      {(PIPS[n] ?? []).map(([x, y]) => (
        <circle key={`${x},${y}`} cx={x} cy={y} r="8.5" fill={INK} />
      ))}
    </g>
  );
}

/** Any Kódzár sign in a 100 × 100 box: a lamp, a picture, a die face or a numeral. */
export function CodeSign({ sign, textured = false }: { sign: Sign; textured?: boolean }) {
  switch (sign.kind) {
    case 'lamp':
      return <Lamp color={sign.color} textured={textured} />;
    case 'pic':
      return <CodePic pic={sign.pic} />;
    case 'dots':
      return <Dice n={sign.n} />;
    case 'digit':
      return (
        <text x="50" y="82" textAnchor="middle" fontFamily="'Baloo 2', 'Trebuchet MS', sans-serif" fontSize="92" fontWeight="800" fill="#0C5F5C">
          {sign.n}
        </text>
      );
  }
}

/** Hibakereső's tile on the Robotműhely home screen: a row of program cards, one of them wrong, under a magnifying glass. */
export function FixArt() {
  const card = (x: number, wrong: boolean, turn: number) => (
    <g transform={`translate(${x} 22)`}>
      <rect width="72" height="72" rx="14" fill={wrong ? '#FFF1E0' : '#E4F4F3'} stroke={wrong ? '#D9741A' : ROBOT_TEAL} strokeWidth="5" />
      <path d="M36 54 V20 M22 33 L36 19 L50 33" transform={`rotate(${turn} 36 36)`} fill="none" stroke={wrong ? '#D9741A' : ROBOT_TEAL} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
  return (
    <svg aria-hidden="true" className="fix-art" width="200" height="83" viewBox="0 0 300 124">
      {card(28, false, 90)}
      {card(114, true, 180)}
      {card(200, false, 0)}
      <circle cx="150" cy="58" r="50" fill="none" stroke="#3E5872" strokeWidth="9" />
      <path d="M186 94 L212 118" stroke="#3E5872" strokeWidth="13" strokeLinecap="round" />
    </svg>
  );
}

/** Kódzár's tile on the Robotműhely home screen: a crate with a code lock, two lamps and a slot. */
export function CodeArt() {
  return (
    <svg aria-hidden="true" className="code-art" width="200" height="83" viewBox="0 0 300 124">
      <path d="M128 40 V24 a22 22 0 0 1 44 0 V40" fill="none" stroke="#3E5872" strokeWidth="14" />
      <path d="M128 40 V24 a22 22 0 0 1 44 0 V40" fill="none" stroke={STEEL} strokeWidth="7" />
      <rect x="40" y="34" width="220" height="86" rx="12" fill="#D9A35F" stroke="#9C6A2F" strokeWidth="5" />
      <rect x="80" y="46" width="140" height="64" rx="14" fill="#5E7184" stroke="#3E5872" strokeWidth="4" />
      <g transform="translate(96 56) scale(0.3)">
        <Lamp color="red" />
      </g>
      <g transform="translate(135 56) scale(0.3)">
        <Lamp color="blue" />
      </g>
      <rect x="176" y="58" width="28" height="28" rx="7" fill="#FFFFFF" stroke={ROBOT_TEAL} strokeWidth="3.5" strokeDasharray="6 4" />
    </svg>
  );
}

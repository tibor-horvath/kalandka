import { Fragment } from 'react';
import { lookOf, type FriendId, type PartSlot, type RobotLook } from '../state/robotParts';
import type { Progress } from '../state/progress';

// The child's own robot, drawn from the parts it wears, and the robot friends who come to the workshop.

const INK = '#10233A';
const STEEL = '#8FA3B8';
const SCREEN = '#7FE9F0';
const SUN = '#FFC93C';

interface Paint {
  main: string;
  light: string;
  deep: string;
}

export const PAINTS: Record<string, Paint> = {
  'paint-teal': { main: '#2E9C97', light: '#4FB7B3', deep: '#0C5F5C' },
  'paint-orange': { main: '#E8893A', light: '#F5AC66', deep: '#A85417' },
  'paint-purple': { main: '#7E6BD6', light: '#A08EEA', deep: '#4E3FA0' },
  'paint-yellow': { main: '#E6B325', light: '#F5CF55', deep: '#9C7410' },
  'paint-blue': { main: '#3D7BD9', light: '#6A9DE8', deep: '#1F4F9A' },
  'paint-pink': { main: '#E2689A', light: '#F293B8', deep: '#A23A66' },
  'paint-green': { main: '#4C9F45', light: '#73BE68', deep: '#2E6B2A' }
};

/** Where each head puts its top (for the antenna) and its face. */
const HEADS: Record<string, { top: number; face: number }> = {
  'head-round': { top: 52, face: 91 },
  'head-square': { top: 54, face: 92 },
  'head-dome': { top: 32, face: 104 },
  'head-ears': { top: 52, face: 91 }
};

function Antenna({ id, top }: { id: string; top: number }) {
  if (id === 'antenna-spring') {
    return (
      <g>
        <path d={`M100 ${top} l-8 -6 l16 -6 l-16 -6 l16 -6 l-8 -4`} fill="none" stroke={STEEL} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="100" cy={top - 34} r="8" fill={SUN} />
      </g>
    );
  }
  if (id === 'antenna-star') {
    const cy = top - 30;
    const pts = Array.from({ length: 10 }, (_, i) => {
      const r = i % 2 ? 6 : 14;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      return `${100 + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(' ');
    return (
      <g>
        <path d={`M100 ${top} V${cy + 10}`} stroke={STEEL} strokeWidth="5" strokeLinecap="round" />
        <polygon points={pts} fill={SUN} stroke="#C98A1A" strokeWidth="2" strokeLinejoin="round" />
      </g>
    );
  }
  if (id === 'antenna-dish') {
    return (
      <g>
        <path d={`M100 ${top} V${top - 16}`} stroke={STEEL} strokeWidth="5" strokeLinecap="round" />
        <path d={`M76 ${top - 34} Q100 ${top - 4} 124 ${top - 34} Z`} fill="#E3EBF4" stroke={STEEL} strokeWidth="4" strokeLinejoin="round" />
        <path d={`M100 ${top - 22} L112 ${top - 42}`} stroke={STEEL} strokeWidth="3" strokeLinecap="round" />
        <circle cx="112" cy={top - 44} r="5" fill={SUN} />
      </g>
    );
  }
  return (
    <g>
      <path d={`M100 ${top} V${top - 24}`} stroke={STEEL} strokeWidth="5" strokeLinecap="round" />
      <circle cx="100" cy={top - 30} r="8" fill={SUN} />
    </g>
  );
}

function Head({ id, paint }: { id: string; paint: Paint }) {
  const face = HEADS[id]?.face ?? 91;
  const eyes = (
    <>
      <circle cx="86" cy={face - 4} r="6" fill={SCREEN} />
      <circle cx="114" cy={face - 4} r="6" fill={SCREEN} />
      <path d={`M88 ${face + 8} Q100 ${face + 18} 112 ${face + 8}`} fill="none" stroke={SCREEN} strokeWidth="5" strokeLinecap="round" />
    </>
  );
  if (id === 'head-square') {
    return (
      <g>
        <rect x="40" y="80" width="12" height="24" rx="4" fill={STEEL} />
        <rect x="148" y="80" width="12" height="24" rx="4" fill={STEEL} />
        <rect x="48" y="54" width="104" height="78" rx="8" fill={paint.light} />
        <rect x="60" y="66" width="80" height="52" rx="6" fill={INK} />
        {[56, 144].map((x) => [62, 124].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="3" fill={paint.deep} />))}
        {eyes}
      </g>
    );
  }
  if (id === 'head-dome') {
    return (
      <g>
        <circle cx="48" cy="102" r="8" fill={STEEL} />
        <circle cx="152" cy="102" r="8" fill={STEEL} />
        <path d="M56 74 a44 42 0 0 1 88 0 Z" fill="#CFEFF7" stroke="#FFFFFF" strokeWidth="3" opacity="0.9" />
        <path d="M70 62 a32 30 0 0 1 22 -18" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        <rect x="52" y="72" width="96" height="60" rx="14" fill={paint.light} />
        <rect x="62" y="82" width="76" height="42" rx="12" fill={INK} />
        {eyes}
      </g>
    );
  }
  if (id === 'head-ears') {
    return (
      <g>
        <path d="M54 70 L48 30 L84 56 Z M146 70 L152 30 L116 56 Z" fill={paint.deep} strokeLinejoin="round" />
        <path d="M58 62 L55 42 L74 56 Z M142 62 L145 42 L126 56 Z" fill="#F79AB8" />
        <rect x="50" y="52" width="100" height="80" rx="30" fill={paint.light} />
        <rect x="62" y="66" width="76" height="50" rx="16" fill={INK} />
        <circle cx="100" cy="102" r="3" fill="#F79AB8" />
        {eyes}
      </g>
    );
  }
  return (
    <g>
      <circle cx="46" cy="92" r="8" fill={STEEL} />
      <circle cx="154" cy="92" r="8" fill={STEEL} />
      <rect x="50" y="52" width="100" height="80" rx="30" fill={paint.light} />
      <rect x="62" y="66" width="76" height="50" rx="16" fill={INK} />
      <ellipse cx="72" cy="112" rx="5" ry="3" fill="#F79AB8" fillOpacity="0.85" />
      <ellipse cx="128" cy="112" rx="5" ry="3" fill="#F79AB8" fillOpacity="0.85" />
      {eyes}
    </g>
  );
}

function Body({ id, paint }: { id: string; paint: Paint }) {
  if (id === 'body-barrel') {
    return (
      <g>
        <rect x="52" y="140" width="96" height="76" rx="36" fill={paint.main} />
        <path d="M56 162 H144 M56 194 H144" stroke={paint.deep} strokeWidth="5" strokeLinecap="round" />
        <circle cx="100" cy="178" r="8" fill={SUN} />
      </g>
    );
  }
  if (id === 'body-heart') {
    return (
      <g>
        <rect x="58" y="142" width="84" height="72" rx="14" fill={paint.main} />
        <rect x="70" y="152" width="60" height="52" rx="10" fill={paint.deep} opacity="0.35" />
        <path d="M100 196 C80 182 78 168 88 164 C94 162 98 166 100 170 C102 166 106 162 112 164 C122 168 120 182 100 196 Z" fill="#F2607E" stroke="#FFFFFF" strokeWidth="2" />
      </g>
    );
  }
  if (id === 'body-gear') {
    return (
      <g>
        <rect x="58" y="142" width="84" height="72" rx="14" fill={paint.main} />
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="95" y="154" width="10" height="10" rx="2" fill={SUN} transform={`rotate(${i * 45} 100 178)`} />
        ))}
        <circle cx="100" cy="178" r="17" fill={SUN} />
        <circle cx="100" cy="178" r="7" fill={paint.deep} />
      </g>
    );
  }
  return (
    <g>
      <rect x="58" y="142" width="84" height="72" rx="14" fill={paint.main} />
      <circle cx="100" cy="176" r="12" fill={SUN} />
      <path d="M101 168 L94 178 H101 L98 186 L106 175 H99 Z" fill={INK} />
    </g>
  );
}

function Arms({ id, paint }: { id: string; paint: Paint }) {
  if (id === 'arms-claw') {
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M60 158 L36 186 M140 158 L164 186" stroke={STEEL} strokeWidth="9" />
        <path d="M26 182 a12 12 0 1 0 18 12" stroke={paint.deep} strokeWidth="6" />
        <path d="M174 182 a12 12 0 1 1 -18 12" stroke={paint.deep} strokeWidth="6" />
      </g>
    );
  }
  if (id === 'arms-spring') {
    return (
      <g>
        <path d="M58 158 l-8 8 l-4 -10 l-8 8 l-4 -10 l-8 8 l-2 14" fill="none" stroke={STEEL} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M142 158 l8 8 l4 -10 l8 8 l4 -10 l8 8 l2 14" fill="none" stroke={STEEL} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24" cy="184" r="9" fill={paint.light} />
        <circle cx="176" cy="184" r="9" fill={paint.light} />
      </g>
    );
  }
  if (id === 'arms-magnet') {
    return (
      <g fill="none" strokeLinecap="round">
        <path d="M60 158 L38 180 M140 158 L162 180" stroke={STEEL} strokeWidth="9" />
        <path d="M24 182 v6 a12 12 0 0 0 24 0 v-6" stroke="#E0533A" strokeWidth="9" />
        <path d="M152 182 v6 a12 12 0 0 0 24 0 v-6" stroke="#E0533A" strokeWidth="9" />
        <path d="M24 180 v4 M48 180 v4 M152 180 v4 M176 180 v4" stroke="#E3EBF4" strokeWidth="9" />
      </g>
    );
  }
  return (
    <g>
      <path d="M60 158 L38 188 M140 158 L162 188" stroke={STEEL} strokeWidth="9" strokeLinecap="round" />
      <circle cx="36" cy="191" r="9" fill={paint.light} />
      <circle cx="164" cy="191" r="9" fill={paint.light} />
    </g>
  );
}

function Legs({ id }: { id: string }) {
  if (id === 'legs-wheels') {
    return (
      <g>
        <rect x="60" y="212" width="80" height="14" rx="6" fill={STEEL} />
        {[72, 128].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="246" r="22" fill={INK} />
            <circle cx={cx} cy="246" r="9" fill={STEEL} />
          </g>
        ))}
      </g>
    );
  }
  if (id === 'legs-rocket') {
    return (
      <g>
        <path d="M74 212 H126 L116 244 H84 Z" fill={STEEL} stroke="#5E7184" strokeWidth="3" strokeLinejoin="round" />
        <path d="M86 244 Q100 282 114 244 Z" fill={SUN} />
        <path d="M93 244 Q100 266 107 244 Z" fill="#F2603A" />
      </g>
    );
  }
  if (id === 'legs-tracks') {
    return (
      <g>
        <rect x="84" y="212" width="32" height="16" rx="5" fill={STEEL} />
        <rect x="46" y="226" width="108" height="40" rx="20" fill={INK} />
        <rect x="52" y="232" width="96" height="28" rx="14" fill="#5E7184" />
        {[66, 90, 110, 134].map((cx) => (
          <circle key={cx} cx={cx} cy="246" r="9" fill={STEEL} />
        ))}
      </g>
    );
  }
  return (
    <g>
      <rect x="72" y="212" width="18" height="38" rx="6" fill={STEEL} />
      <rect x="110" y="212" width="18" height="38" rx="6" fill={STEEL} />
      <rect x="62" y="246" width="34" height="18" rx="9" fill={INK} />
      <rect x="104" y="246" width="34" height="18" rx="9" fill={INK} />
    </g>
  );
}

/** One tap on a part card, played on the robot: the changed part moves on its own joint, once. */
export interface PartMotion {
  /** Counts up on every tap, so tapping the same card again replays it. */
  n: number;
  slot: PartSlot;
  /** buy: a new part; swap: back to one it owns; same: the part it already wears. */
  kind: 'buy' | 'swap' | 'same';
  /** The part it wore before, which lifts away. */
  from?: string;
}

type DrawnSlot = Exclude<PartSlot, 'paint'>;

/** Back to front, as the robot is drawn. */
const LAYERS: DrawnSlot[] = ['legs', 'arms', 'body', 'antenna', 'head'];

/** Where each part meets the robot, in drawing units: it turns, squashes and grows around this point. */
function jointOf(slot: DrawnSlot, top: number): [number, number] {
  if (slot === 'head') return [100, 132];
  if (slot === 'antenna') return [100, top];
  if (slot === 'body') return [100, 214];
  if (slot === 'arms') return [100, 158];
  return [100, 212];
}

/** Where the sparks and the bolt sit: on the seam the child should look at. */
function seamsOf(slot: PartSlot, top: number): [number, number][] {
  if (slot === 'head') return [[100, 134]];
  if (slot === 'antenna') return [[100, top]];
  if (slot === 'body') return [[100, 144]];
  if (slot === 'arms') return [[60, 158], [140, 158]];
  if (slot === 'legs') return [[100, 214]];
  return [[100, top - 2]];
}

const RAYS = Array.from({ length: 8 }, (_, i) => {
  const a = (Math.PI / 4) * i + Math.PI / 8;
  return `M${(16 * Math.cos(a)).toFixed(1)} ${(16 * Math.sin(a)).toFixed(1)} L${(28 * Math.cos(a)).toFixed(1)} ${(28 * Math.sin(a)).toFixed(1)}`;
}).join(' ');

function drawPart(slot: DrawnSlot, id: string, paint: Paint, top: number) {
  if (slot === 'legs') return <Legs id={id} />;
  if (slot === 'arms') return <Arms id={id} paint={paint} />;
  if (slot === 'body') return <Body id={id} paint={paint} />;
  if (slot === 'antenna') return <Antenna id={id} top={top} />;
  return <Head id={id} paint={paint} />;
}

/** The child's robot, standing; 200 × 280 drawing units. */
export function RobotFigure({ look, width = 200, className, motion }: { look: RobotLook; width?: number; className?: string; motion?: PartMotion | null }) {
  const paint = PAINTS[look.paint] ?? PAINTS['paint-teal'];
  const top = HEADS[look.head]?.top ?? 52;
  const m = motion ?? null;
  const ab = m && m.n % 2 ? 'a' : 'b';
  const repaint = m?.slot === 'paint' && m.kind !== 'same';
  // The whole robot hops once for a new part, and wiggles when its colour is tapped again.
  const all = !m ? '' : m.kind === 'buy' ? ` rp-hop-${ab}${repaint ? ' rp-hop--soon' : ''}` : m.slot === 'paint' && m.kind === 'same' ? ` rp-wiggle-${ab}` : '';
  const cls = [className, repaint ? 'robot--repaint' : ''].filter(Boolean).join(' ') || undefined;

  const layer = (slot: DrawnSlot) => {
    const [jx, jy] = jointOf(slot, top);
    const origin = { transformOrigin: `${jx}px ${jy}px` };
    const here = m?.slot === slot ? m : null;
    const moving = here && here.kind !== 'same';
    const arrive = slot === 'head' || slot === 'antenna' ? 'rp-drop' : 'rp-grow';
    return (
      <Fragment key={slot}>
        {moving && here.from && (
          <g key={`out-${here.n}`} className={`rp ${slot === 'legs' ? 'rp-lift-side' : 'rp-lift'}`} style={origin}>
            {drawPart(slot, here.from, paint, top)}
          </g>
        )}
        <g key={here ? here.n : 0} className={`rp rp--${slot}${!here ? '' : moving ? ` ${arrive}` : ` rp-wiggle-${ab}`}`} style={origin}>
          {drawPart(slot, look[slot], paint, top)}
        </g>
      </Fragment>
    );
  };

  return (
    <svg className={cls} aria-hidden="true" width={width} height={Math.round(width * 1.4)} viewBox="0 0 200 280" overflow="visible">
      <g className={`rp${all}`} style={{ transformOrigin: '100px 268px' }}>
        {layer('legs')}
        {layer('arms')}
        <rect x="90" y="128" width="20" height="16" fill={STEEL} />
        {LAYERS.slice(2).map(layer)}
      </g>
      {m && m.kind !== 'same' && (
        <g key={`fx-${m.n}`}>
          {seamsOf(m.slot, top).map(([x, y]) => (
            <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
              {repaint && (
                <g className="rp-fx rp-drip">
                  <path d="M0 -22 C6 -12 10 -7 10 -2 a10 10 0 0 1 -20 0 C-10 -7 -6 -12 0 -22 Z" fill={paint.light} stroke="#FFFFFF" strokeWidth="2" />
                </g>
              )}
              <g className={`rp-fx rp-spark${repaint ? ' rp-spark--late' : ''}`}>
                <path d={RAYS} stroke={repaint ? paint.light : SUN} strokeWidth="5" strokeLinecap="round" />
              </g>
              {m.kind === 'buy' && !repaint && (
                <g className="rp-fx rp-twist">
                  <polygon points="0,-10 8.7,-5 8.7,5 0,10 -8.7,5 -8.7,-5" fill="#F2B33D" stroke="#C98A1A" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M-4 0 H4" stroke="#7A5300" strokeWidth="2.4" strokeLinecap="round" />
                </g>
              )}
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

/** The robot on the workbench, as the child has built it so far. */
export function MyRobot({ progress, width }: { progress: Progress; width?: number }) {
  return <RobotFigure look={lookOf(progress)} width={width} />;
}

/** A small picture for each part slot, on the slot tabs. */
export function SlotIcon({ slot }: { slot: PartSlot }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg aria-hidden="true" width="34" height="34" viewBox="0 0 24 24">
      {slot === 'head' && (
        <>
          <rect x="4" y="5" width="16" height="13" rx="5" {...s} />
          <path d="M9 11h.01M15 11h.01" {...s} strokeWidth={3.4} />
        </>
      )}
      {slot === 'antenna' && (
        <>
          <path d="M12 22V9" {...s} />
          <circle cx="12" cy="6" r="3" {...s} />
        </>
      )}
      {slot === 'body' && (
        <>
          <rect x="5" y="4" width="14" height="16" rx="4" {...s} />
          <circle cx="12" cy="12" r="2.5" {...s} />
        </>
      )}
      {slot === 'arms' && <path d="M4 18l6-7h4l6 7M12 11V5" {...s} />}
      {slot === 'legs' && (
        <>
          <circle cx="7" cy="16" r="4" {...s} />
          <circle cx="17" cy="16" r="4" {...s} />
          <path d="M7 12V7h10v5" {...s} />
        </>
      )}
      {slot === 'paint' && (
        <>
          <path d="M12 3c3 4 6 7 6 10a6 6 0 0 1-12 0c0-3 3-6 6-10z" {...s} />
        </>
      )}
    </svg>
  );
}

/** The robot friends, side on; 120 × 100 drawing units. */
export function FriendArt({ id, width = 120 }: { id: FriendId; width?: number }) {
  return (
    <svg aria-hidden="true" width={width} height={Math.round((width * 100) / 120)} viewBox="0 0 120 100">
      {id === 'dog' && (
        <g>
          <path d="M22 44 L10 30" stroke={STEEL} strokeWidth="5" strokeLinecap="round" />
          <circle cx="9" cy="28" r="5" fill={SUN} />
          <rect x="20" y="40" width="62" height="34" rx="12" fill="#E8893A" />
          <rect x="28" y="70" width="10" height="22" rx="4" fill={STEEL} />
          <rect x="64" y="70" width="10" height="22" rx="4" fill={STEEL} />
          <rect x="70" y="18" width="40" height="34" rx="12" fill="#F5AC66" />
          <path d="M74 20 L70 4 L86 16 Z" fill="#A85417" />
          <rect x="78" y="26" width="26" height="16" rx="7" fill={INK} />
          <circle cx="86" cy="34" r="3" fill={SCREEN} />
          <circle cx="97" cy="34" r="3" fill={SCREEN} />
          <circle cx="111" cy="40" r="4" fill={INK} />
        </g>
      )}
      {id === 'drone' && (
        <g>
          <path d="M24 34 H96" stroke={STEEL} strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="24" cy="26" rx="20" ry="5" fill="#C3CCD6" />
          <ellipse cx="96" cy="26" rx="20" ry="5" fill="#C3CCD6" />
          <path d="M24 26 V34 M96 26 V34" stroke={STEEL} strokeWidth="5" />
          <rect x="38" y="30" width="44" height="34" rx="16" fill="#7E6BD6" />
          <rect x="46" y="38" width="28" height="16" rx="7" fill={INK} />
          <circle cx="55" cy="46" r="3" fill={SCREEN} />
          <circle cx="65" cy="46" r="3" fill={SCREEN} />
          <path d="M50 64 L44 76 M70 64 L76 76" stroke={STEEL} strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
      {id === 'mini' && (
        <g>
          <path d="M60 18 V8" stroke={STEEL} strokeWidth="4" strokeLinecap="round" />
          <circle cx="60" cy="6" r="5" fill={SUN} />
          <rect x="38" y="18" width="44" height="34" rx="12" fill="#4FB7B3" />
          <rect x="44" y="24" width="32" height="22" rx="7" fill={INK} />
          <circle cx="54" cy="34" r="3" fill={SCREEN} />
          <circle cx="66" cy="34" r="3" fill={SCREEN} />
          <rect x="44" y="54" width="32" height="26" rx="8" fill="#2E9C97" />
          <path d="M44 62 L34 72 M76 62 L86 72" stroke={STEEL} strokeWidth="4" strokeLinecap="round" />
          <rect x="46" y="80" width="10" height="12" rx="4" fill={INK} />
          <rect x="64" y="80" width="10" height="12" rx="4" fill={INK} />
        </g>
      )}
      {id === 'bird' && (
        <g>
          <path d="M30 50 L8 38 L14 58 Z" fill="#3D7BD9" />
          <ellipse cx="54" cy="56" rx="30" ry="22" fill="#6A9DE8" />
          <path d="M40 54 q14 14 28 0" fill="none" stroke="#1F4F9A" strokeWidth="4" strokeLinecap="round" />
          <rect x="66" y="18" width="38" height="32" rx="14" fill="#6A9DE8" />
          <rect x="72" y="25" width="26" height="16" rx="7" fill={INK} />
          <circle cx="80" cy="33" r="3" fill={SCREEN} />
          <circle cx="91" cy="33" r="3" fill={SCREEN} />
          <path d="M104 30 L116 36 L104 42 Z" fill={SUN} />
          <path d="M84 18 V8" stroke={STEEL} strokeWidth="4" strokeLinecap="round" />
          <circle cx="84" cy="6" r="4" fill={SUN} />
          <path d="M46 76 V90 M62 76 V90 M40 90 H52 M56 90 H68" stroke={STEEL} strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
      {id === 'turtle' && (
        <g>
          <rect x="16" y="66" width="12" height="20" rx="5" fill={STEEL} />
          <rect x="70" y="66" width="12" height="20" rx="5" fill={STEEL} />
          <path d="M10 70 C10 30 88 30 88 70 Z" fill="#4C9F45" />
          <path d="M30 46 L49 40 L68 46 L64 64 H34 Z" fill="#73BE68" stroke="#2E6B2A" strokeWidth="3" strokeLinejoin="round" />
          <rect x="6" y="66" width="86" height="10" rx="5" fill="#2E6B2A" />
          <rect x="84" y="44" width="30" height="26" rx="11" fill="#73BE68" />
          <rect x="89" y="50" width="20" height="13" rx="6" fill={INK} />
          <circle cx="95" cy="56" r="2.6" fill={SCREEN} />
          <circle cx="103" cy="56" r="2.6" fill={SCREEN} />
        </g>
      )}
      {id === 'cat' && (
        <g>
          <path d="M22 60 C4 56 6 30 18 30" fill="none" stroke={STEEL} strokeWidth="5" strokeLinecap="round" />
          <rect x="20" y="48" width="60" height="30" rx="14" fill="#E6B325" />
          <rect x="26" y="74" width="10" height="18" rx="4" fill={STEEL} />
          <rect x="62" y="74" width="10" height="18" rx="4" fill={STEEL} />
          <path d="M70 28 L74 10 L86 24 Z M98 24 L110 10 L112 28 Z" fill="#9C7410" />
          <rect x="68" y="22" width="46" height="36" rx="14" fill="#F5CF55" />
          <rect x="74" y="30" width="34" height="18" rx="8" fill={INK} />
          <path d="M80 40 q4 -5 8 0 M94 40 q4 -5 8 0" fill="none" stroke={SCREEN} strokeWidth="2.6" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

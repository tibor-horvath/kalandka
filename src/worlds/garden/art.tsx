import type { FlowerKind } from './games/patterns/logic';
import type { SpeciesId } from './games/water/logic';
import { Bloom, turns } from './blooms';
import { Csepi } from '../../components/Csepi';

/** Csepi asleep on a big leaf, tucked in under a smaller one: the rest screen after the garden. Laid out by .rest-scene. */
export function CsepiResting({ night = false }: { night?: boolean }) {
  const leaf = night ? '#3B7A44' : '#5BAA4A';
  const cover = night ? '#4C8F52' : '#7CC46A';
  const vein = night ? '#2A5E33' : '#3F8F3A';
  return (
    <div className="rest-scene">
      <svg className="rest-scene__bed" aria-hidden="true" viewBox="0 0 540 200">
        <path d="M20 120 C110 10 420 0 520 90 C430 170 140 200 20 120 Z" fill={leaf} />
        <path d="M40 118 C200 80 380 70 500 92" stroke={vein} strokeWidth="6" fill="none" strokeLinecap="round" />
      </svg>
      <Csepi mood="sleep" width={190} className="rest-scene__guide" />
      <svg className="rest-scene__cover" aria-hidden="true" viewBox="0 0 380 110">
        <path d="M0 50 C80 0 300 0 380 40 C300 100 80 110 0 50 Z" fill={cover} />
        <path d="M20 50 C120 40 260 36 360 42" stroke={vein} strokeWidth="4" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export const DROP_PATH = 'M12 2 C12 2 4 11 4 16 a8 8 0 0 0 16 0 C20 11 12 2 12 2 Z';

export function Drop({ size = 40, color = '#2E86DE' }: { size?: number; color?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={Math.round(size * 1.1)} viewBox="0 0 24 26">
      <path d={DROP_PATH} fill={color} />
    </svg>
  );
}

export function Cloud() {
  return (
    <svg aria-hidden="true" width="250" height="120" viewBox="0 0 250 120">
      <circle cx="70" cy="70" r="40" fill="#FFFFFF" />
      <circle cx="125" cy="52" r="50" fill="#FFFFFF" />
      <circle cx="182" cy="72" r="38" fill="#FFFFFF" />
      <rect x="40" y="70" width="175" height="44" rx="22" fill="#FFFFFF" />
      <circle cx="100" cy="72" r="5" fill="#1F3B2C" />
      <circle cx="150" cy="72" r="5" fill="#1F3B2C" />
      <path d="M112 88 Q125 98 138 88" stroke="#1F3B2C" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Pot() {
  return (
    <svg aria-hidden="true" width="200" height="130" viewBox="0 0 200 130">
      <path d="M22 26 H178 L158 130 H42 Z" fill="#C8693E" />
      <rect x="8" y="2" width="184" height="34" rx="10" fill="#D97E4F" />
    </svg>
  );
}

/** The watered plant: a bud on a stem until it has its drops, then the real species in bloom. */
export function GrowingPlant({ species, petal, bloom, width = 240 }: { species: SpeciesId; petal: string; bloom: boolean; width?: number }) {
  return (
    <svg aria-hidden="true" width={width} height={Math.round(width * 1.25)} viewBox="0 0 240 300">
      {bloom ? (
        <Bloom species={species} />
      ) : (
        <g>
          <path d="M120 300 C114 240 126 170 120 96" stroke="#3F8F3A" strokeWidth="11" fill="none" strokeLinecap="round" />
          <path d="M118 236 C96 214 66 214 48 226 C66 248 98 250 118 236 Z" fill="#5BAA4A" />
          <path d="M122 186 C144 162 176 160 194 172 C176 196 144 200 122 186 Z" fill="#7CC35C" />
          <ellipse cx="120" cy="84" rx="20" ry="30" fill="#5BAA4A" />
          <path d="M106 66 Q120 40 134 66 Z" fill={petal} />
        </g>
      )}
    </svg>
  );
}

const COSMOS_PETAL = 'M0 -6 C-9 -10 -14 -24 -12 -32 L-8 -30 L-4 -34 L0 -31 L4 -34 L8 -30 L12 -32 C14 -24 9 -10 0 -6 Z';

/** A cosmos head (radius 34 at scale 1): eight toothed petals round a yellow middle. Cosmos grows in many colours, so it suits the counters. */
function CosmosHead({ x, y, scale, petal }: { x: number; y: number; scale: number; petal: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {turns(8).map((a) => (
        <path key={a} d={COSMOS_PETAL} fill={petal} stroke="#00000018" strokeWidth="1" transform={`rotate(${a})`} />
      ))}
      <circle r="9" fill="#F2B01E" />
      <circle r="5" fill="#FFD54A" />
    </g>
  );
}

/** A grown flower (cosmos) for counting, the garden strip and plot cards. */
export function RoundFlower({ petal, width = 120 }: { petal: string; width?: number }) {
  return (
    <svg aria-hidden="true" width={width} height={Math.round(width * 1.08)} viewBox="0 0 120 130">
      <path d="M60 130 V64" stroke="#3F8F3A" strokeWidth="7" strokeLinecap="round" />
      <path
        d="M60 110 L40 96 M48 102 L42 108 M50 103 L46 90 M60 94 L80 80 M72 86 L78 92 M70 87 L74 74"
        stroke="#5BAA4A"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <CosmosHead x={60} y={44} scale={1.1} petal={petal} />
    </svg>
  );
}

const SUN_RAY = 'M0 -11 C4.5 -15 4.5 -23 0 -28 C-4.5 -23 -4.5 -15 0 -11 Z';
const FORGET_ME_NOT: [number, number][] = [
  [40, 24], [49.5, 30.9], [45.9, 42.1], [34.1, 42.1], [30.5, 30.9]
];

/** Pattern-game flowers: each kind differs in colour, lightness AND shape, so colour-blind children can play. */
export function PatternFlower({ kind, width = 110 }: { kind: FlowerKind; width?: number }) {
  return (
    <svg aria-hidden="true" width={width} height={Math.round(width * 1.375)} viewBox="0 0 80 110">
      {kind === 'tulip' && (
        <>
          <path d="M40 110 V50" stroke="#3F8F3A" strokeWidth="6" strokeLinecap="round" />
          <path d="M38 108 C26 92 22 76 26 60 C32 76 38 90 44 108 Z" fill="#6FA35E" />
          <path d="M28 34 C30 22 36 16 40 14 C44 16 50 22 52 34 Z" fill="#A82424" />
          <path d="M38 54 C25 53 21 38 23 17 C31 23 37 30 41 41 Z" fill="#B82E2E" />
          <path d="M42 54 C55 53 59 38 57 17 C49 23 43 30 39 41 Z" fill="#B82E2E" />
          <path d="M40 16 C48 20 51 36 49 47 C46 54 34 54 31 47 C29 36 32 20 40 16 Z" fill="#D63B3B" />
        </>
      )}
      {kind === 'sun' && (
        <>
          <path d="M40 110 V60" stroke="#3F8F3A" strokeWidth="7" strokeLinecap="round" />
          <path d="M39 92 C30 80 16 80 10 90 C18 100 32 100 39 92 Z" fill="#5BAA4A" />
          <g transform="translate(40 36)">
            {turns(16).map((a) => (
              <path key={a} d={SUN_RAY} fill="#FFC93C" transform={`rotate(${a})`} />
            ))}
            <circle r="12" fill="#5A3418" />
            <circle r="7" fill="#6E4322" />
          </g>
        </>
      )}
      {kind === 'star' && (
        <>
          <path d="M40 110 V46 M40 70 Q50 56 56 34" stroke="#3F8F3A" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M39 96 C30 92 22 84 20 76 C28 76 36 84 39 96 Z" fill="#5BAA4A" />
          <circle cx="58" cy="26" r="3.6" fill="#F2A7C3" />
          <circle cx="63" cy="33" r="3.2" fill="#F2A7C3" />
          {FORGET_ME_NOT.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="9.5" fill="#6FA8F0" />
          ))}
          <circle cx="40" cy="34" r="6" fill="#FFFFFF" />
          <circle cx="40" cy="34" r="3.4" fill="#FFC93C" />
        </>
      )}
    </svg>
  );
}

/** The flower head of a Virágsor kind, small, for the growing bunches. */
const BUNCH_PETAL: Record<FlowerKind, string> = { tulip: '#D63B3B', sun: '#FFC93C', star: '#6FA8F0' };
const BUNCH_HEART: Record<FlowerKind, string> = { tulip: '#FFE08A', sun: '#5A3418', star: '#FFFFFF' };

/**
 * A growing bunch: up to ten flower heads in rows of two, filled from the bottom, so each step up shows
 * as a taller bunch and a count in twos reads as whole rows.
 */
export function PatternBunch({ kind, n, width = 72 }: { kind: FlowerKind; n: number; width?: number }) {
  return (
    <svg aria-hidden="true" width={width} height={Math.round(width * 2.4)} viewBox="0 0 60 144">
      {Array.from({ length: n }, (_, i) => {
        const cx = i % 2 === 0 ? 17 : 43;
        const cy = 130 - Math.floor(i / 2) * 28;
        return (
          <g key={i} transform={`translate(${cx} ${cy})`}>
            {turns(5).map((a) => (
              <ellipse key={a} cx="0" cy="-7" rx="5.6" ry="7" fill={BUNCH_PETAL[kind]} transform={`rotate(${a})`} />
            ))}
            <circle r="4.6" fill={BUNCH_HEART[kind]} />
          </g>
        );
      })}
    </svg>
  );
}

export function Sprout() {
  return (
    <svg aria-hidden="true" width="110" height="104" viewBox="0 0 110 104">
      <path d="M55 104 V52" stroke="#3F8F3A" strokeWidth="7" strokeLinecap="round" />
      <path d="M55 60 C55 40 40 32 24 34 C24 50 36 62 55 60 Z" fill="#5BAA4A" />
      <path d="M55 54 C55 34 70 24 88 26 C88 44 74 56 55 54 Z" fill="#7CC35C" />
      <path d="M92 6 C92 6 82 18 82 25 a10 10 0 0 0 20 0 C102 18 92 6 92 6 Z" fill="#2E86DE" />
    </svg>
  );
}

/** A small tree: "harder" in Csepi's level offer (sprout = easier, flower = stay, tree = harder). */
export function Tree({ width = 96 }: { width?: number }) {
  return (
    <svg aria-hidden="true" width={width} height={Math.round(width * 1.1)} viewBox="0 0 96 106">
      <rect x="40" y="62" width="16" height="42" rx="6" fill="#8A5A3B" />
      <circle cx="48" cy="38" r="30" fill="#3F8F3A" />
      <circle cx="26" cy="52" r="20" fill="#5BAA4A" />
      <circle cx="70" cy="52" r="20" fill="#5BAA4A" />
      <circle cx="48" cy="22" r="18" fill="#7CC35C" />
      <circle cx="36" cy="36" r="5" fill="#F2603A" />
      <circle cx="62" cy="30" r="5" fill="#F2603A" />
      <circle cx="58" cy="54" r="5" fill="#F2603A" />
    </svg>
  );
}

/** Watering can: pours five drops at once on the two-ten-frame plants. */
export function WateringCan({ width = 110 }: { width?: number }) {
  return (
    <svg aria-hidden="true" width={width} height={Math.round(width * 0.78)} viewBox="0 0 110 86">
      <path d="M30 26 Q30 6 52 6 Q74 6 74 26" stroke="#1F6FC0" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M72 44 L100 22" stroke="#2E86DE" strokeWidth="10" strokeLinecap="round" />
      <rect x="94" y="12" width="14" height="18" rx="4" transform="rotate(-38 101 21)" fill="#1F6FC0" />
      <rect x="16" y="26" width="62" height="54" rx="12" fill="#2E86DE" />
      <rect x="22" y="34" width="12" height="38" rx="6" fill="#FFFFFF" fillOpacity="0.3" />
      <path d="M8 40 Q2 52 14 58" stroke="#1F6FC0" strokeWidth="7" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** The Méhecske helper. Wings flap via the .bee__wing CSS class. */
export function Bee({ width = 80 }: { width?: number }) {
  return (
    <svg aria-hidden="true" width={width} height={Math.round(width * 0.75)} viewBox="0 0 80 60">
      <ellipse className="bee__wing" cx="34" cy="16" rx="13" ry="10" fill="#FFFFFF" fillOpacity="0.9" stroke="#9FC9E8" strokeWidth="2" />
      <ellipse className="bee__wing bee__wing--b" cx="50" cy="15" rx="12" ry="9" fill="#FFFFFF" fillOpacity="0.9" stroke="#9FC9E8" strokeWidth="2" />
      <path d="M64 34 L74 36 L64 40 Z" fill="#10233A" />
      <ellipse cx="42" cy="36" rx="24" ry="17" fill="#FFC93C" />
      <rect x="38" y="20" width="7" height="32" rx="3.5" fill="#10233A" />
      <rect x="50" y="22" width="6" height="27" rx="3" fill="#10233A" />
      <circle cx="21" cy="35" r="12" fill="#10233A" />
      <circle cx="17" cy="32" r="3.5" fill="#FFFFFF" />
      <path d="M14 40 Q18 43 22 40" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M18 24 Q14 14 10 12" stroke="#10233A" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="10" cy="12" r="2.5" fill="#10233A" />
    </svg>
  );
}

const BOUQUET_HEADS: [number, number][] = [
  [16, 14], [30, 8], [44, 14], [10, 28], [24, 24], [38, 24], [52, 28], [18, 40], [32, 38], [46, 40]
];

/** Ten flowers tied together: one ten. The "10" tag makes the value readable at a glance. */
export function Bouquet({ petal, width = 62 }: { petal: string; width?: number }) {
  return (
    <svg aria-hidden="true" width={width} height={Math.round(width * 1.45)} viewBox="0 0 62 90">
      <path d="M31 88 L22 50 M31 88 L31 46 M31 88 L40 50 M31 88 L14 44 M31 88 L48 44" stroke="#3F8F3A" strokeWidth="3" strokeLinecap="round" />
      {BOUQUET_HEADS.map(([x, y]) => (
        <CosmosHead key={`${x}-${y}`} x={x} y={y} scale={0.24} petal={petal} />
      ))}
      <rect x="18" y="62" width="26" height="18" rx="5" fill="#FFFFFF" stroke="#C2185B" strokeWidth="2.5" />
      <text x="31" y="76" textAnchor="middle" fontSize="14" fontWeight="800" fill="#10233A" fontFamily="'Baloo 2', sans-serif">10</text>
    </svg>
  );
}

/** Head positions for `count` flowers: up to five in the back row, the rest in a lower front row. */
function basketHeads(count: number): [number, number][] {
  const back = Math.min(count, 5);
  const front = count - back;
  const row = (n: number, y: number, spread: number): [number, number][] =>
    Array.from({ length: n }, (_, i) => [95 + (n === 1 ? 0 : (i / (n - 1) - 0.5) * spread), y]);
  return [...row(back, 22, 128), ...row(front, 42, 104)];
}

/** A flower basket for counting on: the number stands on the basket, and exactly that many flowers are inside. */
export function Basket({ petal, count }: { petal: string; count: number }) {
  return (
    <svg aria-hidden="true" width="190" height="150" viewBox="0 0 190 150">
      {basketHeads(count).map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <path d={`M${x} 70 V${y + 8}`} stroke="#3F8F3A" strokeWidth="4" strokeLinecap="round" />
          <CosmosHead x={x} y={y} scale={0.38} petal={petal} />
        </g>
      ))}
      <path d="M10 62 H180 L162 146 H28 Z" fill="#C98A4B" />
      <path d="M18 84 H172 M24 108 H166 M30 130 H160" stroke="#A86E37" strokeWidth="5" />
      <rect x="4" y="54" width="182" height="18" rx="9" fill="#B07A41" />
    </svg>
  );
}

/** Where the bee carries flowers on the take-away levels. */
export function Hive({ width = 110 }: { width?: number }) {
  return (
    <svg aria-hidden="true" width={width} height={Math.round(width * 0.82)} viewBox="0 0 110 90">
      <path d="M55 4 C28 4 14 22 14 48 C14 72 30 86 55 86 C80 86 96 72 96 48 C96 22 82 4 55 4 Z" fill="#FFC93C" />
      <path d="M20 30 H90 M15 50 H95 M20 70 H90" stroke="#E0A21F" strokeWidth="5" strokeLinecap="round" />
      <rect x="41" y="58" width="28" height="22" rx="11" fill="#10233A" />
    </svg>
  );
}

export function Seed({ size = 30 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 30 30">
      <ellipse cx="15" cy="16" rx="9" ry="12" fill="#B77B45" />
      <path d="M15 6 C12 12 12 20 15 27" stroke="#8A5A2E" strokeWidth="2" fill="none" />
    </svg>
  );
}

/** A small flower pot for Cserépbarátok, with soil showing at the rim. */
export function SmallPot({ width = 96 }: { width?: number }) {
  return (
    <svg aria-hidden="true" width={width} height={Math.round(width * 0.67)} viewBox="0 0 96 64">
      <path d="M12 16 H84 L74 64 H22 Z" fill="#C8693E" />
      <rect x="4" y="4" width="88" height="18" rx="7" fill="#D97E4F" />
      <ellipse cx="48" cy="7" rx="36" ry="4" fill="#6F4630" />
    </svg>
  );
}

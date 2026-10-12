import type { FlowerKind } from '../games/patterns/logic';

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

const PETALS_BIG: [number, number][] = [
  [154, 80], [144, 104], [120, 114], [96, 104], [86, 80], [96, 56], [120, 46], [144, 56]
];

/** The watered plant: stem, leaves, and either a bud or a smiling bloom. */
export function GrowingPlant({ petal, bloom }: { petal: string; bloom: boolean }) {
  return (
    <svg aria-hidden="true" width="240" height="300" viewBox="0 0 240 300">
      <path d="M120 300 C114 240 126 170 120 96" stroke="#3F8F3A" strokeWidth="11" fill="none" strokeLinecap="round" />
      <path d="M118 236 C96 214 66 214 48 226 C66 248 98 250 118 236 Z" fill="#5BAA4A" />
      <path d="M122 186 C144 162 176 160 194 172 C176 196 144 200 122 186 Z" fill="#7CC35C" />
      {bloom ? (
        <g>
          {PETALS_BIG.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="22" fill={petal} stroke="#00000014" strokeWidth="1" />
          ))}
          <circle cx="120" cy="80" r="24" fill="#7A4B26" />
          <circle cx="111" cy="76" r="3.5" fill="#1F1208" />
          <circle cx="129" cy="76" r="3.5" fill="#1F1208" />
          <path d="M112 86 Q120 93 128 86" stroke="#1F1208" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <ellipse cx="120" cy="84" rx="20" ry="30" fill="#5BAA4A" />
          <path d="M106 66 Q120 40 134 66 Z" fill={petal} />
        </g>
      )}
    </svg>
  );
}

const PETALS_SMALL: [number, number][] = [
  [82, 46], [75.6, 61.6], [60, 68], [44.4, 61.6], [38, 46], [44.4, 30.4], [60, 24], [75.6, 30.4]
];

/** A grown flower for the garden strip and plot cards. */
export function RoundFlower({ petal, width = 120 }: { petal: string; width?: number }) {
  return (
    <svg aria-hidden="true" width={width} height={Math.round(width * 1.08)} viewBox="0 0 120 130">
      <path d="M60 130 V60" stroke="#3F8F3A" strokeWidth="8" strokeLinecap="round" />
      <ellipse cx="44" cy="102" rx="17" ry="8" transform="rotate(-30 44 102)" fill="#5BAA4A" />
      <ellipse cx="76" cy="90" rx="17" ry="8" transform="rotate(30 76 90)" fill="#5BAA4A" />
      {PETALS_SMALL.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="14" fill={petal} stroke="#00000014" strokeWidth="1" />
      ))}
      <circle cx="60" cy="46" r="14" fill="#7A4B26" />
    </svg>
  );
}

const SUN_PETALS: [number, number][] = [
  [54, 36], [49.9, 45.9], [40, 50], [30.1, 45.9], [26, 36], [30.1, 26.1], [40, 22], [49.9, 26.1]
];

/** Pattern-game flowers: each kind differs in colour, lightness AND shape, so colour-blind children can play. */
export function PatternFlower({ kind, width = 110 }: { kind: FlowerKind; width?: number }) {
  return (
    <svg aria-hidden="true" width={width} height={Math.round(width * 1.375)} viewBox="0 0 80 110">
      <path d="M40 110 V48" stroke="#3F8F3A" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="30" cy="84" rx="12" ry="5" transform="rotate(-30 30 84)" fill="#5BAA4A" />
      {kind === 'tulip' && <path d="M22 26 L27 50 H53 L58 26 L49 36 L40 22 L31 36 Z" fill="#D63B3B" />}
      {kind === 'sun' && (
        <>
          {SUN_PETALS.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="9" fill="#FFC93C" />
          ))}
          <circle cx="40" cy="36" r="9" fill="#7A4B26" />
        </>
      )}
      {kind === 'star' && (
        <>
          <polygon points="40,14 45.9,27.9 60.9,29.2 49.5,38.8 52.9,53.8 40,46 27.1,53.8 30.5,38.8 19.1,29.2 34.1,27.9" fill="#3B6FD6" />
          <circle cx="40" cy="35" r="5" fill="#FFE08A" />
        </>
      )}
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
        <circle key={`${x}-${y}`} cx={x} cy={y} r="7.5" fill={petal} stroke="#00000022" strokeWidth="1" />
      ))}
      {BOUQUET_HEADS.map(([x, y]) => (
        <circle key={`c${x}-${y}`} cx={x} cy={y} r="2.6" fill="#7A4B26" />
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
          <circle cx={x} cy={y} r="12" fill={petal} stroke="#00000022" />
          <circle cx={x} cy={y} r="5" fill="#7A4B26" />
        </g>
      ))}
      <path d="M10 62 H180 L162 146 H28 Z" fill="#C98A4B" />
      <path d="M18 84 H172 M24 108 H166 M30 130 H160" stroke="#A86E37" strokeWidth="5" />
      <rect x="4" y="54" width="182" height="18" rx="9" fill="#B07A41" />
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

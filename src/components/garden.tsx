import type { CSSProperties, ReactElement } from 'react';
import type { DecorId, PlantKind, Sticker, TreatId, VisitorId } from '../state/rewards';
import { gameOf } from '../state/rewards';

// Artwork for the Kiskert and the sticker album. Plants share one 160 × 220 box standing on its
// bottom edge, so beds line up whatever grows in them.

const LEAF = '#3F8F3A';
const LEAF_LIGHT = '#5BAA4A';
/** A thirsty plant's leaves: paler and duller, never brown or dead. */
const DRY = '#8FA857';
const DRY_LIGHT = '#AFC273';

const BERRIES = [
  [58, 50],
  [96, 40],
  [112, 78],
  [72, 88],
  [40, 86]
];
const PEARS = [
  [58, 60],
  [108, 50],
  [120, 100],
  [80, 96],
  [44, 108]
];

function Flower() {
  return (
    <g transform="translate(20 50)">
      <path d="M60 165V70" stroke={LEAF} strokeWidth="7" strokeLinecap="round" />
      <ellipse cx="40" cy="120" rx="20" ry="9" fill={LEAF_LIGHT} transform="rotate(-30 40 120)" />
      <ellipse cx="80" cy="105" rx="20" ry="9" fill={LEAF_LIGHT} transform="rotate(30 80 105)" />
      <g fill="#F4A3C4">
        <circle cx="60" cy="34" r="18" />
        <circle cx="86" cy="54" r="18" />
        <circle cx="76" cy="82" r="18" />
        <circle cx="44" cy="82" r="18" />
        <circle cx="34" cy="54" r="18" />
      </g>
      <circle cx="60" cy="60" r="15" fill="#FFC93C" />
    </g>
  );
}

/** A thirsty bush sags a little lower and paler; its berries stay on. */
function Bush({ fruit = 5, dry = false }: { fruit?: number; dry?: boolean }) {
  return (
    <g transform={dry ? 'translate(0 98) scale(1 0.92)' : 'translate(0 90)'}>
      <circle cx="50" cy="80" r="42" fill={dry ? DRY : LEAF} />
      <circle cx="110" cy="80" r="42" fill={dry ? DRY : LEAF} />
      <circle cx="80" cy="52" r="46" fill={dry ? DRY_LIGHT : LEAF_LIGHT} />
      <g fill="#2E86DE">
        {BERRIES.slice(0, fruit).map(([x, y]) => (
          <circle key={`${x},${y}`} cx={x} cy={y} r="8" />
        ))}
      </g>
    </g>
  );
}

/** A thirsty tree's crown droops a little and pales; its pears stay on. */
function PearTree({ fruit = 5, dry = false }: { fruit?: number; dry?: boolean }) {
  return (
    <g transform="translate(0 4) scale(0.94)">
      <path d="M74 228V130h22v98z" fill="#8A5A3B" />
      <path d="M85 150l-26-26M85 140l24-22" stroke="#8A5A3B" strokeWidth="9" strokeLinecap="round" />
      <g transform={dry ? 'translate(0 10)' : undefined}>
        <circle cx="85" cy="78" r="70" fill={dry ? DRY_LIGHT : LEAF_LIGHT} />
        <circle cx="50" cy="110" r="36" fill={dry ? DRY : LEAF} />
        <circle cx="122" cy="106" r="36" fill={dry ? DRY : LEAF} />
        <g fill="#FFC93C" stroke="#B07A10" strokeWidth="2">
          {PEARS.slice(0, fruit).map(([x, y]) => (
            <circle key={`${x},${y}`} cx={x} cy={y} r="11" />
          ))}
        </g>
      </g>
    </g>
  );
}

function Seedling() {
  return (
    <g transform="translate(35 130)">
      <path d="M45 88V48" stroke={LEAF} strokeWidth="6" strokeLinecap="round" />
      <path d="M45 52c-6-18-22-24-34-20 2 14 16 24 34 20z" fill={LEAF_LIGHT} />
      <path d="M45 44c6-18 22-24 34-20-2 14-16 24-34 20z" fill={LEAF} />
    </g>
  );
}

/** A planting in the Kiskert: a seedling until it has grown, then the plant with its ripe fruit. */
export function GardenPlant({ kind, grown, fruit = 0, thirsty = false }: { kind: PlantKind; grown: boolean; fruit?: number; thirsty?: boolean }) {
  return (
    <svg aria-hidden="true" className={`gplant gplant--${grown ? kind : 'sprout'}${thirsty ? ' gplant--thirsty' : ''}`} viewBox="0 0 160 220">
      {!grown ? (
        <Seedling />
      ) : kind === 'flower' ? (
        <Flower />
      ) : kind === 'bush' ? (
        <Bush fruit={fruit} dry={thirsty} />
      ) : (
        <PearTree fruit={fruit} dry={thirsty} />
      )}
    </svg>
  );
}

/** A picked pear, for the basket. */
export function PearIcon({ size = 28 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={Math.round(size * 1.15)} viewBox="0 0 36 42">
      <path d="M18 2v6" stroke="#8A5A3B" strokeWidth="3" strokeLinecap="round" />
      <path d="M18 8c-5 0-6 6-6 9-4 3-7 8-7 13a13 12 0 0 0 26 0c0-5-3-10-7-13 0-3-1-9-6-9z" fill="#FFC93C" stroke="#B07A10" strokeWidth="2" />
    </svg>
  );
}

/** A picked bunch of blueberries, for the basket. */
export function BerryIcon({ size = 28 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 36 36">
      <path d="M18 4c2 4 6 5 10 4" stroke="#3F8F3A" strokeWidth="3" fill="none" strokeLinecap="round" />
      <g fill="#2E86DE" stroke="#1F5C9E" strokeWidth="2">
        <circle cx="12" cy="16" r="7" />
        <circle cx="24" cy="16" r="7" />
        <circle cx="18" cy="27" r="7" />
      </g>
    </svg>
  );
}

/** The watering can on the Kiskert's care button. */
export function CanIcon({ size = 34 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 18h22v20a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3z" />
      <path d="M32 22l10-8M40 12l4 4" />
      <path d="M14 18c0-6 4-10 7-10s7 4 7 10" />
    </svg>
  );
}

/** The drop badge on a thirsty plant. */
export function DropIcon({ size = 22 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={Math.round(size * 1.25)} viewBox="0 0 24 30">
      <path d="M12 2C8 9 3 14 3 20a9 9 0 0 0 18 0c0-6-5-11-9-18z" fill="currentColor" />
    </svg>
  );
}

/** The plant on a choice button in the Kiskert. */
export function PlantIcon({ kind }: { kind: PlantKind }) {
  return (
    <svg aria-hidden="true" className="gplant-icon" viewBox="0 0 160 220">
      {kind === 'flower' ? <Flower /> : kind === 'bush' ? <Bush /> : <PearTree />}
    </svg>
  );
}

function Hedgehog() {
  return (
    <g transform="translate(4 30) scale(0.34)">
      <g className="vis-part vis-hedgehog">
      <path d="M20 160C20 70 80 20 150 20s120 50 120 140z" fill="#6E4529" />
      <path d="M40 60l-20-24 34 6M80 30l-8-30 26 18M130 18l6-30 16 26M180 24l20-26 6 32M224 48l28-18-6 32M256 90l30-6-16 28M30 100l-28-6 22 26" fill="#6E4529" stroke="#6E4529" strokeWidth="6" strokeLinejoin="round" />
      <path d="M200 160c0-50 30-80 70-80 30 0 52 22 70 50 6 10 4 26-10 30z" fill="#E9C79A" />
      <circle cx="338" cy="148" r="11" fill="#10233A" />
      <path d="M262 112c4-6 12-6 16 0" stroke="#10233A" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="252" cy="134" r="10" fill="#F4A3C4" opacity="0.7" />
      <rect x="70" y="150" width="34" height="22" rx="11" fill="#6E4529" />
      <rect x="190" y="150" width="34" height="22" rx="11" fill="#6E4529" />
      </g>
    </g>
  );
}

function Ladybug() {
  return (
    <g transform="translate(60 56)">
      <g className="vis-part vis-ladybug">
      <path className="vis-part vis-legs" d="M-30 6h-12M30 6h12M-26 22l-12 8M26 22l12 8M-26-10l-12-8M26-10l12-8" stroke="#10233A" strokeWidth="4" strokeLinecap="round" />
      <circle cx="0" cy="-28" r="16" fill="#10233A" />
      <circle cx="-6" cy="-32" r="3.5" fill="#FFFFFF" />
      <circle cx="6" cy="-32" r="3.5" fill="#FFFFFF" />
      <circle cx="0" cy="6" r="34" fill="#E0533A" />
      <path d="M0-28V40" stroke="#10233A" strokeWidth="3" />
      <g fill="#10233A">
        <circle cx="-16" cy="-6" r="7" />
        <circle cx="16" cy="-6" r="7" />
        <circle cx="-14" cy="20" r="6" />
        <circle cx="14" cy="20" r="6" />
      </g>
      </g>
    </g>
  );
}

function Butterfly() {
  return (
    <g transform="translate(60 52)">
      <g className="vis-part vis-butterfly">
        <g className="vis-part vis-wing vis-wing--l">
          <ellipse cx="-24" cy="-14" rx="24" ry="28" fill="#F4A3C4" transform="rotate(-20 -24 -14)" />
          <ellipse cx="-20" cy="22" rx="16" ry="18" fill="#9FCDF3" />
          <circle cx="-26" cy="-16" r="7" fill="#FFC93C" />
        </g>
        <g className="vis-part vis-wing vis-wing--r">
          <ellipse cx="24" cy="-14" rx="24" ry="28" fill="#F4A3C4" transform="rotate(20 24 -14)" />
          <ellipse cx="20" cy="22" rx="16" ry="18" fill="#9FCDF3" />
          <circle cx="26" cy="-16" r="7" fill="#FFC93C" />
        </g>
        <rect x="-5" y="-30" width="10" height="64" rx="5" fill="#10233A" />
        <path d="M-2-30c-4-10-10-14-14-14M2-30c4-10 10-14 14-14" stroke="#10233A" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
}

function Blackbird() {
  return (
    <g transform="translate(8 14)">
      <g className="vis-part vis-blackbird">
        <path d="M8 58c10-6 24-4 30 2L18 76z" fill="#26313B" />
        <ellipse cx="54" cy="56" rx="36" ry="26" fill="#2F3B46" />
        <g className="vis-part vis-head">
          <circle cx="84" cy="34" r="20" fill="#2F3B46" />
          <path d="M100 30l16 6-16 6z" fill="#F2A33A" />
          <circle cx="90" cy="30" r="6" fill="#F2A33A" />
          <circle cx="90" cy="30" r="3" fill="#10233A" />
        </g>
        <path d="M44 80v10M60 80v10" stroke="#F2A33A" strokeWidth="4" strokeLinecap="round" />
        <path d="M36 52c10 8 24 10 38 4" stroke="#4A5966" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
}

function Frog() {
  return (
    <g transform="translate(10 18)">
      <ellipse cx="50" cy="58" rx="40" ry="24" fill="#5BAA4A" />
      <ellipse cx="50" cy="66" rx="26" ry="14" fill="#CDE7A6" />
      <circle cx="30" cy="30" r="14" fill="#5BAA4A" />
      <circle cx="70" cy="30" r="14" fill="#5BAA4A" />
      <circle cx="30" cy="28" r="8" fill="#FFFFFF" />
      <circle cx="70" cy="28" r="8" fill="#FFFFFF" />
      <circle cx="32" cy="29" r="4" fill="#10233A" />
      <circle cx="72" cy="29" r="4" fill="#10233A" />
      <path d="M34 52q16 10 32 0" stroke="#2E6B2A" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="24" cy="50" r="5" fill="#F4A3C4" opacity="0.7" />
      <circle cx="76" cy="50" r="5" fill="#F4A3C4" opacity="0.7" />
      <path d="M12 76c-6 2-10 6-8 8h20M88 76c6 2 10 6 8 8H76" fill="#3F8F3A" stroke="#3F8F3A" strokeWidth="4" strokeLinejoin="round" />
    </g>
  );
}

function Squirrel() {
  return (
    <g transform="translate(6 4)">
      <path d="M30 86C2 84-4 50 12 30c10-12 30-10 32 6 2 14-14 18-16 30-2 10 6 16 2 20z" fill="#C8642A" />
      <path d="M18 38c6-8 18-8 20 2" stroke="#E9A06A" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="62" cy="66" rx="24" ry="22" fill="#D9741A" />
      <ellipse cx="64" cy="72" rx="12" ry="12" fill="#F3D2A8" />
      <circle cx="78" cy="38" r="18" fill="#D9741A" />
      <path d="M68 24l2-14 10 10zM84 22l6-12 4 14z" fill="#B0561A" />
      <circle cx="84" cy="36" r="4" fill="#10233A" />
      <circle cx="95" cy="42" r="3.5" fill="#10233A" />
      <circle cx="80" cy="46" r="4" fill="#F4A3C4" opacity="0.7" />
      <ellipse cx="66" cy="60" rx="7" ry="8" fill="#8A5A3B" />
      <path d="M62 52h8" stroke="#5E3A22" strokeWidth="3" strokeLinecap="round" />
      <rect x="48" y="84" width="14" height="8" rx="4" fill="#B0561A" />
      <rect x="70" y="84" width="14" height="8" rx="4" fill="#B0561A" />
    </g>
  );
}

/** A Kiskert visitor, drawn in a 120 × 100 box. */
export function VisitorArt({ id, width = 120 }: { id: VisitorId; width?: number }) {
  return (
    <svg aria-hidden="true" className={`visitor-art visitor-art--${id}`} width={width} height={Math.round((width * 100) / 120)} viewBox="0 0 120 100">
      {id === 'hedgehog' ? (
        <Hedgehog />
      ) : id === 'ladybug' ? (
        <Ladybug />
      ) : id === 'butterfly' ? (
        <Butterfly />
      ) : id === 'frog' ? (
        <Frog />
      ) : id === 'squirrel' ? (
        <Squirrel />
      ) : (
        <Blackbird />
      )}
    </svg>
  );
}

function Jar({ fill, fruit }: { fill: string; fruit: 'pear' | 'berry' }) {
  return (
    <g>
      <rect x="14" y="12" width="44" height="12" rx="4" fill="#E0533A" />
      <path d="M14 18h44" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4 4" />
      <path d="M18 24h36v34a8 8 0 0 1-8 8H26a8 8 0 0 1-8-8z" fill="#EAF6FB" stroke="#9FCDF3" strokeWidth="3" />
      <path d="M21 34h30v24a5 5 0 0 1-5 5H26a5 5 0 0 1-5-5z" fill={fill} />
      {fruit === 'pear' ? (
        <path d="M36 38c-3 0-4 3-4 5-3 2-5 5-5 8a9 8 0 0 0 18 0c0-3-2-6-5-8 0-2-1-5-4-5z" fill="#FFE08A" stroke="#B07A10" strokeWidth="1.5" />
      ) : (
        <g fill="#7FB6EE">
          <circle cx="30" cy="44" r="4" />
          <circle cx="42" cy="46" r="4" />
          <circle cx="36" cy="54" r="4" />
        </g>
      )}
      <path d="M24 28v8" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    </g>
  );
}

/** A treat from the Kiskert's pantry, drawn in a 72 × 72 box. */
export function TreatArt({ id, size = 72 }: { id: TreatId; size?: number }) {
  return (
    <svg aria-hidden="true" className="treat-art" width={size} height={size} viewBox="0 0 72 72">
      {id === 'jam' && <Jar fill="#2E5FA8" fruit="berry" />}
      {id === 'compote' && <Jar fill="#F5CF55" fruit="pear" />}
      {id === 'pie' && (
        <g>
          <ellipse cx="36" cy="50" rx="30" ry="12" fill="#B9773D" />
          <path d="M6 46c0-12 14-20 30-20s30 8 30 20c0 6-14 10-30 10S6 52 6 46z" fill="#E8A95C" />
          <path d="M14 42h44M18 36h36M24 30h24M24 30l-6 16M36 28v18M48 30l6 16" stroke="#C98443" strokeWidth="3" strokeLinecap="round" />
          <circle cx="30" cy="39" r="3" fill="#2E5FA8" />
          <circle cx="44" cy="35" r="3" fill="#2E5FA8" />
          <circle cx="40" cy="43" r="3" fill="#FFC93C" />
        </g>
      )}
      {id === 'loaf' && (
        <g>
          <path d="M8 50c0-16 12-26 28-26s28 10 28 26c0 6-4 8-8 8H16c-4 0-8-2-8-8z" fill="#C98443" />
          <path d="M18 34c4 6 4 14 0 22M30 28c4 8 4 20 0 28M42 28c4 8 4 20 0 28M54 34c4 6 4 14 0 22" stroke="#A86A2E" strokeWidth="3" fill="none" strokeLinecap="round" />
          <g fill="#F3D2A8">
            <ellipse cx="24" cy="38" rx="2" ry="3" />
            <ellipse cx="36" cy="34" rx="2" ry="3" />
            <ellipse cx="48" cy="38" rx="2" ry="3" />
            <ellipse cx="30" cy="46" rx="2" ry="3" />
            <ellipse cx="42" cy="46" rx="2" ry="3" />
          </g>
        </g>
      )}
    </svg>
  );
}

// ---------- decorations the visitors leave ----------
// Each stands on the bottom edge of an 80 × 80 box, small and plain, so a corner of three reads at a glance.

const WOOD = '#B0763F';
const WOOD_DARK = '#7E5128';
const STONE = '#B8C2CC';
const WATER = '#7FB6EE';

const DECOR: Record<DecorId, () => ReactElement> = {
  mushroom: () => (
    <g>
      <path d="M32 78V56h16v22z" fill="#F3E6D0" />
      <path d="M14 58c0-16 12-28 26-28s26 12 26 28z" fill="#E0533A" />
      <circle cx="30" cy="44" r="4" fill="#FFFFFF" />
      <circle cx="48" cy="40" r="5" fill="#FFFFFF" />
      <circle cx="56" cy="52" r="3" fill="#FFFFFF" />
    </g>
  ),
  leaves: () => (
    <g>
      <ellipse cx="40" cy="70" rx="34" ry="12" fill="#C8642A" />
      <ellipse cx="26" cy="60" rx="14" ry="7" fill="#D9741A" transform="rotate(-20 26 60)" />
      <ellipse cx="52" cy="58" rx="14" ry="7" fill="#F2B33D" transform="rotate(18 52 58)" />
      <ellipse cx="40" cy="50" rx="13" ry="6" fill="#E0533A" transform="rotate(-6 40 50)" />
      <path d="M30 50h20M16 62l20-4M44 62l18-6" stroke="#8A4A1A" strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  'hedgehog-house': () => (
    <g>
      <path d="M8 78c0-30 14-46 32-46s32 16 32 46z" fill={WOOD} stroke={WOOD_DARK} strokeWidth="3" />
      <path d="M14 56h52M10 68h60" stroke={WOOD_DARK} strokeWidth="2.5" />
      <path d="M28 78V64a12 12 0 0 1 24 0v14z" fill="#4A2F18" />
      <ellipse cx="22" cy="40" rx="10" ry="5" fill="#C8642A" transform="rotate(-30 22 40)" />
      <ellipse cx="56" cy="38" rx="10" ry="5" fill="#F2B33D" transform="rotate(26 56 38)" />
    </g>
  ),
  'spotted-stone': () => (
    <g>
      <ellipse cx="40" cy="62" rx="30" ry="18" fill="#E0533A" />
      <path d="M40 44v36" stroke="#10233A" strokeWidth="3" />
      <circle cx="26" cy="58" r="5" fill="#10233A" />
      <circle cx="54" cy="58" r="5" fill="#10233A" />
      <circle cx="30" cy="70" r="4" fill="#10233A" />
      <circle cx="50" cy="70" r="4" fill="#10233A" />
    </g>
  ),
  fence: () => (
    <g fill="#FFFFFF" stroke="#8A9AA8" strokeWidth="2">
      <rect x="4" y="50" width="72" height="7" rx="2" />
      <rect x="4" y="64" width="72" height="7" rx="2" />
      <path d="M10 78V40l6-8 6 8v38zM34 78V36l6-8 6 8v42zM58 78V40l6-8 6 8v38z" />
    </g>
  ),
  daisies: () => (
    <g>
      {[14, 40, 66].map((x, k) => (
        <g key={x} transform={`translate(${x} ${k === 1 ? 34 : 46})`}>
          <path d={`M0 6V${k === 1 ? 44 : 32}`} stroke={LEAF} strokeWidth="4" strokeLinecap="round" />
          <g fill="#FFFFFF" stroke="#D5DADF" strokeWidth="1">
            <ellipse cx="0" cy="-8" rx="4" ry="7" />
            <ellipse cx="0" cy="8" rx="4" ry="7" />
            <ellipse cx="-8" cy="0" rx="7" ry="4" />
            <ellipse cx="8" cy="0" rx="7" ry="4" />
          </g>
          <circle r="5" fill="#FFC93C" />
        </g>
      ))}
    </g>
  ),
  lavender: () => (
    <g>
      {[22, 40, 58].map((x, k) => {
        const top = k === 1 ? 24 : 34;
        return (
          <g key={x}>
            <path d={`M40 78Q${x} 60 ${x} ${top}`} stroke={LEAF} strokeWidth="3" fill="none" />
            {[0, 1, 2, 3].map((d) => (
              <ellipse key={d} cx={x} cy={top + d * 7} rx="4.5" ry="4" fill={d % 2 ? '#7A4FB5' : '#9B76D1'} />
            ))}
          </g>
        );
      })}
    </g>
  ),
  sunflower: () => (
    <g>
      <path d="M40 78V36" stroke={LEAF} strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="30" cy="60" rx="10" ry="5" fill={LEAF_LIGHT} transform="rotate(-30 30 60)" />
      <ellipse cx="50" cy="66" rx="10" ry="5" fill={LEAF_LIGHT} transform="rotate(30 50 66)" />
      <g fill="#FFC93C">
        {Array.from({ length: 10 }, (_, k) => (
          <ellipse key={k} cx="40" cy="12" rx="5" ry="9" transform={`rotate(${k * 36} 40 26)`} />
        ))}
      </g>
      <circle cx="40" cy="26" r="9" fill="#8A5A3B" />
    </g>
  ),
  arch: () => (
    <g>
      <path d="M12 78V40a28 28 0 0 1 56 0v38" fill="none" stroke={LEAF} strokeWidth="7" />
      <g fill="#F4A3C4">
        <circle cx="12" cy="52" r="5" />
        <circle cx="16" cy="28" r="5" />
        <circle cx="30" cy="15" r="5" />
        <circle cx="50" cy="15" r="5" />
        <circle cx="64" cy="28" r="5" />
        <circle cx="68" cy="52" r="5" />
      </g>
      <g fill="#FFC93C">
        <circle cx="12" cy="66" r="4" />
        <circle cx="40" cy="12" r="4" />
        <circle cx="68" cy="66" r="4" />
      </g>
    </g>
  ),
  feeder: () => (
    <g>
      <path d="M38 78V54h4v24z" fill={WOOD_DARK} />
      <path d="M18 44h44l-4 10H22z" fill={WOOD} />
      <path d="M22 30v14M58 30v14" stroke={WOOD_DARK} strokeWidth="3" />
      <path d="M14 30l26-14 26 14z" fill="#E0533A" />
      <g fill="#F3D2A8">
        <ellipse cx="32" cy="42" rx="2" ry="3" />
        <ellipse cx="40" cy="40" rx="2" ry="3" />
        <ellipse cx="48" cy="42" rx="2" ry="3" />
      </g>
    </g>
  ),
  birdbath: () => (
    <g>
      <path d="M32 78l4-30h8l4 30z" fill={STONE} />
      <path d="M10 44c0 8 14 12 30 12s30-4 30-12z" fill={STONE} />
      <ellipse cx="40" cy="44" rx="30" ry="6" fill={WATER} />
      <path d="M28 44h10" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  ),
  birdhouse: () => (
    <g>
      <path d="M38 78V54h4v24z" fill={WOOD_DARK} />
      <path d="M22 54V30l18-14 18 14v24z" fill="#F2B33D" />
      <path d="M16 32l24-20 24 20" fill="none" stroke="#E0533A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="40" cy="36" r="7" fill="#4A2F18" />
      <path d="M40 48v4" stroke={WOOD_DARK} strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  reeds: () => (
    <g>
      <path d="M24 78V30M40 78V20M56 78V34" stroke="#6E8F3A" strokeWidth="4" strokeLinecap="round" />
      <rect x="20" y="28" width="8" height="18" rx="4" fill="#8A5A3B" />
      <rect x="36" y="18" width="8" height="20" rx="4" fill="#8A5A3B" />
      <rect x="52" y="32" width="8" height="16" rx="4" fill="#8A5A3B" />
      <path d="M32 78Q30 56 18 48M48 78Q52 60 66 54" stroke={LEAF_LIGHT} strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </g>
  ),
  'stepping-stones': () => (
    <g fill={STONE} stroke="#8A9AA8" strokeWidth="2">
      <ellipse cx="16" cy="72" rx="13" ry="6" />
      <ellipse cx="40" cy="62" rx="12" ry="5.5" />
      <ellipse cx="64" cy="72" rx="13" ry="6" />
    </g>
  ),
  pond: () => (
    <g>
      <ellipse cx="40" cy="66" rx="38" ry="13" fill={STONE} />
      <ellipse cx="40" cy="65" rx="33" ry="10" fill={WATER} />
      <path d="M44 63a9 5 0 1 0 2-5l-6 4z" fill={LEAF_LIGHT} />
      <circle cx="22" cy="64" r="4" fill="#F4A3C4" />
      <path d="M26 70h10" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  ),
  pinecone: () => (
    <g>
      <path d="M40 18v8" stroke="#5E3A22" strokeWidth="3" strokeLinecap="round" />
      <path d="M40 76c-12 0-18-14-18-28 0-12 8-22 18-22s18 10 18 22c0 14-6 28-18 28z" fill="#8A5A3B" />
      <path d="M26 42l14 8 14-8M24 54l16 9 16-9M28 66l12 7 12-7" stroke="#5E3A22" strokeWidth="3" fill="none" strokeLinejoin="round" />
    </g>
  ),
  stump: () => (
    <g>
      <path d="M14 78l4-34h44l4 34z" fill={WOOD} />
      <path d="M26 78V52M42 78V50M56 78V54" stroke={WOOD_DARK} strokeWidth="2.5" />
      <ellipse cx="40" cy="44" rx="22" ry="7" fill="#E9C08A" />
      <ellipse cx="40" cy="44" rx="12" ry="3.5" fill="none" stroke={WOOD} strokeWidth="2" />
    </g>
  ),
  swing: () => (
    <g>
      <path d="M10 78L18 10M70 78L62 10M14 12h52" stroke={WOOD_DARK} strokeWidth="5" strokeLinecap="round" />
      <path d="M30 12v44M50 12v44" stroke="#8A9AA8" strokeWidth="2.5" />
      <rect x="24" y="54" width="32" height="7" rx="3" fill="#E0533A" />
    </g>
  )
};

/** A decoration a visitor left in the Kiskert, drawn in an 80 × 80 box. */
export function DecorArt({ id, size = 80, className = '' }: { id: DecorId; size?: number; className?: string }) {
  const Art = DECOR[id];
  return (
    <svg aria-hidden="true" className={`decor-art ${className}`} width={size} height={size} viewBox="0 0 80 80">
      <Art />
    </svg>
  );
}

/** A collected sticker: the game's colour, a white rim and its mark. Size comes from CSS. */
export function StickerDisc({ sticker, className = '', tilt = 0 }: { sticker: Sticker; className?: string; tilt?: number }) {
  const game = gameOf(sticker);
  const style = { '--sticker': game.color, '--sticker-ink': game.ink, '--tilt': `${tilt}deg` } as CSSProperties;
  return (
    <span className={`sticker ${className}`} style={style} aria-hidden="true">
      <span className="sticker__mark">{sticker.mark}</span>
    </span>
  );
}

/** An empty place in the album, with the mark of the sticker that will go there. */
export function StickerSlot({ sticker, className = '' }: { sticker: Sticker; className?: string }) {
  return (
    <span className={`sticker-slot ${className}`} aria-hidden="true">
      <span className="sticker__mark">{sticker.mark}</span>
    </span>
  );
}

/** The sticker album on the island: a purple book open on a page of stickers, one place still empty. */
export function StickerBookArt({ size = 100 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size * 1.1} viewBox="0 0 100 110">
      <rect x="8" y="4" width="84" height="102" rx="10" fill="#7A4FB5" />
      <rect x="8" y="4" width="12" height="102" rx="6" fill="#563682" />
      <rect x="24" y="12" width="60" height="86" rx="6" fill="#FFFFFF" />
      <circle cx="40" cy="36" r="11" fill="#2E86DE" stroke="#FFFFFF" strokeWidth="3" />
      <circle cx="68" cy="36" r="11" fill="#FFC93C" stroke="#FFFFFF" strokeWidth="3" />
      <circle cx="40" cy="72" r="11" fill="#F4A3C4" stroke="#FFFFFF" strokeWidth="3" />
      <circle cx="68" cy="72" r="10" fill="none" stroke="#B9A3D6" strokeWidth="3" strokeDasharray="5 4" />
    </svg>
  );
}

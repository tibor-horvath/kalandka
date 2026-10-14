import type { CSSProperties } from 'react';
import type { PlantKind, Sticker, VisitorId } from '../state/rewards';
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

/** A Kiskert visitor, drawn in a 120 × 100 box. */
export function VisitorArt({ id, width = 120 }: { id: VisitorId; width?: number }) {
  return (
    <svg aria-hidden="true" className={`visitor-art visitor-art--${id}`} width={width} height={Math.round((width * 100) / 120)} viewBox="0 0 120 100">
      {id === 'hedgehog' ? <Hedgehog /> : id === 'ladybug' ? <Ladybug /> : id === 'butterfly' ? <Butterfly /> : <Blackbird />}
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

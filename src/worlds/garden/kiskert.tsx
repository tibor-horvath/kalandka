import type { ReactElement } from 'react';
import type { DecorId, FlowerId, FoodId, PlantKind, TreatId, TreeId, VegId, VisitorId } from '../../state/garden';

// Artwork for the Kiskert. Plants share one 160 × 220 box standing on its
// bottom edge, so beds line up whatever grows in them.

const LEAF = '#3F8F3A';
const LEAF_LIGHT = '#5BAA4A';
/** A thirsty plant's leaves: paler and duller, never brown or dead. */
const DRY = '#8FA857';

/** Where the blueberry clusters hang, in ripening order. */
const BERRIES = [
  [48, 140],
  [108, 124],
  [86, 158]
];
const PEARS = [
  [58, 62],
  [110, 54],
  [124, 112],
  [82, 108],
  [44, 124]
];

/** Each flower kind's main colour, for its head and its seed packet. They differ in lightness too, not only in hue. */
export const FLOWER_COLORS: Record<FlowerId, string> = {
  malva: '#F4A3C4',
  tulip: '#E8603C',
  primrose: '#F2C230',
  cornflower: '#3F74C9',
  bellflower: '#8A5CC2'
};

/** A flower's head, in the flower's own 120 × 165 box (the stem runs up to y 70). */
function FlowerHead({ id }: { id: FlowerId }) {
  const color = FLOWER_COLORS[id];
  switch (id) {
    case 'tulip':
      return (
        <>
          <path d="M28 28 L44 50 L60 18 L76 50 L92 28 C96 70 82 94 60 94 C38 94 24 70 28 28 Z" fill={color} />
          <path d="M44 50 L60 18 L76 50 C70 66 50 66 44 50 Z" fill="#C9452A" />
        </>
      );
    case 'primrose':
      return (
        <>
          <g fill={color}>
            <circle cx="60" cy="32" r="19" />
            <circle cx="87" cy="52" r="19" />
            <circle cx="77" cy="83" r="19" />
            <circle cx="43" cy="83" r="19" />
            <circle cx="33" cy="52" r="19" />
          </g>
          <g stroke="#C99A12" strokeWidth="3" strokeLinecap="round">
            <path d="M60 18v8M97 46l-7 3M86 96l-4-6M34 96l4-6M23 46l7 3" />
          </g>
          <circle cx="60" cy="60" r="13" fill="#E8851A" />
        </>
      );
    case 'cornflower':
      return (
        <>
          <g fill={color}>
            {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((a) => (
              <path key={a} d="M60 58 L48 16 L56 22 L60 12 L64 22 L72 16 Z" transform={`rotate(${a} 60 58)`} />
            ))}
          </g>
          <circle cx="60" cy="58" r="13" fill="#26315F" />
        </>
      );
    case 'bellflower':
      return (
        <>
          <path d="M60 72 C60 40 70 26 92 22 M60 50 C52 40 40 36 26 40" stroke={LEAF} strokeWidth="5" fill="none" strokeLinecap="round" />
          {[
            [92, 24],
            [28, 42],
            [66, 64]
          ].map(([x, y]) => (
            <path
              key={`${x},${y}`}
              d="M0 0 C-12 0 -16 14 -18 30 L-12 26 L-6 31 L0 26 L6 31 L12 26 L18 30 C16 14 12 0 0 0 Z"
              transform={`translate(${x} ${y})`}
              fill={color}
            />
          ))}
        </>
      );
    default:
      return (
        <>
          <g fill={color}>
            <circle cx="60" cy="34" r="18" />
            <circle cx="86" cy="54" r="18" />
            <circle cx="76" cy="82" r="18" />
            <circle cx="44" cy="82" r="18" />
            <circle cx="34" cy="54" r="18" />
          </g>
          <circle cx="60" cy="60" r="15" fill="#FFC93C" />
        </>
      );
  }
}

function Flower({ id = 'malva' }: { id?: FlowerId }) {
  return (
    <g transform="translate(20 50)">
      <path d="M60 165V70" stroke={LEAF} strokeWidth="7" strokeLinecap="round" />
      <ellipse cx="40" cy="120" rx="20" ry="9" fill={LEAF_LIGHT} transform="rotate(-30 40 120)" />
      <ellipse cx="80" cy="105" rx="20" ry="9" fill={LEAF_LIGHT} transform="rotate(30 80 105)" />
      <FlowerHead id={id} />
    </g>
  );
}

/** A flower kind's head on its own: the choice buttons and the Magtár's seed packets. */
export function FlowerIcon({ id, size = 40 }: { id: FlowerId; size?: number }) {
  return (
    <svg aria-hidden="true" className="flower-icon" width={size} height={size} viewBox="12 6 96 96">
      <FlowerHead id={id} />
    </svg>
  );
}

/** A small flower of the Kiskert's border: the whole flower, stem and all. */
export function BorderFlower({ id }: { id: FlowerId }) {
  return (
    <svg aria-hidden="true" className="border-flower" viewBox="24 52 112 150">
      <Flower id={id} />
    </svg>
  );
}

/** A paper packet of flower seeds with the flower printed on it (Magtár). */
export function SeedPacket({ id, owned }: { id: FlowerId; owned: boolean }) {
  return (
    <svg aria-hidden="true" className="seed-packet" viewBox="0 0 92 112">
      <path d="M8 10 H84 L80 108 H12 Z" fill={owned ? '#F3E3B3' : '#FBF4E2'} stroke="#C98443" strokeWidth="3" strokeLinejoin="round" />
      <path d="M8 10 L16 2 L24 10 L32 2 L40 10 L48 2 L56 10 L64 2 L72 10 L80 2 L84 10" fill="none" stroke="#C98443" strokeWidth="3" strokeLinejoin="round" />
      <rect x="18" y="22" width="56" height="62" rx="12" fill="#FFFFFF" />
      <g transform="translate(16 24) scale(0.5)">
        <FlowerHead id={id} />
      </g>
    </svg>
  );
}

/** The seed sack the child counts seeds out of. */
export function SeedSack({ size = 96 }: { size?: number }) {
  return (
    <svg aria-hidden="true" className="seed-sack" width={size} height={size} viewBox="0 0 96 96">
      <path d="M30 26 C24 40 16 54 16 70 C16 84 30 90 48 90 C66 90 80 84 80 70 C80 54 72 40 66 26 Z" fill="#D9B27A" stroke="#A9783F" strokeWidth="3" />
      <path d="M30 26 C38 20 58 20 66 26 C60 30 36 30 30 26 Z" fill="#B88A50" />
      <path d="M34 24 C40 12 56 12 62 24" stroke="#7A5236" strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="48" cy="60" rx="10" ry="13" fill="#B77B45" />
      <path d="M48 49 C45 55 45 64 48 72" stroke="#8A5A2E" strokeWidth="2" fill="none" />
    </svg>
  );
}

/** [x, y, radius] circles for the leaf masses. */
const BUSH_LEAVES = [[40, 146, 22], [58, 122, 24], [82, 110, 26], [106, 120, 24], [124, 144, 22], [52, 166, 20], [112, 166, 20], [82, 146, 32]];
const CROWN_LEAVES = [[85, 40, 32], [60, 70, 32], [110, 70, 32], [48, 106, 30], [122, 106, 30], [85, 96, 42], [64, 134, 24], [106, 134, 24]];

function Leafage({ fill, blobs }: { fill: string; blobs: number[][] }) {
  return (
    <g fill={fill}>
      {blobs.map(([x, y, r]) => (
        <circle key={`${x},${y}`} cx={x} cy={y} r={r} />
      ))}
    </g>
  );
}

/** A hanging cluster of dusty-blue blueberries, each with its little dark crown. One cluster is one pick. */
function BerryCluster({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 -14 Q1 -6 0 0 M0 -10 Q8 -6 9 4 M0 -10 Q-6 -4 -7 6" stroke="#7A4A2E" strokeWidth="1.6" fill="none" />
      {[[0, 2], [9, 8], [-7, 9], [2, 14]].map(([bx, by]) => (
        <g key={`${bx},${by}`} transform={`translate(${bx} ${by})`}>
          <circle r="7" fill="#4E6DB4" />
          <ellipse cx="-2.6" cy="-2.6" rx="2.6" ry="1.7" fill="#A9BCE3" />
          <circle cx="1.4" cy="2.2" r="2.2" fill="#26315F" />
        </g>
      ))}
    </g>
  );
}

/** A ripe pear hanging on its stalk: yellow with a red blush. */
function HangingPear({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 -12 C1 -18 3 -22 6 -25" stroke="#6B4A2E" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path
        d="M0 -12 C-5 -12 -6 -6 -6 -2 C-11 2 -14 8 -14 14 A14 13 0 0 0 14 14 C14 8 11 2 6 -2 C6 -6 5 -12 0 -12 Z"
        fill="#F0D75A"
        stroke="#A08A1E"
        strokeWidth="1.6"
      />
      <ellipse cx="6" cy="13" rx="6" ry="7" fill="#E9925A" fillOpacity="0.55" />
      <ellipse cx="-6" cy="8" rx="2.4" ry="5" fill="#FFFFFF" fillOpacity="0.4" />
      <g fill="#A08A1E">
        <circle cx="-2" cy="18" r="0.9" />
        <circle cx="3" cy="4" r="0.9" />
        <circle cx="-7" cy="20" r="0.9" />
      </g>
    </g>
  );
}

/** A blueberry bush: thin reddish canes from the ground under a leafy mass. A thirsty one sags a little lower and paler; its berries stay on. */
function Bush({ fruit = 3, dry = false }: { fruit?: number; dry?: boolean }) {
  return (
    <>
      <path
        d="M80 218 C74 196 52 170 36 146 M80 218 C78 184 66 150 60 120 M80 218 C82 184 96 150 102 116 M80 218 C86 196 110 170 126 144 M80 218 C80 194 80 160 82 128"
        stroke="#8A4B3A"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <g transform={dry ? 'translate(0 13) scale(1 0.94)' : undefined}>
        <Leafage fill={dry ? DRY : LEAF} blobs={BUSH_LEAVES} />
        {BERRIES.slice(0, fruit).map(([x, y]) => (
          <BerryCluster key={`${x},${y}`} x={x} y={y} />
        ))}
      </g>
    </>
  );
}

/** A red apple hanging on its stalk. */
function HangingApple({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 -10 C1 -15 3 -18 5 -20" stroke="#6B4A2E" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M0 -8 C-6 -12 -14 -8 -14 2 C-14 12 -6 16 0 14 C6 16 14 12 14 2 C14 -8 6 -12 0 -8 Z" fill="#D9432E" stroke="#9E2A1B" strokeWidth="1.6" />
      <ellipse cx="-6" cy="-1" rx="2.6" ry="5" fill="#FFFFFF" fillOpacity="0.4" />
    </g>
  );
}

/** A pair of dark red cherries on their joined stalks. */
function HangingCherries({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 -18 C-2 -10 -6 -4 -7 2 M0 -18 C2 -10 6 -4 7 4" stroke="#4E7A2E" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="-7" cy="6" r="7" fill="#B3263A" stroke="#7A1424" strokeWidth="1.4" />
      <circle cx="7" cy="8" r="7" fill="#C7334A" stroke="#7A1424" strokeWidth="1.4" />
      <ellipse cx="-9" cy="4" rx="1.8" ry="2.6" fill="#FFFFFF" fillOpacity="0.45" />
    </g>
  );
}

/** A walnut in its green husk. */
function HangingNut({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 -10 V-16" stroke="#6B4A2E" strokeWidth="2.4" strokeLinecap="round" />
      <circle r="11" fill="#7FA34A" stroke="#4E6B2A" strokeWidth="1.6" />
      <path d="M-3 -8 C-6 -2 -6 4 -3 9" stroke="#4E6B2A" strokeWidth="1.4" fill="none" />
      <ellipse cx="-4" cy="-3" rx="2" ry="3.4" fill="#FFFFFF" fillOpacity="0.3" />
    </g>
  );
}

/** Each tree kind's crown colour and fruit. */
const TREE_LOOK: Record<TreeId, { leaf: string; Fruit: (pr: { x: number; y: number }) => ReactElement }> = {
  pear: { leaf: LEAF, Fruit: HangingPear },
  apple: { leaf: '#4C9A3F', Fruit: HangingApple },
  cherry: { leaf: '#3A8250', Fruit: HangingCherries },
  walnut: { leaf: '#5E9640', Fruit: HangingNut }
};

/** A fruit tree: tapering trunk, upright egg-shaped crown, hanging fruit. A thirsty one's crown droops a little and pales; its fruit stays on. */
function FruitTree({ fruit = 5, dry = false, tree = 'pear' }: { fruit?: number; dry?: boolean; tree?: TreeId }) {
  const { leaf, Fruit } = TREE_LOOK[tree];
  return (
    <>
      <path d="M72 220 C74 196 76 172 77 150 L93 150 C94 172 96 196 98 220 Z" fill="#7A5236" />
      <path d="M80 212 C80 196 82 182 81 166 M89 206 C89 192 88 178 89 164" stroke="#5E3E28" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M85 168 C72 152 58 140 48 122 M86 160 C100 142 112 130 120 112 M85 156 V100" stroke="#7A5236" strokeWidth="7" fill="none" strokeLinecap="round" />
      <g transform={dry ? 'translate(0 8)' : undefined}>
        <Leafage fill={dry ? DRY : leaf} blobs={tree === 'walnut' ? WALNUT_LEAVES : CROWN_LEAVES} />
        {PEARS.slice(0, fruit).map(([x, y]) => (
          <Fruit key={`${x},${y}`} x={x} y={y} />
        ))}
      </g>
    </>
  );
}

/** A walnut's crown is broader and rounder than the fruit trees'. */
const WALNUT_LEAVES = [[85, 50, 34], [52, 74, 32], [118, 74, 32], [36, 108, 28], [134, 108, 28], [85, 96, 44], [62, 132, 26], [108, 132, 26]];

/** A young plant that already shows its kind: a flower's closed bud in its own colour, a fruit tree's thin sapling with
 * one blossom, the bush's low wide tuft. Drawn from the bottom middle of the plant box, a little right of centre to
 * leave room for the stake. */
function Sprout({ kind, flower, dry }: { kind: PlantKind; flower: FlowerId; dry: boolean }) {
  const leaf = dry ? DRY : LEAF;
  const light = dry ? DRY : LEAF_LIGHT;
  if (kind === 'tree') {
    return (
      <g transform="translate(104 218) scale(1.5)">
        <path d="M0 2V-92" stroke="#7A5236" strokeWidth="7" strokeLinecap="round" />
        <path d="M0 -46L-20 -62M0 -64L20 -80" stroke="#7A5236" strokeWidth="4" strokeLinecap="round" />
        <circle cx="-22" cy="-66" r="12" fill={leaf} />
        <circle cx="22" cy="-84" r="12" fill={leaf} />
        <circle cx="0" cy="-98" r="14" fill={light} />
        <g transform="translate(14 -104)" fill="#FFFFFF">
          <circle cy="-5" r="5" />
          <circle cx="5" r="5" />
          <circle cy="5" r="5" />
          <circle cx="-5" r="5" />
          <circle r="3" fill="#F2C230" />
        </g>
      </g>
    );
  }
  if (kind === 'bush') {
    return (
      <g transform="translate(104 218) scale(1.3)">
        <path d="M0 0C-8 -14 -20 -24 -32 -30M0 0V-42M0 0C8 -14 20 -24 32 -30" stroke="#8A4B3A" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <circle cx="-32" cy="-32" r="12" fill={leaf} />
        <circle cx="32" cy="-32" r="12" fill={leaf} />
        <circle cx="0" cy="-44" r="13" fill={light} />
        <circle cx="-16" cy="-20" r="10" fill={light} />
        <circle cx="16" cy="-20" r="10" fill={light} />
      </g>
    );
  }
  return (
    <g transform="translate(104 218) scale(1.5)">
      <path d="M0 2V-52" stroke={leaf} strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="-13" cy="-22" rx="15" ry="7" fill={light} transform="rotate(-30 -13 -22)" />
      <ellipse cx="13" cy="-32" rx="15" ry="7" fill={light} transform="rotate(30 13 -32)" />
      <path d="M0 -84C-13 -74 -13 -56 0 -50C13 -56 13 -74 0 -84Z" fill={FLOWER_COLORS[flower]} />
      <path d="M-10 -58Q0 -42 10 -58Q0 -51 -10 -58Z" fill={leaf} />
    </g>
  );
}

/** A gardener's stake beside a young plant: a little card with the picture of what will grow there, the same as on
 * the seed choice, so a child who can't read yet still knows. It comes out once the plant has grown. */
function PlantStake({ kind, flower, tree }: { kind: PlantKind; flower: FlowerId; tree: TreeId }) {
  return (
    <g>
      <rect x="31" y="126" width="10" height="94" rx="3" fill="#A9763F" />
      <rect x="2" y="58" width="68" height="68" rx="14" fill="#FFFBEF" stroke="#A9763F" strokeWidth="4" />
      {kind === 'flower' ? (
        <svg x="9" y="65" width="54" height="54" viewBox="12 6 96 96">
          <FlowerHead id={flower} />
        </svg>
      ) : kind === 'bush' ? (
        <g transform="translate(9 65)">
          <BerryIcon size={54} />
        </g>
      ) : tree === 'pear' ? (
        <g transform="translate(13 64)">
          <PearIcon size={48} />
        </g>
      ) : (
        <g transform="translate(9 65)">
          <FruitIcon id={tree === 'walnut' ? 'nut' : tree} size={54} />
        </g>
      )}
    </g>
  );
}

/** A planting in the Kiskert: a young plant with its stake until it has grown, then the plant with its ripe fruit. */
export function GardenPlant({
  kind,
  grown,
  fruit = 0,
  thirsty = false,
  flower = 'malva',
  tree = 'pear'
}: {
  kind: PlantKind;
  grown: boolean;
  fruit?: number;
  thirsty?: boolean;
  flower?: FlowerId;
  tree?: TreeId;
}) {
  return (
    <svg aria-hidden="true" className={`gplant gplant--${grown ? kind : 'sprout'}${thirsty ? ' gplant--thirsty' : ''}`} viewBox="0 0 160 220">
      {!grown ? (
        <>
          <PlantStake kind={kind} flower={flower} tree={tree} />
          <Sprout kind={kind} flower={flower} dry={thirsty} />
        </>
      ) : kind === 'flower' ? (
        <Flower id={flower} />
      ) : kind === 'bush' ? (
        <Bush fruit={fruit} dry={thirsty} />
      ) : (
        <FruitTree fruit={fruit} dry={thirsty} tree={tree} />
      )}
    </svg>
  );
}

/** A picked pear, for the basket. */
export function PearIcon({ size = 28 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={Math.round(size * 1.15)} viewBox="0 0 36 42">
      <path d="M18 9 C18 6 19 3 21 1" stroke="#6B4A2E" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M20 4 C24 0 30 0 32 3 C28 6 23 6 20 4 Z" fill={LEAF_LIGHT} />
      <path d="M18 9 C13 9 12 15 12 18 C8 21 5 26 5 31 A13 10.5 0 0 0 31 31 C31 26 28 21 24 18 C24 15 23 9 18 9 Z" fill="#F0D75A" stroke="#A08A1E" strokeWidth="1.8" />
      <ellipse cx="24" cy="31" rx="5.5" ry="6" fill="#E9925A" fillOpacity="0.55" />
      <ellipse cx="11" cy="26" rx="2" ry="4.5" fill="#FFFFFF" fillOpacity="0.4" />
    </svg>
  );
}

/** A picked bunch of blueberries, for the basket. */
export function BerryIcon({ size = 28 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 36 36">
      <path d="M18 4 C19 9 22 11 28 10" stroke={LEAF} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M28 10 C30 5 34 4 35 6 C33 9 31 10 28 10 Z" fill={LEAF_LIGHT} />
      <g fill="#4E6DB4" stroke="#2F4A8A" strokeWidth="1.6">
        <circle cx="12" cy="16" r="7" />
        <circle cx="24" cy="16" r="7" />
        <circle cx="18" cy="27" r="7" />
      </g>
      <g fill="#A9BCE3">
        <ellipse cx="9.5" cy="13.5" rx="2.2" ry="1.4" />
        <ellipse cx="21.5" cy="13.5" rx="2.2" ry="1.4" />
        <ellipse cx="15.5" cy="24.5" rx="2.2" ry="1.4" />
      </g>
      <g fill="#26315F">
        <circle cx="13.5" cy="18" r="1.8" />
        <circle cx="25.5" cy="18" r="1.8" />
        <circle cx="19.5" cy="29" r="1.8" />
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
export function PlantIcon({ kind, flower = 'malva', tree = 'pear' }: { kind: PlantKind; flower?: FlowerId; tree?: TreeId }) {
  return (
    <svg aria-hidden="true" className="gplant-icon" viewBox="0 0 160 220">
      {kind === 'flower' ? <Flower id={flower} /> : kind === 'bush' ? <Bush /> : <FruitTree tree={tree} />}
    </svg>
  );
}

/** A picked apple, cherry pair or walnut, for the basket and the gift cards. */
export function FruitIcon({ id, size = 28 }: { id: 'apple' | 'cherry' | 'nut'; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="-18 -22 36 40">
      {id === 'apple' ? <HangingApple x={0} y={2} /> : id === 'cherry' ? <HangingCherries x={0} y={0} /> : <HangingNut x={0} y={2} />}
    </svg>
  );
}

/** One carrot, pulled: for counting on the gift card. */
export function CarrotIcon({ size = 28 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={Math.round(size * 1.3)} viewBox="0 0 40 52">
      <path d="M20 16 L12 2 M20 16 V0 M20 16 L28 2" stroke={LEAF} strokeWidth="4" strokeLinecap="round" />
      <path d="M10 14 H30 L22 50 H18 Z" fill="#EF6C3A" stroke="#C8552B" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M15 24h5M17 34h4" stroke="#C8552B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** One lettuce head: for counting on the gift card. */
export function LettuceIcon({ size = 28 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 40 40">
      <ellipse cx="11" cy="26" rx="10" ry="9" fill="#7CB342" />
      <ellipse cx="29" cy="26" rx="10" ry="9" fill="#7CB342" />
      <ellipse cx="20" cy="20" rx="13" ry="13" fill="#9CCC65" />
      <ellipse cx="20" cy="23" rx="7" ry="7" fill="#C5E1A5" />
      <path d="M20 12v16M15 19l5 4 5-4" stroke="#7CB342" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** A grain of pollen: a small yellow ball. */
export function PollenIcon({ size = 24 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" fill="#F7C948" stroke="#C99A12" strokeWidth="1.6" />
      <g fill="#C99A12">
        <circle cx="9" cy="9" r="1.4" />
        <circle cx="15" cy="10" r="1.4" />
        <circle cx="11" cy="15" r="1.4" />
      </g>
    </svg>
  );
}

/** The garden food a visitor loves, one of it, for counting. */
export function FoodIcon({ id, size = 28 }: { id: FoodId; size?: number }) {
  if (id === 'carrot') return <CarrotIcon size={size} />;
  if (id === 'lettuce') return <LettuceIcon size={size} />;
  if (id === 'pollen') return <PollenIcon size={size} />;
  return <FruitIcon id={id} size={size} />;
}

/** A Veteményes spot: three carrots' tops, or three lettuce heads, or seedlings while they grow. */
export function VegPatch({ kind, ripe }: { kind: VegId; ripe: boolean }) {
  return (
    <svg aria-hidden="true" className={`veg-art veg-art--${kind}${ripe ? '' : ' veg-art--young'}`} viewBox="0 0 110 92">
      {!ripe ? (
        <g stroke={LEAF} strokeWidth="5" strokeLinecap="round" fill="none">
          <path d="M25 88V70M25 74L17 64M25 74L33 64" />
          <path d="M55 88V66M55 72L47 60M55 72L63 60" />
          <path d="M85 88V70M85 74L77 64M85 74L93 64" />
        </g>
      ) : kind === 'carrot' ? (
        <>
          <g stroke={LEAF} strokeWidth="6" strokeLinecap="round" fill="none">
            <path d="M25 74L13 32M25 74V22M25 74L37 32" />
            <path d="M55 74L43 26M55 74V14M55 74L67 26" />
            <path d="M85 74L73 32M85 74V22M85 74L97 32" />
          </g>
          <g fill="#EF6C3A">
            <path d="M15 72h20l-3 20h-14z" />
            <path d="M45 72h20l-3 20h-14z" />
            <path d="M75 72h20l-3 20h-14z" />
          </g>
        </>
      ) : (
        <g>
          {[18, 55, 92].map((x) => (
            <g key={x} transform={`translate(${x - 20} 50)`}>
              <ellipse cx="11" cy="26" rx="10" ry="9" fill="#7CB342" />
              <ellipse cx="29" cy="26" rx="10" ry="9" fill="#7CB342" />
              <ellipse cx="20" cy="20" rx="13" ry="13" fill="#9CCC65" />
              <ellipse cx="20" cy="23" rx="7" ry="7" fill="#C5E1A5" />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

/** A seed packet for a tree or a vegetable a visitor brought: the fruit or vegetable printed on it. */
export function GiftPacket({ tree, veg }: { tree?: TreeId; veg?: VegId }) {
  return (
    <svg aria-hidden="true" className="seed-packet" viewBox="0 0 92 112">
      <path d="M8 10 H84 L80 108 H12 Z" fill="#F3E3B3" stroke="#C98443" strokeWidth="3" strokeLinejoin="round" />
      <path d="M8 10 L16 2 L24 10 L32 2 L40 10 L48 2 L56 10 L64 2 L72 10 L80 2 L84 10" fill="none" stroke="#C98443" strokeWidth="3" strokeLinejoin="round" />
      <rect x="18" y="22" width="56" height="62" rx="12" fill="#FFFFFF" />
      <g transform="translate(46 54) scale(1.5)">
        {veg === 'carrot' ? (
          <g transform="translate(-20 -26)">
            <path d="M20 16 L12 2 M20 16 V0 M20 16 L28 2" stroke={LEAF} strokeWidth="4" strokeLinecap="round" />
            <path d="M10 14 H30 L22 50 H18 Z" fill="#EF6C3A" />
          </g>
        ) : veg === 'lettuce' ? (
          <g transform="translate(-20 -20)">
            <ellipse cx="11" cy="26" rx="10" ry="9" fill="#7CB342" />
            <ellipse cx="29" cy="26" rx="10" ry="9" fill="#7CB342" />
            <ellipse cx="20" cy="20" rx="13" ry="13" fill="#9CCC65" />
          </g>
        ) : tree === 'apple' ? (
          <HangingApple x={0} y={0} />
        ) : tree === 'cherry' ? (
          <HangingCherries x={0} y={0} />
        ) : (
          <HangingNut x={0} y={0} />
        )}
      </g>
    </svg>
  );
}

/** A bee resting on a flower (it sits still; a tap makes it hop once). */
export function SittingBee({ size = 30 }: { size?: number }) {
  return (
    <svg aria-hidden="true" className="garden-guest garden-guest--bee" width={size} height={Math.round(size * 0.86)} viewBox="0 0 30 26">
      <ellipse cx="12" cy="6" rx="6" ry="5" fill="#E3F1FC" stroke="#9FB7C7" strokeWidth="1" />
      <ellipse cx="19" cy="6" rx="6" ry="5" fill="#E3F1FC" stroke="#9FB7C7" strokeWidth="1" />
      <ellipse cx="15" cy="16" rx="11" ry="8" fill="#F7C948" />
      <path d="M11 9v14M17 9v14" stroke="#10233A" strokeWidth="3" />
      <circle cx="26" cy="15" r="4" fill="#10233A" />
    </svg>
  );
}

/** The butterfly resting on one flower, wings up. */
export function SittingButterfly({ size = 34 }: { size?: number }) {
  return (
    <svg aria-hidden="true" className="garden-guest garden-guest--butterfly" width={size} height={Math.round(size * 0.88)} viewBox="-60 -50 120 106">
      <ellipse cx="-24" cy="-14" rx="24" ry="28" fill="#F4A3C4" transform="rotate(-20 -24 -14)" />
      <ellipse cx="-20" cy="22" rx="16" ry="18" fill="#9FCDF3" />
      <ellipse cx="24" cy="-14" rx="24" ry="28" fill="#F4A3C4" transform="rotate(20 24 -14)" />
      <ellipse cx="20" cy="22" rx="16" ry="18" fill="#9FCDF3" />
      <rect x="-5" y="-30" width="10" height="64" rx="5" fill="#10233A" />
    </svg>
  );
}

/** The basket on the one basket pill in the top bar. */
export function BasketIcon({ size = 30 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={Math.round(size * 0.87)} viewBox="0 0 30 26">
      <circle cx="10" cy="9" r="5" fill="#D9432E" />
      <circle cx="17" cy="7" r="5" fill="#F0D75A" />
      <circle cx="22" cy="10" r="4" fill="#4E6DB4" />
      <path d="M2 11h26l-3 13H5z" fill="#C98443" />
      <path d="M7 15h16M8 19h14" stroke="#8A5A2E" strokeWidth="2" />
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

function Snail() {
  return (
    <g transform="translate(6 20)">
      <path d="M4 72 Q0 56 16 54 L90 54 Q104 56 106 72 Z" fill="#E8C9A0" />
      <path d="M90 56 L94 30 M100 58 L106 34" stroke="#C49A6C" strokeWidth="4" strokeLinecap="round" />
      <circle cx="94" cy="28" r="4.5" fill="#10233A" />
      <circle cx="106" cy="32" r="4.5" fill="#10233A" />
      <path d="M96 64q4 3 8 0" stroke="#8A5A3B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="48" cy="38" r="32" fill="#D9741A" />
      <circle cx="48" cy="38" r="21" fill="#F2994A" />
      <circle cx="48" cy="38" r="10" fill="#D9741A" />
    </g>
  );
}

function Bee() {
  return (
    <g transform="translate(10 10)">
      <ellipse cx="36" cy="22" rx="18" ry="14" fill="#E3F1FC" stroke="#9FB7C7" strokeWidth="1.5" />
      <ellipse cx="60" cy="20" rx="18" ry="14" fill="#E3F1FC" stroke="#9FB7C7" strokeWidth="1.5" />
      <ellipse cx="48" cy="54" rx="36" ry="26" fill="#F7C948" />
      <path d="M34 30v48M52 28v52M70 34v40" stroke="#10233A" strokeWidth="8" />
      <circle cx="86" cy="50" r="15" fill="#10233A" />
      <circle cx="90" cy="46" r="3.5" fill="#FFFFFF" />
      <path d="M84 36 Q82 26 76 24 M92 38 Q96 28 102 28" stroke="#10233A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M12 54 L2 54" stroke="#10233A" strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}

function Rabbit() {
  return (
    <g transform="translate(16 2)">
      <ellipse cx="34" cy="16" rx="8" ry="22" transform="rotate(-10 34 30)" fill="#E9E4DC" />
      <ellipse cx="56" cy="16" rx="8" ry="22" transform="rotate(10 56 30)" fill="#E9E4DC" />
      <ellipse cx="34" cy="18" rx="3.5" ry="14" transform="rotate(-10 34 30)" fill="#F4B6C2" />
      <ellipse cx="56" cy="18" rx="3.5" ry="14" transform="rotate(10 56 30)" fill="#F4B6C2" />
      <ellipse cx="45" cy="78" rx="32" ry="20" fill="#E9E4DC" />
      <circle cx="45" cy="52" r="20" fill="#E9E4DC" />
      <circle cx="38" cy="50" r="3" fill="#10233A" />
      <circle cx="52" cy="50" r="3" fill="#10233A" />
      <circle cx="45" cy="58" r="3" fill="#F48FB1" />
      <path d="M40 62q5 4 10 0" stroke="#10233A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="80" cy="80" r="8" fill="#F4F1EC" />
    </g>
  );
}

function Mole() {
  return (
    <g transform="translate(6 16)">
      <path d="M2 84 Q20 46 56 44 Q94 46 108 84 Z" fill="#8A5A3B" />
      <ellipse cx="54" cy="54" rx="34" ry="26" fill="#3D3A40" />
      <circle cx="44" cy="48" r="2.6" fill="#FFFFFF" />
      <circle cx="64" cy="48" r="2.6" fill="#FFFFFF" />
      <ellipse cx="54" cy="60" rx="8" ry="6" fill="#F48FB1" />
      <ellipse cx="22" cy="68" rx="12" ry="7" fill="#F4B6C2" />
      <ellipse cx="86" cy="68" rx="12" ry="7" fill="#F4B6C2" />
    </g>
  );
}

function Lizard() {
  return (
    <g transform="translate(-4 20)">
      <path d="M8 50 Q32 64 52 50" stroke="#3AA17E" strokeWidth="10" fill="none" strokeLinecap="round" />
      <ellipse cx="72" cy="46" rx="28" ry="13" fill="#3AA17E" />
      <ellipse cx="106" cy="42" rx="16" ry="11" fill="#3AA17E" />
      <circle cx="110" cy="38" r="3.4" fill="#10233A" />
      <path d="M58 56 l-6 12 M86 56 l6 12 M60 36 l-6 -12 M86 36 l6 -12" stroke="#2C7D61" strokeWidth="5" strokeLinecap="round" />
      <g fill="#F7C948">
        <circle cx="64" cy="44" r="3" />
        <circle cx="76" cy="40" r="3" />
        <circle cx="84" cy="48" r="3" />
      </g>
    </g>
  );
}

function Owl() {
  return (
    <g transform="translate(22 4)">
      <path d="M14 30 L22 6 L34 22 Z M76 30 L68 6 L56 22 Z" fill="#8A5A3B" />
      <ellipse cx="45" cy="56" rx="38" ry="38" fill="#A0673F" />
      <ellipse cx="45" cy="66" rx="24" ry="24" fill="#E8C9A0" />
      <circle cx="30" cy="40" r="13" fill="#FFFFFF" />
      <circle cx="60" cy="40" r="13" fill="#FFFFFF" />
      <circle cx="30" cy="40" r="6" fill="#10233A" />
      <circle cx="60" cy="40" r="6" fill="#10233A" />
      <path d="M40 52 L45 60 L50 52 Z" fill="#F2A33A" />
      <path d="M30 70q4 4 8 0M44 76q4 4 8 0M52 66q4 4 8 0" stroke="#C49A6C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>
  );
}

const VISITOR_ART: Record<VisitorId, () => ReactElement> = {
  hedgehog: Hedgehog,
  ladybug: Ladybug,
  butterfly: Butterfly,
  blackbird: Blackbird,
  frog: Frog,
  squirrel: Squirrel,
  snail: Snail,
  bee: Bee,
  rabbit: Rabbit,
  mole: Mole,
  lizard: Lizard,
  owl: Owl
};

/** A Kiskert visitor, drawn in a 120 × 100 box. */
export function VisitorArt({ id, width = 120 }: { id: VisitorId; width?: number }) {
  const Art = VISITOR_ART[id];
  return (
    <svg aria-hidden="true" className={`visitor-art visitor-art--${id}`} width={width} height={Math.round((width * 100) / 120)} viewBox="0 0 120 100">
      <Art />
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
  ),
  'apple-basket': () => (
    <g>
      <circle cx="28" cy="46" r="10" fill="#D9432E" />
      <circle cx="46" cy="42" r="10" fill="#E0533A" />
      <circle cx="56" cy="50" r="9" fill="#D9432E" />
      <path d="M8 52h64l-8 26H16z" fill={WOOD} stroke={WOOD_DARK} strokeWidth="2.5" />
      <path d="M14 62h52M18 70h44" stroke={WOOD_DARK} strokeWidth="2" />
      <path d="M14 52 Q40 18 66 52" stroke={WOOD_DARK} strokeWidth="3.5" fill="none" />
    </g>
  ),
  brushwood: () => (
    <g stroke={WOOD_DARK} strokeWidth="5" strokeLinecap="round">
      <path d="M8 74L66 56M12 62L72 72M16 52L62 66M24 44L56 52" />
      <path d="M20 70l-6-10M50 60l6-10" stroke={WOOD} strokeWidth="3" />
    </g>
  ),
  poppies: () => (
    <g>
      {[18, 40, 62].map((x, k) => (
        <g key={x} transform={`translate(${x} ${k === 1 ? 30 : 42})`}>
          <path d={`M0 6V${k === 1 ? 48 : 36}`} stroke={LEAF} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="-5" cy="0" r="8" fill="#E0533A" />
          <circle cx="5" cy="0" r="8" fill="#E0533A" />
          <circle cx="0" cy="-5" r="8" fill="#EF6C3A" />
          <circle r="4" fill="#10233A" />
        </g>
      ))}
    </g>
  ),
  'bug-hotel': () => (
    <g>
      <path d="M10 30L40 8l30 22z" fill="#E0533A" />
      <rect x="14" y="30" width="52" height="48" fill={WOOD} stroke={WOOD_DARK} strokeWidth="2.5" />
      <path d="M14 46h52M14 62h52M40 30v48" stroke={WOOD_DARK} strokeWidth="2.5" />
      <g fill="#4A2F18">
        <circle cx="22" cy="38" r="2.5" />
        <circle cx="30" cy="40" r="2.5" />
        <circle cx="50" cy="38" r="2.5" />
        <circle cx="58" cy="40" r="2.5" />
        <circle cx="26" cy="54" r="2.5" />
        <circle cx="54" cy="54" r="2.5" />
      </g>
      <path d="M18 66h18M44 66h18M18 72h18M44 72h18" stroke="#E9C08A" strokeWidth="2.5" />
    </g>
  ),
  dandelions: () => (
    <g>
      {[20, 44, 62].map((x, k) => (
        <g key={x}>
          <path d={`M${x} 78V${30 + k * 6}`} stroke={LEAF} strokeWidth="3" />
          {k === 1 ? (
            <g fill="#FFFFFF" stroke="#C8D2DA" strokeWidth="1">
              <circle cx={x} cy={30 + k * 6} r="12" />
            </g>
          ) : (
            <circle cx={x} cy={30 + k * 6} r="9" fill="#FFC93C" />
          )}
        </g>
      ))}
    </g>
  ),
  flag: () => (
    <g>
      <path d="M16 78V8" stroke={WOOD_DARK} strokeWidth="4" strokeLinecap="round" />
      {['#E0533A', '#F2994A', '#FFC93C', '#5BAA4A', '#3F74C9', '#8A5CC2'].map((c, k) => (
        <rect key={c} x="18" y={10 + k * 6} width="48" height="6" fill={c} />
      ))}
    </g>
  ),
  nest: () => (
    <g>
      <path d="M8 56c0 14 14 22 32 22s32-8 32-22z" fill={WOOD} stroke={WOOD_DARK} strokeWidth="2.5" />
      <path d="M12 60c10 4 20 2 28 6M36 70c10-4 22-4 32-10M16 70c8-2 14 0 20 2" stroke={WOOD_DARK} strokeWidth="2" fill="none" />
      <ellipse cx="30" cy="54" rx="8" ry="10" fill="#9FCDF3" />
      <ellipse cx="48" cy="54" rx="8" ry="10" fill="#B7DAF5" />
    </g>
  ),
  'cherry-branch': () => (
    <g>
      <path d="M6 30 Q40 20 74 36" stroke={WOOD_DARK} strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="28" cy="20" rx="10" ry="5" fill={LEAF_LIGHT} transform="rotate(-20 28 20)" />
      <ellipse cx="56" cy="22" rx="10" ry="5" fill={LEAF_LIGHT} transform="rotate(20 56 22)" />
      <path d="M30 28 L24 52 M30 28 L36 56 M58 32 L54 58 M58 32 L66 54" stroke="#4E7A2E" strokeWidth="2" />
      <g fill="#B3263A">
        <circle cx="24" cy="56" r="6" />
        <circle cx="36" cy="60" r="6" />
        <circle cx="54" cy="62" r="6" />
        <circle cx="66" cy="58" r="6" />
      </g>
    </g>
  ),
  waterlily: () => (
    <g>
      <ellipse cx="40" cy="68" rx="34" ry="10" fill={WATER} />
      <path d="M22 66a14 6 0 1 0 4-6l-8 4z" fill={LEAF_LIGHT} />
      <g fill="#F4A3C4" stroke="#D9729C" strokeWidth="1.5">
        <path d="M48 62 L42 48 L50 54 L54 42 L58 54 L66 48 L60 62 Z" />
      </g>
      <circle cx="54" cy="58" r="3" fill="#FFC93C" />
    </g>
  ),
  bridge: () => (
    <g>
      <ellipse cx="40" cy="72" rx="36" ry="6" fill={WATER} />
      <path d="M4 66 Q40 34 76 66" stroke={WOOD} strokeWidth="9" fill="none" />
      <path d="M8 56 Q40 26 72 56" stroke={WOOD_DARK} strokeWidth="3" fill="none" />
      <path d="M16 52v10M28 44v12M40 40v12M52 44v12M64 52v10" stroke={WOOD_DARK} strokeWidth="2.5" />
    </g>
  ),
  'nut-pile': () => (
    <g fill="#B0763F" stroke={WOOD_DARK} strokeWidth="1.8">
      <circle cx="22" cy="68" r="9" />
      <circle cx="40" cy="68" r="9" />
      <circle cx="58" cy="68" r="9" />
      <circle cx="31" cy="54" r="9" />
      <circle cx="49" cy="54" r="9" />
      <circle cx="40" cy="40" r="9" />
    </g>
  ),
  'rope-bridge': () => (
    <g>
      <path d="M10 78V22M70 78V22" stroke={WOOD_DARK} strokeWidth="5" strokeLinecap="round" />
      <path d="M10 26 Q40 50 70 26 M10 40 Q40 64 70 40" stroke="#C9A36A" strokeWidth="3" fill="none" />
      <path d="M22 44v10M32 50v10M40 52v10M48 50v10M58 44v10" stroke={WOOD} strokeWidth="5" />
    </g>
  ),
  'lettuce-leaf': () => (
    <g>
      <path d="M40 76C14 68 12 40 30 20c4 18 34 22 34 40 0 10-8 16-24 16z" fill="#9CCC65" />
      <path d="M40 76C36 60 34 44 30 22" stroke="#7CB342" strokeWidth="3" fill="none" />
    </g>
  ),
  'mossy-stone': () => (
    <g>
      <ellipse cx="40" cy="62" rx="32" ry="18" fill={STONE} />
      <path d="M12 56 Q24 40 44 44 Q62 46 70 58" stroke="#5BAA4A" strokeWidth="9" fill="none" strokeLinecap="round" />
    </g>
  ),
  puddle: () => (
    <g>
      <ellipse cx="40" cy="68" rx="34" ry="10" fill={WATER} />
      <ellipse cx="30" cy="66" rx="10" ry="3" fill="#FFFFFF" fillOpacity="0.6" />
      <path d="M58 40c-4 7-7 10-7 14a7 7 0 0 0 14 0c0-4-3-7-7-14z" fill={WATER} />
    </g>
  ),
  toadstool: () => (
    <g>
      <path d="M38 78V44h4v34z" fill="#F3E6D0" />
      <path d="M8 46c0-18 14-30 32-30s32 12 32 30z" fill="#F2B33D" />
      <circle cx="28" cy="34" r="4" fill="#FFFFFF" />
      <circle cx="50" cy="30" r="4" fill="#FFFFFF" />
    </g>
  ),
  'snail-stairs': () => (
    <g fill={STONE} stroke="#8A9AA8" strokeWidth="2">
      <rect x="6" y="64" width="68" height="14" rx="3" />
      <rect x="20" y="50" width="54" height="14" rx="3" />
      <rect x="36" y="36" width="38" height="14" rx="3" />
      <rect x="52" y="22" width="22" height="14" rx="3" />
    </g>
  ),
  hive: () => (
    <g>
      <path d="M20 22h40l6 12H14z" fill="#F2C94C" stroke="#C99A12" strokeWidth="2" />
      <path d="M14 34h52v12H14z" fill="#E0A800" stroke="#C99A12" strokeWidth="2" />
      <path d="M16 46h48v12H16z" fill="#F2C94C" stroke="#C99A12" strokeWidth="2" />
      <path d="M18 58h44v14H18z" fill="#E0A800" stroke="#C99A12" strokeWidth="2" />
      <rect x="34" y="62" width="12" height="10" rx="6" fill="#4A2F18" />
      <path d="M16 78h48" stroke={WOOD_DARK} strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  'honey-pot': () => (
    <g>
      <path d="M18 34h44v32a10 10 0 0 1-10 10H28a10 10 0 0 1-10-10z" fill="#F2B33D" stroke="#C98443" strokeWidth="2.5" />
      <path d="M14 28h52v8H14z" fill="#E8C9A0" stroke="#C98443" strokeWidth="2.5" />
      <path d="M30 36c0 8-4 10-4 14s4 4 4 0" stroke="#C98443" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="28" y="46" width="24" height="14" rx="3" fill="#FFFFFF" />
      <path d="M33 53h14" stroke="#C98443" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  ),
  'flower-box': () => (
    <g>
      <rect x="8" y="56" width="64" height="22" rx="3" fill={WOOD} stroke={WOOD_DARK} strokeWidth="2.5" />
      {[20, 40, 60].map((x, k) => (
        <g key={x}>
          <path d={`M${x} 56V36`} stroke={LEAF} strokeWidth="3" />
          <circle cx={x} cy="32" r="8" fill={['#F4A3C4', '#FFC93C', '#8A5CC2'][k]} />
          <circle cx={x} cy="32" r="3" fill="#FFFFFF" />
        </g>
      ))}
    </g>
  ),
  'bee-bath': () => (
    <g>
      <ellipse cx="40" cy="68" rx="30" ry="9" fill={STONE} />
      <ellipse cx="40" cy="66" rx="24" ry="6" fill={WATER} />
      <g fill="#A9B4BD">
        <circle cx="30" cy="64" r="4" />
        <circle cx="46" cy="66" r="4" />
      </g>
      <path d="M50 30 Q60 20 66 30" stroke="#10233A" strokeWidth="2" fill="none" />
      <ellipse cx="58" cy="38" rx="7" ry="5" fill="#F7C948" />
      <path d="M56 33v10M60 33v10" stroke="#10233A" strokeWidth="2" />
    </g>
  ),
  'sunflower-row': () => (
    <g>
      {[16, 40, 64].map((x, k) => (
        <g key={x}>
          <path d={`M${x} 78V${28 + (k % 2) * 8}`} stroke={LEAF} strokeWidth="3.5" />
          <g fill="#FFC93C">
            {Array.from({ length: 8 }, (_, j) => (
              <ellipse key={j} cx={x} cy={18 + (k % 2) * 8} rx="3.5" ry="6" transform={`rotate(${j * 45} ${x} ${28 + (k % 2) * 8})`} />
            ))}
          </g>
          <circle cx={x} cy={28 + (k % 2) * 8} r="6" fill="#8A5A3B" />
        </g>
      ))}
    </g>
  ),
  clover: () => (
    <g>
      <path d="M40 78V44" stroke={LEAF} strokeWidth="4" />
      <g fill="#5FA84A">
        <circle cx="40" cy="26" r="13" />
        <circle cx="26" cy="42" r="13" />
        <circle cx="54" cy="42" r="13" />
      </g>
      <circle cx="40" cy="38" r="4" fill="#2F7D32" />
    </g>
  ),
  burrow: () => (
    <g>
      <path d="M4 78 Q40 26 76 78z" fill="#8A5A3B" />
      <ellipse cx="40" cy="70" rx="16" ry="12" fill="#3D2A1A" />
      <path d="M10 76h60" stroke="#5FA84A" strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  'flower-basket': () => (
    <g>
      <circle cx="26" cy="44" r="9" fill="#F4A3C4" />
      <circle cx="42" cy="38" r="9" fill="#FFC93C" />
      <circle cx="56" cy="46" r="9" fill="#8A5CC2" />
      <path d="M10 50h60l-8 28H18z" fill="#E8C9A0" stroke="#C98443" strokeWidth="2.5" />
      <path d="M16 60h48M20 68h40" stroke="#C98443" strokeWidth="2" />
    </g>
  ),
  'carrot-cart': () => (
    <g>
      <path d="M8 38h56v22H8z" fill={WOOD} stroke={WOOD_DARK} strokeWidth="2.5" />
      <path d="M64 44h12" stroke={WOOD_DARK} strokeWidth="4" strokeLinecap="round" />
      <circle cx="20" cy="66" r="10" fill="#FFFFFF" stroke={WOOD_DARK} strokeWidth="3" />
      <circle cx="52" cy="66" r="10" fill="#FFFFFF" stroke={WOOD_DARK} strokeWidth="3" />
      <g fill="#EF6C3A">
        <path d="M16 38l4-14 4 14z" />
        <path d="M30 38l4-16 4 16z" />
        <path d="M44 38l4-14 4 14z" />
      </g>
      <path d="M20 24l-3-8M34 22v-9M48 24l3-8" stroke={LEAF} strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  'straw-hat': () => (
    <g>
      <ellipse cx="40" cy="62" rx="36" ry="10" fill="#F2D27A" stroke="#C99A12" strokeWidth="2" />
      <path d="M20 60c0-18 8-28 20-28s20 10 20 28z" fill="#F2D27A" stroke="#C99A12" strokeWidth="2" />
      <path d="M20 54h40" stroke="#E0533A" strokeWidth="5" />
    </g>
  ),
  molehill: () => (
    <g>
      <path d="M6 78 Q40 22 74 78z" fill="#8A5A3B" />
      <g fill="#6B4A2B">
        <circle cx="30" cy="58" r="3" />
        <circle cx="46" cy="50" r="3" />
        <circle cx="52" cy="66" r="3" />
      </g>
    </g>
  ),
  spade: () => (
    <g>
      <path d="M40 10v40" stroke={WOOD} strokeWidth="6" strokeLinecap="round" />
      <path d="M30 10h20" stroke={WOOD_DARK} strokeWidth="6" strokeLinecap="round" />
      <path d="M28 48h24v14a12 12 0 0 1-24 0z" fill="#A9B4BD" stroke="#7D8A95" strokeWidth="2" />
    </g>
  ),
  'worm-house': () => (
    <g>
      <rect x="10" y="40" width="60" height="38" rx="4" fill="#8A5A3B" />
      <path d="M10 40h60" stroke="#5FA84A" strokeWidth="6" />
      <path d="M22 62 q6 -8 12 0 t12 0 t12 0" stroke="#F4A3C4" strokeWidth="5" fill="none" strokeLinecap="round" />
    </g>
  ),
  'miner-hat': () => (
    <g>
      <path d="M12 64c0-22 12-36 28-36s28 14 28 36z" fill="#F2C230" stroke="#C99A12" strokeWidth="2.5" />
      <rect x="6" y="62" width="68" height="8" rx="4" fill="#E0A800" />
      <circle cx="40" cy="44" r="8" fill="#FFF6C4" stroke="#C99A12" strokeWidth="2" />
    </g>
  ),
  tunnel: () => (
    <g>
      <path d="M6 78V52a34 30 0 0 1 68 0v26z" fill={STONE} stroke="#8A9AA8" strokeWidth="2" />
      <path d="M22 78V58a18 16 0 0 1 36 0v20z" fill="#3D2A1A" />
    </g>
  ),
  'sun-stone': () => (
    <g>
      <ellipse cx="40" cy="66" rx="34" ry="12" fill={STONE} stroke="#8A9AA8" strokeWidth="2" />
      <circle cx="60" cy="22" r="10" fill="#FFC93C" />
      <path d="M60 4v6M60 34v6M42 22h6M72 22h6M47 9l4 4M69 31l4 4M47 35l4-4M69 13l4-4" stroke="#FFC93C" strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  'stone-wall': () => (
    <g fill={STONE} stroke="#8A9AA8" strokeWidth="2">
      <rect x="6" y="62" width="22" height="16" rx="3" />
      <rect x="29" y="62" width="22" height="16" rx="3" />
      <rect x="52" y="62" width="22" height="16" rx="3" />
      <rect x="16" y="46" width="22" height="16" rx="3" />
      <rect x="40" y="46" width="22" height="16" rx="3" />
      <rect x="28" y="30" width="22" height="16" rx="3" />
    </g>
  ),
  fern: () => (
    <g stroke={LEAF} strokeWidth="3" fill="none" strokeLinecap="round">
      <path d="M40 78 Q38 46 22 18" />
      <path d="M40 78 Q44 46 62 20" />
      <path d="M36 60l-10-4M34 48l-10-6M30 36l-8-6M42 60l10-4M46 48l10-6M50 36l8-6" stroke={LEAF_LIGHT} />
    </g>
  ),
  sandbox: () => (
    <g>
      <rect x="6" y="54" width="68" height="24" rx="3" fill={WOOD} stroke={WOOD_DARK} strokeWidth="2.5" />
      <path d="M10 58 Q40 46 70 58v14H10z" fill="#F2D27A" />
      <path d="M50 52l10-16" stroke="#E0533A" strokeWidth="4" strokeLinecap="round" />
      <path d="M56 32h10l-3 8h-6z" fill="#E0533A" />
    </g>
  ),
  cactus: () => (
    <g>
      <path d="M22 62h36l-4 16H26z" fill="#C8642A" />
      <rect x="32" y="18" width="16" height="46" rx="8" fill="#3AA17E" />
      <path d="M32 40h-8a6 6 0 0 1-6-6v-6" stroke="#3AA17E" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M48 46h8a6 6 0 0 0 6-6v-8" stroke="#3AA17E" strokeWidth="8" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="16" r="5" fill="#F4A3C4" />
    </g>
  ),
  hollow: () => (
    <g>
      <rect x="22" y="6" width="36" height="72" rx="6" fill={WOOD} stroke={WOOD_DARK} strokeWidth="2.5" />
      <ellipse cx="40" cy="36" rx="10" ry="13" fill="#3D2A1A" />
      <path d="M58 26h14" stroke={WOOD_DARK} strokeWidth="5" strokeLinecap="round" />
    </g>
  ),
  'moon-lamp': () => (
    <g>
      <path d="M40 78V40" stroke={WOOD_DARK} strokeWidth="4" />
      <circle cx="40" cy="28" r="16" fill="#FFF6C4" stroke="#E0A800" strokeWidth="2" />
      <circle cx="46" cy="24" r="12" fill="#FFFFFF" />
    </g>
  ),
  feather: () => (
    <g>
      <path d="M22 72 Q30 30 62 10 Q60 44 22 72z" fill="#C49A6C" stroke="#8A5A3B" strokeWidth="2" />
      <path d="M22 72 L56 18" stroke="#8A5A3B" strokeWidth="2" />
    </g>
  ),
  'branch-swing': () => (
    <g>
      <path d="M4 12 Q40 4 76 14" stroke={WOOD_DARK} strokeWidth="6" fill="none" strokeLinecap="round" />
      <ellipse cx="20" cy="8" rx="8" ry="4" fill={LEAF_LIGHT} />
      <path d="M28 12v44M52 12v44" stroke="#C9A36A" strokeWidth="2.5" />
      <rect x="22" y="54" width="36" height="7" rx="3" fill={WOOD} />
    </g>
  ),
  'star-spinner': () => (
    <g>
      <path d="M40 78V36" stroke={WOOD_DARK} strokeWidth="4" />
      <path d="M40 10l6 14 15 1-12 9 4 15-13-8-13 8 4-15-12-9 15-1z" fill="#FFC93C" stroke="#E0A800" strokeWidth="2" strokeLinejoin="round" />
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

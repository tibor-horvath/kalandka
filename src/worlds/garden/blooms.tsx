import type { ReactElement } from 'react';
import type { SpeciesId } from './games/water/logic';

// The watering game's grown flowers, each drawn as its real species: the child hears the
// flower's name, so the picture shows what they would see in a garden or meadow.
// All share GrowingPlant's 240 × 300 box, standing on its bottom edge.

const STEM = '#3F8F3A';
const LEAF = '#5BAA4A';
const LEAF_LIGHT = '#7CC35C';

/** n evenly spaced angles in degrees, starting at `offset`. */
export const turns = (n: number, offset = 0) => Array.from({ length: n }, (_, i) => offset + (360 / n) * i);

const BELL = 'M-9 0 C-12 16 -16 32 -26 48 L-17 44 L-12 53 L-5 45 L0 54 L5 45 L12 53 L17 44 L26 48 C16 32 12 16 9 0 Z';

function Bell({ x, y, turn }: { x: number; y: number; turn: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${turn})`}>
      <path d={BELL} fill="#8C86E8" />
      <path d="M1 2 C3 20 4 36 0 54 L5 45 L12 53 L17 44 L26 48 C16 32 12 16 9 0 Z" fill="#00000018" />
      <path d="M0 48 V62" stroke="#F4F1FF" strokeWidth="3" strokeLinecap="round" />
      <path d="M-9 0 L-15 -1 L-8 -6 L0 -4 L8 -6 L15 -1 L9 0 Z" fill={LEAF} />
    </g>
  );
}

/** Harangvirág: nodding five-pointed bells along an arching stem. */
function Bellflower() {
  return (
    <>
      <path d="M112 300 C106 230 112 160 112 96 C112 56 136 34 170 44" stroke={STEM} strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M111 244 C90 232 74 234 60 246 C80 256 98 254 111 244 Z" fill={LEAF} />
      <path d="M113 196 C132 182 152 182 166 190 C150 202 130 204 113 196 Z" fill={LEAF_LIGHT} />
      <path d="M112 128 C98 122 86 124 76 132 C90 138 102 136 112 128 Z" fill={LEAF} />
      <path d="M136 44 Q140 56 140 66 M112 98 Q96 96 90 110" stroke={STEM} strokeWidth="4" fill="none" strokeLinecap="round" />
      <Bell x={172} y={52} turn={-8} />
      <Bell x={140} y={68} turn={4} />
      <Bell x={90} y={112} turn={12} />
    </>
  );
}

/** Tulipán: a closed cup of three petals, long blue-green leaves from the ground. */
function Tulip() {
  return (
    <>
      <path d="M120 300 C118 240 122 170 120 108" stroke={STEM} strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M116 300 C94 262 80 214 88 162 C102 204 112 252 126 300 Z" fill="#79A86E" />
      <path d="M124 300 C144 264 162 228 176 188 C168 236 150 272 134 300 Z" fill="#8DBA80" />
      <path d="M98 72 C102 50 112 38 120 34 C128 38 138 50 142 72 Z" fill="#C9406E" />
      <path d="M118 114 C90 112 82 86 88 48 C102 58 112 70 122 88 Z" fill="#D9507E" />
      <path d="M122 114 C150 112 158 86 152 48 C138 58 128 70 118 88 Z" fill="#D9507E" />
      <path d="M120 42 C136 50 142 80 138 104 C132 116 108 116 102 104 C98 80 104 50 120 42 Z" fill="#F2709C" />
      <path d="M114 56 C110 72 110 90 112 104" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  );
}

const SUN_RAY = 'M0 -30 C8 -40 8 -60 0 -70 C-8 -60 -8 -40 0 -30 Z';
const SEEDS: [number, number, number][] = [
  ...turns(12).map((a): [number, number, number] => [18 * Math.cos((a * Math.PI) / 180), 18 * Math.sin((a * Math.PI) / 180), 2.6]),
  ...turns(6).map((a): [number, number, number] => [9 * Math.cos((a * Math.PI) / 180), 9 * Math.sin((a * Math.PI) / 180), 2.4])
];

/** Napraforgó: many pointed rays round a big brown seed head, thick stem, broad leaves. */
function Sunflower() {
  return (
    <>
      <path d="M120 300 C116 240 124 170 120 120" stroke={STEM} strokeWidth="14" fill="none" strokeLinecap="round" />
      <path d="M118 226 C90 200 50 204 36 232 C60 258 100 254 118 226 Z" fill={LEAF} />
      <path d="M122 176 C150 148 192 152 206 180 C182 206 142 204 122 176 Z" fill={LEAF_LIGHT} />
      <path d="M116 228 C92 222 70 224 46 230 M124 176 C148 170 172 172 196 180" stroke={STEM} strokeWidth="2.5" fill="none" />
      <g transform="translate(120 80)">
        {turns(20, 9).map((a) => (
          <path key={`b${a}`} d={SUN_RAY} fill="#E9A21A" transform={`rotate(${a})`} />
        ))}
        {turns(20).map((a) => (
          <path key={a} d={SUN_RAY} fill="#FFC93C" transform={`rotate(${a})`} />
        ))}
        <circle r="36" fill="#5A3418" />
        <circle r="27" fill="#6E4322" />
        {SEEDS.map(([x, y, r]) => (
          <circle key={`${x},${y}`} cx={x} cy={y} r={r} fill="#3B2210" />
        ))}
      </g>
    </>
  );
}

/** Százszorszép: low, thin white rays with pink tips, a small yellow middle, a rosette on the ground. */
function Daisy() {
  return (
    <>
      <path d="M120 300 C118 262 122 222 120 184" stroke={STEM} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M120 296 C100 294 72 288 56 276 C48 268 56 260 66 264 C86 272 104 284 120 296 Z" fill={LEAF} />
      <path d="M120 296 C140 294 168 288 184 276 C192 268 184 260 174 264 C154 272 136 284 120 296 Z" fill={LEAF} />
      <path d="M120 296 C108 286 92 266 90 250 C90 242 100 240 104 248 C112 262 118 280 120 296 Z" fill={LEAF_LIGHT} />
      <path d="M120 296 C132 286 148 266 150 250 C150 242 140 240 136 248 C128 262 122 280 120 296 Z" fill={LEAF_LIGHT} />
      <g transform="translate(120 168)">
        {turns(24).map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <path d="M0 -9 C3 -14 3 -34 0 -38 C-3 -34 -3 -14 0 -9 Z" fill="#FFFFFF" stroke="#C9D3DB" strokeWidth="1" />
            <path d="M0 -31 C2.4 -33 2.4 -37 0 -38 C-2.4 -37 -2.4 -33 0 -31 Z" fill="#F28AAE" />
          </g>
        ))}
        <circle r="11" fill="#FFC93C" />
        <circle r="6" fill="#F2A81D" />
      </g>
    </>
  );
}

const POPPY_PETAL = 'M0 0 C-30 -4 -42 -32 -28 -50 C-16 -64 16 -64 28 -50 C42 -32 30 -4 0 0 Z';

/** Pipacs: four crumpled scarlet petals with black spots, a nodding bud beside it. */
function Poppy() {
  return (
    <>
      <path d="M120 300 C110 250 132 200 118 150 C112 124 122 104 120 92" stroke="#4E8F3E" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M118 220 C98 204 86 176 94 156 C100 146 110 152 108 164" stroke="#4E8F3E" strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="106" cy="174" rx="9" ry="13" fill="#6E9A55" />
      <path d="M100 168 Q106 176 112 168" stroke="#4E7A3C" strokeWidth="1.5" fill="none" />
      <path d="M118 262 C104 256 98 246 86 248 C90 240 80 236 72 238 C78 230 70 224 60 226 C76 214 104 234 118 250 Z" fill={LEAF} />
      <path d="M120 236 C134 228 140 216 152 218 C150 210 160 206 168 208 C164 200 172 194 182 196 C168 186 136 206 120 224 Z" fill={LEAF_LIGHT} />
      <g transform="translate(120 82)">
        {[45, 225, 135, 315].map((a, i) => (
          <g key={a} transform={`rotate(${a})`}>
            <path d={POPPY_PETAL} fill={i < 2 ? '#C42A20' : '#E2382B'} />
            <path d="M-2 -12 Q-8 -32 -16 -50 M6 -14 Q10 -34 18 -48" stroke="#00000020" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        ))}
        {[45, 135, 225, 315].map((a) => (
          <path key={a} d="M0 -8 C-11 -12 -13 -23 0 -27 C13 -23 11 -12 0 -8 Z" fill="#1A1412" transform={`rotate(${a})`} />
        ))}
        <circle r="15" fill="#2A211C" />
        <circle r="15" fill="none" stroke="#14100D" strokeWidth="6" strokeDasharray="2 3" />
        <circle r="8" fill="#9DB27F" />
        <path d="M-7 0 H7 M0 -7 V7 M-5 -5 L5 5 M-5 5 L5 -5" stroke="#3A3A2E" strokeWidth="1.6" />
      </g>
    </>
  );
}

const HEART_LEAF = 'M0 0 C-6 -6 -14 -4 -22 -10 C-34 -20 -26 -40 0 -56 C26 -40 34 -20 22 -10 C14 -4 6 -6 0 0 Z';

/** Ibolya: two petals up, two to the sides, a striped one below; heart-shaped leaves. */
function Violet() {
  return (
    <>
      <path d="M120 300 L84 262 M120 300 L158 260 M120 300 L120 242" stroke={STEM} strokeWidth="4" strokeLinecap="round" />
      {(
        [
          ['translate(84 264) rotate(-38)', LEAF],
          ['translate(158 262) rotate(36)', LEAF],
          ['translate(120 246) scale(0.9)', LEAF_LIGHT]
        ] as const
      ).map(([t, fill]) => (
        <g key={t} transform={t}>
          <path d={HEART_LEAF} fill={fill} />
          <path d="M0 -4 V-48" stroke={STEM} strokeWidth="2" />
        </g>
      ))}
      <path d="M126 300 C134 250 150 196 124 166" stroke={STEM} strokeWidth="4" fill="none" strokeLinecap="round" />
      <g transform="translate(120 146) rotate(8) scale(1.5)">
        <ellipse cx="-9" cy="-20" rx="12" ry="19" transform="rotate(-18 -9 -20)" fill="#6A3FB5" />
        <ellipse cx="9" cy="-20" rx="12" ry="19" transform="rotate(18 9 -20)" fill="#6A3FB5" />
        <ellipse cx="-18" cy="0" rx="10" ry="16" transform="rotate(-62 -18 0)" fill="#7B4FC9" />
        <ellipse cx="18" cy="0" rx="10" ry="16" transform="rotate(62 18 0)" fill="#7B4FC9" />
        <path d="M0 -4 C14 -2 20 12 14 22 C8 28 -8 28 -14 22 C-20 12 -14 -2 0 -4 Z" fill="#8A5ED6" />
        <path d="M0 -2 C6 0 6 7 0 9 C-6 7 -6 0 0 -2 Z" fill="#FFFFFF" />
        <path d="M-6 12 L-8 20 M0 12 V22 M6 12 L8 20" stroke="#3E2470" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="0" cy="1" r="2" fill="#F2A81D" />
      </g>
    </>
  );
}

/** Margaréta: tall stem, broad white rays, a big yellow middle, toothed leaves. */
function OxeyeDaisy() {
  return (
    <>
      <path d="M120 300 C116 240 124 170 120 100" stroke={STEM} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M119 224 C104 218 92 210 78 210 L85 215 L78 219 L87 222 L82 227 C96 230 108 229 119 224 Z" fill={LEAF} />
      <path d="M121 172 C136 164 150 158 164 160 L158 165 L165 169 L156 172 L161 177 C147 179 133 178 121 172 Z" fill={LEAF} />
      <path d="M120 296 C100 292 82 282 74 270 C70 262 78 258 86 264 C98 274 110 286 120 296 Z" fill={LEAF_LIGHT} />
      <path d="M120 296 C140 292 158 282 166 270 C170 262 162 258 154 264 C142 274 130 286 120 296 Z" fill={LEAF_LIGHT} />
      <g transform="translate(120 80)">
        {turns(20).map((a) => (
          <path
            key={a}
            d="M0 -15 C6 -17 7 -46 3 -55 C1 -53 -1 -53 -3 -55 C-7 -46 -6 -17 0 -15 Z"
            fill="#FFFFFF"
            stroke="#C9D3DB"
            strokeWidth="1"
            transform={`rotate(${a})`}
          />
        ))}
        <circle r="18" fill="#F7B92B" />
        <circle r="12" fill="#FFD54A" />
      </g>
    </>
  );
}

function PrimroseHead({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(1.25)`}>
      {turns(5).map((a) => (
        <path
          key={a}
          d="M0 -5 C-11 -12 -16 -26 -8 -31 C-3 -34 0 -30 0 -27 C0 -30 3 -34 8 -31 C16 -26 11 -12 0 -5 Z"
          fill="#F7DC6F"
          stroke="#E0C04A"
          strokeWidth="1"
          transform={`rotate(${a})`}
        />
      ))}
      <path d="M0 -9 L2.5 -3 L8.6 -2.8 L4 1.6 L5.3 7.3 L0 4.3 L-5.3 7.3 L-4 1.6 L-8.6 -2.8 L-2.5 -3 Z" fill="#E8A317" />
      <circle r="2.4" fill="#7A8F3A" />
    </g>
  );
}

/** Kankalin: pale yellow notched petals, an orange star eye, a wrinkled leaf rosette. */
function Primrose() {
  return (
    <>
      <path d="M120 284 L94 196 M120 284 L148 186 M120 284 L120 150" stroke="#6FA35E" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M120 296 C98 286 64 266 52 236 C50 226 60 222 70 228 C92 242 110 268 120 296 Z" fill={LEAF} />
      <path d="M120 296 C142 286 176 266 188 236 C190 226 180 222 170 228 C148 242 130 268 120 296 Z" fill={LEAF} />
      <path d="M118 296 C108 270 88 236 88 210 C90 200 100 200 104 208 C114 232 120 266 118 296 Z" fill={LEAF_LIGHT} />
      <path d="M122 296 C132 270 152 236 152 210 C150 200 140 200 136 208 C126 232 120 266 122 296 Z" fill={LEAF_LIGHT} />
      <path
        d="M118 292 C96 270 74 248 62 234 M122 292 C144 270 166 248 178 234 M118 290 C110 260 100 232 96 210 M122 290 C130 260 140 232 144 210"
        stroke={STEM}
        strokeWidth="1.6"
        fill="none"
      />
      <PrimroseHead x={92} y={188} />
      <PrimroseHead x={150} y={178} />
      <PrimroseHead x={120} y={142} />
    </>
  );
}

const PEONY_PETAL = 'M0 0 C-22 -8 -30 -38 -14 -50 C-6 -54 6 -54 14 -50 C30 -38 22 -8 0 0 Z';
const PEONY_LEAF =
  'M0 0 C-4 -16 -18 -30 -32 -34 C-18 -40 -8 -32 -2 -24 C-4 -36 -2 -50 6 -62 C10 -48 8 -36 4 -24 C12 -32 22 -38 36 -34 C22 -28 8 -16 0 0 Z';

/** Bazsarózsa: a big, full, ruffled bloom and deeply cut dark leaves. */
function Peony() {
  return (
    <>
      <path d="M120 300 C118 240 122 170 120 120" stroke="#3B7A34" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M120 250 C100 232 84 220 66 214 M120 210 C140 196 158 186 176 182" stroke="#3B7A34" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d={PEONY_LEAF} fill={STEM} transform="translate(68 216) rotate(-70) scale(1.1)" />
      <path d={PEONY_LEAF} fill="#4E9A44" transform="translate(174 184) rotate(70) scale(1.1)" />
      <path d={PEONY_LEAF} fill={STEM} transform="translate(120 276) rotate(-20) scale(0.9)" />
      <g transform="translate(120 82)">
        {turns(8, 22.5).map((a) => (
          <path key={`o${a}`} d={PEONY_PETAL} fill="#E07C9E" transform={`rotate(${a})`} />
        ))}
        {turns(8).map((a) => (
          <path key={`m${a}`} d={PEONY_PETAL} fill="#F79AB8" transform={`rotate(${a}) scale(0.76)`} />
        ))}
        {turns(5, 10).map((a) => (
          <path key={`i${a}`} d={PEONY_PETAL} fill="#FBB8CD" transform={`rotate(${a}) scale(0.5)`} />
        ))}
        <path d="M-16 -4 Q-8 -16 0 -8 Q8 -16 16 -4 M-12 8 Q-4 0 4 8 Q10 2 14 10" stroke="#E07C9E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
    </>
  );
}

const BLOOMS: Record<SpeciesId, () => ReactElement> = {
  harangvirag: Bellflower,
  tulipan: Tulip,
  napraforgo: Sunflower,
  szazszorszep: Daisy,
  pipacs: Poppy,
  ibolya: Violet,
  margareta: OxeyeDaisy,
  kankalin: Primrose,
  bazsarozsa: Peony
};

/** The grown plant of a species, stem and leaves included. */
export function Bloom({ species }: { species: SpeciesId }) {
  const Species = BLOOMS[species];
  return <Species />;
}

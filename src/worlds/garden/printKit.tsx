import { diceFace } from './games/flash/layout';
import { Num, type Density, type Grid } from '../../print/sheet';

// Drawing helpers shared by the Számkertész sheets.

export const pickGrid = (density: Density, big: Grid, normal: Grid, many: Grid): Grid => (density === 'big' ? big : density === 'many' ? many : normal);

const DOT = '#B77B45';

/** White petals vanish on white paper: a pale grey keeps the flower's shape. */
export const paper = (petal: string) => (petal.toUpperCase() === '#FFFFFF' ? '#E3E9EE' : petal);

/**
 * A dot picture of n fitted into a w × h box, drawn like the app's dot cards but with bolder dots for paper:
 * a dice face up to 5, a five and the rest up to 10, two ten-frames from 11 to 20.
 */
export function Dots({ n, x, y, w, h }: { n: number; x: number; y: number; w: number; h: number }) {
  if (n > 10) {
    const cell = Math.min(w / 11, h / 2);
    const ox = x + (w - cell * 11) / 2;
    const oy = y + (h - cell * 2) / 2;
    return (
      <g>
        {Array.from({ length: 20 }, (_, k) => {
          const i = k % 10;
          const cx = ox + (Math.floor(k / 10) * 6 + (i % 5) + 0.5) * cell;
          const cy = oy + (Math.floor(i / 5) + 0.5) * cell;
          return <circle key={k} cx={cx} cy={cy} r={cell * 0.36} fill={k < n ? DOT : '#EFE4D6'} />;
        })}
      </g>
    );
  }
  const groups = n <= 5 ? [n] : [5, n - 5];
  const size = Math.min(w / (groups.length * 1.15), h);
  const ox = x + (w - size * groups.length * 1.15 + size * 0.15) / 2;
  const oy = y + (h - size) / 2;
  return (
    <g>
      {groups.flatMap((k, g) =>
        diceFace(k).map(([u, v], i) => <circle key={`${g}-${i}`} cx={ox + g * size * 1.15 + u * size} cy={oy + v * size} r={size * 0.12} fill={DOT} />)
      )}
    </g>
  );
}

/** A numeral card with the dot picture under it (dots only on the easy levels). */
export function NumberCard(n: number, w: number, h: number, dots: boolean) {
  if (!dots) return <Num x={w / 2} y={h / 2} n={n} size={h * 0.6} />;
  return (
    <>
      <Num x={w / 2} y={h * 0.3} n={n} size={h * 0.4} />
      <Dots n={n} x={8} y={h * 0.54} w={w - 16} h={h * 0.4} />
    </>
  );
}

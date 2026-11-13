import { TRACE_LEVELS as TRACE_GAME_LEVELS, arrowPoints, digitShape, heading, lapOrder, pathData, startArrowPoint, type DigitShape } from './logic';
import { ladderOf } from '../../../../state/ladder';
import { ANSWER, At, FAINT, FONT, INK, LINE, MAX_PAGES, Pic, spec } from '../../../../print/sheet';
import { Dots, pickGrid } from '../../printKit';

// Mézút on paper.

/** Mixed orders the mixed sheets cycle through; lapOrder recurses once per lap, so the lap must stay small. */
const TRACE_LAPS = 40;
const TRACE_TRAIL = '#6F9FC6';

/** How much of the way a box shows: the whole trail, a faint one, only where each line starts, or nothing. */
type TraceBox = 'full' | 'faint' | 'start' | 'empty';

function Trail({ shape, look }: { shape: DigitShape; look: Exclude<TraceBox, 'empty'> }) {
  const faint = look !== 'full';
  return (
    <g>
      {look !== 'start' &&
        shape.strokes.map((pts, s) => (
          <path key={s} d={pathData(pts)} fill="none" stroke={faint ? FAINT : TRACE_TRAIL} strokeWidth={faint ? 7 : 10} strokeLinecap="round" strokeDasharray={faint ? '0.1 16' : '0.1 14'} />
        ))}
      {/* With no trail around it, a lone arrow head reads as a stroke of its own (a "7"): it gets a shaft from the start dot. */}
      {look === 'start' &&
        shape.strokes.map((pts, s) => (
          <path key={`shaft${s}`} d={pathData(pts.slice(Math.min(3, startArrowPoint(pts)), startArrowPoint(pts) + 1))} fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        ))}
      {shape.strokes.map((pts, s) =>
        (look === 'start' ? [startArrowPoint(pts)] : arrowPoints(pts)).map((i) => (
          <At key={`${s}-${i}`} x={pts[i].x} y={pts[i].y} r={heading(pts, i)}>
            <path d="M-7 -11 L7 0 L-7 11" fill="none" stroke={look === 'faint' ? '#9FB3C8' : INK} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </At>
        ))
      )}
      {shape.strokes.map((pts, s) => {
        // The 5's two strokes start at the same corner: the second number stands just beside the first.
        const shared = s > 0 && Math.hypot(pts[0].x - shape.strokes[0][0].x, pts[0].y - shape.strokes[0][0].y) < 20;
        const x = pts[0].x + (shared ? 30 : 0);
        // With only the start to go by, the numbers still say which line comes first.
        const numbered = shape.strokes.length > 1 && look !== 'faint';
        return (
          <g key={`start${s}`}>
            <circle cx={x} cy={pts[0].y} r={look === 'faint' ? 10 : 15} fill={ANSWER} />
            {numbered && (
              <text x={x} y={pts[0].y + 7} textAnchor="middle" fontFamily={FONT} fontSize="20" fontWeight="800" fill="#FFFFFF">
                {s + 1}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

interface TraceTask {
  digit: number;
  faded: boolean;
  /** Boxes in the row: the most help first, the rest empty to write alone. */
  boxes: TraceBox[];
}

/** One sheet a level of the game: honey trails, faint trails for each half, all ten faint, then only the starts. */
export const trace = spec<TraceTask>({
  id: 'trace',
  rev: 2,
  levels: TRACE_GAME_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'trace').level,
  grid: (_, d) => pickGrid(d, [1, 4], [1, 5], [1, 7]),
  ask: (level) =>
    level === 0
      ? 'Vezesd a ceruzát a pöttyökön a zöld ponttól a nyilak irányába!'
      : level === 1
        ? 'Vezesd a ceruzát a pöttyökön a zöld ponttól a nyilak irányába, aztán írd le egyedül is!'
        : TRACE_GAME_LEVELS[level].bare
          ? 'Hány pötty van a sor elején? Írd le a számát fejből: kezdd a zöld pontnál, és indulj a nyíl irányába!'
          : 'Írd le a számot a halvány pöttyökön, aztán egyedül is!',
  tip: (level) =>
    TRACE_GAME_LEVELS[level].bare
      ? 'A sor elején a pöttyök száma mutatja, melyik számot írja (az üres kártya a nulla); mondják is ki együtt. A szám alakja nincs a lapon: fejből írja, csak a kezdőpont és az első irány segít. Ha elakad, mutassa meg egyszer az ujjával a levegőben, aztán próbálja újra.'
      : level >= 2
        ? 'A szám most is a zöld pontnál kezdődik, és a nyilak mutatják az irányt. Ha elakad, írják le együtt az ujjukkal a levegőbe.'
        : level === 0
          ? 'A szám a zöld pontnál kezdődik, és a nyilak mutatják az irányt. A 4 és az 5 két vonalból áll: a kis szám mutatja, melyik jön először.'
          : 'A szám a zöld pontnál kezdődik, és a nyilak mutatják az irányt. A 7 két vonalból áll: a kis szám mutatja, melyik jön először.',
  // The mixed levels shuffle the digits; the others keep the game's order.
  reshuffles: (level) => !!TRACE_GAME_LEVELS[level].mixed,
  tasks: (req) => {
    const { digits: order, faded, mixed, bare } = TRACE_GAME_LEVELS[req.level];
    const digits = mixed ? lapOrder(1 + ((req.batch * MAX_PAGES + req.page) % TRACE_LAPS)) : order;
    const total = req.density === 'big' ? 4 : req.density === 'many' ? 8 : 6;
    // The easiest level has a trail to follow in every box; the next leaves the second half empty to write alone.
    // The faint halves give half a row of faint trails, all ten mixed just one, and Csak a kezdőpont one start.
    const guided = req.level === 0 ? total : faded && mixed ? 1 : total / 2;
    const look: TraceBox = bare ? 'start' : faded ? 'faint' : 'full';
    const boxes = Array.from({ length: total }, (_, i): TraceBox => (i >= guided ? 'empty' : i === 0 && !faded ? 'full' : faded ? look : 'faint'));
    return Array.from({ length: req.count }, (_, i) => ({ digit: digits[(req.page * req.count + i) % digits.length], faded, boxes }));
  },
  Task: ({ task }) => {
    const shape = digitShape(task.digit);
    // Csak a kezdőpont shows no trail. The game only names the digit and the child writes it from memory, so the row
    // opens with that many dots, never the digit's shape: copying a printed digit would be easier than the faint trail.
    const cue = task.boxes[0] === 'start' ? 1 : 0;
    const n = task.boxes.length + cue;
    return (
      <Pic w={n * 220 - 20} h={300}>
        {cue > 0 && (
          <g>
            <rect x="2" y="2" width="196" height="296" rx="18" fill="#F4F8FB" stroke={FAINT} strokeWidth="3" strokeDasharray={task.digit === 0 ? '10 8' : undefined} />
            {/* Zero is the empty card; 6–9 stack a five over the rest, so the dots stay as big as the small numbers'. */}
            {task.digit > 5 ? (
              <>
                <Dots n={5} x={30} y={30} w={140} h={110} />
                <Dots n={task.digit - 5} x={30} y={160} w={140} h={110} />
              </>
            ) : (
              task.digit > 0 && <Dots n={task.digit} x={30} y={80} w={140} h={140} />
            )}
          </g>
        )}
        {task.boxes.map((b, i) => (
          <At key={i} x={(i + cue) * 220} y={0}>
            <rect x="2" y="2" width="196" height="296" rx="18" fill="#FFFFFF" stroke={LINE} strokeWidth="3" />
            <path d="M14 22 H186 M14 150 H186" stroke={LINE} strokeWidth="2" strokeDasharray="6 8" />
            <path d="M14 282 H186" stroke={FAINT} strokeWidth="3" />
            {b !== 'empty' && <Trail shape={shape} look={b} />}
          </At>
        ))}
      </Pic>
    );
  }
});

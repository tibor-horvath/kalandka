import { Basket, Bouquet, DROP_PATH, Hive, PatternFlower, RoundFlower, Seed, SmallPot } from '../components/art';
import { ADD_LEVELS, BOX_W, RIGHT_X, SCENE_H, bedWidth, buildAddRound, hiveX, type AddItem, type AddRound } from '../games/add/logic';
import { FIELD_H, FIELD_W, LEVELS as FLASH_LEVELS, buildFlashRound, type FlashRound } from '../games/flash/logic';
import { diceFace, rng } from '../games/flash/layout';
import { CHOICES, FLOWER_LABELS, SHAPES, SHAPE_ORDER, buildRound as buildPatternRound, type FlowerKind } from '../games/patterns/logic';
import { POTS_LEVELS, boxSize, buildPotsRound, potCells, type PotsRound } from '../games/pots/logic';
import { TRACE_ORDER, arrowPoints, digitShape, heading, lapOrder, pathData, type DigitShape } from '../games/trace/logic';
import { PLANTS, plantForRound, type Plant } from '../games/water/logic';
import { ladderOf } from '../state/ladder';
import { ANSWER, At, Choices, Cross, FAINT, FONT, Gap, INK, LINE, MAX_PAGES, Num, Pic, WriteBox, roundOf, spec, type Density, type Grid } from './sheet';

// Számkertész on paper.

const pickGrid = (density: Density, big: Grid, normal: Grid, many: Grid): Grid => (density === 'big' ? big : density === 'many' ? many : normal);

const DOT = '#B77B45';

/** White petals vanish on white paper: a pale grey keeps the flower's shape. */
const paper = (petal: string) => (petal.toUpperCase() === '#FFFFFF' ? '#E3E9EE' : petal);

/**
 * A dot picture of n fitted into a w × h box, drawn like the app's dot cards but with bolder dots for paper:
 * a dice face up to 5, a five and the rest up to 10, two ten-frames from 11 to 20.
 */
function Dots({ n, x, y, w, h }: { n: number; x: number; y: number; w: number; h: number }) {
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
function NumberCard(n: number, w: number, h: number, dots: boolean) {
  if (!dots) return <Num x={w / 2} y={h / 2} n={n} size={h * 0.6} />;
  return (
    <>
      <Num x={w / 2} y={h * 0.3} n={n} size={h * 0.4} />
      <Dots n={n} x={8} y={h * 0.54} w={w - 16} h={h * 0.4} />
    </>
  );
}

// ---------- Számvetés ----------

const LEARN_STARTS = [1, 6, 11, 16];

function SeedOutline({ x, y, rx, filled }: { x: number; y: number; rx: number; filled: boolean }) {
  return <ellipse cx={x} cy={y} rx={rx} ry={rx * 1.33} fill={filled ? '#B77B45' : '#FFFFFF'} stroke="#8A5A2E" strokeWidth="3" />;
}

const learn = spec<number>({
  id: 'learn',
  rev: 1,
  world: 'garden',
  game: 'Számvetés',
  levels: ['1-től', '6-tól', '11-től', '16-tól'],
  current: (p) => LEARN_STARTS.filter((s) => (p.learnRound % 20) + 1 >= s).length - 1,
  grid: (_, d) => pickGrid(d, [1, 4], [1, 5], [1, 7]),
  ask: () => 'Nézd meg a számot, és színezz ki pont ennyi magot!',
  tip: () => 'Mondják ki együtt a számot, és számolják meg hangosan a magokat, mindegyikre rábökve.',
  reshuffles: () => false,
  tasks: (req) => {
    const start = LEARN_STARTS[req.level];
    const span = 21 - start;
    return Array.from({ length: req.count }, (_, i) => start + ((req.page * req.count + i) % span));
  },
  Task: ({ task: n, answers }) => {
    const two = n > 10;
    return (
      <Pic w={1000} h={200}>
        {/* The child meets the number here, not writes it: printed solid, in the same shape as in Mézút. */}
        {[...String(n)].map((d, i, all) => (
          <At key={i} x={(all.length === 1 ? 63 : 0) + i * 126} y={6} s={0.63}>
            {digitShape(Number(d)).strokes.map((pts, k) => (
              <path key={k} d={pathData(pts)} fill="none" stroke={INK} strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </At>
        ))}
        <Dots n={n} x={270} y={30} w={210} h={140} />
        {Array.from({ length: two ? 20 : 10 }, (_, k) => {
          const frame = Math.floor(k / 10);
          const i = k % 10;
          const x = two ? 525 + frame * 245 + (i % 5) * 47 : 545 + (i % 5) * 92;
          const y = 62 + Math.floor(i / 5) * 78;
          return <SeedOutline key={k} x={x} y={y} rx={two ? 16 : 24} filled={answers && k < n} />;
        })}
      </Pic>
    );
  }
});

// ---------- Locsolás ----------

function DropOutline({ x, y, filled }: { x: number; y: number; filled: boolean }) {
  return (
    <At x={x} y={y} s={2.6}>
      <path d={DROP_PATH} fill={filled ? '#2E86DE' : '#FFFFFF'} stroke="#2E86DE" strokeWidth="1.3" strokeLinejoin="round" />
    </At>
  );
}

const water = spec<Plant>({
  id: 'water',
  rev: 1,
  world: 'garden',
  game: 'Locsolás',
  levels: ['2–10 csepp (egy tízes keret)', '11–20 csepp (két tízes keret)'],
  current: (p) => (ladderOf(p, 'water').level >= 2 ? 1 : 0),
  grid: (level, d) => (level === 0 ? pickGrid(d, [2, 3], [2, 4], [3, 5]) : pickGrid(d, [2, 2], [2, 3], [3, 4])),
  ask: () => 'Színezz ki pont annyi cseppet, amennyit a virág kér!',
  tip: () => 'Olvassa fel a virág számát. Ha túl sokat színez, nem baj: számolják meg együtt, mennyi lett.',
  tasks: (req) =>
    Array.from({ length: req.count }, (_, i) => {
      const r = roundOf(req, i);
      return req.level === 0 ? PLANTS[r % PLANTS.length] : plantForRound(PLANTS.length + r);
    }),
  Task: ({ task: plant, answers }) => {
    const t = plant.target;
    const frames = t > 10 ? 2 : 1;
    const h = frames === 1 ? 300 : 480;
    return (
      <Pic w={570} h={h}>
        <At x={10} y={h / 2 - 150}>
          <RoundFlower petal={paper(plant.petal)} width={120} />
        </At>
        <Num x={70} y={h / 2 + 30} n={t} size={70} />
        <Dots n={t} x={0} y={h / 2 + 80} w={140} h={60} />
        {Array.from({ length: frames * 10 }, (_, k) => {
          const f = Math.floor(k / 10);
          const i = k % 10;
          return <DropOutline key={k} x={170 + (i % 5) * 80} y={30 + f * 230 + Math.floor(i / 5) * 100} filled={answers && k < t} />;
        })}
        {Array.from({ length: frames }, (_, f) => (
          <rect key={f} x="160" y={18 + f * 230} width="404" height="198" rx="16" fill="none" stroke={LINE} strokeWidth="3" />
        ))}
      </Pic>
    );
  }
});

// ---------- Virágsor ----------

interface PatternTask {
  shown: (FlowerKind | null)[];
  answer: FlowerKind;
}

const patterns = spec<PatternTask>({
  id: 'patterns',
  rev: 1,
  world: 'garden',
  game: 'Virágsor',
  levels: ['AB – két virág váltakozik', 'ABC – három virág', 'AAB – kettő-egy', 'ABB – egy-kettő', 'Hiányzik a sorból (vegyes)'],
  // The third level of the ladder holds AAB and ABB, which have a sheet each.
  current: (p) => [0, 1, 2, SHAPE_ORDER.length][ladderOf(p, 'patterns').level],
  grid: (_, d) => pickGrid(d, [1, 6], [1, 8], [2, 10]),
  ask: (level) => (level < SHAPE_ORDER.length ? 'Melyik virág jön ezután? Karikázd be!' : 'Melyik virág hiányzik a sorból? Karikázd be!'),
  tip: (level) =>
    level < SHAPE_ORDER.length
      ? 'Mondják ki együtt hangosan a sort, virágról virágra, és álljanak meg a végén: a gyerek hallani fogja, mi jön.'
      : 'Mondják ki együtt hangosan a sort, virágról virágra: a kérdőjelnél hallani, melyik virág maradt ki.',
  tasks: (req) =>
    Array.from({ length: req.count }, (_, i) => {
      const r = roundOf(req, i);
      if (req.level >= SHAPE_ORDER.length) {
        const round = buildPatternRound(SHAPE_ORDER.length + r);
        return { shown: round.shown, answer: round.answer };
      }
      // The same repeat each time, with the flowers swapped round so no two rows look alike.
      const rand = rng(r + 71);
      const kinds = [...CHOICES];
      for (let k = kinds.length - 1; k > 0; k--) {
        const j = Math.floor(rand() * (k + 1));
        [kinds[k], kinds[j]] = [kinds[j], kinds[k]];
      }
      const sequence = SHAPES[SHAPE_ORDER[req.level]].map((slot) => kinds[slot]);
      return { shown: [...sequence.slice(0, 5), null], answer: sequence[5] };
    }),
  Task: ({ task, answers }) => (
    <Pic w={890} h={136}>
      {task.shown.map((k, i) =>
        k ? (
          <At key={i} x={i * 90 + 10} y={4}>
            <PatternFlower kind={k} width={70} />
          </At>
        ) : (
          <g key={i}>
            <Gap x={i * 90} y={2} w={90} h={132} />
            {answers && (
              <g opacity="0.45">
                <At x={i * 90 + 10} y={4}>
                  <PatternFlower kind={task.answer} width={70} />
                </At>
              </g>
            )}
          </g>
        )
      )}
      <Choices x={590} y={2} w={90} h={132} gap={10} pick={CHOICES.indexOf(task.answer)} answers={answers}>
        {CHOICES.map((k) => (
          <At key={k} x={10} y={2}>
            <PatternFlower kind={k} width={70} />
            <title>{FLOWER_LABELS[k]}</title>
          </At>
        ))}
      </Choices>
    </Pic>
  )
});

// ---------- Magvillantás ----------

const flash = spec<FlashRound>({
  id: 'flash',
  rev: 1,
  world: 'garden',
  game: 'Magvillantás',
  levels: FLASH_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'flash').level,
  grid: (_, d) => pickGrid(d, [2, 4], [3, 4], [4, 5]),
  ask: () => 'Hány magot látsz? Karikázd be a számot!',
  tip: () => 'Játszhatják villantósan is: mutassa meg a képet három másodpercig, aztán takarja le a kezével, és kérdezze meg, hány magot látott.',
  tasks: (req) => Array.from({ length: req.count }, (_, i) => buildFlashRound(roundOf(req, i), req.level)),
  Task: ({ task, answers }) => (
    <Pic w={FIELD_W} h={FIELD_H + 150}>
      <rect x="2" y="2" width={FIELD_W - 4} height={FIELD_H - 4} rx="24" fill="#F7F1E8" stroke="#E6D6C2" strokeWidth="3" />
      {task.seeds.map((s, i) => (
        <At key={i} x={s.x} y={s.y} r={s.rot}>
          <At x={-36} y={-36}>
            <Seed size={72} />
          </At>
        </At>
      ))}
      <Choices x={15} y={FIELD_H + 20} w={180} h={124} gap={15} pick={task.choices.indexOf(task.count)} answers={answers}>
        {task.choices.map((n) => (
          <g key={n}>{NumberCard(n, 180, 124, task.level.dotChoices)}</g>
        ))}
      </Choices>
    </Pic>
  )
});

// ---------- Méhecske ----------

const DIGIT_FREE = (r: AddRound) => r.level.answers === 'dots';

const add = spec<AddRound>({
  id: 'add',
  rev: 1,
  world: 'garden',
  game: 'Méhecske',
  levels: ADD_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'add').level,
  grid: (level, d) => (ADD_LEVELS[level].bundles ? pickGrid(d, [1, 5], [2, 5], [2, 7]) : pickGrid(d, [2, 3], [2, 5], [3, 6])),
  ask: (level) => {
    const l = ADD_LEVELS[level];
    const how = l.answers === 'digits' ? 'Írd be a dobozba!' : 'Karikázd be!';
    if (l.strategy === 'take') return `A kaptár mellett látod, hány virágot visz el a méhecske. Húzz át ennyit! Hány maradt? ${how}`;
    return `Hány virág van összesen? ${how}`;
  },
  tip: (level) => {
    const l = ADD_LEVELS[level];
    const count = l.strategy === 'on' ? 'A kosáron álló számtól számoljanak tovább, minden virágra rábökve.' : 'Számolhatnak ujjal: minden virágra rá lehet bökni.';
    return l.bundles ? `${count} Egy csokor tíz virág.` : count;
  },
  tasks: (req) => Array.from({ length: req.count }, (_, i) => buildAddRound(roundOf(req, i), req.level)),
  Task: ({ task: r, answers }) => {
    const take = r.level.strategy === 'take';
    const wide = take && r.level.bundles;
    // On paper the second bed (or the hive) moves closer, so the flowers can be drawn bigger.
    const shift = wide ? -40 : -150;
    const xOf = (it: AddItem) => (it.group === 'b' ? it.x + shift : it.x);
    const hive = hiveX(r) + shift;
    const right = Math.max(...r.items.map((it) => xOf(it) + 50), take ? hive + 90 : RIGHT_X + shift + BOX_W);
    const w = Math.max(right, 760);
    const cx = w / 2;
    // The flowers the bee carries away on the take levels: whole bouquets first, then loose flowers from the end.
    const tens = r.items.filter((i) => i.kind === 'ten');
    const ones = r.items.filter((i) => i.kind === 'one');
    const crossed = take && Math.floor(r.b / 10) <= tens.length && r.b % 10 <= ones.length ? [...tens.slice(tens.length - Math.floor(r.b / 10)), ...ones.slice(ones.length - (r.b % 10))] : [];
    const eqY = SCENE_H + 20;
    const sum = `${r.a} ${take ? '−' : '+'} ${r.b} =`;
    const petal = (it: AddItem) => paper(it.group === 'a' ? r.petalA : r.petalB);
    return (
      <Pic w={w} h={SCENE_H + 140}>
        <rect x="4" y="4" width={bedWidth(r) - 8} height={SCENE_H - 8} rx="24" fill="#F1F8EA" stroke="#CFE6BC" strokeWidth="3" />
        {!take && <rect x={RIGHT_X + shift + 4} y="4" width={BOX_W - 8} height={SCENE_H - 8} rx="24" fill="#F1F8EA" stroke="#CFE6BC" strokeWidth="3" />}
        {r.level.strategy === 'on' && (
          <g>
            <At x={BOX_W / 2 - 95} y={20}>
              <Basket petal={paper(r.petalA)} count={r.a} />
            </At>
            <circle cx={BOX_W / 2} cy={205} r="34" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
            <Num x={BOX_W / 2} y={205} n={r.a} size={46} />
          </g>
        )}
        {r.items.map((it) => (
          <At key={it.id} x={xOf(it)} y={it.y}>
            {it.kind === 'ten' ? (
              <At x={-32} y={-46}>
                <Bouquet petal={petal(it)} width={64} />
              </At>
            ) : (
              <At x={-36} y={-39}>
                <RoundFlower petal={petal(it)} width={72} />
              </At>
            )}
          </At>
        ))}
        {answers && crossed.map((it) => <Cross key={it.id} x={xOf(it)} y={it.y} size={it.kind === 'ten' ? 60 : 50} />)}
        {take && (
          <g>
            <At x={hive - 55} y={20}>
              <Hive width={110} />
            </At>
            {DIGIT_FREE(r) ? <Dots n={r.b} x={hive - 80} y={125} w={160} h={100} /> : <Num x={hive} y={165} n={`−${r.b}`} size={70} />}
          </g>
        )}
        {DIGIT_FREE(r) ? (
          <Choices x={cx - (3 * 220 + 60) / 2} y={eqY} w={220} h={116} gap={30} pick={r.choices.indexOf(r.answer)} answers={answers}>
            {r.choices.map((n) => (
              <Dots key={n} n={n} x={15} y={12} w={190} h={92} />
            ))}
          </Choices>
        ) : r.level.answers === 'both' ? (
          <g>
            <text x={cx - 130} y={eqY + 80} textAnchor="end" fontFamily={FONT} fontSize="72" fontWeight="800" fill={INK}>
              {sum}
            </text>
            <Choices x={cx - 105} y={eqY} w={150} h={116} gap={20} pick={r.choices.indexOf(r.answer)} answers={answers}>
              {r.choices.map((n) => (
                <g key={n}>{NumberCard(n, 150, 116, true)}</g>
              ))}
            </Choices>
          </g>
        ) : (
          <g>
            <text x={cx + 40} y={eqY + 84} textAnchor="end" fontFamily={FONT} fontSize="84" fontWeight="800" fill={INK}>
              {sum}
            </text>
            <WriteBox x={cx + 64} y={eqY} size={116} answer={r.answer} answers={answers} />
          </g>
        )}
      </Pic>
    );
  }
});

// ---------- Mézút ----------

/** Mixed orders Halvány út sheets cycle through; lapOrder recurses once per lap, so the lap must stay small. */
const TRACE_LAPS = 40;
const TRACE_LEVELS = ['1–5', '6–9 és 0', 'Halvány út: mind a tíz, vegyesen'];
const TRACE_TRAIL = '#6F9FC6';

function Trail({ shape, faint }: { shape: DigitShape; faint: boolean }) {
  return (
    <g>
      {shape.strokes.map((pts, s) => (
        <path key={s} d={pathData(pts)} fill="none" stroke={faint ? FAINT : TRACE_TRAIL} strokeWidth={faint ? 7 : 10} strokeLinecap="round" strokeDasharray={faint ? '0.1 16' : '0.1 14'} />
      ))}
      {shape.strokes.map((pts, s) =>
        arrowPoints(pts).map((i) => (
          <At key={`${s}-${i}`} x={pts[i].x} y={pts[i].y} r={heading(pts, i)}>
            <path d="M-7 -11 L7 0 L-7 11" fill="none" stroke={faint ? '#9FB3C8' : INK} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </At>
        ))
      )}
      {shape.strokes.map((pts, s) => {
        // The 5's two strokes start at the same corner: the second number stands just beside the first.
        const shared = s > 0 && Math.hypot(pts[0].x - shape.strokes[0][0].x, pts[0].y - shape.strokes[0][0].y) < 20;
        const x = pts[0].x + (shared ? 30 : 0);
        return (
          <g key={`start${s}`}>
            <circle cx={x} cy={pts[0].y} r={faint ? 10 : 15} fill={ANSWER} />
            {shape.strokes.length > 1 && !faint && (
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
  /** Boxes in the row: one with the full trail, a few faint ones, the rest empty. */
  boxes: ('full' | 'faint' | 'empty')[];
}

const trace = spec<TraceTask>({
  id: 'trace',
  rev: 1,
  world: 'garden',
  game: 'Mézút',
  levels: TRACE_LEVELS,
  current: (p) => Math.min(2, ladderOf(p, 'trace').level),
  grid: (_, d) => pickGrid(d, [1, 4], [1, 5], [1, 7]),
  ask: (level) =>
    level === 0
      ? 'Vezesd a ceruzát a pöttyökön a zöld ponttól a nyilak irányába!'
      : level === 1
        ? 'Vezesd a ceruzát a pöttyökön a zöld ponttól a nyilak irányába, aztán írd le egyedül is!'
        : 'Írd le a számot a halvány pöttyökön, aztán egyedül is!',
  tip: (level) =>
    level === 2
      ? 'A szám most is a zöld pontnál kezdődik, és a nyilak mutatják az irányt. Ha elakad, írják le együtt az ujjukkal a levegőbe.'
      : level === 0
        ? 'A szám a zöld pontnál kezdődik, és a nyilak mutatják az irányt. A 4 és az 5 két vonalból áll: a kis szám mutatja, melyik jön először.'
        : 'A szám a zöld pontnál kezdődik, és a nyilak mutatják az irányt. A 7 két vonalból áll: a kis szám mutatja, melyik jön először.',
  // Halvány út mixes the digits; the other two levels keep writing order.
  reshuffles: (level) => level === 2,
  tasks: (req) => {
    const digits = req.level === 0 ? TRACE_ORDER.slice(0, 5) : req.level === 1 ? TRACE_ORDER.slice(5) : lapOrder(1 + ((req.batch * MAX_PAGES + req.page) % TRACE_LAPS));
    const total = req.density === 'big' ? 4 : req.density === 'many' ? 8 : 6;
    const faded = req.level === 2;
    // The easiest level has a trail to follow in every box; the next leaves the second half empty to write alone,
    // and Halvány út gives one faint trail.
    const guided = req.level === 0 ? total : faded ? 1 : total / 2;
    const boxes = Array.from({ length: total }, (_, i): TraceTask['boxes'][number] => (i >= guided ? 'empty' : i === 0 && !faded ? 'full' : 'faint'));
    return Array.from({ length: req.count }, (_, i) => ({ digit: digits[(req.page * req.count + i) % digits.length], faded, boxes }));
  },
  Task: ({ task }) => {
    const shape = digitShape(task.digit);
    const n = task.boxes.length;
    return (
      <Pic w={n * 220 - 20} h={300}>
        {task.boxes.map((b, i) => (
          <At key={i} x={i * 220} y={0}>
            <rect x="2" y="2" width="196" height="296" rx="18" fill="#FFFFFF" stroke={LINE} strokeWidth="3" />
            <path d="M14 22 H186 M14 150 H186" stroke={LINE} strokeWidth="2" strokeDasharray="6 8" />
            <path d="M14 282 H186" stroke={FAINT} strokeWidth="3" />
            {b !== 'empty' && <Trail shape={shape} faint={b === 'faint'} />}
          </At>
        ))}
      </Pic>
    );
  }
});

// ---------- Cserépbarátok ----------

const pots = spec<PotsRound>({
  id: 'pots',
  rev: 1,
  world: 'garden',
  game: 'Cserépbarátok',
  levels: POTS_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'pots').level,
  grid: (level, d) => (POTS_LEVELS[level].total === 5 ? pickGrid(d, [2, 4], [2, 5], [3, 7]) : pickGrid(d, [2, 3], [2, 4], [3, 5])),
  ask: () => 'Rajzolj virágot minden üres cserépbe! Hány virág kellett? Karikázd be!',
  tip: (level) =>
    POTS_LEVELS[level].total === 5
      ? 'Ötös barátok: például 3 meg 2 az 5. Számolják meg együtt az üres cserepeket.'
      : 'Tízes barátok: például 4 meg 6 a 10. Számolják meg együtt az üres cserepeket.',
  tasks: (req) => Array.from({ length: req.count }, (_, i) => buildPotsRound(roundOf(req, i), req.level)),
  Task: ({ task: r, answers }) => {
    const box = boxSize(r.total);
    const cw = 170;
    const choicesW = 3 * cw + 2 * 24;
    return (
      <Pic w={box.width} h={box.height + 150}>
        {potCells(r.total).map((c, i) => (
          <g key={i}>
            {(r.filled[i] || answers) && (
              <g opacity={r.filled[i] ? 1 : 0.5}>
                <At x={c.x - 36} y={c.y - 72}>
                  <RoundFlower petal={r.filled[i] ? r.petal : r.friendPetal} width={72} />
                </At>
              </g>
            )}
            <At x={c.x - 50} y={c.y + 6}>
              <SmallPot width={100} />
            </At>
          </g>
        ))}
        <Choices x={(box.width - choicesW) / 2} y={box.height + 20} w={cw} h={124} gap={24} pick={r.choices.indexOf(r.need)} answers={answers}>
          {r.choices.map((n) => (
            <g key={n}>{NumberCard(n, cw, 124, r.level.dotChoices)}</g>
          ))}
        </Choices>
      </Pic>
    );
  }
});

export const GARDEN_SHEETS = [learn, water, patterns, flash, add, trace, pots];

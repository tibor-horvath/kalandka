import { DROP_PATH, GrowingPlant } from '../../art';
import { WATER_LEVELS, plantForLevel, type Plant } from './logic';
import { ladderOf } from '../../../../state/ladder';
import { At, FAINT, LINE, Num, Pic, roundOf, spec } from '../../../../print/sheet';
import { pickGrid, paper, Dots } from '../../printKit';

// Locsolás on paper.

/** A drop to colour; the drops already in the frame are printed solid. */
function DropOutline({ x, y, filled, given = false }: { x: number; y: number; filled: boolean; given?: boolean }) {
  return (
    <At x={x} y={y} s={2.6}>
      <path d={DROP_PATH} fill={given ? '#1B5FA8' : filled ? '#2E86DE' : '#FFFFFF'} stroke={given ? '#1B5FA8' : '#2E86DE'} strokeWidth="1.3" strokeLinejoin="round" />
    </At>
  );
}

/** One sheet a level of the game, each plant from the game's own round. */
export const water = spec<Plant>({
  id: 'water',
  rev: 3,
  levels: WATER_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'water').level,
  grid: (level, d) => (WATER_LEVELS[level].max <= 10 ? pickGrid(d, [2, 3], [2, 4], [3, 5]) : pickGrid(d, [2, 2], [2, 3], [3, 4])),
  ask: (level) =>
    ({
      count: 'Színezz ki pont annyi cseppet, amennyit a virág kér!',
      on: 'Néhány csepp már ott van. Színezz hozzá annyit, hogy pont annyi legyen, amennyit a virág kér!',
      cross: 'Néhány csepp már ott van. Töltsd tele az első keretet, aztán színezz tovább, amíg pont annyi nem lesz, amennyit a virág kér!',
      twos: 'Színezd ki a cseppeket kettesével, párról párra, amíg pont annyi nem lesz, amennyit a virág kér!'
    })[WATER_LEVELS[level].kind],
  tip: (level) =>
    ({
      count: 'Olvassa fel a virág számát. Ha túl sokat színez, nem baj: számolják meg együtt, mennyi lett.',
      on: 'Ne kezdje elölről a számolást: a sötét cseppek számától számoljon tovább, például „hat… hét, nyolc, kilenc”.',
      cross: 'Az első keretben tíz csepp fér el. Ha tele van, onnan számoljon tovább: „tíz… tizenegy, tizenkettő”.',
      twos: 'Minden pár kettő csepp: számoljanak együtt kettesével, „kettő, négy, hat…”, és álljanak meg a virág számánál.'
    })[WATER_LEVELS[level].kind],
  others: (level) =>
    WATER_LEVELS[level].kind === 'count' ? 'Bármelyik cseppeket kiszínezheti, csak az számít, hogy pont annyi legyen.' : 'Bármelyik üres cseppeket kiszínezheti, csak az számít, hogy pont annyi legyen.',
  tasks: (req) => Array.from({ length: req.count }, (_, i) => plantForLevel(req.level, roundOf(req, i))),
  Task: ({ task: plant, answers }) => {
    const t = plant.target;
    const given = plant.given ?? 0;
    const pairs = plant.step === 2;
    const frames = t > 10 ? 2 : 1;
    const h = frames === 1 ? 300 : 480;
    // In twos the drops stand in pairs, one above the other, so a frame is five pairs.
    const spot = (k: number) => {
      const f = Math.floor(k / 10);
      const i = k % 10;
      const col = pairs ? Math.floor(i / 2) : i % 5;
      const row = pairs ? i % 2 : Math.floor(i / 5);
      return { x: 170 + col * 80, y: 30 + f * 230 + row * 100 };
    };
    return (
      <Pic w={570} h={h}>
        <At x={10} y={h / 2 - 150}>
          <GrowingPlant species={plant.id} petal={paper(plant.petal)} bloom width={104} />
        </At>
        <Num x={70} y={h / 2 + 30} n={t} size={70} />
        <Dots n={t} x={0} y={h / 2 + 80} w={140} h={60} />
        {pairs &&
          Array.from({ length: frames * 5 }, (_, c) => (
            <rect key={`pair${c}`} x={172 + (c % 5) * 80} y={26 + Math.floor(c / 5) * 230} width="58" height="172" rx="29" fill="none" stroke={FAINT} strokeWidth="3" strokeDasharray="8 7" />
          ))}
        {Array.from({ length: frames * 10 }, (_, k) => {
          const { x, y } = spot(k);
          return <DropOutline key={k} x={x} y={y} given={k < given} filled={answers && k < t} />;
        })}
        {Array.from({ length: frames }, (_, f) => (
          <rect key={f} x="160" y={18 + f * 230} width="404" height="198" rx="16" fill="none" stroke={LINE} strokeWidth="3" />
        ))}
      </Pic>
    );
  }
});

import type { ReactNode } from 'react';
import { handAngles, timeWords, type ClockTime } from '../../lib/time';
import { ANSWER, At, Choices, FONT, INK, Pic, Ring, WriteBox, roundOf, spec, type Density, type Grid } from '../../print/sheet';
import { ladderOf } from '../../state/ladder';
import { ActivityPic, DIAL_NUMBERS, DayPartSign, SeasonSign, SeasonTree } from './art';
import { ACTIVITIES, DAY_PARTS, SPANS, capital } from './games/activities';
import { DIGI_LEVELS, READ_LEVELS, SET_LEVELS, buildDigiRound, buildReadRound, buildSetRound, type DigiRound, type ReadRound, type SetRound } from './games/clock';
import { DAY_LEVELS, buildDayRound, type DayRound } from './games/day';
import { SAND_LEVELS, SPAN_WORDS, buildSandRound, type SandRound } from './games/sand';
import { MONTHS, SEASON_LEVELS, SEASON_NAMES, WEEK, answerOf, buildSeasonRound, type SeasonRound } from './games/season';
import { SLEEP_LEVELS, buildSleepRound, cardText, type SleepRound } from './games/sleep';

// Óratorony on paper: the tasks come from the games' own generators, so a sheet matches the child's level.
// Tapping becomes circling, writing a number under a picture, or drawing the clock's hands.

const pickGrid = (density: Density, big: Grid, normal: Grid, many: Grid): Grid => (density === 'big' ? big : density === 'many' ? many : normal);

/** A line of words, centred in a box. */
function Word({ x, y, w, h, text, size = 40 }: { x: number; y: number; w: number; h: number; text: string; size?: number }) {
  return (
    <text x={x + w / 2} y={y + h / 2 + size * 0.36} textAnchor="middle" fontFamily={FONT} fontSize={size} fontWeight="800" fill={INK}>
      {text}
    </text>
  );
}

/** A clock face for paper, `size` across, its top-left at the origin; hands only where given. */
function PaperClock({ size, time, hourOnly = false, hands = true, answerHands = false }: { size: number; time?: ClockTime; hourOnly?: boolean; hands?: boolean; answerHands?: boolean }) {
  const k = size / 200;
  const a = time ? handAngles(time) : null;
  const color = answerHands ? ANSWER : INK;
  return (
    <g transform={`scale(${k})`}>
      <circle cx="100" cy="100" r="94" fill="#FFFFFF" stroke={INK} strokeWidth="5" />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d="M100 10 V18" stroke={INK} strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${i * 30} 100 100)`} />
      ))}
      {DIAL_NUMBERS.map(({ n, x, y }) => (
        <text key={n} x={x} y={y + 8.5} textAnchor="middle" fontFamily={FONT} fontSize="24" fontWeight="800" fill={INK}>
          {n}
        </text>
      ))}
      {hands && a && !hourOnly && <path d="M100 100 V26" stroke={color} strokeWidth="5" strokeLinecap="round" transform={`rotate(${a.minute} 100 100)`} />}
      {hands && a && <path d="M100 100 V54" stroke={color} strokeWidth="12" strokeLinecap="round" transform={`rotate(${hourOnly ? (time!.h % 12) * 30 : a.hour} 100 100)`} />}
      <circle cx="100" cy="100" r="6" fill={INK} />
    </g>
  );
}

// ---------- Napirend ----------

/** One card of a day's thing: its picture and name in a 200 × 200 box. */
function DayCard({ id }: { id: keyof typeof ACTIVITIES }) {
  return (
    <g>
      <At x={20} y={8}>
        <ActivityPic id={id} size={160} />
      </At>
      <Word x={0} y={150} w={200} h={46} text={ACTIVITIES[id].name} size={ACTIVITIES[id].name.length > 12 ? 20 : 26} />
    </g>
  );
}

export const daySheet = spec<DayRound>({
  id: 'day',
  rev: 1,
  levels: DAY_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'day').level,
  grid: (_, d) => pickGrid(d, [1, 3], [2, 3], [2, 4]),
  ask: (level) => {
    const l = DAY_LEVELS[level];
    if (l.mode === 'part') return 'Mikor van ez? Karikázd be: reggel, délben, délután vagy este!';
    if (l.mode === 'before') return 'Mi volt előbb? Karikázd be!';
    return 'Mi történik először, mi utána? Írd a képek alá: 1, 2, 3!';
  },
  tip: (level) =>
    DAY_LEVELS[level].mode === 'seq'
      ? 'Meséljék el együtt, mit csinálnak reggel, délben és este. Aki még nem írja a számokat, húzhat egy, kettő vagy három vonalat.'
      : 'Gondolják végig együtt a gyerkőc saját napját: mi volt ma reggel, mi lesz este?',
  tasks: (req) => Array.from({ length: req.count }, (_, i) => buildDayRound(req.level, roundOf(req, i))),
  Task: ({ task, answers }) => {
    if (task.mode === 'seq') {
      // Every card of the row on paper, in a mixed order; the ones given already carry their number.
      const shown = [...task.sequence].sort((a, b) => task.choices.indexOf(a) - task.choices.indexOf(b));
      const cards = task.given === 1 && task.sequence.length === 2 ? [task.sequence[0], ...task.choices] : shown;
      return (
        <Pic w={cards.length * 220} h={320}>
          {cards.map((id, i) => {
            const n = task.sequence.indexOf(id);
            const given = n >= 0 && n < task.given;
            return (
              <g key={id}>
                <At x={i * 220 + 10} y={0}>
                  <rect width="200" height="200" rx="18" fill="#FFFFFF" stroke="#B9CBD8" strokeWidth="3" />
                  <DayCard id={id} />
                </At>
                {n >= 0 ? (
                  given ? (
                    <Word x={i * 220 + 65} y={220} w={90} h={90} text={String(n + 1)} size={60} />
                  ) : (
                    <WriteBox x={i * 220 + 65} y={220} answer={n + 1} answers={answers} />
                  )
                ) : (
                  answers && <path d={`M${i * 220 + 30} 20 L${i * 220 + 190} 180 M${i * 220 + 190} 20 L${i * 220 + 30} 180`} stroke={ANSWER} strokeWidth="6" />
                )}
              </g>
            );
          })}
        </Pic>
      );
    }
    if (task.mode === 'part') {
      return (
        <Pic w={760} h={230}>
          <At x={0} y={10}>
            <rect width="210" height="210" rx="18" fill="#FFFFFF" stroke="#B9CBD8" strokeWidth="3" />
            <DayCard id={task.activity} />
          </At>
          <Choices x={240} y={50} w={120} h={140} gap={10} pick={DAY_PARTS.indexOf(task.answer)} answers={answers}>
            {DAY_PARTS.map((p) => (
              <g key={p}>
                <At x={30} y={10}>
                  <DayPartSign part={p} size={60} />
                </At>
                <Word x={0} y={86} w={120} h={44} text={capital(p)} size={24} />
              </g>
            ))}
          </Choices>
        </Pic>
      );
    }
    return (
      <Pic w={460} h={220}>
        <Choices x={10} y={10} w={200} h={200} gap={40} pick={task.pair.indexOf(task.answer)} answers={answers}>
          {task.pair.map((id) => (
            <DayCard key={id} id={id} />
          ))}
        </Choices>
      </Pic>
    );
  }
});

// ---------- Évszakok ----------

function SeasonCard({ season, tree }: { season: keyof typeof SEASON_NAMES; tree: boolean }) {
  return tree ? (
    <At x={15} y={15}>
      <SeasonTree season={season} size={130} />
    </At>
  ) : (
    <g>
      <At x={40} y={14}>
        <SeasonSign season={season} size={80} />
      </At>
      <Word x={0} y={100} w={160} h={50} text={capital(SEASON_NAMES[season])} size={28} />
    </g>
  );
}

function SeasonScene({ r }: { r: SeasonRound }): ReactNode {
  switch (r.mode) {
    case 'which':
      return (
        <At x={290} y={0}>
          <SeasonTree season={r.season} size={180} />
        </At>
      );
    case 'cycle':
      return r.row.map((s, i) => (
        <At key={s} x={60 + i * 170} y={20}>
          {i === r.gap ? <rect x="5" y="5" width="140" height="140" rx="16" fill="#FFFFFF" stroke={INK} strokeWidth="3" strokeDasharray="10 8" /> : <SeasonTree season={s} size={150} />}
        </At>
      ));
    case 'week':
      return WEEK.map((d, i) => (
        <g key={d}>
          <rect x={i * 108 + 2} y={50} width="100" height="70" rx="14" fill="#FFFFFF" stroke={i === r.gap ? INK : '#B9CBD8'} strokeWidth="3" strokeDasharray={i === r.gap ? '10 8' : undefined} />
          {i !== r.gap && <Word x={i * 108 + 2} y={50} w={100} h={70} text={d} size={d.length > 7 ? 18 : 22} />}
        </g>
      ));
    case 'near':
    case 'far': {
      const when = r.mode === 'near' ? (r.ask === 'after' ? 'holnap' : 'tegnap') : r.ask === 'after' ? 'holnapután' : 'tegnapelőtt';
      return <Word x={0} y={40} w={760} h={110} text={`Ma ${WEEK[r.today]} van. ${capital(when)}?`} size={48} />;
    }
    case 'month':
      return <Word x={0} y={40} w={760} h={110} text={capital(MONTHS[r.month])} size={64} />;
  }
}

export const seasonSheet = spec<SeasonRound>({
  id: 'season',
  rev: 1,
  levels: SEASON_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'season').level,
  grid: (_, d) => pickGrid(d, [1, 3], [2, 3], [2, 4]),
  ask: (level) => {
    switch (SEASON_LEVELS[level].mode) {
      case 'which':
        return 'Melyik évszak van a képen? Karikázd be!';
      case 'cycle':
        return 'Melyik fa hiányzik a sorból? Karikázd be lent!';
      case 'week':
        return 'Melyik nap hiányzik a hétből? Karikázd be!';
      case 'month':
        return 'Melyik évszakban van ez a hónap? Karikázd be!';
      default:
        return 'Melyik nap az? Karikázd be!';
    }
  },
  tip: (level) =>
    SEASON_LEVELS[level].mode === 'cycle' || SEASON_LEVELS[level].mode === 'which'
      ? 'Mondják végig együtt: tavasz, nyár, ősz, tél, aztán újra tavasz. A sor bármelyik évszakkal kezdődhet.'
      : 'Mondják el együtt a hét napjait hétfőtől vasárnapig, és lépkedjenek rajtuk az ujjukkal.',
  tasks: (req) => Array.from({ length: req.count }, (_, i) => buildSeasonRound(req.level, roundOf(req, i))),
  Task: ({ task, answers }) => {
    const tree = task.mode === 'cycle';
    const words = task.mode === 'week' || task.mode === 'near' || task.mode === 'far';
    const n = task.choices.length;
    const w = words ? 200 : 160;
    const gap = 20;
    const x0 = (760 - (n * w + (n - 1) * gap)) / 2;
    return (
      <Pic w={760} h={380}>
        <SeasonScene r={task} />
        <Choices x={x0} y={210} w={w} h={160} gap={gap} pick={answerOf(task)} answers={answers}>
          {(task.choices as (string | number)[]).map((c) =>
            words ? (
              <Word key={c} x={0} y={0} w={w} h={160} text={WEEK[c as number]} size={30} />
            ) : (
              <SeasonCard key={c} season={c as keyof typeof SEASON_NAMES} tree={tree} />
            )
          )}
        </Choices>
      </Pic>
    );
  }
});

// ---------- the clocks ----------

export const setSheet = spec<SetRound>({
  id: 'set',
  rev: 1,
  levels: SET_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'set').level,
  grid: (_, d) => pickGrid(d, [2, 2], [2, 3], [3, 4]),
  ask: (level) => (SET_LEVELS[level].step === 'hourOnly' ? 'Rajzold be a kis mutatót! A rövid, vastag vonal a kiírt számra mutasson.' : 'Rajzold be a mutatókat: a kicsit rövidre és vastagra, a nagyot hosszúra!'),
  tip: (level) =>
    SET_LEVELS[level].step === 'hourOnly'
      ? 'Előbb keressék meg együtt a számot a számlapon, aztán a közepétől húzzanak felé egy rövid, vastag vonalat.'
      : 'Előbb a nagy mutató: egész órakor felfelé néz, fél órakor lefelé. Fél és negyed órakor a kis mutató két szám között áll: a fél három a kettes és a hármas között.',
  tasks: (req) => Array.from({ length: req.count }, (_, i) => buildSetRound(req.level, roundOf(req, i))),
  Task: ({ task, answers }) => {
    const hourOnly = task.level.step === 'hourOnly';
    return (
      <Pic w={520} h={260}>
        <At x={10} y={10}>
          <PaperClock size={240} time={task.target} hourOnly={hourOnly} hands={answers} answerHands />
        </At>
        <Word x={270} y={60} w={240} h={80} text={hourOnly ? String(task.target.h) : capital(timeWords(task.target))} size={hourOnly ? 90 : task.target.m % 15 === 0 ? 40 : 28} />
        {hourOnly && <Word x={270} y={140} w={240} h={60} text="óra" size={36} />}
      </Pic>
    );
  }
});

export const readSheet = spec<ReadRound>({
  id: 'read',
  rev: 1,
  levels: READ_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'read').level,
  grid: (_, d) => pickGrid(d, [2, 2], [2, 3], [2, 4]),
  ask: () => 'Hány óra van? Karikázd be!',
  tip: () => 'A kis mutató az órát, a nagy a percet mutatja. A fél és a negyed mindig a következő órát mondja: ha a kis mutató a 2 és a 3 között van, az „fél három”.',
  tasks: (req) => Array.from({ length: req.count }, (_, i) => buildReadRound(req.level, roundOf(req, i))),
  Task: ({ task, answers }) => (
    <Pic w={560} h={250}>
      <At x={5} y={5}>
        <PaperClock size={240} time={task.time} hourOnly={task.level.step === 'hourOnly'} />
      </At>
      <Choices x={0} y={0} w={0} h={0} pick={-1} answers={false}>
        {[]}
      </Choices>
      {task.choices.map((c, i) => (
        <g key={c}>
          <rect x={270} y={i * 82 + 4} width="280" height="70" rx="16" fill="#FFFFFF" stroke="#B9CBD8" strokeWidth="3" />
          <Word x={270} y={i * 82 + 4} w={280} h={70} text={capital(c)} size={c.length > 16 ? 22 : 30} />
          {answers && i === task.answer && <Ring x={270} y={i * 82 + 4} w={280} h={70} />}
        </g>
      ))}
    </Pic>
  )
});

export const digiSheet = spec<DigiRound>({
  id: 'digi',
  rev: 1,
  levels: DIGI_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'digi').level,
  grid: (_, d) => pickGrid(d, [2, 2], [2, 3], [2, 4]),
  ask: (level) => (DIGI_LEVELS[level].step === 'afternoon' ? 'Délután van. Melyik kijelző mutatja ugyanezt? Karikázd be!' : 'Melyik kijelző mutatja ugyanezt az időt? Karikázd be!'),
  tip: (level) =>
    DIGI_LEVELS[level].step === 'afternoon'
      ? 'Délben tizenkét óra van, délután innen számolunk tovább: egy óra az tizenhárom, három óra tizenöt.'
      : 'A kettőspont előtt az óra, utána a perc áll. Negyedkor a nagy mutató a 3-ason van (15 perc), a „negyed nyolc” 7:15.',
  tasks: (req) => Array.from({ length: req.count }, (_, i) => buildDigiRound(req.level, roundOf(req, i))),
  Task: ({ task, answers }) => (
    <Pic w={560} h={250}>
      <At x={5} y={5}>
        <PaperClock size={240} time={task.time} />
      </At>
      {task.choices.map((c, i) => (
        <g key={c}>
          <rect x={300} y={i * 82 + 4} width="220" height="70" rx="16" fill="#EEF2F6" stroke={INK} strokeWidth="3" />
          <Word x={300} y={i * 82 + 4} w={220} h={70} text={c} size={44} />
          {answers && i === task.answer && <Ring x={300} y={i * 82 + 4} w={220} h={70} />}
        </g>
      ))}
    </Pic>
  )
});

// ---------- Kakuk alszik ----------

export const sleepSheet = spec<SleepRound>({
  id: 'sleep',
  rev: 1,
  levels: SLEEP_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'sleep').level,
  grid: (_, d) => pickGrid(d, [1, 3], [2, 3], [2, 4]),
  ask: () => 'Kakuk lefeküdt (hold), aztán felébredt (nap). Mennyit aludt? Karikázd be!',
  tip: () => 'A gyerkőc ujjával lépjen végig a számlapon a kis mutató első helyétől a másodikig, és számolja a lépéseket: minden szám egy óra.',
  tasks: (req) => Array.from({ length: req.count }, (_, i) => buildSleepRound(req.level, roundOf(req, i))),
  Task: ({ task, answers }) => (
    <Pic w={560} h={380}>
      <At x={30} y={0}>
        <PaperClock size={200} time={task.from} />
      </At>
      <At x={300} y={0}>
        <PaperClock size={200} time={task.to} />
      </At>
      <At x={110} y={206}>
        <DayPartSign part="este" size={40} />
      </At>
      <At x={380} y={206}>
        <DayPartSign part="délben" size={40} />
      </At>
      <Choices x={10} y={260} w={170} h={100} gap={15} pick={task.answer} answers={answers}>
        {task.choices.map((m) => (
          <Word key={m} x={0} y={0} w={170} h={100} text={cardText(m)} size={cardText(m).length > 7 ? 24 : 34} />
        ))}
      </Choices>
    </Pic>
  )
});

// ---------- Homokóra ----------

export const sandSheet = spec<SandRound>({
  id: 'sand',
  rev: 1,
  levels: SAND_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'sand').level,
  grid: (_, d) => pickGrid(d, [1, 3], [2, 3], [2, 4]),
  ask: (level) => {
    const mode = SAND_LEVELS[level].mode;
    if (mode === 'span') return 'Meddig tart? Karikázd be: egy pillanat, néhány perc vagy órák!';
    return mode === 'longer' ? 'Melyik tart tovább? Karikázd be!' : 'Melyik a rövidebb? Karikázd be!';
  },
  tip: () => 'Olvassák fel a képek nevét, és játsszák el: a taps egy pillanat, a fogmosás pár perc, az alvás egy egész éjszaka.',
  tasks: (req) => Array.from({ length: req.count }, (_, i) => buildSandRound(req.level, roundOf(req, i))),
  Task: ({ task, answers }) =>
    task.mode === 'span' ? (
      <Pic w={760} h={230}>
        <At x={0} y={10}>
          <rect width="210" height="210" rx="18" fill="#FFFFFF" stroke="#B9CBD8" strokeWidth="3" />
          <DayCard id={task.activity} />
        </At>
        <Choices x={240} y={60} w={160} h={110} gap={10} pick={SPANS.indexOf(task.answer)} answers={answers}>
          {SPANS.map((s) => (
            <Word key={s} x={0} y={0} w={160} h={110} text={capital(SPAN_WORDS[s])} size={22} />
          ))}
        </Choices>
      </Pic>
    ) : (
      <Pic w={460} h={220}>
        <Choices x={10} y={10} w={200} h={200} gap={40} pick={task.answer} answers={answers}>
          {task.pair.map((id) => (
            <DayCard key={id} id={id} />
          ))}
        </Choices>
      </Pic>
    )
});

export const TOWER_SHEETS = [daySheet, seasonSheet, setSheet, readSheet, digiSheet, sleepSheet, sandSheet];

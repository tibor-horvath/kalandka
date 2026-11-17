import type { ReactNode } from 'react';
import { handAngles, timeWords, type ClockTime } from '../../lib/time';
import { ANSWER, At, Choices, FAINT, FONT, INK, Pic, Ring, WriteBox, roundOf, spec, type Density, type Explainer, type Grid, type PrintSpec } from '../../print/sheet';
import type { GameId } from '../../state/games';
import { ladderOf } from '../../state/ladder';
import { ActivityPic, DIAL_NUMBERS, DayPartSign, DaySign, SeasonSign, SeasonTree, SpanSign } from './art';
import { ACTIVITIES, DAY_PARTS, SPANS, capital } from './games/activities';
import { introFor, type IntroArt } from './games/intros';
import { DIGI_LEVELS, READ_LEVELS, SET_LEVELS, buildDigiRound, buildReadRound, buildSetRound, type DigiRound, type ReadRound, type SetRound } from './games/clock';
import { DAY_LEVELS, buildDayRound, type DayRound } from './games/day';
import { SAND_LEVELS, buildSandRound, type SandRound } from './games/sand';
import { MONTHS, SEASONS, SEASON_LEVELS, SEASON_NAMES, WEEK, answerOf, buildSeasonRound, type SeasonRound } from './games/season';
import { SLEEP_LEVELS, buildSleepRound, type SleepRound } from './games/sleep';

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

/** The point `r` from the dial's middle, `deg` clockwise from 12. */
const onDial = (deg: number, r: number) => ({ x: 100 + r * Math.sin((deg * Math.PI) / 180), y: 100 - r * Math.cos((deg * Math.PI) / 180) });

/**
 * A clock face for paper, `size` across, its top-left at the origin; hands only where given. For the magyarázó lap,
 * `wedge` shades the dial between two angles (light grey, so it prints in black and white) and `glow` rings a number.
 */
function PaperClock({ size, time, hourOnly = false, hands = true, answerHands = false, wedge, glow }: { size: number; time?: ClockTime; hourOnly?: boolean; hands?: boolean; answerHands?: boolean; wedge?: [number, number]; glow?: number }) {
  const k = size / 200;
  const a = time ? handAngles(time) : null;
  const color = answerHands ? ANSWER : INK;
  const wedgePath =
    wedge &&
    (() => {
      const p = onDial(wedge[0], 88);
      const q = onDial(wedge[1], 88);
      return `M100 100 L${p.x.toFixed(1)} ${p.y.toFixed(1)} A88 88 0 ${wedge[1] - wedge[0] > 180 ? 1 : 0} 1 ${q.x.toFixed(1)} ${q.y.toFixed(1)} Z`;
    })();
  const ring = glow ? DIAL_NUMBERS[glow - 1] : null;
  return (
    <g transform={`scale(${k})`}>
      <circle cx="100" cy="100" r="94" fill="#FFFFFF" stroke={INK} strokeWidth="5" />
      {wedgePath && <path d={wedgePath} fill="#DCE6EE" />}
      {ring && <circle cx={ring.x} cy={ring.y} r="17" fill="none" stroke={INK} strokeWidth="3" strokeDasharray="6 4" />}
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

/** The "what comes next" level: one card shown, two to choose from (one of them came earlier). */
const isNext = (r: { given: number; sequence: unknown[] }) => r.given === 1 && r.sequence.length === 2;
const isNextLevel = (level: number) => DAY_LEVELS[level].given === 1 && DAY_LEVELS[level].slots === 2;

export const daySheet = spec<DayRound>({
  id: 'day',
  rev: 2,
  levels: DAY_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'day').level,
  grid: (_, d) => pickGrid(d, [1, 3], [2, 3], [2, 4]),
  ask: (level) => {
    const l = DAY_LEVELS[level];
    if (l.mode === 'part') return 'Mikor van ez? Karikázd be: reggel, délben, délután vagy este!';
    if (l.mode === 'before') return 'Mi volt előbb? Karikázd be!';
    if (isNextLevel(level)) return 'Az első kép már megvolt. Mi jön utána? Karikázd be!';
    return l.slots === 4 ? 'Mi történik először, mi utána? Írd a képek alá: 1, 2, 3, 4!' : 'Mi történik először, mi utána? Írd a képek alá: 1, 2, 3!';
  },
  tip: (level) =>
    isNextLevel(level)
      ? 'Nézzék meg együtt a bal oldali képet: ez már megtörtént. A két kép közül az egyik még előtte volt, a másik jön utána.'
      : DAY_LEVELS[level].mode === 'seq'
        ? 'Meséljék el együtt, mit csinálnak reggel, délben és este. Aki még nem írja a számokat, húzhat egy, kettő vagy három vonalat.'
        : 'Gondolják végig együtt a gyerkőc saját napját: mi volt ma reggel, mi lesz este?',
  tasks: (req) => Array.from({ length: req.count }, (_, i) => buildDayRound(req.level, roundOf(req, i))),
  Task: ({ task, answers }) => {
    if (task.mode === 'seq' && isNext(task)) {
      // "Mi jön utána?": the card that already happened, an arrow, and two cards to choose from.
      // One of them came earlier, so they can't be numbered 1, 2, 3 in a row: the child circles the next one.
      return (
        <Pic w={760} h={220}>
          <At x={10} y={10}>
            <rect width="200" height="200" rx="18" fill="#FFFFFF" stroke={INK} strokeWidth="4" />
            <DayCard id={task.sequence[0]} />
          </At>
          <path d="M232 110 H290 M272 90 L294 110 L272 130" fill="none" stroke={INK} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <Choices x={320} y={10} w={200} h={200} gap={30} pick={task.choices.indexOf(task.sequence[1])} answers={answers}>
            {task.choices.map((id) => (
              <DayCard key={id} id={id} />
            ))}
          </Choices>
        </Pic>
      );
    }
    if (task.mode === 'seq') {
      // Every card of the row on paper, in a mixed order; the given first card carries its number.
      const cards = [...task.sequence].sort((a, b) => task.choices.indexOf(a) - task.choices.indexOf(b));
      return (
        <Pic w={cards.length * 220} h={320}>
          {cards.map((id, i) => {
            const n = task.sequence.indexOf(id);
            const given = n < task.given;
            return (
              <g key={id}>
                <At x={i * 220 + 10} y={0}>
                  <rect width="200" height="200" rx="18" fill="#FFFFFF" stroke="#B9CBD8" strokeWidth="3" />
                  <DayCard id={id} />
                </At>
                {given ? (
                  <Word x={i * 220 + 65} y={220} w={90} h={90} text={String(n + 1)} size={60} />
                ) : (
                  <WriteBox x={i * 220 + 65} y={220} answer={n + 1} answers={answers} />
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
      return <WeekRow y={40} gap={r.gap} />;
    case 'near':
    case 'far': {
      const when = r.mode === 'near' ? (r.ask === 'after' ? 'holnap' : 'tegnap') : r.ask === 'after' ? 'holnapután' : 'tegnapelőtt';
      return (
        <g>
          <Word x={0} y={0} w={760} h={60} text={`Ma ${WEEK[r.today]} van. ${capital(when)}?`} size={34} />
          <WeekRow y={86} today={r.today} />
        </g>
      );
    }
    case 'month':
      // The month's place in the year: twelve numbered tiles, the asked one drawn thick; its name above, read aloud.
      return (
        <g>
          <Word x={0} y={0} w={760} h={70} text={capital(MONTHS[r.month])} size={48} />
          {MONTHS.map((m, i) => (
            <g key={m}>
              <rect x={20 + i * 61} y={96} width="54" height="64" rx="12" fill="#FFFFFF" stroke={i === r.month ? INK : FAINT} strokeWidth={i === r.month ? 6 : 3} />
              <Word x={20 + i * 61} y={96} w={54} h={64} text={String(i + 1)} size={26} />
            </g>
          ))}
        </g>
      );
  }
}

/**
 * The week as a row of tiles, each day's sign over its small name, so the day is found by its shape and its place.
 * `gap` leaves one tile empty (dashed); `today` draws one thick with "ma" over it.
 */
function WeekRow({ y, gap, today }: { y: number; gap?: number; today?: number }) {
  return (
    <g>
      {WEEK.map((d, i) => {
        const x = 4 + i * 108;
        const empty = i === gap;
        return (
          <g key={d}>
            <rect x={x} y={y} width="100" height="104" rx="14" fill="#FFFFFF" stroke={empty || i === today ? INK : FAINT} strokeWidth={i === today ? 6 : 3} strokeDasharray={empty ? '10 8' : undefined} />
            {!empty && (
              <>
                <At x={x + 28} y={y + 8}>
                  <DaySign day={i} size={44} />
                </At>
                <Word x={x} y={y + 58} w={100} h={40} text={d} size={d.length > 7 ? 16 : 19} />
              </>
            )}
            {i === today && <Word x={x} y={y - 34} w={100} h={30} text="ma" size={24} />}
          </g>
        );
      })}
    </g>
  );
}

/** A day's card for circling: its sign big, its name small. */
function DayChoice({ day, w }: { day: number; w: number }) {
  return (
    <g>
      <At x={w / 2 - 40} y={18}>
        <DaySign day={day} size={80} />
      </At>
      <Word x={0} y={108} w={w} h={44} text={WEEK[day]} size={WEEK[day].length > 7 ? 22 : 26} />
    </g>
  );
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
              <DayChoice key={c} day={c as number} w={w} />
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
  // 2: the time is read aloud and the child circles the clock that shows it, as in the game (was: circle the words).
  rev: 2,
  levels: READ_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'read').level,
  grid: (_, d) => pickGrid(d, [2, 2], [2, 3], [2, 4]),
  ask: () => 'Olvasd fel az időt! Melyik óra mutatja? Karikázd be!',
  tip: () => 'A felnőtt felolvassa az időt, a gyerkőc az órát keresi. A kis mutató az órát, a nagy a percet mutatja. A fél és a negyed mindig a következő órát mondja: ha a kis mutató a 2 és a 3 között van, az „fél három”.',
  tasks: (req) => Array.from({ length: req.count }, (_, i) => buildReadRound(req.level, roundOf(req, i))),
  Task: ({ task, answers }) => (
    <Pic w={560} h={250}>
      <Word x={0} y={0} w={560} h={56} text={capital(timeWords(task.time))} size={timeWords(task.time).length > 16 ? 28 : 36} />
      <Choices x={5} y={70} w={170} h={170} gap={15} pick={task.answer} answers={answers}>
        {task.times.map((t) => (
          <At key={timeWords(t)} x={10} y={10}>
            <PaperClock size={150} time={t} hourOnly={task.level.step === 'hourOnly'} />
          </At>
        ))}
      </Choices>
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

// ---------- Kakukk alszik ----------

/**
 * How long, drawn as in the game: one block an hour, half a block for the half hour, the number small under them.
 * Grey and black, so it prints on any printer. Centred in a `w` × `h` box.
 */
function PaperBlocks({ minutes, w, h }: { minutes: number; w: number; h: number }) {
  const whole = Math.floor(minutes / 60);
  const half = minutes % 60 !== 0;
  const n = whole + (half ? 1 : 0);
  // A wrong card can be two hours past the longest nap (seven blocks): the blocks narrow so every row fits its box.
  const gap = n > 5 ? 4 : 6;
  const bw = Math.min(24, (w - 24 - (n - 1) * gap) / n);
  const x0 = (w - (n * bw + (n - 1) * gap)) / 2;
  const top = h / 2 - 34;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const x = x0 + i * (bw + gap);
        const isHalf = half && i === n - 1;
        return (
          <g key={i}>
            <rect x={x} y={top} width={bw} height="42" rx="6" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
            <rect x={x} y={top} width={isHalf ? bw / 2 : bw} height="42" rx="6" fill="#6E7F8F" />
          </g>
        );
      })}
      <Word x={0} y={top + 46} w={w} h={30} text={`${whole > 0 || !half ? whole : ''}${half ? '½' : ''}`} size={24} />
    </g>
  );
}

export const sleepSheet = spec<SleepRound>({
  id: 'sleep',
  // 2: hour blocks for how long and clocks for when he woke, as in the game (was: words to circle).
  rev: 2,
  levels: SLEEP_LEVELS.map((l) => l.name),
  current: (p) => ladderOf(p, 'sleep').level,
  grid: (_, d) => pickGrid(d, [1, 3], [2, 3], [2, 4]),
  ask: (level) =>
    SLEEP_LEVELS[level].ask === 'woke'
      ? 'Kakukk lefeküdt (hold), és ennyit aludt. Hánykor ébredt fel? Karikázd be!'
      : 'Kakukk lefeküdt (hold), aztán felébredt (nap). Mennyit aludt? Karikázd be!',
  tip: () => 'A gyerkőc ujjával lépjen végig a számlapon a kis mutató első helyétől a másodikig, és számolja a lépéseket: minden szám egy óra.',
  tasks: (req) => Array.from({ length: req.count }, (_, i) => buildSleepRound(req.level, roundOf(req, i))),
  Task: ({ task, answers }) => (
    <Pic w={560} h={task.level.ask === 'woke' ? 450 : 380}>
      <At x={30} y={0}>
        <PaperClock size={200} time={task.from} />
      </At>
      {task.level.ask === 'woke' ? (
        <g>
          <rect x={300} y={40} width="220" height="120" rx="18" fill="#FFFFFF" stroke={FAINT} strokeWidth="3" />
          <At x={300} y={40}>
            <PaperBlocks minutes={task.minutes} w={220} h={120} />
          </At>
        </g>
      ) : (
        <At x={300} y={0}>
          <PaperClock size={200} time={task.to} />
        </At>
      )}
      <At x={110} y={206}>
        <DayPartSign part="este" size={40} />
      </At>
      <At x={380} y={206}>
        <DayPartSign part="délben" size={40} />
      </At>
      {task.level.ask === 'woke' ? (
        <Choices x={10} y={260} w={170} h={170} gap={15} pick={task.answer} answers={answers}>
          {task.wakeTimes.map((t) => (
            <At key={timeWords(t)} x={10} y={10}>
              <PaperClock size={150} time={t} />
            </At>
          ))}
        </Choices>
      ) : (
        <Choices x={10} y={260} w={170} h={100} gap={15} pick={task.answer} answers={answers}>
          {task.choices.map((m) => (
            <PaperBlocks key={m} minutes={m} w={170} h={100} />
          ))}
        </Choices>
      )}
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
    if (mode === 'span') return 'Meddig tart? Karikázd be: egy pislantás, egy homokóra, vagy reggeltől estig!';
    if (mode === 'longest') return 'Melyik tart a leghosszabb ideig? Karikázd be!';
    if (mode === 'shortest') return 'Melyik a legrövidebb? Karikázd be!';
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
            <At key={s} x={30} y={10}>
              <SpanSign span={s} size={100} />
            </At>
          ))}
        </Choices>
      </Pic>
    ) : (
      <Pic w={'trio' in task ? 700 : 460} h={220}>
        <Choices x={10} y={10} w={200} h={200} gap={40} pick={task.answer} answers={answers}>
          {('trio' in task ? task.trio : task.pair).map((id) => (
            <DayCard key={id} id={id} />
          ))}
        </Choices>
      </Pic>
    )
});

// ---------- magyarázó lap ----------

const pad = (m: number) => String(m).padStart(2, '0');

/** A digital display on paper: the time in big digits on a light board, like the Digitális óra sheet's cards. */
function PaperDigital({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <g>
      <rect x={x} y={y} width="210" height="100" rx="18" fill="#EEF2F6" stroke={INK} strokeWidth="3" />
      <Word x={x} y={y} w={210} h={100} text={text} size={56} />
    </g>
  );
}

/** A clock with its words under it, `w` wide. */
function CaptionedClock({ x, h, m, wedge, caption }: { x: number; h: number; m: number; wedge?: [number, number]; caption: string }) {
  return (
    <g>
      <At x={x + 10} y={0}>
        <PaperClock size={200} time={{ h, m }} wedge={wedge} />
      </At>
      <Word x={x} y={205} w={220} h={50} text={caption} size={caption.length > 16 ? 20 : 24} />
    </g>
  );
}

/** One intro slide's picture, drawn for paper: ink only, the screen's yellow becomes light grey. */
function IntroPic({ art }: { art: IntroArt }): ReactNode {
  switch (art.kind) {
    case 'clock': {
      const clock = <PaperClock size={220} time={{ h: art.h, m: art.m }} hourOnly={art.hourOnly} wedge={art.wedge} glow={art.glow} />;
      return art.digital ? (
        <Pic w={500} h={230}>
          <At x={10} y={5}>
            {clock}
          </At>
          <PaperDigital x={280} y={65} text={art.digital} />
        </Pic>
      ) : (
        <Pic w={230} h={230}>
          <At x={5} y={5}>
            {clock}
          </At>
        </Pic>
      );
    }
    case 'sleep':
      return (
        <Pic w={480} h={260}>
          {[art.from, art.to].map(([h, m], i) => (
            <CaptionedClock key={i} x={i * 260} h={h} m={m} caption={`${i ? 'Felébredt' : 'Elaludt'} · ${h}:${pad(m)}`} />
          ))}
        </Pic>
      );
    case 'quarters':
      return (
        <Pic w={700} h={260}>
          {(
            [
              [15, 'negyed három', [0, 90]],
              [30, 'fél három', [0, 180]],
              [45, 'háromnegyed három', [0, 270]]
            ] as [number, string, [number, number]][]
          ).map(([m, words, wedge], i) => (
            <CaptionedClock key={m} x={i * 240} h={2} m={m} wedge={wedge} caption={`${words} · 2:${m}`} />
          ))}
        </Pic>
      );
    case 'pics':
      return (
        <Pic w={art.ids.length * 220 - 20} h={200}>
          {art.ids.map((id, i) => (
            <At key={id} x={i * 220} y={0}>
              <DayCard id={id} />
            </At>
          ))}
        </Pic>
      );
    case 'parts':
      return (
        <Pic w={DAY_PARTS.length * 170 - 10} h={160}>
          {DAY_PARTS.map((p, i) => (
            <g key={p}>
              <At x={i * 170 + 30} y={0}>
                <DayPartSign part={p} size={100} />
              </At>
              <Word x={i * 170} y={108} w={160} h={50} text={capital(p)} size={28} />
            </g>
          ))}
        </Pic>
      );
    case 'seasons':
      return (
        <Pic w={SEASONS.length * 170 - 10} h={210}>
          {SEASONS.map((s, i) => (
            <g key={s}>
              <At x={i * 170 + 5} y={0}>
                <SeasonTree season={s} size={150} />
              </At>
              <Word x={i * 170} y={158} w={160} h={50} text={capital(SEASON_NAMES[s])} size={28} />
            </g>
          ))}
        </Pic>
      );
    case 'chips': {
      // Seven days fit one row; the twelve months take two rows of six. A marked chip is drawn bold, its label above it.
      const cols = art.items.length > 7 ? 6 : art.items.length;
      const rows = Math.ceil(art.items.length / cols);
      return (
        <Pic w={cols * 140 - 10} h={rows * 100}>
          {art.items.map((w, i) => {
            const x = (i % cols) * 140;
            const y = Math.floor(i / cols) * 100 + 34;
            const mark = art.mark?.[i];
            return (
              <g key={w}>
                {mark && <Word x={x} y={y - 34} w={130} h={30} text={mark} size={20} />}
                <rect x={x} y={y} width="130" height="60" rx="14" fill="#FFFFFF" stroke={mark ? INK : '#B9CBD8'} strokeWidth={mark ? 5 : 3} />
                <Word x={x} y={y} w={130} h={60} text={w} size={w.length > 9 ? 20 : 24} />
              </g>
            );
          })}
        </Pic>
      );
    }
  }
}

/** The magyarázó lap for a game's level: the intro its "?" button replays, slide by slide. */
function explainerFor(game: GameId, level: number): Explainer | null {
  const found = introFor(game, level);
  if (!found) return null;
  return {
    title: found.intro.ask,
    note: 'Ugyanezt mondja el Kakukk az appban a „?” gombra. Nézzék végig együtt, sorban, és a gyerkőc mutasson rá a képen arra, amiről szó van. Ezen a lapon nincs mit megoldani.',
    slides: found.intro.slides.map((s) => ({ title: s.title, text: s.text, art: <IntroPic art={s.art} /> }))
  };
}

/** Every Óratorony sheet can bring its level's magyarázó lap. */
const withExplainer = (s: PrintSpec<unknown>): PrintSpec<unknown> => ({ ...s, explain: (level) => explainerFor(s.id, level) });

export const TOWER_SHEETS = [daySheet, seasonSheet, setSheet, readSheet, digiSheet, sleepSheet, sandSheet].map(withExplainer);

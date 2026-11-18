import { useEffect, useState, type CSSProperties } from "react";
import { CountIn } from "../../../components/CountIn";
import { FitBox } from "../../../components/FitBox";
import { useForm } from "../../../components/Stage";
import { GuideSay } from "../../../components/GuideSay";
import { Modal } from "../../../components/Modal";
import { BellStore } from "../../../components/StoreRack";
import { StoreDialog, packsAndOnes } from "../../../components/StoreDialog";
import { STORE_MAX } from "../../../state/balance";
import { PlaceShell } from "../../../components/PlaceShell";
import { numberAttr } from "../../../lib/numbers";
import { fanfare, popBubble } from "../../../lib/sound";
import { speak } from "../../../lib/speech";
import { timeWords } from "../../../lib/time";
import { useProgress } from "../../../state/progress";
import {
  BUILDINGS,
  GIFTS_EACH,
  STAGES,
  bellBalance,
  build,
  builtCount,
  give,
  giftsOf,
  happenings,
  isBuilt,
  isOpen,
  nowMinutes,
  nextGift,
  partOfDay,
  residentToWelcome,
  skyAt,
  stageOf,
  turnClock,
  upgrade,
  upgradeCost,
  welcome,
  dative,
  type Building,
} from "../../../state/town";
import { Bell, BuildingArt, ClockFace, DecorArt, ResidentArt } from "../art";
import { capital } from "../games/activities";
import type { Say } from "../games/common";

/** What the bells are being counted in for: a building, its next stage, or its resident's next gift. */
type Counting = {
  kind: "build" | "upgrade" | "gift";
  b: Building;
  cost: number;
};

/** "6:00 – 18:00": opening hours on the 24-hour clock, as the station board shows them. */
const hours = (b: Building) =>
  b.id === "clock"
    ? "Éjjel-nappal jár"
    : `Nyitva: ${b.open}:00 – ${b.close}:00`;

/** The tower clock's time as Kakukk says it: "Tíz óra van, délelőtt." plus what happens now in the town. */
function clockLine(
  minutes: number,
  events: string[],
  open: string[],
  built: number,
): Say {
  const h = Math.floor(minutes / 60);
  const words = capital(timeWords({ h: h % 12 || 12, m: minutes % 60 }));
  const now = `${words} van, ${partOfDay(minutes)}.`;
  if (events.length)
    return {
      text: `${now} ${events.join(" ")}`,
      speech: `${now} ${events.join(" ")}`,
      mood: "cheer",
      tone: "plain",
    };
  if (built === 0)
    return {
      text: `${now} Építsünk várost!`,
      speech: `${now} Itt még csak a tér van. A harangokból házakat építhetünk. Koppints egy szaggatott házra!`,
      mood: "cheer",
      tone: "plain",
    };
  if (open.length === 0)
    return {
      text: `${now} Most minden zárva, a lakók pihennek.`,
      speech: `${now} Most minden zárva, a lakók pihennek. Forgasd tovább az órát!`,
      mood: "smile",
      tone: "plain",
    };
  const list =
    open.length > 3
      ? `${open.slice(0, 3).join(", ")} és még ${numberAttr(open.length - 3)}`
      : open.join(", ");
  return {
    text: `${now} Nyitva: ${list}.`,
    speech: `${now} Nyitva van ${list}. Forgasd az órát, és nézd, mi történik!`,
    mood: "smile",
    tone: "plain",
  };
}

/** The bells counted out, like seeds into a bed. */
function BellBox() {
  return (
    <svg width="96" height="80" viewBox="0 0 96 80" aria-hidden="true">
      <path
        d="M8 26 H88 L80 76 H16 Z"
        fill="#E3DEF5"
        stroke="#5B4B9A"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M8 26 H88"
        stroke="#5B4B9A"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BellPrice({ n }: { n: number }) {
  return (
    <span className="town-price">
      <Bell size={20} />
      {n}
    </span>
  );
}

/** The map's drawing size; it scales to the room the screen gives it. */
const MAP_W = 1180;
const MAP_H = 560;

/** Each building's plot (top-left corner; plots are 150 × 124): four above the ring road, one at each end, three below. */
const PLOTS: Record<string, { x: number; y: number }> = {
  bakery: { x: 150, y: 4 },
  flowers: { x: 360, y: 4 },
  fountain: { x: 670, y: 4 },
  post: { x: 880, y: 4 },
  playground: { x: 10, y: 213 },
  school: { x: 1020, y: 213 },
  library: { x: 200, y: 422 },
  station: { x: 515, y: 422 },
  cinema: { x: 830, y: 422 },
};

/** The square's middle, where the tower clock stands. */
const SQUARE = { x: 590, y: 275 };

/**
 * The streets under the plots: a pavement, the road and a dashed centre line. The main road leaves for the harbour at
 * the top. On an upright phone the whole town is turned on its side (x and y swapped), so the plots stay big enough to tap.
 */
function RoadMap({ tall }: { tall: boolean }) {
  const main = "M590 -10 V160 M160 275 H490 M690 275 H1020";
  const ring = { x: 190, y: 150, width: 800, height: 250, rx: 64 };
  const drives =
    "M225 128 V150 M435 128 V150 M745 128 V150 M955 128 V150 M275 400 V422 M905 400 V422 M590 370 V422";
  return (
    <svg
      className="town-map__ground"
      width={tall ? MAP_H : MAP_W}
      height={tall ? MAP_W : MAP_H}
      viewBox={tall ? `0 0 ${MAP_H} ${MAP_W}` : `0 0 ${MAP_W} ${MAP_H}`}
      aria-hidden="true"
    >
      <g transform={tall ? "matrix(0 1 1 0 0 0)" : undefined}>
        <rect
          className="town-map__grass"
          x="0"
          y="0"
          width={MAP_W}
          height={MAP_H}
          rx="36"
        />
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path className="town-map__pavement" d={main} strokeWidth="56" />
          <rect className="town-map__pavement" {...ring} strokeWidth="56" />
          <path className="town-map__pavement" d={drives} strokeWidth="32" />
          <path className="town-map__road" d={main} strokeWidth="42" />
          <rect className="town-map__road" {...ring} strokeWidth="42" />
          <path className="town-map__road" d={drives} strokeWidth="20" />
          <path
            className="town-map__lane"
            d="M590 0 V150"
            strokeWidth="4"
            strokeDasharray="14 14"
          />
          <rect
            className="town-map__lane"
            {...ring}
            strokeWidth="4"
            strokeDasharray="14 14"
          />
        </g>
        <g className="town-map__zebra">
          {[456, 466, 476, 704, 714, 724].map((x) => (
            <rect key={x} x={x} y="257" width="6" height="36" rx="2" />
          ))}
        </g>
        <circle className="town-map__square" cx="590" cy="275" r="106" />
        <circle
          className="town-map__curb"
          cx="590"
          cy="275"
          r="106"
          fill="none"
          strokeWidth="3"
          strokeDasharray="2 10"
          strokeLinecap="round"
        />
        <g className="town-map__trees" strokeWidth="2.5">
          {[
            [70, 66, 22],
            [112, 112, 14],
            [1100, 66, 22],
            [1060, 112, 14],
            [90, 480, 22],
            [1090, 480, 22],
            [440, 500, 16],
            [742, 500, 16],
          ].map(([cx, cy, r]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
          ))}
        </g>
      </g>
    </svg>
  );
}

function StageDots({ stage }: { stage: number }) {
  return (
    <span className="town__stage" aria-hidden="true">
      {Array.from({ length: STAGES }, (_, i) => (
        <span key={i} className={i < stage ? "is-on" : undefined} />
      ))}
    </span>
  );
}

/** The tower clock in the middle of the square: its hands always show the town's time; once built, a house grows round it. */
function TowerSpot({
  built,
  ready,
  cost,
  stage,
  minutes,
  tall,
  onTap,
}: {
  built: boolean;
  ready: boolean;
  cost: number;
  stage: number;
  minutes: number;
  tall: boolean;
  onTap: () => void;
}) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const words = `${timeWords({ h: h % 12 || 12, m })}, ${partOfDay(minutes)}`;
  const [cx, cy] = tall ? [SQUARE.y, SQUARE.x] : [SQUARE.x, SQUARE.y];
  // The clock's middle on the square: the plain dial is 116 square; the house's dial sits 64 in and 87 down.
  const at = built
    ? { left: cx - 64, top: cy - 87 }
    : { left: cx - 58, top: cy - 58 };
  return (
    <button
      style={at}
      type="button"
      className={`town-tower${built ? " is-built" : ""}${!built && ready ? " is-ready" : ""}`}
      onClick={onTap}
      aria-label={
        built
          ? `Toronyóra, ${stage}. szint: ${words}`
          : `Toronyóra: ${words}. ${cost} harang`
      }
    >
      <ClockFace
        size={built ? 128 : 116}
        house={built}
        hour={(h % 12) * 30 + m / 2}
        minute={m * 6}
        label={`Toronyóra: ${words}`}
      />
      {built && <StageDots stage={stage} />}
      <span className="town__name">Toronyóra</span>
      {!built && (
        <span className="town__cost" aria-hidden="true">
          <Bell size={18} />
          {cost}
        </span>
      )}
    </button>
  );
}

/**
 * Kisváros: Óratorony's reward place. Ten buildings stand round the square, each with a resident who moves in when it
 * is built; bells put them up, grow them through three stages and buy the residents' gifts. The tower clock, which the
 * child turns, runs the town: the sky, who is open, and what happens on the hour.
 */
export function Town({ onBack }: { onBack: () => void }) {
  const { progress, update } = useProgress();
  const balance = bellBalance(progress);
  /** The tower clock: the real time when the Kisváros opens, then wherever the child turns it. */
  const [minutes, setMinutes] = useState(() => nowMinutes());
  const sky = skyAt(minutes);
  const dark = sky === "night" || sky === "evening";
  const built = builtCount(progress);
  const openNow = BUILDINGS.filter(
    (b) => isBuilt(progress, b.id) && b.id !== "clock" && isOpen(b, minutes),
  ).map((b) => b.the.replace(/^az? /, ""));
  const [line, setLine] = useState<Say>(() =>
    clockLine(minutes, [], openNow, built),
  );
  const [card, setCard] = useState<Building | null>(null);
  const [counting, setCounting] = useState<Counting | null>(null);
  const [counted, setCounted] = useState(0);
  const [storeOpen, setStoreOpen] = useState(false);
  const newcomer = counting ? null : residentToWelcome(progress);
  const tower = BUILDINGS.find((b) => b.id === "clock")!;
  const tall = useForm() === "portrait";

  useEffect(() => {
    speak(line.speech);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Said once per visit.
  }, []);

  const tell = (s: Say) => {
    setLine(s);
    speak(s.speech);
  };

  /** Sets the clock to `next` (minutes after midnight) and has Kakukk say what happens then. */
  const setClock = (next: number) => {
    popBubble(1);
    setMinutes(next);
    const open = BUILDINGS.filter(
      (b) => isBuilt(progress, b.id) && b.id !== "clock" && isOpen(b, next),
    ).map((b) => b.the.replace(/^az? /, ""));
    tell(clockLine(next, happenings(progress, next), open, built));
  };
  const turn = (by: number) => setClock(turnClock(minutes, by));

  /** Start counting bells in, or say how many are still missing. */
  const pay = (c: Counting, what: string) => {
    popBubble(2);
    if (c.cost > balance) {
      const need = c.cost - balance;
      tell({
        text: `Még ${need} harang kell.`,
        speech: `${capital(what)}: ${numberAttr(c.cost)} harang kell hozzá. Még ${numberAttr(need)} harangot gyűjts a játékokban!`,
        mood: "think",
        tone: "plain",
      });
      return;
    }
    setCounted(0);
    setCounting(c);
    tell({
      text: `Számold be a harangokat: ${c.cost}!`,
      speech: `${capital(what)}! Tegyél be ${numberAttr(c.cost)} harangot, egyesével!`,
      mood: "smile",
      tone: "plain",
    });
  };

  const tap = (b: Building) => {
    if (!isBuilt(progress, b.id)) {
      pay({ kind: "build", b, cost: b.cost }, b.name);
      return;
    }
    popBubble(2);
    setCard(b);
    const open = b.id === "clock" || isOpen(b, minutes);
    tell({
      text: `${capital(b.the)}. ${b.resident.name}, a ${b.resident.role} ${open ? "itt van." : "most otthon pihen."}`,
      speech: `Ez ${b.the}. ${b.resident.name}, a ${b.resident.role} ${open ? "éppen itt dolgozik." : "most otthon pihen, mert zárva van."}`,
      mood: "cheer",
      tone: "good",
    });
  };

  const done = (c: Counting) => {
    setCounting(null);
    fanfare();
    const { b } = c;
    if (c.kind === "build") {
      setCard(null);
      update((p) => build(p, b.id));
      tell({
        text: `Felépült: ${b.name.toLowerCase()}!`,
        speech: `Felépült ${b.the}! Nézd, ki költözik be!`,
        mood: "cheer",
        tone: "good",
      });
    } else if (c.kind === "upgrade") {
      update((p) => upgrade(p, b.id));
      tell({
        text: `Szebb lett ${b.the}!`,
        speech: `Kibővítettük: szebb lett ${b.the}! ${b.resident.name} nagyon örül.`,
        mood: "cheer",
        tone: "good",
      });
    } else {
      const gift = nextGift(progress, b.id)!;
      update((p) => give(p, b.id));
      tell({
        text: `${b.resident.name} örül: ${gift.name.toLowerCase()}!`,
        speech: `Köszönöm! – mondja ${b.resident.name}. ${gift.name}, ez itt marad ${b.the} mellett.`,
        mood: "cheer",
        tone: "good",
      });
    }
  };

  const greet = (b: Building) => {
    popBubble(3);
    update((p) => welcome(p, b.id));
    tell({
      text: `Szia, ${b.resident.name}!`,
      speech: `Szia, ${b.resident.name}! Isten hozott a Kisvárosban!`,
      mood: "cheer",
      tone: "good",
    });
  };

  return (
    <PlaceShell
      world="tower"
      className={`screen--town town-sky--${sky}`}
      title="Kisváros"
      onBack={onBack}
      counters={
        <button
          type="button"
          className="pill"
          aria-label={`${balance} harang. Koppints, és megmutatom a Harangtárat.`}
          onClick={() => {
            popBubble(1);
            setStoreOpen(true);
          }}
        >
          <Bell />
          <span>
            {balance}
            <span className="pill__unit"> harang</span>
          </span>
        </button>
      }
    >
      {/* Kakukk and the clock's buttons share one row, so the map below gets the height. */}
      <div className="town-bar">
      <GuideSay
        world="tower"
        mood={line.mood}
        tone={line.tone}
        text={line.text}
        speech={line.speech}
      />

      <div className="town-clock" role="group" aria-label="Toronyóra">
        <span className="town-clock__part">
          {partOfDay(minutes)}, {Math.floor(minutes / 60)}:
          {String(minutes % 60).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={() => turn(-60)}
          aria-label="Egy órával vissza"
        >
          − 1 óra
        </button>
        <button
          type="button"
          className="is-forward"
          onClick={() => turn(60)}
          aria-label="Egy órával előre"
        >
          + 1 óra
        </button>
        <button
          type="button"
          onClick={() => turn(-15)}
          aria-label="Negyed órával vissza"
        >
          − negyed
        </button>
        <button
          type="button"
          className="is-forward"
          onClick={() => turn(15)}
          aria-label="Negyed órával előre"
        >
          + negyed
        </button>
        <button
          type="button"
          className="town-clock__now"
          onClick={() => setClock(nowMinutes())}
          aria-label="Az óra most a valódi időt mutassa"
        >
          Most
        </button>
      </div>
      </div>

      <FitBox
        width={tall ? MAP_H : MAP_W}
        height={tall ? MAP_W : MAP_H}
        always
        className="town-map-box"
      >
        <div
          className={`town-map${tall ? " is-tall" : ""}`}
          style={{ width: tall ? MAP_H : MAP_W, height: tall ? MAP_W : MAP_H }}
          role="group"
          aria-label={`Kisváros: ${built} épület áll a ${BUILDINGS.length}-ből`}
        >
          <RoadMap tall={tall} />
          <ul className="town-map__plots">
            {BUILDINGS.filter((b) => b.id !== "clock").map((b) => {
              const at = PLOTS[b.id];
              const up = isBuilt(progress, b.id);
              const stage = stageOf(progress, b.id);
              const open = up && isOpen(b, minutes);
              const gifts = up ? b.gifts.slice(0, giftsOf(progress, b.id)) : [];
              return (
                <li
                  key={b.id}
                  style={
                    tall ? { left: at.y, top: at.x } : { left: at.x, top: at.y }
                  }
                >
                  <button
                    type="button"
                    className={`town__spot${up ? " is-built" : ""}${!up && b.cost <= balance ? " is-ready" : ""}`}
                    onClick={() => tap(b)}
                    aria-label={
                      up
                        ? `${b.name}, ${stage}. szint, ${open ? "nyitva" : "zárva"}`
                        : `${b.name}: ${b.cost} harang`
                    }
                  >
                    {up && <StageDots stage={stage} />}
                    <span className="town__building">
                      <BuildingArt
                        id={b.id}
                        ghost={!up}
                        stage={stage}
                        windows={!dark ? "day" : open ? "lit" : "dark"}
                        size={112}
                        gifts={gifts.map((g) => g.decor)}
                      />
                      {open && (
                        <span className="town__resident">
                          <ResidentArt
                            hat={b.resident.hat}
                            coat={b.resident.coat}
                            size={36}
                          />
                        </span>
                      )}
                      {up && !open && (
                        <span className="town__closed">Zárva</span>
                      )}
                    </span>
                    <span className="town__name">{b.name}</span>
                    {!up && (
                      <span className="town__cost" aria-hidden="true">
                        <Bell size={18} />
                        {b.cost}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <TowerSpot
            built={isBuilt(progress, "clock")}
            ready={tower.cost <= balance}
            cost={tower.cost}
            stage={stageOf(progress, "clock")}
            minutes={minutes}
            tall={tall}
            onTap={() => tap(tower)}
          />
        </div>
      </FitBox>

      {card && !counting && (
        <BuildingCard
          b={card}
          balance={balance}
          stage={stageOf(progress, card.id)}
          upCost={upgradeCost(progress, card.id)}
          gifts={giftsOf(progress, card.id)}
          next={nextGift(progress, card.id)}
          onUpgrade={(cost) =>
            pay({ kind: "upgrade", b: card, cost }, `${card.name} bővítése`)
          }
          onGift={(cost, name) =>
            pay(
              { kind: "gift", b: card, cost },
              `${name} ${dative(card.resident.name)}`,
            )
          }
          onClose={() => setCard(null)}
        />
      )}

      {counting && (
        <Modal
          className="town-count"
          labelledBy="town-count-title"
          onEscape={() => setCounting(null)}
        >
          <div className="town-count__card">
            <h2 id="town-count-title" className="town-count__title">
              {counting.kind === "build"
                ? counting.b.name
                : counting.kind === "upgrade"
                  ? `${counting.b.name} bővítése`
                  : `${nextGift(progress, counting.b.id)?.name} ${dative(counting.b.resident.name)}`}
            </h2>
            <span
              className={`town-count__building${counted >= counting.cost ? " is-on" : ""}`}
              aria-hidden="true"
            >
              {counting.kind === "gift" ? (
                <BuildingArt
                  id={counting.b.id}
                  stage={stageOf(progress, counting.b.id)}
                  size={170}
                  gifts={counting.b.gifts
                    .slice(
                      0,
                      giftsOf(progress, counting.b.id) +
                        (counted >= counting.cost ? 1 : 0),
                    )
                    .map((g) => g.decor)}
                />
              ) : (
                <BuildingArt
                  id={counting.b.id}
                  ghost={counting.kind === "build" && counted < counting.cost}
                  stage={
                    counting.kind === "upgrade"
                      ? stageOf(progress, counting.b.id) +
                        (counted >= counting.cost ? 1 : 0)
                      : 1
                  }
                  size={170}
                />
              )}
            </span>
            <CountIn
              cost={counting.cost}
              balance={balance}
              label={counting.b.name}
              unit="harang"
              unitObj="harangot"
              className="seed-count--bell"
              token={(size) => <Bell size={size} />}
              store={<BellBox />}
              onCount={setCounted}
              onDone={() => done(counting)}
            />
            <p className="town-count__help">
              Koppints a dobozra vagy a lyukakra. Ha visszalépsz, minden harang
              a dobozban marad.
            </p>
            <button
              type="button"
              className="big-btn big-btn--quiet"
              onClick={() => setCounting(null)}
            >
              Mégse
            </button>
          </div>
        </Modal>
      )}

      {newcomer && !card && (
        <Modal className="town-count" labelledBy="town-welcome-title">
          <div className="town-count__card town-welcome">
            <span className="town-welcome__kicker">Új lakó a Kisvárosban</span>
            <h2 id="town-welcome-title" className="town-count__title">
              Beköltözött {newcomer.resident.name}, a {newcomer.resident.role}!
            </h2>
            <div className="town-welcome__scene" aria-hidden="true">
              <BuildingArt id={newcomer.id} size={180} />
              <ResidentArt
                hat={newcomer.resident.hat}
                coat={newcomer.resident.coat}
                size={150}
              />
            </div>
            <div className="town-welcome__facts">
              <span>{hours(newcomer)}</span>
              <span>
                <Bell size={22} /> {GIFTS_EACH} ajándékot vár
              </span>
            </div>
            <button
              type="button"
              className="big-btn big-btn--tower"
              onClick={() => greet(newcomer)}
            >
              Szia, {newcomer.resident.name}!
            </button>
          </div>
        </Modal>
      )}

      {storeOpen && <BellRoom balance={balance} onClose={() => setStoreOpen(false)} />}
    </PlaceShell>
  );
}

/** Harangtár: the bells as they hang in the tower room, straps of ten on the peg rails and the rest on the hook board. */
function BellRoom({ balance, onClose }: { balance: number; onClose: () => void }) {
  const full = balance >= STORE_MAX;
  const tens = packsAndOnes(balance, "szíj", "harang");
  const line = full ? "Tele a Harangtár! Építsünk valamit, és újra lesz hely." : `${capital(tens)}.`;
  const speech = full
    ? "Tele a Harangtár: húsz szíj, kétszáz harang. Amíg nem építünk valamit, nem fér be több harang."
    : `A Harangtárban ${tens} van. Egy szíjra tíz harang kerül. A többi a kampós táblán lóg, amíg össze nem gyűlik tíz.`;
  return (
    <StoreDialog
      world="tower"
      title="Harangtár"
      back="Vissza a városba"
      pill={
        <div className="pill" aria-label={`${balance} harang`}>
          <Bell />
          <span>{balance}</span>
        </div>
      }
      line={line}
      speech={speech}
      note="Tíz harang egy szíjra kerül. Ha valamihez több kell, mint ami a kampós táblán lóg, Kakukk lefűz tíz harangot egy szíjról. A Harangtárba húsz szíj, kétszáz harang fér."
      onClose={onClose}
    >
      <BellStore n={balance} />
    </StoreDialog>
  );
}

/** A built building's card: the building at its stage, its resident and hours, the next stage, and the five gifts. */
function BuildingCard({
  b,
  balance,
  stage,
  upCost,
  gifts,
  next,
  onUpgrade,
  onGift,
  onClose,
}: {
  b: Building;
  balance: number;
  stage: number;
  upCost: number | null;
  gifts: number;
  next: { name: string; cost: number } | null;
  onUpgrade: (cost: number) => void;
  onGift: (cost: number, name: string) => void;
  onClose: () => void;
}) {
  const STAGE_NAMES = ["Ház", "Virágos", "Zászlós"];
  return (
    <Modal
      className="town-count"
      labelledBy="town-card-title"
      onEscape={onClose}
    >
      <div
        className="town-card"
        style={{ "--balance": balance } as CSSProperties}
      >
        <header className="town-card__head">
          <h2 id="town-card-title" className="town-count__title">
            {b.name}
          </h2>
          <button
            type="button"
            className="round-btn round-btn--white town-card__close"
            onClick={onClose}
            aria-label="Bezárás"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>
        <div className="town-card__body">
          <div className="town-card__who">
            <BuildingArt
              id={b.id}
              stage={stage}
              size={210}
              gifts={b.gifts.slice(0, gifts).map((g) => g.decor)}
            />
            <div className="town-card__resident">
              <ResidentArt
                hat={b.resident.hat}
                coat={b.resident.coat}
                size={74}
                label={`${b.resident.name}, ${b.resident.role}`}
              />
              <div>
                <b>
                  {b.resident.name}, a {b.resident.role}
                </b>
                <span>{hours(b)}</span>
              </div>
            </div>
          </div>
          <div className="town-card__side">
            <section className="town-card__part town-card__part--upgrade">
              <h3>Bővítés</h3>
              <div className="town-card__row">
                <ol
                  className="town-card__stages"
                  aria-label={`${stage}. szint a ${STAGES}-ból`}
                >
                  {STAGE_NAMES.map((n, i) => (
                    <li
                      key={n}
                      className={
                        i < stage
                          ? i === stage - 1
                            ? "is-now"
                            : "is-done"
                          : undefined
                      }
                    >
                      {i + 1}. {n.toLowerCase()}
                    </li>
                  ))}
                </ol>
                {upCost !== null ? (
                  <button
                    type="button"
                    className="big-btn big-btn--tower town-card__buy"
                    onClick={() => onUpgrade(upCost)}
                    aria-label={`Bővítsük! ${upCost} harang`}
                  >
                    Bővítsük! <BellPrice n={upCost} />
                  </button>
                ) : (
                  <span className="town-card__full">Teljesen kész!</span>
                )}
              </div>
            </section>
            <section className="town-card__part town-card__part--gifts">
              <h3>Ajándékok {dative(b.resident.name)}</h3>
              <ul className="town-card__gifts">
                {b.gifts.map((g, i) => (
                  <li key={i}>
                    {i < gifts ? (
                      <span className="town-gift is-given">
                        <DecorArt kind={g.decor} size={40} />
                        <span>{g.name}</span>
                      </span>
                    ) : i === gifts && next ? (
                      <button
                        type="button"
                        className="town-gift is-next"
                        onClick={() => onGift(next.cost, next.name)}
                        aria-label={`Következő ajándék: ${next.name}, ${next.cost} harang`}
                      >
                        <DecorArt kind={g.decor} size={40} />
                        <span>
                          {g.name} · <BellPrice n={next.cost} />
                        </span>
                      </button>
                    ) : (
                      <span
                        className="town-gift is-later"
                        aria-label="Későbbi ajándék"
                      >
                        ?
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </Modal>
  );
}

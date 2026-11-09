import { useEffect, useRef, useState } from 'react';
import { ArrivalRing } from '../../../components/ArrivalRing';
import { CountIn } from '../../../components/CountIn';
import { GuideSay, type Say } from '../../../components/GuideSay';
import { Modal, useModal } from '../../../components/Modal';
import { PlaceShell } from '../../../components/PlaceShell';
import { BackIcon, RoundButton } from '../../../components/ui';
import { Bolt } from '../art';
import { BoltBox, FriendArt, GiftArt, RobotFigure, SlotIcon, type PartMotion } from '../parts';
import { chime, fanfare, popBubble, robotChirp } from '../../../lib/sound';
import { capitalize, numberCount } from '../../../lib/numbers';
import { speak } from '../../../lib/speech';
import { useProgress } from '../../../state/progress';
import {
  BATTERY_BARS,
  PART_SLOTS,
  SECOND_ROBOT_AFTER,
  TRICKS,
  activeRobot,
  batteryOf,
  boughtOn,
  robotsOpen,
  secondRobotNew,
  boltBalance,
  chargeOne,
  chargesToNextTrick,
  isSqueaky,
  oil,
  tricksOf,
  boughtCount,
  buy,
  canBuy,
  cheapestLeft,
  friendsOf,
  lookOf,
  newFriend,
  owns,
  partById,
  partsIn,
  wear,
  type Part,
  type PartSlot,
  type RobotIdx,
  type TrickId,
  friendProgress,
  FRIEND_GIFTS,
  FRIEND_GIFTS_EACH,
  GIFT_THINGS,
  canGiveFriend,
  friendAsks,
  friendGiftsOf,
  friendGiftsOpen,
  giveFriend,
  nextFriendGift,
  setWish,
  slotsAffordable,
  startSlot,
  wishOf,
  type Friend,
  type FriendId
} from '../../../state/robotParts';

const ROBOT_NAMES: Record<RobotIdx, string> = { 0: 'Első robot', 1: 'Második robot' };

/** "egy csavar", "három csavar" for the speech; the bubble shows the digit. */
function boltsWord(n: number): string {
  return n === 1 ? 'egy csavar' : `${n} csavar`;
}

/** Robotépítő: the child spends the bolts earned on Robotút on parts for their own robot. */
export function Workshop({ onBack }: { onBack: () => void }) {
  const { progress, update } = useProgress();
  const balance = boltBalance(progress);
  const robot = activeRobot(progress);
  const robots = robotsOpen(progress);
  const look = lookOf(progress);
  const battery = batteryOf(progress);
  const squeaky = isSqueaky(progress);
  // The workshop opens on the wished part's tab, or the first with something the bolts buy (C · Hová menjek?).
  const [slot, setSlot] = useState<PartSlot>(() => startSlot(progress));
  /** The part being counted out (A · Csavarozd fel!), or the friend whose gift is (D · Barátok műhelye). */
  const [counting, setCounting] = useState<Part | null>(null);
  const [giftFor, setGiftFor] = useState<FriendId | null>(null);
  const wish = wishOf(progress);
  const affordable = slotsAffordable(progress);
  const giftsOpen = friendGiftsOpen(progress);
  const [say, setSay] = useState<Say>(() => opening());
  /** The friend the child tapped last; the count restarts its little hop on every tap. */
  const [poke, setPoke] = useState<{ id: string; n: number } | null>(null);
  // A friend is welcomed first; the second robot's arrival waits until no friend is waiting.
  const friend = newFriend(progress);
  const robotArrived = !friend && secondRobotNew(progress);
  const welcomed = friendsOf(progress).slice(0, progress.robotFriendsSeen);
  const toFriend = friendProgress(progress);
  const tricks = tricksOf(progress);
  /** The trick playing now; the count restarts it on every tap. */
  const [trick, setTrick] = useState<{ id: TrickId; n: number } | null>(null);
  /** The last part tap, played on the robot; it settles after a second and a half. */
  const [motion, setMotion] = useState<PartMotion | null>(null);
  /** The last card answer: a bump for a purchase (with the bolts spent), a shake when bolts are short. */
  const [answer, setAnswer] = useState<{ id: string; kind: 'got' | 'wish'; n: number; cost: number } | null>(null);
  const taps = useRef(0);

  function opening(): Say {
    if (battery === 0) {
      return { text: 'Elfáradtam. Feltöltesz?', speech: 'Sokat dolgoztam, elfáradtam. Feltöltesz? Koppints a töltésre!', mood: 'smile', tone: 'plain' };
    }
    if (squeaky) {
      return { text: 'Nyikorog a karom. Kérek egy csepp olajat!', speech: 'Nyikorog a karom. Kérek egy csepp olajat! Koppints az olajozásra.', mood: 'think', tone: 'plain' };
    }
    const wished = wishOf(progress);
    if (wished && wished.robot === robot) {
      if (wished.need === 0) {
        return { text: `Megvan a csavar erre: ${wished.part.name}!`, speech: `Összegyűlt a csavar arra, amit kértél: ${wished.part.name.toLowerCase()}! Koppints rá, és felcsavarozzuk.`, mood: 'cheer', tone: 'good' };
      }
      return { text: `Gyűjtünk erre: ${wished.part.name}. Még ${wished.need} csavar.`, speech: `Erre gyűjtünk: ${wished.part.name.toLowerCase()}. Még ${boltsWord(wished.need)} kell hozzá.`, mood: 'smile', tone: 'plain' };
    }
    const next = cheapestLeft(progress);
    if (!next && friendGiftsOpen(progress) && friendsOf(progress).some((f) => canGiveFriend(progress, f.id))) {
      return { text: 'Kész a robotod! A barátaid ajándékot kérnek.', speech: 'Kész a robotod! A barátaid ajándékot kérnek. Koppints egy barátra!', mood: 'cheer', tone: 'good' };
    }
    if (!next) {
      const other = robots.find((r) => r !== robot && cheapestLeft(progress, r));
      if (other !== undefined) {
        return { text: 'Kész ez a robot! Építsük a másikat.', speech: 'Kész ez a robot, minden alkatrész az övé! Koppints a másik robotra, és építsük tovább.', mood: 'cheer', tone: 'good' };
      }
      return { text: 'Kész a robotod! Minden alkatrész a tiéd.', speech: 'Kész a robotod! Minden alkatrész a tiéd. Nézd, milyen szép lett!', mood: 'cheer', tone: 'good' };
    }
    if (robots.length === 1) {
      const left = SECOND_ROBOT_AFTER - boughtOn(progress, 0);
      if (left > 0 && left <= 2 && balance >= next.cost) {
        return {
          text: `Még ${left} új alkatrész, és jön egy második robot!`,
          speech: `Ha még ${left === 1 ? 'egy' : left} új alkatrészt felszerelsz, jön egy második robot is!`,
          mood: 'cheer',
          tone: 'plain'
        };
      }
    }
    if (balance < next.cost) {
      const need = next.cost - balance;
      return { text: `Még ${need} csavar, és vehetünk új alkatrészt.`, speech: `Gyűjts még ${boltsWord(need)}t a Robotúton, és veszünk új alkatrészt!`, mood: 'smile', tone: 'plain' };
    }
    return { text: 'Építsük meg a robotodat! Válassz egy alkatrészt.', speech: 'Építsük meg a robotodat! Válassz egy részt, aztán egy alkatrészt!', mood: 'cheer', tone: 'plain' };
  }

  const tell = (s: Say) => {
    setSay(s);
    speak(s.speech);
  };

  // Every effect of a tap plays once; afterwards the robot and the card are still again.
  useEffect(() => {
    if (!motion && !answer) return;
    const t = setTimeout(() => {
      setMotion(null);
      setAnswer(null);
    }, 1500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Each tap restarts the timer by its count, not by a new object.
  }, [motion?.n, answer?.n]);

  useEffect(() => {
    if (!friend && !robotArrived) speak(say.speech);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Runs once per visit.
  }, []);

  // Each newly arrived friend is greeted in turn, the earliest first.
  useEffect(() => {
    if (friend) speak(friend.speech);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Greeted once per friend, not on every render of the same one.
  }, [friend?.id]);

  useEffect(() => {
    if (robotArrived) speak('Nézd! Az első robotod már olyan szép, hogy jött egy második robot is. Építsük meg őt is!');
  }, [robotArrived]);

  const pick = (part: Part) => {
    const n = ++taps.current;
    const from = look[part.slot];
    if (from === part.id) {
      setMotion({ n, slot: part.slot, kind: 'same' });
      popBubble(2);
      tell({ text: `Ez van rajta: ${part.name.toLowerCase()}.`, speech: `Most ez van a robotodon: ${part.name.toLowerCase()}.`, mood: 'smile', tone: 'plain' });
      return;
    }
    if (owns(progress, part.id)) {
      setMotion({ n, slot: part.slot, kind: 'swap', from });
      chime();
      update((p) => wear(p, part.id));
      tell({ text: 'Visszacseréltük!', speech: `Visszacseréltük. ${part.name}, ez is a tiéd.`, mood: 'cheer', tone: 'good' });
      return;
    }
    if (!canBuy(progress, part.id)) {
      // Not enough bolts yet: this part becomes the one to save up for (B · Ezt szeretném).
      const need = part.cost - balance;
      setAnswer({ id: part.id, kind: 'wish', n, cost: part.cost });
      popBubble(2);
      update((p) => setWish(p, part.id));
      tell({
        text: `Ezt szeretnéd? Még ${need} csavar, és a tiéd.`,
        speech: `Ezt szeretnéd: ${part.name.toLowerCase()}? Gyűjtsünk rá! Még ${boltsWord(need)} kell. A játékokban mindig látod, mennyi hiányzik még.`,
        mood: 'cheer',
        tone: 'plain'
      });
      return;
    }
    // Enough bolts: the child counts them into the part's screw holes (A · Csavarozd fel!).
    popBubble(2);
    setCounting(part);
  };

  /** The last bolt of a part is in: it goes on the robot. */
  const fitted = (part: Part) => {
    const n = ++taps.current;
    setCounting(null);
    setMotion({ n, slot: part.slot, kind: 'buy', from: look[part.slot] });
    setAnswer({ id: part.id, kind: 'got', n, cost: part.cost });
    fanfare();
    update((p) => buy(p, part.id));
    tell({ text: 'Felszereltük! Nézd, milyen menő lett!', speech: `Felszereltük: ${part.name.toLowerCase()}! Nézd, milyen menő lett a robotod!`, mood: 'cheer', tone: 'good' });
  };

  /** A tap on a welcomed friend: its gift card once the friends take gifts, else a little hop. */
  const tapFriend = (f: Friend) => {
    setPoke((p) => ({ id: f.id, n: (p?.id === f.id ? p.n : 0) + 1 }));
    popBubble(3);
    if (friendAsks(progress, f.id)) {
      setGiftFor(f.id);
      return;
    }
    const all = friendGiftsOf(progress, f.id) >= FRIEND_GIFTS_EACH;
    tell(
      all
        ? { text: `${f.name} minden ajándékot megkapott!`, speech: `${f.name} mind az öt ajándékát megkapta tőled. Nagyon boldog!`, mood: 'cheer', tone: 'good' }
        : { text: `Szia, ${f.name}!`, speech: `Ő ${f.name}. Itt lakik a műhelyben, veled.`, mood: 'cheer', tone: 'good' }
    );
  };

  /** The last bolt of a friend's gift is in. */
  const gave = (f: Friend) => {
    const thing = nextFriendGift(progress, f.id)!.thing;
    setGiftFor(null);
    setPoke((p) => ({ id: f.id, n: (p?.n ?? 0) + 1 }));
    fanfare();
    update((p) => giveFriend(p, f.id));
    tell({ text: `${f.name} örül: ${GIFT_THINGS[thing].name}!`, speech: `Köszönöm! – mondja ${f.name}. ${GIFT_THINGS[thing].name}, ez itt marad mellette.`, mood: 'cheer', tone: 'good' });
  };

  const charge = () => {
    if (battery >= BATTERY_BARS) {
      tell({ text: 'Tele vagyok!', speech: 'Tele vagyok! Ha dolgozom, megint tölthetsz.', mood: 'cheer', tone: 'good' });
      return;
    }
    const after = chargeOne(progress);
    const now = batteryOf(after);
    const word = `${capitalize(numberCount(now))}!`;
    update(chargeOne);
    if (now < BATTERY_BARS) {
      popBubble(now);
      tell({ text: word, speech: word, mood: 'smile', tone: 'plain' });
      return;
    }
    const learned = TRICKS.find((t) => t.after === after.robotCharges);
    if (learned) {
      fanfare();
      setTrick((t) => ({ id: learned.id, n: (t?.n ?? 0) + 1 }));
      tell({
        text: `${word} Új trükköt tanultam: ${learned.name.toLowerCase()}!`,
        speech: `${word} Tele vagyok! Új trükköt tanultam: ${learned.name.toLowerCase()}! Koppints rám, és megmutatom.`,
        mood: 'cheer',
        tone: 'good'
      });
      return;
    }
    chime();
    const left = chargesToNextTrick(after);
    const hint = left ? ` Még ${left === 1 ? 'egy' : left} teljes töltés, és új trükköt tanulok.` : '';
    tell({ text: `${word} Tele vagyok!`, speech: `${word} Tele vagyok, köszönöm!${hint}`, mood: 'cheer', tone: 'good' });
  };

  const oilUp = () => {
    if (!squeaky) return;
    chime();
    update(oil);
    tell({ text: 'Már nem nyikorgok!', speech: 'Köszönöm! Már nem nyikorog a karom.', mood: 'cheer', tone: 'good' });
  };

  const showTrick = () => {
    if (tricks.length === 0) {
      const left = chargesToNextTrick(progress)!;
      popBubble(2);
      tell({
        text: `Még ${left} teljes töltés, és tanulok egy trükköt.`,
        speech: `Ha még ${left === 1 ? 'egyszer' : `${left}-szor`} teljesen feltöltesz, megtanulok egy trükköt!`,
        mood: 'smile',
        tone: 'plain'
      });
      return;
    }
    // Each tap shows the next trick it knows, in turn.
    const k = trick ? (tricks.findIndex((t) => t.id === trick.id) + 1) % tricks.length : 0;
    const next = tricks[k];
    setMotion(null);
    robotChirp();
    setTrick((t) => ({ id: next.id, n: (t?.n ?? 0) + 1 }));
    tell({ text: `${next.name}!`, speech: `${next.name}!`, mood: 'cheer', tone: 'good' });
  };

  const welcome = () => {
    if (!friend) return;
    fanfare();
    update((p) => ({ ...p, robotFriendsSeen: p.robotFriendsSeen + 1 }));
  };

  const switchTo = (r: RobotIdx) => {
    popBubble(2);
    if (r === robot) {
      tell({ text: `Ez a ${ROBOT_NAMES[r].toLowerCase()}.`, speech: `Most a ${ROBOT_NAMES[r].toLowerCase()}ot építjük.`, mood: 'smile', tone: 'plain' });
      return;
    }
    setMotion(null);
    setSlot(startSlot(progress, r));
    update((p) => ({ ...p, robotActive: r }));
    tell({ text: `Jöhet a ${ROBOT_NAMES[r].toLowerCase()}!`, speech: `Jöhet a ${ROBOT_NAMES[r].toLowerCase()}! Minden robotnak saját alkatrészei vannak.`, mood: 'cheer', tone: 'plain' });
  };

  const meetSecond = () => {
    setMotion(null);
    fanfare();
    update((p) => ({ ...p, robot2Announced: true, robotActive: 1 }));
    tell({
      text: 'Építsük meg a második robotot!',
      speech: 'Itt a második robot! Ő még csak kék. Válassz neki alkatrészeket. Az első robotodhoz bármikor visszamehetsz.',
      mood: 'cheer',
      tone: 'good'
    });
  };

  const slotName = PART_SLOTS.find((s) => s.id === slot)!.name;

  return (
    <PlaceShell
      world="robot"
      className="screen--workshop"
      title="Robotépítő"
      onBack={onBack}
      counters={
        <div className="pill workshop__bolts" aria-label={`${balance} csavar`}>
          <Bolt />
          <span>
            {balance}
            <span className="pill__unit"> csavar</span>
          </span>
          {answer?.kind === 'got' && (
            <span key={answer.n} className="workshop__spent" aria-hidden="true">
              −{answer.cost}
            </span>
          )}
        </div>
      }
    >

      <div className="workshop">
        <div className="workshop__stage">
          {robots.length > 1 && (
            <div className="workshop__robots" role="tablist" aria-label="Robotjaid">
              {robots.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="tab"
                  aria-selected={robot === r}
                  aria-label={ROBOT_NAMES[r]}
                  className={`workshop__robot-tab${robot === r ? ' is-on' : ''}`}
                  onClick={() => switchTo(r)}
                >
                  <RobotFigure look={lookOf(progress, r)} width={46} />
                  <span>{r + 1}.</span>
                </button>
              ))}
            </div>
          )}
          <div className="robot-care">
            <div className="robot-care__battery" role="img" aria-label={`Elem: ${battery} csík az ötből`}>
              {Array.from({ length: BATTERY_BARS }, (_, k) => (
                <span key={k} className={k < battery ? 'is-full' : ''} />
              ))}
            </div>
            <button type="button" className="robot-care__btn" onClick={charge}>
              <PlugIcon />
              <span>Töltés</span>
            </button>
            {squeaky && (
              <button type="button" className="robot-care__btn robot-care__btn--oil" onClick={oilUp}>
                <OilIcon />
                <span>Olajozás</span>
              </button>
            )}
          </div>
          <button
            type="button"
            className={`workshop__robot${battery === 0 ? ' is-tired' : ''}`}
            onClick={showTrick}
            aria-label={`A robotod: ${PART_SLOTS.map((s) => partById(look[s.id])!.name.toLowerCase()).join(', ')}. ${tricks.length ? 'Koppints, és trükköt mutat.' : ''}`}
          >
            <span key={trick?.n ?? 0} className={`workshop__trick${trick ? ` workshop__trick--${trick.id}` : ''}`}>
              <RobotFigure key={robot} look={look} width={230} className="pop-in" motion={motion} />
            </span>
            <span className="workshop__platform" aria-hidden="true" />
          </button>
          <div className="workshop__friends" aria-label="A műhely lakói">
            {welcomed.map((f) => {
              const given = friendGiftsOf(progress, f.id);
              const asks = giftsOpen && friendAsks(progress, f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  className="workshop__friend"
                  aria-label={`${f.name}${given ? `, ${given} ajándéka van` : ''}${asks ? ', ajándékot kér' : ''}`}
                  onClick={() => tapFriend(f)}
                >
                  <span key={poke?.id === f.id ? poke.n : 0} className={`workshop__hop${poke?.id === f.id ? ' is-poked' : ''}`}>
                    <FriendArt id={f.id} width={96} />
                  </span>
                  {given > 0 && (
                    <span className="workshop__gifts" aria-hidden="true">
                      {FRIEND_GIFTS[f.id].slice(0, given).map((t) => (
                        <GiftArt key={t} thing={t} size={22} />
                      ))}
                    </span>
                  )}
                  {asks && (
                    <span className="workshop__asks" aria-hidden="true">
                      kér
                    </span>
                  )}
                </button>
              );
            })}
            {toFriend && <ArrivalRing progress={toFriend} unit="part" />}
          </div>
        </div>

        <aside className="workshop__panel">
          <GuideSay world="robot" {...say} />

          <div className="workshop__slots" role="tablist" aria-label="A robot részei">
            {PART_SLOTS.map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={slot === s.id}
                className={`workshop__slot${slot === s.id ? ' is-on' : ''}`}
                onClick={() => {
                  popBubble(1);
                  setSlot(s.id);
                }}
              >
                <SlotIcon slot={s.id} />
                <span>{s.name}</span>
                {affordable.includes(s.id) && (
                  <>
                    <span className="workshop__slot-dot" aria-hidden="true" />
                    <span className="sr-only">, van megvehető</span>
                  </>
                )}
              </button>
            ))}
          </div>

          <div className={`workshop__parts${partsIn(slot).length > 4 ? ' workshop__parts--many' : ''}`} role="tabpanel" aria-label={slotName}>
            {partsIn(slot).map((part) => {
              const mine = owns(progress, part.id);
              const on = look[slot] === part.id;
              const short = part.cost - balance;
              const state = on ? 'Rajta van' : mine ? 'A tiéd' : short > 0 ? `Még ${short}` : '';
              const answered = answer?.id === part.id ? ` is-${answer.kind}-${answer.n % 2 ? 'a' : 'b'}` : '';
              const wished = !mine && wish?.robot === robot && wish.part.id === part.id;
              // The tag pops onto the card the robot has just put on.
              const fresh = on && motion?.slot === slot && motion.kind !== 'same' ? motion.n : 0;
              return (
                <button
                  key={part.id}
                  type="button"
                  className={`workshop__part${on ? ' is-on' : ''}${!mine && short > 0 ? ' is-later' : ''}${wished ? ' is-wish' : ''}${answered}`}
                  onClick={() => pick(part)}
                  aria-label={`${part.name}. ${wished ? 'Erre gyűjtesz. ' : ''}${on ? 'Rajta van.' : mine ? 'A tiéd, koppints, és felveszi.' : short > 0 ? `${part.cost} csavar, még ${short} kell hozzá. Koppints, és erre gyűjtünk.` : `${part.cost} csavar, koppints, és felcsavarozzuk.`}`}
                >
                  {wished && (
                    <span className="workshop__wish" aria-hidden="true">
                      <HeartIcon />
                    </span>
                  )}
                  <RobotFigure look={{ ...look, [slot]: part.id }} width={74} />
                  <span className="workshop__part-name">{part.name}</span>
                  {mine ? (
                    <span key={fresh} className={`workshop__tag${on ? ' is-on' : ''}${fresh ? ' is-new' : ''}`}>
                      {state}
                    </span>
                  ) : (
                    <span className="plant-option__cost">
                      <Bolt size={22} />
                      {part.cost}
                    </span>
                  )}
                  {!mine && short > 0 && <span className="workshop__short">{state} kell</span>}
                </button>
              );
            })}
          </div>
          <p className="kiskert__note">
            Minden négy megoldott feladat a műhelyben egy csavar. Ha még kevés a csavar, koppints az alkatrészre, és arra gyűjtünk. Amit megvettél, az a tiéd marad: bármikor visszacserélheted. {boughtCount(progress)} új
            alkatrészed van.{robots.length === 1 ? ` ${SECOND_ROBOT_AFTER} új alkatrésznél jön egy második robot.` : ' Minden robotnak saját alkatrészei vannak.'}
          </p>
        </aside>
      </div>

      {friend && (
        <Modal className="visitor-pop" labelledBy="friend-title">
          <div className="visitor-pop__rays" aria-hidden="true" />
          <p className="visitor-pop__kicker">
            {friend.after} új alkatrész van a {robots.length > 1 ? 'robotjaidon' : 'robotodon'}
          </p>
          <h2 id="friend-title" className="visitor-pop__title">
            {friend.name} beköltözött!
          </h2>
          <div className="visitor-pop__art">
            <FriendArt id={friend.id} width={300} />
          </div>
          <button type="button" className="big-btn" onClick={welcome} autoFocus>
            Szia, {friend.name}!
          </button>
        </Modal>
      )}

      {robotArrived && (
        <Modal className="visitor-pop" labelledBy="robot2-title">
          <div className="visitor-pop__rays" aria-hidden="true" />
          <p className="visitor-pop__kicker">{SECOND_ROBOT_AFTER} új alkatrész van az első robotodon</p>
          <h2 id="robot2-title" className="visitor-pop__title">
            Itt egy második robot!
          </h2>
          <div className="visitor-pop__art">
            <RobotFigure look={lookOf(progress, 1)} width={170} />
          </div>
          <button type="button" className="big-btn" onClick={meetSecond} autoFocus>
            Építsük meg!
          </button>
        </Modal>
      )}

      {counting && <BoltCountCard part={counting} look={look} balance={balance} onDone={() => fitted(counting)} onClose={() => setCounting(null)} />}

      {giftFor && (
        <FriendGiftCard
          friend={friendsOf(progress).find((f) => f.id === giftFor)!}
          onDone={(f) => gave(f)}
          onClose={() => setGiftFor(null)}
        />
      )}
    </PlaceShell>
  );
}

/** Counting a part's bolts into its screw holes; nothing is spent until the last hole fills. */
function BoltCountCard({ part, look, balance, onDone, onClose }: { part: Part; look: Record<PartSlot, string>; balance: number; onDone: () => void; onClose: () => void }) {
  const modal = useModal<HTMLDivElement>(onClose);
  const [counted, setCounted] = useState(0);
  const intro = `Csavarozzuk fel! ${capitalize(numberCount(part.cost))} csavar kell. Koppints a dobozra.`;
  const line = counted === 0 ? intro : counted >= part.cost ? `${capitalize(numberCount(counted))}! Felcsavaroztuk!` : `${capitalize(numberCount(counted))}!`;

  useEffect(() => {
    speak(intro);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Runs once per visit.
  }, []);

  return (
    <div ref={modal} className="pantry sow bolt-sow" role="dialog" aria-modal="true" aria-labelledby="bolt-sow-title">
      <div className="pantry__card">
        <header className="pantry__top">
          <RoundButton label="Vissza a műhelybe, a csavarok a dobozban maradnak" onClick={onClose}>
            <BackIcon />
          </RoundButton>
          <h2 id="bolt-sow-title" className="pantry__title">
            {part.name}
          </h2>
          <div className="pill" aria-label={`${balance - counted} csavar a dobozban`}>
            <Bolt size={26} />
            <span>{balance - counted}</span>
          </div>
        </header>

        <GuideSay world="robot" mood="cheer" tone={counted >= part.cost ? 'good' : 'plain'} text={line} />

        <div className="sow__stage">
          <span className={`sow__plant bolt-sow__robot${counted >= part.cost ? ' is-on' : ''}`} aria-hidden="true">
            <RobotFigure look={{ ...look, [part.slot]: part.id }} width={130} />
          </span>
          <CountIn
            cost={part.cost}
            balance={balance}
            label={part.name}
            unit="csavar"
            unitObj="csavart"
            className="seed-count--bolt"
            token={(size) => <Bolt size={size} />}
            store={<BoltBox />}
            onCount={setCounted}
            onDone={onDone}
          />
        </div>
        <p className="sow__help">Koppints a dobozra vagy a lyukakra. Ha visszalépsz, minden csavar a dobozban marad.</p>
      </div>
    </div>
  );
}

/** A friend's gift card: its five gift places, what it asks for next, and the bolts counted out for it. */
function FriendGiftCard({ friend, onDone, onClose }: { friend: Friend; onDone: (f: Friend) => void; onClose: () => void }) {
  const { progress } = useProgress();
  const modal = useModal<HTMLDivElement>(onClose);
  const [counted, setCounted] = useState(0);
  const balance = boltBalance(progress);
  const given = friendGiftsOf(progress, friend.id);
  const next = nextFriendGift(progress, friend.id)!;
  const thing = GIFT_THINGS[next.thing];
  const can = canGiveFriend(progress, friend.id);
  const need = next.cost - balance;
  const intro = can
    ? `${friend.name} ${thing.asked} kér. ${capitalize(numberCount(next.cost))} csavar kell hozzá. Koppints a dobozra!`
    : `${friend.name} ${thing.asked} kér. Ehhez még ${need === 1 ? 'egy csavar' : `${need} csavar`} kell. A játékokban gyűjthetsz.`;
  const line = counted === 0 ? intro : counted >= next.cost ? `${capitalize(numberCount(counted))}! Kész az ajándék!` : `${capitalize(numberCount(counted))}!`;

  useEffect(() => {
    speak(intro);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Runs once per visit.
  }, []);

  return (
    <div ref={modal} className="pantry sow bolt-sow" role="dialog" aria-modal="true" aria-labelledby="friend-gift-title">
      <div className="pantry__card">
        <header className="pantry__top">
          <RoundButton label="Vissza a műhelybe" onClick={onClose}>
            <BackIcon />
          </RoundButton>
          <h2 id="friend-gift-title" className="pantry__title">
            {friend.name}
          </h2>
          <div className="pill" aria-label={`${balance - counted} csavar`}>
            <Bolt size={26} />
            <span>{balance - counted}</span>
          </div>
        </header>

        <GuideSay world="robot" mood="cheer" tone={counted >= next.cost ? 'good' : 'plain'} text={counted > 0 ? line : can ? `${friend.name} kér: ${thing.name.toLowerCase()}.` : `Még ${need} csavar kell.`} speech={line} />

        <div className="friend-gift__shelf" role="img" aria-label={`${FRIEND_GIFTS_EACH} ajándékból ${given} megvan`}>
          {FRIEND_GIFTS[friend.id].map((t, k) => (
            <span key={t} className={`friend-gift__place${k < given ? ' is-full' : k === given ? ' is-next' : ''}`}>
              {k <= given && <GiftArt thing={t} size={40} />}
            </span>
          ))}
        </div>

        <div className="sow__stage">
          <span className="sow__plant bolt-sow__robot is-on" aria-hidden="true">
            <FriendArt id={friend.id} width={150} />
          </span>
          {can ? (
            <CountIn
              cost={next.cost}
              balance={balance}
              label={thing.name}
              unit="csavar"
              unitObj="csavart"
              className="seed-count--bolt"
              token={(size) => <Bolt size={size} />}
              store={<BoltBox />}
              onCount={setCounted}
              onDone={() => onDone(friend)}
            />
          ) : (
            <p className="friend-gift__later">
              <Bolt size={30} /> {next.cost} csavar · még {need} kell
            </p>
          )}
        </div>
        {can && <p className="sow__help">Koppints a dobozra vagy a lyukakra. Ha visszalépsz, minden csavar a dobozban marad.</p>}
      </div>
    </div>
  );
}

function HeartIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24">
      <path d="M12 21s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7.5 2.8C19.5 16.4 12 21 12 21z" fill="#E2689A" stroke="#A23A66" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function PlugIcon() {
  return (
    <svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0zM12 18v4" />
    </svg>
  );
}

function OilIcon() {
  return (
    <svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h10l6-5v2l-4 5v5H4z" />
      <path d="M7 12V9h4v3" />
      <path d="M21 13v2" />
    </svg>
  );
}

import { useEffect, useState } from 'react';
import { Bolt } from '../../components/robot';
import { FriendArt, RobotFigure, SlotIcon } from '../../components/robotParts';
import { BackIcon, GuideBubble, RoundButton, SpeakerIcon } from '../../components/ui';
import { chime, fanfare, popBubble, robotChirp } from '../../lib/sound';
import { capitalize, numberCount } from '../../lib/numbers';
import { speak } from '../../lib/speech';
import type { Mood, Tone } from '../../lib/types';
import { useProgress } from '../../state/progress';
import {
  BATTERY_BARS,
  FRIENDS,
  PART_SLOTS,
  TRICKS,
  batteryOf,
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
  type TrickId
} from '../../state/robotParts';

interface Say {
  text: string;
  speech: string;
  mood: Mood;
  tone: Tone;
}

/** "egy csavar", "három csavar" for the speech; the bubble shows the digit. */
function boltsWord(n: number): string {
  return n === 1 ? 'egy csavar' : `${n} csavar`;
}

/** Robotépítő: the child spends the bolts earned on Robotút on parts for their own robot. */
export function Workshop({ onBack, onAlbum }: { onBack: () => void; onAlbum: () => void }) {
  const { progress, update } = useProgress();
  const balance = boltBalance(progress);
  const look = lookOf(progress);
  const battery = batteryOf(progress);
  const squeaky = isSqueaky(progress);
  const [slot, setSlot] = useState<PartSlot>('head');
  const [say, setSay] = useState<Say>(() => opening());
  /** The friend the child tapped last; the count restarts its little hop on every tap. */
  const [poke, setPoke] = useState<{ id: string; n: number } | null>(null);
  const friend = newFriend(progress);
  const welcomed = friendsOf(progress).slice(0, progress.robotFriendsSeen);
  const nextFriend = FRIENDS[welcomed.length];
  const tricks = tricksOf(progress);
  /** The trick playing now; the count restarts it on every tap. */
  const [trick, setTrick] = useState<{ id: TrickId; n: number } | null>(null);

  function opening(): Say {
    if (battery === 0) {
      return { text: 'Elfáradtam. Feltöltesz?', speech: 'Sokat dolgoztam, elfáradtam. Feltöltesz? Koppints a töltésre!', mood: 'smile', tone: 'plain' };
    }
    if (squeaky) {
      return { text: 'Nyikorog a karom. Kérek egy csepp olajat!', speech: 'Nyikorog a karom. Kérek egy csepp olajat! Koppints az olajozásra.', mood: 'think', tone: 'plain' };
    }
    const next = cheapestLeft(progress);
    if (!next) return { text: 'Kész a robotod! Minden alkatrész a tiéd.', speech: 'Kész a robotod! Minden alkatrész a tiéd. Nézd, milyen szép lett!', mood: 'cheer', tone: 'good' };
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

  useEffect(() => {
    if (!friend) speak(say.speech);
    // Runs once per visit.
  }, []);

  // Each newly arrived friend is greeted in turn, the earliest first.
  useEffect(() => {
    if (friend) speak(friend.speech);
  }, [friend?.id]);

  const pick = (part: Part) => {
    if (look[part.slot] === part.id) {
      popBubble(2);
      tell({ text: `Ez van rajta: ${part.name.toLowerCase()}.`, speech: `Most ez van a robotodon: ${part.name.toLowerCase()}.`, mood: 'smile', tone: 'plain' });
      return;
    }
    if (owns(progress, part.id)) {
      chime();
      update((p) => wear(p, part.id));
      tell({ text: 'Visszacseréltük!', speech: `Visszacseréltük. ${part.name}, ez is a tiéd.`, mood: 'cheer', tone: 'good' });
      return;
    }
    if (!canBuy(progress, part.id)) {
      const need = part.cost - balance;
      tell({ text: `Ehhez még ${need} csavar kell.`, speech: `Ehhez még ${boltsWord(need)} kell. A Robotúton gyűjthetsz!`, mood: 'think', tone: 'plain' });
      return;
    }
    fanfare();
    update((p) => buy(p, part.id));
    tell({ text: 'Felszereltük! Nézd, milyen menő lett!', speech: `Felszereltük: ${part.name.toLowerCase()}! Nézd, milyen menő lett a robotod!`, mood: 'cheer', tone: 'good' });
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
    robotChirp();
    setTrick((t) => ({ id: next.id, n: (t?.n ?? 0) + 1 }));
    tell({ text: `${next.name}!`, speech: `${next.name}!`, mood: 'cheer', tone: 'good' });
  };

  const welcome = () => {
    if (!friend) return;
    fanfare();
    update((p) => ({ ...p, robotFriendsSeen: p.robotFriendsSeen + 1 }));
  };

  const slotName = PART_SLOTS.find((s) => s.id === slot)!.name;

  return (
    <div className="screen screen--workshop world--robot">
      <div className="hill floor" aria-hidden="true" />

      <header className="topbar">
        <RoundButton label="Vissza a műhelybe" onClick={onBack}>
          <BackIcon />
        </RoundButton>
        <h1 className="screen-title">Robotépítő</h1>
        <div className="topbar__right">
          <button type="button" className="album-btn" onClick={onAlbum}>
            <span className="album-btn__icon" aria-hidden="true" />
            <span className="album-btn__label">Matricáim</span>
          </button>
          <div className="pill" aria-label={`${balance} csavar`}>
            <Bolt />
            <span>
              {balance}
              <span className="pill__unit"> csavar</span>
            </span>
          </div>
        </div>
      </header>

      <div className="workshop">
        <div className="workshop__stage">
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
              <RobotFigure key={Object.values(look).join()} look={look} width={230} className="pop-in" />
            </span>
            <span className="workshop__platform" aria-hidden="true" />
          </button>
          <div className="workshop__friends" aria-label="A műhely lakói">
            {welcomed.map((f) => (
              <button
                key={f.id}
                type="button"
                className="workshop__friend"
                aria-label={f.name}
                onClick={() => {
                  setPoke((p) => ({ id: f.id, n: (p?.id === f.id ? p.n : 0) + 1 }));
                  popBubble(3);
                  tell({ text: `Szia, ${f.name}!`, speech: `Ő ${f.name}. Itt lakik a műhelyben, veled.`, mood: 'cheer', tone: 'good' });
                }}
              >
                <span key={poke?.id === f.id ? poke.n : 0} className={`workshop__hop${poke?.id === f.id ? ' is-poked' : ''}`}>
                  <FriendArt id={f.id} width={96} />
                </span>
              </button>
            ))}
            {nextFriend && (
              <div className="visitors__next" aria-label={`${nextFriend.after} új alkatrésznél valaki beköltözik`}>
                <span className="visitors__q" aria-hidden="true">
                  ?
                </span>
                <span className="visitors__when">{nextFriend.after} alkatrésznél</span>
              </div>
            )}
          </div>
        </div>

        <aside className="workshop__panel">
          <div className="kiskert__say">
            <GuideBubble guide="csavar" mood={say.mood} tone={say.tone} csepiWidth={56}>
              {say.text}
            </GuideBubble>
            <RoundButton label="Meghallgatom újra" tint="blue" onClick={() => speak(say.speech)}>
              <SpeakerIcon />
            </RoundButton>
          </div>

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
              </button>
            ))}
          </div>

          <div className="workshop__parts" role="tabpanel" aria-label={slotName}>
            {partsIn(slot).map((part) => {
              const mine = owns(progress, part.id);
              const on = look[slot] === part.id;
              const short = part.cost - balance;
              const state = on ? 'Rajta van' : mine ? 'A tiéd' : short > 0 ? `Még ${short}` : '';
              return (
                <button
                  key={part.id}
                  type="button"
                  className={`workshop__part${on ? ' is-on' : ''}${!mine && short > 0 ? ' is-later' : ''}`}
                  onClick={() => pick(part)}
                  aria-label={`${part.name}. ${on ? 'Rajta van.' : mine ? 'A tiéd, koppints, és felveszi.' : short > 0 ? `${part.cost} csavar, még ${short} kell hozzá.` : `${part.cost} csavar, koppints, és megveszed.`}`}
                >
                  <RobotFigure look={{ ...look, [slot]: part.id }} width={74} />
                  <span className="workshop__part-name">{part.name}</span>
                  {mine ? (
                    <span className={`workshop__tag${on ? ' is-on' : ''}`}>{state}</span>
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
            Minden megoldott Robotút-pálya egy csavar. Amit megvettél, az a tiéd marad: bármikor visszacserélheted. {boughtCount(progress)} új alkatrészed van.
          </p>
        </aside>
      </div>

      {friend && (
        <div className="visitor-pop" role="dialog" aria-modal="true" aria-labelledby="friend-title">
          <div className="visitor-pop__rays" aria-hidden="true" />
          <p className="visitor-pop__kicker">{friend.after} új alkatrész van a robotodon</p>
          <h2 id="friend-title" className="visitor-pop__title">
            {friend.name} beköltözött!
          </h2>
          <div className="visitor-pop__art">
            <FriendArt id={friend.id} width={300} />
          </div>
          <button type="button" className="big-btn" onClick={welcome} autoFocus>
            Szia, {friend.name}!
          </button>
        </div>
      )}
    </div>
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

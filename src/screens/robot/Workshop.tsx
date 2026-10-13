import { useEffect, useState } from 'react';
import { Bolt } from '../../components/robot';
import { FriendArt, RobotFigure, SlotIcon } from '../../components/robotParts';
import { BackIcon, GuideBubble, RoundButton, SpeakerIcon } from '../../components/ui';
import { chime, fanfare, popBubble } from '../../lib/sound';
import { speak } from '../../lib/speech';
import type { Mood, Tone } from '../../lib/types';
import { useProgress } from '../../state/progress';
import {
  FRIENDS,
  PART_SLOTS,
  boltBalance,
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
  type PartSlot
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
  const [slot, setSlot] = useState<PartSlot>('head');
  const [say, setSay] = useState<Say>(() => opening());
  /** The friend the child tapped last; the count restarts its little hop on every tap. */
  const [poke, setPoke] = useState<{ id: string; n: number } | null>(null);
  const friend = newFriend(progress);
  const welcomed = friendsOf(progress).slice(0, progress.robotFriendsSeen);
  const nextFriend = FRIENDS[welcomed.length];

  function opening(): Say {
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
          <div className="workshop__robot" role="img" aria-label={`A robotod: ${PART_SLOTS.map((s) => partById(look[s.id])!.name.toLowerCase()).join(', ')}`}>
            <RobotFigure key={Object.values(look).join()} look={look} width={230} className="pop-in" />
            <span className="workshop__platform" aria-hidden="true" />
          </div>
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

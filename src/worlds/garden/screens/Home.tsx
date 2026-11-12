import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Bee, PatternFlower, RoundFlower, Seed, SmallPot, Sprout } from '../art';
import type { Badge, Place, RewardPlace } from '../../../components/island';
import { DotFace } from '../seeds';
import { PlantIcon } from '../kiskert';
import { WorldHub, type HubActions, type HubBubble } from '../../../components/WorldHub';
import { addLockedSpeech } from '../games/add/logic';
import { flashLockedSpeech } from '../games/learn/logic';
import { potsLockedSpeech } from '../games/pots/logic';
import { speak } from '../../../lib/speech';
import { gamesIn, solvedOf, type GameId } from '../../../state/games';
import { ladderOf } from '../../../state/ladder';
import { kidName, useActiveKid, useProfiles } from '../../../state/profiles';
import { useProgress, type Progress } from '../../../state/progress';
import { PLANT_OPTIONS, canMakeAnything, emptyBeds, newStickers, newVisitor, seedBalance } from '../../../state/rewards';
import { isOpen, markAnnounced, nextToAnnounce, numbersLeft, unlockOf, type Unlock } from '../../../state/unlocks';

function TrailArt() {
  return (
    <span className="plot__trail">
      <svg aria-hidden="true" width="96" height="70" viewBox="0 0 96 70">
        <path d="M8 58 C26 6 52 70 88 14" fill="none" stroke="#E0A800" strokeWidth="6" strokeLinecap="round" strokeDasharray="0 13" />
        <path d="M8 58 C18 30 30 30 40 40" fill="none" stroke="#FFB300" strokeWidth="9" strokeLinecap="round" />
      </svg>
      <span className="plot__trail-bee">
        <Bee width={48} />
      </span>
    </span>
  );
}

function BeeArt() {
  return (
    <span className="plot__trio plot__trio--bee">
      <Bee width={60} />
      <span className="plot__mini-sum">2+1</span>
    </span>
  );
}

/** Two pots in bloom and an empty one waiting for its friend. */
function PotsArt() {
  return (
    <span className="plot__trio plot__trio--pots">
      {['#E8577D', '#E8577D', null].map((petal, i) => (
        <span key={i} className="plot__pot">
          {petal ? <RoundFlower petal={petal} width={34} /> : <span className="plot__pot-space" />}
          <SmallPot width={40} />
        </span>
      ))}
    </span>
  );
}

const NOTICE_MS = 6000;
/** The greeting without a name: one child on the device, or an online voice. */
const HELLO = 'Szia, de jó, hogy itt vagy!';

/** What Csepi's bubble shows instead of the greeting for a while: an unlock or a sleeping game's hint. */
type Notice = HubBubble;

function SeedTrio() {
  return (
    <span className="plot__trio plot__trio--seeds">
      <Seed size={34} />
      <Seed size={34} />
      <Seed size={34} />
    </span>
  );
}

/** The child's own garden: a flower and a pear tree on one patch of soil. */
function KiskertArt() {
  return (
    <span className="plot__trio plot__trio--kiskert">
      <PlantIcon kind="flower" />
      <PlantIcon kind="tree" />
    </span>
  );
}

/** A garden game's place on the island: its picture, label and badge. */
interface Tile {
  label: string;
  art: ReactNode;
  badge: (p: Progress) => Badge | null;
}

const isNew = (game: GameId) => (p: Progress): Badge | null => (solvedOf(p, game) === 0 ? { text: 'Új!', kind: 'new' } : null);

const TILES: Partial<Record<GameId, Tile>> = {
  learn: {
    label: 'Számmagok – ismerkedés a számokkal',
    art: (
      <span className="plot__learn">
        <span className="plot__learn-num">3</span>
        <DotFace n={3} size={44} />
      </span>
    ),
    badge: (p) => (solvedOf(p, 'learn') === 0 ? { text: 'Kezdd itt!', kind: 'new' } : null)
  },
  water: { label: 'Locsolás – számolós játék', art: <Sprout />, badge: () => ({ text: 'Szomjas!', kind: 'care' }) },
  patterns: {
    label: 'Virágsor – mintázatos játék',
    art: (
      <span className="plot__trio plot__trio--flowers">
        <PatternFlower kind="tulip" width={44} />
        <PatternFlower kind="sun" width={44} />
        <PatternFlower kind="star" width={44} />
      </span>
    ),
    badge: isNew('patterns')
  },
  flash: { label: 'Villámszem – hány darab játék', art: <SeedTrio />, badge: isNew('flash') },
  add: { label: 'Méhkas – összeadós játék', art: <BeeArt />, badge: (p) => (solvedOf(p, 'add') === 0 ? { text: 'Új!', kind: 'new' } : { text: `${ladderOf(p, 'add').level + 1}. szint`, kind: 'level' }) },
  trace: { label: 'Mézút – számírás a méhecskével', art: <TrailArt />, badge: isNew('trace') },
  pots: { label: 'Cserépbarátok – számbarátok játék', art: <PotsArt />, badge: isNew('pots') }
};

/** What Csepi says about a game that opens later: once it opened, and when it is tapped while still asleep. */
interface UnlockText {
  opened: string;
  openedSpeech: string;
  asleep: string;
  /** The skill named on the sleeping place; none says when it opens instead. */
  skill?: string;
  lockedSpeech: (learned: number) => string;
}

const UNLOCK_TEXT: Partial<Record<GameId, UnlockText>> = {
  flash: {
    opened: 'Kinyílt a Villámszem!',
    openedSpeech: 'Nézd! Kinyílt egy új kertrész: a Villámszem!',
    asleep: 'Ez a kertrész még alszik.',
    lockedSpeech: flashLockedSpeech
  },
  add: {
    opened: 'Kinyílt a Méhkas!',
    openedSpeech: 'Nézd! Kinyílt a Méhkas. A méhecske segít összeadni a virágokat!',
    asleep: 'A méhecske még alszik.',
    skill: 'Összeadás',
    lockedSpeech: addLockedSpeech
  },
  pots: {
    opened: 'Kinyíltak a Cserépbarátok!',
    openedSpeech: 'Nézd! Kinyílt egy új kertrész: a Cserépbarátok. Töltsük meg a cserepeket virággal!',
    asleep: 'Ez a kertrész még alszik.',
    skill: 'Tízes barátok',
    lockedSpeech: potsLockedSpeech
  }
};

export function Home({ onOpen, onReward, ...actions }: HubActions & { onOpen: (game: GameId) => void; onReward: () => void }) {
  const { progress, update } = useProgress();
  const { profiles } = useProfiles();
  const kid = useActiveKid();
  const shared = profiles.kids.length > 1;
  const [notice, setNotice] = useState<Notice | null>(null);
  const noticeTimer = useRef<number | null>(null);
  // A sticker earned in a game is celebrated here, one at a time, the earliest first.
  const sticker = newStickers(progress, 'garden')[0] ?? null;
  const balance = seedBalance(progress);
  const canPlantNow = balance >= Math.min(...PLANT_OPTIONS.map((o) => o.cost)) && emptyBeds(progress).length > 0;
  const visitorWaiting = newVisitor(progress) !== null;

  // On a shared device Csepi greets each child by name, except aloud with an online voice (the name would leave the device).
  const hello = shared ? `Szia, ${kidName(kid)}! De jó, hogy itt vagy!` : HELLO;
  const greeting = progress.welcomed ? hello : 'Szia, én Csepi vagyok!';
  const question = 'Melyik játékot választod?';
  const sayGreeting = () => speak(`${greeting} ${question}`, { online: `${progress.welcomed ? HELLO : greeting} ${question}` });

  /** Sticky notices (an unlock) stay until the next tap; hints fade after a few seconds. */
  const showNotice = (n: Notice, speech: string, sticky = false) => {
    setNotice(n);
    speak(speech);
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = sticky ? null : window.setTimeout(() => setNotice(null), NOTICE_MS);
  };

  useEffect(() => {
    // Announce one newly opened game per visit, the earliest first.
    const opened = nextToAnnounce(progress);
    if (opened) {
      const text = UNLOCK_TEXT[opened.game]!;
      update((p) => markAnnounced(p, opened));
      showNotice({ kicker: 'Nézd, mi történt!', title: text.opened, mood: 'cheer', tone: 'good' }, text.openedSpeech, true);
    } else if (!sticker) {
      sayGreeting();
    }
    return () => {
      if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Runs once per visit to the home screen.
  }, []);

  const welcomeOnce = () => {
    if (!progress.welcomed) update((p) => ({ ...p, welcomed: true }));
  };
  const open = (game: GameId) => {
    welcomeOnce();
    onOpen(game);
  };
  const openGarden = () => {
    welcomeOnce();
    onReward();
  };

  const asleep = (u: Unlock): NonNullable<Place['locked']> => {
    const text = UNLOCK_TEXT[u.game]!;
    const left = numbersLeft(progress, u);
    return {
      skill: text.skill ? `${text.skill} · még ${left} szám` : `Még ${left} szám, és kinyílik`,
      hint: `még ${left} szám`,
      onTap: () => showNotice({ kicker: text.asleep, title: `Ismerj meg még ${left} számot!`, mood: 'think' }, text.lockedSpeech(progress.learnSolved))
    };
  };

  const places: Place[] = gamesIn('garden').map(({ id, name }) => {
    const tile = TILES[id]!;
    const u = unlockOf(id);
    if (u && !isOpen(progress, id)) return { id, name, label: `${name}: még zárva`, art: tile.art, locked: asleep(u) };
    return { id, name, label: tile.label, badge: tile.badge(progress), start: id === 'learn' && solvedOf(progress, id) === 0, art: tile.art, onOpen: () => open(id) };
  });
  const reward: RewardPlace = {
    label: 'Kiskertem – ültess a magjaidból',
    name: 'Kiskertem',
    art: <KiskertArt />,
    icon: <Seed size={30} />,
    count: balance,
    unit: 'mag',
    badge: visitorWaiting ? 'Vendég jött!' : canPlantNow ? 'Ültethetsz!' : canMakeAnything(progress) ? 'Főzhetsz!' : null,
    onClick: openGarden
  };

  const bubble: HubBubble = notice ?? { kicker: greeting, title: question, mood: 'cheer' };
  const replay = () => (notice ? speak(`${notice.kicker} ${notice.title}`) : sayGreeting());

  return <WorldHub world="garden" places={places} reward={reward} bubble={bubble} onReplay={replay} sticker={sticker} {...actions} />;
}

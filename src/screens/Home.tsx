import { useEffect, useRef, useState } from 'react';
import { Bee, PatternFlower, RoundFlower, Seed, SmallPot, Sprout } from '../components/art';
import { GuideBubble, KalandkaIcon, KalandkaWordmark, RoundButton, SpeakerIcon } from '../components/ui';
import { KidChip, MapButton, ParentsButton, PrintButton, VoiceButton } from '../components/hub';
import { Island, useLeave, type Place, type RewardPlace } from '../components/island';
import { DotFace } from '../components/seeds';
import { PlantIcon } from '../components/garden';
import { StickerPop } from '../components/StickerPop';
import { useForm } from '../components/Stage';
import { UNLOCK_ADD_AFTER, addLockedSpeech } from '../games/add/logic';
import { UNLOCK_FLASH_AFTER, flashLockedSpeech } from '../games/learn/logic';
import { UNLOCK_POTS_AFTER, potsLockedSpeech } from '../games/pots/logic';
import { speak } from '../lib/speech';
import type { Mood } from '../lib/types';
import { kidName, useActiveKid, useProfiles } from '../state/profiles';
import { useProgress } from '../state/progress';
import { PLANT_OPTIONS, canMakeAnything, emptyBeds, markStickerSeen, newStickers, newVisitor, seedBalance } from '../state/rewards';
import { ladderOf } from '../state/ladder';

export type GameId = 'learn' | 'water' | 'patterns' | 'flash' | 'add' | 'trace' | 'pots';

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

interface Notice {
  kicker: string;
  title: string;
  mood: Mood;
}

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

export function Home({
  onOpen,
  onGarden,
  onParents,
  onPrint,
  onSwitch,
  onMap
}: {
  onOpen: (game: GameId) => void;
  onGarden: () => void;
  onParents: () => void;
  onPrint: () => void;
  onSwitch: () => void;
  onMap: () => void;
}) {
  const { progress, update } = useProgress();
  const { profiles } = useProfiles();
  const kid = useActiveKid();
  const shared = profiles.kids.length > 1;
  const phone = useForm() !== 'tablet';
  const [leaving, leaveForMap] = useLeave(onMap);
  const [notice, setNotice] = useState<Notice | null>(null);
  const noticeTimer = useRef<number | null>(null);
  // A sticker earned in a game is celebrated here, one at a time, the earliest first.
  const sticker = newStickers(progress, 'garden')[0] ?? null;
  const balance = seedBalance(progress);
  const canPlantNow = balance >= Math.min(...PLANT_OPTIONS.map((o) => o.cost)) && emptyBeds(progress).length > 0;
  const visitorWaiting = newVisitor(progress) !== null;

  const learned = progress.learnSolved;
  const flashOpen = progress.unlockAll || learned >= UNLOCK_FLASH_AFTER;
  const addOpen = progress.unlockAll || learned >= UNLOCK_ADD_AFTER;
  const potsOpen = progress.unlockAll || learned >= UNLOCK_POTS_AFTER;
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
    if (flashOpen && !progress.flashAnnounced) {
      update((p) => ({ ...p, flashAnnounced: true }));
      showNotice({ kicker: 'Nézd, mi történt!', title: 'Kinyílt a Villámszem!', mood: 'cheer' }, 'Nézd! Kinyílt egy új kertrész: a Villámszem!', true);
    } else if (addOpen && !progress.addAnnounced) {
      update((p) => ({ ...p, addAnnounced: true }));
      showNotice({ kicker: 'Nézd, mi történt!', title: 'Kinyílt a Méhkas!', mood: 'cheer' }, 'Nézd! Kinyílt a Méhkas. A méhecske segít összeadni a virágokat!', true);
    } else if (potsOpen && !progress.potsAnnounced) {
      update((p) => ({ ...p, potsAnnounced: true }));
      showNotice({ kicker: 'Nézd, mi történt!', title: 'Kinyíltak a Cserépbarátok!', mood: 'cheer' }, 'Nézd! Kinyílt egy új kertrész: a Cserépbarátok. Töltsük meg a cserepeket virággal!', true);
    } else if (!sticker) {
      sayGreeting();
    }
    return () => {
      if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    };
    // Runs once per visit to the home screen.
  }, []);

  const open = (game: GameId) => {
    if (!progress.welcomed) update((p) => ({ ...p, welcomed: true }));
    onOpen(game);
  };

  const tapFlashLocked = () => {
    const left = UNLOCK_FLASH_AFTER - learned;
    showNotice({ kicker: 'Ez a kertrész még alszik.', title: `Ismerj meg még ${left} számot!`, mood: 'think' }, flashLockedSpeech(learned));
  };
  const tapAddLocked = () => {
    const left = UNLOCK_ADD_AFTER - learned;
    showNotice({ kicker: 'A méhecske még alszik.', title: `Ismerj meg még ${left} számot!`, mood: 'think' }, addLockedSpeech(learned));
  };
  const tapPotsLocked = () => {
    const left = UNLOCK_POTS_AFTER - learned;
    showNotice({ kicker: 'Ez a kertrész még alszik.', title: `Ismerj meg még ${left} számot!`, mood: 'think' }, potsLockedSpeech(learned));
  };
  const openGarden = () => {
    if (!progress.welcomed) update((p) => ({ ...p, welcomed: true }));
    onGarden();
  };

  const places: Place[] = [
    {
      id: 'learn',
      name: 'Számmagok',
      label: 'Számmagok – ismerkedés a számokkal',
      badge: progress.learnSolved === 0 ? 'Kezdd itt!' : null,
      start: progress.learnSolved === 0,
      art: (
        <span className="plot__learn">
          <span className="plot__learn-num">3</span>
          <DotFace n={3} size={44} />
        </span>
      ),
      onOpen: () => open('learn')
    },
    { id: 'water', name: 'Locsolás', label: 'Locsolás – számolós játék', badge: 'Szomjas!', art: <Sprout />, onOpen: () => open('water') },
    {
      id: 'patterns',
      name: 'Virágsor',
      label: 'Virágsor – mintázatos játék',
      badge: progress.patternsSolved === 0 ? 'Új!' : null,
      art: (
        <span className="plot__trio plot__trio--flowers">
          <PatternFlower kind="tulip" width={44} />
          <PatternFlower kind="sun" width={44} />
          <PatternFlower kind="star" width={44} />
        </span>
      ),
      onOpen: () => open('patterns')
    },
    flashOpen
      ? { id: 'flash', name: 'Villámszem', label: 'Villámszem – hány darab játék', badge: progress.flashSolved === 0 ? 'Új!' : null, art: <SeedTrio />, onOpen: () => open('flash') }
      : { id: 'flash', name: 'Villámszem', label: 'Villámszem: még zárva', art: <SeedTrio />, locked: { skill: `Még ${UNLOCK_FLASH_AFTER - learned} szám, és kinyílik`, hint: `még ${UNLOCK_FLASH_AFTER - learned} szám`, onTap: tapFlashLocked } },
    addOpen
      ? {
          id: 'add',
          name: 'Méhkas',
          label: 'Méhkas – összeadós játék',
          badge: progress.addSolved === 0 ? 'Új!' : `${ladderOf(progress, 'add').level + 1}. szint`,
          art: <BeeArt />,
          onOpen: () => open('add')
        }
      : { id: 'add', name: 'Méhkas', label: 'Méhkas: még zárva', art: <BeeArt />, locked: { skill: `Összeadás · még ${UNLOCK_ADD_AFTER - learned} szám`, hint: `még ${UNLOCK_ADD_AFTER - learned} szám`, onTap: tapAddLocked } },
    { id: 'trace', name: 'Mézút', label: 'Mézút – számírás a méhecskével', badge: progress.traceSolved === 0 ? 'Új!' : null, art: <TrailArt />, onOpen: () => open('trace') },
    potsOpen
      ? { id: 'pots', name: 'Cserépbarátok', label: 'Cserépbarátok – tízes barátok játék', badge: progress.potsSolved === 0 ? 'Új!' : null, art: <PotsArt />, onOpen: () => open('pots') }
      : { id: 'pots', name: 'Cserépbarátok', label: 'Cserépbarátok: még zárva', art: <PotsArt />, locked: { skill: `Tízes barátok · még ${UNLOCK_POTS_AFTER - learned} szám`, hint: `még ${UNLOCK_POTS_AFTER - learned} szám`, onTap: tapPotsLocked } }
  ];
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

  const bubble = notice ?? { kicker: greeting, title: question, mood: 'cheer' as Mood };
  const replay = () => (notice ? speak(`${notice.kicker} ${notice.title}`) : sayGreeting());

  return (
    <div className="screen screen--home screen--island">
      <header className="topbar">
        <div className="brand">
          <KalandkaIcon size={56} />
          <div className="brand__text">
            <KalandkaWordmark size={phone ? 15 : 22} />
            <div className="brand__world">Számkertész</div>
          </div>
        </div>
        <div className="topbar__right">
          {shared && <KidChip onSwitch={onSwitch} />}
          <MapButton onClick={leaveForMap} />
          <VoiceButton />
          <PrintButton onClick={onPrint} />
          <ParentsButton onClick={onParents} />
        </div>
      </header>

      <div className="home-guide">
        <GuideBubble mood={bubble.mood} tone={notice?.mood === 'cheer' ? 'good' : 'plain'} csepiWidth={80}>
          <div className="bubble__row">
            <div>
              <div className="bubble__kicker">{bubble.kicker}</div>
              <h1 className="bubble__title">{bubble.title}</h1>
            </div>
            <RoundButton label="Meghallgatom újra" tint="blue" onClick={replay}>
              <SpeakerIcon />
            </RoundButton>
          </div>
        </GuideBubble>
      </div>

      <Island world="garden" places={places} reward={reward} leaving={leaving} />

      {sticker && <StickerPop key={sticker.id} sticker={sticker} seen={progress.stickersSeen} onDone={() => update((p) => markStickerSeen(p, sticker.id))} />}
    </div>
  );
}

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Bee, PatternFlower, RoundFlower, Seed, SmallPot, Sprout } from '../components/art';
import { GuideBubble, KalandkaIcon, KalandkaWordmark, LockIcon, PlayIcon, RoundButton, SpeakerIcon } from '../components/ui';
import { KidChip, MapButton, ParentsButton, VoiceButton } from '../components/hub';
import { DotFace } from '../components/seeds';
import { PlantIcon } from '../components/garden';
import { StickerPop } from '../components/StickerPop';
import { useForm } from '../components/Stage';
import { UNLOCK_ADD_AFTER, addLockedSpeech } from '../games/add/logic';
import { UNLOCK_FLASH_AFTER, flashLockedSpeech } from '../games/learn/logic';
import { UNLOCK_POTS_AFTER, potsLockedSpeech } from '../games/pots/logic';
import { PLANTS } from '../games/water/logic';
import { speak } from '../lib/speech';
import type { Mood } from '../lib/types';
import { kidName, useActiveKid, useProfiles } from '../state/profiles';
import { useProgress } from '../state/progress';
import { BEDS, PLANT_OPTIONS, bedAt, markStickerSeen, newStickers, newVisitor, seedBalance } from '../state/rewards';

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

const GARDEN_SLOTS = 12;
const NOTICE_MS = 6000;

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

function LockedPlot({ name, skill, art, onTap }: { name: string; skill: string; art?: ReactNode; onTap: () => void }) {
  return (
    <button type="button" className="plot plot--locked" onClick={onTap} aria-label={`${name}: még zárva`}>
      <span className="plot__lock">
        <LockIcon />
      </span>
      {art ?? <Seed size={44} />}
      <span className="plot__soil plot__soil--wide" />
      <span className="plot__name">{name}</span>
      <span className="plot__skill">{skill}</span>
    </button>
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
  onSwitch,
  onMap
}: {
  onOpen: (game: GameId) => void;
  onGarden: () => void;
  onParents: () => void;
  onSwitch: () => void;
  onMap: () => void;
}) {
  const { progress, update } = useProgress();
  const { profiles } = useProfiles();
  const kid = useActiveKid();
  const shared = profiles.kids.length > 1;
  const phone = useForm() !== 'tablet';
  const [notice, setNotice] = useState<Notice | null>(null);
  const noticeTimer = useRef<number | null>(null);
  // A sticker earned in a game is celebrated here, one at a time, the earliest first.
  const sticker = newStickers(progress, 'garden')[0] ?? null;
  const balance = seedBalance(progress);
  const canPlantNow = balance >= Math.min(...PLANT_OPTIONS.map((o) => o.cost)) && Array.from({ length: BEDS }, (_, i) => bedAt(progress, i)).some((b) => !b);
  const visitorWaiting = newVisitor(progress) !== null;

  const learned = progress.learnSolved;
  const flashOpen = progress.unlockAll || learned >= UNLOCK_FLASH_AFTER;
  const addOpen = progress.unlockAll || learned >= UNLOCK_ADD_AFTER;
  const potsOpen = progress.unlockAll || learned >= UNLOCK_POTS_AFTER;
  // On a shared device Csepi greets each child by name.
  const hello = shared ? `Szia, ${kidName(kid)}! De jó, hogy itt vagy!` : 'Szia, de jó, hogy itt vagy!';
  const greeting = progress.welcomed ? hello : 'Szia, én Csepi vagyok!';
  const question = 'Melyik játékot választod?';

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
      showNotice({ kicker: 'Nézd, mi történt!', title: 'Kinyílt a Magvillantás!', mood: 'cheer' }, 'Nézd! Kinyílt egy új kertrész: a Magvillantás!', true);
    } else if (addOpen && !progress.addAnnounced) {
      update((p) => ({ ...p, addAnnounced: true }));
      showNotice({ kicker: 'Nézd, ki jött!', title: 'Megjött a Méhecske!', mood: 'cheer' }, 'Nézd! Megjött a méhecske. Segít összeadni a virágokat!', true);
    } else if (potsOpen && !progress.potsAnnounced) {
      update((p) => ({ ...p, potsAnnounced: true }));
      showNotice({ kicker: 'Nézd, mi történt!', title: 'Kinyíltak a Cserépbarátok!', mood: 'cheer' }, 'Nézd! Kinyílt egy új kertrész: a Cserépbarátok. Töltsük meg a cserepeket virággal!', true);
    } else if (!sticker) {
      speak(`${greeting} ${question}`);
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

  const bubble = notice ?? { kicker: greeting, title: question, mood: 'cheer' as Mood };
  const replay = () => speak(notice ? `${notice.kicker} ${notice.title}` : `${greeting} ${question}`);

  const garden = progress.garden
    .slice(-GARDEN_SLOTS)
    .map((id) => PLANTS.find((p) => p.id === id))
    .filter((p) => p !== undefined);

  return (
    <div className="screen screen--home">
      <div className="hill" aria-hidden="true" />

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
          <div className="pill" aria-label={`${balance} mag`}>
            <Seed />
            <span>
              {balance}
              <span className="pill__unit"> mag</span>
            </span>
          </div>
          <MapButton onClick={onMap} />
          <VoiceButton />
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

      <div className="plots">
        <button type="button" className="plot plot--play" onClick={() => open('learn')} aria-label="Számvetés – ismerkedés a számokkal">
          {progress.learnSolved === 0 && <span className="plot__badge">Kezdd itt!</span>}
          <span className="plot__learn">
            <span className="plot__learn-num">3</span>
            <DotFace n={3} size={44} />
          </span>
          <span className="plot__soil" />
          <span className="plot__name">Számvetés</span>
          <span className="plot__cta">
            <PlayIcon /> Játék
          </span>
        </button>

        <button type="button" className="plot plot--play" onClick={() => open('water')} aria-label="Locsolás – számolós játék">
          <span className="plot__badge">Szomjas!</span>
          <Sprout />
          <span className="plot__soil" />
          <span className="plot__name">Locsolás</span>
          <span className="plot__cta">
            <PlayIcon /> Játék
          </span>
        </button>

        <button type="button" className="plot plot--play" onClick={() => open('patterns')} aria-label="Virágsor – mintázatos játék">
          {progress.patternsSolved === 0 && <span className="plot__badge">Új!</span>}
          <span className="plot__trio plot__trio--flowers">
            <PatternFlower kind="tulip" width={44} />
            <PatternFlower kind="sun" width={44} />
            <PatternFlower kind="star" width={44} />
          </span>
          <span className="plot__soil" />
          <span className="plot__name">Virágsor</span>
          <span className="plot__cta">
            <PlayIcon /> Játék
          </span>
        </button>

        {flashOpen ? (
          <button type="button" className="plot plot--play" onClick={() => open('flash')} aria-label="Magvillantás – hány darab játék">
            {progress.flashSolved === 0 && <span className="plot__badge">Új!</span>}
            <SeedTrio />
            <span className="plot__soil" />
            <span className="plot__name">Magvillantás</span>
            <span className="plot__cta">
              <PlayIcon /> Játék
            </span>
          </button>
        ) : (
          <LockedPlot
            name="Magvillantás"
            skill={`Még ${UNLOCK_FLASH_AFTER - learned} szám, és kinyílik`}
            art={<SeedTrio />}
            onTap={tapFlashLocked}
          />
        )}

        {addOpen ? (
          <button type="button" className="plot plot--play" onClick={() => open('add')} aria-label="Méhecske – összeadós játék">
            {progress.addSolved === 0 ? <span className="plot__badge">Új!</span> : <span className="plot__badge">{progress.addLevel + 1}. szint</span>}
            <BeeArt />
            <span className="plot__soil" />
            <span className="plot__name">Méhecske</span>
            <span className="plot__cta">
              <PlayIcon /> Játék
            </span>
          </button>
        ) : (
          <LockedPlot name="Méhecske" skill={`Összeadás · még ${UNLOCK_ADD_AFTER - learned} szám`} art={<BeeArt />} onTap={tapAddLocked} />
        )}

        <button type="button" className="plot plot--play" onClick={() => open('trace')} aria-label="Mézút – számírás a méhecskével">
          {progress.traceSolved === 0 && <span className="plot__badge">Új!</span>}
          <TrailArt />
          <span className="plot__soil" />
          <span className="plot__name">Mézút</span>
          <span className="plot__cta">
            <PlayIcon /> Játék
          </span>
        </button>

        {potsOpen ? (
          <button type="button" className="plot plot--play" onClick={() => open('pots')} aria-label="Cserépbarátok – tízes barátok játék">
            {progress.potsSolved === 0 && <span className="plot__badge">Új!</span>}
            <PotsArt />
            <span className="plot__soil" />
            <span className="plot__name">Cserépbarátok</span>
            <span className="plot__cta">
              <PlayIcon /> Játék
            </span>
          </button>
        ) : (
          <LockedPlot name="Cserépbarátok" skill={`Tízes barátok · még ${UNLOCK_POTS_AFTER - learned} szám`} art={<PotsArt />} onTap={tapPotsLocked} />
        )}

        <button type="button" className="plot plot--play plot--kiskert" onClick={openGarden} aria-label="Kiskertem – ültess a magjaidból">
          {visitorWaiting ? <span className="plot__badge">Vendég jött!</span> : canPlantNow && <span className="plot__badge">Ültethetsz!</span>}
          <KiskertArt />
          <span className="plot__soil" />
          <span className="plot__name">Kiskertem</span>
          <span className="plot__cta">
            <Seed size={22} /> Ültetés
          </span>
        </button>
      </div>

      {sticker && <StickerPop key={sticker.id} sticker={sticker} seen={progress.stickersSeen} onDone={() => update((p) => markStickerSeen(p, sticker.id))} />}

      <div className="garden" aria-label={`A kerted: ${garden.length} virág`}>
        {garden.length === 0 ? (
          <p className="garden__empty">Itt nőnek majd a virágaid.</p>
        ) : (
          garden.map((p, i) => (
            <div key={`${p.id}-${i}`} className="garden__flower">
              <RoundFlower petal={p.petal} width={64} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

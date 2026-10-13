import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { CsepiIcon } from '../components/Csepi';
import { AVATARS, Avatar } from '../components/avatars';
import { Bee, PatternFlower, RoundFlower, Seed, Sprout } from '../components/art';
import { GuideBubble, KalandkaWordmark, LockIcon, PlayIcon, RoundButton, SpeakerIcon, SpeakerOffIcon } from '../components/ui';
import { DotFace } from '../components/seeds';
import { useForm } from '../components/Stage';
import { UNLOCK_ADD_AFTER, addLockedSpeech } from '../games/add/logic';
import { UNLOCK_FLASH_AFTER, flashLockedSpeech } from '../games/learn/logic';
import { PLANTS } from '../games/water/logic';
import { setSpeechEnabled, speak } from '../lib/speech';
import type { Mood } from '../lib/types';
import { kidName, useActiveKid, useProfiles } from '../state/profiles';
import { useProgress } from '../state/progress';

export type GameId = 'learn' | 'water' | 'patterns' | 'flash' | 'add' | 'trace';

const COMING_SOON = [
  { name: 'Cserépbarátok', skill: 'Tízes barátok' },
  { name: 'Szüret', skill: 'Kivonás' }
];

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

const SLEEPING = 'Ez a kertrész még alszik. Hamarosan kinyílik!';
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

function SwapIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h14" />
      <path d="M14 4l4 4-4 4" />
      <path d="M20 16H6" />
      <path d="M10 12l-4 4 4 4" />
    </svg>
  );
}

export function Home({ onOpen, onParents, onSwitch }: { onOpen: (game: GameId) => void; onParents: () => void; onSwitch: () => void }) {
  const { progress, update } = useProgress();
  const { profiles } = useProfiles();
  const kid = useActiveKid();
  const shared = profiles.kids.length > 1;
  const phone = useForm() !== 'tablet';
  const [notice, setNotice] = useState<Notice | null>(null);
  const noticeTimer = useRef<number | null>(null);

  const learned = progress.learnSolved;
  const flashOpen = progress.unlockAll || learned >= UNLOCK_FLASH_AFTER;
  const addOpen = progress.unlockAll || learned >= UNLOCK_ADD_AFTER;
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
    } else {
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
  const tapSleeping = () => showNotice({ kicker: 'Ez a kertrész még alszik.', title: 'Hamarosan kinyílik!', mood: 'sleep' }, SLEEPING);

  const bubble = notice ?? { kicker: greeting, title: question, mood: 'cheer' as Mood };
  const replay = () => speak(notice ? `${notice.kicker} ${notice.title}` : `${greeting} ${question}`);

  // Muting is one tap here; the parents' corner keeps the same switch next to the tempo setting.
  const toggleVoice = () => {
    const on = !progress.voice;
    update((p) => ({ ...p, voice: on }));
    setSpeechEnabled(on);
    if (on) speak('Itt vagyok!');
  };

  const garden = progress.garden
    .slice(-GARDEN_SLOTS)
    .map((id) => PLANTS.find((p) => p.id === id))
    .filter((p) => p !== undefined);

  return (
    <div className="screen screen--home">
      <div className="hill" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <CsepiIcon size={56} />
          <div className="brand__text">
            <KalandkaWordmark size={phone ? 15 : 22} />
            <div className="brand__world">Számkertész</div>
          </div>
        </div>
        <div className="topbar__right">
          {shared && (
            <button
              type="button"
              className="kid-chip"
              style={{ '--ring': AVATARS[kid.avatar].ring } as CSSProperties}
              aria-label={`${kidName(kid)} játszik. Másik gyerek választása`}
              onClick={onSwitch}
            >
              <Avatar id={kid.avatar} size={46} />
              <span className="kid-chip__name">{kidName(kid)}</span>
              <span className="kid-chip__swap">
                <SwapIcon />
              </span>
            </button>
          )}
          <div className="pill" aria-label={`${progress.seeds} mag`}>
            <Seed />
            <span>
              {progress.seeds}
              <span className="pill__unit"> mag</span>
            </span>
          </div>
          <button
            type="button"
            className="voice-btn"
            aria-pressed={!progress.voice}
            aria-label={progress.voice ? 'Csepi hangjának némítása' : 'Csepi hangjának bekapcsolása'}
            onClick={toggleVoice}
          >
            {progress.voice ? <SpeakerIcon size={26} /> : <SpeakerOffIcon size={26} />}
          </button>
          <button type="button" className="parents-btn" onClick={onParents}>
            <LockIcon size={22} />
            <span className="parents-btn__label">Szülőknek</span>
          </button>
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
          <span className="plot__trio">
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

        {COMING_SOON.map((g) => (
          <LockedPlot key={g.name} name={g.name} skill={g.skill} onTap={tapSleeping} />
        ))}
      </div>

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

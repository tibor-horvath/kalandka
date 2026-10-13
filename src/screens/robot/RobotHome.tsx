import { useEffect, useRef, useState } from 'react';
import { KidChip, MapButton, ParentsButton, VoiceButton } from '../../components/hub';
import { Bolt, CsavarIcon, Gear, PathArt } from '../../components/robot';
import { useForm } from '../../components/Stage';
import { GuideBubble, KalandkaWordmark, LockIcon, PlayIcon, RoundButton, SpeakerIcon } from '../../components/ui';
import { PATH_LEVELS, pathLevelIndex } from '../../games/robot/path';
import { speak } from '../../lib/speech';
import { kidName, useActiveKid, useProfiles } from '../../state/profiles';
import { useProgress } from '../../state/progress';

export type RobotGameId = 'path';

/** Machines Csavar is still building: shown asleep, each with what it will teach. */
const COMING = [
  { name: 'Mérleg', skill: 'Egyenlőség, mérés' },
  { name: 'Mintagép', skill: 'Nehezebb minták' },
  { name: 'Válogatógép', skill: 'Csoportosítás' }
];

const SHELF_SLOTS = 14;
const NOTICE_MS = 5000;

/** Robotműhely: Csavar's workshop, the second Kalandka world, for the bigger ones. */
export function RobotHome({ onOpen, onParents, onSwitch, onMap }: { onOpen: (game: RobotGameId) => void; onParents: () => void; onSwitch: () => void; onMap: () => void }) {
  const { progress, update } = useProgress();
  const { profiles } = useProfiles();
  const kid = useActiveKid();
  const phone = useForm() !== 'tablet';
  const shared = profiles.kids.length > 1;
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | null>(null);

  const hello = shared ? `Szia, ${kidName(kid)}! Jó, hogy itt vagy a műhelyben!` : 'Szia! Jó, hogy itt vagy a műhelyben!';
  const greeting = progress.robotWelcomed ? hello : 'Szia, én Csavar vagyok!';
  const question = progress.robotWelcomed ? 'Melyik gépet indítjuk?' : 'Itt robotokat programozunk!';
  const intro = progress.robotWelcomed ? `${greeting} ${question}` : 'Szia, én Csavar vagyok, a műhely robotja! Itt robotokat programozunk. Kezdjük a Robotúttal!';

  useEffect(() => {
    speak(intro);
    return () => {
      if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    };
    // Runs once per visit.
  }, []);

  const open = (game: RobotGameId) => {
    if (!progress.robotWelcomed) update((p) => ({ ...p, robotWelcomed: true }));
    onOpen(game);
  };

  const tapComing = (name: string) => {
    const text = `A ${name} még készül. Ezen még dolgozom!`;
    setNotice(text);
    speak(`${text} Addig játsszunk a Robotúttal!`);
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), NOTICE_MS);
  };

  const levelIdx = pathLevelIndex(progress.pathSolved);
  const shelf = Math.min(progress.bolts, SHELF_SLOTS);

  return (
    <div className="screen screen--home screen--robot-home world--robot">
      <div className="hill floor" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <CsavarIcon size={56} />
          <div className="brand__text">
            <KalandkaWordmark size={phone ? 15 : 22} accent="#0C6E6A" />
            <div className="brand__world">Robotműhely</div>
          </div>
        </div>
        <div className="topbar__right">
          {shared && <KidChip onSwitch={onSwitch} />}
          <div className="pill" aria-label={`${progress.bolts} csavar`}>
            <Bolt />
            <span>
              {progress.bolts}
              <span className="pill__unit"> csavar</span>
            </span>
          </div>
          <MapButton onClick={onMap} />
          <VoiceButton guide="Csavar" />
          <ParentsButton onClick={onParents} />
        </div>
      </header>

      <div className="home-guide">
        <GuideBubble guide="csavar" mood={notice ? 'think' : 'cheer'} csepiWidth={80}>
          <div className="bubble__row">
            <div>
              <div className="bubble__kicker">{notice ? 'Hamarosan' : greeting}</div>
              <h1 className="bubble__title">{notice ?? question}</h1>
            </div>
            <RoundButton label="Meghallgatom újra" tint="blue" onClick={() => speak(notice ?? intro)}>
              <SpeakerIcon />
            </RoundButton>
          </div>
        </GuideBubble>
      </div>

      <div className="plots">
        <button type="button" className="plot plot--play" onClick={() => open('path')} aria-label="Robotút – programozd a robotot">
          {progress.pathSolved === 0 ? <span className="plot__badge">Kezdd itt!</span> : <span className="plot__badge">{levelIdx + 1}. szint</span>}
          <PathArt />
          <span className="plot__soil plot__soil--floor" />
          <span className="plot__name">Robotút</span>
          <span className="plot__cta">
            <PlayIcon /> Játék
          </span>
        </button>

        {COMING.map((m) => (
          <button key={m.name} type="button" className="plot plot--locked" onClick={() => tapComing(m.name)} aria-label={`${m.name}: még készül`}>
            <span className="plot__lock">
              <LockIcon />
            </span>
            <Gear />
            <span className="plot__soil plot__soil--floor" />
            <span className="plot__name">{m.name}</span>
            <span className="plot__skill">{m.skill} · hamarosan</span>
          </button>
        ))}
      </div>

      <div className="garden shelf" aria-label={`A polcod: ${progress.bolts} csavar`}>
        {shelf === 0 ? (
          <p className="garden__empty">Ide gyűlnek a csavarjaid. {PATH_LEVELS.length} szint vár a Robotúton!</p>
        ) : (
          Array.from({ length: shelf }, (_, i) => (
            <span key={i} className="garden__flower shelf__bolt">
              <Bolt size={40} />
            </span>
          ))
        )}
      </div>
    </div>
  );
}

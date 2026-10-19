import { useEffect, useRef, useState } from 'react';
import { KidChip, MapButton, ParentsButton, RewardPlot, VoiceButton } from '../../components/hub';
import { Bolt, Gear, PathArt, ScaleArt, SeqArt, SortArt } from '../../components/robot';
import { FriendArt, MyRobot } from '../../components/robotParts';
import { useForm } from '../../components/Stage';
import { StickerPop } from '../../components/StickerPop';
import { GuideBubble, KalandkaIcon, KalandkaWordmark, LockIcon, PlayIcon, RoundButton, SpeakerIcon } from '../../components/ui';
import { pathLevelIndex } from '../../games/robot/path';
import { scaleLevelIndex } from '../../games/robot/scale';
import { seqLevelIndex } from '../../games/robot/seq';
import { sortLevelIndex } from '../../games/robot/sort';
import { speak } from '../../lib/speech';
import { kidName, useActiveKid, useProfiles } from '../../state/profiles';
import { useProgress } from '../../state/progress';
import { markStickerSeen, newStickers } from '../../state/rewards';
import { boltBalance, canBuyAnything, friendsOf, newFriend, secondRobotNew } from '../../state/robotParts';

export type RobotGameId = 'path' | 'sort' | 'scale' | 'seq';

/** Machines Csavar is still building: shown asleep, each with what it will teach. With the games they fill seven places, so Robotépítő is the eighth. */
const COMING = [
  { name: 'Tükörgép', skill: 'Tükrözés, szimmetria' },
  { name: 'Kódzár', skill: 'Jelek és kódok' },
  { name: 'Hibakereső', skill: 'Hiba a programban' }
];

const NOTICE_MS = 5000;
/** The greeting without a name: one child on the device, or an online voice. */
const HELLO = 'Szia! Jó, hogy itt vagy a műhelyben!';

/** Robotműhely: Csavar's workshop, the second Kalandka world, for the bigger ones. */
export function RobotHome({
  onOpen,
  onWorkshop,
  onParents,
  onSwitch,
  onMap
}: {
  onOpen: (game: RobotGameId) => void;
  onWorkshop: () => void;
  onParents: () => void;
  onSwitch: () => void;
  onMap: () => void;
}) {
  const { progress, update } = useProgress();
  const { profiles } = useProfiles();
  const kid = useActiveKid();
  const phone = useForm() !== 'tablet';
  const shared = profiles.kids.length > 1;
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | null>(null);
  // A Robotút sticker earned in the game is celebrated here, one at a time.
  const sticker = newStickers(progress, 'robot')[0] ?? null;
  const balance = boltBalance(progress);
  const friends = friendsOf(progress).slice(0, progress.robotFriendsSeen);

  // Aloud with an online voice Csavar leaves the name out: it would leave the device.
  const hello = shared ? `Szia, ${kidName(kid)}! Jó, hogy itt vagy a műhelyben!` : HELLO;
  const greeting = progress.robotWelcomed ? hello : 'Szia, én Csavar vagyok!';
  const question = progress.robotWelcomed ? 'Melyik gépet indítjuk?' : 'Itt robotokat programozunk!';
  const intro = progress.robotWelcomed ? `${greeting} ${question}` : 'Szia, én Csavar vagyok, a műhely robotja! Itt robotokat programozunk. Kezdjük a Robotúttal!';
  const sayIntro = () => speak(intro, { online: progress.robotWelcomed ? `${HELLO} ${question}` : intro });

  useEffect(() => {
    if (!sticker) sayIntro();
    return () => {
      if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    };
    // Runs once per visit.
  }, []);

  const welcomeOnce = () => {
    if (!progress.robotWelcomed) update((p) => ({ ...p, robotWelcomed: true }));
  };
  const open = (game: RobotGameId) => {
    welcomeOnce();
    onOpen(game);
  };
  const openWorkshop = () => {
    welcomeOnce();
    onWorkshop();
  };

  const tapComing = (name: string) => {
    const text = `A ${name} még készül. Ezen még dolgozom!`;
    setNotice(text);
    speak(`${text} Addig játsszunk a Robotúttal!`);
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), NOTICE_MS);
  };

  const levelIdx = pathLevelIndex(progress.pathSolved);
  const sortIdx = sortLevelIndex(progress.sortSolved);
  const scaleIdx = scaleLevelIndex(progress.scaleSolved);
  const seqIdx = seqLevelIndex(progress.seqSolved);
  const workshopBadge = newFriend(progress) ? 'Barát jött!' : secondRobotNew(progress) ? 'Új robot!' : canBuyAnything(progress) ? 'Építhetsz!' : null;

  return (
    <div className="screen screen--home screen--robot-home world--robot">
      <div className="hill floor" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <KalandkaIcon size={56} />
          <div className="brand__text">
            <KalandkaWordmark size={phone ? 15 : 22} accent="#0C6E6A" />
            <div className="brand__world">Robotműhely</div>
          </div>
        </div>
        <div className="topbar__right">
          {shared && <KidChip onSwitch={onSwitch} />}
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
            <RoundButton label="Meghallgatom újra" tint="blue" onClick={() => (notice ? speak(notice) : sayIntro())}>
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

        <button type="button" className="plot plot--play" onClick={() => open('sort')} aria-label="Válogatógép – válogasd szét a darabokat">
          {progress.sortSolved === 0 ? <span className="plot__badge">Új gép!</span> : <span className="plot__badge">{sortIdx + 1}. szint</span>}
          <SortArt />
          <span className="plot__soil plot__soil--floor" />
          <span className="plot__name">Válogatógép</span>
          <span className="plot__cta">
            <PlayIcon /> Játék
          </span>
        </button>

        <button type="button" className="plot plot--play" onClick={() => open('scale')} aria-label="Mérleg – melyik a nehezebb?">
          {progress.scaleSolved === 0 ? <span className="plot__badge">Új gép!</span> : <span className="plot__badge">{scaleIdx + 1}. szint</span>}
          <ScaleArt />
          <span className="plot__soil plot__soil--floor" />
          <span className="plot__name">Mérleg</span>
          <span className="plot__cta">
            <PlayIcon /> Játék
          </span>
        </button>

        <button type="button" className="plot plot--play" onClick={() => open('seq')} aria-label="Mintagép – mi jön a sorban?">
          {progress.seqSolved === 0 ? <span className="plot__badge">Új gép!</span> : <span className="plot__badge">{seqIdx + 1}. szint</span>}
          <SeqArt />
          <span className="plot__soil plot__soil--floor" />
          <span className="plot__name">Mintagép</span>
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
            <span className="plot__skill">
              {m.skill}
              <span className="plot__soon"> · hamarosan</span>
            </span>
          </button>
        ))}

        {/* The reward tile always closes the row of eight, as Kiskertem does in Számkertész. */}
        <RewardPlot
          className="plot--builder"
          label="Robotépítő – építsd meg a saját robotodat"
          name="Robotépítő"
          art={<MyRobot progress={progress} width={92} />}
          icon={<Bolt size={30} />}
          count={balance}
          unit="csavar"
          cta="Építés"
          badge={workshopBadge}
          onClick={openWorkshop}
        />
      </div>

      {sticker && <StickerPop key={sticker.id} sticker={sticker} seen={progress.stickersSeen} onDone={() => update((p) => markStickerSeen(p, sticker.id))} />}

      <div className="garden shelf" aria-label={`A polcod: a robotod${friends.length ? ` és ${friends.length} barátja` : ''}`}>
        <span className="garden__flower shelf__robot">
          <MyRobot progress={progress} width={70} />
        </span>
        {friends.map((f) => (
          <span key={f.id} className="garden__flower shelf__friend">
            <FriendArt id={f.id} width={76} />
          </span>
        ))}
        {friends.length === 0 && <p className="garden__empty shelf__hint">Ő a te robotod. A csavarjaidból építhetsz rá!</p>}
      </div>
    </div>
  );
}

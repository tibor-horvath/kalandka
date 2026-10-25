import { useEffect, useRef, useState } from 'react';
import { KidChip, MapButton, ParentsButton, PrintButton, VoiceButton } from '../../components/hub';
import { Island, useLeave, type Place, type RewardPlace } from '../../components/island';
import { Bolt, CodeArt, Gear, MirrorArt, PathArt, ScaleArt, SeqArt, SortArt } from '../../components/robot';
import { MyRobot } from '../../components/robotParts';
import { useForm } from '../../components/Stage';
import { StickerPop } from '../../components/StickerPop';
import { GuideBubble, KalandkaIcon, KalandkaWordmark, RoundButton, SpeakerIcon } from '../../components/ui';
import { speak } from '../../lib/speech';
import { kidName, useActiveKid, useProfiles } from '../../state/profiles';
import { ladderOf } from '../../state/ladder';
import { useProgress } from '../../state/progress';
import { markStickerSeen, newStickers } from '../../state/rewards';
import { boltBalance, canBuyAnything, newFriend, secondRobotNew } from '../../state/robotParts';

export type RobotGameId = 'path' | 'sort' | 'scale' | 'seq' | 'mirror' | 'code';

/** Machines Csavar is still building: shown asleep, each with what it will teach. With the games they fill seven places, so Robotépítő is the eighth. */
const COMING = [
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
  onPrint,
  onSwitch,
  onMap
}: {
  onOpen: (game: RobotGameId) => void;
  onWorkshop: () => void;
  onParents: () => void;
  onPrint: () => void;
  onSwitch: () => void;
  onMap: () => void;
}) {
  const { progress, update } = useProgress();
  const { profiles } = useProfiles();
  const kid = useActiveKid();
  const phone = useForm() !== 'tablet';
  const [leaving, leaveForMap] = useLeave(onMap);
  const shared = profiles.kids.length > 1;
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | null>(null);
  // A Robotút sticker earned in the game is celebrated here, one at a time.
  const sticker = newStickers(progress, 'robot')[0] ?? null;
  const balance = boltBalance(progress);

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

  const levelIdx = ladderOf(progress, 'path').level;
  const sortIdx = ladderOf(progress, 'sort').level;
  const scaleIdx = ladderOf(progress, 'scale').level;
  const seqIdx = ladderOf(progress, 'seq').level;
  const mirrorIdx = ladderOf(progress, 'mirror').level;
  const codeIdx = ladderOf(progress, 'code').level;
  const workshopBadge = newFriend(progress) ? 'Barát jött!' : secondRobotNew(progress) ? 'Új robot!' : canBuyAnything(progress) ? 'Építhetsz!' : null;
  /** A machine's badge: new until first solved, then the level the child is on. */
  const machineBadge = (solved: number, level: number) => (solved === 0 ? 'Új gép!' : `${level + 1}. szint`);

  const places: Place[] = [
    {
      id: 'path',
      name: 'Robotút',
      label: 'Robotút – programozd a robotot',
      badge: progress.pathSolved === 0 ? 'Kezdd itt!' : `${levelIdx + 1}. szint`,
      start: progress.pathSolved === 0,
      art: <PathArt />,
      onOpen: () => open('path')
    },
    { id: 'sort', name: 'Válogatógép', label: 'Válogatógép – válogasd szét a darabokat', badge: machineBadge(progress.sortSolved, sortIdx), art: <SortArt />, onOpen: () => open('sort') },
    { id: 'scale', name: 'Mérleg', label: 'Mérleg – melyik a nehezebb?', badge: machineBadge(progress.scaleSolved, scaleIdx), art: <ScaleArt />, onOpen: () => open('scale') },
    { id: 'seq', name: 'Mintagép', label: 'Mintagép – mi jön a sorban?', badge: machineBadge(progress.seqSolved, seqIdx), art: <SeqArt />, onOpen: () => open('seq') },
    { id: 'mirror', name: 'Tükörgép', label: 'Tükörgép – hol a tükörkép?', badge: machineBadge(progress.mirrorSolved, mirrorIdx), art: <MirrorArt />, onOpen: () => open('mirror') },
    { id: 'code', name: 'Kódzár', label: 'Kódzár – nyisd ki a ládát a kóddal', badge: machineBadge(progress.codeSolved, codeIdx), art: <CodeArt />, onOpen: () => open('code') },
    ...COMING.map((m) => ({
      id: m.name,
      name: m.name,
      label: `${m.name}: még készül`,
      art: <Gear />,
      locked: {
        skill: (
          <>
            {m.skill}
            <span className="plot__soon"> · hamarosan</span>
          </>
        ),
        hint: 'hamarosan',
        onTap: () => tapComing(m.name)
      }
    }))
  ];
  const reward: RewardPlace = {
    label: 'Robotépítő – építsd meg a saját robotodat',
    name: 'Robotépítő',
    art: <MyRobot progress={progress} width={92} />,
    icon: <Bolt size={30} />,
    count: balance,
    unit: 'csavar',
    badge: workshopBadge,
    onClick: openWorkshop
  };

  return (
    <div className="screen screen--home screen--robot-home world--robot screen--island">
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
          <MapButton onClick={leaveForMap} />
          <VoiceButton guide="Csavar" />
          <PrintButton onClick={onPrint} />
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

      <Island world="robot" places={places} reward={reward} leaving={leaving} />

      {sticker && <StickerPop key={sticker.id} sticker={sticker} seen={progress.stickersSeen} onDone={() => update((p) => markStickerSeen(p, sticker.id))} />}
    </div>
  );
}

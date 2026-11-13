import { useEffect, type ReactNode } from 'react';
import type { Badge, Place, RewardPlace } from '../../../components/island';
import { Bolt, CodeArt, FixArt, MirrorArt, PathArt, ScaleArt, SeqArt, SortArt } from '../art';
import { MyRobot } from '../parts';
import { WorldHub, type HubActions } from '../../../components/WorldHub';
import { speak } from '../../../lib/speech';
import { gamesIn, isLadderGame, solvedOf, type GameId } from '../../../state/games';
import { ladderOf } from '../../../state/ladder';
import { kidName, useActiveKid, useProfiles } from '../../../state/profiles';
import { useProgress } from '../../../state/progress';
import { newStickers } from '../../../state/stickers';
import { boltBalance, canBuyAnything, newFriend, secondRobotNew } from '../../../state/robotParts';

/** The greeting without a name: one child on the device, or an online voice. */
const HELLO = 'Szia! Jó, hogy itt vagy a műhelyben!';

/** Each machine's place on the island: its accessible name and picture. */
const TILES: Partial<Record<GameId, { label: string; art: ReactNode }>> = {
  path: { label: 'Robotút – programozd a robotot', art: <PathArt /> },
  sort: { label: 'Válogatógép – válogasd szét a darabokat', art: <SortArt /> },
  scale: { label: 'Mérleg – melyik a nehezebb?', art: <ScaleArt /> },
  seq: { label: 'Mintagép – mi jön a sorban?', art: <SeqArt /> },
  mirror: { label: 'Tükörgép – hol a tükörkép?', art: <MirrorArt /> },
  code: { label: 'Kódzár – nyisd ki a ládát a kóddal', art: <CodeArt /> },
  fix: { label: 'Hibavadász – keresd meg a hibás kártyát', art: <FixArt /> }
};

/** Robotműhely: Csavar's workshop, the second Kalandka world, for the bigger ones. */
export function RobotHome({ onOpen, onReward, ...actions }: HubActions & { onOpen: (game: GameId) => void; onReward: () => void }) {
  const { progress, update } = useProgress();
  const { profiles } = useProfiles();
  const kid = useActiveKid();
  const shared = profiles.kids.length > 1;
  // A sticker earned in a game is celebrated here, one at a time.
  const sticker = newStickers(progress, 'robot')[0] ?? null;

  // Aloud with an online voice Csavar leaves the name out: it would leave the device.
  const hello = shared ? `Szia, ${kidName(kid)}! Jó, hogy itt vagy a műhelyben!` : HELLO;
  const greeting = progress.robotWelcomed ? hello : 'Szia, én Csavar vagyok!';
  const question = progress.robotWelcomed ? 'Melyik gépet indítjuk?' : 'Itt robotokat programozunk!';
  const intro = progress.robotWelcomed ? `${greeting} ${question}` : 'Szia, én Csavar vagyok, a műhely robotja! Itt robotokat programozunk. Kezdjük a Robotúttal!';
  const sayIntro = () => speak(intro, { online: progress.robotWelcomed ? `${HELLO} ${question}` : intro });

  useEffect(() => {
    if (!sticker) sayIntro();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Runs once per visit.
  }, []);

  const welcomeOnce = () => {
    if (!progress.robotWelcomed) update((p) => ({ ...p, robotWelcomed: true }));
  };
  const open = (game: GameId) => {
    welcomeOnce();
    if (!progress.robotOpened.includes(game)) update((p) => ({ ...p, robotOpened: [...p.robotOpened, game] }));
    onOpen(game);
  };
  const openWorkshop = () => {
    welcomeOnce();
    onReward();
  };

  // The first machine is where a new child starts, until first solved; the others are new until first opened, then show their level.
  const places: Place[] = gamesIn('robot').map(({ id, name }, i) => {
    const fresh = solvedOf(progress, id) === 0;
    const unopened = fresh && !progress.robotOpened.includes(id);
    const level = isLadderGame(id) ? ladderOf(progress, id).level : 0;
    const badge: Badge = i === 0 && fresh ? { text: 'Kezdd itt!', kind: 'new' } : unopened ? { text: 'Új gép!', kind: 'new' } : { text: `${level + 1}. szint`, kind: 'level' };
    return { id, name, label: TILES[id]!.label, badge, start: i === 0 && fresh, art: TILES[id]!.art, onOpen: () => open(id) };
  });
  const reward: RewardPlace = {
    label: 'Robotépítő – építsd meg a saját robotodat',
    name: 'Robotépítő',
    art: <MyRobot progress={progress} width={92} />,
    icon: <Bolt size={30} />,
    count: boltBalance(progress),
    unit: 'csavar',
    badge: newFriend(progress) ? 'Barát jött!' : secondRobotNew(progress) ? 'Új robot!' : canBuyAnything(progress) ? 'Építhetsz!' : null,
    onClick: openWorkshop
  };

  return <WorldHub world="robot" places={places} reward={reward} bubble={{ kicker: greeting, title: question, mood: 'cheer' }} onReplay={sayIntro} sticker={sticker} {...actions} />;
}

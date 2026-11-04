import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { useLandingRoute } from './app/route';
import { useAudioSettings, useUpdateWhenIdle } from './app/useDevice';
import { useScreenTime } from './app/useScreenTime';
import type { KidDraft } from './components/KidFields';
import { Oops } from './components/Oops';
import { PageMotion } from './components/PageMotion';
import type { DoorPlace } from './components/Door';
import type { PlaceReturn } from './components/WorldHub';
import { Stage } from './components/Stage';
import { stopSpeaking } from './lib/speech';
import { readLink } from './print/link';
import { Album } from './screens/Album';
import { GAME_SCREENS } from './screens/gameScreens';
import { Garden } from './screens/Garden';
import { Home } from './screens/Home';
import { Landing } from './screens/Landing';
import { Gate } from './screens/parents/Gate';
import type { ParentStart } from './screens/parents/ParentArea';
import { Picker } from './screens/Picker';
import { Rest, TimeBanner } from './screens/Rest';
import { WorldMap } from './screens/WorldMap';
import { RobotHome } from './screens/robot/RobotHome';
import { Workshop } from './screens/robot/Workshop';
import { GAMES, isGameId, roundOf, solvedOf, type GameId } from './state/games';
import { ProfilesProvider, editKid, firstKid, hasSave, progressOf, setActive, useProfiles } from './state/profiles';
import { useProgress } from './state/progress';
import { WARN_SECONDS } from './state/screenTime';
import { WORLDS, currentWorld, type WorldId } from './state/worlds';

/**
 * 'home' is the current world's home screen. The Kalandka map, each world's reward place (the Kiskert,
 * Robotépítő) and the sticker album sit beside it: no task runs there.
 */
type Screen = 'home' | 'map' | 'garden' | 'workshop' | 'album' | GameId;
/** 'print' is the printable sheets, opened without the gate; like the parents' corner it pauses the play clock. */
type Parents = 'closed' | 'gate' | 'open' | 'print';

// Only grown-ups open it, so it loads on its own; the gate starts the download, so it is usually there before the answer is.
const loadParentArea = () => import('./screens/parents/ParentArea');
const ParentArea = lazy(async () => ({ default: (await loadParentArea()).ParentArea }));
const PrintArea = lazy(async () => ({ default: (await import('./screens/PrintArea')).PrintArea }));
const Answers = lazy(async () => ({ default: (await import('./screens/Answers')).Answers }));

/** Each world's home screen, and the screen of its reward place. */
const HUBS = { garden: Home, robot: RobotHome } as const;
const REWARD_SCREEN: Record<WorldId, 'garden' | 'workshop'> = { garden: 'garden', robot: 'workshop' };

/** Screens a child rests on when time is up, and where an update may reload the app. */
function isHub(s: Screen): boolean {
  return s === 'home' || s === 'map';
}

/** The world a screen belongs to, and so whose guide talks there; the map belongs to none (Csepi talks). */
function worldOfScreen(s: Screen, home: WorldId, album: WorldId): WorldId | null {
  if (isGameId(s)) return GAMES[s].world;
  if (s === 'garden') return 'garden';
  if (s === 'workshop') return 'robot';
  if (s === 'album') return album;
  return s === 'home' ? home : null;
}

/** Leaving a place (ms): its play sinks away before the island's door closes back into the place. */
const SETTLE_MS = 200;

/** How deep a screen sits, so moving deeper slides the new page in from the right and going back from the left. */
function depthOf(s: Screen): number {
  if (s === 'map') return 0;
  if (s === 'home') return 1;
  if (s === 'album') return 3;
  return 2;
}

function Game() {
  const { progress, update } = useProgress();
  const { profiles, change } = useProfiles();
  // An older save may hold only the unnamed placeholder, which counts as no child yet.
  const named = hasSave() && profiles.kids.some((k) => k.name.trim() !== '');
  const route = useLandingRoute(named);
  // "Ki játszik?" comes first on a shared device, unless parents chose to continue with the last child.
  const [picking, setPicking] = useState(() => profiles.kids.length > 1 && profiles.askOnStart);
  // Without the picker, a child who has never chosen a world starts on the map, like after picking.
  const [screen, setScreen] = useState<Screen>(() => (picking || progress.world ? 'home' : 'map'));
  const [parents, setParents] = useState<Parents>('closed');
  /** The world whose reward place opened the sticker album, and so which page it opens on. */
  const [albumWorld, setAlbumWorld] = useState<WorldId>('garden');
  const [parentStart, setParentStart] = useState<ParentStart>('overview');
  const showPicker = picking && profiles.kids.length > 1;
  const inParents = parents !== 'closed';
  const world = currentWorld(progress);

  /** The place just opened from the island, and a game's solved count then, so coming back knows if a task was solved. */
  const [door, setDoor] = useState<{ place: DoorPlace; solved: number } | null>(null);
  /** Coming back from a place: the island closes its door into it. */
  const [back, setBack] = useState<PlaceReturn | null>(null);
  const [settling, setSettling] = useState(false);
  const settleTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    },
    []
  );

  const go = (s: Screen) => {
    stopSpeaking();
    if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    setSettling(false);
    setDoor(null);
    setBack(null);
    setScreen(s);
  };
  const openPlace = (place: DoorPlace) => {
    go(place);
    setDoor({ place, solved: isGameId(place) ? solvedOf(progress, place) : 0 });
  };
  const leavePlace = (place: DoorPlace) => {
    if (settling) return;
    const solved = isGameId(place) && door?.place === place && solvedOf(progress, place) > door.solved;
    const finish = () => {
      go('home');
      setBack({ place, solved });
    };
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }
    stopSpeaking();
    setSettling(true);
    settleTimer.current = window.setTimeout(finish, SETTLE_MS);
  };

  useAudioSettings(progress, worldOfScreen(screen, world, albumWorld) === 'robot' ? 'robot' : 'csepi');
  useUpdateWhenIdle(isHub(screen) && !inParents);
  const { remaining, evening, timeUp, resting } = useScreenTime(
    {
      screen,
      round: isGameId(screen) ? roundOf(progress, screen) : null,
      atHome: screen === 'home',
      atHub: isHub(screen),
      away: route.landing || showPicker,
      paused: inParents
    },
    profiles.activeId,
    () => go('home')
  );

  useEffect(() => {
    document.title = route.landing ? 'Kalandka' : `Kalandka – ${WORLDS.find((w) => w.id === world)!.name}`;
  }, [world, route.landing]);

  const openGate = (start: ParentStart = 'overview') => {
    setParentStart(start);
    setParents('gate');
    void loadParentArea();
  };
  const closeParents = () => setParents('closed');
  const openPrint = () => {
    stopSpeaking();
    setParents('print');
  };
  const switchKid = () => {
    stopSpeaking();
    setPicking(true);
    setScreen('home');
  };
  const pick = (id: string) => {
    stopSpeaking();
    change((s) => setActive(s, id));
    setPicking(false);
    // A child who has never chosen a world starts on the map; the others go straight back to their last one.
    setScreen(progressOf(profiles, id).world ? 'home' : 'map');
  };
  const start = (kid: KidDraft) => {
    // The first child named on the landing page is saved now, so the landing page does not come back.
    // An unnamed child already saved keeps their progress and just gets the name.
    change((s) => (hasSave() ? editKid(s, s.activeId, kid) : firstKid(s, kid)));
    route.openGame();
  };
  const openLanding = () => {
    stopSpeaking();
    setParents('closed');
    route.openLanding();
  };
  const openAlbum = (from: WorldId) => {
    setAlbumWorld(from);
    go('album');
  };
  const pickWorld = (w: WorldId) => {
    update((p) => ({ ...p, world: w }));
    go('home');
  };

  if (route.landing) return <Landing onStart={start} onResume={named ? route.openGame : undefined} />;

  const Hub = HUBS[world];
  const game = isGameId(screen) ? screen : null;
  const GameScreen = game ? GAME_SCREENS[game] : null;

  return (
    <Stage>
      <PageMotion
        page={screen === 'home' ? (showPicker ? 'picker' : `home-${world}`) : screen}
        depth={showPicker ? 0 : depthOf(screen)}
        door={door?.place === screen || (screen === 'home' && back !== null)}
        settling={settling}
      >
        {screen === 'home' && showPicker && <Picker onPick={pick} onAdd={() => openGate('add')} onParents={() => openGate()} onPrint={openPrint} />}
        {screen === 'home' && !showPicker && (
          <Hub
            key={profiles.activeId}
            onOpen={openPlace}
            onReward={() => openPlace(REWARD_SCREEN[world])}
            onParents={() => openGate()}
            onPrint={openPrint}
            onSwitch={switchKid}
            onMap={() => go('map')}
            back={back}
          />
        )}
        {screen === 'map' && !showPicker && <WorldMap onPick={pickWorld} onParents={() => openGate()} />}
        {screen === 'garden' && <Garden onBack={() => leavePlace('garden')} onAlbum={() => openAlbum('garden')} />}
        {screen === 'workshop' && <Workshop onBack={() => leavePlace('workshop')} onAlbum={() => openAlbum('robot')} />}
        {screen === 'album' && <Album key={albumWorld} world={albumWorld} onBack={() => go(REWARD_SCREEN[albumWorld])} />}
        {game && GameScreen && <GameScreen key={roundOf(progress, game)} onBack={() => leavePlace(game)} />}
      </PageMotion>
      {!resting && !inParents && progress.warnBefore && remaining <= WARN_SECONDS && <TimeBanner remaining={remaining} />}
      {!resting && !inParents && timeUp && !progress.warnBefore && <TimeBanner remaining={0} />}
      {resting && !inParents && (
        <Rest evening={evening && remaining > 0} onParents={() => openGate()} onSwitch={profiles.kids.length > 1 && !evening ? switchKid : undefined} />
      )}
      {parents === 'gate' && <Gate onPass={() => setParents('open')} onCancel={closeParents} />}
      {parents === 'open' && (
        <Suspense fallback={null}>
          <ParentArea start={parentStart} onClose={closeParents} onAbout={openLanding} />
        </Suspense>
      )}
      {parents === 'print' && (
        <Suspense fallback={null}>
          <PrintArea onClose={closeParents} />
        </Suspense>
      )}
    </Stage>
  );
}

export default function App() {
  const [hash, setHash] = useState(() => window.location.hash);
  const link = useMemo(() => readLink(hash), [hash]);

  // Scanning a second sheet can land in the page that is already open.
  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const closeAnswers = () => {
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
    setHash('');
  };

  return (
    <Oops>
      {link ? (
        <div className="ps-answers-page">
          <Suspense fallback={null}>
            <Answers link={link} onClose={closeAnswers} />
          </Suspense>
        </div>
      ) : (
        <ProfilesProvider>
          <Game />
        </ProfilesProvider>
      )}
    </Oops>
  );
}

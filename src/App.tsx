import { Suspense, lazy, startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { resumed } from './app/resume';
import { useBackLayers, useLandingRoute, type BackLayer } from './app/route';
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
import { Landing } from './screens/Landing';
import { Gate } from './screens/parents/Gate';
import type { ParentStart } from './screens/parents/ParentArea';
import { Album, Picker, Rest, ReviewDone, TimeBanner, WorldMap, loadPlayScreens } from './screens/play';
import { ReviewContext } from './components/ladderRound';
import { buildReview, type ReviewTask } from './state/review';
import { GAME_SCREENS, WORLD_SCREENS } from './worlds/screens';
import { GAMES, isGameId, nextRound, roundOf, solvedOf, type GameId } from './state/games';
import { ProfilesProvider, editKid, firstKid, hasSave, progressOf, setActive, useProfiles } from './state/profiles';
import { useProgress } from './state/progress';
import { WARN_SECONDS } from './state/screenTime';
import { WORLDS, currentWorld, worldInfo, type WorldId } from './state/worlds';

/**
 * 'home' is the current world's home screen and 'reward' its reward place (the Kiskert, Robotépítő). The Kalandka
 * map and the sticker album, which shows every world, sit beside them: no task runs there.
 */
type Screen = 'home' | 'map' | 'reward' | 'album' | 'review-done' | GameId;
/**
 * 'print' is the printable sheets, opened without the gate; like the parents' corner it pauses the play clock.
 * 'scan' is Lap beolvasása on its own, straight from the gate.
 */
type Parents = 'closed' | 'gate' | 'open' | 'print' | 'scan';

// Only grown-ups open it, so it loads on its own; the gate starts the download, so it is usually there before the answer is.
const loadParentArea = () => import('./screens/parents/ParentArea');
const ParentArea = lazy(async () => ({ default: (await loadParentArea()).ParentArea }));
const loadScanSheet = () => import('./screens/parents/ScanSheet');
const ScanSheet = lazy(async () => ({ default: (await loadScanSheet()).ScanSheet }));
const PrintArea = lazy(async () => ({ default: (await import('./screens/PrintArea')).PrintArea }));
const Answers = lazy(async () => ({ default: (await import('./screens/Answers')).Answers }));

/** Screens a child rests on when time is up, and where an update may reload the app. */
function isHub(s: Screen): boolean {
  return s === 'home' || s === 'map';
}

/** The world a screen belongs to, and so whose guide talks there; the map belongs to none (Csepi talks). */
function worldOfScreen(s: Screen, home: WorldId, album: WorldId): WorldId | null {
  if (isGameId(s)) return GAMES[s].world;
  if (s === 'album') return album;
  return s === 'home' || s === 'reward' || s === 'review-done' ? home : null;
}

/** Leaving a place (ms): its play sinks away before the island's door closes back into the place. */
const SETTLE_MS = 200;

/** How deep a screen sits, so moving deeper slides the new page in from the right and going back from the left. */
function depthOf(s: Screen): number {
  if (s === 'map') return 0;
  if (s === 'home') return 1;
  return 2;
}

function Game() {
  const { progress, update } = useProgress();
  const { profiles, change } = useProfiles();
  // An older save may hold only the unnamed placeholder, which counts as no child yet.
  const named = hasSave() && profiles.kids.some((k) => k.name.trim() !== '');
  const route = useLandingRoute(named);
  // "Ki játszik?" comes first on a shared device, unless parents chose to continue with the last child
  // or this is a restart after a crash, which goes straight back to the world the child was in.
  const [picking, setPicking] = useState(() => !resumed && profiles.kids.length > 1 && profiles.askOnStart);
  // Without the picker, a child who has never chosen a world starts on the map, like after picking.
  const [screen, setScreen] = useState<Screen>(() => (picking || progress.world ? 'home' : 'map'));
  const [parents, setParents] = useState<Parents>('closed');
  /** The world whose island opened the sticker album, and so which page it opens on. */
  const [albumWorld, setAlbumWorld] = useState<WorldId>(WORLDS[0].id);
  const [parentStart, setParentStart] = useState<ParentStart>('overview');
  /** The gate leads to Lap beolvasása instead of the parents' corner. */
  const [scanGate, setScanGate] = useState(false);
  const showPicker = picking && profiles.kids.length > 1;
  const inParents = parents !== 'closed';
  const world = currentWorld(progress);

  // The worlds' chunks (the garden's too), once the page has loaded and the browser is idle, so they never hold up
  // the first screen; the map rarely waits for them.
  useEffect(() => {
    const preload = () => {
      loadPlayScreens().catch(() => {});
      for (const w of WORLDS) WORLD_SCREENS[w.id].preload?.().catch(() => {});
    };
    // Safari has no requestIdleCallback: a short timeout stands in.
    const idle = 'requestIdleCallback' in window;
    let handle = 0;
    const whenIdle = () => {
      handle = idle ? window.requestIdleCallback(preload, { timeout: 3000 }) : window.setTimeout(preload, 1500);
    };
    if (document.readyState === 'complete') whenIdle();
    else window.addEventListener('load', whenIdle, { once: true });
    return () => {
      window.removeEventListener('load', whenIdle);
      if (idle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, []);

  /** The place just opened from the island, and a game's solved count then, so coming back knows if a task was solved. */
  const [door, setDoor] = useState<{ place: DoorPlace; solved: number } | null>(null);
  /** A Vegyes kör under way: its tasks and the one on screen; kept on its closing card, cleared on the way home. */
  const [review, setReview] = useState<{ world: WorldId; tasks: ReviewTask[]; index: number } | null>(null);
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
    // Only the round's own games and its closing card keep a Vegyes kör going.
    if (!isGameId(s) && s !== 'review-done') setReview(null);
    setScreen(s);
  };
  const openPlace = (place: DoorPlace) => {
    go(place);
    setDoor({ place, solved: isGameId(place) ? solvedOf(progress, place) : 0 });
  };
  const leavePlace = (place: DoorPlace) => {
    if (settling) return;
    const solved = isGameId(place) && door?.place === place && solvedOf(progress, place) > door.solved;
    setReview(null);
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

  // The browser's Back does what the screen's own back button does. The map counts once a world is chosen
  // (Back returns to that world); a first-time child starts there, with nothing to go back to.
  const place: DoorPlace | null = screen === 'reward' || isGameId(screen) ? screen : null;
  const backLayers: BackLayer[] = [];
  if (!route.landing && !showPicker) {
    if (screen === 'map' && progress.world) backLayers.push({ key: 'map', close: () => go('home') });
    if (place && !settling) backLayers.push({ key: place, close: () => leavePlace(place) });
    if (screen === 'album') backLayers.push({ key: 'album', close: () => go('home') });
    if (screen === 'review-done') backLayers.push({ key: 'review-done', close: () => go('home') });
  }
  if (!route.landing && inParents) backLayers.push({ key: parents === 'print' || parents === 'scan' ? parents : 'parents', close: () => setParents('closed') });
  useBackLayers(backLayers);

  // Each guide speaks in their world's voice (see the manifests); on the map Csepi talks.
  const speaking = worldOfScreen(screen, world, albumWorld);
  useAudioSettings(progress, speaking ? worldInfo(speaking).speaker : 'csepi');
  useUpdateWhenIdle(isHub(screen) && !inParents);
  const { remaining, evening, timeUp, resting } = useScreenTime(
    {
      screen,
      round: isGameId(screen) ? roundOf(progress, screen) : null,
      atHome: screen === 'home',
      atHub: isHub(screen),
      away: route.landing || showPicker,
      paused: inParents,
      playing: isGameId(screen) || screen === 'reward'
    },
    profiles.activeId,
    () => go('home')
  );

  useEffect(() => {
    document.title = route.landing ? 'Kalandka' : `Kalandka – ${worldInfo(world).name}`;
  }, [world, route.landing]);

  const openGate = (start: ParentStart = 'overview') => {
    setParentStart(start);
    setScanGate(false);
    setParents('gate');
    void loadParentArea();
  };
  const pickScan = (on: boolean) => {
    setScanGate(on);
    if (on) void loadScanSheet();
  };
  const openScan = () => {
    openGate();
    pickScan(true);
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
  /** Vegyes kör: five tasks from this world's games, one game after another, then the closing card. */
  const startReview = () => {
    const tasks = buildReview(progress, world, Date.now() % 1_000_000_007);
    if (tasks.length === 0) return;
    setReview({ world, tasks, index: 0 });
    openPlace(tasks[0].game);
  };
  const nextReview = () => {
    if (!review) return;
    const { tasks, index } = review;
    // A transition: the solved task stays on screen until the next game's screen is ready, instead of the Suspense
    // fallback (an empty page) showing while a game not yet opened this visit loads. One commit swaps them.
    startTransition(() => {
      // The game moves on to fresh tasks, so the next time it comes up (in the round or on its own) it is a new one.
      update((p) => nextRound(p, tasks[index].game));
      if (index + 1 >= tasks.length) {
        go('review-done');
        return;
      }
      setReview({ ...review, index: index + 1 });
      go(tasks[index + 1].game);
    });
  };
  const pickWorld = (w: WorldId) => {
    update((p) => ({ ...p, world: w }));
    go('home');
  };

  if (route.landing) return <Landing onStart={start} onResume={named ? route.openGame : undefined} />;

  const Hub = WORLD_SCREENS[world].hub;
  const Reward = WORLD_SCREENS[world].reward;
  const game = isGameId(screen) ? screen : null;
  const GameScreen = game ? GAME_SCREENS[game] : null;

  return (
    <Stage>
      <PageMotion
        // A Vegyes kör is one page from its first task to its closing card: a new page would remount the Suspense inside
        // it, and a new boundary shows its fallback (an empty page) while the next game loads, even in a transition.
        page={screen === 'home' ? (showPicker ? 'picker' : `home-${world}`) : review && (isGameId(screen) || screen === 'review-done') ? 'review' : screen}
        depth={showPicker ? 0 : depthOf(screen)}
        door={door?.place === screen || (screen === 'home' && back !== null)}
        settling={settling}
      >
        {/* The workshop's screens wait for their chunk, which is loaded as soon as the app starts (see robot/lazy.ts). */}
        <Suspense fallback={null}>
        {screen === 'home' && showPicker && <Picker onPick={pick} onAdd={() => openGate('add')} onParents={() => openGate()} onPrint={openPrint} onScan={openScan} />}
        {screen === 'home' && !showPicker && (
          <Hub
            key={profiles.activeId}
            onOpen={openPlace}
            onReward={() => openPlace('reward')}
            onParents={() => openGate()}
            onSwitch={switchKid}
            onMap={() => go('map')}
            onAlbum={() => openAlbum(world)}
            onReview={startReview}
            back={back}
          />
        )}
        {screen === 'map' && !showPicker && <WorldMap onPick={pickWorld} onParents={() => openGate()} />}
        {screen === 'reward' && <Reward onBack={() => leavePlace('reward')} />}
        {screen === 'album' && <Album key={albumWorld} world={albumWorld} onBack={() => go('home')} />}
        {game && GameScreen && review?.tasks[review.index]?.game === game ? (
          <ReviewContext.Provider value={{ task: review.tasks[review.index], index: review.index, count: review.tasks.length, onNext: nextReview }}>
            <GameScreen key={`review-${review.index}`} onBack={() => leavePlace(game)} />
          </ReviewContext.Provider>
        ) : (
          game && GameScreen && <GameScreen key={roundOf(progress, game)} onBack={() => leavePlace(game)} />
        )}
        {screen === 'review-done' && review && <ReviewDone world={review.world} tasks={review.tasks} onBack={() => go('home')} />}
        </Suspense>
      </PageMotion>
      {/* Their chunk (see screens/play.ts) is usually in long before the play clock runs out. */}
      <Suspense fallback={null}>
        {!resting && !inParents && progress.warnBefore && remaining <= WARN_SECONDS && <TimeBanner remaining={remaining} />}
        {!resting && !inParents && timeUp && !progress.warnBefore && <TimeBanner remaining={0} />}
        {resting && !inParents && (
          <Rest evening={evening && remaining > 0} onParents={() => openGate()} onScan={openScan} onSwitchTo={profiles.kids.length > 1 && !evening ? pick : undefined} />
        )}
      </Suspense>
      {parents === 'gate' && (
        <Gate
          scan={scanGate}
          onScan={parentStart === 'add' ? undefined : pickScan}
          onPass={() => setParents(scanGate ? 'scan' : 'open')}
          onCancel={closeParents}
        />
      )}
      {/* Adult pages, at the window's own size: outside the scaled stage, like the landing page's sheets. */}
      {parents === 'open' &&
        createPortal(
          <div className="pa-layer">
            <Suspense fallback={null}>
              <ParentArea start={parentStart} onClose={closeParents} onAbout={openLanding} />
            </Suspense>
          </div>,
          document.body
        )}
      {parents === 'scan' &&
        createPortal(
          <div className="pa-layer">
            <Suspense fallback={null}>
              <ScanSheet kidId={profiles.activeId} onBack={closeParents} />
            </Suspense>
          </div>,
          document.body
        )}
      {parents === 'print' &&
        createPortal(
          <div className="pa-layer">
            <Suspense fallback={null}>
              <PrintArea onClose={closeParents} />
            </Suspense>
          </div>,
          document.body
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

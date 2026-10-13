import { useEffect, useRef, useState } from 'react';
import { Stage } from './components/Stage';
import { setSoundEnabled } from './lib/sound';
import { applyUpdate, useUpdateWaiting } from './lib/update';
import { setSpeechEnabled, setSpeechRate, speak, stopSpeaking } from './lib/speech';
import { Add } from './screens/Add';
import { Album } from './screens/Album';
import { Flash } from './screens/Flash';
import { Garden } from './screens/Garden';
import { Home, type GameId } from './screens/Home';
import { Learn } from './screens/Learn';
import { Gate } from './screens/parents/Gate';
import { ParentArea, type ParentStart } from './screens/parents/ParentArea';
import { Patterns } from './screens/Patterns';
import { Picker } from './screens/Picker';
import { Pots } from './screens/Pots';
import { Rest, TimeBanner } from './screens/Rest';
import { Trace } from './screens/Trace';
import { Water } from './screens/Water';
import { ProfilesProvider, setActive, useProfiles } from './state/profiles';
import { useProgress, type Progress } from './state/progress';
import { GRACE_SECONDS, WARN_SECONDS, addPlay, isEveningRest, remainingSeconds, today } from './state/screenTime';

/** The Kiskert and the sticker album sit beside the home screen: no task runs there. */
type Screen = 'home' | 'garden' | 'album' | GameId;
type Parents = 'closed' | 'gate' | 'open';

/** The play clock ticks in steps of this many seconds. */
const TICK_SECONDS = 5;
/** Pause on the home screen before a waiting update reloads the app. */
const UPDATE_DELAY_MS = 2000;
/** Each game's round counter goes up when the child moves on to the next task. */
const ROUND_KEY = {
  learn: 'learnRound',
  water: 'waterRound',
  patterns: 'patternRound',
  flash: 'flashRound',
  add: 'addRound',
  trace: 'traceRound',
  pots: 'potsRound'
} as const satisfies Record<GameId, keyof Progress>;

function isGame(s: Screen): s is GameId {
  return s in ROUND_KEY;
}

function Game() {
  const { progress, update } = useProgress();
  const { profiles, change } = useProfiles();
  const [screen, setScreen] = useState<Screen>('home');
  const [parents, setParents] = useState<Parents>('closed');
  const [parentStart, setParentStart] = useState<ParentStart>('overview');
  // "Ki játszik?" comes first on a shared device, unless parents chose to continue with the last child.
  const [picking, setPicking] = useState(() => profiles.kids.length > 1 && profiles.askOnStart);
  const showPicker = picking && profiles.kids.length > 1;
  const warned = useRef<string | null>(null);
  // Re-check the evening rest every minute even when nothing else changes.
  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => setSpeechEnabled(progress.voice), [progress.voice]);
  useEffect(() => setSpeechRate(progress.voiceRate), [progress.voiceRate]);
  useEffect(() => setSoundEnabled(progress.sounds), [progress.sounds]);
  useEffect(() => {
    const id = window.setInterval(() => setClock(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const go = (s: Screen) => {
    stopSpeaking();
    setScreen(s);
  };

  const day = today();
  const remaining = remainingSeconds(progress, day);
  const evening = isEveningRest(progress, new Date(clock));
  const timeUp = remaining <= 0 || evening;
  const resting = timeUp && screen === 'home' && !showPicker;
  const inParents = parents !== 'closed';
  const updateWaiting = useUpdateWaiting();

  // A downloaded update reloads the app only on the home screen, after a short pause,
  // so it never cuts into a game or the parents' corner. Opening a game first cancels it.
  useEffect(() => {
    if (!updateWaiting || screen !== 'home' || inParents) return;
    const id = window.setTimeout(applyUpdate, UPDATE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [updateWaiting, screen, inParents]);

  // Play clock: only while the app is on screen, a child is chosen, the parents' area is closed and the child is not resting.
  useEffect(() => {
    if (inParents || resting || showPicker) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') update((p) => addPlay(p, TICK_SECONDS, today()));
    }, TICK_SECONDS * 1000);
    return () => window.clearInterval(id);
  }, [inParents, resting, showPicker, update]);

  // A gentle spoken warning once per day and child, two minutes before the end (parents can switch it off).
  useEffect(() => {
    const key = `${profiles.activeId} ${day}`;
    if (progress.warnBefore && remaining > 0 && remaining <= WARN_SECONDS && warned.current !== key) {
      warned.current = key;
      speak('Mindjárt pihenünk. Még két perc játék!', { queue: true });
    }
  }, [remaining, day, progress.warnBefore, profiles.activeId]);

  // Time is up in the middle of a task: finish it if parents allow, then home to rest.
  // The grace ends at a wall-clock deadline, checked every second and on return to the screen,
  // because a sleeping tablet suspends timers and a single timeout could drift forever.
  useEffect(() => {
    if (!timeUp || screen === 'home' || inParents) return;
    if (!progress.graceToFinish || !isGame(screen)) {
      go('home');
      return;
    }
    speak('Lejárt a mai játékidő. Fejezd be ezt a feladatot!', { queue: true });
    const deadline = Date.now() + GRACE_SECONDS * 1000;
    const check = () => {
      if (Date.now() >= deadline) go('home');
    };
    const id = window.setInterval(check, 1000);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', check);
    };
  }, [timeUp, screen, inParents, progress.graceToFinish]);

  // "Ez az utolsó feladat!": once the task in progress is done, the next one does not start.
  const round = isGame(screen) ? progress[ROUND_KEY[screen]] : null;
  const graceRound = useRef<number | null>(null);
  useEffect(() => {
    if (!timeUp || round === null || inParents) {
      graceRound.current = null;
      return;
    }
    if (graceRound.current === null) graceRound.current = round;
    else if (round !== graceRound.current) go('home');
  }, [timeUp, round, inParents]);

  const openGate = (start: ParentStart = 'overview') => {
    setParentStart(start);
    setParents('gate');
  };
  const closeParents = () => setParents('closed');
  const switchKid = () => {
    stopSpeaking();
    setPicking(true);
  };
  const pick = (id: string) => {
    stopSpeaking();
    change((s) => setActive(s, id));
    setPicking(false);
  };

  return (
    <Stage>
      {screen === 'home' && showPicker && <Picker onPick={pick} onAdd={() => openGate('add')} onParents={() => openGate()} />}
      {screen === 'home' && !showPicker && <Home key={profiles.activeId} onOpen={go} onGarden={() => go('garden')} onParents={() => openGate()} onSwitch={switchKid} />}
      {screen === 'garden' && <Garden onBack={() => go('home')} onAlbum={() => go('album')} />}
      {screen === 'album' && <Album onBack={() => go('garden')} />}
      {screen === 'learn' && <Learn key={progress.learnRound} onBack={() => go('home')} />}
      {screen === 'water' && <Water onBack={() => go('home')} />}
      {screen === 'patterns' && <Patterns onBack={() => go('home')} />}
      {screen === 'flash' && <Flash key={progress.flashRound} onBack={() => go('home')} />}
      {screen === 'add' && <Add key={progress.addRound} onBack={() => go('home')} />}
      {screen === 'trace' && <Trace key={progress.traceRound} onBack={() => go('home')} />}
      {screen === 'pots' && <Pots key={progress.potsRound} onBack={() => go('home')} />}
      {!resting && !inParents && progress.warnBefore && remaining <= WARN_SECONDS && <TimeBanner remaining={remaining} />}
      {!resting && !inParents && timeUp && !progress.warnBefore && <TimeBanner remaining={0} />}
      {resting && !inParents && (
        <Rest evening={evening && remaining > 0} onParents={() => openGate()} onSwitch={profiles.kids.length > 1 && !evening ? switchKid : undefined} />
      )}
      {parents === 'gate' && <Gate onPass={() => setParents('open')} onCancel={closeParents} />}
      {parents === 'open' && <ParentArea start={parentStart} onClose={closeParents} />}
    </Stage>
  );
}

export default function App() {
  return (
    <ProfilesProvider>
      <Game />
    </ProfilesProvider>
  );
}

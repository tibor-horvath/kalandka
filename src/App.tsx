import { useEffect, useRef, useState } from 'react';
import { Stage } from './components/Stage';
import { setSoundEnabled } from './lib/sound';
import { applyUpdate, useUpdateWaiting } from './lib/update';
import { setSpeechEnabled, setSpeechRate, speak, stopSpeaking } from './lib/speech';
import { Add } from './screens/Add';
import { Flash } from './screens/Flash';
import { Home, type GameId } from './screens/Home';
import { Learn } from './screens/Learn';
import { Gate } from './screens/parents/Gate';
import { ParentArea } from './screens/parents/ParentArea';
import { Patterns } from './screens/Patterns';
import { Rest, TimeBanner } from './screens/Rest';
import { Trace } from './screens/Trace';
import { Water } from './screens/Water';
import { ProgressProvider, useProgress, type Progress } from './state/progress';
import { GRACE_SECONDS, WARN_SECONDS, addPlay, isEveningRest, remainingSeconds, today } from './state/screenTime';

type Screen = 'home' | GameId;
type Parents = 'closed' | 'gate' | 'open';

/**
 * Screens with a phone layout (with the parents' gate and area and the rest screen, which open over them).
 * The other games keep the tablet stage on phones until they get their own phone layout.
 */
const PHONE_SCREENS: Screen[] = ['home', 'water', 'add'];

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
  trace: 'traceRound'
} as const satisfies Record<GameId, keyof Progress>;

function Game() {
  const { progress, update } = useProgress();
  const [screen, setScreen] = useState<Screen>('home');
  const [parents, setParents] = useState<Parents>('closed');
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
  const resting = timeUp && screen === 'home';
  const inParents = parents !== 'closed';
  const updateWaiting = useUpdateWaiting();

  // A downloaded update reloads the app only on the home screen, after a short pause,
  // so it never cuts into a game or the parents' corner. Opening a game first cancels it.
  useEffect(() => {
    if (!updateWaiting || screen !== 'home' || inParents) return;
    const id = window.setTimeout(applyUpdate, UPDATE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [updateWaiting, screen, inParents]);

  // Play clock: only while the app is on screen, the parents' area is closed and the child is not resting.
  useEffect(() => {
    if (inParents || resting) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') update((p) => addPlay(p, TICK_SECONDS, today()));
    }, TICK_SECONDS * 1000);
    return () => window.clearInterval(id);
  }, [inParents, resting, update]);

  // A gentle spoken warning once per day, two minutes before the end (parents can switch it off).
  useEffect(() => {
    if (progress.warnBefore && remaining > 0 && remaining <= WARN_SECONDS && warned.current !== day) {
      warned.current = day;
      speak('Mindjárt pihenünk. Még két perc játék!', { queue: true });
    }
  }, [remaining, day, progress.warnBefore]);

  // Time is up in the middle of a task: finish it if parents allow, then home to rest.
  // The grace ends at a wall-clock deadline, checked every second and on return to the screen,
  // because a sleeping tablet suspends timers and a single timeout could drift forever.
  useEffect(() => {
    if (!timeUp || screen === 'home' || inParents) return;
    if (!progress.graceToFinish) {
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
  const round = screen === 'home' ? null : progress[ROUND_KEY[screen]];
  const graceRound = useRef<number | null>(null);
  useEffect(() => {
    if (!timeUp || round === null || inParents) {
      graceRound.current = null;
      return;
    }
    if (graceRound.current === null) graceRound.current = round;
    else if (round !== graceRound.current) go('home');
  }, [timeUp, round, inParents]);

  const openGate = () => setParents('gate');
  const closeParents = () => setParents('closed');

  return (
    <Stage phone={PHONE_SCREENS.includes(screen)}>
      {screen === 'home' && <Home onOpen={go} onParents={openGate} />}
      {screen === 'learn' && <Learn key={progress.learnRound} onBack={() => go('home')} />}
      {screen === 'water' && <Water onBack={() => go('home')} />}
      {screen === 'patterns' && <Patterns onBack={() => go('home')} />}
      {screen === 'flash' && <Flash key={progress.flashRound} onBack={() => go('home')} />}
      {screen === 'add' && <Add key={progress.addRound} onBack={() => go('home')} />}
      {screen === 'trace' && <Trace key={progress.traceRound} onBack={() => go('home')} />}
      {!resting && !inParents && progress.warnBefore && remaining <= WARN_SECONDS && <TimeBanner remaining={remaining} />}
      {!resting && !inParents && timeUp && !progress.warnBefore && <TimeBanner remaining={0} />}
      {resting && !inParents && <Rest evening={evening && remaining > 0} onParents={openGate} />}
      {parents === 'gate' && <Gate onPass={() => setParents('open')} onCancel={closeParents} />}
      {parents === 'open' && <ParentArea onClose={closeParents} />}
    </Stage>
  );
}

export default function App() {
  return (
    <ProgressProvider>
      <Game />
    </ProgressProvider>
  );
}

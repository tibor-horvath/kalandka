import { useEffect, useRef, useState } from 'react';
import { speak } from '../lib/speech';
import { useProgress } from '../state/progress';
import { GRACE_SECONDS, TICK_SECONDS, WARN_SECONDS, addPlay, isEveningRest, playedIn, remainingSeconds, today } from '../state/screenTime';

interface Where {
  /** The screen on show; moving to another one checks again whether it may stay open. */
  screen: string;
  /** The open game's round; null when no game is open. */
  round: number | null;
  /** On the home screen, where a child rests once time is up. */
  atHome: boolean;
  /** On a screen where no task runs (home or map): time up here means resting. */
  atHub: boolean;
  /** The landing page or the picker is on screen: no child is playing. */
  away: boolean;
  /** The parents' corner or the printable sheets: the clock waits and nobody is sent home. */
  paused: boolean;
  /** A game or a reward place (Kiskertem, Robotépítő) is open: only there does the clock tick. */
  playing: boolean;
}

/**
 * The parents' daily limit and evening rest: the play clock, the spoken warning, and the end of play.
 * When time is up in a task, the child may finish it (if parents allow) and is then sent home by `sendHome`.
 */
export function useScreenTime({ screen, round, atHome, atHub, away, paused, playing }: Where, activeKid: string, sendHome: () => void) {
  const { progress, update } = useProgress();
  // Re-check the evening rest every minute even when nothing else changes.
  const [clock, setClock] = useState(() => Date.now());
  const warned = useRef<string | null>(null);
  const graceRound = useRef<number | null>(null);

  const day = today();
  const remaining = remainingSeconds(progress, day);
  const evening = isEveningRest(progress, new Date(clock));
  const timeUp = remaining <= 0 || evening;
  const resting = timeUp && atHub && !away;

  useEffect(() => {
    const id = window.setInterval(() => setClock(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // Play clock: only while the app is on screen, a game or reward place is open and the parents' area is closed.
  // Choosing where to go (home, map, album) does not count as play. It counts the time that passed, not ticks,
  // so the part of a tick before leaving a game is counted too; a long gap (a sleeping tablet) counts as one tick.
  useEffect(() => {
    if (!playing || away || paused) return;
    let since: number | null = document.visibilityState === 'visible' ? Date.now() : null;
    const count = () => {
      if (since === null) return;
      const { seconds, usedMs } = playedIn(Date.now() - since);
      since += usedMs;
      if (seconds > 0) update((p) => addPlay(p, seconds, today()));
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        since = Date.now();
      } else {
        count();
        since = null;
      }
    };
    const id = window.setInterval(count, TICK_SECONDS * 1000);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
      count();
    };
  }, [playing, away, paused, update]);

  // A gentle spoken warning once per day and child, two minutes before the end (parents can switch it off).
  useEffect(() => {
    const key = `${activeKid} ${day}`;
    if (progress.warnBefore && remaining > 0 && remaining <= WARN_SECONDS && warned.current !== key) {
      warned.current = key;
      speak('Mindjárt pihenünk. Még két perc játék!', { queue: true });
    }
  }, [remaining, day, progress.warnBefore, activeKid]);

  // Time is up in the middle of a task: finish it if parents allow, then home to rest.
  // The grace ends at a wall-clock deadline, checked every second and on return to the screen,
  // because a sleeping tablet suspends timers and a single timeout could drift forever.
  useEffect(() => {
    if (!timeUp || atHome || paused) return;
    if (!progress.graceToFinish || round === null) {
      sendHome();
      return;
    }
    speak('Lejárt a mai játékidő. Fejezd be ezt a feladatot!', { queue: true });
    const deadline = Date.now() + GRACE_SECONDS * 1000;
    const check = () => {
      if (Date.now() >= deadline) sendHome();
    };
    const id = window.setInterval(check, 1000);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', check);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- The screen, not the round: moving on to the next task is handled below.
  }, [timeUp, screen, paused, progress.graceToFinish]);

  // "Ez az utolsó feladat!": once the task in progress is done, the next one does not start.
  useEffect(() => {
    if (!timeUp || round === null || paused) {
      graceRound.current = null;
      return;
    }
    if (graceRound.current === null) graceRound.current = round;
    else if (round !== graceRound.current) sendHome();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- sendHome only calls stable setters; the round is the trigger.
  }, [timeUp, round, paused]);

  return { remaining, evening, timeUp, resting };
}

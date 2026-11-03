import { useEffect, useLayoutEffect } from 'react';
import { setSoundEnabled } from '../lib/sound';
import { setSpeaker, setSpeechEnabled, setSpeechRate, setVoiceChoice, type Speaker } from '../lib/speech';
import { applyUpdate, useUpdateWaiting } from '../lib/update';
import type { Progress } from '../state/progress';

/** Pause on the home screen before a waiting update reloads the app. */
const UPDATE_DELAY_MS = 2000;

/** The child's voice and sound settings, handed to the speech and sound players; `speaker` is who talks now. */
export function useAudioSettings(p: Progress, speaker: Speaker) {
  useEffect(() => setSpeechEnabled(p.voice), [p.voice]);
  useEffect(() => setSpeechRate(p.voiceRate), [p.voiceRate]);
  useEffect(() => setVoiceChoice(p.csepiVoice, p.robotVoice), [p.csepiVoice, p.robotVoice]);
  useEffect(() => setSoundEnabled(p.sounds), [p.sounds]);
  // A layout effect, so the voice is set before the new screen's own effects say their first line.
  useLayoutEffect(() => setSpeaker(speaker), [speaker]);
}

/**
 * A downloaded update reloads the app only while `idle` (on a hub screen, outside the parents' corner),
 * after a short pause, so it never cuts into a game. Leaving the hub first cancels it.
 */
export function useUpdateWhenIdle(idle: boolean) {
  const waiting = useUpdateWaiting();
  useEffect(() => {
    if (!waiting || !idle) return;
    const id = window.setTimeout(applyUpdate, UPDATE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [waiting, idle]);
}

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { speak } from '../lib/speech';
import type { Mood, Tone } from '../lib/types';
import { StuckHint } from './StuckHint';
import { GuideBubble, NextIcon, type GuideId } from './ui';

// What every game screen needs around its play, whichever world it is in: timers that stop when the child leaves,
// the guide's first line when the screen opens, the guide's bubble, and the way on to the next task.

/** One line of a guide: shown in the bubble, spoken aloud (often longer than the text). */
export interface GuideLine {
  text: string;
  speech: string;
  mood: Mood;
  tone: Tone;
}

/** `later(fn, ms)`: runs `fn` after `ms`, unless the screen has closed by then (the child went back). */
export function useLater(): (fn: () => void, ms: number) => void {
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);
  return useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
}

/** Says `speech` once, when the screen opens. App keys a game's screen by its round, so that is once per task. */
export function useSayOnOpen(speech: string): void {
  useEffect(() => {
    speak(speech);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- One round per mount: App keys this screen by round.
  }, []);
}

/** The guide's bubble with its line; `className` wraps it in the screen's own place for it. */
export function GuideSays({ line, guide = 'csepi', className, guideWidth, children }: { line: GuideLine; guide?: GuideId; className?: string; guideWidth?: number; children?: ReactNode }) {
  const bubble = (
    <GuideBubble guide={guide} mood={line.mood} tone={line.tone} csepiWidth={guideWidth}>
      {line.text}
      {children}
    </GuideBubble>
  );
  return className ? <div className={className}>{bubble}</div> : bubble;
}

/** "Következő": on to the next task, once this one is solved. `look` is the world's button style ('robot', 'tower'). */
export function NextButton({ show = true, onNext, label = 'Következő', look }: { show?: boolean; onNext: () => void; label?: ReactNode; look?: string }) {
  if (!show) return null;
  return (
    <button type="button" className={look ? `big-btn big-btn--${look}` : 'big-btn'} onClick={onNext}>
      {label} <NextIcon />
      <StuckHint />
    </button>
  );
}

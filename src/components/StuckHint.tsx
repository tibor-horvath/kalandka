import { useEffect, useState } from 'react';
import { isSpeaking, speak } from '../lib/speech';

/** How long nothing may happen after the way-on button appears before the hand shows where to tap. */
export const STUCK_MS = 6000;
export const SAY_STUCK = 'Koppints a gombra, és mehetünk tovább!';

/**
 * A hand that taps the button once when the child seems stuck, then leaves: a hint, not decoration.
 * Render it inside the button it points at; it mounts with the button. Any tap or key press restarts the wait,
 * a line still being spoken delays it, and it shows at most once per button.
 */
export function StuckHint({ say = SAY_STUCK }: { say?: string }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    let timer = 0;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(fire, STUCK_MS);
    };
    const quiet = () => {
      window.removeEventListener('pointerdown', arm);
      window.removeEventListener('keydown', arm);
    };
    function fire() {
      if (isSpeaking()) return arm();
      quiet();
      setOn(true);
      speak(say);
    }
    window.addEventListener('pointerdown', arm);
    window.addEventListener('keydown', arm);
    arm();
    return () => {
      window.clearTimeout(timer);
      quiet();
    };
  }, [say]);

  if (!on) return null;
  return (
    <span className="tap-hint" aria-hidden="true" onAnimationEnd={(e) => e.target === e.currentTarget && setOn(false)}>
      <span className="tap-hint__ring" />
      <svg viewBox="0 0 24 24" width="64" height="64" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15V4a2 2 0 0 1 4 0v5.5a2 2 0 0 1 3 .5a2 2 0 0 1 4 1z" />
        <path d="M11 9.5V13M14 10v3M18 11v2" fill="none" />
      </svg>
    </span>
  );
}

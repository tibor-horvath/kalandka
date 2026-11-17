import { createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

/** Where a game's help button lands: a slot in GameShell's top bar, beside the replay speaker. */
export const PeekSlot = createContext<HTMLElement | null>(null);

function EyeIcon() {
  return (
    <svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/**
 * A game's "show me" help: one sun-yellow eye, always in the same place in the top bar, whatever it shows
 * (the seeds again, the way, the next key). A child learns one picture instead of a different sentence per game;
 * `label` says what it shows to screen readers. It may be declared anywhere inside the game: it renders into
 * GameShell's slot, so each game keeps its own state and handler.
 */
export function PeekButton({ label, onClick, disabled = false }: { label: string; onClick: () => void; disabled?: boolean }) {
  const slot = useContext(PeekSlot);
  if (!slot) return null;
  return createPortal(
    <button type="button" className="peek-eye" onClick={onClick} disabled={disabled} aria-label={label} title={label}>
      <EyeIcon />
    </button>,
    slot
  );
}

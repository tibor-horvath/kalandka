import type { ReactNode } from 'react';
import type { WorldId } from '../state/worlds';
import { BackIcon, RoundButton } from './ui';
import { WORLD_LOOK } from './worldLook';

/** A world's reward place, empty: what its spot on the island opens into, and closes back from. */
export function PlaceBackdrop({ world }: { world: WorldId }) {
  const look = WORLD_LOOK[world];
  return (
    <div className={`screen screen--place${look.className}`}>
      <div className={look.placeGround} />
    </div>
  );
}

/**
 * The frame of a screen beside the games, where no task runs (a reward place, the sticker album): the top bar
 * with the way back, the title and the screen's own counters on the right. With a world the screen wears its
 * look and ground and the way back names its home; without one (the album, which shows every world) it stays plain.
 */
export function PlaceShell({
  world,
  className,
  title,
  counters,
  onBack,
  children
}: {
  world?: WorldId;
  /** The screen's own classes, after `screen screen--place`. */
  className: string;
  title: ReactNode;
  counters?: ReactNode;
  onBack: () => void;
  children: ReactNode;
}) {
  const look = world ? WORLD_LOOK[world] : null;

  return (
    <div className={`screen screen--place ${className}${look?.className ?? ''}`}>
      {look && <div className={look.placeGround} aria-hidden="true" />}

      <header className="topbar">
        <RoundButton label={look?.back ?? 'Vissza'} onClick={onBack}>
          <BackIcon />
        </RoundButton>
        <h1 className="screen-title">{title}</h1>
        {counters !== undefined && <div className="topbar__right">{counters}</div>}
      </header>

      {children}
    </div>
  );
}

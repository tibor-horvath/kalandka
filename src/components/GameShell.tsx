import type { ReactNode } from 'react';
import { GAMES, type GameId } from '../state/games';
import type { LevelMeterState } from '../state/levelMeter';
import { LevelMeter, type RoundTasks } from './LevelMeter';
import { BackIcon, RoundButton, SpeakerIcon } from './ui';
import { WORLD_LOOK } from './worldLook';

/** Games drawn on another backdrop than their world's own (Locsolás's lawn). */
const OWN_BACKDROP: Partial<Record<GameId, string>> = { water: 'lawn' };

/** A game's empty screen, without its play: what a place on the island opens into, and closes back from. */
export function GameBackdrop({ game }: { game: GameId }) {
  const look = WORLD_LOOK[GAMES[game].world];
  return (
    <div className={`screen${look.className}`}>
      <div className={OWN_BACKDROP[game] ?? look.gameGround} />
    </div>
  );
}

/**
 * Every game's frame: the backdrop and the top bar (back, the level meter on top of the title, replay); a
 * level-up plays in the meter itself. The game's world sets the look; the screen brings only its play.
 * Without a title the meter sits alone between the buttons; `aside` takes the title's place under the
 * meter (Méhkas's sum).
 */
export function GameShell({
  game,
  className,
  title,
  aside,
  meter,
  justSolved,
  tasks,
  onBack,
  onReplay,
  children
}: {
  game: GameId;
  /** The screen's own classes, after `screen`. */
  className: string;
  title?: ReactNode;
  aside?: ReactNode;
  meter: LevelMeterState;
  /** The task was just won: the meter's newest slot fills. */
  justSolved: boolean;
  /** A round of several tasks: where the child is in it, shown as pips in the meter. */
  tasks?: RoundTasks;
  onBack: () => void;
  onReplay: () => void;
  children: ReactNode;
}) {
  const { world } = GAMES[game];
  const look = WORLD_LOOK[world];
  const levelMeter = <LevelMeter meter={meter} world={world} justSolved={justSolved} tasks={tasks} />;
  const replay = (
    <RoundButton label="Meghallgatom újra" onClick={onReplay}>
      <SpeakerIcon />
    </RoundButton>
  );

  return (
    <div className={`screen ${className}${look.className}`}>
      <div className={OWN_BACKDROP[game] ?? look.gameGround} aria-hidden="true" />

      <header className={title !== undefined || aside !== undefined ? 'topbar topbar--meter' : 'topbar'}>
        <RoundButton label={look.back} onClick={onBack}>
          <BackIcon />
        </RoundButton>
        {title !== undefined || aside !== undefined ? (
          <>
            {/* The meter always comes first, on top of the title (or the aside). */}
            <div className="topbar__title">
              {levelMeter}
              {title !== undefined ? <h1 className="screen-title">{title}</h1> : aside}
            </div>
            {replay}
          </>
        ) : (
          <>
            {levelMeter}
            {replay}
          </>
        )}
      </header>

      {children}

    </div>
  );
}

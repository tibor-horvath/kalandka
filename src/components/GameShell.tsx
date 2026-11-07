import type { ReactNode } from 'react';
import { GAMES, type GameId } from '../state/games';
import type { LevelMeterState } from '../state/levelMeter';
import { LevelMeter } from './LevelMeter';
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
 * Every game's frame: the backdrop and the top bar (back, the title with the level meter, replay); a
 * level-up plays in the meter itself. The game's world sets the look; the screen brings only its play.
 * Without a title the meter sits alone between the buttons; `aside` takes the title's place (Méhkas's
 * sum) and moves the meter beside the replay button.
 */
export function GameShell({
  game,
  className,
  title,
  aside,
  meter,
  justSolved,
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
  onBack: () => void;
  onReplay: () => void;
  children: ReactNode;
}) {
  const { world } = GAMES[game];
  const look = WORLD_LOOK[world];
  const levelMeter = <LevelMeter meter={meter} world={world} justSolved={justSolved} />;
  const replay = (
    <RoundButton label="Meghallgatom újra" onClick={onReplay}>
      <SpeakerIcon />
    </RoundButton>
  );

  return (
    <div className={`screen ${className}${look.className}`}>
      <div className={OWN_BACKDROP[game] ?? look.gameGround} aria-hidden="true" />

      <header className={title !== undefined ? 'topbar topbar--meter' : 'topbar'}>
        <RoundButton label={look.back} onClick={onBack}>
          <BackIcon />
        </RoundButton>
        {title !== undefined ? (
          <>
            <div className="topbar__title">
              <h1 className="screen-title">{title}</h1>
              {levelMeter}
            </div>
            {replay}
          </>
        ) : aside !== undefined ? (
          <>
            {aside}
            <div className="topbar__right">
              {levelMeter}
              {replay}
            </div>
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

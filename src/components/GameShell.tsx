import type { ReactNode } from 'react';
import { GAMES, type GameId } from '../state/games';
import type { LevelMeterState } from '../state/levelMeter';
import type { WorldId } from '../state/worlds';
import { LevelMeter, LevelUpCard } from './LevelMeter';
import { BackIcon, RoundButton, SpeakerIcon } from './ui';

const LOOK: Record<WorldId, { back: string; backdrop: string; className: string }> = {
  garden: { back: 'Vissza a kertbe', backdrop: 'meadow', className: '' },
  robot: { back: 'Vissza a műhelybe', backdrop: 'floor', className: ' world--robot' }
};
/** Games drawn on another backdrop than their world's own (Locsolás's lawn). */
const OWN_BACKDROP: Partial<Record<GameId, string>> = { water: 'lawn' };

/** A game's empty screen, without its play: what a place on the island opens into, and closes back from. */
export function GameBackdrop({ game }: { game: GameId }) {
  const look = LOOK[GAMES[game].world];
  return (
    <div className={`screen${look.className}`}>
      <div className={OWN_BACKDROP[game] ?? look.backdrop} />
    </div>
  );
}

/**
 * Every game's frame: the backdrop, the top bar (back, the title with the level meter, replay) and the
 * level-up card between tasks. The game's world sets the look; the screen brings only its play.
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
  levelUp,
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
  levelUp: { open: boolean; finish: () => void };
  onBack: () => void;
  onReplay: () => void;
  children: ReactNode;
}) {
  const { world } = GAMES[game];
  const look = LOOK[world];
  const levelMeter = <LevelMeter meter={meter} world={world} justSolved={justSolved} />;
  const replay = (
    <RoundButton label="Meghallgatom újra" onClick={onReplay}>
      <SpeakerIcon />
    </RoundButton>
  );

  return (
    <div className={`screen ${className}${look.className}`}>
      <div className={OWN_BACKDROP[game] ?? look.backdrop} aria-hidden="true" />

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

      {levelUp.open && <LevelUpCard meter={meter} world={world} onNext={levelUp.finish} />}
    </div>
  );
}

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

/**
 * Every game's frame: the backdrop, the top bar (back, the title with the level meter, replay) and the
 * level-up card between tasks. The game's world sets the look; the screen brings only its play.
 * Without a title the meter sits alone between the buttons; `aside` takes the title's place (Méhkas's
 * sum) and moves the meter beside the replay button.
 */
export function GameShell({
  game,
  className,
  backdrop,
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
  /** Another backdrop than the world's own (Locsolás's lawn). */
  backdrop?: string;
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
      <div className={backdrop ?? look.backdrop} aria-hidden="true" />

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

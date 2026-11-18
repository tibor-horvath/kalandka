import { useEffect, type ReactNode } from 'react';
import { speak } from '../lib/speech';
import type { WorldId } from '../state/worlds';
import { GuideSay } from './GuideSay';
import { useModal } from './Modal';
import { BackIcon, RoundButton } from './ui';

/**
 * A world's store opened from its reward pill (Raktár, Harangtár): the guide's line, the store drawn as the real
 * thing (see StoreRack) and a word on how it works. It only shows; spending happens where things are built.
 */
export function StoreDialog({
  world,
  title,
  back,
  pill,
  line,
  speech,
  note,
  onClose,
  children
}: {
  world: WorldId;
  title: string;
  /** The back button's label: "Vissza a műhelybe". */
  back: string;
  pill: ReactNode;
  line: string;
  speech: string;
  note: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const modal = useModal<HTMLDivElement>(onClose);
  const id = `store-${world}-title`;

  useEffect(() => {
    speak(speech);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Said once per visit.
  }, []);

  return (
    <div ref={modal} className={`pantry store-dialog store-dialog--${world}`} role="dialog" aria-modal="true" aria-labelledby={id}>
      <div className="pantry__card">
        <header className="pantry__top">
          <RoundButton label={back} onClick={onClose}>
            <BackIcon />
          </RoundButton>
          <h2 id={id} className="pantry__title">
            {title}
          </h2>
          {pill}
        </header>
        <GuideSay world={world} mood="cheer" text={line} speech={speech} />
        {children}
        <p className="store-dialog__note">{note}</p>
      </div>
    </div>
  );
}

/** "3 doboz és 4 csavar": a store's tens and ones, for the guide's line. */
export function packsAndOnes(n: number, pack: string, one: string): string {
  return `${Math.floor(n / 10)} ${pack} és ${n % 10} ${one}`;
}

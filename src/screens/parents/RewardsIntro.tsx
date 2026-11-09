import { Modal } from '../../components/Modal';
import { TASKS_PER_REWARD, TASKS_PER_SEED } from '../../state/pod';
import { readKey, writeKey } from '../../lib/storage';
import { Seed } from '../../worlds/garden/art';
import { Bolt } from '../../worlds/robot/art';

// The first time a grown-up opens the parents' corner on this device, one card explains seeds, bolts and
// stickers in three lines, and points to the Jutalmak page for the rest. It belongs to the device, not to
// a child: once dismissed it never comes back.

const KEY = 'kalandka.rewardsIntro.v1';

/** Not seen yet on this device. Blocked storage could not remember a dismissal, so it never shows there. */
export function rewardsIntroDue(): boolean {
  return readKey(KEY) === null;
}

/** Seen: it does not come back on this device. */
export function dismissRewardsIntro(): void {
  writeKey(KEY, '1');
}

/** Escape is the parents' corner's to handle (it closes this card first, then the corner), so the card takes none of its own. */
export function RewardsIntro({ onClose, onMore }: { onClose: () => void; onMore: () => void }) {
  const done = (then: () => void) => () => {
    dismissRewardsIntro();
    then();
  };
  return (
    <div className="pa-intro">
      <Modal className="pa-intro__card" labelledBy="pa-intro-title">
        <div>
          <p className="pa-eyebrow">Szülőknek</p>
          <h2 id="pa-intro-title" className="pa-h1 pa-intro__title">
            Így jutalmaz a Kalandka
          </h2>
        </div>
        <ol className="pa-intro__steps">
          <li className="pa-intro__step pa-intro__step--seed">
            <span className="pa-intro__icons" aria-hidden="true">
              <Seed size={34} />
              <Bolt size={34} />
            </span>
            <b>Feladatért mag vagy csavar</b>
            <span>
              A kertben {TASKS_PER_SEED} megoldott feladat 1 mag, a műhelyben {TASKS_PER_REWARD} kör 1 csavar. Ebből ültet és robotot épít.
            </span>
          </li>
          <li className="pa-intro__step pa-intro__step--sticker">
            <svg aria-hidden="true" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
              <path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8-4.3-4.1 5.9-.8z" />
            </svg>
            <b>Új szintért matrica</b>
            <span>A matrica azt mutatja, mit tud már – nem azt, mennyit játszott. Visszalépéskor is megmarad.</span>
          </li>
          <li className="pa-intro__step pa-intro__step--keep">
            <svg aria-hidden="true" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5" />
              <path d="M5 12l7-7 7 7" />
            </svg>
            <b>Csak gyűlik</b>
            <span>Nincs véletlen, nincs elvétel, és nem a játékidő számít. A kinyomtatott lapok is ugyanígy érnek.</span>
          </li>
        </ol>
        <div className="pa-intro__actions">
          <button type="button" className="pa-link" onClick={done(onMore)}>
            Részletek: Jutalmak oldal
          </button>
          <button type="button" className="pa-top__back" onClick={done(onClose)}>
            Rendben
          </button>
        </div>
      </Modal>
    </div>
  );
}

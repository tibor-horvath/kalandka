import type { ReactNode } from 'react';
import { Csepi } from '../components/Csepi';
import { CmdIcon, Csavar, Rover } from '../components/robot';
import { KalandkaIcon, KalandkaWordmark } from '../components/ui';
import type { Cmd } from '../games/robot/path';
import type { Mood } from '../lib/types';
import { DENSITIES, siteAddress } from './sheet';

// Kellékek: pages to cut out and play with beside the worksheets. They do not follow a level and have nothing to mark,
// so they carry no QR code and print the same for every child.

export type ExtraId = 'figures' | 'badges' | 'robot';

export interface ExtraSpec {
  id: ExtraId;
  title: string;
  /** What the page is for, on the Nyomtatás list and above the preview. */
  lead: string;
  Page: () => ReactNode;
}

/** The brand line at the foot of every page, without the worksheets' QR code: there are no answers to look up. */
function Foot() {
  return (
    <footer className="ps-foot">
      <KalandkaIcon size={22} />
      <KalandkaWordmark size={15} />
      <span className="ps-foot__site">{siteAddress()}</span>
      <span className="ps-foot__about">Gondolkodtató játékok 5–7 éveseknek</span>
    </footer>
  );
}

function Head({ title, note }: { title?: string; note: string }) {
  return (
    <header className="ps-head">
      <div className="ps-head__text">
        <span className="ps-world">Kalandka · kivágós lap</span>
        {title && <h2 className="ps-title">{title}</h2>}
      </div>
      <span className="px-note">{note}</span>
    </header>
  );
}

function Guide({ who, mood }: { who: 'csepi' | 'csavar'; mood: Mood }) {
  return who === 'csepi' ? <Csepi mood={mood} className="px-guide" /> : <Csavar mood={mood} className="px-guide" />;
}

// ---------- Csepi és Csavar ----------

/** A tent card: the back half upside down, so the guide shows from both sides once folded. */
function Tent({ who, name, world }: { who: 'csepi' | 'csavar'; name: string; world: string }) {
  return (
    <div className="px-tent-wrap">
      <div className="px-tent">
        <div className="px-tent__half px-tent__half--back">
          <Guide who={who} mood="cheer" />
          <b>{name}</b>
        </div>
        <div className="px-fold">
          <span>hajtsd itt félbe</span>
        </div>
        <div className="px-tent__half">
          <Guide who={who} mood="smile" />
          <b>{name}</b>
        </div>
      </div>
      <span className="px-caption">{world}</span>
    </div>
  );
}

const ICON = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function FiguresPage() {
  return (
    <section className="ps-sheet px-sheet">
      <Head title="Csepi és Csavar – állítsd fel!" note="A figura a feladatlap mellett áll, és „ő mondja” a feladatot." />
      <div className="px-tents">
        <Tent who="csepi" name="Csepi" world="Számkert" />
        <Tent who="csavar" name="Csavar" world="Robotműhely" />
      </div>
      <div className="px-steps">
        <div className="px-step">
          <svg viewBox="0 0 24 24" aria-hidden="true" {...ICON}>
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <path d="M20 4 L8.1 15.9 M14.5 14.5 L20 20 M8.1 8.1 L12 12" />
          </svg>
          <span>
            <b>1.</b> Vágd ki a szaggatott vonal mentén.
          </span>
        </div>
        <div className="px-step">
          <svg viewBox="0 0 24 24" aria-hidden="true" {...ICON}>
            <path d="M4 20 L12 4 L20 20 M2 20 H22" />
          </svg>
          <span>
            <b>2.</b> Hajtsd félbe, és állítsd sátorba.
          </span>
        </div>
        <div className="px-step">
          <svg viewBox="0 0 24 24" aria-hidden="true" {...ICON}>
            <rect x="4" y="3" width="13" height="18" rx="2" />
            <path d="M7.5 8 H13.5 M7.5 12 H13.5 M7.5 16 H11 M20 9 V21" />
          </svg>
          <span>
            <b>3.</b> Tedd a feladatlap mellé: a felnőtt az ő hangján olvas.
          </span>
        </div>
      </div>
      <Foot />
    </section>
  );
}

// ---------- Jelvények ----------

const BADGES: { title: string; note: string; label: string; mood: Mood; count: number }[] = [
  { title: 'Kész!', note: 'Egy kész lap, egy jelvény.', label: 'Kész!', mood: 'cheer', count: 12 },
  { title: 'Kitartó!', note: 'Elakadt, de végigcsinálta.', label: 'Kitartó!', mood: 'think', count: 6 },
  { title: 'Bátor!', note: 'Új játékba vagy nehezebb szintbe vágott bele.', label: 'Bátor!', mood: 'smile', count: 6 }
];

function BadgesPage() {
  return (
    <section className="ps-sheet px-sheet">
      <Head note="Ragaszd a kész feladatlap sarkába, a QR-kód mellé." />
      {BADGES.map((b) => (
        <div key={b.title} className="px-group">
          <div className="px-group__head">
            <h3>{b.title}</h3>
            <span>{b.note}</span>
          </div>
          <div className="px-badges">
            {Array.from({ length: b.count }, (_, i) => (
              // Each row of six starts with the other guide, so the rows read as a checkerboard.
              <div key={i} className="px-badge">
                <Guide who={(i + Math.floor(i / 6)) % 2 === 0 ? 'csepi' : 'csavar'} mood={b.mood} />
                <b>{b.label}</b>
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="px-tip">
        <b>Felnőtteknek:</b> egy kész lap, egy jelvény. A „Kitartó!” azé, aki elakadt, de nem adta fel – jutalmat a próbálkozás ad, nem a hibátlan lap.
      </p>
      <Foot />
    </section>
  );
}

// ---------- Kis robot és parancskártyák ----------

/** The robot in three sizes, for the three sizes of a Robotút sheet's grid. */
const ROVER_MM = [35, 26.5, 19];

const DIR_CARDS: Cmd[] = ['up', 'right', 'down', 'left', 'up', 'right', 'down', 'left'];
const TURN_CARDS: Cmd[] = ['fwd', 'fwd', 'fwd', 'fwd', 'turnL', 'turnL', 'turnR', 'turnR'];
const CARD_LABELS: Record<Cmd, string> = { up: 'Fel', down: 'Le', left: 'Balra', right: 'Jobbra', fwd: 'Előre', turnL: 'Fordulj balra', turnR: 'Fordulj jobbra' };

function Cards({ title, note, cmds, turns }: { title: string; note: string; cmds: Cmd[]; turns?: boolean }) {
  return (
    <div className="px-group">
      <div className="px-group__head">
        <h3>{title}</h3>
        <span>{note}</span>
      </div>
      <div className="px-cards">
        {cmds.map((c, i) => (
          <div key={i} className={`px-card${turns ? ' px-card--turn' : ''}`}>
            <CmdIcon cmd={c} />
            <b>{CARD_LABELS[c]}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function RobotPage() {
  return (
    <section className="ps-sheet px-sheet">
      <Head title="Vezesd a kis robotot!" note="Rakd ki a kártyákat sorban, aztán léptesd a robotot a Robotút lapon." />
      <div className="px-group">
        <div className="px-group__head">
          <h3>A kis robot</h3>
          <span>A lámpás eleje mutatja, merre néz.</span>
        </div>
        <div className="px-rovers">
          {ROVER_MM.map((mm, k) => (
            <div key={mm} className="px-rovers__size">
              <div className="px-rovers__pair">
                {[0, 1].map((i) => (
                  <div key={i} className="px-rover" style={{ width: `${mm}mm`, height: `${mm}mm` }}>
                    <svg viewBox="0 0 100 100" aria-hidden="true">
                      <path d="M42 9 L50 1 L58 9 Z" fill="#10233A" />
                      <Rover />
                    </svg>
                  </div>
                ))}
              </div>
              <span className="px-caption">{DENSITIES[k].label}</span>
            </div>
          ))}
        </div>
      </div>
      <Cards title="Iránykártyák" note="A robot a nyíl felé lép egyet." cmds={DIR_CARDS} />
      <Cards title="Fordulókártyák" note="Előre: amerre néz. Fordulás: helyben." cmds={TURN_CARDS} turns />
      <p className="px-tip">
        <b>Felnőtteknek:</b> válasszátok azt a robotot, amelyik befér a Robotút lap rácsának egy kockájába. A lap felirata mondja meg, irány- vagy fordulókártya kell-e.
      </p>
      <Foot />
    </section>
  );
}

/** In the order they stand on the Nyomtatás page. */
export const EXTRAS: ExtraSpec[] = [
  { id: 'figures', title: 'Csepi és Csavar', lead: 'Kivágható, felállítható figurák: a feladatlap mellett állnak, és „ők mondják” a feladatot.', Page: FiguresPage },
  { id: 'badges', title: 'Jelvények', lead: 'Kész!, Kitartó! és Bátor! jelvények, hogy a kész lapra ragasszátok.', Page: BadgesPage },
  { id: 'robot', title: 'Kis robot és parancskártyák', lead: 'Kivágható robot és parancskártyák a Robotút lapokhoz: a gyerkőc kirakja a programot, aztán végiglépteti.', Page: RobotPage }
];

export function extraFor(id: ExtraId): ExtraSpec {
  return EXTRAS.find((e) => e.id === id)!;
}

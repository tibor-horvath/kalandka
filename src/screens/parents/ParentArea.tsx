import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Avatar } from '../../components/avatars';
import { useModal } from '../../components/Modal';
import { KalandkaIcon } from '../../components/ui';
import { KidScope, kidName, useProfiles } from '../../state/profiles';
import { applyUpdate, checkForUpdate, useUpdateWaiting } from '../../lib/update';
import { KidsPage } from './KidsPage';
import { LegalPage } from './LegalPage';
import { LevelsPage } from './LevelsPage';
import { Overview } from './Overview';
import { PrintPage } from './PrintPage';
import { RewardsIntro, dismissRewardsIntro, rewardsIntroDue } from './RewardsIntro';
import { RewardsPage } from './RewardsPage';
import { SettingsPage } from './SettingsPage';
import { TimePage } from './TimePage';

/** 'legal' has no menu item: it opens from Settings, so the phone tab bar keeps seven items. */
export type ParentPage = 'overview' | 'kids' | 'time' | 'levels' | 'rewards' | 'print' | 'settings' | 'legal';
/** Where the area opens: a page, or straight into adding a child (from "Ki játszik?"). */
export type ParentStart = ParentPage | 'add';

/** Soft hyphens (\u00ad) let the long labels break in two on the phone's seven-tab bar; elsewhere they never show. */
const PAGES: { id: Exclude<ParentPage, 'legal'>; label: string; icon: ReactNode }[] = [
  {
    id: 'overview',
    label: 'Áttekin\u00adtés',
    icon: (
      <>
        <rect x="3" y="3" width="7" height="9" rx="2" />
        <rect x="14" y="3" width="7" height="5" rx="2" />
        <rect x="14" y="12" width="7" height="9" rx="2" />
        <rect x="3" y="16" width="7" height="5" rx="2" />
      </>
    )
  },
  {
    id: 'kids',
    label: 'Gyerkő\u00adcök',
    icon: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
        <circle cx="17" cy="9" r="2.8" />
        <path d="M16 14a5 5 0 0 1 6 6" />
      </>
    )
  },
  {
    id: 'time',
    label: 'Képer\u00adnyő\u00adidő',
    icon: (
      <>
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2.5 2" />
        <path d="M9 2.5h6" />
      </>
    )
  },
  {
    id: 'levels',
    label: 'Szintek',
    icon: (
      <>
        <path d="M4 20h4v-6H4z" />
        <path d="M10 20h4V9h-4z" />
        <path d="M16 20h4V4h-4z" />
      </>
    )
  },
  {
    id: 'rewards',
    label: 'Jutalmak',
    icon: (
      <>
        <path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8-4.3-4.1 5.9-.8z" />
      </>
    )
  },
  {
    id: 'print',
    label: 'Nyomta\u00adtás',
    icon: (
      <>
        <path d="M6 9V3h12v6" />
        <rect x="3" y="9" width="18" height="8" rx="2" />
        <path d="M7 14h10v7H7z" />
      </>
    )
  },
  {
    id: 'settings',
    label: 'Beállí\u00adtások',
    icon: (
      <>
        <path d="M4 7h10" />
        <path d="M18 7h2" />
        <circle cx="16" cy="7" r="2" />
        <path d="M4 17h4" />
        <path d="M12 17h8" />
        <circle cx="10" cy="17" r="2" />
      </>
    )
  }
];

/**
 * Feladatlapok (opened without the gate), on a shared device: whose sheets the page shows.
 * It stays at the top while the page scrolls; once scrolled it turns into a compact header
 * with the page title, and the other children shrink to their avatars.
 */
export function KidSwitch({ viewId, onView, title, stuck }: { viewId: string; onView: (id: string) => void; title: string; stuck: boolean }) {
  const { profiles } = useProfiles();
  return (
    <div className={`pa-kidbar${stuck ? ' is-stuck' : ''}`}>
      <span className="pa-kidbar__title" aria-hidden={!stuck}>{title}</span>
      <div className="pa-kidbar__kids" role="radiogroup" aria-label="Melyik gyerkőc?">
        {profiles.kids.map((kid) => (
          <button
            key={kid.id}
            type="button"
            role="radio"
            aria-checked={kid.id === viewId}
            className={`pa-kidbar__kid${kid.id === viewId ? ' is-on' : ''}`}
            onClick={() => onView(kid.id)}
          >
            <Avatar id={kid.avatar} size={32} />
            <span className="pa-kidbar__name">{kidName(kid)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const DATE_FMT = new Intl.DateTimeFormat('hu-HU', { month: 'long', day: 'numeric', weekday: 'long' });

/** In the top bar: whose overview, time, levels and sheets the pages show (shared device). */
function TopKids({ viewId, onView }: { viewId: string; onView: (id: string) => void }) {
  const { profiles } = useProfiles();
  return (
    <div className="pa-top__kids" role="radiogroup" aria-label="Melyik gyerkőc?">
      {profiles.kids.map((kid) => (
        <button
          key={kid.id}
          type="button"
          role="radio"
          aria-checked={kid.id === viewId}
          className={`pa-top__kid${kid.id === viewId ? ' is-on' : ''}`}
          onClick={() => onView(kid.id)}
        >
          <Avatar id={kid.avatar} size={32} />
          <span className="pa-top__name">{kidName(kid)}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * The parents' corner never reloads on its own (a parent may be halfway through a transfer or a form),
 * so a downloaded update waits at the foot of the menu, on every page; leaving the corner applies it too.
 */
function MenuUpdate() {
  const waiting = useUpdateWaiting();
  // Opening the corner is a good moment to look, not only at the next timed check.
  useEffect(checkForUpdate, []);
  if (!waiting) return null;
  return (
    <div className="pa-nav__update" role="status">
      <div className="pa-nav__update-text">
        <b>Új verzió érhető el</b>
        <span>Pár másodperc, a haladás megmarad.</span>
      </div>
      <button type="button" className="pa-btn pa-btn--go" onClick={applyUpdate}>
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12a8 8 0 1 1-2.3-5.6" />
          <path d="M20 4v5h-5" />
        </svg>
        Frissítés
      </button>
    </div>
  );
}

/**
 * The parents' area: its own calm, adult space at the window's own size, separate from the garden.
 * One top bar on every page (who, today, back to the game), the menu beside or below, and only the page scrolls.
 */
export function ParentArea({ start = 'overview', onClose, onAbout }: { start?: ParentStart; onClose: () => void; onAbout: () => void }) {
  const { profiles } = useProfiles();
  const [page, setPage] = useState<ParentPage>(start === 'add' ? 'kids' : start);
  // Opens on the child who is playing; parents can look at the others without changing who plays.
  const [viewId, setViewId] = useState(profiles.activeId);
  const shownId = profiles.kids.some((k) => k.id === viewId) ? viewId : profiles.activeId;
  const perKid = page !== 'kids' && page !== 'legal';
  const modal = useModal<HTMLDivElement>();
  const main = useRef<HTMLElement>(null);
  // The one-time card on seeds, bolts and stickers; not while a parent came here to add a child.
  const [intro, setIntro] = useState(() => start !== 'add' && start !== 'rewards' && rewardsIntroDue());
  const introOpen = useRef(intro);
  introOpen.current = intro;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // On the intro card, Escape closes only the card.
      if (introOpen.current) {
        dismissRewardsIntro();
        setIntro(false);
      } else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // A new page starts at its top.
  useEffect(() => {
    main.current?.scrollTo({ top: 0 });
  }, [page]);

  return (
    <div className="pa pa--area" ref={modal}>
      <header className="pa-top">
        <div className="pa-top__brand">
          <KalandkaIcon size={40} />
          <div>
            <div className="pa-top__title">Szülői sarok</div>
            <div className="pa-top__sub">Kalandka</div>
          </div>
        </div>
        {perKid && profiles.kids.length > 1 && <TopKids viewId={shownId} onView={setViewId} />}
        <div className="pa-top__end">
          <span className="pa-top__date">Ma · {DATE_FMT.format(new Date())}</span>
          <button type="button" className="pa-top__back" onClick={onClose}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
            Vissza a játékhoz
          </button>
        </div>
      </header>
      <div className="pa-body">
        <nav className="pa-nav" aria-label="Szülői sarok">
          {PAGES.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`pa-nav__item${page === p.id ? ' is-active' : ''}`}
              aria-current={page === p.id ? 'page' : undefined}
              onClick={() => setPage(p.id)}
            >
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {p.icon}
              </svg>
              {p.label}
            </button>
          ))}
          <MenuUpdate />
        </nav>
        <main className="pa-main" ref={main}>
          {page === 'legal' ? (
            <LegalPage />
          ) : page === 'kids' ? (
            <KidsPage startAdding={start === 'add'} onView={(id, to) => {
                setViewId(id);
                setPage(to);
              }} />
          ) : (
            <KidScope kidId={shownId}>
              {page === 'overview' && <Overview onGo={setPage} />}
              {page === 'time' && <TimePage />}
              {page === 'levels' && <LevelsPage />}
              {page === 'rewards' && <RewardsPage />}
              {page === 'print' && <PrintPage kidId={shownId} canMark />}
              {page === 'settings' && <SettingsPage onLegal={() => setPage('legal')} />}
            </KidScope>
          )}
          <footer className="pa-foot">
            <span>Reklám, csevegés és vásárlás nélkül. Minden adat csak ezen az eszközön marad.</span>
            <button type="button" className="pa-foot__link" onClick={() => setPage('legal')}>
              Adatkezelés és impresszum
            </button>
            <button type="button" className="pa-foot__link" onClick={onAbout}>
              A Kalandkáról
            </button>
          </footer>
        </main>
      </div>
      {intro && (
        <RewardsIntro
          onClose={() => setIntro(false)}
          onMore={() => {
            setIntro(false);
            setPage('rewards');
          }}
        />
      )}
    </div>
  );
}

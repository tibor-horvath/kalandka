import { useEffect, useState, type ReactNode } from 'react';
import { Avatar } from '../../components/avatars';
import { CsepiIcon } from '../../components/Csepi';
import { KidScope, kidName, useProfiles } from '../../state/profiles';
import { KidsPage } from './KidsPage';
import { LevelsPage } from './LevelsPage';
import { Overview } from './Overview';
import { SettingsPage } from './SettingsPage';
import { TimePage } from './TimePage';
import '../../styles/parents.css';

export type ParentPage = 'overview' | 'kids' | 'time' | 'levels' | 'settings';
/** Where the area opens: a page, or straight into adding a child (from "Ki játszik?"). */
export type ParentStart = ParentPage | 'add';

const PAGES: { id: ParentPage; label: string; icon: ReactNode }[] = [
  {
    id: 'overview',
    label: 'Áttekintés',
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
    label: 'Gyerekek',
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
    label: 'Képernyőidő',
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
    id: 'settings',
    label: 'Beállítások',
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

/** On a shared device: whose overview, time and levels the page shows. */
function KidSwitch({ viewId, onView }: { viewId: string; onView: (id: string) => void }) {
  const { profiles } = useProfiles();
  return (
    <div className="pa-kidbar" role="radiogroup" aria-label="Melyik gyerek?">
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
          {kidName(kid)}
        </button>
      ))}
    </div>
  );
}

/** The parents' area: its own calm, adult space with a menu, separate from the garden. */
export function ParentArea({ start = 'overview', onClose }: { start?: ParentStart; onClose: () => void }) {
  const { profiles } = useProfiles();
  const [page, setPage] = useState<ParentPage>(start === 'add' ? 'kids' : start);
  // Opens on the child who is playing; parents can look at the others without changing who plays.
  const [viewId, setViewId] = useState(profiles.activeId);
  const shownId = profiles.kids.some((k) => k.id === viewId) ? viewId : profiles.activeId;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="pa">
      <nav className="pa-nav" aria-label="Szülői sarok">
        <div className="pa-nav__brand">
          <CsepiIcon size={44} />
          <div>
            <div className="pa-nav__title">Szülői sarok</div>
            <div className="pa-nav__sub">Kalandka · Számkertész</div>
          </div>
        </div>
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
        <div className="pa-nav__spacer" />
        <p className="pa-nav__note">Reklám, csevegés és vásárlás nélkül. Minden adat csak ezen az eszközön marad.</p>
        <button type="button" className="pa-nav__back" onClick={onClose}>
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          Vissza a játékhoz
        </button>
      </nav>
      <main className="pa-main">
        {page === 'kids' ? (
          <KidsPage startAdding={start === 'add'} onView={(id, to) => {
              setViewId(id);
              setPage(to);
            }} />
        ) : (
          <KidScope kidId={shownId}>
            {profiles.kids.length > 1 && <KidSwitch viewId={shownId} onView={setViewId} />}
            {page === 'overview' && <Overview onGo={setPage} />}
            {page === 'time' && <TimePage />}
            {page === 'levels' && <LevelsPage />}
            {page === 'settings' && <SettingsPage />}
          </KidScope>
        )}
      </main>
    </div>
  );
}

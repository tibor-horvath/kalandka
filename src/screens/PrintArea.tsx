import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { KalandkaIcon } from '../components/ui';
import { KidScope, startingProgress, useProfiles, type AgeBand } from '../state/profiles';
import { ProgressContext } from '../state/progress';
import { KidSwitch } from './parents/ParentArea';
import { PrintPage } from './parents/PrintPage';

/** A visitor's sheets, before any child is named: the starting levels for the chosen age, read only. */
function GuestScope({ age, children }: { age: AgeBand; children: ReactNode }) {
  const value = useMemo(() => ({ progress: startingProgress(age), update: () => {} }), [age]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

/**
 * The printable sheets, opened from "Ki játszik?" and the home screens without the parents' gate:
 * the same pages as Nyomtatás in the parents' corner, in the same calm adult space, with nothing else of it.
 * From the landing page (`guestAge`) there is no child yet, so the levels come from the age the grown-up picked.
 */
export function PrintArea({ onClose, guestAge }: { onClose: () => void; guestAge?: AgeBand }) {
  const { profiles } = useProfiles();
  const [viewId, setViewId] = useState(profiles.activeId);
  const shownId = profiles.kids.some((k) => k.id === viewId) ? viewId : profiles.activeId;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="pa pa--print">
      <header className="pa-printbar">
        <div className="pa-nav__brand">
          <KalandkaIcon size={44} />
          <div>
            <div className="pa-nav__title">Feladatlapok</div>
            <div className="pa-nav__sub">Kalandka · nyomtatható játékok</div>
          </div>
        </div>
        <button type="button" className="pa-nav__back" onClick={onClose}>
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          {guestAge ? 'Vissza' : 'Vissza a játékhoz'}
        </button>
      </header>
      <main className="pa-main" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 12)}>
        {guestAge ? (
          <GuestScope age={guestAge}>
            <PrintPage kidId={`guest-${guestAge}`} guestAge={guestAge} />
          </GuestScope>
        ) : (
          <KidScope kidId={shownId}>
            {profiles.kids.length > 1 && <KidSwitch viewId={shownId} onView={setViewId} title="Nyomtatás" stuck={scrolled} />}
            <PrintPage kidId={shownId} />
          </KidScope>
        )}
      </main>
    </div>
  );
}

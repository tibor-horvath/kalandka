import { useEffect, useState } from 'react';
import { KalandkaIcon } from '../components/ui';
import { KidScope, useProfiles } from '../state/profiles';
import { KidSwitch } from './parents/ParentArea';
import { PrintPage } from './parents/PrintPage';

/**
 * The printable sheets, opened from "Ki játszik?" and the home screens without the parents' gate:
 * the same pages as Nyomtatás in the parents' corner, in the same calm adult space, with nothing else of it.
 */
export function PrintArea({ onClose }: { onClose: () => void }) {
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
          Vissza a játékhoz
        </button>
      </header>
      <main className="pa-main" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 12)}>
        <KidScope kidId={shownId}>
          {profiles.kids.length > 1 && (
            <KidSwitch viewId={shownId} onView={setViewId} title="Nyomtatás" stuck={scrolled} />
          )}
          <PrintPage kidId={shownId} />
        </KidScope>
      </main>
    </div>
  );
}

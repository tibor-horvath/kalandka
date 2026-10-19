import type { ReactNode } from 'react';
import type { WorldInfo } from '../../state/worlds';

/** A checkbox row with a bold title and a one-line explanation. */
export function Check({ id, checked, onChange, title, hint }: { id: string; checked: boolean; onChange: (v: boolean) => void; title: string; hint: string }) {
  return (
    <label className="pa-check" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <b>{title}</b>
        <small>{hint}</small>
      </span>
    </label>
  );
}

/** One world's tinted group: badge, name, guide and what it teaches, then the world's games. */
export function WorldGroup({ world, heading: Heading, aside, children }: { world: WorldInfo; heading: 'h2' | 'h3'; aside?: ReactNode; children: ReactNode }) {
  const id = `pa-world-${world.id}`;
  return (
    <section className={`pa-world pa-world--${world.id}`} aria-labelledby={id}>
      <div className="pa-world__head">
        <div className="pa-world__badge" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            {world.id === 'robot' ? (
              <>
                <rect x="5" y="8" width="14" height="11" rx="3" />
                <path d="M12 8V4" />
                <circle cx="12" cy="3.5" r="1" />
                <circle cx="9.5" cy="13" r="1" />
                <circle cx="14.5" cy="13" r="1" />
                <path d="M2 12v3" />
                <path d="M22 12v3" />
              </>
            ) : (
              <>
                <path d="M12 21V11" />
                <path d="M12 13c0-4-3-6-7-6 0 4 3 6 7 6z" />
                <path d="M12 11c0-4 3-6 7-6 0 4-3 6-7 6z" />
              </>
            )}
          </svg>
        </div>
        <div className="pa-world__text">
          <Heading id={id} className="pa-world__name">
            {world.name}
          </Heading>
          <span className="pa-world__about">
            {world.guide} · {world.about}
          </span>
        </div>
        {aside && <span className="pa-world__aside">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

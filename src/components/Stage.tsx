import { useEffect, useState, type ReactNode } from 'react';

export const STAGE_W = 1180;
export const STAGE_H = 820;

/** Lays the game out on a fixed 1180×820 tablet stage and scales it to fit any screen. */
export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  return (
    <div className="stage-outer">
      <div className="stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

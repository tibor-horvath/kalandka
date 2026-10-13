import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useForm } from './Stage';

/**
 * A drawing laid out at a fixed size (a seed bed, the bee's flower beds, the honey-trail board).
 * On the tablet stage it is shown as drawn. On phones it scales to fit the room its box gets
 * from the screen's layout, centred, and exposes the scale as --fit-k for anything that must
 * keep its real size (a button drawn on top of it).
 */
export function FitBox({ width, height, className = '', children }: { width: number; height: number; className?: string; children: ReactNode }) {
  const form = useForm();
  const phone = form !== 'tablet';
  const box = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = box.current;
    if (!phone || !el) return;
    // clientWidth counts padding: give the box margins, not padding. Measured at once on every
    // re-layout (a turned phone), so the first frame is already at the new scale; the observer
    // catches everything else.
    const measure = () => setRoom({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [phone, form]);

  if (!phone) return <>{children}</>;
  const k = room ? Math.max(0.1, Math.min(room.w / width, room.h / height)) : 1;
  return (
    <div className={`fit-box ${className}`} ref={box}>
      <div className="fit-box__frame" style={{ width: width * k, height: height * k }}>
        <div className="fit-box__drawing" style={{ width, height, transform: `scale(${k})`, '--fit-k': k } as CSSProperties}>
          {children}
        </div>
      </div>
    </div>
  );
}

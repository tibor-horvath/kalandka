import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export const STAGE_W = 1180;
export const STAGE_H = 820;

/** The phone stage's short side, in CSS px (the phone designs are drawn at 390 × 844). */
export const PHONE_SHORT = 390;
/** Screens whose short side is below this get the phone layout. */
const PHONE_MAX = 600;
/** The phone stage's long side never shrinks below this; shorter windows letterbox instead. */
const PHONE_MIN_LONG = 640;
/** The settle after the phone is turned: a small tilt that springs upright. */
const TURN_MS = 560;
const TURN_TILT = 10;

/** tablet: the fixed 1180×820 stage; portrait / landscape: a 390 px-wide or -tall phone stage. */
export type Form = 'tablet' | 'portrait' | 'landscape';

const FormContext = createContext<Form>('tablet');

/** Which layout the current screen is drawn in. */
export function useForm(): Form {
  return useContext(FormContext);
}

interface Fit {
  form: Form;
  width: number;
  height: number;
  scale: number;
}

function fit(w: number, h: number): Fit {
  if (Math.min(w, h) >= PHONE_MAX) {
    return { form: 'tablet', width: STAGE_W, height: STAGE_H, scale: Math.min(w / STAGE_W, h / STAGE_H) };
  }
  // The short side is always 390 px; the long side follows the screen's shape.
  if (h >= w) {
    const scale = Math.min(w / PHONE_SHORT, h / PHONE_MIN_LONG);
    return { form: 'portrait', width: PHONE_SHORT, height: Math.max(PHONE_MIN_LONG, h / scale), scale };
  }
  const scale = Math.min(h / PHONE_SHORT, w / PHONE_MIN_LONG);
  return { form: 'landscape', width: Math.max(PHONE_MIN_LONG, w / scale), height: PHONE_SHORT, scale };
}

/** Which way the screen turned, from the orientation angle: +1 clockwise, −1 the other way. */
function turnDirection(before: number | null, after: number | null): number {
  if (before === null || after === null) return 1;
  const delta = (((after - before) % 360) + 540) % 360 - 180;
  return delta < 0 ? -1 : 1;
}

/**
 * Lays the game out on a fixed stage and scales it to fit any screen: the 1180×820 tablet stage,
 * or on phones a portrait or landscape phone stage. Turning a phone re-lays the screen out and
 * the new layout tilts in and springs upright, leaning the way the phone turned.
 */
export function Stage({ children }: { children: ReactNode }) {
  const [view, setView] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const stage = useRef<HTMLDivElement>(null);
  const lastForm = useRef<Form | null>(null);
  const lastAngle = useRef<number | null>(screen.orientation?.angle ?? null);

  useEffect(() => {
    const measure = () => setView({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Worked out while rendering, so a screen never paints a frame in the other layout.
  const { form, width, height, scale } = fit(view.w, view.h);

  // Before paint, so the first frame of the new layout is already the start of the motion.
  useLayoutEffect(() => {
    const before = lastForm.current;
    lastForm.current = form;
    const angle = screen.orientation?.angle ?? null;
    const dir = turnDirection(lastAngle.current, angle);
    lastAngle.current = angle;
    const turned = (before === 'portrait' && form === 'landscape') || (before === 'landscape' && form === 'portrait');
    if (!turned || !stage.current?.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // `rotate` and `scale` compose with the stage's own centring transform instead of replacing it.
    stage.current.animate(
      [
        { rotate: `${-dir * TURN_TILT}deg`, scale: '0.9', opacity: 0.4 },
        { rotate: `${dir * 2}deg`, scale: '1.01', opacity: 1, offset: 0.65 },
        { rotate: '0deg', scale: '1', opacity: 1 }
      ],
      { duration: TURN_MS, easing: 'cubic-bezier(.22, .9, .3, 1)' }
    );
  }, [form]);

  return (
    <div className="stage-outer">
      <div
        ref={stage}
        className={`stage stage--${form}${form === 'tablet' ? '' : ' is-phone'}`}
        style={{ width, height, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <FormContext.Provider value={form}>{children}</FormContext.Provider>
      </div>
    </div>
  );
}

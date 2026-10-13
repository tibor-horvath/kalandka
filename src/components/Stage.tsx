import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export const STAGE_W = 1180;
export const STAGE_H = 820;

/** The phone stage's short side, in CSS px (the phone designs are drawn at 390 × 844). */
export const PHONE_SHORT = 390;
/** Screens whose short side is below this get the phone layout. */
const PHONE_MAX = 600;
/** The phone stage's long side never shrinks below this; shorter windows letterbox instead. */
const PHONE_MIN_LONG = 640;

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

function fit(w: number, h: number, phoneReady: boolean): Fit {
  if (!phoneReady || Math.min(w, h) >= PHONE_MAX) {
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

/**
 * Lays the game out on a fixed stage and scales it to fit any screen: the 1180×820 tablet stage,
 * or, on phones and for screens that have a phone layout (`phone`), a portrait or landscape phone stage.
 */
export function Stage({ phone = false, children }: { phone?: boolean; children: ReactNode }) {
  const [view, setView] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));

  useEffect(() => {
    const measure = () => setView({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Worked out while rendering, so a screen never paints a frame in the other layout.
  const { form, width, height, scale } = fit(view.w, view.h, phone);
  return (
    <div className="stage-outer">
      <div
        className={`stage stage--${form}${form === 'tablet' ? '' : ' is-phone'}`}
        style={{ width, height, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <FormContext.Provider value={form}>{children}</FormContext.Provider>
      </div>
    </div>
  );
}

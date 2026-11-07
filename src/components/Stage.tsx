import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export const STAGE_W = 1180;
export const STAGE_H = 820;
/** On a screen wider than the tablet stage, the map screens may grow it sideways up to this. */
const WIDE_MAX_W = 1720;

/** The phone stage's short side, in CSS px (the phone designs are drawn at 390 × 844). */
export const PHONE_SHORT = 390;
/** Screens whose short side is below this get the phone layout. */
const PHONE_MAX = 600;
/** The phone stage's long side never shrinks below this; shorter windows letterbox instead. */
const PHONE_MIN_LONG = 640;
/**
 * A tablet held upright gets the portrait layout on a wider stage, drawn this much larger than
 * on a phone so the buttons stay big for a child's finger at arm's length.
 */
const TALL_TABLET_SCALE = 1.4;
/** The upright tablet stage's width stays within these, so the portrait layout neither stretches nor crowds. */
const TALL_TABLET_MIN_W = 540;
const TALL_TABLET_MAX_W = 720;
/** The settle after the phone is turned: a small tilt that springs upright. */
const TURN_MS = 560;
const TURN_TILT = 10;

/**
 * tablet: the 1180×820 stage (on a wide screen the map screens draw it wider); portrait / landscape: a 390 px-wide or -tall phone stage.
 * An upright tablet is 'portrait' too, on a wider stage (marked .stage--tall-tablet).
 */
export type Form = 'tablet' | 'portrait' | 'landscape';

const FormContext = createContext<Form>('tablet');

/** How much wider than STAGE_W the tablet stage is drawn, and the way a screen asks for (+1) or gives up (−1) the wide stage. */
const WideContext = createContext<{ extra: number; ask: (n: number) => void }>({ extra: 0, ask: () => {} });

/** Which layout the current screen is drawn in. */
export function useForm(): Form {
  return useContext(FormContext);
}

/**
 * Lets the tablet stage grow sideways to fill a wide screen while this screen is shown (the map screens use it;
 * the games keep the 1180 stage). Returns how many px wider than STAGE_W the stage is: 0 on phones and 4:3 screens.
 */
export function useWideStage(): number {
  const { extra, ask } = useContext(WideContext);
  // Before paint, so the first frame is already drawn at the wide width.
  useLayoutEffect(() => {
    ask(1);
    return () => ask(-1);
  }, [ask]);
  return extra;
}

interface Fit {
  form: Form;
  /** An upright tablet: the portrait layout with room to spare. */
  tallTablet?: boolean;
  width: number;
  height: number;
  scale: number;
}

function fit(w: number, h: number, wide: boolean): Fit {
  if (Math.min(w, h) >= PHONE_MAX && h > w) {
    const width = Math.min(TALL_TABLET_MAX_W, Math.max(TALL_TABLET_MIN_W, w / TALL_TABLET_SCALE));
    const scale = w / width;
    return { form: 'portrait', tallTablet: true, width, height: h / scale, scale };
  }
  if (Math.min(w, h) >= PHONE_MAX) {
    const scale = Math.min(w / STAGE_W, h / STAGE_H);
    const width = wide ? Math.round(Math.min(WIDE_MAX_W, Math.max(STAGE_W, w / scale))) : STAGE_W;
    return { form: 'tablet', width, height: STAGE_H, scale };
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
 * on phones a portrait or landscape phone stage, and on an upright tablet a wider portrait stage.
 * Turning the device re-lays the screen out and the new layout tilts in and springs upright,
 * leaning the way the device turned.
 */
export function Stage({ children }: { children: ReactNode }) {
  const [view, setView] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const stage = useRef<HTMLDivElement>(null);
  const lastForm = useRef<Form | null>(null);
  const lastAngle = useRef<number | null>(screen.orientation?.angle ?? null);
  const [wideAsks, setWideAsks] = useState(0);
  const ask = useCallback((n: number) => setWideAsks((a) => a + n), []);

  useEffect(() => {
    const measure = () => setView({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Worked out while rendering, so a screen never paints a frame in the other layout.
  const { form, tallTablet, width, height, scale } = fit(view.w, view.h, wideAsks > 0);
  const wide = useMemo(() => ({ extra: form === 'tablet' ? width - STAGE_W : 0, ask }), [form, width, ask]);

  // Before paint, so the first frame of the new layout is already the start of the motion.
  useLayoutEffect(() => {
    const before = lastForm.current;
    lastForm.current = form;
    const angle = screen.orientation?.angle ?? null;
    const dir = turnDirection(lastAngle.current, angle);
    lastAngle.current = angle;
    // Every turn of a device goes to or from portrait (a tablet turned upright is portrait too).
    const turned = before !== null && before !== form && (before === 'portrait' || form === 'portrait');
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
        className={`stage stage--${form}${form === 'tablet' ? '' : ' is-phone'}${tallTablet ? ' stage--tall-tablet' : ''}`}
        style={{ width, height, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <FormContext.Provider value={form}>
          <WideContext.Provider value={wide}>{children}</WideContext.Provider>
        </FormContext.Provider>
      </div>
    </div>
  );
}

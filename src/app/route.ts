import { useCallback, useEffect, useRef, useState } from 'react';

/** The game lives at /jatek (the installed app starts there); every other address is the landing page. */
const GAME_PATH = '/jatek';
const LANDING_PATH = '/';

function onGamePath(): boolean {
  return window.location.pathname === GAME_PATH || window.location.pathname.startsWith(`${GAME_PATH}/`);
}

/** Launched from the home screen. Older installs still start at /, so they skip the landing page this way. */
function isInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Moves the address to the page on screen; `push` adds a history step, so Back returns to the previous page. */
function goTo(path: string, push = false) {
  if (window.location.pathname === path) return;
  const url = path + window.location.search + window.location.hash;
  if (push) window.history.pushState(null, '', url);
  else window.history.replaceState(window.history.state, '', url);
}

/**
 * Whether the landing page or the game is on screen, kept in step with the address and with Back and Forward.
 * A device with no named child always gets the landing page; with one, / is still the landing page in a
 * browser tab, but the installed app goes straight to the game.
 */
export function useLandingRoute(named: boolean) {
  const [landing, setLanding] = useState(() => !named || (!onGamePath() && !isInstalled()));
  const namedNow = useRef(named);
  namedNow.current = named;

  // The address matches the page from the start: /jatek without a named child goes to /, an installed app at / to /jatek.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- The address is set once, for the page the app opened on.
  useEffect(() => goTo(landing ? LANDING_PATH : GAME_PATH), []);
  useEffect(() => {
    const onPop = () => setLanding(!namedNow.current || !onGamePath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const show = (toLanding: boolean) => {
    goTo(toLanding ? LANDING_PATH : GAME_PATH, true);
    setLanding(toLanding);
  };

  return { landing, openGame: () => show(false), openLanding: () => show(true) };
}

/** Something on screen the browser's Back closes: a game, the album, the parents' corner. */
export type BackLayer = { key: string; close: () => void };

/** How many layers deep a history entry is; the page's own entries are 0. */
function layerOf(state: unknown): number {
  const n = (state as { kalandkaLayer?: unknown } | null)?.kalandkaLayer;
  return typeof n === 'number' ? n : 0;
}

/**
 * Gives every open layer (outermost first) its own history entry at the same address, so the browser's Back
 * closes the innermost one the way its own back button does. Closing a layer in the app takes its entry off again,
 * so the entries always match the screen and Forward never reopens a closed one.
 */
export function useBackLayers(layers: BackLayer[]) {
  const latest = useRef(layers);
  latest.current = layers;
  // A reload on a layer's entry starts with nothing open: the entries left over are stepped back over at once.
  const depth = useRef(layerOf(window.history.state));
  const keys = useRef<string[]>(Array.from({ length: depth.current }, () => ''));
  /** The depth a `history.go` started here will land on; its popstate is ours, not the child's. */
  const waiting = useRef<number | null>(null);

  const sync = useCallback(() => {
    if (waiting.current !== null) return;
    // The address moved on without us (the landing page was opened): our entries are behind it now.
    if (layerOf(window.history.state) !== depth.current) {
      depth.current = 0;
      keys.current = [];
    }
    const want = latest.current.map((l) => l.key);
    let same = 0;
    while (same < depth.current && same < want.length && keys.current[same] === want[same]) same++;
    if (same < depth.current) {
      // Layers closed in the app: drop their entries; any new ones are added once the browser has stepped back.
      waiting.current = same;
      window.history.go(same - depth.current);
      depth.current = same;
      keys.current = keys.current.slice(0, same);
      return;
    }
    for (let i = same; i < want.length; i++) window.history.pushState({ kalandkaLayer: i + 1 }, '');
    depth.current = want.length;
    keys.current = want;
  }, []);

  useEffect(sync);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const n = layerOf(e.state);
      if (waiting.current !== null) {
        const ours = n === waiting.current;
        waiting.current = null;
        if (ours) {
          sync();
          return;
        }
      }
      if (n > depth.current) {
        // Forward into a layer already closed: step back to the page on screen.
        waiting.current = depth.current;
        window.history.go(depth.current - n);
        return;
      }
      const closing = latest.current.slice(n, depth.current).reverse();
      depth.current = n;
      keys.current = keys.current.slice(0, n);
      closing.forEach((l) => l.close());
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [sync]);
}

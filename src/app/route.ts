import { useEffect, useRef, useState } from 'react';

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

// App updates without interrupting play.
// A new version is downloaded in the background and waits; App switches to it (a reload)
// only while the garden home screen is showing, never in the middle of a game or the parents' corner.

import { useSyncExternalStore } from 'react';
import { registerSW } from 'virtual:pwa-register';

/** A tablet can stay open for days, so look for a new version now and then, not only on launch. */
const CHECK_EVERY_MS = 60 * 60 * 1000;

let waiting = false;
let apply: ((reload?: boolean) => Promise<void>) | null = null;
const listeners = new Set<() => void>();

/** Call once at startup. */
export function registerUpdates(): void {
  apply = registerSW({
    onNeedRefresh() {
      waiting = true;
      listeners.forEach((l) => l());
    },
    onRegisteredSW(url, registration) {
      if (!registration) return;
      const check = async () => {
        if (waiting || registration.installing || !navigator.onLine || document.visibilityState !== 'visible') return;
        // Skip the check when the server is unreachable instead of letting update() throw.
        const res = await fetch(url, { cache: 'no-store', headers: { 'cache-control': 'no-cache' } }).catch(() => null);
        if (res?.ok) await registration.update().catch(() => {});
      };
      window.setInterval(check, CHECK_EVERY_MS);
      // Reopening an app left in the background does not reload the page, so the browser
      // would not look for a new version on its own: check whenever it comes back on screen.
      document.addEventListener('visibilitychange', check);
    }
  });
}

/** Activates the waiting version and reloads the page into it. */
export function applyUpdate(): void {
  void apply?.(true);
}

/** True once a new version has been downloaded and is waiting to take over. */
export function useUpdateWaiting(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => waiting
  );
}

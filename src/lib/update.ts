// App updates without interrupting play.
// A new version is downloaded in the background and waits; App switches to it (a reload)
// only while the garden home screen is showing, never in the middle of a game or the parents' corner.

import { useSyncExternalStore } from 'react';
import { registerSW } from 'virtual:pwa-register';

/**
 * Everything the app needs is precached by the service worker, so once installed it never asks
 * the server for anything except this check: one small `sw.js` request, at most every five minutes.
 * A tablet can stay open for days, so it also runs while the app is left open, not only on launch.
 */
const CHECK_EVERY_MS = 5 * 60 * 1000;

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
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      // Registering already made the browser look for a new version.
      let lastCheck = Date.now();
      const check = () => {
        if (waiting || registration.installing || !navigator.onLine || document.visibilityState !== 'visible') return;
        if (Date.now() - lastCheck < CHECK_EVERY_MS) return;
        lastCheck = Date.now();
        // update() rejects when the server is unreachable; the next check tries again.
        registration.update().catch(() => {});
      };
      // Poll more often than the limit so a check is never much more than five minutes late; `check` throttles it.
      window.setInterval(check, CHECK_EVERY_MS / 4);
      // Reopening an app left in the background does not reload the page, so the browser
      // would not look for a new version on its own: check when it comes back on screen
      // (still at most every five minutes, as tablets are woken many times a day).
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

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
let applying = false;
let reloading = false;
let registration: ServiceWorkerRegistration | undefined;
const listeners = new Set<() => void>();

function markWaiting(): void {
  if (waiting) return;
  waiting = true;
  listeners.forEach((l) => l());
}

function reloadOnce(): void {
  if (reloading || !applying) return;
  reloading = true;
  window.location.reload();
}

/**
 * The browser looks for a new `sw.js` as soon as the page is opened, while the service worker is
 * registered only after the page has loaded: a new version found in between is already installing
 * (or waiting) by then, and the plugin's own events never report it. So watch the registration directly.
 */
function watch(reg: ServiceWorkerRegistration): void {
  // Without a controller this is the first install, not an update.
  const isUpdate = () => Boolean(navigator.serviceWorker.controller);
  const follow = (sw: ServiceWorker | null) => {
    if (!sw) return;
    const onState = () => {
      if (sw.state === 'installed' && reg.waiting === sw && isUpdate()) markWaiting();
    };
    onState();
    sw.addEventListener('statechange', onState);
  };
  if (reg.waiting && isUpdate()) markWaiting();
  follow(reg.installing);
  reg.addEventListener('updatefound', () => follow(reg.installing));
}

/** Call once at startup. */
export function registerUpdates(): void {
  if (!('serviceWorker' in navigator)) return;
  // The new version took over: reload into it, but only when this tab asked for it (from the home screen).
  // When another tab switched, this one keeps going and reloads on its own next visit home.
  navigator.serviceWorker.addEventListener('controllerchange', reloadOnce);
  registerSW({
    onNeedRefresh: markWaiting,
    onNeedReload: reloadOnce,
    onRegisteredSW(_url, reg) {
      if (!reg) return;
      registration = reg;
      watch(reg);
      // Opening the page does not reliably make the browser look for a new version (in Chromium, F5 kept
      // showing the old one for minutes): look once now, then at most every five minutes.
      let lastCheck = 0;
      const check = () => {
        if (waiting || reg.installing || !navigator.onLine || document.visibilityState !== 'visible') return;
        if (Date.now() - lastCheck < CHECK_EVERY_MS) return;
        lastCheck = Date.now();
        // update() rejects when the server is unreachable; the next check tries again.
        reg.update().catch(() => {});
      };
      check();
      // Poll more often than the limit so a check is never much more than five minutes late; `check` throttles it.
      window.setInterval(check, CHECK_EVERY_MS / 4);
      // Reopening an app left in the background does not reload the page, so the browser
      // would not look for a new version on its own: check when it comes back on screen
      // (still at most every five minutes, as tablets are woken many times a day).
      document.addEventListener('visibilitychange', check);
    }
  });
}

/** Looks for a new version now, without waiting for the next timed check. */
export function checkForUpdate(): void {
  const reg = registration;
  if (!reg || waiting || reg.installing || !navigator.onLine) return;
  reg.update().catch(() => {});
}

/** Activates the waiting version; the page reloads into it once it has taken over. */
export function applyUpdate(): void {
  applying = true;
  const next = registration?.waiting;
  if (next) next.postMessage({ type: 'SKIP_WAITING' });
  // Nothing left waiting (another tab already switched): the new version is in charge, just reload.
  else reloadOnce();
}

/** Reloads the app, into the waiting version when there is one (a plain reload would keep the old one). */
export function restartApp(): void {
  if (waiting) applyUpdate();
  else window.location.reload();
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

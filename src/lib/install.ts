// "Add to home screen" support for the parents' corner.
// Chromium browsers fire `beforeinstallprompt` once, early on page load, so it is caught at startup
// (see main.tsx) and kept until a parent taps the install button. Safari has no such event:
// on iPhone and iPad the parent is shown where the Share menu option is instead.

import { useSyncExternalStore } from 'react';

/** Not in TypeScript's DOM lib yet. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * - `installed`: running as the installed app (or just installed from this tab).
 * - `ready`: the browser offers a one-tap install prompt.
 * - `ios`: Safari-style, installed through Share → Add to Home Screen.
 * - `manual`: no prompt available; installed from the browser menu, if the browser supports it.
 */
export type InstallState = 'installed' | 'ready' | 'ios' | 'manual';

let deferred: BeforeInstallPromptEvent | null = null;
let justInstalled = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function runningInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  // iPadOS reports itself as a Mac; touch support gives it away.
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

function getState(): InstallState {
  if (justInstalled || runningInstalled()) return 'installed';
  if (deferred) return 'ready';
  return isIos() ? 'ios' : 'manual';
}

/** Call once at startup, before the browser's install event can fire. */
export function listenForInstall(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // keep the browser's own mini-infobar away from the children
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    justInstalled = true;
    notify();
  });
}

/** Shows the browser's install dialog. The prompt can be used once, whatever the parent chooses. */
export async function promptInstall(): Promise<void> {
  const e = deferred;
  if (!e) return;
  deferred = null;
  await e.prompt();
  const { outcome } = await e.userChoice;
  if (outcome === 'accepted') justInstalled = true;
  notify();
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getState
  );
}

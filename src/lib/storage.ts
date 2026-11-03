// The device's own storage. A browser may block it (a private window, strict settings) or it may be full:
// every call then quietly does nothing, so the app keeps working and only forgets.

type Backend = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Tests hand in their own; the app uses localStorage, which even touching can throw when blocked. */
let override: Backend | null = null;

function backend(): Backend {
  return override ?? globalThis.localStorage;
}

export function setStorageForTests(b: Backend | null): void {
  override = b;
}

/** The saved value; undefined when storage is blocked, so a caller can tell "nothing saved" from "cannot know". */
export function readKey(key: string): string | null | undefined {
  try {
    return backend().getItem(key);
  } catch {
    return undefined;
  }
}

/** False when the value could not be kept (blocked or full storage). */
export function writeKey(key: string, value: string): boolean {
  try {
    backend().setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeKeys(...keys: string[]): void {
  try {
    for (const k of keys) backend().removeItem(k);
  } catch {
    // Blocked storage keeps nothing anyway.
  }
}

/** A saved JSON object, or {} when there is none, it is unreadable, or storage is blocked. */
export function readJson<T extends object>(key: string): Partial<T> {
  try {
    const raw = readKey(key);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Partial<T>) : {};
  } catch {
    return {};
  }
}

// A restart after a crash (see Oops) goes straight back to the world the child was in.
// The world itself is already saved with the progress; this only tells the next page load to skip
// the "Ki játszik?" picker, so the same child lands on their world's home screen again.
// Kept for this tab only (sessionStorage), and read once, when the app loads.

const KEY = 'kalandka.resume';

/** Call just before reloading: the next load continues with the same child in the same world. */
export function markResume(): void {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    // Blocked storage: the reload starts as usual (with the picker on a shared device).
  }
}

function takeResume(): boolean {
  try {
    const marked = sessionStorage.getItem(KEY) === '1';
    sessionStorage.removeItem(KEY);
    return marked;
  } catch {
    return false;
  }
}

/** True when this page load is a restart after a crash. Read at load, so StrictMode's double renders see the same answer. */
export const resumed = takeResume();

import { useEffect, useState } from 'react';

/** The device's time, as "7:15", refreshed when the minute changes (a quiet text change, no motion). */
export function useNowText(): string {
  const read = () => {
    const d = new Date();
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const [text, setText] = useState(read);
  useEffect(() => {
    let timer = 0;
    // Wait for the next whole minute, then check again each minute after it.
    const schedule = () => {
      timer = window.setTimeout(() => {
        setText(read());
        schedule();
      }, 60_000 - (Date.now() % 60_000) + 50);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, []);
  return text;
}

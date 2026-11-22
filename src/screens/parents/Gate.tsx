import { useEffect, useRef, useState } from 'react';
import { LockIcon } from '../../components/ui';
import { useModal } from '../../components/Modal';
import { useBiometric, verifyBiometric } from '../../lib/biometric';
import { gateQuestion } from '../../state/insights';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

/**
 * Parents' gate: a two-digit multiplication young children cannot do yet. When a parent turned on the
 * fingerprint unlock, the device's prompt comes first and the multiplication is one tap away.
 * `scan`: it leads straight to Lap beolvasása instead of the parents' corner; with `onScan` the grown-up picks
 * between the two on a switch at the top, so a finished sheet is two taps from any screen with the lock.
 * The answer is checked as soon as every digit is in, so the keypad has no OK key.
 */
export function Gate({ onPass, onCancel, scan = false, onScan }: { onPass: () => void; onCancel: () => void; scan?: boolean; onScan?: (scan: boolean) => void }) {
  const [q] = useState(() => gateQuestion());
  const [input, setInput] = useState('');
  const [wrong, setWrong] = useState(false);
  const bio = useBiometric();
  const [useMath, setUseMath] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);
  const [bioFailed, setBioFailed] = useState(false);
  const asked = useRef(false);
  const firstKey = useRef<HTMLButtonElement>(null);
  const bioMode = bio.on && !useMath;
  const modal = useModal<HTMLDivElement>();

  useEffect(() => {
    firstKey.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      else if (bioMode) return;
      else if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('del');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const unlock = async () => {
    setBioFailed(false);
    setBioBusy(true);
    const ok = await verifyBiometric();
    setBioBusy(false);
    if (ok) onPass();
    else setBioFailed(true);
  };

  // Ask once as the gate opens; after a cancel the parent taps the button again or switches to the question.
  useEffect(() => {
    if (!bioMode || asked.current) return;
    asked.current = true;
    void unlock();
  });

  const check = (value: string) => {
    if (value === q.answer) {
      onPass();
    } else if (value.length >= q.answer.length) {
      setWrong(true);
      window.setTimeout(() => {
        setInput('');
        setWrong(false);
      }, 1100);
    }
  };

  function press(key: string) {
    if (wrong) return;
    if (key === 'del') return setInput((v) => v.slice(0, -1));
    const next = (input + key).slice(0, q.answer.length);
    setInput(next);
    check(next);
  }

  const fingerprint = (size: number, width: number) => (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 8.5a6.5 6.5 0 0 1 11 0" />
      <path d="M8 19c1-2 1.5-4 1.5-6.5a2.5 2.5 0 0 1 5 0c0 1.5-.2 3-.7 4.5" />
      <path d="M12 12.5c0 3-.8 5.5-2.2 7.5" />
      <path d="M17.5 12.5c0 2-.3 3.8-.9 5.5" />
      <path d="M6 12.5c0 1.6-.3 3-.9 4.2" />
    </svg>
  );

  const head = (lead: string) => (
    <div className="gate__head">
      <span className="gate__lock" aria-hidden="true">
        <LockIcon size={24} />
      </span>
      <div className="gate__heading">
        <h1 id="gate-title" className="gate__title">
          Csak felnőtteknek
        </h1>
        <p className="gate__lead">{lead}</p>
      </div>
      <button type="button" className="gate__close" aria-label="Bezárás, vissza a játékhoz" onClick={onCancel}>
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );

  // Where the gate leads. Without `onScan` the destination is fixed, and the lead says it instead.
  const dest = onScan && (
    <div className="gate__dest" role="radiogroup" aria-label="Hova lépsz tovább?">
      <button type="button" role="radio" aria-checked={!scan} className="gate__seg" onClick={() => scan && onScan(false)}>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20V10l8-6 8 6v10" />
          <path d="M10 20v-6h4v6" />
        </svg>
        Szülői sarok
      </button>
      <button type="button" role="radio" aria-checked={scan} className="gate__seg" onClick={() => !scan && onScan(true)}>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 8V5h3M17 5h3v3M20 16v3h-3M7 19H4v-3" />
          <path d="M8 12h8" />
        </svg>
        Lap beolvasása
      </button>
    </div>
  );

  const cancel = (
    <button type="button" className="gate__cancel" onClick={onCancel}>
      Vissza a játékhoz
    </button>
  );

  if (bioMode) {
    return (
      <div className="gate" ref={modal}>
        <section className="gate__card gate__card--bio" role="dialog" aria-modal="true" aria-labelledby="gate-title">
          {head(onScan || !scan ? 'Oldd fel a készülék zárjával.' : 'Oldd fel, utána rögtön nyílik a kamera.')}
          {dest}
          <div className="gate__print">
            <span className="gate__print-ring" aria-hidden="true">
              {fingerprint(56, 1.8)}
            </span>
            <p className="gate__print-text">Érintsd az ujjad az érzékelőhöz{scan ? '. Utána rögtön nyílik a kamera.' : ', vagy nézz a kamerába.'}</p>
          </div>
          <button type="button" className="gate__bio" disabled={bioBusy} onClick={() => void unlock()}>
            {fingerprint(24, 2.2)}
            Feloldás ujjlenyomattal
          </button>
          <p className="gate__msg is-wrong" role="status">
            {bioFailed ? 'Nem sikerült. Próbáld újra, vagy válaszd a szorzásos feladatot.' : ''}
          </p>
          <div className="gate__or" aria-hidden="true">
            vagy
          </div>
          <button type="button" className="gate__switch" onClick={() => setUseMath(true)}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <rect x="4" y="4" width="4" height="4" rx="1" />
              <rect x="10" y="4" width="4" height="4" rx="1" />
              <rect x="16" y="4" width="4" height="4" rx="1" />
              <rect x="4" y="10" width="4" height="4" rx="1" />
              <rect x="10" y="10" width="4" height="4" rx="1" />
              <rect x="16" y="10" width="4" height="4" rx="1" />
              <rect x="10" y="16" width="4" height="4" rx="1" />
            </svg>
            Szorzásos feladat helyette
          </button>
          {cancel}
        </section>
      </div>
    );
  }

  const slots = Array.from({ length: q.answer.length }, (_, i) => input[i] ?? '');
  const idle = scan ? 'A helyes válasz után rögtön nyílik a kamera.' : 'Beírás után magától továbblép.';

  return (
    <div className="gate" ref={modal}>
      <section className="gate__card" role="dialog" aria-modal="true" aria-labelledby="gate-title">
        {head(onScan || !scan ? 'Oldd meg a feladatot a továbblépéshez.' : 'Oldd meg, utána rögtön nyílik a kamera.')}
        {dest}
        <div className={`gate__sum${wrong ? ' is-wrong' : ''}`}>
          <span className="gate__task">
            {q.a} × {q.b} =
          </span>
          <output className="gate__answer" aria-label={input ? `Válasz: ${input}` : 'Még nincs válasz'}>
            {slots.map((ch, i) => (
              <span key={i} className={`gate__slot${!wrong && i === input.length ? ' is-next' : ''}`}>
                {ch}
              </span>
            ))}
          </output>
        </div>
        <p className={`gate__msg${wrong ? ' is-wrong' : ''}`} role="status">
          {wrong ? 'Nem ez az eredmény. Próbáld újra!' : idle}
        </p>
        <div className={`gate__keys${wrong ? ' is-locked' : ''}`}>
          {DIGITS.map((k, i) => (
            <button key={k} ref={i === 0 ? firstKey : undefined} type="button" className="gate__key" onClick={() => press(k)}>
              {k}
            </button>
          ))}
          <span aria-hidden="true" />
          <button type="button" className="gate__key" onClick={() => press('0')}>
            0
          </button>
          <button type="button" className="gate__key gate__key--del" onClick={() => press('del')} aria-label="Törlés">
            <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5h11v14H9l-6-7z" />
              <path d="M13 9.5l4 5M17 9.5l-4 5" />
            </svg>
          </button>
        </div>
        {bio.on && (
          <button type="button" className="gate__switch" onClick={() => setUseMath(false)}>
            {fingerprint(20, 2.2)}
            Inkább ujjlenyomattal
          </button>
        )}
        {cancel}
      </section>
    </div>
  );
}

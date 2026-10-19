import { useEffect, useRef, useState } from 'react';
import { LockIcon } from '../../components/ui';
import { useBiometric, verifyBiometric } from '../../lib/biometric';
import { gateQuestion } from '../../state/insights';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'] as const;

/**
 * Parents' gate: a two-digit multiplication young children cannot do yet. When a parent turned on the
 * fingerprint unlock, the device's prompt comes first and the multiplication is one tap away.
 */
export function Gate({ onPass, onCancel }: { onPass: () => void; onCancel: () => void }) {
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
      }, 900);
    }
  };

  function press(key: (typeof KEYS)[number] | string) {
    if (wrong) return;
    if (key === 'del') return setInput((v) => v.slice(0, -1));
    if (key === 'ok') return check(input);
    const next = (input + key).slice(0, q.answer.length);
    setInput(next);
    check(next);
  }

  const fingerprint = (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 8.5a6.5 6.5 0 0 1 11 0" />
      <path d="M8 19c1-2 1.5-4 1.5-6.5a2.5 2.5 0 0 1 5 0c0 1.5-.2 3-.7 4.5" />
      <path d="M12 12.5c0 3-.8 5.5-2.2 7.5" />
      <path d="M17.5 12.5c0 2-.3 3.8-.9 5.5" />
      <path d="M6 12.5c0 1.6-.3 3-.9 4.2" />
    </svg>
  );

  if (bioMode) {
    return (
      <div className="gate">
        <section className="gate__card gate__card--bio" role="dialog" aria-modal="true" aria-labelledby="gate-title">
          <span className="gate__lock" aria-hidden="true">
            <LockIcon size={28} />
          </span>
          <h1 id="gate-title" className="gate__title">
            Szülői sarok
          </h1>
          <p className="gate__lead">Csak felnőtteknek. Oldd fel ujjlenyomattal vagy arcfelismeréssel.</p>
          <button type="button" className="gate__bio gate__bio--main" disabled={bioBusy} onClick={() => void unlock()}>
            {fingerprint}
            Feloldás ujjlenyomattal
          </button>
          <p className="gate__msg" role="status">
            {bioFailed ? 'Nem sikerült. Próbáld újra, vagy válaszd a szorzásos kérdést.' : ''}
          </p>
          <button type="button" className="gate__switch" onClick={() => setUseMath(true)}>
            Szorzásos kérdés helyette
          </button>
          <button type="button" className="gate__cancel" onClick={onCancel}>
            Mégse, vissza a játékhoz
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="gate">
      <section className="gate__card" role="dialog" aria-modal="true" aria-labelledby="gate-title">
        <span className="gate__lock" aria-hidden="true">
          <LockIcon size={28} />
        </span>
        <h1 id="gate-title" className="gate__title">
          Szülői sarok
        </h1>
        <p className="gate__lead">Csak felnőtteknek. Írd be az eredményt:</p>
        <div className="gate__sum">
          <span>
            {q.a} × {q.b} =
          </span>
          <output className={`gate__answer${wrong ? ' is-wrong' : ''}`} aria-live="polite">
            {input || '?'}
          </output>
        </div>
        <div className="gate__keys">
          {KEYS.map((k, i) => (
            <button
              key={k}
              ref={i === 0 ? firstKey : undefined}
              type="button"
              className={`gate__key${k === 'ok' ? ' gate__key--ok' : ''}${k === 'del' ? ' gate__key--del' : ''}`}
              onClick={() => press(k)}
              aria-label={k === 'del' ? 'Törlés' : k === 'ok' ? 'Kész' : k}
            >
              {k === 'del' ? (
                <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5h11v14H9l-6-7z" />
                  <path d="M13 9l4 6M17 9l-4 6" />
                </svg>
              ) : k === 'ok' ? (
                <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              ) : (
                k
              )}
            </button>
          ))}
        </div>
        <p className="gate__msg" role="status">
          {wrong ? 'Nem ez az eredmény. Próbáld újra!' : ''}
        </p>
        {bio.on && (
          <button type="button" className="gate__switch" onClick={() => setUseMath(false)}>
            Inkább ujjlenyomattal
          </button>
        )}
        <button type="button" className="gate__cancel" onClick={onCancel}>
          Mégse, vissza a játékhoz
        </button>
      </section>
    </div>
  );
}

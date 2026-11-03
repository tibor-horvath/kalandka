import { useEffect } from 'react';
import { Csepi } from '../components/Csepi';
import { LockIcon } from '../components/ui';
import { speak } from '../lib/speech';

const DAY_REST = {
  title: 'Mára elég volt!',
  text: 'A virágok is pihennek. Holnap újra várlak a kertben!',
  speech: 'Mára elég volt a játékból. A virágok is pihennek. Holnap újra várlak a kertben!'
};
const EVENING_REST = {
  title: 'Jó éjszakát!',
  text: 'Este van, a kert is alszik. Reggel újra várlak!',
  speech: 'Este van, a kert is alszik. Jó éjszakát! Reggel újra várlak.'
};

/**
 * Shown when today's play time is used up, or during evening rest. Only the parents' gate leads on;
 * on a shared device a sibling whose own time is left can take over (onSwitch).
 */
export function Rest({ evening = false, onParents, onSwitch }: { evening?: boolean; onParents: () => void; onSwitch?: () => void }) {
  const copy = evening ? EVENING_REST : DAY_REST;

  useEffect(() => {
    speak(copy.speech);
  }, [copy.speech]);

  return (
    <div className="rest" role="dialog" aria-modal="true" aria-labelledby="rest-title">
      <svg className="rest__moon" aria-hidden="true" width="120" height="120" viewBox="0 0 120 120">
        <path d="M78 14 A48 48 0 1 0 106 78 A38 38 0 1 1 78 14 Z" fill="#FFE08A" />
        <circle cx="24" cy="30" r="3" fill="#FFFFFF" />
        <circle cx="100" cy="18" r="2" fill="#FFFFFF" />
        <circle cx="12" cy="88" r="2.5" fill="#FFFFFF" />
      </svg>
      <Csepi mood="sleep" width={130} />
      <h1 id="rest-title" className="rest__title">
        {copy.title}
      </h1>
      <p className="rest__text">{copy.text}</p>
      <div className="rest__actions">
        {onSwitch && (
          <button type="button" className="parents-btn parents-btn--night" onClick={onSwitch}>
            Másik gyerkőc játszik
          </button>
        )}
        <button type="button" className="parents-btn parents-btn--night" onClick={onParents}>
          <LockIcon size={22} />
          Szülőknek
        </button>
      </div>
    </div>
  );
}

/** Small badge in the last two minutes: "Még 2 perc". */
export function TimeBanner({ remaining }: { remaining: number }) {
  const minutes = Math.max(1, Math.ceil(remaining / 60));
  const text = remaining <= 0 ? 'Ez az utolsó feladat!' : `Még ${minutes} perc játék`;
  return (
    <div className="time-banner" role="status">
      <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2.5 2" />
        <path d="M9 2.5h6" />
      </svg>
      {text}
    </div>
  );
}

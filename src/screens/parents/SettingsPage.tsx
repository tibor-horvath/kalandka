import { useState } from 'react';
import { DEFAULT_PROGRESS, useProgress } from '../../state/progress';
import { Check } from './controls';

export function SettingsPage() {
  const { progress, update } = useProgress();
  const [confirming, setConfirming] = useState(false);

  // Game progress starts over; settings and today's play time stay (a reset is not extra screen time).
  const reset = () => {
    update((p) => ({
      ...DEFAULT_PROGRESS,
      voice: p.voice,
      sounds: p.sounds,
      voiceRate: p.voiceRate,
      unlockAll: p.unlockAll,
      screenLimitMin: p.screenLimitMin,
      playDate: p.playDate,
      playSeconds: p.playSeconds,
      bonusSeconds: p.bonusSeconds,
      playHistory: p.playHistory,
      restDay: p.restDay,
      eveningRest: p.eveningRest,
      eveningFrom: p.eveningFrom,
      warnBefore: p.warnBefore,
      graceToFinish: p.graceToFinish,
      welcomed: p.welcomed
    }));
    setConfirming(false);
  };

  return (
    <div className="pa-page">
      <header className="pa-head">
        <h1 className="pa-h1">Beállítások</h1>
      </header>

      <section className="pa-card" aria-labelledby="s-voice">
        <h2 id="s-voice" className="pa-h2">
          Csepi hangja
        </h2>
        <Check
          id="s-voice-on"
          checked={progress.voice}
          onChange={(v) => update((p) => ({ ...p, voice: v }))}
          title="Csepi felolvas és számol"
          hint="Ha ki van kapcsolva, minden szöveg ugyanúgy megjelenik a buborékban."
        />
        <Check
          id="s-sounds-on"
          checked={progress.sounds}
          onChange={(v) => update((p) => ({ ...p, sounds: v }))}
          title="Hangeffektek"
          hint="Buborékpukkanás és csilingelés a Mézútban, és egy halk rezgés, ha a táblagép tud rezegni."
        />
        <div className="pa-spread">
          <span id="s-tempo" className="pa-stack">
            <b>Beszéd tempója</b>
            <small>Kisebbeknek a lassú a jobb.</small>
          </span>
          <div className="pa-seg pa-seg--pill" role="radiogroup" aria-labelledby="s-tempo">
            {(
              [
                ['slow', 'Lassú'],
                ['normal', 'Normál']
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={progress.voiceRate === id}
                disabled={!progress.voice}
                className={`pa-seg__btn${progress.voiceRate === id ? ' is-on' : ''}`}
                onClick={() => update((p) => ({ ...p, voiceRate: id }))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="pa-card" aria-labelledby="s-data">
        <h2 id="s-data" className="pa-h2">
          Adatok és biztonság
        </h2>
        <ul className="pa-list">
          <li>A haladás csak ezen az eszközön tárolódik, nincs fiók és nincs felhő.</li>
          <li>Nincs reklám, csevegés és alkalmazáson belüli vásárlás.</li>
          <li>Telepítés után internet nélkül is működik.</li>
        </ul>
      </section>

      <section className="pa-card pa-card--warn" aria-labelledby="s-reset">
        <h2 id="s-reset" className="pa-h2 pa-h2--warn">
          Haladás törlése
        </h2>
        <p className="pa-muted">Törli a kertet, a magokat és a játékok szintjeit. A beállítások és a mai játékidő megmaradnak.</p>
        {confirming ? (
          <div className="pa-confirm" role="alert">
            <span>Biztosan törlöd? Ez nem vonható vissza.</span>
            <button type="button" className="pa-btn pa-btn--quiet" onClick={() => setConfirming(false)}>
              Mégse
            </button>
            <button type="button" className="pa-btn pa-btn--danger" onClick={reset}>
              Igen, törlöm
            </button>
          </div>
        ) : (
          <div>
            <button type="button" className="pa-btn pa-btn--warn" onClick={() => setConfirming(true)}>
              Haladás törlése…
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

import { useState, useSyncExternalStore } from 'react';
import { promptInstall, useInstallState } from '../../lib/install';
import { hungarianVoices, onVoicesChanged, speak, type Speaker } from '../../lib/speech';
import { DEFAULT_PROGRESS, useProgress } from '../../state/progress';
import { Check } from './controls';

export function SettingsPage({ onLegal }: { onLegal: () => void }) {
  const { progress, update } = useProgress();
  const [confirming, setConfirming] = useState(false);

  // Game progress starts over; settings and today's play time stay (a reset is not extra screen time).
  const reset = () => {
    update((p) => ({
      ...DEFAULT_PROGRESS,
      voice: p.voice,
      sounds: p.sounds,
      voiceRate: p.voiceRate,
      csepiVoice: p.csepiVoice,
      robotVoice: p.robotVoice,
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
          Hangok
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
        <VoicePicker />
      </section>

      <InstallCard />

      <section className="pa-card" aria-labelledby="s-data">
        <h2 id="s-data" className="pa-h2">
          Adatok és biztonság
        </h2>
        <ul className="pa-list">
          <li>A haladás csak ezen az eszközön tárolódik, nincs fiók és nincs felhő.</li>
          <li>Nincs reklám, csevegés és alkalmazáson belüli vásárlás.</li>
          <li>Telepítés után internet nélkül is működik.</li>
        </ul>
        <div>
          <button type="button" className="pa-btn pa-btn--quiet" onClick={onLegal}>
            Adatkezelési tájékoztató és impresszum
          </button>
        </div>
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

const VOICE_ROWS: { who: Speaker; key: 'csepiVoice' | 'robotVoice'; label: string; sample: string }[] = [
  { who: 'csepi', key: 'csepiVoice', label: 'Csepi hangja', sample: 'Szia! Én vagyok Csepi. Gyere, játsszunk!' },
  { who: 'robot', key: 'robotVoice', label: 'Csavar hangja', sample: 'Csavar vagyok. Indulhat a munka!' }
];

/** Advanced: a Hungarian voice for each character; other languages would mangle the Hungarian text. */
function VoicePicker() {
  const { progress, update } = useProgress();
  const voices = useSyncExternalStore(onVoicesChanged, hungarianVoices);

  return (
    <details className="pa-more">
      <summary>Haladó beállítások</summary>
      {voices.length === 0 ? (
        <p className="pa-muted">
          Ezen az eszközön nincs telepített magyar hang, ezért nem lehet választani. A Windows beállításaiban (Idő és nyelv → Beszéd) vagy a
          telefon szövegfelolvasó beállításaiban adhatsz hozzá magyar hangot.
        </p>
      ) : (
        <>
          <p className="pa-muted">Csak a készüléken elérhető magyar hangok közül lehet választani. Az „Automatikus” a legjobban illőt keresi meg.</p>
          {VOICE_ROWS.map(({ who, key, label, sample }) => {
            const value = voices.some((v) => v.name === progress[key]) ? progress[key] : '';
            return (
              <div key={who} className="pa-inline-field pa-voice">
                <label htmlFor={`s-voice-${who}`}>{label}</label>
                <select
                  id={`s-voice-${who}`}
                  value={value}
                  disabled={!progress.voice}
                  onChange={(e) => update((p) => ({ ...p, [key]: e.target.value }))}
                >
                  <option value="">Automatikus</option>
                  {voices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.localService ? v.name : `${v.name} (internetes)`}
                    </option>
                  ))}
                </select>
                <button type="button" className="pa-btn pa-btn--quiet" disabled={!progress.voice} onClick={() => speak(sample, { as: who })}>
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5.5v13l11-6.5z" />
                  </svg>
                  Meghallgatom
                </button>
              </div>
            );
          })}
        </>
      )}
    </details>
  );
}

function InstallCard() {
  const state = useInstallState();

  return (
    <section className="pa-card" aria-labelledby="s-install">
      <h2 id="s-install" className="pa-h2">
        Telepítés a kezdőképernyőre
      </h2>
      {state === 'installed' ? (
        <div className="pa-note pa-note--good" role="status">
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          <p>
            <b>A Kalandka telepítve van.</b> A kezdőképernyőn lévő ikonjával indítsd: teljes képernyőn, internet nélkül is működik.
          </p>
        </div>
      ) : (
        <>
          <p className="pa-muted">
            Telepítve saját ikonnal, teljes képernyőn indul, böngészősáv nélkül, és internet nélkül is működik. A haladás megmarad.
          </p>
          {state === 'ready' && (
            <div>
              <button type="button" className="pa-btn" onClick={() => void promptInstall()}>
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v11" />
                  <path d="M7 10l5 5 5-5" />
                  <path d="M5 20h14" />
                </svg>
                Kalandka telepítése
              </button>
            </div>
          )}
          {state === 'ios' && (
            <ol className="pa-list">
              <li>
                Nyisd meg az oldalt a <b>Safariban</b>.
              </li>
              <li>
                Koppints a <b>Megosztás</b> gombra (négyzet felfelé mutató nyíllal).
              </li>
              <li>
                Válaszd a <b>Főképernyőhöz adás</b> lehetőséget, majd a <b>Hozzáadás</b> gombot.
              </li>
            </ol>
          )}
          {state === 'manual' && (
            <p className="pa-muted">
              Nyisd meg a böngésző menüjét (⋮), és válaszd az <b>Alkalmazás telepítése</b> vagy a <b>Hozzáadás a kezdőképernyőhöz</b> lehetőséget. Ha
              nincs ilyen, nyisd meg az oldalt Chrome-ban vagy Edge-ben.
            </p>
          )}
        </>
      )}
    </section>
  );
}

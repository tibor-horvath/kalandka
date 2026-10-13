import { useProgress } from '../../state/progress';
import { EVENING_OPTIONS, LIMIT_OPTIONS, addBonus, formatMinutes, playedToday, remainingSeconds, restNow, today } from '../../state/screenTime';
import { Check } from './controls';

export function TimePage() {
  const { progress, update } = useProgress();
  const day = today();
  const played = playedToday(progress, day);
  const limit = progress.screenLimitMin;
  const left = remainingSeconds(progress, day);
  const restingNow = progress.restDay === day;
  const share = limit ? Math.min(1, played / (limit * 60 + (progress.playDate === day ? progress.bonusSeconds : 0))) : 0;

  const status = restingNow ? 'Ma már pihenő van' : !limit ? 'Nincs napi korlát' : left > 0 ? `Még ${formatMinutes(left)}` : 'Lejárt, jön a pihenő';

  return (
    <div className="pa-page">
      <header className="pa-head">
        <div>
          <h1 className="pa-h1">Képernyőidő</h1>
          <p className="pa-lead">Csak az aktív játék számít: ha az alkalmazás a háttérben van, vagy itt vagy, az óra áll.</p>
        </div>
      </header>

      <section className="pa-card" aria-labelledby="t-limit">
        <h2 id="t-limit" className="pa-h2">
          Napi játékidő
        </h2>
        <div className="pa-seg pa-seg--8" role="radiogroup" aria-labelledby="t-limit">
          {LIMIT_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={limit === m}
              className={`pa-seg__btn${limit === m ? ' is-on' : ''}`}
              onClick={() => update((p) => ({ ...p, screenLimitMin: m }))}
            >
              {m === 0 ? 'Nincs' : `${m} perc`}
            </button>
          ))}
        </div>
        <div className="pa-progress">
          <div className="pa-spread">
            <span>
              Ma eddig <b>{formatMinutes(played)}</b>
            </span>
            <span className="pa-muted">{status}</span>
          </div>
          {limit > 0 && (
            <div className="pa-meter pa-meter--big" aria-hidden="true">
              <div className={left <= 0 ? 'is-over' : ''} style={{ width: `${Math.round(share * 100)}%` }} />
            </div>
          )}
        </div>
        <div className="pa-row">
          {(limit > 0 || restingNow) && (
            <button type="button" className="pa-btn" onClick={() => update((p) => addBonus(p, today()))}>
              +10 perc ma
            </button>
          )}
          <button type="button" className="pa-btn pa-btn--quiet" disabled={restingNow} onClick={() => update((p) => restNow(p, today()))}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
            </svg>
            {restingNow ? 'Ma már pihenő van' : 'Pihenő most'}
          </button>
        </div>
      </section>

      <div className="pa-grid2">
        <section className="pa-card" aria-labelledby="t-end">
          <h2 id="t-end" className="pa-h2">
            A játék vége
          </h2>
          <Check
            id="t-warn"
            checked={progress.warnBefore}
            onChange={(v) => update((p) => ({ ...p, warnBefore: v }))}
            title="Csepi 2 perccel előtte szól"
            hint="Egy kis jelvény is megjelenik: „Még 2 perc”."
          />
          <Check
            id="t-grace"
            checked={progress.graceToFinish}
            onChange={(v) => update((p) => ({ ...p, graceToFinish: v }))}
            title="A megkezdett feladat befejezhető"
            hint="Legfeljebb 2 perc ráadás, aztán jön a pihenő."
          />
        </section>

        <section className="pa-card" aria-labelledby="t-night">
          <h2 id="t-night" className="pa-h2">
            Esti pihenő
          </h2>
          <Check
            id="t-evening"
            checked={progress.eveningRest}
            onChange={(v) => update((p) => ({ ...p, eveningRest: v }))}
            title="Este nem lehet játszani"
            hint="Ettől az időponttól reggel 7-ig a pihenőképernyő látszik."
          />
          <div className="pa-inline-field">
            <label htmlFor="t-evening-from">Kezdete</label>
            <select
              id="t-evening-from"
              value={progress.eveningFrom}
              disabled={!progress.eveningRest}
              onChange={(e) => update((p) => ({ ...p, eveningFrom: Number(e.target.value) }))}
            >
              {EVENING_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h}:00
                </option>
              ))}
            </select>
          </div>
        </section>
      </div>
    </div>
  );
}

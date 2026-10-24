import { LEVEL_SETTINGS } from '../../state/levels';
import { markEarnedSeen } from '../../state/rewards';
import { useProgress } from '../../state/progress';
import { WORLDS } from '../../state/worlds';
import { Check, WorldGroup } from './controls';

/** Short skill and progress mode per game, shown under its name. */
const ABOUT: Record<string, { skill: string; mode: string; glyph: string; tile: string }> = {
  learn: { skill: 'számok 1–20', mode: 'Sorban halad 20-ig', glyph: '12', tile: 'pa-tile--blue' },
  water: { skill: 'számolás', mode: 'Az első kör után magától nehezedik', glyph: '10', tile: 'pa-tile--sky' },
  patterns: { skill: 'mintázatok', mode: 'A minták körbejárnak', glyph: 'AB', tile: 'pa-tile--pink' },
  flash: { skill: 'mennyiség ránézésre', mode: '4 jó válasz után magától lép', glyph: '5', tile: 'pa-tile--sand' },
  add: { skill: 'összeadás és kivonás', mode: 'Csepi ajánl, a gyerek dönt', glyph: '+', tile: 'pa-tile--sun' },
  pots: { skill: 'tízes barátok', mode: '5 jó válasz után magától lép', glyph: '3+7', tile: 'pa-tile--pink' },
  path: { skill: 'programozás', mode: '5 pálya után magától lép', glyph: '↑→', tile: 'pa-tile--sky' },
  sort: { skill: 'csoportosítás, szabályok', mode: '5 kör után magától lép', glyph: '●▲', tile: 'pa-tile--sand' },
  scale: { skill: 'több, kevesebb, egyenlő', mode: '5 kör után magától lép', glyph: '=', tile: 'pa-tile--sun' },
  seq: { skill: 'mintázatok, szabályok', mode: '5 kör után magától lép', glyph: 'AB?', tile: 'pa-tile--blue' },
  mirror: { skill: 'tükrözés, szimmetria', mode: '5 kör után magától lép', glyph: '•|•', tile: 'pa-tile--sky' },
  code: { skill: 'jelek és kódok', mode: '5 kör után magától lép', glyph: '●→?', tile: 'pa-tile--sand' }
};

export function LevelsPage() {
  const { progress, update } = useProgress();

  return (
    <div className="pa-page">
      <header className="pa-head">
        <div>
          <h1 className="pa-h1">Szintek</h1>
          <p className="pa-lead">Itt adod meg, honnan induljon egy játék. Onnan magától nehezedik tovább.</p>
        </div>
      </header>

      {WORLDS.map((w) => (
        <WorldGroup key={w.id} world={w} heading="h2">
          {w.id === 'garden' && (
            <div className="pa-card pa-card--tight">
              <Check
                id="l-unlock"
                checked={progress.unlockAll}
                onChange={(v) => update((p) => ({ ...p, unlockAll: v }))}
                title="Minden játék nyitva"
                hint="Nagyobb gyerekeknek: nem kell végigjátszani a Számvetést a többi játék előtt."
              />
            </div>
          )}
          <div className="pa-levels">
            {LEVEL_SETTINGS.filter((s) => s.world === w.id).map((s) => {
              const about = ABOUT[s.id];
              const idx = Math.max(0, s.options.findIndex((o) => o.value === s.current(progress)));
              const atMin = idx === 0;
              const atMax = idx === s.options.length - 1;
              // A starting level set here is not something the child played for: no sticker celebration for it.
              const go = (step: number) => update((p) => markEarnedSeen(s.apply(p, s.options[idx + step].value)));
              return (
                <section key={s.id} className="pa-level" aria-label={s.game}>
                  <div className={`pa-tile ${about.tile}`} aria-hidden="true">
                    {about.glyph}
                  </div>
                  <div className="pa-level__text">
                    <div className="pa-level__title">
                      <h3>{s.game}</h3>
                      <span>{about.skill}</span>
                    </div>
                    <span className="pa-level__mode">{about.mode}</span>
                  </div>
                  <div className="pa-stepper">
                    <button type="button" className="pa-stepper__btn" disabled={atMin} onClick={() => go(-1)} aria-label={`${s.game}: könnyebb szint`}>
                      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <path d="M5 12h14" />
                      </svg>
                    </button>
                    <div className="pa-stepper__value" aria-live="polite">
                      <span>{`${idx + 1}. ${s.options[idx].label.replace(/^\d+\.\s*/, '')}`}</span>
                      <span className="pa-dots" aria-hidden="true">
                        {s.options.map((o, k) => (
                          <i key={o.value} className={k <= idx ? (k === idx ? 'is-now' : 'is-done') : ''} />
                        ))}
                      </span>
                    </div>
                    <button type="button" className="pa-stepper__btn pa-stepper__btn--up" disabled={atMax} onClick={() => go(1)} aria-label={`${s.game}: nehezebb szint`}>
                      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                      </svg>
                    </button>
                  </div>
                </section>
              );
            })}
          </div>
        </WorldGroup>
      ))}
    </div>
  );
}

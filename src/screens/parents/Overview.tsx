import { insights } from '../../state/insights';
import { LEVEL_SETTINGS } from '../../state/levels';
import { useProgress } from '../../state/progress';
import { BONUS_OPTIONS, addBonus, lastSevenDays, playedToday, remainingSeconds, today } from '../../state/screenTime';
import { ADD_LEVELS, clampLevel, LEVEL_UP_STREAK } from '../../games/add/logic';
import { LEARN_MAX } from '../../games/learn/logic';
import { TRACE_ORDER, buildTraceRound } from '../../games/trace/logic';
import { PATH_LEVELS, pathLevelIndex } from '../../games/robot/path';
import { SORT_LEVELS, sortLevelIndex } from '../../games/robot/sort';
import { POTS_LEVELS, potsLevelFor } from '../../games/pots/logic';
import { LEVELS as FLASH_LEVELS, levelFor } from '../../games/flash/logic';
import { SHAPE_ORDER } from '../../games/patterns/logic';
import { PLANTS } from '../../games/water/logic';
import type { ParentPage } from './ParentArea';

const DATE_FMT = new Intl.DateTimeFormat('hu-HU', { month: 'long', day: 'numeric', weekday: 'long' });

/** Minutes ring for today. With no limit it shows the minutes alone. */
function TodayRing({ played, limit }: { played: number; limit: number }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const share = limit ? Math.min(1, played / limit) : 0;
  const over = limit > 0 && played >= limit;
  return (
    <svg role="img" aria-label={limit ? `Ma ${played} perc a ${limit} percből` : `Ma ${played} perc`} width="128" height="128" viewBox="0 0 128 128">
      <circle cx="64" cy="64" r={r} fill="none" stroke="#E3EBF1" strokeWidth="14" />
      {limit > 0 && (
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke={over ? '#F2A65A' : '#2E86DE'}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${share * c} ${c}`}
          transform="rotate(-90 64 64)"
        />
      )}
      <text x="64" y={limit ? 62 : 70} textAnchor="middle" className="pa-ring__num">
        {played}
      </text>
      <text x="64" y={limit ? 84 : 92} textAnchor="middle" className="pa-ring__unit">
        {limit ? `/ ${limit} perc` : 'perc'}
      </text>
    </svg>
  );
}

export function Overview({ onGo }: { onGo: (page: ParentPage) => void }) {
  const { progress, update } = useProgress();
  const now = new Date();
  const day = today(now);
  const played = Math.floor(playedToday(progress, day) / 60);
  const limit = progress.screenLimitMin;
  const left = remainingSeconds(progress, day);
  const week = lastSevenDays(progress, now);
  const avg = Math.round(week.reduce((s, d) => s + d.minutes, 0) / 7);
  const scaleMax = Math.max(limit, ...week.map((d) => d.minutes), 10);
  const notes = insights(progress, day);

  const setting = (id: string) => LEVEL_SETTINGS.find((s) => s.id === id)!;
  const levelShare = (id: string) => {
    const s = setting(id);
    const idx = s.options.findIndex((o) => o.value === s.current(progress));
    return (idx + 1) / s.options.length;
  };
  const addLevel = ADD_LEVELS[clampLevel(progress.addLevel)];
  const flashIdx = FLASH_LEVELS.indexOf(levelFor(progress.flashSolved));
  const learned = Math.min(LEARN_MAX, progress.learnSolved);
  const potsIdx = POTS_LEVELS.indexOf(potsLevelFor(progress.potsSolved));
  const games = [
    { name: 'Számvetés', detail: `${learned} / ${LEARN_MAX} szám`, share: learned / LEARN_MAX },
    {
      name: 'Locsolás',
      detail: `${progress.garden.length} virág · ${progress.waterRound >= PLANTS.length ? '11–20' : '2–10'} csepp`,
      share: levelShare('water')
    },
    { name: 'Virágsor', detail: `${progress.patternsSolved} sor · ${SHAPE_ORDER[progress.patternRound % SHAPE_ORDER.length]} minta`, share: levelShare('patterns') },
    { name: 'Magvillantás', detail: `${flashIdx + 1}. szint · ${FLASH_LEVELS[flashIdx].name}`, share: levelShare('flash') },
    {
      name: 'Mézút',
      detail: `${progress.traceSolved} leírt szám${progress.traceFadedSolved ? ` (${progress.traceFadedSolved} halvány úton)` : ''} · következő: ${buildTraceRound(progress.traceRound).digit}`,
      // First lap on the full trail, then the faded lap.
      share: Math.min(1, (Math.min(progress.traceSolved - progress.traceFadedSolved, TRACE_ORDER.length) + progress.traceFadedSolved) / (2 * TRACE_ORDER.length))
    },
    {
      name: 'Méhecske',
      detail: `${clampLevel(progress.addLevel) + 1}. szint · ${addLevel.name} · ${progress.addStreak}/${LEVEL_UP_STREAK} csillag`,
      share: levelShare('add')
    },
    { name: 'Cserépbarátok', detail: `${potsIdx + 1}. szint · ${POTS_LEVELS[potsIdx].name}`, share: levelShare('pots') },
    {
      name: 'Robotút',
      detail: `${progress.pathSolved} pálya · ${pathLevelIndex(progress.pathSolved) + 1}. szint · ${PATH_LEVELS[pathLevelIndex(progress.pathSolved)].name}`,
      share: levelShare('path')
    },
    {
      name: 'Válogatógép',
      detail: `${progress.sortSolved} kör · ${sortLevelIndex(progress.sortSolved) + 1}. szint · ${SORT_LEVELS[sortLevelIndex(progress.sortSolved)].name}`,
      share: levelShare('sort')
    }
  ];

  return (
    <div className="pa-page">
      <header className="pa-head">
        <div>
          <div className="pa-head__date">Ma · {DATE_FMT.format(now)}</div>
          <h1 className="pa-h1">Áttekintés</h1>
        </div>
      </header>

      <div className="pa-grid2">
        <section className="pa-card pa-today" aria-labelledby="ov-today">
          <TodayRing played={played} limit={limit} />
          <div className="pa-today__text">
            <h2 id="ov-today" className="pa-eyebrow">
              Mai játékidő
            </h2>
            <div className="pa-big">{!limit ? 'Nincs napi korlát' : left > 0 ? `Még ${Math.max(1, Math.ceil(left / 60))} perc` : 'Lejárt'}</div>
            <div className="pa-muted">{limit ? 'A pihenő előtt Csepi szól.' : 'Napi keretet a Képernyőidő oldalon adhatsz meg.'}</div>
            <div className="pa-row">
              {limit > 0 &&
                BONUS_OPTIONS.map((m) => (
                  <button key={m} type="button" className="pa-btn" onClick={() => update((p) => addBonus(p, today(), m * 60))}>
                    +{m} perc ma
                  </button>
                ))}
              <button type="button" className="pa-link" onClick={() => onGo('time')}>
                Beállítás
              </button>
            </div>
          </div>
        </section>

        <section className="pa-card pa-week" aria-labelledby="ov-week">
          <div className="pa-spread">
            <h2 id="ov-week" className="pa-eyebrow">
              Az elmúlt 7 nap
            </h2>
            <span className="pa-muted">
              Átlag <b>{avg} perc</b> / nap
            </span>
          </div>
          <div
            className="pa-bars"
            role="img"
            aria-label={`Napi játékidő: ${week.map((d) => `${d.label} ${d.minutes} perc`).join(', ')}${limit ? `; napi keret ${limit} perc` : ''}`}
          >
            {limit > 0 && <div className="pa-bars__limit" style={{ bottom: 24 + (limit / scaleMax) * 100 }} />}
            {week.map((d, i) => (
              <div key={d.day} className="pa-bars__col">
                <div
                  className={`pa-bars__bar${limit && d.minutes > limit ? ' is-over' : ''}${i === 6 ? ' is-today' : ''}`}
                  style={{ height: Math.max(3, (d.minutes / scaleMax) * 100) }}
                />
                <span className="pa-bars__label">{d.label}</span>
              </div>
            ))}
          </div>
          {limit > 0 && (
            <div className="pa-muted pa-legend">
              <span className="pa-legend__dash" /> napi keret: {limit} perc
            </div>
          )}
        </section>
      </div>

      <section className="pa-card" aria-labelledby="ov-notes">
        <h2 id="ov-notes" className="pa-eyebrow">
          Mit érdemes tudni
        </h2>
        <div className="pa-grid2 pa-notes">
          {notes.map((n) => (
            <div key={n.title} className={`pa-note pa-note--${n.tone}`}>
              <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                {n.tone === 'tip' ? (
                  <>
                    <path d="M12 3a6 6 0 0 0-3.5 10.9V17h7v-3.1A6 6 0 0 0 12 3z" />
                    <path d="M9.5 21h5" />
                  </>
                ) : (
                  <>
                    <path d="M12 21V11" />
                    <path d="M12 13c0-4-3-6-7-6 0 4 3 6 7 6z" />
                    <path d="M12 11c0-4 3-6 7-6 0 4-3 6-7 6z" />
                  </>
                )}
              </svg>
              <p>
                <b>{n.title}</b> {n.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="ov-games" className="pa-games">
        <div className="pa-spread">
          <h2 id="ov-games" className="pa-eyebrow">
            Játékok
          </h2>
          <button type="button" className="pa-link" onClick={() => onGo('levels')}>
            Szintek módosítása
          </button>
        </div>
        <div className="pa-games__grid">
          {games.map((g) => (
            <div key={g.name} className="pa-game">
              <div className="pa-game__name">{g.name}</div>
              <div className="pa-game__detail">{g.detail}</div>
              <div className="pa-meter" aria-hidden="true">
                <div style={{ width: `${Math.round(g.share * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

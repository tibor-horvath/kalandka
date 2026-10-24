import { gameNotes, insights, type Insight } from '../../state/insights';
import { LADDER_RULES, ladderOf, upNeed, type LadderGame } from '../../state/ladder';
import { LEVEL_SETTINGS } from '../../state/levels';
import { useProgress } from '../../state/progress';
import { BONUS_OPTIONS, addBonus, lastSevenDays, playedToday, remainingSeconds, today } from '../../state/screenTime';
import { ADD_LEVELS } from '../../games/add/logic';
import { LEARN_MAX } from '../../games/learn/logic';
import { TRACE_ORDER, buildTraceRound } from '../../games/trace/logic';
import { PATH_LEVELS } from '../../games/robot/path';
import { SCALE_LEVELS } from '../../games/robot/scale';
import { MIRROR_LEVELS } from '../../games/robot/mirror';
import { CODE_LEVELS } from '../../games/robot/code';
import { SEQ_LEVELS } from '../../games/robot/seq';
import { SORT_LEVELS } from '../../games/robot/sort';
import { POTS_LEVELS } from '../../games/pots/logic';
import { LEVELS as FLASH_LEVELS } from '../../games/flash/logic';
import { SHAPE_ORDER } from '../../games/patterns/logic';
import { PLANTS } from '../../games/water/logic';
import { WORLDS, type WorldId } from '../../state/worlds';
import type { ParentPage } from './ParentArea';
import { WorldGroup } from './controls';

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
  const noteFor = new Map(gameNotes(progress, day).map((n) => [n.game, n]));
  const worldName = (id: WorldId) => WORLDS.find((w) => w.id === id)!.name;

  const setting = (id: string) => LEVEL_SETTINGS.find((s) => s.id === id)!;
  const levelShare = (id: string) => {
    const s = setting(id);
    const idx = s.options.findIndex((o) => o.value === s.current(progress));
    return (idx + 1) / s.options.length;
  };
  const learned = Math.min(LEARN_MAX, progress.learnSolved);
  /** "3. szint · Name", from the game's ladder. */
  const at = (game: LadderGame, levels: { name: string }[]) => {
    const i = ladderOf(progress, game).level;
    return `${i + 1}. szint · ${levels[i].name}`;
  };
  const add = ladderOf(progress, 'add');
  const games: { world: WorldId; name: string; detail: string; share: number }[] = [
    { world: 'garden', name: 'Számvetés', detail: `${learned} / ${LEARN_MAX} szám`, share: learned / LEARN_MAX },
    {
      world: 'garden',
      name: 'Locsolás',
      detail: `${progress.garden.length} virág · ${progress.waterRound >= PLANTS.length ? '11–20' : '2–10'} csepp`,
      share: levelShare('water')
    },
    {
      world: 'garden',
      name: 'Virágsor',
      detail: `${progress.patternsSolved} sor · ${SHAPE_ORDER[progress.patternRound % SHAPE_ORDER.length]} minta`,
      share: levelShare('patterns')
    },
    { world: 'garden', name: 'Magvillantás', detail: at('flash', FLASH_LEVELS), share: levelShare('flash') },
    {
      world: 'garden',
      name: 'Mézút',
      detail: `${progress.traceSolved} leírt szám${progress.traceFadedSolved ? ` (${progress.traceFadedSolved} halvány úton)` : ''} · következő: ${buildTraceRound(progress.traceRound).digit}`,
      // First lap on the full trail, then the faded lap.
      share: Math.min(1, (Math.min(progress.traceSolved - progress.traceFadedSolved, TRACE_ORDER.length) + progress.traceFadedSolved) / (2 * TRACE_ORDER.length))
    },
    {
      world: 'garden',
      name: 'Méhecske',
      detail: `${at('add', ADD_LEVELS)} · ${add.streak}/${upNeed(add, LADDER_RULES.add)} csillag`,
      share: levelShare('add')
    },
    { world: 'garden', name: 'Cserépbarátok', detail: at('pots', POTS_LEVELS), share: levelShare('pots') },
    {
      world: 'robot',
      name: 'Robotút',
      detail: `${progress.pathSolved} pálya · ${at('path', PATH_LEVELS)}`,
      share: levelShare('path')
    },
    {
      world: 'robot',
      name: 'Válogatógép',
      detail: `${progress.sortSolved} kör · ${at('sort', SORT_LEVELS)}`,
      share: levelShare('sort')
    },
    {
      world: 'robot',
      name: 'Mérleg',
      detail: `${progress.scaleSolved} kör · ${at('scale', SCALE_LEVELS)}`,
      share: levelShare('scale')
    },
    {
      world: 'robot',
      name: 'Mintagép',
      detail: `${progress.seqSolved} kör · ${at('seq', SEQ_LEVELS)}`,
      share: levelShare('seq')
    },
    {
      world: 'robot',
      name: 'Tükörgép',
      detail: `${progress.mirrorSolved} kör · ${at('mirror', MIRROR_LEVELS)}`,
      share: levelShare('mirror')
    },
    {
      world: 'robot',
      name: 'Kódzár',
      detail: `${progress.codeSolved} kör · ${at('code', CODE_LEVELS)}`,
      share: levelShare('code')
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

      <section className="pa-notes" aria-labelledby="ov-notes">
        <div>
          <h2 id="ov-notes" className="pa-h2">
            Mi megy jól, hol segíthetsz
          </h2>
          <p className="pa-lead">Az elmúlt hét játékai alapján, mindkét világból, egy-egy otthoni ötlettel, képernyő nélkül.</p>
        </div>
        <div className="pa-notes__grid">
          {notes.map((n) => (
            <article key={n.title} className={`pa-note pa-note--${n.tone}`}>
              <div className="pa-note__top">
                <span className="pa-note__tone">
                  <ToneIcon tone={n.tone} />
                  {n.tone === 'tip' ? 'Itt segíthetsz' : 'Jól megy'}
                </span>
                {n.game && n.world && (
                  <span className="pa-note__game">
                    {worldName(n.world)} · {n.game}
                  </span>
                )}
              </div>
              <h3 className="pa-note__title">{n.title}</h3>
              <p className="pa-note__text">{n.text}</p>
              {n.home && (
                <p className="pa-note__home">
                  <b>Otthon:</b> {n.home}
                </p>
              )}
            </article>
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
        {WORLDS.map((w) => {
          const own = games.filter((g) => g.world === w.id);
          return (
            <WorldGroup key={w.id} world={w} heading="h3" aside={`${own.length} játék`}>
              <div className="pa-games__grid">
                {own.map((g) => (
                  <div key={g.name} className="pa-game">
                    <div className="pa-game__name">{g.name}</div>
                    <div className="pa-game__detail">{g.detail}</div>
                    {noteFor.get(g.name) && <GameStatus note={noteFor.get(g.name)!} />}
                    <div className="pa-meter" aria-hidden="true">
                      <div style={{ width: `${Math.round(g.share * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </WorldGroup>
          );
        })}
      </section>
    </div>
  );
}

const TONE_LABEL: Record<Insight['tone'], string> = { good: 'Jól megy', tip: 'Itt segíthetsz', none: 'Kevés adat' };

function ToneIcon({ tone }: { tone: Insight['tone'] }) {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      {tone === 'tip' ? (
        <>
          <path d="M12 3a6 6 0 0 0-3.5 10.9V17h7v-3.1A6 6 0 0 0 12 3z" />
          <path d="M9.5 21h5" />
        </>
      ) : (
        <path d="M5 12.5l4.5 4.5L19 7" />
      )}
    </svg>
  );
}

/** One line under a game: how it goes this week, with a dot that differs in fill as well as colour. */
function GameStatus({ note }: { note: Insight }) {
  return (
    <div className={`pa-game__status pa-game__status--${note.tone}`}>
      <span className="pa-game__dot" role="img" aria-label={TONE_LABEL[note.tone]} />
      <span>{note.short}</span>
    </div>
  );
}

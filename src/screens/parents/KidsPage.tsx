import { useState, type CSSProperties } from 'react';
import { AVATARS, Avatar } from '../../components/avatars';
import { AGE_LABEL, KidFields } from '../../components/KidFields';
import { forgetChoices } from '../../print/catalog';
import {
  MAX_KIDS,
  addKid,
  editKid,
  forgetProfiles,
  freeAvatars,
  kidName,
  progressOf,
  removeKid,
  useProfiles,
  type AgeBand,
  type AvatarId,
  type Kid,
  type Profiles
} from '../../state/profiles';
import { lastPlayed, playedToday, today } from '../../state/screenTime';
import type { ParentPage } from './ParentArea';

/** Removes a child; removing the only one forgets the device and starts over from the landing page. */
function removeChild(profiles: Profiles, change: (fn: (s: Profiles) => Profiles) => void, id: string) {
  if (profiles.kids.length > 1) {
    change((s) => removeKid(s, id));
    return;
  }
  forgetProfiles();
  forgetChoices();
  window.location.reload();
}

/** The children who play on this device: add, rename, change figure, remove. */
export function KidsPage({ startAdding = false, onView }: { startAdding?: boolean; onView: (id: string, page: ParentPage) => void }) {
  const { profiles, change } = useProfiles();
  const [editing, setEditing] = useState<string | null>(startAdding && profiles.kids.length < MAX_KIDS ? 'new' : null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const shared = profiles.kids.length > 1;
  const day = today();

  const kid = profiles.kids.find((k) => k.id === editing);
  if (editing === 'new' || kid) return <KidForm kid={kid} onDone={() => setEditing(null)} />;

  return (
    <div className="pa-page">
      <header className="pa-head">
        <div>
          <h1 className="pa-h1">Gyerekek</h1>
          <p className="pa-lead">Mindenki a saját kertjében játszik ezen az eszközön: saját magok, szintek és képernyőidő.</p>
        </div>
        <button type="button" className="pa-btn pa-btn--go" disabled={profiles.kids.length >= MAX_KIDS} onClick={() => setEditing('new')}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Új gyerek
        </button>
      </header>

      <ul className="pa-kids" aria-label="Gyerekek">
        {profiles.kids.map((k) => {
          const p = progressOf(profiles, k.id);
          const minutes = Math.floor(playedToday(p, day) / 60);
          const limit = p.screenLimitMin;
          const last = lastPlayed(p);
          return (
            <li key={k.id} className="pa-kid">
              <Avatar id={k.avatar} size={60} />
              <div className="pa-kid__text">
                <div className="pa-kid__title">
                  <h2>{k.name.trim() || 'Név nélkül'}</h2>
                  {k.age && <span>{AGE_LABEL[k.age]} éves</span>}
                  {shared && k.id === profiles.activeId && <span className="pa-kid__now">Most ő játszik</span>}
                </div>
                <div className="pa-kid__sub">
                  {last ? `Utoljára ${last}` : 'Még nem játszott'} · {p.seeds} mag
                </div>
              </div>
              <div className="pa-kid__time">
                <span>{limit ? `Ma: ${minutes} / ${limit} perc` : `Ma: ${minutes} perc`}</span>
                {limit > 0 && (
                  <div className="pa-meter">
                    <div style={{ width: `${Math.min(100, (minutes / limit) * 100)}%` }} />
                  </div>
                )}
              </div>
              <div className="pa-kid__actions">
                <button type="button" className="pa-link" onClick={() => onView(k.id, 'overview')}>
                  Haladás
                </button>
                <button type="button" className="pa-btn pa-btn--quiet" onClick={() => setEditing(k.id)}>
                  {k.name.trim() ? 'Szerkesztés' : 'Elnevezés'}
                </button>
                <button type="button" className="pa-btn pa-btn--warn" aria-label={`${kidName(k)} törlése`} onClick={() => setDeleting(k.id)}>
                  Törlés
                </button>
              </div>
              {deleting === k.id && (
                <div className="pa-confirm pa-kid__confirm" role="alert">
                  <span>
                    {shared
                      ? `Biztosan törlöd ${kidName(k)} profilját a kerttel, a magokkal, a szintekkel és a játékidővel együtt? Ez nem vonható vissza.`
                      : `${kidName(k)} az egyetlen gyerek. A törlés mindent töröl, a beállításokat is, és az app a kezdőoldalra áll vissza. Ez nem vonható vissza.`}
                  </span>
                  <button type="button" className="pa-btn pa-btn--quiet" onClick={() => setDeleting(null)}>
                    Mégse
                  </button>
                  <button
                    type="button"
                    className="pa-btn pa-btn--danger"
                    onClick={() => {
                      setDeleting(null);
                      removeChild(profiles, change, k.id);
                    }}
                  >
                    Igen, törlöm
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <section className="pa-card" aria-labelledby="k-start">
        <h2 id="k-start" className="pa-h2">
          Indításkor
        </h2>
        {shared ? (
          <div className="pa-radios" role="radiogroup" aria-labelledby="k-start">
            <label className="pa-check">
              <input type="radio" name="k-start" checked={profiles.askOnStart} onChange={() => change((s) => ({ ...s, askOnStart: true }))} />
              <span>
                <b>Csepi megkérdezi, ki játszik</b>
                <small>Minden gyerek a saját figurájára koppint.</small>
              </span>
            </label>
            <label className="pa-check">
              <input type="radio" name="k-start" checked={!profiles.askOnStart} onChange={() => change((s) => ({ ...s, askOnStart: false }))} />
              <span>
                <b>Az utolsó gyerekkel folytatja</b>
                <small>Váltani a kezdőképernyőn, a gyerek figurájára koppintva lehet.</small>
              </span>
            </label>
          </div>
        ) : (
          <p className="pa-muted">Ha legalább két gyerek játszik, indításkor Csepi megkérdezi, ki jön.</p>
        )}
        <p className="pa-muted">Csepi hangja, a hangeffektek és az esti pihenő minden gyerekre érvényes ezen az eszközön.</p>
      </section>
    </div>
  );
}

function KidForm({ kid, onDone }: { kid?: Kid; onDone: () => void }) {
  const { profiles, change } = useProfiles();
  const free = freeAvatars(profiles, kid?.id);
  const [name, setName] = useState(kid?.name ?? '');
  const [avatar, setAvatar] = useState<AvatarId>(kid?.avatar ?? free[0] ?? 'frog');
  const [age, setAge] = useState<AgeBand | null>(kid?.age ?? null);
  const [missingName, setMissingName] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const shownName = name.trim() || 'Új gyerek';

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setMissingName(true);
      return;
    }
    change((s) => (kid ? editKid(s, kid.id, { name: trimmed, avatar, age }) : addKid(s, { name: trimmed, avatar, age })));
    onDone();
  };

  const onlyKid = profiles.kids.length === 1;

  const remove = () => {
    if (kid) removeChild(profiles, change, kid.id);
    onDone();
  };

  return (
    <div className="pa-page">
      <header className="pa-head">
        <div>
          <p className="pa-eyebrow">Gyerekek</p>
          <h1 className="pa-h1">{kid ? kidName(kid) : 'Új gyerek hozzáadása'}</h1>
        </div>
      </header>

      <div className="pa-kidform">
        <form
          className="pa-card pa-kidform__main"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <KidFields
            draft={{ name, avatar, age }}
            onChange={(patch) => {
              if (patch.name !== undefined) {
                setName(patch.name);
                setMissingName(false);
              }
              if (patch.avatar) setAvatar(patch.avatar);
              if (patch.age) setAge(patch.age);
            }}
            free={free}
            missingName={missingName}
            ageHint={kid ? 'A szinteket a Szintek oldalon állíthatod.' : 'Ebből állítjuk a kezdő szinteket. Később a Szintek oldalon bármikor módosíthatod.'}
          />

          <div className="pa-row pa-kidform__buttons">
            <button type="button" className="pa-btn pa-btn--quiet" onClick={onDone}>
              Mégse
            </button>
            <button type="submit" className="pa-btn pa-btn--go">
              {kid ? 'Mentés' : 'Hozzáadás'}
            </button>
          </div>
        </form>

        <aside className="pa-kidform__preview" aria-label="Előnézet">
          <p className="pa-eyebrow">Így látja a gyerek</p>
          <div className="pa-preview">
            <div className="pa-preview__card" style={{ '--ring': AVATARS[avatar].ring } as CSSProperties}>
              <Avatar id={avatar} size={110} />
              <span>{shownName}</span>
            </div>
          </div>
          {!kid && <p className="pa-muted">Saját kertet, magokat és szinteket kap. A többiek haladása nem változik.</p>}
        </aside>
      </div>

      {kid && (
        <section className="pa-card pa-card--warn" aria-labelledby="k-remove">
          <h2 id="k-remove" className="pa-h2 pa-h2--warn">
            {kidName(kid)} eltávolítása
          </h2>
          <p className="pa-muted">
            {onlyKid
              ? 'Ő az egyetlen gyerek ezen az eszközön. Az eltávolítás a kertet, a magokat, a szinteket, a játékidőt és a beállításokat is törli, és az app a kezdőoldalra áll vissza.'
              : 'Törli a profilt a kerttel, a magokkal, a szintekkel és a játékidővel együtt.'}
          </p>
          {confirming ? (
            <div className="pa-confirm" role="alert">
              <span>Biztosan törlöd? Ez nem vonható vissza.</span>
              <button type="button" className="pa-btn pa-btn--quiet" onClick={() => setConfirming(false)}>
                Mégse
              </button>
              <button type="button" className="pa-btn pa-btn--danger" onClick={remove}>
                Igen, törlöm
              </button>
            </div>
          ) : (
            <div>
              <button type="button" className="pa-btn pa-btn--warn" onClick={() => setConfirming(true)}>
                Eltávolítás…
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

import { AVATARS, Avatar } from './avatars';
import { AGE_BANDS, AVATAR_IDS, NAME_MAX, type AgeBand, type AvatarId } from '../state/profiles';

export const AGE_LABEL: Record<AgeBand, string> = { '5': '5', '6': '6', '7+': '7+' };

export interface KidDraft {
  name: string;
  avatar: AvatarId;
  age: AgeBand | null;
}

/** Name, figure and age of a child: the parents' kid form and the first profile on the landing page share them. */
export function KidFields({
  draft,
  onChange,
  free,
  missingName,
  ageHint,
  autoFocus = false
}: {
  draft: KidDraft;
  onChange: (patch: Partial<KidDraft>) => void;
  free: AvatarId[];
  missingName: boolean;
  ageHint: string;
  autoFocus?: boolean;
}) {
  return (
    <>
      <div className="pa-field">
        <label htmlFor="k-name" className="pa-h2">
          Név
        </label>
        <input
          id="k-name"
          type="text"
          value={draft.name}
          maxLength={NAME_MAX}
          autoComplete="off"
          autoFocus={autoFocus}
          aria-invalid={missingName || undefined}
          aria-describedby="k-name-hint"
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <small id="k-name-hint" className={missingName ? 'pa-field__error' : undefined}>
          {missingName ? 'Írd be a gyerek nevét.' : 'Csepi így szólítja majd. Becenév is jó.'}
        </small>
      </div>

      <fieldset className="pa-field">
        <legend className="pa-h2">Figura</legend>
        <div className="pa-avatars">
          {AVATAR_IDS.map((id) => {
            const taken = !free.includes(id);
            return (
              <button
                key={id}
                type="button"
                className={`pa-avatar${draft.avatar === id ? ' is-on' : ''}`}
                aria-pressed={draft.avatar === id}
                aria-label={taken ? `${AVATARS[id].name} (már foglalt)` : AVATARS[id].name}
                disabled={taken}
                onClick={() => onChange({ avatar: id })}
              >
                <Avatar id={id} size={56} />
              </button>
            );
          })}
        </div>
        <small>Mindenkinek más figurája van, így olvasás nélkül is megtalálja a sajátját.</small>
      </fieldset>

      <fieldset className="pa-field">
        <legend className="pa-h2">Hány éves?</legend>
        <div className="pa-seg pa-seg--4" role="radiogroup" aria-label="Életkor">
          {AGE_BANDS.map((a) => (
            <button key={a} type="button" role="radio" aria-checked={draft.age === a} className={`pa-seg__btn${draft.age === a ? ' is-on' : ''}`} onClick={() => onChange({ age: a })}>
              {AGE_LABEL[a]}
            </button>
          ))}
        </div>
        <small>{ageHint}</small>
      </fieldset>
    </>
  );
}

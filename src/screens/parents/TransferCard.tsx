import { useEffect, useState } from 'react';
import { Avatar } from '../../components/avatars';
import { QrCode } from '../../components/QrCode';
import { MAX_KIDS, kidName, useProfiles, type Kid, type Profiles } from '../../state/profiles';
import { collect, isComplete, merge, packPieces, unpack, type Collected } from '../../state/transfer';
import { Scanner } from './Scanner';

type Mode = 'idle' | 'send' | 'receive' | 'done';

/** Moves every profile to a new device with QR codes: nothing goes through the internet. */
export function TransferCard() {
  const [mode, setMode] = useState<Mode>('idle');
  const [moved, setMoved] = useState({ added: 0, updated: 0 });

  return (
    <section className="pa-card" aria-labelledby="s-transfer">
      <h2 id="s-transfer" className="pa-h2">
        Átköltözés új eszközre
      </h2>
      {mode === 'send' ? (
        <SendPanel onClose={() => setMode('idle')} />
      ) : mode === 'receive' ? (
        <ReceivePanel
          onCancel={() => setMode('idle')}
          onDone={(counts) => {
            setMoved(counts);
            setMode('done');
          }}
        />
      ) : (
        <>
          {mode === 'done' && (
            <div className="pa-note pa-note--good" role="status">
              <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              <p>
                <b>Megérkezett!</b> {[moved.added && `${moved.added} új gyerkőc`, moved.updated && `${moved.updated} frissített profil`].filter(Boolean).join(', ')} a
                kerttel, a matricákkal és a szintekkel együtt ezen az eszközön van.
              </p>
            </div>
          )}
          <p className="pa-muted">
            A gyerkőcök profilja, kertje, matricái, szintjei és a beállítások átvihetők egy másik eszközre. A régi eszköz QR-kódot mutat, az új a
            kamerájával beolvassa. Nem kell hozzá internet, és semmi nem megy át szerveren.
          </p>
          <div className="pa-row">
            <button type="button" className="pa-btn" onClick={() => setMode('send')}>
              Küldés erről az eszközről
            </button>
            <button type="button" className="pa-btn pa-btn--quiet" onClick={() => setMode('receive')}>
              Fogadás erre az eszközre
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function SendPanel({ onClose }: { onClose: () => void }) {
  const { profiles } = useProfiles();
  // The save as it was when the panel opened: every code must come from the same one.
  const [snapshot] = useState(profiles);
  const [pieces, setPieces] = useState<Uint8Array[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [at, setAt] = useState(0);

  useEffect(() => {
    let live = true;
    packPieces(snapshot).then(
      (p) => live && setPieces(p),
      () => live && setFailed(true)
    );
    return () => {
      live = false;
    };
  }, [snapshot]);

  const total = pieces?.length ?? 0;

  return (
    <div className="pa-transfer">
      {failed ? (
        <p className="pa-muted">Ez a böngésző nem tudja előkészíteni a kódot. Frissítsd a böngészőt, vagy próbáld meg egy másikban.</p>
      ) : pieces ? (
        <>
          <p className="pa-muted">
            Az új eszközön nyisd meg a <b>Szülői sarok → Beállítások</b> oldalt, koppints a <b>Fogadás erre az eszközre</b> gombra, és olvasd be
            {total > 1 ? ' a kódokat sorban. Ha az új eszköz jelzi, hogy megvan, lapozz a következőre.' : ' ezt a kódot.'}
          </p>
          {/* The default byte encoder keeps each char code's low byte, so a "binary string" passes the bytes through. */}
          <QrCode data={String.fromCharCode(...pieces[at])} correction="L" className="pa-transfer__qr" label={total > 1 ? `${at + 1}. kód a ${total}-ből` : 'Átköltözési kód'} />
          {total > 1 && (
            <div className="pa-transfer__pager">
              <button type="button" className="pa-btn pa-btn--quiet" disabled={at === 0} onClick={() => setAt(at - 1)}>
                Előző
              </button>
              <b>
                {at + 1}. kód a {total}-ből
              </b>
              <button type="button" className="pa-btn" disabled={at === total - 1} onClick={() => setAt(at + 1)}>
                Következő
              </button>
            </div>
          )}
          <KidList kids={snapshot.kids} />
        </>
      ) : (
        <p className="pa-muted">A kód készül…</p>
      )}
      <div>
        <button type="button" className="pa-btn pa-btn--quiet" onClick={onClose}>
          Kész
        </button>
      </div>
    </div>
  );
}

function KidList({ kids, tag }: { kids: Kid[]; tag?: (kid: Kid) => string }) {
  return (
    <ul className="pa-transfer__kids" aria-label="Ezek a profilok kerülnek át">
      {kids.map((k) => (
        <li key={k.id}>
          <Avatar id={k.avatar} size={36} />
          {kidName(k)}
          {tag && <small>{tag(k)}</small>}
        </li>
      ))}
    </ul>
  );
}

function ReceivePanel({ onCancel, onDone }: { onCancel: () => void; onDone: (counts: { added: number; updated: number }) => void }) {
  const { profiles, change } = useProfiles();
  const [collected, setCollected] = useState<Collected | null>(null);
  const [incoming, setIncoming] = useState<Profiles | null>(null);
  const [broken, setBroken] = useState(false);
  const [noCamera, setNoCamera] = useState(false);
  const found = collected?.pieces.filter(Boolean).length ?? 0;
  const complete = !!collected && found === collected.total;

  useEffect(() => {
    if (!isComplete(collected)) return;
    let live = true;
    unpack(collected).then((s) => {
      if (!live) return;
      if (s) setIncoming(s);
      else {
        setBroken(true);
        setCollected(null);
      }
    });
    return () => {
      live = false;
    };
  }, [collected]);

  if (incoming) {
    const plan = merge(profiles, incoming);
    const isNew = new Set(plan.added.map((k) => k.id));
    const accept = () => {
      change((s) => merge(s, incoming).result);
      onDone({ added: plan.added.length, updated: plan.updated.length });
    };
    return (
      <div className="pa-transfer">
        <p className="pa-muted">Ezek a profilok érkeztek, a kerttel, a matricákkal, a szintekkel és a beállításokkal együtt:</p>
        <KidList kids={incoming.kids} tag={(k) => (isNew.has(k.id) ? 'új' : 'frissül')} />
        {plan.tooMany ? (
          <>
            <p className="pa-muted">
              Így több mint {MAX_KIDS} gyerkőc lenne ezen az eszközön, ennyi nem fér el. Előbb törölj egy profilt a <b>Gyerkőcök</b> oldalon, majd
              olvasd be újra a kódot.
            </p>
            <div>
              <button type="button" className="pa-btn pa-btn--quiet" onClick={onCancel}>
                Rendben
              </button>
            </div>
          </>
        ) : (
          <>
            {plan.refigured.length > 0 && (
              <p className="pa-muted">
                Új figurát kap, mert a figuráját egy érkező gyerkőc használja: {plan.refigured.map((k) => kidName(k)).join(', ')}.
              </p>
            )}
            <div className="pa-confirm" role="alert">
              <span>
                {plan.updated.length > 0
                  ? 'A „frissül” jelű gyerkőcök itteni haladását felülírja az érkező, a többi gyerkőc megmarad. Ez nem vonható vissza.'
                  : 'Az érkező profilok a mostaniak mellé kerülnek, senki haladása nem vész el.'}
              </span>
              <button type="button" className="pa-btn pa-btn--quiet" onClick={onCancel}>
                Mégse
              </button>
              <button type="button" className="pa-btn pa-btn--go" onClick={accept}>
                Igen, átveszem
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="pa-transfer">
      <p className="pa-muted">
        A régi eszközön nyisd meg a <b>Szülői sarok → Beállítások</b> oldalt, koppints a <b>Küldés erről az eszközről</b> gombra, és tartsd ezt
        a kamerát a megjelenő kódra.
      </p>
      {!complete && <Scanner onCode={(piece) => setCollected((c) => collect(c, piece))} onUnavailable={() => setNoCamera(true)} />}
      <div className="pa-transfer__status" role="status">
        {noCamera ? null : broken ? (
          <span>Ezekből a kódokból nem lehetett beolvasni a profilokat. Próbáld újra.</span>
        ) : !collected ? (
          <span>Keresem a kódot…</span>
        ) : (
          <>
            <span className="pa-dots" aria-hidden="true">
              {collected.pieces.map((p, i) => (
                <i key={i} className={p ? 'is-done' : ''} />
              ))}
            </span>
            <span>
              {complete
                ? 'Minden kód megvan.'
                : collected.total === 1
                  ? 'Megvan a kód.'
                  : `${found} kód megvan a ${collected.total}-ből. Lapozz a következőre a régi eszközön.`}
            </span>
          </>
        )}
      </div>
      <div>
        <button type="button" className="pa-btn pa-btn--quiet" onClick={onCancel}>
          Mégse
        </button>
      </div>
    </div>
  );
}

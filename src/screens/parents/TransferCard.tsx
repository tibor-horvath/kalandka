import qrcode from 'qrcode-generator';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar } from '../../components/avatars';
import { kidName, useProfiles, type Profiles } from '../../state/profiles';
import { collect, isComplete, packPieces, unpack, type Collected } from '../../state/transfer';

type Mode = 'idle' | 'send' | 'receive' | 'done';

/** Moves every profile to a new device with QR codes: nothing goes through the internet. */
export function TransferCard() {
  const [mode, setMode] = useState<Mode>('idle');
  const [moved, setMoved] = useState(0);

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
          onDone={(n) => {
            setMoved(n);
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
                <b>Megérkezett!</b> {moved === 1 ? 'A gyerek profilja' : `${moved} gyerek profilja`} a kerttel, a matricákkal és a szintekkel együtt
                ezen az eszközön van.
              </p>
            </div>
          )}
          <p className="pa-muted">
            A gyerekek profilja, kertje, matricái, szintjei és a beállítások átvihetők egy másik eszközre. A régi eszköz QR-kódot mutat, az új a
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
          <QrCode bytes={pieces[at]} label={total > 1 ? `${at + 1}. kód a ${total}-ből` : 'Átköltözési kód'} />
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
          <KidList s={snapshot} />
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

/** A QR code in byte mode, drawn as one SVG path with the white margin readers need. */
function QrCode({ bytes, label }: { bytes: Uint8Array; label: string }) {
  const { size, path } = useMemo(() => {
    const qr = qrcode(0, 'L');
    // The default byte encoder keeps each char code's low byte, so a "binary string" passes the bytes through.
    qr.addData(String.fromCharCode(...bytes), 'Byte');
    qr.make();
    const n = qr.getModuleCount();
    let d = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) d += `M${x + 4} ${y + 4}h1v1h-1z`;
    return { size: n + 8, path: d };
  }, [bytes]);

  return (
    <svg className="pa-transfer__qr" role="img" aria-label={label} viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges">
      <rect width={size} height={size} fill="#ffffff" />
      <path d={path} fill="#000000" />
    </svg>
  );
}

function KidList({ s }: { s: Profiles }) {
  return (
    <ul className="pa-transfer__kids" aria-label="Ezek a profilok kerülnek át">
      {s.kids.map((k) => (
        <li key={k.id}>
          <Avatar id={k.avatar} size={36} />
          {kidName(k)}
        </li>
      ))}
    </ul>
  );
}

function ReceivePanel({ onCancel, onDone }: { onCancel: () => void; onDone: (kids: number) => void }) {
  const { change } = useProfiles();
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

  const accept = () => {
    if (!incoming) return;
    change(() => incoming);
    onDone(incoming.kids.length);
  };

  if (incoming) {
    return (
      <div className="pa-transfer">
        <p className="pa-muted">Ezek a profilok érkeztek, a kerttel, a matricákkal, a szintekkel és a beállításokkal együtt:</p>
        <KidList s={incoming} />
        <div className="pa-confirm" role="alert">
          <span>Az ezen az eszközön lévő profilok és haladás helyére ezek kerülnek. Ez nem vonható vissza.</span>
          <button type="button" className="pa-btn pa-btn--quiet" onClick={onCancel}>
            Mégse
          </button>
          <button type="button" className="pa-btn pa-btn--go" onClick={accept}>
            Igen, átveszem
          </button>
        </div>
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

type CameraState = 'starting' | 'on' | 'denied' | 'none';

/** The back camera, read a few times a second until the panel closes. */
function Scanner({ onCode, onUnavailable }: { onCode: (bytes: Uint8Array) => void; onUnavailable: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;
  const [state, setState] = useState<CameraState>('starting');
  const blocked = state === 'denied' || state === 'none';

  useEffect(() => {
    if (blocked) onUnavailable();
  }, [blocked, onUnavailable]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer = 0;
    let stopped = false;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia || !ctx) return setState('none');
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      } catch (e) {
        console.warn('Kalandka: camera unavailable', e);
        if (!stopped) setState((e as DOMException).name === 'NotAllowedError' ? 'denied' : 'none');
        return;
      }
      if (stopped || !video.current) return stream.getTracks().forEach((t) => t.stop());
      // autoPlay starts it; waiting on play() can hang on some cameras and leave the panel stuck.
      video.current.srcObject = stream;
      void video.current.play().catch(() => {});
      setState('on');
      // Loaded only here, so the reader stays out of the games' bundle.
      const { default: jsQR } = await import('jsqr');
      const scan = () => {
        if (stopped) return;
        const v = video.current;
        if (v && v.videoWidth) {
          const scale = Math.min(1, 960 / v.videoWidth);
          canvas.width = Math.round(v.videoWidth * scale);
          canvas.height = Math.round(v.videoHeight * scale);
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' });
          if (code) onCodeRef.current(Uint8Array.from(code.binaryData));
        }
        timer = window.setTimeout(scan, 150);
      };
      scan();
    };

    // Started a tick later: React's development double mount cancels the first run before it asks for the
    // camera, so the two runs never hold the camera at once (on Windows that can leave the picture black).
    timer = window.setTimeout(() => void start(), 0);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (state === 'denied') {
    return <p className="pa-muted">A kamera nincs engedélyezve. Engedélyezd a böngésző vagy az eszköz beállításaiban, majd próbáld újra.</p>;
  }
  if (state === 'none') {
    return <p className="pa-muted">Ezen az eszközön nem érhető el kamera, ezért ide nem lehet beolvasni a kódot.</p>;
  }
  return <video ref={video} className="pa-transfer__camera" autoPlay playsInline muted aria-label="Kamera képe" />;
}

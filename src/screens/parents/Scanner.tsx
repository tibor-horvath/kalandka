import { useEffect, useRef, useState } from 'react';

type CameraState = 'starting' | 'on' | 'denied' | 'none';

/** The back camera, read a few times a second until the panel closes. Used by Átköltözés and Lap beolvasása. */
export function Scanner({ onCode, onUnavailable }: { onCode: (bytes: Uint8Array) => void; onUnavailable?: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;
  const [state, setState] = useState<CameraState>('starting');
  const blocked = state === 'denied' || state === 'none';

  useEffect(() => {
    if (blocked) onUnavailable?.();
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

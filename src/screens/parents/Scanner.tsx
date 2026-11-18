import { useEffect, useRef, useState } from 'react';

type CameraState = 'starting' | 'on' | 'denied' | 'none';

/** The browser's own QR reader (Chrome on Android, Safari 17+ on some devices): much quicker than jsQR when there. */
interface Detector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
type DetectorClass = { new (o: { formats: string[] }): Detector; getSupportedFormats?: () => Promise<string[]> };

async function nativeDetector(): Promise<Detector | null> {
  const D = (window as unknown as { BarcodeDetector?: DetectorClass }).BarcodeDetector;
  if (!D) return null;
  try {
    const formats = (await D.getSupportedFormats?.()) ?? [];
    return formats.includes('qr_code') ? new D({ formats: ['qr_code'] }) : null;
  } catch {
    return null;
  }
}

/**
 * The back camera, read a few times a second until the panel closes. Used by Átköltözés and Lap beolvasása.
 * `text`: the codes hold text (a page's address), so the browser's own reader may read them; Átköltözés's codes are
 * bytes, which that reader cannot give back, so it keeps to jsQR. `torch` switches the lamp where the camera has one;
 * `onTorch` hears once whether it does.
 */
export function Scanner({
  onCode,
  onUnavailable,
  text,
  torch,
  onTorch,
  className = 'pa-transfer__camera'
}: {
  onCode: (bytes: Uint8Array) => void;
  onUnavailable?: () => void;
  text?: boolean;
  torch?: boolean;
  onTorch?: (available: boolean) => void;
  className?: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;
  const onTorchRef = useRef(onTorch);
  onTorchRef.current = onTorch;
  const track = useRef<MediaStreamTrack | null>(null);
  const [state, setState] = useState<CameraState>('starting');
  const blocked = state === 'denied' || state === 'none';

  useEffect(() => {
    if (blocked) onUnavailable?.();
  }, [blocked, onUnavailable]);

  useEffect(() => {
    const t = track.current;
    if (state !== 'on' || !t || torch === undefined) return;
    t.applyConstraints({ advanced: [{ torch } as MediaTrackConstraintSet] }).catch(() => {});
  }, [torch, state]);

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
      track.current = stream.getVideoTracks()[0] ?? null;
      const caps = (track.current?.getCapabilities?.() ?? {}) as { torch?: boolean };
      onTorchRef.current?.(caps.torch === true);
      setState('on');
      let native = text ? await nativeDetector() : null;
      // Loaded only here, so the reader stays out of the games' bundle.
      const { default: jsQR } = await import('jsqr');
      const scan = async () => {
        if (stopped) return;
        const v = video.current;
        if (v && v.videoWidth) {
          if (native) {
            try {
              const [code] = await native.detect(v);
              if (code && !stopped) onCodeRef.current(new TextEncoder().encode(code.rawValue));
            } catch {
              // Some builds list the reader but cannot run it: jsQR from now on.
              native = null;
            }
          } else {
            const scale = Math.min(1, 960 / v.videoWidth);
            canvas.width = Math.round(v.videoWidth * scale);
            canvas.height = Math.round(v.videoHeight * scale);
            ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
            const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' });
            if (code) onCodeRef.current(Uint8Array.from(code.binaryData));
          }
        }
        if (!stopped) timer = window.setTimeout(() => void scan(), native ? 100 : 150);
      };
      void scan();
    };

    // Started a tick later: React's development double mount cancels the first run before it asks for the
    // camera, so the two runs never hold the camera at once (on Windows that can leave the picture black).
    timer = window.setTimeout(() => void start(), 0);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      track.current = null;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [text]);

  if (state === 'denied') {
    return <p className="pa-muted">A kamera nincs engedélyezve. Engedélyezd a böngésző vagy az eszköz beállításaiban, majd próbáld újra.</p>;
  }
  if (state === 'none') {
    return <p className="pa-muted">Ezen az eszközön nem érhető el kamera, ezért ide nem lehet beolvasni a kódot.</p>;
  }
  return <video ref={video} className={className} autoPlay playsInline muted aria-label="Kamera képe" />;
}

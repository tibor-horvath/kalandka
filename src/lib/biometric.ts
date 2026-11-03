// Fingerprint (or face) unlock for the parents' corner, an opt-in shortcut next to the math gate.
// It uses the device's own screen lock through WebAuthn: the app makes a passkey only this site can use
// and keeps just its id. The fingerprint never reaches the app. There is no server to check the
// signature, so a passed prompt is the whole check: enough to keep young children out, and the
// multiplication question always stays. The id is a device setting, so it is not part of the profiles
// (a move to a new device does not carry it; the new device turns it on for itself).

import { useEffect, useSyncExternalStore } from 'react';
import { readKey, removeKeys, writeKey } from './storage';

const KEY = 'kalandka.unlock.v1';
/** Flags byte of the authenticator data: bit 2 is "user verified" (fingerprint, face or device PIN). */
const FLAGS_AT = 32;
const UV = 0x04;

let stored: string | null | undefined;
let supported = false;
let probing: Promise<boolean> | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function toBase64Url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(text: string): Uint8Array {
  const s = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

/** True when the authenticator says it checked who was holding the device. */
export function userVerified(authData: ArrayBuffer): boolean {
  const bytes = new Uint8Array(authData);
  return bytes.length > FLAGS_AT && (bytes[FLAGS_AT] & UV) !== 0;
}

function savedId(): string | null {
  if (stored === undefined) {
    stored = readKey(KEY) ?? null;
  }
  return stored;
}

function save(id: string | null): void {
  stored = id;
  // Blocked storage: it works until the app is closed.
  if (id) writeKey(KEY, id);
  else removeKeys(KEY);
  notify();
}

/** Whether this device has a fingerprint reader, face unlock or similar the browser can use. */
export function probeBiometric(): Promise<boolean> {
  probing ??= (async () => {
    try {
      supported =
        window.isSecureContext &&
        typeof PublicKeyCredential !== 'undefined' &&
        (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
    } catch {
      supported = false;
    }
    notify();
    return supported;
  })();
  return probing;
}

const random = (n: number) => crypto.getRandomValues(new Uint8Array(n));

/** Shows the device's prompt to set up the unlock. False when the parent cancels or it fails. */
export async function enrollBiometric(): Promise<boolean> {
  try {
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: random(32),
        rp: { name: 'Kalandka' },
        user: { id: random(16), name: 'Szülő', displayName: 'Kalandka szülői sarok' },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 }
        ],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
        attestation: 'none',
        timeout: 60_000
      }
    })) as PublicKeyCredential | null;
    if (!cred) return false;
    save(toBase64Url(new Uint8Array(cred.rawId)));
    return true;
  } catch {
    return false;
  }
}

/** Shows the device's prompt to open the parents' corner. False when cancelled, failed or not set up. */
export async function verifyBiometric(): Promise<boolean> {
  const id = savedId();
  if (!id) return false;
  try {
    const cred = (await navigator.credentials.get({
      publicKey: {
        challenge: random(32),
        allowCredentials: [{ type: 'public-key', id: fromBase64Url(id), transports: ['internal'] }],
        userVerification: 'required',
        timeout: 60_000
      }
    })) as PublicKeyCredential | null;
    return !!cred && userVerified((cred.response as AuthenticatorAssertionResponse).authenticatorData);
  } catch {
    return false;
  }
}

/** Turns the unlock off. The passkey stays in the device's password manager; the parent can delete it there. */
export function disableBiometric(): void {
  save(null);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** `available`: the device can do it. `on`: a parent turned it on here (and the device can still do it). */
export function useBiometric(): { available: boolean; on: boolean } {
  const available = useSyncExternalStore(subscribe, () => supported);
  const enabled = useSyncExternalStore(subscribe, () => savedId() !== null);
  useEffect(() => void probeBiometric(), []);
  return { available, on: available && enabled };
}

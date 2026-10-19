import { afterEach, describe, expect, it, vi } from 'vitest';

// biometric.ts keeps the saved id in memory once read, so each test sets up a fake browser and imports a fresh copy.
async function load(get: () => Promise<unknown>, saved: string | null = 'AQID') {
  const store = new Map<string, string>(saved ? [['kalandka.unlock.v1', saved]] : []);
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k)
  });
  vi.stubGlobal('navigator', { credentials: { get, create: async () => ({ rawId: new Uint8Array([250, 251, 252]).buffer }) } });
  vi.resetModules();
  return { bio: await import('./biometric'), store };
}

function assertion(flags: number) {
  const authenticatorData = new Uint8Array(37);
  authenticatorData[32] = flags;
  return { response: { authenticatorData: authenticatorData.buffer } };
}

afterEach(() => vi.unstubAllGlobals());

describe('biometric unlock', () => {
  it('turns credential ids into text and back', async () => {
    const { bio } = await load(async () => null);
    const bytes = new Uint8Array([0, 250, 251, 252, 253, 254, 255, 62, 63]);
    const text = bio.toBase64Url(bytes);
    expect(text).not.toMatch(/[+/=]/);
    expect(bio.fromBase64Url(text)).toEqual(bytes);
  });

  it('opens when the device checked the parent', async () => {
    const { bio } = await load(async () => assertion(0x05));
    expect(await bio.verifyBiometric()).toBe(true);
  });

  it('stays shut when the device did not check who was holding it', async () => {
    const { bio } = await load(async () => assertion(0x01));
    expect(await bio.verifyBiometric()).toBe(false);
  });

  it('stays shut when the prompt is cancelled', async () => {
    const { bio } = await load(async () => {
      throw new DOMException('cancelled', 'NotAllowedError');
    });
    expect(await bio.verifyBiometric()).toBe(false);
  });

  it('never asks the device when it was not turned on', async () => {
    const get = vi.fn(async () => assertion(0x05));
    const { bio } = await load(get, null);
    expect(await bio.verifyBiometric()).toBe(false);
    expect(get).not.toHaveBeenCalled();
  });

  it('remembers the new passkey, and forgets it when turned off', async () => {
    const { bio, store } = await load(async () => null, null);
    expect(await bio.enrollBiometric()).toBe(true);
    expect(store.get('kalandka.unlock.v1')).toBe('-vv8');
    bio.disableBiometric();
    expect(store.has('kalandka.unlock.v1')).toBe(false);
  });
});

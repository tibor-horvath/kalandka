import { afterEach, describe, expect, it } from 'vitest';
import { readJson, readKey, removeKeys, setStorageForTests, writeKey } from './storage';

function memory() {
  const store = new Map<string, string>();
  return { store, getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
}

const blocked = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
  removeItem: () => {
    throw new Error('SecurityError');
  }
};

afterEach(() => setStorageForTests(null));

describe('storage', () => {
  it('keeps, reads and forgets values', () => {
    const m = memory();
    setStorageForTests(m);
    expect(readKey('a')).toBeNull();
    expect(writeKey('a', '1')).toBe(true);
    writeKey('b', '2');
    expect(readKey('a')).toBe('1');
    removeKeys('a', 'b');
    expect(m.store.size).toBe(0);
  });

  it('reads a JSON object, and {} for anything else', () => {
    setStorageForTests(memory());
    writeKey('ok', '{"x":1}');
    writeKey('broken', '{x');
    writeKey('number', '3');
    expect(readJson('ok')).toEqual({ x: 1 });
    expect(readJson('broken')).toEqual({});
    expect(readJson('number')).toEqual({});
    expect(readJson('missing')).toEqual({});
  });

  it('does nothing when the browser blocks storage, and says it could not tell', () => {
    setStorageForTests(blocked);
    expect(readKey('a')).toBeUndefined();
    expect(writeKey('a', '1')).toBe(false);
    expect(() => removeKeys('a')).not.toThrow();
    expect(readJson('a')).toEqual({});
  });
});

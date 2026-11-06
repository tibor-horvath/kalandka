import jsQR from 'jsqr';
import qrcode from 'qrcode-generator';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PROGRESS } from './progress';
import { addKid, applyUpdate, editKid, fromProgress, progressOf } from './profiles';
import { PIECE_BYTES, collect, isComplete, merge, pack, toPieces, unpack, type Collected } from './transfer';

const family = () => {
  let s = addKid(fromProgress(DEFAULT_PROGRESS, 'a'), { name: 'Lili', avatar: 'ladybug', age: '5' }, 'b');
  s = applyUpdate(s, 'a', (p) => ({ ...p, seeds: 42, addLevel: 7, garden: ['tulipan', 'pipacs'], stickersSeen: ['water-level-1'], robotOwned: ['hat'], voice: false }));
  return applyUpdate(s, 'b', (p) => ({ ...p, bolts: 12, seqSolved: 9 }));
};

/** Draws a piece as the parents' page does (byte mode, low correction, 4-module margin) and reads it back. */
function throughQr(piece: Uint8Array): Uint8Array {
  const qr = qrcode(0, 'L');
  qr.addData(String.fromCharCode(...piece), 'Byte');
  qr.make();
  const n = qr.getModuleCount();
  const px = 4;
  const size = (n + 8) * px;
  const img = new Uint8ClampedArray(size * size * 4).fill(255);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const [mx, my] = [Math.floor(x / px) - 4, Math.floor(y / px) - 4];
      if (mx >= 0 && my >= 0 && mx < n && my < n && qr.isDark(my, mx)) img.fill(0, (y * size + x) * 4, (y * size + x) * 4 + 3);
    }
  return Uint8Array.from(jsQR(img, size, size)!.binaryData);
}

const scanAll = (pieces: Uint8Array[], order = pieces.map((_, i) => i)) => order.reduce<Collected | null>((c, i) => collect(c, pieces[i]), null);

describe('transfer', () => {
  it('carries the pages a grown-up marked done, so a child cannot earn them twice', async () => {
    const s = applyUpdate(family(), 'b', (p) => ({ ...p, pagesDone: ['code.1.2.n.7.0'] }));
    const back = await unpack(scanAll(toPieces(await pack(s)))!);
    expect(progressOf(back!, 'b').pagesDone).toEqual(['code.1.2.n.7.0']);
  });

  it('carries every child, their progress, stickers and levels, and the device settings', async () => {
    const s = family();
    const c = scanAll(toPieces(await pack(s)));
    expect(isComplete(c)).toBe(true);
    const back = (await unpack(c!))!;
    expect(back.kids).toEqual(s.kids);
    expect(back.activeId).toBe(s.activeId);
    expect(progressOf(back, 'a')).toEqual(progressOf(s, 'a'));
    expect(progressOf(back, 'b')).toEqual(progressOf(s, 'b'));
    expect(progressOf(back, 'b').voice).toBe(false);
  });

  it('splits a large save into numbered codes that can be read in any order', async () => {
    const bytes = Uint8Array.from({ length: PIECE_BYTES * 2 + 10 }, (_, i) => (i * 7) % 251);
    const pieces = toPieces(bytes, 99);
    expect(pieces).toHaveLength(3);
    let c = scanAll(pieces, [2, 0]);
    expect(isComplete(c)).toBe(false);
    expect(collect(c, pieces[0])).toBe(c);
    c = collect(c, pieces[1]);
    expect(isComplete(c)).toBe(true);
    expect(Uint8Array.from(c!.pieces.flatMap((p) => [...p!]))).toEqual(bytes);
  });

  it('ignores other QR codes and starts over when a code from another transfer shows up', async () => {
    const one = toPieces(new Uint8Array(PIECE_BYTES + 1), 1);
    const two = toPieces(new Uint8Array(PIECE_BYTES + 1), 2);
    let c = collect(null, one[0]);
    expect(collect(c, new TextEncoder().encode('https://example.com'))).toBe(c);
    c = collect(c, two[1]);
    expect(c!.id).toBe(2);
    expect(c!.pieces.filter(Boolean)).toHaveLength(1);
  });

  it('survives a real QR code and camera reader, piece by piece', async () => {
    let s = family();
    s = applyUpdate(s, 'a', (p) => ({ ...p, garden: Array.from({ length: 400 }, (_, i) => ['tulipan', 'pipacs', 'ibolya'][i % 3]) }));
    const pieces = toPieces(await pack(s));
    const c = pieces.map(throughQr).reduce<Collected | null>(collect, null);
    expect(isComplete(c)).toBe(true);
    expect(progressOf((await unpack(c!))!, 'a').garden).toHaveLength(400);
  });

  it('refuses a set of codes that does not hold any profiles', async () => {
    const empty = scanAll(toPieces(new Uint8Array([1, 2, 3])));
    expect(await unpack(empty!)).toBeNull();
  });
});

describe('merging a transfer', () => {
  // The old device: Bence (a, frog) and Lili (b, ladybug).
  const sent = () => editKid(family(), 'a', { name: 'Bence' });

  it('replaces the blank profile a new device starts with', () => {
    const fresh = fromProgress(DEFAULT_PROGRESS, 'x');
    const m = merge(fresh, sent());
    expect(m.result.kids.map((k) => k.id)).toEqual(['a', 'b']);
    expect(m.added.map((k) => k.id)).toEqual(['a', 'b']);
    expect(m.result.activeId).toBe('a');
    expect(progressOf(m.result, 'a').seeds).toBe(42);
    expect(m.result.progress.x).toBeUndefined();
  });

  it('updates a child who is already here and keeps the children only this device has', () => {
    let here = applyUpdate(editKid(fromProgress(DEFAULT_PROGRESS, 'a'), 'a', { name: 'Bence' }), 'a', (p) => ({ ...p, seeds: 3 }));
    here = addKid(here, { name: 'Panni', avatar: 'bee', age: '6' }, 'c');
    here = applyUpdate(here, 'c', (p) => ({ ...p, seeds: 8 }));
    const m = merge({ ...here, activeId: 'c' }, sent());
    expect(m.result.kids.map((k) => k.id)).toEqual(['a', 'c', 'b']);
    expect(m.updated.map((k) => k.id)).toEqual(['a']);
    expect(m.added.map((k) => k.id)).toEqual(['b']);
    expect(progressOf(m.result, 'a').seeds).toBe(42);
    expect(progressOf(m.result, 'c').seeds).toBe(8);
    expect(m.result.activeId).toBe('c');
    expect(m.tooMany).toBe(false);
  });

  it('gives a child only on this device another figure when a sent child has theirs', () => {
    const here = applyUpdate(editKid(fromProgress(DEFAULT_PROGRESS, 'z'), 'z', { name: 'Zoé', avatar: 'ladybug' }), 'z', (p) => ({ ...p, seeds: 1 }));
    const m = merge(here, sent());
    const avatars = m.result.kids.map((k) => k.avatar);
    expect(new Set(avatars).size).toBe(avatars.length);
    expect(m.result.kids.find((k) => k.id === 'b')!.avatar).toBe('ladybug');
    expect(m.refigured.map((k) => k.id)).toEqual(['z']);
  });

  it('refuses more children than one device holds', () => {
    let here = applyUpdate(editKid(fromProgress(DEFAULT_PROGRESS, 'k0'), 'k0', { name: 'K0' }), 'k0', (p) => ({ ...p, seeds: 1 }));
    for (let i = 1; i < 5; i++) here = addKid(here, { name: `K${i}`, avatar: 'fish', age: null }, `k${i}`);
    expect(merge(here, sent()).tooMany).toBe(true);
  });
});

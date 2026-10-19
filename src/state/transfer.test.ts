import jsQR from 'jsqr';
import qrcode from 'qrcode-generator';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PROGRESS } from './progress';
import { addKid, applyUpdate, fromProgress, progressOf } from './profiles';
import { PIECE_BYTES, collect, isComplete, pack, toPieces, unpack, type Collected } from './transfer';

const family = () => {
  let s = addKid(fromProgress(DEFAULT_PROGRESS, 'a'), { name: 'Lili', avatar: 'ladybug', age: '5' }, 'b');
  s = applyUpdate(s, 'a', (p) => ({ ...p, seeds: 42, addLevel: 7, garden: ['tulipan', 'pipacs'], stickersSeen: ['water-1'], robotOwned: ['hat'], voice: false }));
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

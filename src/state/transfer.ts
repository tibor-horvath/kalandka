import { parseProfiles, type Profiles } from './profiles';

// Moving every profile to a new device without a server: the old device shows its whole save as QR
// codes and the new one reads them with its camera. The save is packed, then cut into numbered pieces
// small enough for a code a phone camera reads from a screen; most families fit in one or two.

/** "K1": a Kalandka transfer, format 1. Codes from anything else are ignored. */
const MAGIC = [0x4b, 0x31];
/** Magic, transfer id (2 bytes), piece index, piece count. */
const HEADER = 6;
/** Payload bytes per code: a version 13 code at low error correction, easy to read off a screen. */
export const PIECE_BYTES = 550;

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/** The save as compressed bytes. */
export async function pack(s: Profiles): Promise<Uint8Array> {
  return pipe(new TextEncoder().encode(JSON.stringify(s)), new CompressionStream('deflate-raw'));
}

/** Cuts the packed save into the pieces the codes carry. */
export function toPieces(bytes: Uint8Array, id = Math.floor(Math.random() * 0x10000)): Uint8Array[] {
  const total = Math.max(1, Math.ceil(bytes.length / PIECE_BYTES));
  if (total > 255) throw new Error('save too large to transfer');
  return Array.from({ length: total }, (_, i) => {
    const body = bytes.subarray(i * PIECE_BYTES, (i + 1) * PIECE_BYTES);
    const piece = new Uint8Array(HEADER + body.length);
    piece.set([...MAGIC, id >> 8, id & 0xff, i, total]);
    piece.set(body, HEADER);
    return piece;
  });
}

export async function packPieces(s: Profiles): Promise<Uint8Array[]> {
  return toPieces(await pack(s));
}

/** The pieces read so far; a code from a different transfer starts over. */
export interface Collected {
  id: number;
  total: number;
  pieces: (Uint8Array | null)[];
}

/** Adds a scanned code. Returns the same object when the code is not new, so callers can skip a render. */
export function collect(c: Collected | null, piece: Uint8Array): Collected | null {
  if (piece.length < HEADER || piece[0] !== MAGIC[0] || piece[1] !== MAGIC[1]) return c;
  const id = (piece[2] << 8) | piece[3];
  const [index, total] = [piece[4], piece[5]];
  if (!total || index >= total) return c;
  const base = c && c.id === id && c.total === total ? c : { id, total, pieces: Array<Uint8Array | null>(total).fill(null) };
  if (base.pieces[index]) return base;
  const pieces = base.pieces.slice();
  pieces[index] = piece.slice(HEADER);
  return { ...base, pieces };
}

export function isComplete(c: Collected | null): c is Collected {
  return !!c && c.pieces.every(Boolean);
}

/** The save from a full set of pieces, or null when it does not hold any profiles. */
export async function unpack(c: Collected): Promise<Profiles | null> {
  try {
    const parts = c.pieces as Uint8Array[];
    const bytes = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    parts.reduce((at, p) => (bytes.set(p, at), at + p.length), 0);
    const json = new TextDecoder().decode(await pipe(bytes, new DecompressionStream('deflate-raw')));
    const kids = (JSON.parse(json) as Partial<Profiles>).kids;
    // parseProfiles would turn an empty save into a fresh profile; that must not replace real ones.
    if (!Array.isArray(kids) || !kids.length) return null;
    return parseProfiles(json, null);
  } catch {
    return null;
  }
}


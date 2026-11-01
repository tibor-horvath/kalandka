import type { Density } from './sheet';

// The QR code on a printed page: its address names the page, so anyone's phone can show that page's answers.
// Everything stands after the #, which browsers never send to the server. No child's data goes in it.
// Only types come from the sheets, so App can read an address without loading them.

const FORMAT = 1;

const DENSITY_CODES: Record<Density, string> = { big: 'b', normal: 'n', many: 'm' };

/** One printed page, as named by its link. */
export interface PageRef {
  /** The game's PrintId; only the catalog can tell whether it is one. */
  id: string;
  /** The game's `PrintSpec.rev` when the page was printed. */
  rev: number;
  level: number;
  density: Density;
  batch: number;
  page: number;
}

/** What an address says: a page, a link from a newer app than this one, or something that is not a link of ours. */
export type ReadLink = { kind: 'page'; ref: PageRef } | { kind: 'newer' } | { kind: 'bad' };

/** A page's name: in its link, and in `Progress.pagesDone` once a grown-up marks it done. Starts with the game's id. */
export function pageKey(r: PageRef): string {
  return `${r.id}.${r.rev}.${r.level}.${DENSITY_CODES[r.density]}.${r.batch}.${r.page}`;
}

export function linkHash(r: PageRef): string {
  return `#lap${FORMAT}=${pageKey(r)}`;
}

/** The whole address for the QR code. */
export function linkUrl(r: PageRef): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}${linkHash(r)}`;
}

/** Reads `location.hash`; null when the address is not about a page at all. */
export function readLink(hash: string): ReadLink | null {
  const link = /^#lap(\d+)=/.exec(hash);
  if (!link) return null;
  if (Number(link[1]) > FORMAT) return { kind: 'newer' };
  const m = /^#lap\d+=([a-z]+)\.(\d{1,4})\.(\d{1,2})\.([bnm])\.(\d{1,9})\.(\d)$/.exec(hash);
  if (!m) return { kind: 'bad' };
  const density = (Object.keys(DENSITY_CODES) as Density[]).find((d) => DENSITY_CODES[d] === m[4])!;
  const ref: PageRef = { id: m[1], rev: Number(m[2]), level: Number(m[3]), density, batch: Number(m[5]), page: Number(m[6]) };
  // Only the spelling we print counts, so "#lap01=" or "007" cannot stand for a page.
  return linkHash(ref) === hash ? { kind: 'page', ref } : { kind: 'bad' };
}

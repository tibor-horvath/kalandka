import type { CSSProperties } from 'react';
import { gameOf, type Sticker } from '../state/stickers';
import { worldInfo } from '../state/worlds';
import { WORLD_MARKS } from '../worlds/marks';

// Artwork for the stickers and the sticker album, shared by every world.

const SHEET = 'M28 18H62L72 28V80H28Z';
const SHEET_INK = '#10233A';

/**
 * The page drawn on a Feladatlapok sticker, under its mark: one sheet (a stack from five pages on) with a folded
 * corner, and the world's sign in the corner (see the worlds' marks.tsx). 100 × 100, the
 * sticker's inside.
 */
function SheetArt({ sticker }: { sticker: Sticker }) {
  const world = gameOf(sticker).world;
  const badge = worldInfo(world).color;
  const { SheetMark } = WORLD_MARKS[world];
  const page = (turn: number) => <path d={SHEET} transform={`rotate(${turn} 50 80)`} fill="#FFFFFF" stroke={SHEET_INK} strokeWidth="3" strokeLinejoin="round" />;
  return (
    <svg aria-hidden="true" className="sticker__art" viewBox="0 0 100 100">
      {sticker.sheets === 'stack' && (
        <>
          {page(-10)}
          {page(6)}
        </>
      )}
      {page(0)}
      <path d="M62 18V28H72" fill="#EEF1F4" stroke={SHEET_INK} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="76" cy="76" r="13" fill={badge} stroke="#FFFFFF" strokeWidth="3" />
      <SheetMark color={badge} />
      {sticker.gold && <path d="M22 9L25.1 15.7L32.4 16.5L27 21.5L28.5 28.7L22 25.1L15.5 28.7L17 21.5L11.6 16.5L18.9 15.7Z" fill="#FFC93C" stroke="#FFFFFF" strokeWidth="2.4" strokeLinejoin="round" />}
    </svg>
  );
}

/** A collected sticker: the game's colour, a white rim (gold on a row's last) and its mark. Size comes from CSS. */
export function StickerDisc({ sticker, className = '', tilt = 0 }: { sticker: Sticker; className?: string; tilt?: number }) {
  const game = gameOf(sticker);
  const style = { '--sticker': game.color, '--sticker-ink': game.ink, '--tilt': `${tilt}deg` } as CSSProperties;
  const kind = `${sticker.sheets ? ' sticker--sheet' : ''}${sticker.gold ? ' sticker--gold' : ''}`;
  return (
    <span className={`sticker${kind} ${className}`} style={style} aria-hidden="true">
      {sticker.sheets && <SheetArt sticker={sticker} />}
      <span className="sticker__mark">{sticker.mark}</span>
    </span>
  );
}

/** An empty place in the album, with the mark of the sticker that will go there (on a faint page for Feladatlapok). */
export function StickerSlot({ sticker, className = '' }: { sticker: Sticker; className?: string }) {
  return (
    <span className={`sticker-slot${sticker.sheets ? ' sticker-slot--sheet' : ''} ${className}`} aria-hidden="true">
      {sticker.sheets && (
        <svg className="sticker__art" viewBox="0 0 100 100">
          <path d={SHEET} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" opacity="0.4" />
        </svg>
      )}
      <span className="sticker__mark">{sticker.mark}</span>
    </span>
  );
}

/** The sticker album on the island: a purple book open on a page of stickers, one place still empty. */
export function StickerBookArt({ size = 100 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size * 1.1} viewBox="0 0 100 110">
      <rect x="8" y="4" width="84" height="102" rx="10" fill="#7A4FB5" />
      <rect x="8" y="4" width="12" height="102" rx="6" fill="#563682" />
      <rect x="24" y="12" width="60" height="86" rx="6" fill="#FFFFFF" />
      <circle cx="40" cy="36" r="11" fill="#2E86DE" stroke="#FFFFFF" strokeWidth="3" />
      <circle cx="68" cy="36" r="11" fill="#FFC93C" stroke="#FFFFFF" strokeWidth="3" />
      <circle cx="40" cy="72" r="11" fill="#F4A3C4" stroke="#FFFFFF" strokeWidth="3" />
      <circle cx="68" cy="72" r="10" fill="none" stroke="#B9A3D6" strokeWidth="3" strokeDasharray="5 4" />
    </svg>
  );
}

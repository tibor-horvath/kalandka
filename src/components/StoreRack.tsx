import type { ReactNode } from 'react';
import { STORE_MAX } from '../state/balance';

// The worlds' stores drawn as the real things they are (Magtár, Raktár, Harangtár): the reward packed by tens
// into twenty packs (sacks, bins, straps) and the rest, one by one, in a ten-place frame beside them, five and
// five. A full frame is packed by the guide; spending opens a pack again when the frame holds too few.
// It only shows what the save holds; nothing here changes it.

interface RackProps {
  /** What the store holds now. */
  n: number;
  /** "store--seeds": the world's look. */
  className: string;
  /** Packs per row: 10 for sacks and straps (two rows), 5 for the workshop's bins (four shelves). */
  perRow: number;
  pack: ReactNode;
  one: (i: number) => ReactNode;
  /** "zsák", "doboz", "szíj". */
  packName: string;
  /** "mag", "csavar", "harang". */
  oneName: string;
  /** Under the frame: "Magosláda". */
  frameName: string;
}

function StoreRack({ n, className, perRow, pack, one, packName, oneName, frameName }: RackProps) {
  const packs = Math.floor(n / 10);
  const ones = n % 10;
  const shown = Math.min(packs, STORE_MAX / 10);
  const rows = Array.from({ length: STORE_MAX / 10 / perRow }, (_, r) => Array.from({ length: perRow }, (_, c) => r * perRow + c < shown));
  return (
    <div className={`store ${className}`} role="img" aria-label={`${packs} ${packName} és ${ones} ${oneName}, összesen ${n} ${oneName}.`}>
      <div className="store__rack" aria-hidden="true">
        {rows.map((row, r) => (
          <div key={r} className="store__row">
            <div className="store__places">
              {row.map((on, c) => (
                <span key={c} className={`store__place${on ? '' : ' is-empty'}${c === 4 && perRow === 10 ? ' is-half' : ''}`}>
                  {on && pack}
                </span>
              ))}
            </div>
            <span className="store__ledge" />
          </div>
        ))}
      </div>
      <div className="store__foot" aria-hidden="true">
        <span className="store__frame">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={`store__cell${i < ones ? '' : ' is-empty'}`}>
              {i < ones && one(i)}
            </span>
          ))}
        </span>
        <span className="store__sum">
          <b>
            {packs} {packName} és {ones} {oneName}
          </b>
          <span>{frameName}</span>
        </span>
      </div>
    </div>
  );
}

// ---------- the garden: jute sacks and the seed box ----------

function Sack() {
  return (
    <svg viewBox="0 0 48 66" aria-hidden="true">
      <path d="M10 16 Q6 40 6 52 Q6 64 24 64 Q42 64 42 52 Q42 40 38 16 Z" fill="#c9a26b" />
      <path d="M12 26h24M10 36h28M9 46h30M10 56h28" stroke="#b08850" strokeWidth="1.2" />
      <path d="M14 8 Q18 14 24 15 Q30 14 34 8 L36 16 H12 Z" fill="#d8b47e" />
      <path d="M12 16 Q24 20 36 16" stroke="#7a5228" strokeWidth="2.5" fill="none" />
      <ellipse cx="24" cy="40" rx="6" ry="9" fill="#8a5a3b" transform="rotate(25 24 40)" />
    </svg>
  );
}

function SeedGrain() {
  return (
    <svg viewBox="0 0 20 26" aria-hidden="true">
      <ellipse cx="10" cy="13" rx="6" ry="10" fill="#6e4426" transform="rotate(20 10 13)" />
      <ellipse cx="8" cy="10" rx="1.6" ry="4" fill="#ffffff" opacity="0.3" transform="rotate(20 8 10)" />
    </svg>
  );
}

/** The Magtár's seeds: jute sacks of ten on two pallets, the rest in the seed box. */
export function SeedStore({ n }: { n: number }) {
  return <StoreRack n={n} className="store--seeds" perRow={10} pack={<Sack />} one={() => <SeedGrain />} packName="zsák" oneName="mag" frameName="Magosláda" />;
}

// ---------- the workshop: blue bins and the compartment box ----------

/** A hex nut seen from above and a little to the side. */
export function HexNut() {
  return (
    <svg viewBox="0 0 40 30" aria-hidden="true">
      <polygon points="3,12 11,19 11,27 3,20" fill="#8f9aa4" />
      <polygon points="11,19 29,19 29,27 11,27" fill="#a9b3bc" />
      <polygon points="29,19 37,12 37,20 29,27" fill="#c2cad1" />
      <polygon points="3,12 11,5 29,5 37,12 29,19 11,19" fill="#d5dbe0" />
      <g fill="none" stroke="#5e6b77" strokeWidth="1.2" strokeLinejoin="round">
        <polygon points="3,12 11,5 29,5 37,12 37,20 29,27 11,27 3,20" />
        <path d="M3 12L11 19H29L37 12M11 19V27M29 19V27" />
      </g>
      <ellipse cx="20" cy="12" rx="13" ry="6.2" fill="#e6eaee" />
      <ellipse cx="20" cy="12" rx="7.5" ry="3.8" fill="#7d8a96" />
      <ellipse cx="20" cy="12.6" rx="6" ry="2.8" fill="none" stroke="#b9c2ca" strokeWidth="0.9" />
      <ellipse cx="20" cy="13.2" rx="4.4" ry="1.9" fill="#4f5a64" />
      <path d="M12 9.5Q15.5 6.8 20 6.6" stroke="#ffffff" strokeWidth="1.2" fill="none" opacity="0.8" />
    </svg>
  );
}

/** A socket cap screw standing on its point. */
export function CapScrew() {
  return (
    <svg viewBox="0 0 24 36" aria-hidden="true">
      <rect x="9" y="13" width="6" height="19" fill="#b9c2ca" stroke="#5e6b77" strokeWidth="1.1" />
      <path d="M9 16.5l6-1.6M9 20l6-1.6M9 23.5l6-1.6M9 27l6-1.6M9 30.5l6-1.6" stroke="#7d8a96" strokeWidth="1" />
      <path d="M9 32h6l-0.8 2h-4.4z" fill="#a9b3bc" stroke="#5e6b77" strokeWidth="1" strokeLinejoin="round" />
      <path d="M4 5v8a8 2.8 0 0 0 16 0V5z" fill="#8f9aa4" stroke="#5e6b77" strokeWidth="1.2" />
      <path d="M6 7v6M8.5 7.6v6.4M15.5 7.6v6.4M18 7v6" stroke="#6b7782" strokeWidth="0.9" />
      <ellipse cx="12" cy="5" rx="8" ry="2.8" fill="#d5dbe0" stroke="#5e6b77" strokeWidth="1.2" />
      <polygon points="9.6,5 10.8,3.8 13.2,3.8 14.4,5 13.2,6.2 10.8,6.2" fill="#3f4a54" />
    </svg>
  );
}

function Bin() {
  return (
    <svg viewBox="0 0 92 80" aria-hidden="true">
      <path d="M6 10H86V76Q86 79 83 79H9Q6 79 6 76Z" fill="#2e6fb3" />
      <path d="M6 10H86V30Q46 40 6 30Z" fill="#1f528a" />
      <g transform="translate(16 17) scale(0.55) rotate(-12 20 15)">
        <HexNutShape />
      </g>
      <g transform="translate(40 8) scale(0.62) rotate(-8 12 18)">
        <CapScrewShape />
      </g>
      <g transform="translate(52 15) scale(0.55) rotate(10 20 15)">
        <HexNutShape />
      </g>
      <path d="M6 30Q46 40 86 30" stroke="#5a92cf" strokeWidth="3" fill="none" />
      <rect x="26" y="48" width="40" height="18" rx="2" fill="#ffffff" />
      <g transform="translate(29 51) scale(0.36)">
        <HexNutShape />
      </g>
      <g transform="translate(44 49) scale(0.42)">
        <CapScrewShape />
      </g>
      <text x="57" y="62" fontFamily="Baloo 2, sans-serif" fontSize="10" fontWeight="800" fill="#3f4f5e">
        10
      </text>
    </svg>
  );
}

/** The nut's shapes without its own svg, for drawing inside a bin. */
function HexNutShape() {
  return (
    <>
      <polygon points="3,12 11,19 11,27 3,20" fill="#8f9aa4" />
      <polygon points="11,19 29,19 29,27 11,27" fill="#a9b3bc" />
      <polygon points="29,19 37,12 37,20 29,27" fill="#c2cad1" />
      <polygon points="3,12 11,5 29,5 37,12 29,19 11,19" fill="#d5dbe0" />
      <polygon points="3,12 11,5 29,5 37,12 37,20 29,27 11,27 3,20" fill="none" stroke="#5e6b77" strokeWidth="1.2" />
      <ellipse cx="20" cy="12" rx="13" ry="6.2" fill="#e6eaee" />
      <ellipse cx="20" cy="12" rx="7.5" ry="3.8" fill="#7d8a96" />
      <ellipse cx="20" cy="13.2" rx="4.4" ry="1.9" fill="#4f5a64" />
    </>
  );
}

/** The cap screw's shapes without its own svg, for drawing inside a bin. */
function CapScrewShape() {
  return (
    <>
      <rect x="9" y="13" width="6" height="19" fill="#b9c2ca" stroke="#5e6b77" strokeWidth="1.1" />
      <path d="M9 16.5l6-1.6M9 20l6-1.6M9 23.5l6-1.6M9 27l6-1.6M9 30.5l6-1.6" stroke="#7d8a96" strokeWidth="1" />
      <path d="M4 5v8a8 2.8 0 0 0 16 0V5z" fill="#8f9aa4" stroke="#5e6b77" strokeWidth="1.2" />
      <ellipse cx="12" cy="5" rx="8" ry="2.8" fill="#d5dbe0" stroke="#5e6b77" strokeWidth="1.2" />
      <polygon points="9.6,5 10.8,3.8 13.2,3.8 14.4,5 13.2,6.2 10.8,6.2" fill="#3f4a54" />
    </>
  );
}

/** The Raktár's bolts: blue bins of ten on a metal shelf, the rest in the clear compartment box; nuts and cap screws take turns. */
export function BoltStore({ n }: { n: number }) {
  return (
    <StoreRack
      n={n}
      className="store--bolts"
      perRow={5}
      pack={<Bin />}
      one={(i) => (i % 2 === 0 ? <HexNut /> : <CapScrew />)}
      packName="doboz"
      oneName="csavar"
      frameName="Rekeszes doboz"
    />
  );
}

// ---------- the tower: straps of bells and the hook board ----------

/** A small brass bell: a ring on top, a flared body with its lip, the clapper below. */
export function BrassBell() {
  return (
    <svg viewBox="0 0 16 17" aria-hidden="true">
      <circle cx="8" cy="1.8" r="1.5" fill="none" stroke="#7a5a00" strokeWidth="1.2" />
      <path d="M8 3C5 3 4 5.5 4 8.5V10.5L2.2 13.6H13.8L12 10.5V8.5C12 5.5 11 3 8 3Z" fill="#e0a800" stroke="#7a5a00" strokeWidth="0.9" />
      <path d="M5.6 6.2C5.2 7.4 5.2 9 5.2 10.4" stroke="#ffe27a" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <rect x="2" y="13" width="12" height="1.8" rx="0.9" fill="#b98a00" />
      <circle cx="8" cy="15.6" r="1.2" fill="#7a5a00" />
    </svg>
  );
}

function Strap() {
  return (
    <span className="store__strap">
      {Array.from({ length: 10 }, (_, i) => (
        <BrassBell key={i} />
      ))}
    </span>
  );
}

/** The Harangtár's bells: leather straps of ten on two peg rails, the rest on the hook board. */
export function BellStore({ n }: { n: number }) {
  return <StoreRack n={n} className="store--bells" perRow={10} pack={<Strap />} one={() => <BrassBell />} packName="szíj" oneName="harang" frameName="Kampós tábla" />;
}

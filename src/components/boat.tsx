/**
 * The child's boat: a wooden hull, a red mainsail with a yellow star and a white jib. The same boat waits on the
 * Kalandka map and at each island's dock. Drawn in SVG units around its waterline: the hull's top edge on y = 0,
 * centred on x = 0, the mast reaching up to y = -86.
 */
export function BoatArt() {
  return (
    <>
      <path d="M-48 0 H48 L32 22 H-32 Z" fill="#C98B50" stroke="#8A5A3B" strokeWidth="4" strokeLinejoin="round" />
      <path d="M-2 0 V-86" stroke="#8A5A3B" strokeWidth="5" strokeLinecap="round" />
      <path d="M4 -82 L52 -12 H4 Z" fill="#B4335A" stroke="#FFFFFF" strokeWidth="3" strokeLinejoin="round" />
      <path d="M-8 -76 L-42 -14 H-8 Z" fill="#FFFFFF" />
      <path d="M22 -48 l3.5 7 7.5 1 -5.5 5 1.5 7.5 -7 -3.6 -7 3.6 1.5 -7.5 -5.5 -5 7.5 -1 z" fill="#FFC93C" />
    </>
  );
}

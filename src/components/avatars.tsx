import type { AvatarId } from '../state/profiles';

const INK = '#10233A';

/** Each child's figure: a name for screen readers and the card colour drawn around it. */
export const AVATARS: Record<AvatarId, { name: string; ring: string }> = {
  frog: { name: 'Béka', ring: '#2F7D32' },
  ladybug: { name: 'Katica', ring: '#C2372B' },
  bee: { name: 'Méhecske', ring: '#E0A800' },
  snail: { name: 'Csiga', ring: '#8A5A3B' },
  flower: { name: 'Virág', ring: '#C2407A' },
  fish: { name: 'Halacska', ring: '#1F6FC0' }
};

function Figure({ id }: { id: AvatarId }) {
  switch (id) {
    case 'frog':
      return (
        <>
          <circle cx="60" cy="60" r="60" fill="#E4F4DA" />
          <ellipse cx="60" cy="76" rx="38" ry="30" fill="#5BAA4A" />
          <circle cx="40" cy="46" r="14" fill="#5BAA4A" />
          <circle cx="80" cy="46" r="14" fill="#5BAA4A" />
          <circle cx="40" cy="46" r="8" fill="#FFFFFF" />
          <circle cx="80" cy="46" r="8" fill="#FFFFFF" />
          <circle cx="41" cy="47" r="4.5" fill={INK} />
          <circle cx="81" cy="47" r="4.5" fill={INK} />
          <path d="M44 80 Q60 94 76 80" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <ellipse cx="34" cy="78" rx="6" ry="4" fill="#F79AB8" />
          <ellipse cx="86" cy="78" rx="6" ry="4" fill="#F79AB8" />
        </>
      );
    case 'ladybug':
      return (
        <>
          <circle cx="60" cy="60" r="60" fill="#FFE3E0" />
          <path d="M52 24 Q46 12 39 14" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M68 24 Q74 12 81 14" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <circle cx="39" cy="14" r="3.5" fill={INK} />
          <circle cx="81" cy="14" r="3.5" fill={INK} />
          <ellipse cx="60" cy="38" rx="24" ry="18" fill={INK} />
          <circle cx="51" cy="31" r="5" fill="#FFFFFF" />
          <circle cx="69" cy="31" r="5" fill="#FFFFFF" />
          <circle cx="52" cy="32" r="2.5" fill={INK} />
          <circle cx="70" cy="32" r="2.5" fill={INK} />
          <circle cx="60" cy="72" r="34" fill="#E5483B" />
          <path d="M60 40 V106" stroke={INK} strokeWidth="4" />
          <circle cx="44" cy="64" r="6.5" fill={INK} />
          <circle cx="76" cy="64" r="6.5" fill={INK} />
          <circle cx="47" cy="88" r="5.5" fill={INK} />
          <circle cx="73" cy="88" r="5.5" fill={INK} />
        </>
      );
    case 'bee':
      return (
        <>
          <circle cx="60" cy="60" r="60" fill="#FFF4CC" />
          <ellipse cx="50" cy="38" rx="13" ry="18" transform="rotate(-20 50 38)" fill="#FFFFFF" stroke="#BFDDF2" strokeWidth="3" />
          <ellipse cx="72" cy="38" rx="13" ry="18" transform="rotate(20 72 38)" fill="#FFFFFF" stroke="#BFDDF2" strokeWidth="3" />
          <path d="M93 70 L104 65 L104 75 Z" fill={INK} />
          <ellipse cx="60" cy="70" rx="34" ry="28" fill="#FFC93C" />
          <path d="M68 45 Q71 70 68 95" stroke={INK} strokeWidth="8" fill="none" />
          <path d="M82 51 Q84 70 82 89" stroke={INK} strokeWidth="7" fill="none" />
          <circle cx="42" cy="66" r="4.5" fill={INK} />
          <circle cx="55" cy="66" r="4.5" fill={INK} />
          <path d="M42 78 Q49 84 56 78" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
          <ellipse cx="35" cy="76" rx="5" ry="3.5" fill="#F79AB8" />
        </>
      );
    case 'snail':
      return (
        <>
          <circle cx="60" cy="60" r="60" fill="#F3E6DA" />
          <path d="M90 62 L86 46" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <path d="M98 62 L104 46" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <circle cx="86" cy="46" r="3.5" fill={INK} />
          <circle cx="104" cy="46" r="3.5" fill={INK} />
          <rect x="18" y="82" width="86" height="16" rx="8" fill="#E8B98A" />
          <circle cx="94" cy="74" r="13" fill="#E8B98A" />
          <circle cx="54" cy="64" r="27" fill="#C47A45" />
          <path d="M54 64 m-4 0 a4 4 0 1 1 8 0 a10 10 0 1 1 -18 2 a16 16 0 1 1 30 -4" stroke="#8A5A3B" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="97" cy="72" r="3" fill={INK} />
          <path d="M90 80 Q95 84 100 80" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      );
    case 'flower':
      return (
        <>
          <circle cx="60" cy="60" r="60" fill="#FDE7F0" />
          <circle cx="60" cy="34" r="16" fill="#F79AB8" />
          <circle cx="84.7" cy="52" r="16" fill="#F79AB8" />
          <circle cx="75.3" cy="81" r="16" fill="#F79AB8" />
          <circle cx="44.7" cy="81" r="16" fill="#F79AB8" />
          <circle cx="35.3" cy="52" r="16" fill="#F79AB8" />
          <circle cx="60" cy="60" r="20" fill="#FFC93C" />
          <circle cx="53" cy="57" r="3.5" fill={INK} />
          <circle cx="67" cy="57" r="3.5" fill={INK} />
          <path d="M52 66 Q60 73 68 66" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      );
    case 'fish':
      return (
        <>
          <circle cx="60" cy="60" r="60" fill="#E3F1FC" />
          <path d="M84 60 L104 44 L104 76 Z" fill="#1F5C9E" />
          <ellipse cx="56" cy="60" rx="34" ry="24" fill="#2E86DE" />
          <path d="M54 38 Q62 30 70 38" fill="#1F5C9E" />
          <circle cx="40" cy="54" r="7" fill="#FFFFFF" />
          <circle cx="39" cy="55" r="3.5" fill={INK} />
          <path d="M32 68 Q38 73 45 68" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      );
  }
}

/** A child's round figure. Decorative: the name next to it carries the meaning. */
export function Avatar({ id, size = 64 }: { id: AvatarId; size?: number }) {
  return (
    <svg className="avatar" aria-hidden="true" width={size} height={size} viewBox="0 0 120 120">
      <Figure id={id} />
    </svg>
  );
}

import type { AvatarId } from '../state/profiles';

const INK = '#10233A';

/** Each child's figure: a name for screen readers and the card colour drawn around it. */
export const AVATARS: Record<AvatarId, { name: string; ring: string }> = {
  frog: { name: 'Béka', ring: '#2F7D32' },
  ladybug: { name: 'Katica', ring: '#C2372B' },
  bee: { name: 'Méhecske', ring: '#E0A800' },
  snail: { name: 'Csiga', ring: '#8A5A3B' },
  flower: { name: 'Virág', ring: '#C2407A' },
  fish: { name: 'Halacska', ring: '#1F6FC0' },
  bunny: { name: 'Nyuszi', ring: '#6B4FBF' },
  panda: { name: 'Panda', ring: '#2E3A4A' },
  fox: { name: 'Róka', ring: '#D9661F' },
  hedgehog: { name: 'Süni', ring: '#8B6F2E' },
  owl: { name: 'Bagoly', ring: '#8E3A8F' },
  penguin: { name: 'Pingvin', ring: '#23436E' },
  turtle: { name: 'Teknős', ring: '#138A82' },
  butterfly: { name: 'Pillangó', ring: '#E35D4F' },
  puppy: { name: 'Kutyus', ring: '#A86B3C' },
  mouse: { name: 'Egérke', ring: '#6B7785' },
  dino: { name: 'Dínó', ring: '#5E9E1E' },
  piglet: { name: 'Malacka', ring: '#D9677F' }
};

const CHEEK = '#F79AB8';
const BEAK = '#F2A33A';

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
    case 'bunny':
      return (
        <>
          <circle cx="60" cy="60" r="60" fill="#ECE6F8" />
          <ellipse cx="45" cy="32" rx="11" ry="25" transform="rotate(-8 45 32)" fill="#FFFFFF" />
          <ellipse cx="75" cy="32" rx="11" ry="25" transform="rotate(8 75 32)" fill="#FFFFFF" />
          <ellipse cx="45" cy="33" rx="5" ry="17" transform="rotate(-8 45 33)" fill="#F7B6C8" />
          <ellipse cx="75" cy="33" rx="5" ry="17" transform="rotate(8 75 33)" fill="#F7B6C8" />
          <ellipse cx="60" cy="74" rx="35" ry="30" fill="#FFFFFF" />
          <circle cx="47" cy="70" r="4.5" fill={INK} />
          <circle cx="73" cy="70" r="4.5" fill={INK} />
          <ellipse cx="60" cy="79" rx="5" ry="3.5" fill="#E57A93" />
          <path d="M53 86 Q56.5 90 60 85 Q63.5 90 67 86" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="37" cy="81" rx="6" ry="4" fill={CHEEK} />
          <ellipse cx="83" cy="81" rx="6" ry="4" fill={CHEEK} />
        </>
      );
    case 'panda':
      return (
        <>
          <circle cx="60" cy="60" r="60" fill="#E6ECF0" />
          <circle cx="34" cy="36" r="13" fill="#2E3A4A" />
          <circle cx="86" cy="36" r="13" fill="#2E3A4A" />
          <ellipse cx="60" cy="68" rx="38" ry="34" fill="#FFFFFF" />
          <ellipse cx="45" cy="63" rx="10" ry="12" transform="rotate(25 45 63)" fill="#2E3A4A" />
          <ellipse cx="75" cy="63" rx="10" ry="12" transform="rotate(-25 75 63)" fill="#2E3A4A" />
          <circle cx="46" cy="62" r="4" fill="#FFFFFF" />
          <circle cx="74" cy="62" r="4" fill="#FFFFFF" />
          <circle cx="46.5" cy="62.5" r="2" fill={INK} />
          <circle cx="73.5" cy="62.5" r="2" fill={INK} />
          <ellipse cx="60" cy="78" rx="6" ry="4" fill={INK} />
          <path d="M53 86 Q60 92 67 86" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <ellipse cx="34" cy="82" rx="6" ry="4" fill={CHEEK} />
          <ellipse cx="86" cy="82" rx="6" ry="4" fill={CHEEK} />
        </>
      );
    case 'fox':
      return (
        <>
          <circle cx="60" cy="60" r="60" fill="#FDEBDD" />
          <path d="M27 16 L52 40 L27 54 Z" fill="#F08A3C" />
          <path d="M93 16 L68 40 L93 54 Z" fill="#F08A3C" />
          <path d="M32 27 L45 40 L32 47 Z" fill="#A84F1A" />
          <path d="M88 27 L75 40 L88 47 Z" fill="#A84F1A" />
          <path d="M22 48 Q60 26 98 48 Q96 82 60 102 Q24 82 22 48 Z" fill="#F08A3C" />
          <path d="M33 70 Q60 60 87 70 Q76 93 60 102 Q44 93 33 70 Z" fill="#FFFFFF" />
          <circle cx="46" cy="58" r="4.5" fill={INK} />
          <circle cx="74" cy="58" r="4.5" fill={INK} />
          <ellipse cx="60" cy="88" rx="6" ry="4.5" fill={INK} />
          <ellipse cx="36" cy="70" rx="5" ry="3.5" fill={CHEEK} />
          <ellipse cx="84" cy="70" rx="5" ry="3.5" fill={CHEEK} />
        </>
      );
    case 'hedgehog':
      return (
        <>
          <circle cx="60" cy="60" r="60" fill="#F4EEDC" />
          <path
            d="M60 13 L65.7 27.5 L76.1 15.8 L76.5 31.4 L90.2 24 L85.3 38.8 L100.7 36.5 L91 48.7 L106.3 51.8 L93 60 L106.3 68.2 L91 71.3 L100.7 83.5 L85.3 81.2 L90.2 96 L76.5 88.6 L76.1 104.2 L65.7 92.5 L60 107 L54.3 92.5 L43.9 104.2 L43.5 88.6 L29.8 96 L34.7 81.2 L19.3 83.5 L29 71.3 L13.7 68.2 L27 60 L13.7 51.8 L29 48.7 L19.3 36.5 L34.7 38.8 L29.8 24 L43.5 31.4 L43.9 15.8 L54.3 27.5 Z"
            fill="#7A5230"
          />
          <ellipse cx="60" cy="68" rx="30" ry="27" fill="#F1D3AE" />
          <circle cx="49" cy="63" r="4.5" fill={INK} />
          <circle cx="71" cy="63" r="4.5" fill={INK} />
          <ellipse cx="60" cy="73" rx="6" ry="4.5" fill={INK} />
          <path d="M54 82 Q60 87 66 82" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <ellipse cx="40" cy="76" rx="5" ry="3.5" fill={CHEEK} />
          <ellipse cx="80" cy="76" rx="5" ry="3.5" fill={CHEEK} />
        </>
      );
    case 'owl':
      return (
        <>
          <circle cx="60" cy="60" r="60" fill="#F6E6F4" />
          <path d="M26 22 L48 38 L30 50 Z" fill="#A35AA0" />
          <path d="M94 22 L72 38 L90 50 Z" fill="#A35AA0" />
          <ellipse cx="60" cy="68" rx="36" ry="38" fill="#A35AA0" />
          <ellipse cx="60" cy="86" rx="21" ry="18" fill="#EBD0E8" />
          <circle cx="46" cy="56" r="13" fill="#FFFFFF" />
          <circle cx="74" cy="56" r="13" fill="#FFFFFF" />
          <circle cx="47" cy="57" r="5.5" fill={INK} />
          <circle cx="73" cy="57" r="5.5" fill={INK} />
          <path d="M54 67 L66 67 L60 76 Z" fill={BEAK} />
          <path d="M51 84 Q54.5 88 58 84 M62 84 Q65.5 88 69 84 M56.5 92 Q60 96 63.5 92" stroke="#A35AA0" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      );
    case 'penguin':
      return (
        <>
          <circle cx="60" cy="60" r="60" fill="#E2ECF6" />
          <ellipse cx="27" cy="74" rx="7" ry="18" transform="rotate(22 27 74)" fill="#23436E" />
          <ellipse cx="93" cy="74" rx="7" ry="18" transform="rotate(-22 93 74)" fill="#23436E" />
          <ellipse cx="48" cy="106" rx="9" ry="4.5" fill={BEAK} />
          <ellipse cx="72" cy="106" rx="9" ry="4.5" fill={BEAK} />
          <ellipse cx="60" cy="65" rx="35" ry="41" fill="#23436E" />
          <circle cx="48" cy="56" r="15" fill="#FFFFFF" />
          <circle cx="72" cy="56" r="15" fill="#FFFFFF" />
          <ellipse cx="60" cy="80" rx="25" ry="23" fill="#FFFFFF" />
          <circle cx="49" cy="56" r="4.5" fill={INK} />
          <circle cx="71" cy="56" r="4.5" fill={INK} />
          <path d="M54 65 L66 65 L60 73 Z" fill={BEAK} />
          <ellipse cx="41" cy="68" rx="5" ry="3.5" fill={CHEEK} />
          <ellipse cx="79" cy="68" rx="5" ry="3.5" fill={CHEEK} />
        </>
      );
    case 'turtle':
      return (
        <>
          <circle cx="60" cy="60" r="60" fill="#DDF3EF" />
          <path d="M20 82 L10 86 L20 90 Z" fill="#7BC47F" />
          <ellipse cx="36" cy="92" rx="9" ry="7" fill="#7BC47F" />
          <ellipse cx="80" cy="92" rx="9" ry="7" fill="#7BC47F" />
          <circle cx="99" cy="66" r="14" fill="#7BC47F" />
          <path d="M20 82 Q20 40 58 40 Q96 40 96 82 Z" fill="#1E9C90" />
          <rect x="16" y="78" width="84" height="10" rx="5" fill="#13756C" />
          <path d="M58 50 L69 56 L69 68 L58 74 L47 68 L47 56 Z" fill="#5FC3B6" />
          <path d="M34 60 L41 64 L41 74 L34 78 L27 74 L27 64 Z" fill="#5FC3B6" />
          <path d="M82 60 L89 64 L89 74 L82 78 L75 74 L75 64 Z" fill="#5FC3B6" />
          <circle cx="103" cy="62" r="3.5" fill={INK} />
          <path d="M98 71 Q103 75 108 70" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      );
    case 'butterfly':
      return (
        <>
          <circle cx="60" cy="60" r="60" fill="#FDE6E2" />
          <path d="M56 30 Q52 18 44 15" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M64 30 Q68 18 76 15" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="44" cy="15" r="3.5" fill={INK} />
          <circle cx="76" cy="15" r="3.5" fill={INK} />
          <ellipse cx="36" cy="52" rx="23" ry="19" transform="rotate(-25 36 52)" fill="#F07A5E" />
          <ellipse cx="84" cy="52" rx="23" ry="19" transform="rotate(25 84 52)" fill="#F07A5E" />
          <ellipse cx="42" cy="84" rx="16" ry="14" fill="#FFC93C" />
          <ellipse cx="78" cy="84" rx="16" ry="14" fill="#FFC93C" />
          <circle cx="31" cy="50" r="6" fill="#FFFFFF" />
          <circle cx="89" cy="50" r="6" fill="#FFFFFF" />
          <ellipse cx="60" cy="74" rx="7" ry="24" fill="#3A2F5B" />
          <circle cx="60" cy="42" r="14" fill="#3A2F5B" />
          <circle cx="55" cy="41" r="3" fill="#FFFFFF" />
          <circle cx="65" cy="41" r="3" fill="#FFFFFF" />
          <path d="M55 47 Q60 51 65 47" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      );
    case 'puppy':
      return (
        <>
          <circle cx="60" cy="60" r="60" fill="#F7EADF" />
          <ellipse cx="60" cy="64" rx="33" ry="31" fill="#E3B17E" />
          <ellipse cx="29" cy="58" rx="12" ry="24" transform="rotate(18 29 58)" fill="#A86B3C" />
          <ellipse cx="91" cy="58" rx="12" ry="24" transform="rotate(-18 91 58)" fill="#A86B3C" />
          <ellipse cx="74" cy="55" rx="9" ry="10" fill="#A86B3C" />
          <circle cx="47" cy="56" r="4.5" fill={INK} />
          <circle cx="74" cy="56" r="4.5" fill={INK} />
          <ellipse cx="60" cy="78" rx="17" ry="13" fill="#FFF3E6" />
          <path d="M56 84 Q60 94 64 84 Z" fill={CHEEK} />
          <ellipse cx="60" cy="71" rx="6.5" ry="4.5" fill={INK} />
          <path d="M60 75 V81" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <path d="M53 82 Q56.5 85 60 81 Q63.5 85 67 82" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case 'mouse':
      return (
        <>
          <circle cx="60" cy="60" r="60" fill="#ECEFF2" />
          <circle cx="34" cy="40" r="20" fill="#9AA5B1" />
          <circle cx="86" cy="40" r="20" fill="#9AA5B1" />
          <circle cx="34" cy="40" r="12" fill="#F7B6C8" />
          <circle cx="86" cy="40" r="12" fill="#F7B6C8" />
          <ellipse cx="60" cy="74" rx="31" ry="28" fill="#B7C0CA" />
          <circle cx="49" cy="68" r="4.5" fill={INK} />
          <circle cx="71" cy="68" r="4.5" fill={INK} />
          <circle cx="60" cy="80" r="5" fill="#E57A93" />
          <path d="M44 82 L28 78 M44 87 L28 89 M76 82 L92 78 M76 87 L92 89" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M55 88 Q60 92 65 88" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      );
    case 'dino':
      return (
        <>
          <circle cx="60" cy="60" r="60" fill="#E6F3D6" />
          <path d="M30 68 L34 54 L43 64 Z M43 62 L49 48 L56 59 Z M57 58 L64 44 L68 56 Z" fill={BEAK} />
          <path d="M26 92 Q10 92 7 78 Q16 86 28 82 Z" fill="#7CC24A" />
          <rect x="34" y="88" width="13" height="16" rx="5" fill="#5FA33A" />
          <rect x="66" y="88" width="13" height="16" rx="5" fill="#5FA33A" />
          <path d="M20 96 Q20 62 54 60 Q66 60 70 50 L70 36 Q70 22 85 22 Q101 22 101 37 Q101 50 87 52 Q83 72 87 96 Z" fill="#7CC24A" />
          <ellipse cx="70" cy="80" rx="11" ry="13" fill="#C8E8A8" />
          <circle cx="40" cy="80" r="5" fill="#5FA33A" />
          <circle cx="53" cy="72" r="4" fill="#5FA33A" />
          <circle cx="89" cy="33" r="4.5" fill={INK} />
          <path d="M86 43 Q93 47 99 41" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
          <ellipse cx="80" cy="40" rx="4" ry="3" fill={CHEEK} />
        </>
      );
    case 'piglet':
      return (
        <>
          <circle cx="60" cy="60" r="60" fill="#FDE8EC" />
          <path d="M30 26 L53 36 L36 54 Z" fill="#E57A93" />
          <path d="M90 26 L67 36 L84 54 Z" fill="#E57A93" />
          <circle cx="60" cy="65" r="35" fill="#F6A5B5" />
          <circle cx="46" cy="56" r="4.5" fill={INK} />
          <circle cx="74" cy="56" r="4.5" fill={INK} />
          <ellipse cx="60" cy="74" rx="15" ry="11" fill="#E57A93" />
          <ellipse cx="55" cy="74" rx="2.5" ry="3.5" fill={INK} />
          <ellipse cx="65" cy="74" rx="2.5" ry="3.5" fill={INK} />
          <path d="M52 90 Q60 95 68 90" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <ellipse cx="35" cy="74" rx="6" ry="4" fill="#EE7F98" />
          <ellipse cx="85" cy="74" rx="6" ry="4" fill="#EE7F98" />
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

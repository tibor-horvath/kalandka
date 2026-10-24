import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Seed } from '../components/art';
import { AVATARS, Avatar } from '../components/avatars';
import { PrintButton } from '../components/hub';
import { Bolt } from '../components/robot';
import { KalandkaIcon, KalandkaWordmark, LockIcon, RoundButton, SpeakerIcon } from '../components/ui';
import { useForm } from '../components/Stage';
import { speak, stopSpeaking } from '../lib/speech';
import { MAX_KIDS, kidName, progressOf, useProfiles } from '../state/profiles';
import { remainingSeconds, today } from '../state/screenTime';
import { seedBalance } from '../state/rewards';
import { boltBalance } from '../state/robotParts';

const SPEECH = 'Szia! Ki indul ma kalandra? Koppints a képedre!';

/** How long the chosen card bounces before the app moves on, so the child sees their tap landed. */
const PICK_MS = 650;
const PICK_MS_STILL = 300;

/** "Ki játszik?": each child taps their own figure, in Kalandka's harbour. Adding a child goes through the parents' gate. */
export function Picker({ onPick, onAdd, onParents, onPrint }: { onPick: (id: string) => void; onAdd: () => void; onParents: () => void; onPrint: () => void }) {
  const { profiles } = useProfiles();
  const phone = useForm() !== 'tablet';
  const day = today();
  const [picked, setPicked] = useState<string | null>(null);
  const timer = useRef(0);

  useEffect(() => {
    speak(SPEECH);
    return () => window.clearTimeout(timer.current);
  }, []);

  const choose = (id: string) => {
    if (picked) return;
    stopSpeaking();
    setPicked(id);
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    timer.current = window.setTimeout(() => onPick(id), still ? PICK_MS_STILL : PICK_MS);
  };

  return (
    <div className="screen screen--picker">
      <header className="topbar">
        <div className="brand">
          <KalandkaIcon size={56} />
          <KalandkaWordmark size={phone ? 28 : 40} />
        </div>
        <div className="topbar__right">
          <PrintButton onClick={onPrint} />
          <button type="button" className="parents-btn" onClick={onParents}>
            <LockIcon size={22} />
            <span className="parents-btn__label">Szülőknek</span>
          </button>
        </div>
      </header>

      <div className="home-guide">
        <div className="guide">
          <span className="picker-k">
            <KalandkaIcon size={phone ? 60 : 92} />
          </span>
          <div className="bubble" aria-live="polite">
            <div className="bubble__row">
              <div>
                <div className="bubble__kicker">Szia! Jó újra látni titeket.</div>
                <h1 className="bubble__title">Ki indul ma kalandra?</h1>
              </div>
              <RoundButton label="Meghallgatom újra" tint="blue" onClick={() => speak(SPEECH)}>
                <SpeakerIcon />
              </RoundButton>
            </div>
          </div>
        </div>
      </div>

      <nav className="kids" aria-label="Ki játszik?">
        {profiles.kids.map((kid, i) => {
          const p = progressOf(profiles, kid.id);
          const resting = remainingSeconds(p, day) <= 0;
          const name = kidName(kid);
          const seeds = seedBalance(p);
          const bolts = boltBalance(p);
          const state = picked ? (picked === kid.id ? ' is-picked' : ' is-dimmed') : '';
          return (
            <button
              key={kid.id}
              type="button"
              className={`kid-card${state}`}
              style={{ '--ring': AVATARS[kid.avatar].ring, '--i': i } as CSSProperties}
              aria-label={`${name}, ${seeds} mag, ${bolts} csavar${resting ? ', mára pihen' : ''}`}
              onClick={() => choose(kid.id)}
            >
              {resting && <span className="kid-card__badge">Pihen</span>}
              <Avatar id={kid.avatar} size={148} />
              <span className="kid-card__name">{name}</span>
              <span className="kid-card__treasure">
                <span className="kid-card__seeds">
                  <Seed size={24} />
                  {seeds}
                </span>
                <span className="kid-card__seeds kid-card__seeds--bolts">
                  <Bolt size={22} />
                  {bolts}
                </span>
              </span>
            </button>
          );
        })}
        {profiles.kids.length < MAX_KIDS && (
          <button
            type="button"
            className={`kid-card kid-card--add${picked ? ' is-dimmed' : ''}`}
            style={{ '--i': profiles.kids.length } as CSSProperties}
            aria-label="Új gyerek hozzáadása (szülőknek)"
            onClick={onAdd}
          >
            <span className="kid-card__plus">
              <svg aria-hidden="true" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </span>
            <span className="kid-card__name">Új gyerek</span>
            <span className="kid-card__lock">
              <LockIcon size={16} />
              Szülőknek
            </span>
          </button>
        )}
      </nav>

      <Harbour phone={phone} />
    </div>
  );
}

/** Kalandka's harbour: both world islands on the horizon, the dock the cards stand on, and the boat waiting. */
function Harbour({ phone }: { phone: boolean }) {
  if (phone) {
    return (
      <div className="harbour" aria-hidden="true">
        <svg className="harbour__art" viewBox="0 0 390 200">
          <g className="harbour__islands">
            <ellipse cx="62" cy="44" rx="56" ry="14" fill="#A6D676" />
            <rect x="58" y="16" width="6" height="22" rx="3" fill="#8A5A3B" />
            <circle cx="61" cy="14" r="15" fill="#2F7D32" />
            <circle cx="92" cy="34" r="5" fill="#F26B4F" />
            <ellipse cx="330" cy="44" rx="58" ry="14" fill="#B8C8DA" />
            <rect x="308" y="14" width="40" height="26" rx="5" fill="#7E93AB" />
            <path d="M304 17 L328 2 L352 17 Z" fill="#5E7184" />
            <rect x="322" y="24" width="14" height="16" rx="3" fill="#FFC93C" />
          </g>
          <path d="M0 50 Q49 40 98 50 T195 50 T293 50 T390 50 V200 H0 Z" fill="#9FD1F2" />
          <path d="M0 110 Q49 100 98 110 T195 110 T293 110 T390 110 V200 H0 Z" fill="#7DBDEB" />
          <g className="harbour__boat">
            <path d="M150 150 H232 L218 174 H164 Z" fill="#F26B4F" />
            <rect x="189" y="104" width="5" height="46" fill="#10233A" />
            <path d="M194 108 L224 144 H194 Z" fill="#FFFFFF" />
            <path d="M189 114 L164 144 H189 Z" fill="#FFC93C" />
          </g>
        </svg>
      </div>
    );
  }
  return (
    <div className="harbour" aria-hidden="true">
      <svg className="harbour__art" width="1180" height="340" viewBox="0 0 1180 340">
        <g className="harbour__islands">
          <ellipse cx="100" cy="60" rx="110" ry="26" fill="#A6D676" />
          <rect x="92" y="12" width="10" height="34" rx="4" fill="#8A5A3B" />
          <circle cx="97" cy="8" r="26" fill="#2F7D32" />
          <circle cx="68" cy="24" r="16" fill="#5BAA4A" />
          <circle cx="150" cy="40" r="9" fill="#F26B4F" />
          <circle cx="172" cy="46" r="7" fill="#FFC93C" />
          <ellipse cx="1080" cy="60" rx="120" ry="26" fill="#B8C8DA" />
          <rect x="1040" y="8" width="70" height="44" rx="8" fill="#7E93AB" />
          <path d="M1034 12 L1075 -12 L1116 12 Z" fill="#5E7184" />
          <rect x="1062" y="24" width="26" height="28" rx="4" fill="#FFC93C" />
          <circle cx="1138" cy="34" r="13" fill="#B7C4D2" stroke="#5E7184" strokeWidth="4" />
          <circle cx="1138" cy="34" r="4" fill="#5E7184" />
        </g>
        <path d="M0 60 Q147.5 46 295 60 T590 60 T885 60 T1180 60 V340 H0 Z" fill="#9FD1F2" />
        <path d="M0 140 Q147.5 128 295 140 T590 140 T885 140 T1180 140 V340 H0 Z" fill="#7DBDEB" />
        <g className="harbour__dock">
          <rect x="190" y="72" width="800" height="30" rx="8" fill="#B98454" />
          <rect x="190" y="94" width="800" height="8" rx="4" fill="#8A5A3B" />
          <rect x="226" y="102" width="18" height="90" rx="6" fill="#8A5A3B" />
          <rect x="581" y="102" width="18" height="90" rx="6" fill="#8A5A3B" />
          <rect x="936" y="102" width="18" height="90" rx="6" fill="#8A5A3B" />
        </g>
        <g className="harbour__boat">
          <path d="M1010 230 H1120 L1102 260 H1028 Z" fill="#F26B4F" />
          <rect x="1062" y="170" width="6" height="60" fill="#10233A" />
          <path d="M1068 174 L1108 222 H1068 Z" fill="#FFFFFF" />
          <path d="M1062 182 L1030 222 H1062 Z" fill="#FFC93C" />
        </g>
      </svg>
    </div>
  );
}

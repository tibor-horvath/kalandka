import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { RoundFlower, Seed, Sprout, Tree } from '../components/art';
import { Csepi } from '../components/Csepi';
import { FitBox } from '../components/FitBox';
import { ParentsButton } from '../components/hub';
import { Bolt, Csavar, Gear } from '../components/robot';
import { useForm } from '../components/Stage';
import { GuideBubble, KalandkaWordmark, RoundButton, SpeakerIcon } from '../components/ui';
import { speak } from '../lib/speech';
import { useProgress } from '../state/progress';
import { seedBalance } from '../state/rewards';
import { WORLDS, currentWorld, type WorldId } from '../state/worlds';

const SPEECH = 'Hova megyünk ma? A kert szigetén Csepi vár, a műhely szigetén Csavar, a robot. Koppints az egyik szigetre!';
const FOG_SPEECH = 'Ez a sziget még ködös. Egyszer majd új világ lesz itt!';

interface Pt {
  x: number;
  y: number;
}

/** The map drawn wide (tablet, landscape phone) or tall (portrait phone): where the islands, trail and fog sit. */
interface MapLayout {
  w: number;
  h: number;
  garden: Pt;
  robot: Pt;
  trail: string;
  bridge: Pt & { angle: number };
  fog: Pt[];
}

const WIDE: MapLayout = {
  w: 1100,
  h: 560,
  garden: { x: 275, y: 285 },
  robot: { x: 825, y: 285 },
  trail: 'M470 330 C520 360 580 360 640 330',
  bridge: { x: 555, y: 352, angle: 0 },
  fog: [
    { x: 555, y: 95 },
    { x: 1030, y: 505 }
  ]
};

const TALL: MapLayout = {
  w: 600,
  h: 1040,
  garden: { x: 300, y: 260 },
  robot: { x: 300, y: 770 },
  trail: 'M330 420 C380 470 380 560 330 610',
  bridge: { x: 368, y: 515, angle: 90 },
  fog: [
    { x: 520, y: 520 },
    { x: 80, y: 980 }
  ]
};

/** An island's outline around its centre: soft and a little uneven, about 440 × 300. */
const ISLAND = 'M-210 -40 C-220 -120 -120 -150 -40 -140 C40 -160 160 -150 200 -90 C240 -30 230 60 180 110 C120 160 -20 160 -110 140 C-200 120 -230 40 -210 -40 Z';

function Island({ at, ground, edge, sand }: { at: Pt; ground: string; edge: string; sand: string }) {
  return (
    <g transform={`translate(${at.x} ${at.y})`}>
      <path d={ISLAND} transform="scale(1.06 1.08) translate(0 8)" fill={sand} />
      <path d={ISLAND} transform="translate(0 10)" fill={edge} />
      <path d={ISLAND} fill={ground} />
    </g>
  );
}

function Waves({ w, h }: { w: number; h: number }) {
  const rows = Math.floor(h / 90);
  return (
    <g className="map-waves" aria-hidden="true">
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: Math.floor(w / 160) }, (_, c) => {
          const x = c * 160 + (r % 2 ? 80 : 20);
          const y = r * 90 + 46;
          return <path key={`${r}-${c}`} d={`M${x} ${y} q14 -12 28 0 q14 12 28 0`} />;
        })
      )}
    </g>
  );
}

/** Csepi's island: flower beds, trees and a sprout. */
function GardenScene({ at }: { at: Pt }) {
  return (
    <g transform={`translate(${at.x} ${at.y})`}>
      <ellipse cx="-70" cy="40" rx="70" ry="16" fill="#8A5A3B" opacity="0.85" />
      <g transform="translate(-175 -120)">
        <Tree width={96} />
      </g>
      <g transform="translate(95 -130)">
        <Tree width={84} />
      </g>
      <g transform="translate(-130 -30)">
        <RoundFlower petal="#E8577D" width={46} />
      </g>
      <g transform="translate(-85 -20)">
        <RoundFlower petal="#FFC93C" width={42} />
      </g>
      <g transform="translate(-40 -30)">
        <RoundFlower petal="#8E6BD6" width={46} />
      </g>
      <g transform="translate(40 -60)">
        <Csepi mood="cheer" width={70} />
      </g>
      <g transform="translate(115 -20) scale(0.6)">
        <Sprout />
      </g>
    </g>
  );
}

/** Csavar's island: the workshop with its gear and a crane. */
function RobotScene({ at, spin }: { at: Pt; spin: boolean }) {
  return (
    <g transform={`translate(${at.x} ${at.y})`}>
      {/* workshop: walls, saw-tooth roof, door and window */}
      <rect x="-180" y="-80" width="190" height="120" rx="10" fill="#EEF3F9" stroke="#5E7184" strokeWidth="5" />
      <path d="M-186 -78 L-150 -128 L-150 -78 L-110 -128 L-110 -78 L-70 -128 L-70 -78 L-30 -128 L-30 -78 L10 -128 L10 -78 Z" fill="#138A86" stroke="#0C5F5C" strokeWidth="4" strokeLinejoin="round" />
      <rect x="-110" y="-30" width="52" height="70" rx="6" fill="#7E93AB" />
      <rect x="-160" y="-55" width="36" height="30" rx="5" fill="#BFE6E3" stroke="#5E7184" strokeWidth="3" />
      <rect x="-40" y="-55" width="36" height="30" rx="5" fill="#BFE6E3" stroke="#5E7184" strokeWidth="3" />
      <g className={spin ? 'map-gear' : undefined} transform="translate(-36 -178)">
        <Gear size={70} color="#F2B33D" />
      </g>
      {/* crane */}
      <path d="M150 50 V-130 H60" fill="none" stroke="#F2B33D" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M150 -100 L120 -130" stroke="#F2B33D" strokeWidth="6" strokeLinecap="round" />
      <path d="M72 -130 V-92" stroke="#5E7184" strokeWidth="3" />
      <rect x="58" y="-92" width="28" height="22" rx="4" fill="#C98B50" stroke="#8A5A3B" strokeWidth="3" />
      <g transform="translate(50 -50)">
        <Csavar mood="cheer" width={66} />
      </g>
    </g>
  );
}

function Fog({ at }: { at: Pt }) {
  return (
    <g transform={`translate(${at.x} ${at.y})`} className="map-fog">
      <ellipse cx="0" cy="8" rx="78" ry="40" fill="#E9F4FB" />
      <ellipse cx="-34" cy="-8" rx="40" ry="30" fill="#F4FAFD" />
      <ellipse cx="30" cy="-12" rx="44" ry="32" fill="#F4FAFD" />
      <text x="0" y="16" textAnchor="middle" className="map-fog__mark">?</text>
    </g>
  );
}

/** "Itt jártál": a pin over the island the child was on last. */
function Pin({ at }: { at: Pt }) {
  return (
    <g transform={`translate(${at.x} ${at.y - 190})`} className="map-pin">
      <path d="M0 0 C-22 -26 -26 -44 -26 -54 a26 26 0 0 1 52 0 C26 -44 22 -26 0 0 Z" fill="#E8577D" stroke="#FFFFFF" strokeWidth="5" />
      <circle cx="0" cy="-54" r="10" fill="#FFFFFF" />
    </g>
  );
}

/** The Kalandka map: every world is open to every child; the app returns to the one chosen last. */
export function WorldMap({ onPick, onParents }: { onPick: (world: WorldId) => void; onParents: () => void }) {
  const { progress } = useProgress();
  const form = useForm();
  const phone = form !== 'tablet';
  const map = form === 'portrait' ? TALL : WIDE;
  const last = currentWorld(progress);
  const [fogTapped, setFogTapped] = useState(false);

  useEffect(() => {
    speak(SPEECH);
  }, []);

  const tapFog = () => {
    setFogTapped(true);
    speak(FOG_SPEECH);
  };

  const spot = (at: Pt): CSSProperties => ({ left: at.x - 230, top: at.y - 165, width: 460, height: 330 });
  const counts: Record<WorldId, { icon: ReactNode; n: number }> = {
    garden: { icon: <Seed size={24} />, n: seedBalance(progress) },
    robot: { icon: <Bolt size={24} />, n: progress.bolts }
  };

  return (
    <div className="screen screen--map">
      <header className="topbar">
        <div className="brand">
          <div className="brand__text">
            <KalandkaWordmark size={phone ? 24 : 34} />
          </div>
        </div>
        <ParentsButton onClick={onParents} />
      </header>

      <div className="home-guide map-guide">
        <GuideBubble mood={fogTapped ? 'think' : 'cheer'} csepiWidth={60}>
          <div className="bubble__row">
            <div>
              <div className="bubble__kicker">Kalandka térkép</div>
              <h1 className="bubble__title">{fogTapped ? 'Ez még ködös sziget.' : 'Hova megyünk ma?'}</h1>
            </div>
            <RoundButton label="Meghallgatom újra" tint="blue" onClick={() => speak(fogTapped ? FOG_SPEECH : SPEECH)}>
              <SpeakerIcon />
            </RoundButton>
          </div>
        </GuideBubble>
      </div>

      <FitBox className="map-fit" width={map.w} height={map.h}>
        <nav className="map" aria-label="Kalandka térkép: válassz világot" style={{ width: map.w, height: map.h }}>
          <svg className="map__art" width={map.w} height={map.h} viewBox={`0 0 ${map.w} ${map.h}`} aria-hidden="true">
            <rect width={map.w} height={map.h} rx="40" fill="#9FD3F0" />
            <Waves w={map.w} h={map.h} />
            {map.fog.map((f, i) => (
              <Fog key={i} at={f} />
            ))}
            <Island at={map.garden} ground="#A6D676" edge="#8CC45E" sand="#F3DFA8" />
            <Island at={map.robot} ground="#C9D6E4" edge="#9AAFC6" sand="#F3DFA8" />
            <path d={map.trail} className="map-trail" />
            <g transform={`translate(${map.bridge.x} ${map.bridge.y}) rotate(${map.bridge.angle})`}>
              <rect x="-46" y="-16" width="92" height="32" rx="6" fill="#C98B50" stroke="#8A5A3B" strokeWidth="4" />
              {[-28, -10, 8, 26].map((x) => (
                <path key={x} d={`M${x} -14 V14`} stroke="#8A5A3B" strokeWidth="3" />
              ))}
            </g>
            <GardenScene at={map.garden} />
            <RobotScene at={map.robot} spin={last === 'robot'} />
            <Pin at={last === 'robot' ? map.robot : map.garden} />
          </svg>

          {WORLDS.map((w) => {
            const at = w.id === 'garden' ? map.garden : map.robot;
            return (
              <button
                key={w.id}
                type="button"
                className={`map-spot map-spot--${w.id}${last === w.id ? ' is-last' : ''}`}
                style={spot(at)}
                onClick={() => onPick(w.id)}
                aria-label={`${w.name}: ${w.about}. ${w.guide} vár.${last === w.id ? ' Itt jártál legutóbb.' : ''}`}
              >
                <span className="map-spot__sign">
                  <span className="map-spot__name">{w.name}</span>
                  <span className="map-spot__about">{w.about}</span>
                  <span className="map-spot__count">
                    {counts[w.id].icon}
                    {counts[w.id].n}
                  </span>
                </span>
              </button>
            );
          })}
          {map.fog.map((f, i) => (
            <button key={i} type="button" className="map-fogspot" style={{ left: f.x - 80, top: f.y - 50, width: 160, height: 100 }} onClick={tapFog} aria-label="Ködös sziget: még nem lehet ide menni" />
          ))}
        </nav>
      </FitBox>
    </div>
  );
}

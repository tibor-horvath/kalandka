import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { RoundFlower, Seed, Sprout, Tree } from '../components/art';
import { Csepi } from '../components/Csepi';
import { FitBox } from '../components/FitBox';
import { ParentsButton } from '../components/hub';
import { Bolt, Csavar } from '../components/robot';
import { useForm } from '../components/Stage';
import { GuideBubble, KalandkaIcon, KalandkaWordmark, RoundButton, SpeakerIcon } from '../components/ui';
import { speak } from '../lib/speech';
import { useProgress } from '../state/progress';
import { seedBalance } from '../state/rewards';
import { boltBalance } from '../state/robotParts';
import { WORLDS, currentWorld, type WorldId } from '../state/worlds';

/** Where the child's boat waits, said the way the guide says it. */
const DOCKED: Record<WorldId, string> = { garden: 'a kertnél', robot: 'a műhelynél' };

const speech = (last: WorldId | null) =>
  `Hova evezünk ma?${last ? ` A hajód ${DOCKED[last]} vár.` : ''} A kert szigetén Csepi, a műhely szigetén Csavar, a robot. Koppints az egyik szigetre!`;

interface Pt {
  x: number;
  y: number;
}

/** The map drawn wide (tablet, landscape phone) or tall (portrait phone): where the islands, the boat and its routes sit. */
interface MapLayout {
  w: number;
  h: number;
  garden: Pt;
  robot: Pt;
  /** Signs float above the islands, or sit on their bottom shore where there is no room above. */
  signs: 'top' | 'bottom';
  /** The boat at each island's dock; `flip` turns it to face the other island. */
  boat: Record<WorldId, Pt & { flip: boolean }>;
  /** The dotted route from the boat at each island to the other island. */
  route: Record<WorldId, string>;
  /** A far-off island in the haze: a hint that more worlds may come, not something to tap. */
  far: Pt;
  farRoute: string;
}

const WIDE: MapLayout = {
  w: 1100,
  h: 560,
  garden: { x: 275, y: 320 },
  robot: { x: 825, y: 320 },
  signs: 'top',
  boat: {
    garden: { x: 520, y: 466, flip: false },
    robot: { x: 582, y: 466, flip: true }
  },
  route: {
    garden: 'M566 494 C610 545 680 545 690 486',
    robot: 'M536 494 C492 545 420 545 410 486'
  },
  far: { x: 1030, y: 82 },
  farRoute: 'M955 175 C975 150 990 132 1005 118'
};

const TALL: MapLayout = {
  w: 600,
  h: 1040,
  garden: { x: 300, y: 260 },
  robot: { x: 300, y: 770 },
  signs: 'bottom',
  boat: {
    garden: { x: 480, y: 500, flip: false },
    robot: { x: 110, y: 560, flip: true }
  },
  route: {
    garden: 'M478 528 C520 570 525 620 505 668',
    robot: 'M68 560 C40 510 60 450 112 398'
  },
  far: { x: 90, y: 985 },
  farRoute: 'M150 905 C135 925 125 940 118 952'
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

/** Csavar's island: the workshop and a crane. */
function RobotScene({ at }: { at: Pt }) {
  return (
    <g transform={`translate(${at.x} ${at.y})`}>
      {/* workshop: walls, saw-tooth roof, door and window */}
      <rect x="-180" y="-80" width="190" height="120" rx="10" fill="#EEF3F9" stroke="#5E7184" strokeWidth="5" />
      <path d="M-186 -78 L-150 -128 L-150 -78 L-110 -128 L-110 -78 L-70 -128 L-70 -78 L-30 -128 L-30 -78 L10 -128 L10 -78 Z" fill="#138A86" stroke="#0C5F5C" strokeWidth="4" strokeLinejoin="round" />
      <rect x="-110" y="-30" width="52" height="70" rx="6" fill="#7E93AB" />
      <rect x="-160" y="-55" width="36" height="30" rx="5" fill="#BFE6E3" stroke="#5E7184" strokeWidth="3" />
      <rect x="-40" y="-55" width="36" height="30" rx="5" fill="#BFE6E3" stroke="#5E7184" strokeWidth="3" />
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

/** The child's own boat, moored at the island they chose last. */
function Boat({ at }: { at: Pt & { flip: boolean } }) {
  return (
    <g transform={`translate(${at.x} ${at.y})${at.flip ? ' scale(-1 1)' : ''}`} className="map-boat">
      <path d="M-54 30 q12 -8 24 0 q12 8 24 0 q12 -8 24 0 q12 8 24 0 q12 -8 24 0" className="map-boat__ripple" />
      <path d="M-48 0 H48 L32 22 H-32 Z" fill="#C98B50" stroke="#8A5A3B" strokeWidth="4" strokeLinejoin="round" />
      <path d="M-2 0 V-86" stroke="#8A5A3B" strokeWidth="5" strokeLinecap="round" />
      <path d="M4 -82 L52 -12 H4 Z" fill="#B4335A" stroke="#FFFFFF" strokeWidth="3" strokeLinejoin="round" />
      <path d="M-8 -76 L-42 -14 H-8 Z" fill="#FFFFFF" />
      <path d="M22 -48 l3.5 7 7.5 1 -5.5 5 1.5 7.5 -7 -3.6 -7 3.6 1.5 -7.5 -5.5 -5 7.5 -1 z" fill="#FFC93C" />
    </g>
  );
}

/** A small island far off in the haze, with a faint route towards it. */
function FarIsland({ at, route }: { at: Pt; route: string }) {
  return (
    <g className="map-far">
      <path d={route} className="map-route map-route--far" />
      <g transform={`translate(${at.x} ${at.y})`}>
        <ellipse cx="0" cy="14" rx="74" ry="40" fill="#B4DCF0" />
        <ellipse cx="-24" cy="-12" rx="40" ry="26" fill="#EEF7FC" />
        <ellipse cx="22" cy="-18" rx="46" ry="30" fill="#F7FBFE" />
      </g>
    </g>
  );
}

/** The Kalandka map: every world is open to every child; the boat waits where they played last. */
export function WorldMap({ onPick, onParents }: { onPick: (world: WorldId) => void; onParents: () => void }) {
  const { progress } = useProgress();
  const form = useForm();
  const phone = form !== 'tablet';
  const map = form === 'portrait' ? TALL : WIDE;
  const last = currentWorld(progress);

  useEffect(() => {
    speak(speech(progress.world));
    // Said once when the map opens; the speaker button repeats it.
  }, []);

  const spot = (at: Pt): CSSProperties => ({ left: at.x - 230, top: at.y - 165, width: 460, height: 330 });
  const counts: Record<WorldId, { icon: ReactNode; n: number }> = {
    garden: { icon: <Seed size={24} />, n: seedBalance(progress) },
    robot: { icon: <Bolt size={24} />, n: boltBalance(progress) }
  };
  const faces: Record<WorldId, ReactNode> = {
    garden: <Csepi mood="cheer" width={34} />,
    robot: <Csavar mood="cheer" width={34} />
  };

  return (
    <div className="screen screen--map">
      <header className="topbar">
        <div className="brand">
          <KalandkaIcon size={phone ? 40 : 56} />
          <div className="brand__text">
            <KalandkaWordmark size={phone ? 24 : 34} />
          </div>
        </div>
        <ParentsButton onClick={onParents} />
      </header>

      <div className="home-guide map-guide">
        <GuideBubble mood="cheer" csepiWidth={60}>
          <div className="bubble__row">
            <div>
              {progress.world && <div className="bubble__kicker">A hajód {DOCKED[progress.world]} vár</div>}
              <h1 className="bubble__title">Hova evezünk ma?</h1>
            </div>
            <RoundButton label="Meghallgatom újra" tint="blue" onClick={() => speak(speech(progress.world))}>
              <SpeakerIcon />
            </RoundButton>
          </div>
        </GuideBubble>
      </div>

      <FitBox className="map-fit" width={map.w} height={map.h}>
        <nav className="map" aria-label="Kalandka térkép: válassz szigetet" style={{ width: map.w, height: map.h }}>
          <svg className="map__art" width={map.w} height={map.h} viewBox={`0 0 ${map.w} ${map.h}`} aria-hidden="true">
            <rect width={map.w} height={map.h} rx="40" fill="#8CCBEC" />
            <Waves w={map.w} h={map.h} />
            <FarIsland at={map.far} route={map.farRoute} />
            <Island at={map.garden} ground="#A6D676" edge="#8CC45E" sand="#F3DFA8" />
            <Island at={map.robot} ground="#C9D6E4" edge="#9AAFC6" sand="#F3DFA8" />
            <GardenScene at={map.garden} />
            <RobotScene at={map.robot} />
            <path d={map.route[last]} className="map-route" />
            <Boat at={map.boat[last]} />
          </svg>

          {WORLDS.map((w) => {
            const at = w.id === 'garden' ? map.garden : map.robot;
            return (
              <button
                key={w.id}
                type="button"
                className={`map-spot map-spot--${w.id} map-spot--sign-${map.signs}${last === w.id ? ' is-last' : ''}`}
                style={spot(at)}
                onClick={() => onPick(w.id)}
                aria-label={`${w.name}: ${w.about}. ${w.guide} vár.${last === w.id ? ' A hajód itt van.' : ''}`}
              >
                <span className="map-spot__sign">
                  <span className="map-spot__face">{faces[w.id]}</span>
                  <span className="map-spot__name">{w.name}</span>
                  <span className="map-spot__count">
                    {counts[w.id].icon}
                    {counts[w.id].n}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>
      </FitBox>
    </div>
  );
}

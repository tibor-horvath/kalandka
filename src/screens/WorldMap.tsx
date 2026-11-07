import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { RoundFlower, Seed, Sprout, Tree } from '../components/art';
import { Csepi } from '../components/Csepi';
import { FitBox } from '../components/FitBox';
import { ParentsButton } from '../components/hub';
import { Bolt, Csavar } from '../components/robot';
import { PlayTimer, pausedLabel, useTimeLeft } from '../components/PlayTimer';
import { useForm } from '../components/Stage';
import { GuideBubble, KalandkaIcon, KalandkaWordmark, RoundButton, SpeakerIcon } from '../components/ui';
import { speak, stopSpeaking } from '../lib/speech';
import { useProgress } from '../state/progress';
import { seedBalance } from '../state/rewards';
import { boltBalance } from '../state/robotParts';
import { WORLDS, currentWorld, type WorldId } from '../state/worlds';

/** Where the child's boat waits, said the way the guide says it. */
const DOCKED: Record<WorldId, string> = { garden: 'a kertnél', robot: 'a műhelynél' };

const speech = (last: WorldId | null) =>
  `Hova evezünk ma?${last ? ` A hajód ${DOCKED[last]} vár.` : ''} A kert szigetén Csepi, a műhely szigetén Csavar, a robot. Koppints az egyik szigetre!`;

/*
 * The trip after a tap (ms): the boat sets off, sails to the island while its guide hops to greet it,
 * then the map dives into the island and the world opens. Under reduced motion the world opens at once.
 */
const SAIL_DELAY = 120;
const SAIL_MS = 1100;
const TURN_MS = 260;
const DIVE_AT = 1300;
const OPEN_AT = 1860;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
/** Ease in and out (cubic), the same curve as the trail's `cubic-bezier(.65, 0, .35, 1)`. */
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

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
  /** The boat at each island's dock; `flip` turns it to face the other island. */
  boat: Record<WorldId, Pt & { flip: boolean }>;
  /** The dotted route from the boat at each island to the other island. */
  route: Record<WorldId, string>;
  /** Where the boat sails after a tap, keyed `from-to`: to the other island, or a short way to its own shore. */
  sail: Record<`${WorldId}-${WorldId}`, string>;
  /** The fog banks at the map's far edges, each a pale lower bank and a whiter upper one. */
  banks: [string, string][];
  /** The islands asleep in the fog: worlds still to come. A tap only makes the guide talk. */
  mist: Mist[];
}

type MistKind = 'grove' | 'tower' | 'peak';

/** An island in the fog, centred at `x`, `y` and drawn `w` wide. */
interface Mist extends Pt {
  kind: MistKind;
  w: number;
}

const MIST_LINE: Record<MistKind, string> = {
  grove: 'Ez a sziget még a ködben alszik. Egyszer odaevezünk!',
  tower: 'Látod a kis fényt? Ott már készül valami.',
  peak: 'Egy hegyes sziget! Majd ha eloszlik a köd, megnézzük.'
};

const MIST_NAME: Record<MistKind, string> = {
  grove: 'Ködös sziget a távolban',
  tower: 'Ködös sziget toronnyal',
  peak: 'Ködös hegyes sziget'
};

/**
 * A flat fog bank from the top (or bottom) edge to `y`, its inner edge a row of soft scallops.
 * It runs 40 past each side so its slow drift never shows a gap at the map's edge.
 */
function bank(w: number, h: number, y: number, radii: number[], fromBottom = false) {
  const base = fromBottom ? h : 0;
  let d = `M-40 ${base} H${w + 40} V${y}`;
  for (let x = w + 40, i = 0; x > -60; i++) {
    const r = radii[i % radii.length];
    d += ` a${r} ${r} 0 0 ${fromBottom ? 0 : 1} ${-2 * r} 0`;
    x -= 2 * r;
  }
  return `${d} V${base} Z`;
}

const WIDE: MapLayout = {
  w: 1100,
  h: 560,
  garden: { x: 263, y: 320 },
  robot: { x: 837, y: 320 },
  boat: {
    garden: { x: 520, y: 466, flip: false },
    robot: { x: 582, y: 466, flip: true }
  },
  route: {
    garden: 'M566 494 C610 545 680 545 690 486',
    robot: 'M536 494 C492 545 420 545 410 486'
  },
  sail: {
    'garden-robot': 'M520 466 C566 524 652 534 702 474',
    'garden-garden': 'M520 466 C498 506 446 510 402 470',
    'robot-garden': 'M582 466 C536 524 450 534 400 474',
    'robot-robot': 'M582 466 C604 506 656 510 700 470'
  },
  banks: [[bank(1100, 560, 86, [38, 26, 44, 30]), bank(1100, 560, 34, [30, 22, 34])]],
  mist: [
    { kind: 'peak', x: 107, y: 71, w: 170 },
    { kind: 'grove', x: 550, y: 112, w: 250 },
    { kind: 'tower', x: 995, y: 81, w: 186 }
  ]
};

const TALL: MapLayout = {
  w: 600,
  h: 1040,
  garden: { x: 300, y: 260 },
  robot: { x: 300, y: 770 },
  boat: {
    garden: { x: 480, y: 500, flip: false },
    robot: { x: 110, y: 560, flip: true }
  },
  route: {
    garden: 'M478 528 C520 570 525 620 505 668',
    robot: 'M68 560 C40 510 60 450 112 398'
  },
  sail: {
    'garden-robot': 'M480 500 C532 548 540 606 500 646',
    'garden-garden': 'M480 500 C474 472 448 450 420 432',
    'robot-garden': 'M110 560 C66 520 76 462 128 424',
    'robot-robot': 'M110 560 C118 590 140 612 172 630'
  },
  banks: [
    [bank(600, 1040, 80, [34, 24, 40]), bank(600, 1040, 30, [26, 20, 30])],
    [bank(600, 1040, 975, [34, 26, 40], true), bank(600, 1040, 1015, [24, 30, 20], true)]
  ],
  mist: [
    { kind: 'peak', x: 105, y: 67, w: 170 },
    { kind: 'tower', x: 494, y: 71, w: 180 },
    { kind: 'grove', x: 300, y: 1000, w: 230 }
  ]
};

/*
 * The two world islands, each about 420 × 290 around its centre, with room under it for its sign on the bottom shore.
 * The garden is soft and round; the workshop is a many-sided rock under a steel deck. Each dock points at the boat.
 */
const GARDEN_SHORE = 'M-205 -40 C-218 -120 -132 -160 -40 -148 C22 -170 132 -164 182 -110 C226 -64 222 12 200 52 C186 78 160 90 140 106 C108 140 34 146 -44 140 C-134 136 -210 82 -205 -40 Z';
const WORKSHOP_SHORE = 'M-190 -78 L-138 -148 L128 -152 L196 -86 L204 46 L150 110 L-134 114 L-204 52 Z';

/** A shore in layers: the pale shallows, the beach's wet edge, the beach, then the island's own top and its side. */
function Shore({ d, edge, sand, side, top, round }: { d: string; edge: string; sand: string; side: string; top: string; round?: boolean }) {
  // The workshop's straight sides get rounded corners from a thick stroke in the shape's own colour.
  const corners = (fill: string, width: number) => (round ? { stroke: fill, strokeWidth: width, strokeLinejoin: 'round' as const } : {});
  return (
    <>
      <path d={d} transform="translate(0 10) scale(1.08)" fill="#BFE4F6" {...corners('#BFE4F6', 28)} />
      <path d={d} transform="translate(0 14)" fill={edge} {...corners(edge, 28)} />
      <path d={d} fill={sand} {...corners(sand, 28)} />
      <path d={d} transform={round ? 'translate(0 -2) scale(.84)' : 'translate(0 2) scale(.86)'} fill={side} {...corners(side, 10)} />
      <path d={d} transform={round ? 'translate(0 -12) scale(.84)' : 'translate(0 -8) scale(.86)'} fill={top} {...corners(top, 10)} />
    </>
  );
}

/** A short pier from the beach out towards the boat; `dir` is -1 for one pointing left. */
function Dock({ dir, deck, post }: { dir: 1 | -1; deck: string; post: string }) {
  return (
    <g transform={`scale(${dir} 1)`} strokeLinecap="round">
      <path d="M146 102 L214 132" stroke={deck} strokeWidth="26" />
      <path d="M150 116 L218 146" stroke={post} strokeWidth="6" />
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

/** Csepi's island: a big fruit tree and a small one, a flower bed, Csepi and a sprout. It stands still; only Csepi hops hello. */
function GardenIsland({ at }: { at: Pt }) {
  return (
    <g transform={`translate(${at.x} ${at.y})`}>
      <Shore d={GARDEN_SHORE} edge="#DDBF7A" sand="#F3DFA8" side="#8CC45E" top="#A6D676" />
      <Dock dir={1} deck="#C99A6B" post="#5A3B26" />
      <g transform="translate(-172 -148)">
        <Tree width={112} />
      </g>
      <g transform="translate(88 -150)">
        <Tree width={92} />
      </g>
      <ellipse cx="-72" cy="44" rx="78" ry="17" fill="#8A5A3B" opacity="0.85" />
      <g transform="translate(-142 -16)">
        <RoundFlower petal="#E8577D" width={52} />
      </g>
      <g transform="translate(-98 -8)">
        <RoundFlower petal="#FFC93C" width={48} />
      </g>
      <g transform="translate(-56 -16)">
        <RoundFlower petal="#8E6BD6" width={52} />
      </g>
      <ellipse cx="58" cy="44" rx="30" ry="7" fill="#8CC45E" />
      <g transform="translate(20 -76)">
        <g className="map-hop">
          <Csepi mood="cheer" width={76} />
        </g>
      </g>
      <g transform="translate(108 -14) scale(0.6)">
        <Sprout />
      </g>
    </g>
  );
}

/** Csavar's island: a steel deck on a rock, the workshop, the crane with its crate, and Csavar. Only Csavar hops hello. */
function WorkshopIsland({ at }: { at: Pt }) {
  return (
    <g transform={`translate(${at.x} ${at.y})`}>
      <Shore d={WORKSHOP_SHORE} edge="#C9B47E" sand="#F3DFA8" side="#9AAFC6" top="#C9D6E4" round />
      {/* the deck's plate seams and rivets */}
      <path d="M-60 -128 V78 M60 -128 V78 M-150 -26 H156" stroke="#B3C3D6" strokeWidth="5" strokeLinecap="round" />
      <g fill="#AABBD0">
        {[[-110, -118], [104, -120], [-150, 40], [154, 36], [-100, 74], [110, 74]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="5" />
        ))}
      </g>
      <Dock dir={-1} deck="#8FA3BA" post="#4F5F72" />
      {/* workshop: walls, saw-tooth roof, door and windows */}
      <g transform="translate(12 0)">
        <rect x="-180" y="-80" width="190" height="120" rx="10" fill="#EEF3F9" stroke="#5E7184" strokeWidth="5" />
        <path d="M-186 -78 L-150 -128 L-150 -78 L-110 -128 L-110 -78 L-70 -128 L-70 -78 L-30 -128 L-30 -78 L10 -128 L10 -78 Z" fill="#138A86" stroke="#0C5F5C" strokeWidth="4" strokeLinejoin="round" />
        <rect x="-110" y="-30" width="52" height="70" rx="6" fill="#7E93AB" />
        <rect x="-160" y="-55" width="36" height="30" rx="5" fill="#BFE6E3" stroke="#5E7184" strokeWidth="3" />
        <rect x="-40" y="-55" width="36" height="30" rx="5" fill="#BFE6E3" stroke="#5E7184" strokeWidth="3" />
      </g>
      {/* crane, its crate hanging still */}
      <path d="M150 50 V-130 H60" fill="none" stroke="#F2B33D" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M150 -100 L120 -130" stroke="#F2B33D" strokeWidth="6" strokeLinecap="round" />
      <path d="M72 -130 V-92" stroke="#5E7184" strokeWidth="3" />
      <rect x="58" y="-92" width="28" height="22" rx="4" fill="#C98B50" stroke="#8A5A3B" strokeWidth="3" />
      <g transform="translate(46 -56)">
        <g className="map-hop">
          <Csavar mood="cheer" width={70} />
        </g>
      </g>
    </g>
  );
}

/**
 * The child's own boat, moored at the island they chose last. Given a `sail` route it sets off along it once,
 * turning to `flipTo` and rocking twice, and leaves a white trail on the water behind it.
 */
function Boat({ at, sail, flipTo }: { at: Pt & { flip: boolean }; sail?: string; flipTo?: boolean }) {
  const boat = useRef<SVGGElement>(null);
  const track = useRef<SVGPathElement>(null);

  useEffect(() => {
    const el = boat.current;
    const path = track.current;
    if (!sail || !el || !path) return;
    const length = path.getTotalLength();
    const from = at.flip ? -1 : 1;
    const to = flipTo ? -1 : 1;
    // Timed from the tap, not the first frame, so a slow first frame cannot put the boat behind its trail and the dive.
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = now - start - SAIL_DELAY;
      const k = clamp01(t / SAIL_MS);
      const pt = path.getPointAtLength(length * easeInOut(k));
      const turn = from + (to - from) * easeInOut(clamp01(t / TURN_MS));
      const tilt = k > 0 && k < 1 ? 4 * Math.sin(k * Math.PI * 4) * (1 - k / 2) : 0;
      // The boat's own frame (no React re-render per frame): along the route, rocking at the waterline.
      el.setAttribute('transform', `translate(${pt.x} ${pt.y}) rotate(${tilt} 0 22) scale(${turn} 1)`);
      if (t < SAIL_MS) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- One sail per trip: the start and turn are read from the render that set sail.
  }, [sail]);

  return (
    <>
      {sail && <path ref={track} d={sail} pathLength={1} transform="translate(0 26)" className="map-trail" />}
      <g ref={boat} transform={`translate(${at.x} ${at.y})${at.flip ? ' scale(-1 1)' : ''}`} className="map-boat">
        <g className="map-boat__arrive">
          <path d="M-54 30 q12 -8 24 0 q12 8 24 0 q12 -8 24 0 q12 8 24 0 q12 -8 24 0" className="map-boat__ripple" />
          {/* Moored, the boat rocks gently on the water (as at the island homes' docks); sailing, the trip rocks it instead. */}
          <g className="map-boat__bob">
            <path d="M-48 0 H48 L32 22 H-32 Z" fill="#C98B50" stroke="#8A5A3B" strokeWidth="4" strokeLinejoin="round" />
            <path d="M-2 0 V-86" stroke="#8A5A3B" strokeWidth="5" strokeLinecap="round" />
            <path d="M4 -82 L52 -12 H4 Z" fill="#B4335A" stroke="#FFFFFF" strokeWidth="3" strokeLinejoin="round" />
            <path d="M-8 -76 L-42 -14 H-8 Z" fill="#FFFFFF" />
            <path d="M22 -48 l3.5 7 7.5 1 -5.5 5 1.5 7.5 -7 -3.6 -7 3.6 1.5 -7.5 -5.5 -5 7.5 -1 z" fill="#FFC93C" />
          </g>
        </g>
      </g>
    </>
  );
}

/** A fog island's shore, drawn 280 wide around its centre (the island homes' shape, small). */
const MIST_SHORE = 'M-118 8 C-122 -30 -70 -50 -10 -48 C50 -54 112 -40 120 -6 C128 26 90 44 20 44 C-50 48 -114 38 -118 8 Z';
const MIST_TRAIL = 'M-40 26 C-10 18 24 22 44 10';

/**
 * An island asleep in the fog: an island home (sandy rim, trees, trail, pier) in the colours of the mist.
 * Asked about, its mist thins and it comes a little clearer.
 */
function MistIsland({ mist, asked }: { mist: Mist; asked: boolean }) {
  const s = mist.w / 280;
  return (
    <g className={`map-mist${asked ? ' is-asked' : ''}`} transform={`translate(${mist.x} ${mist.y}) scale(${s})`}>
      {/* The far island rises and settles slowly in the fog. */}
      <g className={`map-mist__float map-mist__float--${mist.kind}`}>
        <g className="map-mist__isle">
          <ellipse cx="0" cy="52" rx="128" ry="12" fill="#A9D4EA" />
          <path d={MIST_SHORE} fill="#D6E6F0" stroke="#D6E6F0" strokeWidth="18" strokeLinejoin="round" />
          <path d={MIST_SHORE} fill="#B9D3E4" />
          <ellipse cx="6" cy="-6" rx="56" ry="15" fill="#C6DCEA" />
          {mist.kind === 'grove' && (
            <g fill="#A3C0D5">
              <rect x="-75" y="-20" width="7" height="20" />
              <circle cx="-72" cy="-26" r="19" />
              <rect x="-46" y="-12" width="5" height="14" />
              <circle cx="-44" cy="-16" r="12" fill="#ADC8DB" />
              <rect x="84" y="-14" width="6" height="18" />
              <circle cx="87" cy="-20" r="16" fill="#ADC8DB" />
            </g>
          )}
          {mist.kind === 'tower' && (
            <g>
              <rect x="-78" y="-18" width="6" height="18" fill="#A3C0D5" />
              <circle cx="-75" cy="-24" r="17" fill="#A3C0D5" />
              <path d="M58 6 L62 -80 H82 L86 6 Z" fill="#A9C4D8" />
              <path d="M61 -52 H83 M60 -26 H84" stroke="#9CB9CF" strokeWidth="8" />
              <path d="M56 -80 L72 -102 L88 -80 Z" fill="#9CB9CF" />
              <circle cx="72" cy="-66" r="6" className="map-mist__light" />
            </g>
          )}
          {mist.kind === 'peak' && (
            <g>
              <path d="M-108 -6 L-66 -92 L-48 -62 L-36 -78 L-4 -6 Z" fill="#A8C3D6" />
              <path d="M-66 -92 L-78 -68 L-68 -72 L-60 -64 L-54 -72 Z M-36 -78 L-44 -62 L-36 -66 L-30 -60 Z" fill="#EEF6FB" />
              <rect x="86" y="-14" width="6" height="18" fill="#A3C0D5" />
              <circle cx="89" cy="-20" r="15" fill="#A3C0D5" />
            </g>
          )}
          <path d={MIST_TRAIL} fill="none" stroke="#CFE1EC" strokeWidth="12" strokeLinecap="round" />
          <path d={MIST_TRAIL} fill="none" stroke="#B4CCDD" strokeWidth="3" strokeLinecap="round" strokeDasharray="0 9" />
          <g stroke="#A7C1D4" strokeWidth="5" strokeLinecap="round">
            <path d="M-118 46 L-92 30" />
            <path d="M-110 54 L-84 38" />
          </g>
          <path d="M-112 44 L-88 30" stroke="#C3D8E6" strokeWidth="14" strokeLinecap="round" />
        </g>
        <g className="map-mist__veil">
          <rect x="-150" y="30" width="130" height="15" rx="7.5" />
          <rect x="-30" y="40" width="170" height="15" rx="7.5" />
          <rect x="-104" y="54" width="140" height="13" rx="6.5" />
          <rect x="44" y="22" width="100" height="12" rx="6" />
          <rect x="-140" y="16" width="56" height="10" rx="5" />
        </g>
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
  const [picked, setPicked] = useState<WorldId | null>(null);
  const [diving, setDiving] = useState(false);
  /** The fog island the child last asked about: the guide's bubble says its line. */
  const [asked, setAsked] = useState<MistKind | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    speak(speech(progress.world));
    // Reads the ref at unmount on purpose: a trip replaces the timers with its own.
    return () => timers.current.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Said once when the map opens; the speaker button repeats it.
  }, []);

  // One trip per visit: a second tap while the boat is out is ignored, so the trip always finishes.
  const pick = (id: WorldId) => {
    if (picked) return;
    stopSpeaking();
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      onPick(id);
      return;
    }
    setPicked(id);
    timers.current = [window.setTimeout(() => setDiving(true), DIVE_AT), window.setTimeout(() => onPick(id), OPEN_AT)];
  };
  // A fog island is not a world yet: the guide says something about it and the boat stays put.
  const hear = (kind: MistKind) => {
    if (picked) return;
    setAsked(kind);
    speak(MIST_LINE[kind]);
  };
  const mistSpot = (m: Mist): CSSProperties => {
    const s = m.w / 280;
    return { left: m.x - 140 * s, top: m.y - 100 * s, width: m.w, height: 160 * s };
  };
  const isle = (id: WorldId, delay: number) =>
    ({ className: `map-isle${picked === id ? ' is-picked' : ''}`, style: { '--d': `${delay}ms` } as CSSProperties });
  const diveAt = picked === 'robot' ? map.robot : map.garden;

  // The whole island is the button; its sign sits on the bottom shore.
  const spot = (at: Pt): CSSProperties => ({ left: at.x - 230, top: at.y - 170, width: 460, height: 340 });
  const counts: Record<WorldId, { icon: ReactNode; n: number }> = {
    garden: { icon: <Seed size={28} />, n: seedBalance(progress) },
    robot: { icon: <Bolt size={28} />, n: boltBalance(progress) }
  };
  // With a daily limit, each island shows the time left in its own gauge; the clock stands on the map, so it is paused here.
  const time = useTimeLeft();
  const faces: Record<WorldId, ReactNode> = {
    garden: <Csepi mood="cheer" width={40} />,
    robot: <Csavar mood="cheer" width={40} />
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
              {asked ? (
                <div className="bubble__kicker">Messze, a ködben…</div>
              ) : (
                progress.world && <div className="bubble__kicker">A hajód {DOCKED[progress.world]} vár</div>
              )}
              <h1 className="bubble__title">{asked ? MIST_LINE[asked] : 'Hova evezünk ma?'}</h1>
            </div>
            <RoundButton label="Meghallgatom újra" tint="blue" onClick={() => speak(asked ? MIST_LINE[asked] : speech(progress.world))}>
              <SpeakerIcon />
            </RoundButton>
          </div>
        </GuideBubble>
      </div>

      <FitBox className="map-fit" width={map.w} height={map.h}>
        <nav
          className={`map${picked ? ' is-sailing' : ''}${diving ? ' is-diving' : ''}`}
          aria-label="Kalandka térkép: válassz szigetet"
          style={{ width: map.w, height: map.h }}
        >
          <div className="map__scene" style={{ transformOrigin: `${diveAt.x}px ${diveAt.y}px` }}>
            <svg className="map__art" width={map.w} height={map.h} viewBox={`0 0 ${map.w} ${map.h}`} aria-hidden="true">
              <defs>
                <clipPath id="map-clip">
                  <rect width={map.w} height={map.h} rx="40" />
                </clipPath>
              </defs>
              <rect width={map.w} height={map.h} rx="40" fill="#8CCBEC" />
              <Waves w={map.w} h={map.h} />
              <g className="map-fog" clipPath="url(#map-clip)">
                {map.banks.map(([low, high]) => (
                  <g key={low}>
                    <path d={low} className="map-fog__low" />
                    <path d={high} className="map-fog__high" />
                  </g>
                ))}
              </g>
              {map.mist.map((m) => (
                <MistIsland key={m.kind} mist={m} asked={asked === m.kind} />
              ))}
              <g {...isle('garden', 0)}>
                <GardenIsland at={map.garden} />
                <ellipse cx={map.garden.x} cy={map.garden.y - 8} rx="226" ry="160" className="map-ring" />
              </g>
              <g {...isle('robot', 110)}>
                <WorkshopIsland at={map.robot} />
                <ellipse cx={map.robot.x} cy={map.robot.y - 8} rx="226" ry="160" className="map-ring" />
              </g>
              <path d={map.route[last]} className="map-route map-route--boat" />
              <Boat
                at={map.boat[last]}
                sail={picked ? map.sail[`${last}-${picked}`] : undefined}
                flipTo={picked === last ? !map.boat[last].flip : map.boat[last].flip}
              />
            </svg>

            {/* Before the worlds' spots, so where they overlap a world's sign wins the tap. */}
            {map.mist.map((m) => (
              <button
                key={m.kind}
                type="button"
                className="map-mist-spot"
                style={mistSpot(m)}
                onClick={() => hear(m.kind)}
                aria-label={`${MIST_NAME[m.kind]}: ez a világ még alszik.`}
              />
            ))}

            {WORLDS.map((w) => {
              const at = w.id === 'garden' ? map.garden : map.robot;
              return (
                <button
                  key={w.id}
                  type="button"
                  className={`map-spot map-spot--${w.id}${last === w.id ? ' is-last' : ''}${picked === w.id ? ' is-picked' : ''}`}
                  style={spot(at)}
                  onClick={() => pick(w.id)}
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

            {/* Planted on top of each island; only the first is read out, the second says the same. */}
            {time &&
              WORLDS.map((w, i) => {
                const at = w.id === 'garden' ? map.garden : map.robot;
                return (
                  <div key={w.id} className="map-timer" style={{ left: at.x, top: at.y - 150 }}>
                    <PlayTimer world={w.id} remaining={time.remaining} total={time.allowance} paused label={i === 0 ? pausedLabel(time.remaining) : undefined} />
                  </div>
                );
              })}
          </div>
          <div className={`map__wash map__wash--${picked ?? last}`} aria-hidden="true" />
        </nav>
      </FitBox>
    </div>
  );
}

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { FitBox } from './FitBox';
import { useForm, type Form } from './Stage';
import { StickerBookArt } from './garden';
import { DoneTick, LockIcon, PlayIcon } from './ui';

// A world's home: its island, every game a place along one trail from the boat's dock.
// The tablet draws the island on the whole stage; phones draw a tall (portrait) or wide (landscape)
// island in the room left under or beside Csepi, scaled to fit.

export type IslandWorld = 'garden' | 'robot';

/** One game on a world's home screen: a place on the island. */
export interface Place {
  id: string;
  name: string;
  /** The button's accessible name. */
  label: string;
  art: ReactNode;
  badge?: string | null;
  /** Where a new child begins: the island rings it once after arriving. */
  start?: boolean;
  /** A place still asleep: the tap explains what opens it. `hint` is the short line phones show under the name. */
  locked?: { skill: ReactNode; hint?: string; onTap: () => void };
  onOpen?: () => void;
}

/** The reward place (Kiskertem, Robotépítő), off the trail's end like the sticker album. */
export interface RewardPlace {
  /** The screen it opens, so its door can find it. */
  id?: string;
  label: string;
  name: string;
  art: ReactNode;
  icon: ReactNode;
  count: number;
  unit: string;
  badge: string | null;
  onClick: () => void;
}

/** The sticker album (Matricáim), off the trail beside it: the world's stickers are earned in its games. */
export interface BookPlace {
  /** Stickers earned in this world. */
  count: number;
  onOpen: () => void;
}

interface Pt {
  x: number;
  y: number;
}

/** Everything drawn on one island, in its own coordinates (w × h). */
interface Geometry {
  w: number;
  h: number;
  shore: string;
  /** The tablet workshop island is the garden's shore turned around. */
  shoreMirror?: boolean;
  /** The whole scene turned around (the phone workshop islands mirror the garden's). */
  flip?: boolean;
  /** The sandy rim around the shore. */
  sand: number;
  /** Paler grass patches (the garden only). */
  meadows: (Pt & { rx: number; ry: number })[];
  /** Trees in the garden, crates in the workshop. */
  props: (Pt & { r: number })[];
  /** Flowers in the garden, bolts in the workshop. */
  dots: Pt[];
  dotR: number;
  pier: { planks: string[]; deck: string; plankW: number; deckW: number };
  /** The short walk from the pier to the first place, and the trail through the games (the reward and the album stand beside it). */
  walk: string;
  trail: string;
  trailW: number;
  dotW: number;
  dotGap: number;
  boat: string;
  waves: Pt[];
  waveK: number;
  tile: number;
  /** Where each place's picture is centred, in trail order: the seven games, then the reward. */
  spots: Pt[];
  /** Where the sticker album's picture is centred, on the grass beside the trail. */
  book: Pt;
}

const SHORE_TABLET =
  'M150 520 C140 360 330 250 520 260 C650 200 860 210 990 290 C1110 360 1100 520 1040 620 C980 740 760 790 560 775 C380 790 210 740 165 640 C150 600 150 560 150 520 Z';

const GARDEN_TABLET: Geometry = {
  w: 1180,
  h: 820,
  shore: SHORE_TABLET,
  sand: 44,
  meadows: [
    { x: 700, y: 430, rx: 170, ry: 60 },
    { x: 330, y: 450, rx: 90, ry: 40 }
  ],
  props: [
    { x: 1023, y: 578, r: 28 },
    { x: 221, y: 378, r: 30 },
    { x: 1014, y: 325, r: 24 },
    { x: 585, y: 728, r: 22 }
  ],
  dots: [
    { x: 520, y: 430 },
    { x: 535, y: 418 },
    { x: 900, y: 650 },
    { x: 880, y: 665 },
    { x: 330, y: 720 }
  ],
  dotR: 7,
  pier: { planks: ['M150 735 L230 690', 'M160 752 L240 707'], deck: 'M195 712 L265 672', plankW: 10, deckW: 30 },
  walk: 'M265 672 C260 640 265 600 280 560',
  trail: 'M280 540 C330 450 360 380 430 360 S560 280 630 295 S780 280 840 300 S970 390 990 480 S880 560 800 540 S680 540 590 540',
  trailW: 26,
  dotW: 5,
  dotGap: 16,
  boat: 'translate(92 748) rotate(-28)',
  waves: [
    { x: 60, y: 300 },
    { x: 1060, y: 200 },
    { x: 70, y: 790 },
    { x: 1080, y: 760 },
    { x: 40, y: 150 }
  ],
  waveK: 1,
  tile: 60,
  spots: [
    { x: 280, y: 540 },
    { x: 430, y: 360 },
    { x: 630, y: 295 },
    { x: 840, y: 300 },
    { x: 990, y: 480 },
    { x: 800, y: 540 },
    { x: 590, y: 540 },
    { x: 432, y: 696 }
  ],
  book: { x: 745, y: 700 }
};

/** The workshop on the tablet: the shore turned around, its wide machines placed on their own. */
const ROBOT_TABLET: Geometry = {
  ...GARDEN_TABLET,
  shoreMirror: true,
  meadows: [],
  props: [
    { x: 1012, y: 388, r: 22 },
    { x: 1027, y: 355, r: 17 },
    { x: 500, y: 707, r: 20 }
  ],
  dots: [
    { x: 680, y: 460 },
    { x: 300, y: 660 },
    { x: 880, y: 300 }
  ],
  dotR: 6,
  pier: { planks: ['M1030 735 L950 690', 'M1020 752 L940 707'], deck: 'M985 712 L915 672', plankW: 10, deckW: 30 },
  walk: 'M915 672 C915 630 920 590 930 560',
  trail: 'M930 540 S800 430 760 380 S640 290 560 300 S420 300 350 320 S230 400 230 480 S330 570 400 560 S520 540 600 540',
  boat: 'translate(1088 748) rotate(28) scale(-1 1)',
  waves: [
    { x: 1040, y: 300 },
    { x: 40, y: 200 },
    { x: 1010, y: 790 },
    { x: 40, y: 770 },
    { x: 1060, y: 150 }
  ],
  spots: [
    { x: 930, y: 540 },
    { x: 760, y: 380 },
    { x: 560, y: 300 },
    { x: 350, y: 320 },
    { x: 230, y: 480 },
    { x: 400, y: 560 },
    { x: 600, y: 540 },
    { x: 770, y: 670 }
  ],
  book: { x: 250, y: 660 }
};

/** Portrait phones: a tall island, the trail winding up from the dock in four rows of two. */
const GARDEN_PORTRAIT: Geometry = {
  w: 390,
  h: 670,
  shore:
    'M44 130 C34 45 120 12 200 16 C292 10 358 52 352 150 C362 260 340 350 350 450 C360 542 318 602 220 606 C150 610 70 604 52 546 C34 470 52 370 40 270 C34 220 48 175 44 130 Z',
  sand: 26,
  meadows: [
    { x: 195, y: 300, rx: 70, ry: 30 },
    { x: 200, y: 160, rx: 60, ry: 24 }
  ],
  props: [{ x: 200, y: 600, r: 16 }],
  dots: [
    { x: 188, y: 305 },
    { x: 196, y: 299 },
    { x: 204, y: 313 },
    { x: 330, y: 290 }
  ],
  dotR: 5,
  pier: { planks: ['M70 636 L96 600', 'M84 644 L108 606'], deck: 'M78 630 L104 592', plankW: 7, deckW: 20 },
  walk: 'M104 592 C105 580 105 572 105 566',
  trail: 'M105 545 L285 545 C342 545 342 385 285 385 L105 385 C48 385 48 225 105 225 L285 225 C342 225 342 65 285 65',
  trailW: 18,
  dotW: 4,
  dotGap: 12,
  boat: 'translate(46 656) rotate(-14) scale(.62)',
  waves: [
    { x: 300, y: 648 },
    { x: 6, y: 300 },
    { x: 200, y: 658 }
  ],
  waveK: 0.6,
  tile: 40,
  spots: [
    { x: 105, y: 545 },
    { x: 285, y: 545 },
    { x: 285, y: 385 },
    { x: 105, y: 385 },
    { x: 105, y: 225 },
    { x: 285, y: 225 },
    { x: 285, y: 65 },
    { x: 105, y: 65 }
  ],
  book: { x: 195, y: 465 }
};

/** Landscape phones: a wide island beside Csepi, the trail out along the bottom row and back along the top. */
const GARDEN_LANDSCAPE: Geometry = {
  w: 624,
  h: 390,
  shore: 'M12 200 C6 80 96 22 316 24 C536 20 612 70 610 190 C612 310 556 368 336 366 C126 370 18 330 12 200 Z',
  sand: 22,
  meadows: [{ x: 286, y: 186, rx: 120, ry: 26 }],
  props: [
    { x: 581, y: 144, r: 15 },
    { x: 149, y: 326, r: 13 }
  ],
  dots: [
    { x: 148, y: 182 },
    { x: 158, y: 188 },
    { x: 428, y: 190 },
    { x: 560, y: 196 }
  ],
  dotR: 4,
  pier: { planks: ['M32 372 L50 340', 'M44 378 L62 346'], deck: 'M40 366 L60 334', plankW: 6, deckW: 16 },
  walk: 'M60 334 C66 322 70 314 76 304',
  trail: 'M76 268 L496 268 C568 268 568 104 496 104 L216 104',
  trailW: 15,
  dotW: 3.5,
  dotGap: 11,
  boat: 'translate(18 378) rotate(-20) scale(.48)',
  waves: [
    { x: 260, y: 382 },
    { x: 560, y: 384 },
    { x: 470, y: 8 }
  ],
  waveK: 0.6,
  tile: 40,
  spots: [
    { x: 76, y: 268 },
    { x: 216, y: 268 },
    { x: 356, y: 268 },
    { x: 496, y: 268 },
    { x: 496, y: 104 },
    { x: 356, y: 104 },
    { x: 216, y: 104 },
    { x: 76, y: 104 }
  ],
  book: { x: 576, y: 326 }
};

/** The workshop's phone islands: the garden's turned around, so its dock and trail start on the other side. */
const mirrored = (g: Geometry): Geometry => ({ ...g, flip: true, meadows: [], spots: g.spots.map((p) => ({ x: g.w - p.x, y: p.y })), book: { x: g.w - g.book.x, y: g.book.y } });

const GEOMETRY: Record<IslandWorld, Record<Form, Geometry>> = {
  garden: { tablet: GARDEN_TABLET, portrait: GARDEN_PORTRAIT, landscape: GARDEN_LANDSCAPE },
  robot: { tablet: ROBOT_TABLET, portrait: mirrored(GARDEN_PORTRAIT), landscape: mirrored(GARDEN_LANDSCAPE) }
};

/** The arrival (s): the island rises, the trail draws, then the places pop up along it one by one. */
const FIRST_SPOT = 0.35;
const SPOT_STEP = 0.07;
/** Leaving for the map (ms): the places go in reverse, the boat sails off, the island sinks away. */
const LEAVE_MS = 850;
/** Opening a game (ms): the place hops and its door opens before the game takes over. */
const ENTER_MS = 450;

/** Back from a game: the island is already in place, only the game's own place lands, with a tick for a task solved there. */
export interface Return {
  id: string;
  solved: boolean;
  landed: boolean;
}

const COLORS = {
  garden: { sand: '#F3DFA8', ground: '#A6D676', meadow: '#B4DE88', path: '#EFD9A0', pathDots: '#E0B95E', wave: '#D8F0FB', plank: '#5A3B26', deck: '#C99A6B', hull: '#E8577D', mast: '#5A3B26', sail: '#FFFFFF' },
  robot: { sand: '#E6DCC4', ground: 'url(#island-tiles)', meadow: '', path: '#E9EEF4', pathDots: '#F2B33D', wave: '#DCEBF6', plank: '#4F5F72', deck: '#8FA3BA', hull: '#138A86', mast: '#4F5F72', sail: '#F2B33D' }
};

function Scene({ world, g }: { world: IslandWorld; g: Geometry }) {
  const c = COLORS[world];
  const robot = world === 'robot';
  const turn = (on?: boolean) => (on ? `translate(${g.w} 0) scale(-1 1)` : undefined);
  return (
    <svg className="island__scene" aria-hidden="true" width={g.w} height={g.h} viewBox={`0 0 ${g.w} ${g.h}`}>
      {robot && (
        <defs>
          <pattern id="island-tiles" width={g.tile} height={g.tile} patternUnits="userSpaceOnUse">
            <rect width={g.tile} height={g.tile} fill="#C9D6E4" />
            <path d={`M${g.tile} 0 V${g.tile} M0 ${g.tile} H${g.tile}`} stroke="#B3C3D6" strokeWidth={g.tile / 20} />
            <circle cx={g.tile / 7} cy={g.tile / 7} r={g.tile / 30} fill="#AABBD0" />
          </pattern>
        </defs>
      )}
      <g transform={turn(g.flip)}>
        <g className="island__waves" fill="none" stroke={c.wave} strokeWidth={5 * Math.max(g.waveK, 0.8)} strokeLinecap="round">
          {g.waves.map((p, i) => (
            <path key={i} d={`M${p.x} ${p.y} q${20 * g.waveK} ${-10 * g.waveK} ${40 * g.waveK} 0 t${40 * g.waveK} 0`} />
          ))}
        </g>
        <g transform={turn(g.shoreMirror)}>
          <path d={g.shore} fill={c.sand} stroke={c.sand} strokeWidth={g.sand} strokeLinejoin="round" />
          <path d={g.shore} fill={c.ground} />
        </g>
        {g.meadows.map((m, i) => (
          <ellipse key={i} cx={m.x} cy={m.y} rx={m.rx} ry={m.ry} fill={c.meadow} />
        ))}
        {g.props.map((p, i) =>
          robot ? (
            <rect key={i} x={p.x - p.r} y={p.y - p.r * 0.8} width={p.r * 2} height={p.r * 1.6} rx={p.r * 0.15} fill={i % 2 ? '#E0A840' : '#C98A2B'} />
          ) : (
            <g key={i}>
              <rect x={p.x - p.r * 0.18} y={p.y + p.r * 0.4} width={p.r * 0.36} height={p.r * 1.2} fill="#7A5233" />
              <circle cx={p.x} cy={p.y} r={p.r} fill={i % 2 ? '#3D8F3F' : '#2F7D32'} />
            </g>
          )
        )}
        {g.dots.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={g.dotR} fill={robot || i % 2 ? '#FFC93C' : '#E8577D'} />
        ))}
        <g stroke={c.plank} strokeWidth={g.pier.plankW} strokeLinecap="round">
          {g.pier.planks.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <path d={g.pier.deck} stroke={c.deck} strokeWidth={g.pier.deckW} strokeLinecap="round" />
        <path d={g.walk} fill="none" stroke={c.path} strokeWidth={g.trailW} strokeLinecap="round" />
        <path className="island__trail" d={g.trail} pathLength={1} fill="none" stroke={c.path} strokeWidth={g.trailW} strokeLinecap="round" />
        <path className="island__dots" d={g.trail} fill="none" stroke={c.pathDots} strokeWidth={g.dotW} strokeLinecap="round" strokeDasharray={`0 ${g.dotGap}`} />
        <g className="island__boat">
          <g className="island__bob">
            <g transform={g.boat}>
              <path d="M-46 0 L46 0 L34 22 L-34 22 Z" fill={c.hull} />
              <rect x="-6" y="-44" width="5" height="46" fill={c.mast} />
              <path d="M0 -42 L30 -12 L0 -12 Z" fill={c.sail} />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}

const spotStyle = (at: Pt, i: number) => ({ left: at.x, top: at.y, '--d': `${FIRST_SPOT + i * SPOT_STEP}s` }) as CSSProperties;

function IslandSpot({ place, at, i, phone, chosen, landed }: { place: Place; at: Pt; i: number; phone: boolean; chosen: boolean; landed: Return | null }) {
  const { locked } = place;
  return (
    <button
      type="button"
      className={`spot${locked ? ' spot--locked' : ''}${place.start ? ' spot--start' : ''}${chosen ? ' is-chosen' : ''}${landed ? ' is-landing' : ''}`}
      style={spotStyle(at, i)}
      onClick={locked ? locked.onTap : place.onOpen}
      aria-label={place.label}
      data-place={place.id}
    >
      {place.badge && <span className="spot__badge">{place.badge}</span>}
      <span className="spot__disc">
        {landed?.solved && <DoneTick />}
        {locked && (
          <span className="spot__lock">
            <LockIcon />
          </span>
        )}
        <span className="spot__art">{place.art}</span>
      </span>
      <span className="spot__name">
        {!locked && <PlayIcon />}
        {place.name}
      </span>
      {locked && <span className="spot__hint">{phone ? (locked.hint ?? locked.skill) : locked.skill}</span>}
    </button>
  );
}

function RewardSpot({ reward, at, i, chosen, landed }: { reward: RewardPlace; at: Pt; i: number; chosen: boolean; landed: boolean }) {
  return (
    <button
      type="button"
      className={`spot spot--reward${chosen ? ' is-chosen' : ''}${landed ? ' is-landing' : ''}`}
      style={spotStyle(at, i)}
      onClick={reward.onClick}
      aria-label={`${reward.label} · ${reward.count} ${reward.unit}`}
      data-place={reward.id}
    >
      {reward.badge && <span className="spot__badge">{reward.badge}</span>}
      <span className="spot__disc">
        <span className="spot__art">{reward.art}</span>
        <span className="spot__count" aria-hidden="true">
          {reward.icon}
          {reward.count}
        </span>
      </span>
      <span className="spot__name">{reward.name}</span>
    </button>
  );
}

function BookSpot({ book, at, i }: { book: BookPlace; at: Pt; i: number }) {
  return (
    <button type="button" className="spot spot--book" style={spotStyle(at, i)} onClick={book.onOpen} aria-label={`Matricáim · ${book.count} matrica`} data-place="album">
      <span className="spot__disc">
        <span className="spot__art">
          <StickerBookArt />
        </span>
        <span className="spot__count" aria-hidden="true">
          {book.count}
        </span>
      </span>
      <span className="spot__name">Matricáim</span>
    </button>
  );
}

/**
 * The island with its places: the games in trail order, then the reward, and the sticker album beside the trail. `leaving` plays the way out to the map,
 * `opening` names the place whose game is opening, and `back` draws the island as it was when the child comes back from a game.
 */
export function Island({
  world,
  places,
  reward,
  book,
  leaving,
  opening,
  back
}: {
  world: IslandWorld;
  places: Place[];
  reward: RewardPlace;
  book: BookPlace;
  leaving: boolean;
  opening: string | null;
  back: Return | null;
}) {
  const form = useForm();
  const g = GEOMETRY[world][form];
  const last = g.spots.length - 1;
  const phone = form !== 'tablet';
  const board = useRef<HTMLDivElement>(null);
  const landed = back?.landed ? back : null;

  // The place the child came back to takes the focus once it has landed, so the next tap or Tab starts there.
  useEffect(() => {
    if (landed) board.current?.querySelector<HTMLElement>(`[data-place="${landed.id}"]`)?.focus({ preventScroll: true });
  }, [landed?.id]);

  const state = `${leaving ? ' is-leaving' : ''}${opening ? ' is-opening' : ''}${back ? ' is-back' : ''}`;
  return (
    <div className={`island island--${world} island--${form}${g.flip ? ' island--flip' : ''}${state}`}>
      <FitBox width={g.w} height={g.h} className="island__fit">
        <div className="island__board" ref={board} style={{ width: g.w, height: g.h }}>
          <Scene world={world} g={g} />
          {places.slice(0, last).map((p, i) => (
            <IslandSpot key={p.id} place={p} at={g.spots[i]} i={i} phone={phone} chosen={opening === p.id} landed={landed?.id === p.id ? landed : null} />
          ))}
          <RewardSpot reward={reward} at={g.spots[last]} i={last} chosen={opening !== null && opening === reward.id} landed={landed !== null && landed.id === reward.id} />
          <BookSpot book={book} at={g.book} i={last} />
        </div>
      </FitBox>
    </div>
  );
}

/** The way back to the map: the island plays its leaving motion first, unless motion is turned down. */
export function useLeave(onLeave: () => void): [boolean, () => void] {
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    []
  );
  const leave = () => {
    if (leaving) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      onLeave();
      return;
    }
    setLeaving(true);
    timer.current = window.setTimeout(onLeave, LEAVE_MS);
  };
  return [leaving, leave];
}

/**
 * The way into a game: the place hops and its door opens, then `open` runs. Further taps wait until the game is open.
 * With motion turned down the game opens at once.
 */
export function useEnter(): [string | null, (id: string, open: () => void) => void] {
  const [opening, setOpening] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    []
  );
  const enter = (id: string, open: () => void) => {
    if (opening) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      open();
      return;
    }
    setOpening(id);
    timer.current = window.setTimeout(open, ENTER_MS);
  };
  return [opening, enter];
}

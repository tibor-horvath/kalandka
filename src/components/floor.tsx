import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Block, Cell, Dir, Pose } from '../games/robot/path';
import { buzz, thud } from '../lib/sound';
import { Crate, Rover as RoverArt } from './robot';

// The workshop floor Robotút and Hibavadász share: its tiles and crates, and the little robot driving over them.

/** One floor tile, in board units. */
export const CELL = 100;
/** The board's frame on the tablet: the largest course (6 × 5) fits it. */
export const FRAME_W = 6 * CELL + 40;
export const FRAME_H = 5 * CELL + 40;
/** When a step turns the robot and moves it, it turns on the spot for this long before driving. */
const TURN_MS = 260;
/** How long a bump plays: drive in, squash, bounce back. */
const HIT_MS = 700;
/** Impact sparks: angles fanned round the way back from the point of contact (0 = up). */
const SPARKS = [-70, -35, 0, 35, 70];

export const DX = [0, 1, 0, -1];
export const DY = [-1, 0, 1, 0];

const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;

/** The strip of floor edge between the robot's cell and the wall it drove into (the cell outside the floor). */
function edgeRect(outside: Cell, dir: Dir): { x: number; y: number; width: number; height: number } {
  const x = (outside.x - DX[dir]) * CELL;
  const y = (outside.y - DY[dir]) * CELL;
  if (dir === 0) return { x: x + 12, y: y - 3, width: CELL - 24, height: 8 };
  if (dir === 2) return { x: x + 12, y: y + CELL - 5, width: CELL - 24, height: 8 };
  if (dir === 3) return { x: x - 3, y: y + 12, width: 8, height: CELL - 24 };
  return { x: x + CELL - 5, y: y + 12, width: 8, height: CELL - 24 };
}

/** Turning the shortest way round, so the robot never spins a full circle between 270° and 0°. */
function turnBy(from: Dir, to: Dir): number {
  return ((((to - from + 4) % 4) + 1) % 4) - 1;
}

export interface Hit {
  id: number;
  dir: Dir;
  block: Block;
  at: Cell;
}

export interface Rover {
  pose: Pose;
  /** Where the robot is now, for the timers of a run. */
  live: { current: Pose };
  angle: number;
  /** The bump playing now, if any; its id restarts the animation on every new bump. */
  hit: Hit | null;
  /** Delay before the robot drives, so a turn is seen before the move. */
  driveDelay: number;
  moveTo: (next: Pose) => void;
  bump: (dir: Dir, block: Block) => void;
}

/** The robot on the floor: where it stands, which way it faces, and the bump it is in the middle of. */
export function useRover(start: Pose, later: (fn: () => void, ms: number) => void): Rover {
  const [pose, setPose] = useState<Pose>(start);
  const [angle, setAngle] = useState(start.dir * 90);
  const [hit, setHit] = useState<Hit | null>(null);
  const [driveDelay, setDriveDelay] = useState(0);
  const live = useRef(start);
  const hitId = useRef(0);

  const moveTo = (next: Pose) => {
    const from = live.current;
    const turns = turnBy(from.dir, next.dir);
    setDriveDelay(turns !== 0 && !sameCell(from, next) ? TURN_MS : 0);
    setAngle((a) => a + turns * 90);
    live.current = next;
    setPose(next);
  };

  /** A bump: the robot drives into what is in the way, squashes, bounces back and blinks; a crate wobbles, a wall edge flashes. */
  const bump = (dir: Dir, block: Block) => {
    const at = live.current;
    const id = ++hitId.current;
    setHit({ id, dir, block, at: { x: at.x + DX[dir], y: at.y + DY[dir] } });
    thud();
    buzz(30);
    later(() => setHit((h) => (h && h.id === id ? null : h)), HIT_MS);
  };

  return { pose, live, angle, hit, driveDelay, moveTo, bump };
}

export function FloorTiles({ cols, rows }: { cols: number; rows: number }) {
  return (
    <>
      {Array.from({ length: cols * rows }, (_, i) => {
        const x = i % cols;
        const y = Math.floor(i / cols);
        return <rect key={i} x={x * CELL + 3} y={y * CELL + 3} width={CELL - 6} height={CELL - 6} rx="14" className={`path-tile${(x + y) % 2 ? ' is-alt' : ''}`} />;
      })}
    </>
  );
}

/** The crates, one wobbling when struck, and the wall edge that flashes when the robot drives into it. */
export function FloorCrates({ crates, hit }: { crates: Cell[]; hit: Hit | null }) {
  const wallEdge = hit && hit.block === 'wall' ? edgeRect(hit.at, hit.dir) : null;
  return (
    <>
      {crates.map((c) => {
        const struck = hit && hit.block === 'crate' && sameCell(hit.at, c);
        return (
          <g key={`${c.x},${c.y}`} transform={`translate(${c.x * CELL} ${c.y * CELL})`}>
            <g key={struck ? hit.id : 'still'} className={struck ? 'path-crate is-hit' : 'path-crate'}>
              <Crate />
            </g>
          </g>
        );
      })}
      {wallEdge && <rect key={hit!.id} {...wallEdge} rx="4" className="path-wallhit" />}
    </>
  );
}

/** The robot is an HTML layer over the floor: turning and driving animate the same in every browser. */
export function FloorRobot({ rover, happy, empty, children }: { rover: Rover; happy?: boolean; empty?: boolean; children?: ReactNode }) {
  const { pose, angle, hit, driveDelay } = rover;
  const sideways = pose.dir === 1 || pose.dir === 3;
  const facing = {
    '--jx': `${DX[pose.dir] * 12}px`,
    '--jy': `${DY[pose.dir] * 12}px`,
    // Squash flat against what it hit: thinner along the way it drives, wider across.
    '--sx': sideways ? 0.86 : 1.1,
    '--sy': sideways ? 1.1 : 0.86
  } as CSSProperties;
  return (
    <div
      className={`path-robot${hit ? ' is-hit' : ''}${happy ? ' is-happy' : ''}${empty ? ' is-empty' : ''}`}
      style={{ width: CELL, height: CELL, transform: `translate(${pose.x * CELL}px, ${pose.y * CELL}px)`, transitionDelay: `${driveDelay}ms` }}
      aria-hidden="true"
    >
      {/* Sag layer: the sputter jolts along the way the robot faces, then it leans over. */}
      <div key={hit ? `hit${hit.id}` : 'sag'} className="path-robot__sag" style={facing}>
        <div className="path-robot__turn" style={{ transform: `rotate(${angle}deg)` }}>
          <svg width={CELL} height={CELL} viewBox="0 0 100 100">
            <RoverArt />
          </svg>
        </div>
      </div>
      {hit && (
        <span key={`sparks${hit.id}`} className="path-sparks" style={{ left: CELL / 2 + DX[hit.dir] * 46, top: CELL / 2 + DY[hit.dir] * 46 }}>
          {SPARKS.map((a) => (
            <span key={a} className="path-spark" style={{ '--a': `${hit.dir * 90 + 180 + a}deg` } as CSSProperties} />
          ))}
        </span>
      )}
      {children}
    </div>
  );
}

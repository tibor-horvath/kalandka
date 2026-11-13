import { path } from './games/path.print';
import { sort } from './games/sort.print';
import { scale } from './games/scale.print';
import { seq } from './games/seq.print';
import { mirror } from './games/mirror.print';
import { code } from './games/code.print';
import { fix } from './games/fix.print';

// Robotműhely on paper: each game's sheets live next to its logic, in games/<game>.print.tsx.

export const ROBOT_SHEETS = [path, sort, scale, seq, mirror, code, fix];

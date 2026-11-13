import { learn } from './games/learn/print';
import { water } from './games/water/print';
import { patterns } from './games/patterns/print';
import { flash } from './games/flash/print';
import { add } from './games/add/print';
import { trace } from './games/trace/print';
import { pots } from './games/pots/print';

// Számkertész on paper: each game's sheets live next to its logic, in games/<game>/print.tsx.

export const GARDEN_SHEETS = [learn, water, patterns, flash, add, trace, pots];

import { ADD_LEVELS, clampLevel } from '../games/add/logic';
import { LEARN_MAX } from '../games/learn/logic';
import type { Progress } from './progress';
import { playedToday } from './screenTime';

// Plain-language notes for parents on the overview page: what is going well, where a little help would pay off.

export interface Insight {
  tone: 'tip' | 'good';
  title: string;
  text: string;
}

export function insights(p: Progress, day: string, max = 2): Insight[] {
  const out: Insight[] = [];
  const addLevel = ADD_LEVELS[clampLevel(p.addLevel)];

  if (p.addMisses >= 2) {
    out.push({
      tone: 'tip',
      title: `A Méhecskében a „${addLevel.name}” még nehéz.`,
      text: 'Az utolsó feladatoknál többször kért segítséget. Közös számolás az ujjakon vagy kanalakkal sokat segít.'
    });
  }
  if (p.addStreak >= 3) {
    out.push({
      tone: 'good',
      title: `${p.addStreak} jó összeadás egymás után.`,
      text: `A Méhecske „${addLevel.name}” szintjén magabiztosan számol. Csepi hamarosan nehezebbet ajánl.`
    });
  }
  const learned = Math.min(LEARN_MAX, p.learnSolved);
  if (learned > 0) {
    out.push({
      tone: 'good',
      title: learned >= LEARN_MAX ? 'Minden számot ismer 20-ig.' : `${learned} számot ismer 20-ig.`,
      text: learned >= LEARN_MAX ? 'A Számvetésben végigjárta a számokat 1-től 20-ig.' : `A Számvetésben a következő szám: ${learned + 1}.`
    });
  }
  if (playedToday(p, day) === 0) {
    out.push({ tone: 'tip', title: 'Ma még nem játszott.', text: 'Egy rövid, 10 perces játék is elég a napi gyakorláshoz.' });
  }
  if (out.length === 0) {
    out.push({ tone: 'tip', title: 'Kezdjétek a Számvetéssel.', text: 'Ott ismerkedik meg a számokkal 1-től 20-ig, időnyomás nélkül.' });
  }
  return out.slice(0, max);
}

// Parents' gate: a multiplication 5–7 year olds cannot do yet. Two-digit answers, so a lucky tap rarely opens it.

export interface GateQuestion {
  a: number;
  b: number;
  answer: string;
}

const GATE_PAIRS: [number, number][] = [
  [6, 7], [7, 8], [8, 6], [9, 7], [6, 9], [8, 9], [7, 7], [9, 4]
];

export function gateQuestion(rand: () => number = Math.random): GateQuestion {
  const [a, b] = GATE_PAIRS[Math.floor(rand() * GATE_PAIRS.length) % GATE_PAIRS.length];
  return { a, b, answer: String(a * b) };
}

import { describe, expect, it } from 'vitest';
import {
  CODE_LEVELS,
  PICS,
  buildCodeRound,
  hiddenWrongFeedback,
  keyRowSpeech,
  lamp,
  pic,
  rowFor,
  rowOfMeaning,
  rowOfSign,
  sameSign,
  signName,
  startFeedback,
  theSignAcc,
  wrongFeedback,
  type CodeKind,
  type CodeTask,
  type Sign
} from './code';

const levelOf = (kind: CodeKind) => CODE_LEVELS.findIndex((l) => l.kind === kind);
const rounds = (kind: CodeKind) => Array.from({ length: 20 }, (_, r) => buildCodeRound(levelOf(kind), r));
const tasks = (kind: CodeKind) => rounds(kind).flatMap((r) => r.tasks);
const distinct = (signs: Sign[]) => signs.filter((s, i) => signs.findIndex((t) => sameSign(s, t)) === i).length;
const inPad = (t: CodeTask) => t.answer.every((a) => t.keypad.some((k) => sameSign(a, k)));

describe('Kódzár levels', () => {
  it('has seven levels, the last with two tasks a round', () => {
    expect(CODE_LEVELS).toHaveLength(7);
    expect(CODE_LEVELS.map((l) => l.tasks)).toEqual([3, 3, 3, 3, 3, 3, 2]);
  });

  it('builds the same round every time, and another for the next round', () => {
    for (let l = 0; l < CODE_LEVELS.length; l++) {
      expect(buildCodeRound(l, 3)).toEqual(buildCodeRound(l, 3));
      expect(buildCodeRound(l, 4)).not.toEqual(buildCodeRound(l, 3));
    }
  });

  it('keeps out-of-range levels on the first and last', () => {
    expect(buildCodeRound(-2, 0).level).toBe(CODE_LEVELS[0]);
    expect(buildCodeRound(99, 0).level).toBe(CODE_LEVELS[6]);
  });

  it('never gives the same code twice in a row', () => {
    for (let l = 0; l < CODE_LEVELS.length; l++) {
      for (let r = 0; r < 20; r++) {
        const ts = buildCodeRound(l, r).tasks;
        for (let i = 1; i < ts.length; i++) expect(ts[i].code.length === ts[i - 1].code.length && ts[i].code.every((s, j) => sameSign(s, ts[i - 1].code[j]))).toBe(false);
      }
    }
  });

  it('always puts every answer on the keypad, each button once, and a slot for every sign', () => {
    for (let l = 0; l < CODE_LEVELS.length; l++) {
      for (const r of Array.from({ length: 20 }, (_, i) => buildCodeRound(l, i))) {
        for (const t of r.tasks) {
          expect(t.answer).toHaveLength(t.code.length);
          expect(inPad(t)).toBe(true);
          expect(distinct(t.keypad)).toBe(t.keypad.length);
        }
      }
    }
  });
});

describe('copying lamps', () => {
  it('Színzár: two different colours, copied as they are, three colour buttons', () => {
    for (const t of tasks('copy')) {
      expect(t.code).toHaveLength(2);
      expect(distinct(t.code)).toBe(2);
      expect(t.answer).toEqual(t.code);
      expect(t.keypad).toHaveLength(3);
      expect(t.key).toEqual([]);
    }
  });

  it('Hosszabb zár: three or four lamps, never all one colour', () => {
    const lengths = new Set<number>();
    for (const t of tasks('long')) {
      lengths.add(t.code.length);
      expect(distinct(t.code)).toBeGreaterThan(1);
      expect(t.answer).toEqual(t.code);
    }
    expect([...lengths].sort()).toEqual([3, 4]);
  });
});

describe('the code key', () => {
  it('maps the three lamps to three different pictures, one-to-one', () => {
    for (const kind of ['key', 'newkey', 'send', 'missing'] as CodeKind[]) {
      for (const t of tasks(kind)) {
        expect(t.key.map((r) => r.sign.kind)).toEqual(['lamp', 'lamp', 'lamp']);
        expect(distinct(t.key.map((r) => r.meaning))).toBe(3);
      }
    }
  });

  it('Kódtábla: decodes lamps into pictures with one key for the whole round', () => {
    for (const r of rounds('key')) {
      expect(r.tasks[0].code).toHaveLength(2);
      for (const t of r.tasks) {
        expect(t.key).toEqual(r.tasks[0].key);
        t.code.forEach((s, i) => expect(t.answer[i]).toEqual(t.key[rowOfSign(t.key, s)].meaning));
        expect(t.keypad).toHaveLength(3);
      }
    }
  });

  it('Új kódtábla: a new key for every task, 3–4 signs, and a fourth picture on the keypad', () => {
    let changed = 0;
    for (const r of rounds('newkey')) {
      for (let i = 1; i < r.tasks.length; i++) if (JSON.stringify(r.tasks[i].key) !== JSON.stringify(r.tasks[i - 1].key)) changed++;
      for (const t of r.tasks) {
        expect(t.code.length).toBeGreaterThanOrEqual(3);
        expect(t.code.length).toBeLessThanOrEqual(4);
        expect(t.keypad).toHaveLength(4);
        expect(PICS.every((p) => t.keypad.some((k) => sameSign(k, pic(p))))).toBe(true);
      }
    }
    expect(changed).toBeGreaterThan(30);
  });

  it('Pöttykód: dice faces to their numerals, with neighbours on a four-button keypad', () => {
    for (const t of tasks('dots')) {
      expect(t.code.every((s) => s.kind === 'dots' && s.n >= 1 && s.n <= 6)).toBe(true);
      t.code.forEach((s, i) => expect(t.answer[i]).toEqual({ kind: 'digit', n: s.kind === 'dots' ? s.n : 0 }));
      expect(t.keypad).toHaveLength(4);
      expect(t.keypad.every((k) => k.kind === 'digit' && k.n >= 1 && k.n <= 6)).toBe(true);
      expect(t.key.every((r) => r.sign.kind === 'dots' && r.meaning.kind === 'digit' && r.sign.n === r.meaning.n)).toBe(true);
    }
  });

  it('Üzenet: pictures to send, lamps on the keypad, the key read backwards', () => {
    for (const t of tasks('send')) {
      expect(t.code.every((s) => s.kind === 'pic')).toBe(true);
      expect(t.answer.every((s) => s.kind === 'lamp')).toBe(true);
      t.code.forEach((s, i) => {
        expect(t.key[rowOfMeaning(t.key, s)].sign).toEqual(t.answer[i]);
        expect(rowFor(t, i, 'send')).toBe(rowOfMeaning(t.key, s));
      });
    }
  });

  it('Hiányzó jel: the note gives the covered row away, and the code needs it', () => {
    for (const t of tasks('missing')) {
      const h = t.hidden!;
      const covered = t.key[h.row];
      expect(h.note).toHaveLength(2);
      expect(h.note.some((r) => sameSign(r.sign, covered.sign) && sameSign(r.meaning, covered.meaning))).toBe(true);
      expect(distinct(h.note.map((r) => r.sign))).toBe(2);
      expect(t.code.some((s) => sameSign(s, covered.sign))).toBe(true);
      expect(h.choices).toHaveLength(3);
      expect(distinct(h.choices)).toBe(3);
      expect(h.choices.filter((c) => sameSign(c, covered.meaning))).toHaveLength(1);
      // One wrong card belongs to another row, the other to no row at all.
      expect(h.choices.filter((c) => rowOfMeaning(t.key, c) < 0)).toHaveLength(1);
    }
  });
});

describe('Csavar', () => {
  it('names signs in Hungarian', () => {
    expect(signName(lamp('red'))).toBe('piros lámpa');
    expect(signName(pic('battery'))).toBe('elem');
    expect(signName({ kind: 'dots', n: 3 })).toBe('három pötty');
    expect(signName({ kind: 'digit', n: 3 })).toBe('hármas');
    expect(theSignAcc(pic('battery'))).toBe('az elemet');
    expect(theSignAcc(lamp('blue'))).toBe('a kék lámpát');
    expect(keyRowSpeech({ sign: lamp('red'), meaning: pic('gear') })).toBe('A piros lámpa: fogaskerék.');
  });

  it('points at the slot or the key row after a wrong button', () => {
    const copy = buildCodeRound(levelOf('copy'), 0);
    expect(wrongFeedback(copy.level, copy.tasks[0], 1).text).toBe('Hoppá! Nézd meg a második lámpát!');
    expect(wrongFeedback(copy.level, copy.tasks[0], 0).text).toBe('Hoppá! Nézd meg az első lámpát!');
    const key = buildCodeRound(levelOf('key'), 0);
    expect(wrongFeedback(key.level, key.tasks[0], 0).text).toMatch(/^Hoppá! Keresd meg a (piros|kék|sárga) lámpát a kódtáblán!$/);
    const dots = buildCodeRound(levelOf('dots'), 0);
    const n = dots.tasks[0].code[0].kind === 'dots' ? dots.tasks[0].code[0].n : 0;
    expect(wrongFeedback(dots.level, dots.tasks[0], 0).speech.split(',')).toHaveLength(n);
  });

  it('asks about the covered row on Hiányzó jel, and says whose picture a wrong card is', () => {
    const r = buildCodeRound(levelOf('missing'), 2);
    const t = r.tasks[0];
    expect(startFeedback(r.level, t, false).text).toContain('cetlit');
    const taken = t.hidden!.choices.find((c) => rowOfMeaning(t.key, c) >= 0 && rowOfMeaning(t.key, c) !== t.hidden!.row)!;
    expect(hiddenWrongFeedback(t, taken).text).toContain('már');
  });
});

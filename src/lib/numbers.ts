// Hungarian number words, 1–100.
// Attributive form ("két csepp", "huszonkét virág") is used before a noun;
// the counting form ("kettő", "huszonkettő") stands alone.

const ONES_ATTR = ['', 'egy', 'két', 'három', 'négy', 'öt', 'hat', 'hét', 'nyolc', 'kilenc'];
const ONES_COUNT = ['', 'egy', 'kettő', 'három', 'négy', 'öt', 'hat', 'hét', 'nyolc', 'kilenc'];
/** Round tens on their own: tíz, húsz, harminc … */
const TENS = ['', 'tíz', 'húsz', 'harminc', 'negyven', 'ötven', 'hatvan', 'hetven', 'nyolcvan', 'kilencven'];
/** Tens before ones: tizen-egy, huszon-egy, harminc-egy … */
const TENS_PREFIX = ['', 'tizen', 'huszon', 'harminc', 'negyven', 'ötven', 'hatvan', 'hetven', 'nyolcvan', 'kilencven'];

function assertRange(n: number): void {
  if (!Number.isInteger(n) || n < 1 || n > 100) {
    throw new RangeError(`Number word needs an integer from 1 to 100, got ${n}`);
  }
}

function word(n: number, ones: string[]): string {
  assertRange(n);
  if (n === 100) return 'száz';
  const t = Math.floor(n / 10);
  const o = n % 10;
  if (o === 0) return TENS[t];
  return TENS_PREFIX[t] + ones[o];
}

/** "két" in "két csepp kell", "huszonhárom" in "huszonhárom virág". */
export function numberAttr(n: number): string {
  return word(n, ONES_ATTR);
}

/** Hungarian article: "az" before a vowel sound (az egy, az öt, az ötven), otherwise "a" (a kettő). */
export function article(word: string): 'a' | 'az' {
  return /^[aáeéiíoóöőuúüű]/i.test(word) ? 'az' : 'a';
}

export function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/** "kettő", "tizenkettő", "harminckettő" when counting out loud. */
export function numberCount(n: number): string {
  return word(n, ONES_COUNT);
}

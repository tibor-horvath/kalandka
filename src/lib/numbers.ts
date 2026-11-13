// Hungarian number words, 1–999 999.
// Attributive form ("két csepp", "huszonkét virág") is used before a noun;
// the counting form ("kettő", "huszonkettő") stands alone.

const ONES_ATTR = ['', 'egy', 'két', 'három', 'négy', 'öt', 'hat', 'hét', 'nyolc', 'kilenc'];
const ONES_COUNT = ['', 'egy', 'kettő', 'három', 'négy', 'öt', 'hat', 'hét', 'nyolc', 'kilenc'];
/** Round tens on their own: tíz, húsz, harminc … */
const TENS = ['', 'tíz', 'húsz', 'harminc', 'negyven', 'ötven', 'hatvan', 'hetven', 'nyolcvan', 'kilencven'];
/** Tens before ones: tizen-egy, huszon-egy, harminc-egy … */
const TENS_PREFIX = ['', 'tizen', 'huszon', 'harminc', 'negyven', 'ötven', 'hatvan', 'hetven', 'nyolcvan', 'kilencven'];

function assertRange(n: number): void {
  if (!Number.isInteger(n) || n < 1 || n > 999_999) {
    throw new RangeError(`Number word needs an integer from 1 to 999999, got ${n}`);
  }
}

/** 1–99; only the last digit changes between the attributive and counting forms. */
function belowHundred(n: number, ones: string[]): string {
  const t = Math.floor(n / 10);
  const o = n % 10;
  if (o === 0) return TENS[t];
  return TENS_PREFIX[t] + ones[o];
}

/** 1–999: száz, százegy, kétszáz, kilencszázkilencvenkilenc. */
function belowThousand(n: number, ones: string[]): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const head = h === 0 ? '' : (h === 1 ? '' : ONES_ATTR[h]) + 'száz';
  return rest === 0 ? head : head + belowHundred(rest, ones);
}

function word(n: number, ones: string[]): string {
  assertRange(n);
  if (n < 1000) return belowThousand(n, ones);
  const k = Math.floor(n / 1000);
  const rest = n % 1000;
  const head = (k === 1 ? '' : belowThousand(k, ONES_ATTR)) + 'ezer';
  if (rest === 0) return head;
  // Above 2000 Hungarian writes a hyphen after the thousands: kétezer-egy, but ezeregy, ezerkilencszáz.
  return head + (n > 2000 ? '-' : '') + belowThousand(rest, ones);
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

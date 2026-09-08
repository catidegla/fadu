/**
 * A column of four marks, and its binary encoding.
 *
 * Every figure in Fa is built from columns of four positions. Each position
 * carries either one stroke or two, so a column has 2^4 = 16 possible states
 * and a full figure, being two columns, has 2^8 = 256.
 *
 * Marks are written the way the literature writes them: 1 for a single stroke,
 * 2 for a double. That is deliberately not a bit value, because a reader
 * checking this file against a printed table should not have to translate.
 * The bit encoding lives alongside it, where a set bit means a single stroke
 * and the most significant bit is the topmost position.
 */

export const SINGLE = 1;
export const DOUBLE = 2;

export const COLUMN_HEIGHT = 4;
export const COLUMN_STATES = 2 ** COLUMN_HEIGHT; // 16
export const FIGURE_STATES = COLUMN_STATES ** 2; // 256

/**
 * Marks are ordered top to bottom, which is the order they are drawn on the
 * tray and the order they are read.
 *
 * @param {number[]} marks
 * @returns {number} a value in 0..15
 */
export function marksToBits(marks) {
  assertMarks(marks);

  return marks.reduce((bits, mark) => (bits << 1) | (mark === SINGLE ? 1 : 0), 0);
}

/**
 * @param {number} bits a value in 0..15
 * @returns {number[]} four marks, top to bottom
 */
export function bitsToMarks(bits) {
  if (!Number.isInteger(bits) || bits < 0 || bits >= COLUMN_STATES) {
    throw new RangeError(`bits must be an integer in 0..${COLUMN_STATES - 1}, received ${bits}`);
  }

  const marks = [];
  for (let position = COLUMN_HEIGHT - 1; position >= 0; position -= 1) {
    marks.push((bits >> position) & 1 ? SINGLE : DOUBLE);
  }

  return marks;
}

/** Reverse a column top to bottom. Six of the sixteen columns pair off this way. */
export function reverseMarks(marks) {
  assertMarks(marks);
  return [...marks].reverse();
}

/** Swap every single stroke for a double and every double for a single. */
export function complementMarks(marks) {
  assertMarks(marks);
  return marks.map((mark) => (mark === SINGLE ? DOUBLE : SINGLE));
}

export function marksEqual(a, b) {
  return a.length === b.length && a.every((mark, index) => mark === b[index]);
}

function assertMarks(marks) {
  if (!Array.isArray(marks) || marks.length !== COLUMN_HEIGHT) {
    throw new TypeError(`a column is exactly ${COLUMN_HEIGHT} marks, received ${marks?.length}`);
  }

  const bad = marks.findIndex((mark) => mark !== SINGLE && mark !== DOUBLE);
  if (bad !== -1) {
    // Named position, because an off by one in the caller's own array is the
    // usual cause and "invalid marks" would not help anyone find it.
    throw new TypeError(`position ${bad + 1} is ${marks[bad]}, expected ${SINGLE} or ${DOUBLE}`);
  }
}

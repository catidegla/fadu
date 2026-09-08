/**
 * Drawing a figure as text.
 *
 * The two columns are drawn side by side the way they sit on the tray, so the
 * right column appears on the right, even though it is the one cast first.
 */

import { SINGLE } from './marks.mjs';

const GLYPHS = {
  unicode: { stroke: '│', gap: ' ' },
  ascii: { stroke: '|', gap: ' ' },
};

/**
 * @param {import('./sign.mjs').Sign} sign
 * @param {{style?: 'unicode'|'ascii', indent?: string}} [options]
 * @returns {string[]} four lines, top to bottom
 */
export function drawFigure(sign, options = {}) {
  const { stroke } = GLYPHS[options.style ?? 'unicode'] ?? GLYPHS.unicode;
  const indent = options.indent ?? '';

  const cell = (mark) => (mark === SINGLE ? ` ${stroke} ` : `${stroke} ${stroke}`);

  return sign.rows().map(([left, right]) => `${indent}${cell(left)}   ${cell(right)}`);
}

/**
 * Display width, which is not string length.
 *
 * The Yoruba names carry combining marks that take a code point each and no
 * column on screen, so padding by `String.length` leaves a table ragged.
 */
export function displayWidth(text) {
  return String(text).normalize('NFD').replace(/\p{M}/gu, '').length;
}

/** Pad to a display width, for lining up names that carry diacritics. */
export function padTo(text, width) {
  return String(text) + ' '.repeat(Math.max(0, width - displayWidth(text)));
}

/**
 * A one line form for logs and tables: the eight marks in cast order.
 * Right column first, which is the order they were produced.
 */
export function drawCompact(sign) {
  return `${sign.right.marks.join('')}|${sign.left.marks.join('')}`;
}

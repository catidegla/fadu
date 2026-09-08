/**
 * A full figure: two columns of four marks, so one of 256.
 *
 * The right column is cast first and read first. That ordering is not a detail
 * of presentation, it decides the name, so it is the first constructor
 * argument and it is what `right` means everywhere in this file.
 *
 * When both columns carry the same du the sign is a doubling, called Mèdji in
 * Fon and Méjì in Yoruba. There are sixteen of those and 240 mixed signs.
 *
 * No interpretation lives here. A sign knows its figure, its names and its
 * structural relations to other signs, and nothing about what it means.
 */

import { COLUMN_STATES, FIGURE_STATES } from './marks.mjs';
import {
  DU,
  Du,
  du,
  fromBits as duFromBits,
  fromMarks as duFromMarks,
  normalise,
} from './du.mjs';

const DOUBLING = { fon: 'Mèdji', yoruba: 'Méjì' };

export class Sign {
  /**
   * @param {Du} right the column cast and read first
   * @param {Du} left
   */
  constructor(right, left) {
    if (!(right instanceof Du) || !(left instanceof Du)) {
      throw new TypeError('a sign is built from two du');
    }

    this.right = right;
    this.left = left;
    Object.freeze(this);
  }

  /** True when both columns carry the same du. */
  get isMeji() {
    return this.right.rank === this.left.rank;
  }

  /**
   * A stable handle in 0..255, ordered by the documented rank of each column.
   * Ogbe doubled is 0. This is an index, not a seniority ranking: the order in
   * which the 256 are ranked is a matter of lineage and is not encoded here.
   */
  get index() {
    return (this.right.rank - 1) * COLUMN_STATES + (this.left.rank - 1);
  }

  /** The binary figure, right column in the high nibble. */
  get bits() {
    return (this.right.bits << 4) | this.left.bits;
  }

  get fon() {
    return this.isMeji ? `${this.right.fon} ${DOUBLING.fon}` : `${this.right.fon} ${this.left.fon}`;
  }

  get yoruba() {
    return this.isMeji
      ? `${this.right.yoruba} ${DOUBLING.yoruba}`
      : `${this.right.yoruba} ${this.left.yoruba}`;
  }

  /**
   * Rows top to bottom, each `[left, right]`, which is the order they appear
   * on the tray when you look at it.
   */
  rows() {
    return this.left.marks.map((mark, row) => [mark, this.right.marks[row]]);
  }

  /** The same two du with the columns exchanged. */
  swap() {
    return new Sign(this.left, this.right);
  }

  /** Every stroke count swapped, in both columns. */
  complement() {
    return new Sign(this.right.complement(), this.left.complement());
  }

  /** Both columns turned upside down. */
  reverse() {
    return new Sign(this.right.reverse(), this.left.reverse());
  }

  equals(other) {
    return other instanceof Sign && other.index === this.index;
  }

  toString() {
    return this.fon;
  }

  toJSON() {
    return {
      index: this.index,
      bits: this.bits,
      fon: this.fon,
      yoruba: this.yoruba,
      meji: this.isMeji,
      right: this.right.toJSON(),
      left: this.left.toJSON(),
    };
  }
}

/**
 * @param {string|number|Du} right the column cast first
 * @param {string|number|Du} [left] omitted for a doubling
 */
export function sign(right, left) {
  const first = du(right);
  return new Sign(first, left === undefined ? first : du(left));
}

/** @param {number} index a value in 0..255 */
export function fromIndex(index) {
  if (!Number.isInteger(index) || index < 0 || index >= FIGURE_STATES) {
    throw new RangeError(`index must be an integer in 0..${FIGURE_STATES - 1}, received ${index}`);
  }

  return new Sign(
    DU[Math.floor(index / COLUMN_STATES)],
    DU[index % COLUMN_STATES],
  );
}

/** @param {number} bits a value in 0..255, right column in the high nibble */
export function fromBits(bits) {
  if (!Number.isInteger(bits) || bits < 0 || bits >= FIGURE_STATES) {
    throw new RangeError(`bits must be an integer in 0..${FIGURE_STATES - 1}, received ${bits}`);
  }

  return new Sign(duFromBits(bits >> 4), duFromBits(bits & 0b1111));
}

/**
 * Build a sign from eight marks in cast order: the four of the right column
 * first, then the four of the left.
 */
export function fromMarks(marks) {
  if (!Array.isArray(marks) || marks.length !== 8) {
    throw new TypeError(`a figure is exactly 8 marks, received ${marks?.length}`);
  }

  return new Sign(duFromMarks(marks.slice(0, 4)), duFromMarks(marks.slice(4)));
}

/**
 * Parse a name in either language. One name means a doubling, two names mean
 * the right column then the left, which is the order they are cast.
 */
export function parse(name) {
  const text = String(name).trim();
  if (!text) throw new RangeError('no sign named');

  const parts = text.split(/[\s-]+/).filter(Boolean);
  const doubling = new Set(['meji', 'medji', 'mejii']);
  const names = parts.filter((part) => !doubling.has(normalise(part)));

  if (names.length === 1) return sign(names[0]);
  if (names.length === 2) return sign(names[0], names[1]);

  throw new RangeError(`"${name}" does not name one or two du`);
}

/** All 256, in index order. */
export const SIGNS = Object.freeze(Array.from({ length: FIGURE_STATES }, (_, i) => fromIndex(i)));

/** The sixteen doublings, in rank order. */
export const MEJI = Object.freeze(SIGNS.filter((s) => s.isMeji));

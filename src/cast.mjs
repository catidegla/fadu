/**
 * Casting, and reading a cast that already happened.
 *
 * Two instruments produce a figure. The sixteen palm nuts, ikin, are worked
 * in eight passes. The chain, called opele in Yoruba and agumaga in Fon, has
 * eight pods on two arms and gives the whole figure in a single throw. Either
 * way the right column is produced first, so the first four values in every
 * array here belong to the right column, top to bottom.
 *
 * The ikin rule is the one that surprises people, and it is inverted from what
 * you would guess: one nut left in the hand means a double stroke, two nuts
 * left means a single stroke. It is written out as a constant below so that a
 * refactor cannot quietly flip it.
 *
 * Each pass is modelled as a fair binary outcome. Real nuts in a real hand are
 * not perfectly fair, and this library does not pretend to model a grip.
 */

import { randomInt } from 'node:crypto';

import { DOUBLE, SINGLE } from './marks.mjs';
import { fromMarks } from './sign.mjs';

export const FIGURE_MARKS = 8;

/** One nut left means two strokes, two nuts left means one. */
const IKIN_REMAINDER_TO_MARK = { 1: DOUBLE, 2: SINGLE };

/**
 * Which face of a pod means which stroke.
 *
 * Lineages differ on this and the sources that describe the chain carefully
 * often decline to fix it in print, so it is an option rather than a constant.
 * Nothing structural rides on the choice: swapping it relabels every throw and
 * leaves the 256 signs, and the distribution over them, exactly as they were.
 */
export const OPELE_CONVENTIONS = Object.freeze({
  'open-single': { open: SINGLE, closed: DOUBLE },
  'open-double': { open: DOUBLE, closed: SINGLE },
});

const DEFAULT_OPELE_CONVENTION = 'open-single';

/** Uniform in [0, 1), drawn from the platform CSPRNG rather than Math.random. */
export function secureRandom() {
  return randomInt(0, 2 ** 32) / 2 ** 32;
}

/**
 * Read a figure from eight recorded ikin passes.
 *
 * @param {number[]} remainders how many nuts stayed in the hand, one per pass,
 *   right column first, top to bottom. Each is 1 or 2.
 */
export function readIkin(remainders) {
  assertLength(remainders, 'pass');

  const marks = remainders.map((remaining, index) => {
    const mark = IKIN_REMAINDER_TO_MARK[remaining];

    if (mark === undefined) {
      // A grab that leaves none, or three or more, is not a result; the pass is
      // taken again. Accepting it silently would invent a figure nobody cast.
      throw new RangeError(
        `pass ${index + 1} left ${remaining} nuts, which is not a result. A pass leaves 1 or 2.`,
      );
    }

    return mark;
  });

  return fromMarks(marks);
}

/**
 * Read a figure from a single throw of the chain.
 *
 * @param {Array<'open'|'closed'|'o'|'c'>} faces one per pod, right arm first,
 *   top to bottom.
 * @param {{convention?: keyof OPELE_CONVENTIONS}} [options]
 */
export function readOpele(faces, options = {}) {
  assertLength(faces, 'pod');

  const name = options.convention ?? DEFAULT_OPELE_CONVENTION;
  const convention = OPELE_CONVENTIONS[name];

  if (!convention) {
    throw new RangeError(
      `unknown convention "${name}", expected one of ${Object.keys(OPELE_CONVENTIONS).join(', ')}`,
    );
  }

  const marks = faces.map((face, index) => {
    const key = String(face).toLowerCase();
    const mark = key === 'open' || key === 'o'
      ? convention.open
      : key === 'closed' || key === 'c'
        ? convention.closed
        : undefined;

    if (mark === undefined) {
      throw new RangeError(`pod ${index + 1} is "${face}", expected "open" or "closed"`);
    }

    return mark;
  });

  return fromMarks(marks);
}

/**
 * Work the nuts eight times.
 *
 * @param {{random?: () => number}} [options] `random` returns a float in [0, 1)
 *   and defaults to the CSPRNG. Pass your own to make a cast reproducible.
 * @returns {{sign: import('./sign.mjs').Sign, remainders: number[]}}
 */
export function castIkin(options = {}) {
  const random = options.random ?? secureRandom;
  const remainders = Array.from({ length: FIGURE_MARKS }, () => (random() < 0.5 ? 1 : 2));

  return { sign: readIkin(remainders), remainders };
}

/**
 * Throw the chain once.
 *
 * @returns {{sign: import('./sign.mjs').Sign, faces: string[]}}
 */
export function castOpele(options = {}) {
  const random = options.random ?? secureRandom;
  const faces = Array.from({ length: FIGURE_MARKS }, () => (random() < 0.5 ? 'open' : 'closed'));

  return { sign: readOpele(faces, options), faces };
}

function assertLength(values, unit) {
  if (!Array.isArray(values) || values.length !== FIGURE_MARKS) {
    throw new TypeError(
      `a figure takes ${FIGURE_MARKS} ${unit} values, right column first, received ${values?.length}`,
    );
  }
}

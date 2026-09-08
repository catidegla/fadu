import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FIGURE_MARKS,
  OPELE_CONVENTIONS,
  castIkin,
  castOpele,
  readIkin,
  readOpele,
  secureRandom,
} from '../src/cast.mjs';
import { DU } from '../src/du.mjs';
import { SIGNS, fromBits } from '../src/sign.mjs';

/** The eight values, right column first, that encode a given figure. */
function facesFor(bits) {
  return Array.from({ length: FIGURE_MARKS }, (_, i) => (((bits >> (7 - i)) & 1) ? 'open' : 'closed'));
}

function remaindersFor(bits) {
  // A single stroke is two nuts left, a double stroke is one.
  return Array.from({ length: FIGURE_MARKS }, (_, i) => (((bits >> (7 - i)) & 1) ? 2 : 1));
}

test('one nut left is a double stroke and two nuts left is a single', () => {
  // Inverted from what everyone guesses, and the single most copied error in
  // descriptions of the procedure. Asserted in both directions so a refactor
  // cannot quietly flip it.
  assert.equal(readIkin([1, 1, 1, 1, 1, 1, 1, 1]).fon, 'Yèku Mèdji');
  assert.equal(readIkin([2, 2, 2, 2, 2, 2, 2, 2]).fon, 'Gbé Mèdji');
  assert.deepEqual(readIkin([1, 1, 1, 1, 2, 2, 2, 2]).right.marks, [2, 2, 2, 2]);
  assert.deepEqual(readIkin([1, 1, 1, 1, 2, 2, 2, 2]).left.marks, [1, 1, 1, 1]);
});

test('eight ikin passes reach all 256 signs and nothing else', () => {
  const reached = new Set();

  for (let bits = 0; bits < 256; bits += 1) {
    const figure = readIkin(remaindersFor(bits));
    assert.equal(figure.bits, bits);
    reached.add(figure.index);
  }

  assert.equal(reached.size, 256);
});

test('one throw of the chain reaches all 256 signs', () => {
  const reached = new Set();

  for (let bits = 0; bits < 256; bits += 1) {
    const figure = readOpele(facesFor(bits));
    assert.equal(figure.bits, bits);
    reached.add(figure.index);
  }

  assert.equal(reached.size, 256);
});

test('the first four values are the right column, which is cast first', () => {
  const figure = readOpele(['open', 'open', 'open', 'open', 'closed', 'closed', 'closed', 'closed']);

  assert.equal(figure.right.fon, 'Gbé');
  assert.equal(figure.left.fon, 'Yèku');
});

test('switching the pod convention complements the sign and nothing more', () => {
  // Which face means which stroke varies by lineage. It relabels every throw
  // and leaves the structure untouched, which is why it is an option.
  for (let bits = 0; bits < 256; bits += 1) {
    const faces = facesFor(bits);
    const asSingle = readOpele(faces, { convention: 'open-single' });
    const asDouble = readOpele(faces, { convention: 'open-double' });

    assert.equal(asDouble.index, asSingle.complement().index);
  }
});

test('both conventions cover the same 256 signs', () => {
  for (const convention of Object.keys(OPELE_CONVENTIONS)) {
    const reached = new Set(
      Array.from({ length: 256 }, (_, bits) => readOpele(facesFor(bits), { convention }).index),
    );

    assert.equal(reached.size, 256, convention);
  }
});

test('an impossible number of nuts is refused, and the pass is named', () => {
  // A grab leaving none, or three, is not a result. The pass is taken again.
  // Accepting it would invent a figure nobody cast.
  assert.throws(() => readIkin([1, 1, 3, 1, 1, 1, 1, 1]), /pass 3 left 3 nuts/);
  assert.throws(() => readIkin([0, 1, 1, 1, 1, 1, 1, 1]), /pass 1 left 0 nuts/);
  assert.throws(() => readIkin([1, 1, 1, 1, 1, 1, 1, 1.5]), /pass 8/);
});

test('a pod that is neither face is refused, and the pod is named', () => {
  assert.throws(() => readOpele(['open', 'sideways', 'o', 'o', 'c', 'c', 'c', 'c']), /pod 2 is "sideways"/);
});

test('a figure of the wrong length is refused rather than padded', () => {
  assert.throws(() => readIkin([1, 1, 1, 1]), /8 pass values/);
  assert.throws(() => readOpele(['o', 'o', 'o', 'o']), /8 pod values/);
  assert.throws(() => readIkin('11112222'), /8 pass values/);
});

test('an unknown convention is refused rather than falling back', () => {
  assert.throws(() => readOpele(facesFor(0), { convention: 'whatever' }), /unknown convention/);
});

test('short and long forms of a pod face both work', () => {
  assert.equal(
    readOpele(['o', 'o', 'o', 'o', 'c', 'c', 'c', 'c']).index,
    readOpele(['open', 'OPEN', 'Open', 'open', 'closed', 'Closed', 'CLOSED', 'c']).index,
  );
});

test('a cast reports working that reads back to the same sign', () => {
  for (let trial = 0; trial < 200; trial += 1) {
    const nuts = castIkin();
    assert.equal(readIkin(nuts.remainders).index, nuts.sign.index);

    const chain = castOpele();
    assert.equal(readOpele(chain.faces).index, chain.sign.index);
  }
});

test('a supplied source of randomness makes a cast reproducible', () => {
  const draws = [0.1, 0.9, 0.1, 0.9, 0.9, 0.1, 0.9, 0.1];
  const replay = () => { let i = 0; return () => draws[i++]; };

  const first = castIkin({ random: replay() });
  const second = castIkin({ random: replay() });

  assert.equal(first.sign.index, second.sign.index);
  assert.deepEqual(first.remainders, second.remainders);
});

test('casting spreads across all sixteen du in both columns', () => {
  const right = new Map();
  const left = new Map();
  const trials = 4000;

  for (let i = 0; i < trials; i += 1) {
    const { sign: figure } = castOpele();
    right.set(figure.right.rank, (right.get(figure.right.rank) ?? 0) + 1);
    left.set(figure.left.rank, (left.get(figure.left.rank) ?? 0) + 1);
  }

  assert.equal(right.size, 16);
  assert.equal(left.size, 16);

  // Expected 250 of 4000 for each. The bounds are wide enough never to flake
  // and narrow enough to catch a stuck position or a biased draw.
  for (const figure of DU) {
    assert.ok(right.get(figure.rank) > 120, `right column ${figure.fon} appeared ${right.get(figure.rank)} times`);
    assert.ok(right.get(figure.rank) < 420, `right column ${figure.fon} appeared ${right.get(figure.rank)} times`);
  }
});

test('the default source of randomness is not Math.random', () => {
  // A divination library reaching for Math.random would be a poor look, and
  // the platform CSPRNG costs nothing here.
  const value = secureRandom();

  assert.ok(value >= 0 && value < 1);
  assert.equal(new Set(Array.from({ length: 50 }, secureRandom)).size, 50);
});

test('every sign is reachable by reading a cast, not only by naming one', () => {
  const byReading = new Set(Array.from({ length: 256 }, (_, b) => readOpele(facesFor(b)).index));
  assert.deepEqual([...byReading].sort((a, b) => a - b), SIGNS.map((s) => s.index));
  assert.equal(fromBits(0).fon, 'Yèku Mèdji');
});

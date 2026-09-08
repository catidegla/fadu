import test from 'node:test';
import assert from 'node:assert/strict';

import {
  COLUMN_HEIGHT,
  COLUMN_STATES,
  DOUBLE,
  FIGURE_STATES,
  SINGLE,
  bitsToMarks,
  complementMarks,
  marksEqual,
  marksToBits,
  reverseMarks,
} from '../src/marks.mjs';

test('a column is four positions and a figure is two columns', () => {
  assert.equal(COLUMN_HEIGHT, 4);
  assert.equal(COLUMN_STATES, 16);
  assert.equal(FIGURE_STATES, 256);
});

test('every one of the sixteen column states round trips through bits', () => {
  for (let bits = 0; bits < COLUMN_STATES; bits += 1) {
    assert.equal(marksToBits(bitsToMarks(bits)), bits);
  }
});

test('marks are read top to bottom, so the first mark is the high bit', () => {
  assert.equal(marksToBits([SINGLE, DOUBLE, DOUBLE, DOUBLE]), 0b1000);
  assert.equal(marksToBits([DOUBLE, DOUBLE, DOUBLE, SINGLE]), 0b0001);
});

test('reversing twice returns the original', () => {
  for (let bits = 0; bits < COLUMN_STATES; bits += 1) {
    const marks = bitsToMarks(bits);
    assert.ok(marksEqual(reverseMarks(reverseMarks(marks)), marks));
  }
});

test('complementing twice returns the original, and never returns the original once', () => {
  for (let bits = 0; bits < COLUMN_STATES; bits += 1) {
    const marks = bitsToMarks(bits);

    assert.ok(marksEqual(complementMarks(complementMarks(marks)), marks));
    // Four positions cannot all differ from themselves, so a complement is
    // always a different column. There are eight complementary pairs.
    assert.ok(!marksEqual(complementMarks(marks), marks));
  }
});

test('a column of the wrong height is refused', () => {
  assert.throws(() => marksToBits([SINGLE, SINGLE, SINGLE]), /exactly 4 marks/);
  assert.throws(() => marksToBits([1, 1, 1, 1, 1]), /exactly 4 marks/);
});

test('an impossible mark names the position it is in', () => {
  // "invalid marks" would not help anyone find an off by one in their array.
  assert.throws(() => marksToBits([SINGLE, 3, SINGLE, SINGLE]), /position 2 is 3/);
  assert.throws(() => marksToBits([SINGLE, SINGLE, 0, DOUBLE]), /position 3 is 0/);
});

test('bits outside a column are refused rather than truncated', () => {
  assert.throws(() => bitsToMarks(16), /0\.\.15/);
  assert.throws(() => bitsToMarks(-1), /0\.\.15/);
  assert.throws(() => bitsToMarks(1.5), /0\.\.15/);
});

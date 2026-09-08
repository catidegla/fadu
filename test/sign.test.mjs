import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MEJI,
  SIGNS,
  Sign,
  fromBits,
  fromIndex,
  fromMarks,
  parse,
  sign,
} from '../src/sign.mjs';
import { FIGURE_STATES } from '../src/marks.mjs';
import { du } from '../src/du.mjs';

test('two columns of sixteen give 256 signs, all distinct', () => {
  assert.equal(SIGNS.length, FIGURE_STATES);
  assert.equal(new Set(SIGNS.map((s) => s.index)).size, FIGURE_STATES);
  assert.equal(new Set(SIGNS.map((s) => s.bits)).size, FIGURE_STATES);
  assert.equal(new Set(SIGNS.map((s) => s.fon)).size, FIGURE_STATES);
  assert.equal(new Set(SIGNS.map((s) => s.yoruba)).size, FIGURE_STATES);
});

test('index and bits both round trip across all 256', () => {
  for (const original of SIGNS) {
    assert.equal(fromIndex(original.index).index, original.index);
    assert.equal(fromBits(original.bits).index, original.index);
  }
});

test('a sign round trips through its eight marks in cast order', () => {
  for (const original of SIGNS) {
    const marks = [...original.right.marks, ...original.left.marks];
    assert.equal(fromMarks(marks).index, original.index);
  }
});

test('sixteen of the 256 are doublings', () => {
  assert.equal(MEJI.length, 16);
  assert.equal(SIGNS.filter((s) => s.isMeji).length, 16);
  assert.equal(SIGNS.filter((s) => !s.isMeji).length, 240);
});

test('a doubling is named for its du, a mixed sign for both', () => {
  assert.equal(sign('Gbé').fon, 'Gbé Mèdji');
  assert.equal(sign('Gbé').yoruba, 'Ogbè Méjì');
  assert.equal(sign('Gbé', 'Yèku').fon, 'Gbé Yèku');
  assert.equal(sign('Gbé', 'Yèku').yoruba, 'Ogbè Ọ̀yẹ̀kú');
});

test('the right column is cast first and so is named first', () => {
  // Order is not cosmetic: these are two different signs.
  const one = sign('Gbé', 'Yèku');
  const other = sign('Yèku', 'Gbé');

  assert.equal(one.right.fon, 'Gbé');
  assert.notEqual(one.index, other.index);
  assert.equal(one.swap().index, other.index);
});

test('the doubling of the first du is index zero', () => {
  assert.equal(sign('Gbé').index, 0);
  assert.equal(fromIndex(0).fon, 'Gbé Mèdji');
  assert.equal(fromIndex(FIGURE_STATES - 1).fon, 'Fu Mèdji');
});

test('rows are drawn left column first, because that is how the tray reads', () => {
  const figure = sign('Gbé', 'Yèku');

  // Right is Gbe, all single. Left is Yeku, all double. On the tray the left
  // column is on the left, whichever was cast first.
  assert.deepEqual(figure.rows(), [[2, 1], [2, 1], [2, 1], [2, 1]]);
});

test('swapping, reversing and complementing are all their own inverse', () => {
  for (const original of SIGNS) {
    assert.equal(original.swap().swap().index, original.index);
    assert.equal(original.reverse().reverse().index, original.index);
    assert.equal(original.complement().complement().index, original.index);
  }
});

test('a doubling stays a doubling under every relation', () => {
  for (const meji of MEJI) {
    assert.ok(meji.swap().isMeji);
    assert.ok(meji.reverse().isMeji);
    assert.ok(meji.complement().isMeji);
  }
});

test('names parse back to the sign they came from, in both languages', () => {
  for (const original of SIGNS) {
    assert.equal(parse(original.fon).index, original.index, original.fon);
    assert.equal(parse(original.yoruba).index, original.index, original.yoruba);
  }
});

test('parsing tolerates how people actually type', () => {
  const meji = sign('Òtúrá');

  for (const name of ['Otura Meji', 'otura meji', 'Otura-Meji', 'Tula Medji', '  Tula  ']) {
    assert.equal(parse(name).index, meji.index, `parsing "${name}"`);
  }
});

test('a name that is not one or two du is refused', () => {
  assert.throws(() => parse('Gbe Yeku Woli'), /does not name one or two du/);
  assert.throws(() => parse(''), /no sign named/);
  assert.throws(() => parse('Nonsense'), /unknown du/);
});

test('an index or bit value off the end is refused rather than wrapped', () => {
  assert.throws(() => fromIndex(256), /0\.\.255/);
  assert.throws(() => fromIndex(-1), /0\.\.255/);
  assert.throws(() => fromBits(256), /0\.\.255/);
  assert.throws(() => fromMarks([1, 1, 1, 1]), /exactly 8 marks/);
});

test('a sign cannot be built from something that is not a du', () => {
  assert.throws(() => new Sign('Gbé', du('Yèku')), /two du/);
  assert.throws(() => new Sign(du('Gbé'), null), /two du/);
});

test('equality compares the figure, not the object', () => {
  assert.ok(sign('Gbé', 'Yèku').equals(fromIndex(1)));
  assert.ok(!sign('Gbé', 'Yèku').equals(sign('Yèku', 'Gbé')));
  assert.ok(!sign('Gbé').equals('Gbé Mèdji'));
});

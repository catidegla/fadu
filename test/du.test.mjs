import test from 'node:test';
import assert from 'node:assert/strict';

import { DU, du, fromBits, fromMarks, fromRank, normalise } from '../src/du.mjs';
import { COLUMN_STATES, marksEqual } from '../src/marks.mjs';

test('there are sixteen du and their figures cover every column state exactly once', () => {
  // This is the whole claim of the system: four positions of one or two
  // strokes give sixteen figures, and the sixteen du are those figures.
  assert.equal(DU.length, COLUMN_STATES);

  const bits = DU.map((figure) => figure.bits).sort((a, b) => a - b);
  assert.deepEqual(bits, Array.from({ length: COLUMN_STATES }, (_, i) => i));
});

test('the figures match the published table', () => {
  // Transcribed from the Ifa article's two tables, which agree with each other.
  // If someone edits the table above, this fails rather than shipping quietly.
  const expected = {
    Gbé: '1111', Yèku: '2222', Woli: '2112', Di: '1221',
    Loso: '1122', Wlin: '2211', Abla: '1222', Aklan: '2221',
    Guda: '1112', Sa: '2111', Ka: '2122', Trukpen: '2212',
    Tula: '1211', Lete: '1121', Tché: '1212', Fu: '2121',
  };

  assert.equal(Object.keys(expected).length, COLUMN_STATES);

  for (const figure of DU) {
    assert.equal(figure.marks.join(''), expected[figure.fon], `${figure.fon} figure`);
  }
});

test('Sa and Trukpen are not swapped', () => {
  // Two widely copied listings have these the other way round. Ogunda reversed
  // is Osa, and Ika reversed is Oturupon; the swap breaks both relations.
  assert.equal(du('Sa').marks.join(''), '2111');
  assert.equal(du('Trukpen').marks.join(''), '2212');
  assert.equal(du('Guda').reverse().fon, 'Sa');
  assert.equal(du('Ka').reverse().fon, 'Trukpen');
});

test('ranks run one to sixteen with no gaps', () => {
  assert.deepEqual(DU.map((f) => f.rank), Array.from({ length: COLUMN_STATES }, (_, i) => i + 1));
});

test('four du read the same upside down, and the other twelve pair off', () => {
  const palindromes = DU.filter((figure) => figure.isPalindrome);

  assert.deepEqual(palindromes.map((f) => f.fon), ['Gbé', 'Yèku', 'Woli', 'Di']);
  assert.equal((DU.length - palindromes.length) / 2, 6);

  for (const figure of DU) {
    assert.equal(figure.reverse().reverse().rank, figure.rank);
  }
});

test('complementing pairs all sixteen off, leaving nothing fixed', () => {
  const pairs = new Set();

  for (const figure of DU) {
    assert.notEqual(figure.complement().rank, figure.rank);
    assert.equal(figure.complement().complement().rank, figure.rank);
    pairs.add([figure.rank, figure.complement().rank].sort((a, b) => a - b).join('-'));
  }

  assert.equal(pairs.size, 8);
});

test('Gbe and Yeku are the extremes, and each other complement', () => {
  assert.ok(du('Gbé').marks.every((mark) => mark === 1));
  assert.ok(du('Yèku').marks.every((mark) => mark === 2));
  assert.equal(du('Gbé').complement().fon, 'Yèku');
});

test('a du is found by either language, with or without diacritics', () => {
  const yeku = du('Yèku');

  for (const name of ['Yèku', 'Yeku', 'yeku', 'Ọ̀yẹ̀kú', 'Oyeku', 'OYEKU', 'Oyeku Meji']) {
    assert.equal(du(name).rank, yeku.rank, `looking up "${name}"`);
  }
});

test('spelling variants from the sources resolve', () => {
  assert.equal(du('Wenlen').fon, 'Wlin');
  assert.equal(du('Trukpin').fon, 'Trukpen');
  assert.equal(du('Losso').fon, 'Loso');
  assert.equal(du('Orangun').fon, 'Fu');
  assert.equal(du('Ejiogbe').fon, 'Gbé');
});

test('a du is found by rank, marks or bits', () => {
  assert.equal(fromRank(1).fon, 'Gbé');
  assert.equal(fromMarks([2, 2, 2, 2]).fon, 'Yèku');
  assert.equal(fromBits(0).fon, 'Yèku');
  assert.equal(du(10).fon, 'Sa');
});

test('an unknown name is refused rather than guessed at', () => {
  assert.throws(() => du('Ogbede'), /unknown du/);
  assert.throws(() => fromRank(17), /1\.\.16/);
  assert.throws(() => fromRank(0), /1\.\.16/);
});

test('a du is immutable, so a caller cannot corrupt the shared table', () => {
  const figure = du('Gbé');

  assert.throws(() => { figure.marks[0] = 2; }, TypeError);
  assert.throws(() => { figure.rank = 99; }, TypeError);
  assert.ok(marksEqual(du('Gbé').marks, [1, 1, 1, 1]));
});

test('normalising strips diacritics and punctuation', () => {
  assert.equal(normalise('Ọ̀ṣẹ́'), 'ose');
  assert.equal(normalise('Eji Ogbe'), 'ejiogbe');
});

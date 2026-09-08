import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { duTable, signTable } from '../scripts/build-data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const read = async (name) => JSON.parse(await readFile(join(ROOT, 'data', name), 'utf8'));

test('the published du table matches the source of truth', async () => {
  // The JSON is for callers who are not writing JavaScript. If it drifts from
  // src/du.mjs they get quietly different data from everyone else.
  assert.deepEqual(await read('du.json'), duTable());
});

test('the published sign table matches the source of truth', async () => {
  assert.deepEqual(await read('signs.json'), signTable());
});

test('the published tables are the right shape for an outside consumer', async () => {
  const du = await read('du.json');
  const signs = await read('signs.json');

  assert.equal(du.length, 16);
  assert.equal(signs.length, 256);

  for (const row of du) {
    assert.match(row.marks.join(''), /^[12]{4}$/);
    assert.ok(row.fon && row.yoruba);
    assert.ok(row.reverse >= 1 && row.reverse <= 16);
    assert.ok(row.complement >= 1 && row.complement <= 16);
  }

  assert.equal(signs.filter((row) => row.meji).length, 16);
  assert.deepEqual(signs.map((row) => row.index), signs.map((_, i) => i));
});

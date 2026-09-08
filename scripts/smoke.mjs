/**
 * The smallest exercise of the public surface, for checking the oldest Node
 * this package claims to support. The test runner needs a newer Node than the
 * library does, so the floor is verified here instead of being asserted in
 * package.json and hoped for.
 */

import assert from 'node:assert/strict';

import { DU, SIGNS, castOpele, drawFigure, parse, readIkin, sign } from '../src/index.mjs';

assert.equal(DU.length, 16);
assert.equal(SIGNS.length, 256);
assert.equal(sign('Gbé', 'Yèku').fon, 'Gbé Yèku');
assert.equal(parse('Ogbe Meji').index, 0);
assert.equal(readIkin([2, 2, 2, 2, 1, 1, 1, 1]).fon, 'Gbé Yèku');
assert.equal(drawFigure(sign('Gbé')).length, 4);
assert.ok(castOpele().sign.index >= 0);

console.log(`ok on node ${process.version}`);

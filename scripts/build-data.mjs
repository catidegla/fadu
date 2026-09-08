/**
 * Write the tables out as JSON, so the data is usable from anything that is
 * not JavaScript. `src/du.mjs` is the source of truth; a test fails if these
 * files drift from it.
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { DU, SIGNS, drawCompact } from '../src/index.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function duTable() {
  return DU.map((figure) => ({
    ...figure.toJSON(),
    aliases: [...figure.aliases],
    palindrome: figure.isPalindrome,
    reverse: figure.reverse().rank,
    complement: figure.complement().rank,
  }));
}

export function signTable() {
  return SIGNS.map((sign) => ({
    index: sign.index,
    bits: sign.bits,
    fon: sign.fon,
    yoruba: sign.yoruba,
    meji: sign.isMeji,
    right: sign.right.rank,
    left: sign.left.rank,
    figure: drawCompact(sign),
  }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await writeFile(join(ROOT, 'data', 'du.json'), `${JSON.stringify(duTable(), null, 2)}\n`);
  await writeFile(join(ROOT, 'data', 'signs.json'), `${JSON.stringify(signTable(), null, 2)}\n`);
  console.log(`wrote ${DU.length} du and ${SIGNS.length} signs`);
}

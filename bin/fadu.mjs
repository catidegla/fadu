#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  DU,
  OPELE_CONVENTIONS,
  castIkin,
  castOpele,
  drawCompact,
  drawFigure,
  padTo,
  parse,
  readIkin,
  readOpele,
} from '../src/index.mjs';

const USAGE = `
  fadu   the sixteen du, the 256 signs, and how a figure is cast

  fadu cast [--ikin|--opele]     cast a figure
  fadu show <name...>            draw a sign by name, in either language
  fadu list                      the sixteen principal du
  fadu read --ikin 2,1,1,2,...   read eight recorded ikin passes
  fadu read --opele o,c,o,...    read one throw of the chain

  --json        machine readable output
  --ascii       draw with | instead of box characters
  --convention  opele face mapping: ${Object.keys(OPELE_CONVENTIONS).join(' | ')}

  Marks run top to bottom and the right column is cast first, so it comes
  first in every list of eight.
`;

async function version() {
  const here = dirname(fileURLToPath(import.meta.url));
  const { version } = JSON.parse(await readFile(join(here, '..', 'package.json'), 'utf8'));
  return version;
}

function flags(argv) {
  const options = { json: false, style: 'unicode' };
  const rest = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--json') options.json = true;
    else if (arg === '--ascii') options.style = 'ascii';
    else if (arg === '--ikin') options.instrument = 'ikin';
    else if (arg === '--opele') options.instrument = 'opele';
    else if (arg === '--convention') options.convention = argv[++i];
    else if (arg.startsWith('--')) throw new UsageError(`unknown option ${arg}`);
    else rest.push(arg);
  }

  return { options, rest };
}

class UsageError extends Error {}

function present(sign, options, working) {
  if (options.json) {
    return JSON.stringify({ ...sign.toJSON(), figure: drawCompact(sign), ...working }, null, 2);
  }

  const lines = [
    '',
    `  ${sign.fon}`,
    `  ${sign.yoruba}`,
    '',
    ...drawFigure(sign, { style: options.style, indent: '  ' }),
    '',
    `  ${drawCompact(sign)}   ${sign.isMeji ? 'a doubling' : 'mixed'}, index ${sign.index} of 255`,
  ];

  if (working?.remainders) lines.push(`  nuts left, in order: ${working.remainders.join(' ')}`);
  if (working?.faces) lines.push(`  pods, in order: ${working.faces.map((f) => f[0]).join(' ')}`);

  lines.push('');
  return lines.join('\n');
}

function eight(value, what) {
  if (!value) throw new UsageError(`--${what} needs eight comma separated values`);
  return value.split(',').map((part) => part.trim());
}

async function main(argv) {
  if (argv.includes('--version') || argv.includes('-v')) return console.log(await version());
  if (argv.includes('--help') || argv.includes('-h') || argv.length === 0) return console.log(USAGE);

  const { options, rest } = flags(argv);
  const [command, ...args] = rest;

  if (command === 'cast') {
    const instrument = options.instrument ?? 'opele';
    const { sign, ...working } = instrument === 'ikin' ? castIkin() : castOpele(options);
    return console.log(present(sign, options, working));
  }

  if (command === 'show') {
    if (args.length === 0) throw new UsageError('show needs the name of a sign');
    return console.log(present(parse(args.join(' ')), options));
  }

  if (command === 'read') {
    if (options.instrument === 'ikin') {
      const passes = eight(args[0], 'ikin').map(Number);
      return console.log(present(readIkin(passes), options, { remainders: passes }));
    }

    if (options.instrument === 'opele') {
      const faces = eight(args[0], 'opele');
      return console.log(present(readOpele(faces, options), options, { faces }));
    }

    throw new UsageError('read needs --ikin or --opele');
  }

  if (command === 'list') {
    if (options.json) return console.log(JSON.stringify(DU, null, 2));

    console.log('');
    console.log('   #  Fon        Yoruba        figure');
    console.log('   --------------------------------------');
    for (const figure of DU) {
      console.log(
        `  ${String(figure.rank).padStart(2)}  ${padTo(figure.fon, 10)} ${padTo(figure.yoruba, 13)} ${figure.marks.join('')}`,
      );
    }
    return console.log('');
  }

  throw new UsageError(`unknown command "${command}"`);
}

main(process.argv.slice(2)).catch((error) => {
  const usage = error instanceof UsageError;
  console.error(`  ${error.message}`);
  if (usage) console.error(USAGE);
  process.exit(2);
});

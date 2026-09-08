import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const run = promisify(execFile);
const CLI = join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'fadu.mjs');

async function cli(...args) {
  try {
    const { stdout, stderr } = await run(process.execPath, [CLI, ...args]);
    return { code: 0, stdout, stderr };
  } catch (error) {
    return { code: error.code ?? 1, stdout: error.stdout ?? '', stderr: error.stderr ?? '' };
  }
}

test('list prints all sixteen du with their figures', async () => {
  const { code, stdout } = await cli('list');

  assert.equal(code, 0);
  assert.equal(stdout.match(/^ +\d+ +\S/gm).length, 16);
  assert.match(stdout, /Trukpen/);
  assert.match(stdout, /2212/);
});

test('list as json is the published table', async () => {
  const { stdout } = await cli('list', '--json');
  const rows = JSON.parse(stdout);

  assert.equal(rows.length, 16);
  assert.equal(rows[0].fon, 'Gbé');
});

test('show draws a named sign in both languages', async () => {
  const { code, stdout } = await cli('show', 'Ogbe', 'Oyeku');

  assert.equal(code, 0);
  assert.match(stdout, /Gbé Yèku/);
  assert.match(stdout, /Ogbè/);
  assert.match(stdout, /1111\|2222/);
});

test('show accepts a doubling named once', async () => {
  const { stdout } = await cli('show', 'Otura Meji', '--json');
  const figure = JSON.parse(stdout);

  assert.equal(figure.meji, true);
  assert.equal(figure.fon, 'Tula Mèdji');
});

test('a cast produces a real sign and shows its working', async () => {
  const { code, stdout } = await cli('cast', '--json');
  const figure = JSON.parse(stdout);

  assert.equal(code, 0);
  assert.ok(figure.index >= 0 && figure.index < 256);
  assert.equal(figure.faces.length, 8);
  assert.match(figure.figure, /^[12]{4}\|[12]{4}$/);
});

test('a cast with the nuts reports the nuts, not the pods', async () => {
  const { stdout } = await cli('cast', '--ikin', '--json');
  const figure = JSON.parse(stdout);

  assert.equal(figure.remainders.length, 8);
  assert.ok(figure.remainders.every((n) => n === 1 || n === 2));
  assert.equal(figure.faces, undefined);
});

test('read turns a recorded cast into a sign', async () => {
  const nuts = await cli('read', '--ikin', '2,2,2,2,1,1,1,1', '--json');
  const chain = await cli('read', '--opele', 'o,o,o,o,c,c,c,c', '--json');

  assert.equal(JSON.parse(nuts.stdout).fon, 'Gbé Yèku');
  assert.equal(JSON.parse(chain.stdout).fon, 'Gbé Yèku');
});

test('read honours the pod convention', async () => {
  const { stdout } = await cli('read', '--opele', 'o,o,o,o,c,c,c,c', '--convention', 'open-double', '--json');

  assert.equal(JSON.parse(stdout).fon, 'Yèku Gbé');
});

test('a bad cast is refused with a usage exit code, not a stack trace', async () => {
  const short = await cli('read', '--ikin', '2,2,2');
  const impossible = await cli('read', '--ikin', '2,2,2,2,3,1,1,1');

  assert.equal(short.code, 2);
  assert.equal(impossible.code, 2);
  assert.match(impossible.stderr, /pass 5 left 3 nuts/);
  assert.doesNotMatch(impossible.stderr, /at .*\.mjs:\d+/);
});

test('an unknown command or option exits two and says so', async () => {
  const command = await cli('divine');
  const option = await cli('list', '--sideways');

  assert.equal(command.code, 2);
  assert.match(command.stderr, /unknown command "divine"/);
  assert.equal(option.code, 2);
  assert.match(option.stderr, /unknown option --sideways/);
});

test('version prints a version and not the usage', async () => {
  const { code, stdout } = await cli('--version');

  assert.equal(code, 0);
  assert.match(stdout.trim(), /^\d+\.\d+\.\d+$/);
});

test('no arguments prints usage and succeeds', async () => {
  const { code, stdout } = await cli();

  assert.equal(code, 0);
  assert.match(stdout, /fadu cast/);
});

test('ascii drawing avoids box characters for terminals that lack them', async () => {
  const { stdout } = await cli('show', 'Ogbe', '--ascii');

  assert.match(stdout, /\|/);
  assert.doesNotMatch(stdout, /│/);
});

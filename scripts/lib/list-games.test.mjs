import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { listGameSlugs } from './list-games.mjs';

describe('listGameSlugs', () => {
  /** @type {string} */
  let gamesRoot;

  before(() => {
    gamesRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'games-list-'));
    const valid = path.join(gamesRoot, 'alpha', 'Build');
    fs.mkdirSync(valid, { recursive: true });
    fs.writeFileSync(path.join(valid, 'build.loader.js'), '');
    fs.mkdirSync(path.join(gamesRoot, 'not-a-game'), { recursive: true });
    const beta = path.join(gamesRoot, 'beta', 'Build');
    fs.mkdirSync(beta, { recursive: true });
    fs.writeFileSync(path.join(beta, 'build.loader.js'), '');
  });

  after(() => {
    fs.rmSync(gamesRoot, { recursive: true, force: true });
  });

  test('lists only directories with Build/*.loader.js', () => {
    assert.deepEqual(listGameSlugs(gamesRoot), ['alpha', 'beta']);
  });
});

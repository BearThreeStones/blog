import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { expandGzipInTree } from './stage-game-dir.mjs';

describe('expandGzipInTree', () => {
  /** @type {string} */
  let root;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'gzip-expand-'));
    const payload = Buffer.from('hello unity');
    const gz = zlib.gzipSync(payload);
    fs.writeFileSync(path.join(root, 'build.data.gz'), gz);
  });

  after(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  test('writes decompressed file next to .gz source', () => {
    expandGzipInTree(root);
    const out = path.join(root, 'build.data');
    assert.ok(fs.existsSync(out));
    assert.equal(fs.readFileSync(out, 'utf8'), 'hello unity');
  });
});

import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { detectUnityBuildOnDisk } from './unity-build-fs.mjs';

describe('detectUnityBuildOnDisk', () => {
  /** @type {string} */
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'unity-build-test-'));
    const buildDir = path.join(tmpDir, 'Build');
    fs.mkdirSync(buildDir, { recursive: true });
    fs.writeFileSync(path.join(buildDir, 'build.loader.js'), '/* loader */');
    fs.writeFileSync(path.join(buildDir, 'build.data'), 'data');
    fs.writeFileSync(path.join(buildDir, 'build.framework.js'), 'fw');
    fs.writeFileSync(path.join(buildDir, 'build.wasm'), 'wasm');
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('finds build files under Build/', () => {
    const info = detectUnityBuildOnDisk(tmpDir, 'my-game');
    assert.ok(info);
    assert.equal(info.buildBaseName, 'build');
    assert.match(info.loaderPath, /build\.loader\.js$/);
    assert.match(info.dataPath, /build\.data$/);
  });

  test('returns null when Build directory is missing', () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'unity-empty-'));
    try {
      assert.equal(detectUnityBuildOnDisk(empty, 'x'), null);
    } finally {
      fs.rmSync(empty, { recursive: true, force: true });
    }
  });
});

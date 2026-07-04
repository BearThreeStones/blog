import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

/**
 * @param {string} rootDir
 */
export function expandGzipInTree(rootDir) {
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
        continue;
      }
      if (!name.endsWith('.gz')) {
        continue;
      }
      const out = full.slice(0, -3);
      if (!fs.existsSync(out) || fs.statSync(full).mtimeMs > fs.statSync(out).mtimeMs) {
        const compressed = fs.readFileSync(full);
        fs.writeFileSync(out, zlib.gunzipSync(compressed));
      }
    }
  };
  walk(rootDir);
}

/**
 * @param {string} srcDir game source directory
 * @returns {string} staging directory path (caller must rm)
 */
export function stageGameForCapture(srcDir) {
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'capture-stage-'));
  fs.cpSync(srcDir, staging, { recursive: true });
  expandGzipInTree(staging);
  return staging;
}

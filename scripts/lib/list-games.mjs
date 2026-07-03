import fs from 'node:fs';
import path from 'node:path';

/**
 * @param {string} gamesRoot
 * @returns {string[]}
 */
export function listGameSlugs(gamesRoot) {
  if (!fs.existsSync(gamesRoot)) {
    return [];
  }

  return fs
    .readdirSync(gamesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => {
      const buildDir = path.join(gamesRoot, name, 'Build');
      if (!fs.existsSync(buildDir)) {
        return false;
      }
      return fs.readdirSync(buildDir).some((file) => file.endsWith('.loader.js'));
    })
    .sort();
}

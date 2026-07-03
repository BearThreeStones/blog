import path from 'node:path';

const PREVIEW_FILENAME = 'preview.webp';

/**
 * @param {string} gamePath
 * @returns {string}
 */
export function getGamePreviewUrl(gamePath) {
  const normalized = gamePath.replace(/^\/+|\/+$/g, '');
  return `/games/${normalized}/Build/${PREVIEW_FILENAME}`;
}

/**
 * Local dev mirror (Vite does not serve gitignored files under public/games).
 * @param {string} slug
 * @returns {string}
 */
export function getGamePreviewDevUrl(slug) {
  return `/assets/game-previews/${slug}.webp`;
}

/**
 * @param {string} gamesRoot
 * @param {string} slug
 * @returns {string}
 */
export function getGamePreviewFilePath(gamesRoot, slug) {
  return path.join(gamesRoot, slug, 'Build', PREVIEW_FILENAME);
}

/**
 * @param {string} publicRoot docs/.vuepress/public
 * @param {string} slug
 * @returns {string}
 */
export function getGamePreviewDevFilePath(publicRoot, slug) {
  return path.join(publicRoot, 'assets', 'game-previews', `${slug}.webp`);
}

export { PREVIEW_FILENAME };

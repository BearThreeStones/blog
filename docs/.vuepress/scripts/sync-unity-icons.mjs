/**
 * Sync icons from Unity Editor Icon into public/assets/icon/unity.
 * Default source: E:/Dev/Unity Editor Icon (SVG, same paths as the PNG pack).
 *
 * Set UNITY_ICON_LIBRARY to override the source folder.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_LIB = 'e:/Dev/Unity Editor Icon';
const OUT_ROOT = path.resolve(__dirname, '../public/assets/icon/unity');
const MANIFEST_PATH = path.resolve(__dirname, '../icon-manifest.json');

function baseNameFromRel(relPath) {
  const file = path.basename(relPath);
  return file.replace(/(@2x)?\.(png|svg)$/i, '');
}

function resolveSourceFile(libRoot, theme, relPath, prefer) {
  const themeDir = theme === 'light' ? 'Light Theme' : 'Dark Theme';
  const fullDir = path.join(libRoot, themeDir, path.dirname(relPath));
  const base = baseNameFromRel(relPath);

  const candidates =
    prefer === '2x'
      ? [`${base}@2x.svg`, `${base}.svg`, `${base}@2x.png`, `${base}.png`]
      : prefer === '1x'
        ? [`${base}.svg`, `${base}.png`, `${base}@2x.svg`, `${base}@2x.png`]
        : [`${base}.svg`, `${base}@2x.svg`, `${base}@2x.png`, `${base}.png`];

  for (const name of candidates) {
    const candidate = path.join(fullDir, name);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function resolveDestPath(dest, srcPath) {
  if (srcPath.endsWith('.svg')) {
    return dest.endsWith('.png') ? dest.replace(/\.png$/i, '.svg') : dest;
  }
  if (srcPath.endsWith('.png')) {
    return dest.endsWith('.svg') ? dest.replace(/\.svg$/i, '.png') : dest;
  }
  return dest;
}

function copyIcon(libRoot, entry) {
  const { dest, light, dark, theme = 'light', prefer } = entry;
  const rel = theme === 'dark' ? (dark ?? light) : light;
  if (!rel) {
    console.warn(`[sync-unity-icons] Skip ${dest}: missing path`);
    return false;
  }

  const src = resolveSourceFile(libRoot, theme, rel, prefer);
  if (!src) {
    console.warn(`[sync-unity-icons] Missing: ${theme}/${rel} -> ${dest}`);
    return false;
  }

  const outRel = resolveDestPath(dest, src);
  const outPath = path.join(OUT_ROOT, outRel);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.copyFileSync(src, outPath);
  return true;
}

function main() {
  const libRoot = process.env.UNITY_ICON_LIBRARY ?? DEFAULT_LIB;
  if (!fs.existsSync(libRoot)) {
    console.error(`[sync-unity-icons] Library not found: ${libRoot}`);
    console.error('Set UNITY_ICON_LIBRARY to the icon pack folder.');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  const icons = manifest.icons ?? [];
  let ok = 0;
  let fail = 0;

  for (const entry of icons) {
    if (copyIcon(libRoot, entry)) ok += 1;
    else fail += 1;
  }

  console.log(`[sync-unity-icons] Copied ${ok} icons (${fail} skipped) -> ${OUT_ROOT}`);
  if (fail > 0) process.exitCode = 0;
}

main();

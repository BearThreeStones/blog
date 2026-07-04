import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_BUILD_BASENAMES = ['build'];

const UNITY_ASSET_SUFFIXES = {
  data: ['.data.gz', '.data'],
  framework: ['.framework.js.gz', '.framework.js'],
  wasm: ['.wasm.gz', '.wasm'],
};

/**
 * @param {string} dir
 * @returns {string[]}
 */
function listLoaderFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.loader.js'));
}

/**
 * @param {string} buildDir
 * @param {string} baseName
 * @param {string[]} suffixes
 * @returns {string | null}
 */
function resolveAssetPath(buildDir, baseName, suffixes) {
  const found = [];
  for (const suffix of suffixes) {
    const candidate = path.join(buildDir, `${baseName}${suffix}`);
    if (fs.existsSync(candidate)) {
      found.push(candidate);
    }
  }
  if (found.length === 0) {
    return null;
  }
  found.sort((a, b) => {
    const aGz = a.endsWith('.gz') ? 1 : 0;
    const bGz = b.endsWith('.gz') ? 1 : 0;
    return aGz - bGz;
  });
  return found[0];
}

/**
 * @param {string} gameDir absolute path to game root
 * @param {string} slug game slug for product name
 * @returns {{
 *   buildBaseName: string;
 *   buildDir: string;
 *   loaderPath: string;
 *   dataPath: string;
 *   frameworkPath: string;
 *   wasmPath: string;
 *   productName: string;
 * } | null}
 */
export function detectUnityBuildOnDisk(gameDir, slug) {
  const candidates = [
    path.join(gameDir, 'Build'),
    gameDir,
  ];

  const baseNames = [...new Set([...DEFAULT_BUILD_BASENAMES, slug])];

  for (const buildDir of candidates) {
    const loaders = listLoaderFiles(buildDir);
    if (loaders.length === 0) {
      continue;
    }

    for (const baseName of baseNames) {
      const loaderPath = path.join(buildDir, `${baseName}.loader.js`);
      if (!fs.existsSync(loaderPath)) {
        continue;
      }

      const dataPath = resolveAssetPath(buildDir, baseName, UNITY_ASSET_SUFFIXES.data);
      const frameworkPath = resolveAssetPath(buildDir, baseName, UNITY_ASSET_SUFFIXES.framework);
      const wasmPath = resolveAssetPath(buildDir, baseName, UNITY_ASSET_SUFFIXES.wasm);

      if (!dataPath || !frameworkPath || !wasmPath) {
        continue;
      }

      return {
        buildBaseName: baseName,
        buildDir,
        loaderPath,
        dataPath,
        frameworkPath,
        wasmPath,
        productName: slug,
      };
    }
  }

  return null;
}

/**
 * @param {import('./unity-build-fs.mjs').ReturnType<typeof detectUnityBuildOnDisk>} buildInfo
 * @param {string} webRoot URL path prefix e.g. /
 * @returns {{ loaderUrl: string; dataUrl: string; frameworkUrl: string; codeUrl: string; productName: string }}
 */
export function toHarnessUrls(buildInfo, webRoot = '/') {
  const prefix = webRoot.endsWith('/') ? webRoot : `${webRoot}/`;

  const toUrl = (filePath) => {
    const rel = path.relative(buildInfo.buildDir, filePath).split(path.sep).join('/');
    return `${prefix}${rel}`;
  };

  return {
    loaderUrl: toUrl(buildInfo.loaderPath),
    dataUrl: toUrl(buildInfo.dataPath),
    frameworkUrl: toUrl(buildInfo.frameworkPath),
    codeUrl: toUrl(buildInfo.wasmPath),
    productName: buildInfo.productName,
  };
}

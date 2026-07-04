#!/usr/bin/env node
/**
 * Capture Unity WebGL preview screenshots for game embeds.
 *
 * Usage:
 *   node scripts/capture-game-previews.mjs [slug...]
 *   node scripts/capture-game-previews.mjs --games strategy factory
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { getGamePreviewFilePath, getGamePreviewDevFilePath } from '../docs/.vuepress/plugins/unity-webgl-plugin/lib/preview.mjs';
import { listGameSlugs } from './lib/list-games.mjs';
import { detectUnityBuildOnDisk } from './lib/unity-build-fs.mjs';
import { stageGameForCapture } from './lib/stage-game-dir.mjs';
import { startGameStaticServer } from './lib/game-static-server.mjs';
import { renderPreviewHarnessHtml } from './lib/preview-harness.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const GAMES_ROOT = path.join(REPO_ROOT, 'docs/.vuepress/public/games');
const PUBLIC_ROOT = path.join(REPO_ROOT, 'docs/.vuepress/public');

const CAPTURE_WIDTH = 800;
const CAPTURE_HEIGHT = 450;
const UNITY_READY_TIMEOUT_MS = 60_000;
const FRAME_READY_TIMEOUT_MS = 90_000;
const POLL_INTERVAL_MS = 500;

/**
 * @param {string[]} argv
 * @returns {string[]}
 */
function parseSlugs(argv) {
  const args = argv.slice(2);
  if (args.length === 0) {
    return listGameSlugs(GAMES_ROOT);
  }
  if (args[0] === '--games') {
    return args.slice(1);
  }
  return args;
}

const POST_UNITY_SETTLE_MS = 3_000;

/**
 * @param {import('playwright').Page} page
 * @param {number} timeoutMs
 */
async function waitForFrameReady(page, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        return false;
      }
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        return false;
      }
      const { width, height } = canvas;
      if (width === 0 || height === 0) {
        return false;
      }
      const regionW = Math.max(1, Math.floor(width * 0.5));
      const regionH = Math.max(1, Math.floor(height * 0.5));
      const x0 = Math.floor((width - regionW) / 2);
      const y0 = Math.floor((height - regionH) / 2);
      const pixels = new Uint8Array(regionW * regionH * 4);
      gl.readPixels(x0, y0, regionW, regionH, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      let bright = 0;
      const total = regionW * regionH;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] + pixels[i + 1] + pixels[i + 2] > 30) {
          bright += 1;
        }
      }
      return bright / total >= 0.05;
    });
    if (ready) {
      return true;
    }
    await page.waitForTimeout(POLL_INTERVAL_MS);
  }
  return false;
}

/**
 * @param {string} slug
 * @param {import('playwright').Browser} browser
 */
async function captureOneGameAttempt(slug, browser) {
  const gameDir = path.join(GAMES_ROOT, slug);
  const outputPath = getGamePreviewFilePath(GAMES_ROOT, slug);

  let staging = '';
  let httpServer = null;

  staging = stageGameForCapture(gameDir);
  const buildInfo = detectUnityBuildOnDisk(staging, slug);
  if (!buildInfo) {
    console.warn(`[capture] skip ${slug}: no valid Unity build`);
    return;
  }

  const html = renderPreviewHarnessHtml({
    width: CAPTURE_WIDTH,
    height: CAPTURE_HEIGHT,
    loaderUrl: path.basename(buildInfo.loaderPath),
    dataUrl: path.basename(buildInfo.dataPath),
    frameworkUrl: path.basename(buildInfo.frameworkPath),
    codeUrl: path.basename(buildInfo.wasmPath),
    productName: buildInfo.productName,
  });
  fs.writeFileSync(path.join(buildInfo.buildDir, 'index.html'), html);

  httpServer = await startGameStaticServer(buildInfo.buildDir);
  const page = await browser.newPage({ viewport: { width: CAPTURE_WIDTH, height: CAPTURE_HEIGHT } });

  try {
    await page.goto(`http://127.0.0.1:${httpServer.port}/`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });

    await page.waitForFunction(() => window.__unityReady === true, undefined, {
      timeout: UNITY_READY_TIMEOUT_MS,
    });
    await page.waitForTimeout(POST_UNITY_SETTLE_MS);

    const ready = await waitForFrameReady(page, FRAME_READY_TIMEOUT_MS);
    if (!ready) {
      console.warn(`[capture] ${slug}: frame readiness timeout; saving last frame`);
    }

    const pngBuffer = await page.locator('#unity-canvas').screenshot({ type: 'png' });
    await sharp(pngBuffer).webp({ quality: 80 }).toFile(outputPath);
    const devMirrorPath = getGamePreviewDevFilePath(PUBLIC_ROOT, slug);
    fs.mkdirSync(path.dirname(devMirrorPath), { recursive: true });
    fs.copyFileSync(outputPath, devMirrorPath);
    console.log(`[capture] wrote ${outputPath}`);
  } finally {
    await page.close();
    if (httpServer) {
      await httpServer.close();
    }
    if (staging && fs.existsSync(staging)) {
      fs.rmSync(staging, { recursive: true, force: true });
    }
  }
}

/**
 * @param {string} slug
 * @param {import('playwright').Browser} browser
 */
async function captureOneGame(slug, browser) {
  const outputPath = getGamePreviewFilePath(GAMES_ROOT, slug);

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      if (attempt > 1) {
        console.log(`[capture] retry ${slug} (attempt ${attempt})`);
      }
      await captureOneGameAttempt(slug, browser);
      return;
    } catch (error) {
      if (attempt === 2) {
        console.warn(`[capture] failed ${slug}:`, error instanceof Error ? error.message : error);
        if (!fs.existsSync(outputPath)) {
          console.warn(`[capture] no preview for ${slug}`);
        } else {
          console.warn(`[capture] preserved existing preview for ${slug}`);
        }
      }
    }
  }
}

async function main() {
  const slugs = parseSlugs(process.argv);
  if (slugs.length === 0) {
    console.log('[capture] no games to process');
    return;
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--use-gl=angle'],
  });

  try {
    for (const slug of slugs) {
      await captureOneGame(slug, browser);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('[capture] fatal:', error);
  process.exit(1);
});

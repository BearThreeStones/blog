<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import type { UnityInstance, UnityPlayerState } from '../types.js';
import { getGamePreviewUrl, getGamePreviewDevUrl } from '../lib/preview.mjs';

// Props
interface Props {
  gamePath: string;
  width?: number;
  height?: number;
  fullscreen?: boolean;
  primaryColor?: string;
  backgroundColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 450,
  fullscreen: true,
  primaryColor: undefined,
  backgroundColor: undefined,
});

interface UnityBuildInfo {
  loaderUrl: string;
  buildPath: string;
  dataUrl: string;
  frameworkUrl: string;
  codeUrl: string;
  productName: string;
}

type UnityAssetKey = 'dataUrl' | 'frameworkUrl' | 'codeUrl';

const DEFAULT_BUILD_BASENAMES = ['build'];

/** Prefer precompressed .gz; skip .br when host has no Brotli build (SPA fallback returns HTML). */
const UNITY_ASSET_SUFFIXES: Record<UnityAssetKey, string[]> = {
  dataUrl: ['.data.gz', '.data'],
  frameworkUrl: ['.framework.js.gz', '.framework.js'],
  codeUrl: ['.wasm.gz', '.wasm'],
};

const UNITY_LOADER_SCRIPT_ID = 'unity-webgl-shared-loader';
const buildInfoCache = new Map<string, Promise<UnityBuildInfo | null>>();
const loaderAvailabilityCache = new Map<string, Promise<boolean>>();
let sharedLoaderUrl: string | null = null;
let sharedLoaderPromise: Promise<void> | null = null;

// State
const state = ref<UnityPlayerState>('INITIAL');
const loadingProgress = ref(0);
const errorMessage = ref('');
const unityInstance = ref<UnityInstance | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const componentId = ref(`unity-player-${Math.random().toString(36).substr(2, 9)}`);
const isMobile = ref(false);
const isFullscreen = ref(false);
const previewAvailable = ref(false);
const previewUrl = ref('');

const initialStateStyle = computed(() => {
  if (!previewAvailable.value || !previewUrl.value) {
    return {};
  }
  return {
    backgroundImage: `url(${previewUrl.value})`,
  };
});

// Computed
const containerStyle = computed(() => ({
  width: `${props.width}px`,
  maxWidth: '100%',
  aspectRatio: `${props.width} / ${props.height}`,
  backgroundColor: props.backgroundColor || '#231F20',
}));

const gameDisplayName = computed(() => {
  const parts = props.gamePath.split('/');
  return parts[parts.length - 1];
});

const uiIcons = {
  load: '/assets/icon/unity/load-game.svg',
  warning: '/assets/icon/unity/warning.svg',
  fullscreenEnter: '/assets/icon/unity/fullscreen-enter.svg',
  fullscreenExit: '/assets/icon/unity/fullscreen-exit.svg',
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }

  return 'Unknown error occurred';
}

function isCompressedUnityAsset(assetUrl: string): boolean {
  return /\.(gz|br)(\?|#|$)/i.test(assetUrl);
}

function hasValidCompressionHeaders(
  assetUrl: string,
  contentEncoding: string | null,
): boolean {
  const encoding = (contentEncoding ?? '').toLowerCase();
  if (assetUrl.endsWith('.br') || assetUrl.includes('.br?')) {
    return encoding === 'br';
  }
  return encoding === 'gzip';
}

function getBuildBaseNameCandidates(): string[] {
  return [...new Set([...DEFAULT_BUILD_BASENAMES, gameDisplayName.value])];
}

async function canLoadUnityAsset(assetUrl: string): Promise<boolean> {
  const response = await fetch(assetUrl, { method: 'HEAD', cache: 'no-store' });
  if (!response.ok) {
    return false;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const contentEncoding = response.headers.get('content-encoding');
  const isHtml = contentType.includes('text/html');

  if (isHtml) {
    return false;
  }

  if (isCompressedUnityAsset(assetUrl)) {
    return hasValidCompressionHeaders(assetUrl, contentEncoding);
  }

  return true;
}

async function resolveUnityAssetUrl(
  buildPath: string,
  buildBaseName: string,
  assetKey: UnityAssetKey,
): Promise<string | null> {
  const suffixes = UNITY_ASSET_SUFFIXES[assetKey];
  const results = await Promise.all(
    suffixes.map(async (suffix) => {
      const assetUrl = `${buildPath}/${buildBaseName}${suffix}`;
      try {
        return (await canLoadUnityAsset(assetUrl)) ? assetUrl : null;
      } catch {
        return null;
      }
    }),
  );

  for (let i = 0; i < suffixes.length; i += 1) {
    if (results[i]) {
      return results[i];
    }
  }

  return null;
}

async function resolveUnityBuildInfo(
  buildPath: string,
  buildBaseName: string,
): Promise<UnityBuildInfo | null> {
  const [dataUrl, frameworkUrl, codeUrl] = await Promise.all([
    resolveUnityAssetUrl(buildPath, buildBaseName, 'dataUrl'),
    resolveUnityAssetUrl(buildPath, buildBaseName, 'frameworkUrl'),
    resolveUnityAssetUrl(buildPath, buildBaseName, 'codeUrl'),
  ]);

  if (!dataUrl || !frameworkUrl || !codeUrl) {
    return null;
  }

  return {
    loaderUrl: `${buildPath}/${buildBaseName}.loader.js`,
    buildPath,
    dataUrl,
    frameworkUrl,
    codeUrl,
    productName: gameDisplayName.value,
  };
}

// Detect mobile and probe preview poster
async function probePreviewPoster(): Promise<void> {
  const candidates = [
    getGamePreviewUrl(props.gamePath),
    getGamePreviewDevUrl(gameDisplayName.value),
  ];

  for (const url of candidates) {
    const loaded = await new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
    if (loaded) {
      previewUrl.value = url;
      previewAvailable.value = true;
      return;
    }
  }

  previewUrl.value = '';
  previewAvailable.value = false;
}

onMounted(() => {
  isMobile.value = 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768;
  void probePreviewPoster();
});

async function detectGzipWithoutEncoding(gamePath: string): Promise<string | null> {
  const sampleUrl = `/games/${gamePath}/Build/build.framework.js.gz`;

  try {
    const response = await fetch(sampleUrl, { method: 'HEAD', cache: 'no-store' });
    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type') ?? '';
    const contentEncoding = response.headers.get('content-encoding');
    if (contentType.includes('text/html')) {
      return null;
    }

    if (
      isCompressedUnityAsset(sampleUrl) &&
      !hasValidCompressionHeaders(sampleUrl, contentEncoding)
    ) {
      return (
        'Unity .gz assets are reachable but nginx is not sending Content-Encoding: gzip. ' +
        'Apply server/nginx-games-gzip.conf.example on the host, then reload nginx. ' +
        'See docs in that file or redeploy games after fixing the server.'
      );
    }
  } catch {
    return null;
  }

  return null;
}

async function isLoaderAvailable(loaderUrl: string): Promise<boolean> {
  const cached = loaderAvailabilityCache.get(loaderUrl);
  if (cached) {
    return cached;
  }

  const probe = (async () => {
    const response = await fetch(loaderUrl, { method: 'HEAD', cache: 'force-cache' });
    if (!response.ok) {
      return false;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('text/html')) {
      return false;
    }

    return true;
  })();

  loaderAvailabilityCache.set(loaderUrl, probe);
  return probe;
}

async function detectBuildFilesUncached(): Promise<UnityBuildInfo | null> {
  const basePath = `/games/${props.gamePath}`;
  const buildPaths = [`${basePath}/Build`, basePath];

  for (const buildPath of buildPaths) {
    for (const buildBaseName of getBuildBaseNameCandidates()) {
      const loaderUrl = `${buildPath}/${buildBaseName}.loader.js`;

      try {
        if (!(await isLoaderAvailable(loaderUrl))) {
          continue;
        }

        const buildInfo = await resolveUnityBuildInfo(buildPath, buildBaseName);
        if (buildInfo) {
          return buildInfo;
        }
      } catch {
        // Loader not available, try the next candidate.
      }
    }
  }

  return null;
}

function detectBuildFiles(): Promise<UnityBuildInfo | null> {
  const cacheKey = props.gamePath;
  let pending = buildInfoCache.get(cacheKey);
  if (!pending) {
    pending = detectBuildFilesUncached();
    buildInfoCache.set(cacheKey, pending);
  }
  return pending;
}

function loadUnityLoader(loaderUrl: string): Promise<void> {
  if (typeof (window as any).createUnityInstance === 'function') {
    if (!sharedLoaderUrl || sharedLoaderUrl === loaderUrl) {
      return Promise.resolve();
    }

    const existingScript = document.getElementById(UNITY_LOADER_SCRIPT_ID);
    existingScript?.remove();
    sharedLoaderUrl = null;
    sharedLoaderPromise = null;
    delete (window as any).createUnityInstance;
  }

  if (sharedLoaderPromise && sharedLoaderUrl === loaderUrl) {
    return sharedLoaderPromise;
  }

  sharedLoaderUrl = loaderUrl;
  sharedLoaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = UNITY_LOADER_SCRIPT_ID;
    script.src = loaderUrl;
    script.onload = () => {
      if (typeof (window as any).createUnityInstance !== 'function') {
        script.remove();
        sharedLoaderUrl = null;
        sharedLoaderPromise = null;
        reject(new Error(`Unity loader script did not expose createUnityInstance: ${loaderUrl}`));
        return;
      }

      resolve();
    };
    script.onerror = () => {
      sharedLoaderUrl = null;
      sharedLoaderPromise = null;
      reject(new Error(`Failed to load Unity loader script: ${loaderUrl}`));
    };
    document.head.appendChild(script);
  });

  return sharedLoaderPromise;
}

async function resetUnityRuntime(): Promise<void> {
  if (unityInstance.value) {
    try {
      await unityInstance.value.Quit();
    } catch {
      // Instance may not have finished starting.
    }
    unityInstance.value = null;
  }

  document.getElementById(UNITY_LOADER_SCRIPT_ID)?.remove();
  sharedLoaderUrl = null;
  sharedLoaderPromise = null;
  delete (window as any).createUnityInstance;
  delete (window as any).unityFramework;
}

// Initialize Unity instance
async function initUnityInstance(buildInfo: UnityBuildInfo): Promise<void> {
  if (!canvasRef.value) {
    throw new Error('Canvas element not found');
  }
  
  // Build Unity config
  const config = {
    dataUrl: buildInfo.dataUrl,
    frameworkUrl: buildInfo.frameworkUrl,
    codeUrl: buildInfo.codeUrl,
    streamingAssetsUrl: 'StreamingAssets',
    companyName: 'DefaultCompany',
    productName: buildInfo.productName,
    productVersion: '1.0',
    matchWebGLToCanvasSize: true,
    devicePixelRatio: 1,
  };
  
  // Create Unity instance
  const createUnityInstance = (window as any).createUnityInstance;
  if (!createUnityInstance) {
    throw new Error('createUnityInstance not found. Unity loader script may have failed to load.');
  }
  
  const instance = await createUnityInstance(canvasRef.value, config, (progress: number) => {
    loadingProgress.value = progress;
  });
  
  unityInstance.value = instance;
}

// Handle load button click
async function handleLoadClick() {
  if (state.value !== 'INITIAL') return;

  await resetUnityRuntime();

  state.value = 'LOADING';
  loadingProgress.value = 0;
  errorMessage.value = '';
  await nextTick();
  
  try {
    const buildInfo = await detectBuildFiles();
    if (!buildInfo) {
      const gzipMisconfig = await detectGzipWithoutEncoding(props.gamePath);
      if (gzipMisconfig) {
        throw new Error(gzipMisconfig);
      }

      throw new Error(
        `Game build not found at /games/${props.gamePath}/. ` +
        `Please ensure the Unity WebGL build is placed in the correct directory with the loader script.`
      );
    }

    await loadUnityLoader(buildInfo.loaderUrl);
    await initUnityInstance(buildInfo);

    state.value = 'LOADED';
  } catch (error) {
    await resetUnityRuntime();
    state.value = 'ERROR';
    errorMessage.value = getErrorMessage(error);
    console.error('[UnityPlayer] Load failed:', error);
  }
}

// Handle retry button click
async function handleRetry() {
  await resetUnityRuntime();
  state.value = 'INITIAL';
  loadingProgress.value = 0;
  errorMessage.value = '';
}

const FULLSCREEN_EVENTS = [
  'fullscreenchange',
  'webkitfullscreenchange',
  'mozfullscreenchange',
  'MSFullscreenChange',
] as const;

function getCanvasHost(): HTMLElement | null {
  return (
    document
      .getElementById(componentId.value)
      ?.querySelector<HTMLElement>('.unity-runtime-state') ?? null
  );
}

function restoreCanvasToPlayer(): boolean {
  const canvas = canvasRef.value;
  const host = getCanvasHost();
  if (!canvas || !host) {
    return false;
  }

  if (host.contains(canvas)) {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    return true;
  }

  const wrapper = canvas.parentElement;
  host.appendChild(canvas);
  if (wrapper && wrapper !== host && wrapper.childElementCount === 0) {
    wrapper.remove();
  }

  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  return true;
}

function resetCanvasLayout(): void {
  const canvas = canvasRef.value;
  if (!canvas) {
    return;
  }

  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  window.dispatchEvent(new Event('resize'));
}

function finalizeUnityExit(): void {
  if (!unityInstance.value) {
    return;
  }

  unityInstance.value.SetFullscreen(0);
  isFullscreen.value = false;
  restoreCanvasToPlayer();
  resetCanvasLayout();

  void nextTick(() => {
    requestAnimationFrame(() => {
      restoreCanvasToPlayer();
      resetCanvasLayout();
    });
  });
}

function requestHostFullscreen(host: HTMLElement): void {
  const request =
    host.requestFullscreen ??
    (host as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> })
      .webkitRequestFullscreen;

  request?.call(host)?.catch(() => {});
}

function exitUnityFullscreen(): void {
  if (!unityInstance.value) {
    return;
  }

  // Must run synchronously in the click handler to keep the user-gesture context.
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
    return;
  }

  finalizeUnityExit();
}

// Toggle fullscreen
function toggleFullscreen() {
  if (!unityInstance.value) return;

  const host = getCanvasHost();
  if (!host) return;

  if (!document.fullscreenElement) {
    requestHostFullscreen(host);
  } else {
    exitUnityFullscreen();
  }
}

// Listen to fullscreen change events
function handleFullscreenChange() {
  const browserFullscreen = !!document.fullscreenElement;

  if (!browserFullscreen) {
    if (unityInstance.value) {
      finalizeUnityExit();
    } else {
      isFullscreen.value = false;
    }
    return;
  }

  isFullscreen.value = true;
  resetCanvasLayout();
}

function bindFullscreenListeners(): void {
  for (const event of FULLSCREEN_EVENTS) {
    document.addEventListener(event, handleFullscreenChange);
  }
}

function unbindFullscreenListeners(): void {
  for (const event of FULLSCREEN_EVENTS) {
    document.removeEventListener(event, handleFullscreenChange);
  }
}

onMounted(() => {
  bindFullscreenListeners();
});

// Cleanup on unmount
onBeforeUnmount(async () => {
  unbindFullscreenListeners();
  restoreCanvasToPlayer();
  await resetUnityRuntime();
});
</script>

<template>
  <div :id="componentId" class="unity-player-container" :style="containerStyle">
    <!-- Mobile Warning (shown in INITIAL state on mobile) -->
    <div v-if="state === 'INITIAL' && isMobile" class="unity-mobile-warning">
      <img class="unity-inline-icon" :src="uiIcons.warning" alt="" aria-hidden="true" no-view>
      <span>This game may not work well on mobile devices</span>
    </div>
    
    <!-- INITIAL State: Click-to-Play Button -->
    <div
      v-if="state === 'INITIAL'"
      class="unity-initial-state"
      :class="{ 'has-poster': previewAvailable }"
      :style="initialStateStyle"
    >
      <button type="button" class="unity-load-button" @click.stop="handleLoadClick">
        <img class="unity-button-icon" :src="uiIcons.load" alt="" aria-hidden="true" no-view>
        <span>Load Game</span>
      </button>
      <p class="unity-game-name">{{ gameDisplayName }}</p>
    </div>
    
    <!-- Runtime State: Shared canvas for loading and loaded states -->
    <div v-else-if="state === 'LOADING' || state === 'LOADED'" class="unity-runtime-state">
      <canvas :id="`${componentId}-canvas`" ref="canvasRef" class="unity-canvas"></canvas>
      <div v-if="state === 'LOADING'" class="unity-loading-overlay">
        <div class="unity-progress-container">
          <div class="unity-progress-bar" :style="{ width: `${loadingProgress * 100}%` }"></div>
        </div>
        <p class="unity-loading-text">Loading: {{ (loadingProgress * 100).toFixed(0) }}%</p>
      </div>
      <button
        v-if="state === 'LOADED' && fullscreen"
        type="button"
        class="unity-fullscreen-button"
        :class="{ 'is-active': isFullscreen }"
        @click.stop="toggleFullscreen"
        :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
        :aria-label="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
      >
        <span class="unity-fullscreen-button-icon" aria-hidden="true"></span>
      </button>
    </div>
    
    <!-- ERROR State: Error Message -->
    <div v-else-if="state === 'ERROR'" class="unity-error-state">
      <div class="unity-error-icon">
        <img :src="uiIcons.warning" alt="" aria-hidden="true" no-view>
      </div>
      <h3 class="unity-error-title">Failed to Load Game</h3>
      <p class="unity-error-message">{{ errorMessage }}</p>
      <button class="unity-retry-button" @click="handleRetry">
        Retry
      </button>
    </div>
  </div>
</template>

<style scoped>
.unity-player-container {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin: 1rem 0;
}

/* Mobile Warning */
.unity-mobile-warning {
  background-color: #fff3cd;
  color: #856404;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  text-align: center;
  font-size: 0.875rem;
  border-bottom: 1px solid #ffeeba;
}

/* INITIAL State */
.unity-initial-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
  position: relative;
}

.unity-initial-state.has-poster {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.unity-initial-state.has-poster::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  pointer-events: none;
}

.unity-initial-state.has-poster > * {
  position: relative;
  z-index: 1;
}

.unity-load-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 1.125rem;
  font-weight: 500;
  color: #fff;
  background-color: var(--vp-c-brand, #0969da);
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 80ms cubic-bezier(0.33, 1, 0.68, 1), border-color 80ms cubic-bezier(0.33, 1, 0.68, 1);
}

.unity-load-button:hover {
  background-color: var(--vp-c-brand-light, #0353a4);
}

.unity-load-button:active {
  background-color: var(--vp-c-brand-dark, #003d73);
}

.unity-game-name {
  color: #6c757d;
  font-size: 0.875rem;
  margin: 0;
}

/* Runtime State */
.unity-runtime-state {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #231f20;
}

.unity-runtime-state:fullscreen,
.unity-runtime-state:-webkit-full-screen {
  width: 100%;
  height: 100%;
}

.unity-runtime-state:fullscreen .unity-canvas,
.unity-runtime-state:-webkit-full-screen .unity-canvas {
  width: 100%;
  height: 100%;
}

.unity-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  background-color: rgba(35, 31, 32, 0.88);
}

.unity-progress-container {
  width: 100%;
  max-width: 400px;
  height: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.unity-progress-bar {
  height: 100%;
  background-color: var(--vp-c-brand, #0969da);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.unity-loading-text {
  color: #fff;
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
}

.unity-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.unity-fullscreen-button {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  z-index: 2;
  width: 40px;
  height: 40px;
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 80ms cubic-bezier(0.33, 1, 0.68, 1);
  backdrop-filter: blur(4px);
}

.unity-fullscreen-button:hover {
  background-color: rgba(0, 0, 0, 0.8);
}

.unity-fullscreen-button-icon {
  display: block;
  width: 1.125rem;
  height: 1.125rem;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  background-image: url('/assets/icon/unity/fullscreen-enter.svg');
  pointer-events: none;
}

.unity-fullscreen-button.is-active .unity-fullscreen-button-icon {
  background-image: url('/assets/icon/unity/fullscreen-exit.svg');
}

/* ERROR State */
.unity-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  gap: 1rem;
  text-align: center;
}

.unity-error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
}

.unity-inline-icon,
.unity-button-icon,
.unity-error-icon img {
  display: block;
  flex: none;
  object-fit: contain;
}

.unity-inline-icon {
  width: 1rem;
  height: 1rem;
}

.unity-button-icon {
  width: 1.125rem;
  height: 1.125rem;
}

.unity-error-icon img {
  width: 3rem;
  height: 3rem;
}

.unity-error-title {
  color: #dc3545;
  font-size: 1.5rem;
  margin: 0;
}

.unity-error-message {
  color: #6c757d;
  font-size: 0.875rem;
  max-width: 500px;
  margin: 0;
  line-height: 1.5;
}

.unity-retry-button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  color: #fff;
  background-color: var(--vp-c-brand, #0969da);
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 80ms cubic-bezier(0.33, 1, 0.68, 1), border-color 80ms cubic-bezier(0.33, 1, 0.68, 1);
}

.unity-retry-button:hover {
  background-color: var(--vp-c-brand-light, #0353a4);
}

.unity-retry-button:active {
  background-color: var(--vp-c-brand-dark, #003d73);
}

/* Responsive */
@media (max-width: 719px) {
  
  .unity-load-button {
    padding: 0.5rem 1rem;
    font-size: 1rem;
  }
  
  .unity-fullscreen-button {
    bottom: 0.5rem;
    right: 0.5rem;
    width: 36px;
    height: 36px;
  }
}
</style>

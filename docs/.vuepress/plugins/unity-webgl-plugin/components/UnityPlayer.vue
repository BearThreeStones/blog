<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import type { UnityInstance, UnityPlayerState } from '../types.js';

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

const UNITY_ASSET_SUFFIXES: Record<UnityAssetKey, string[]> = {
  dataUrl: ['.data', '.data.gz', '.data.br'],
  frameworkUrl: ['.framework.js', '.framework.js.gz', '.framework.js.br'],
  codeUrl: ['.wasm', '.wasm.gz', '.wasm.br'],
};

// State
const state = ref<UnityPlayerState>('INITIAL');
const loadingProgress = ref(0);
const errorMessage = ref('');
const unityInstance = ref<UnityInstance | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const componentId = ref(`unity-player-${Math.random().toString(36).substr(2, 9)}`);
const isMobile = ref(false);
const isFullscreen = ref(false);

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

function isValidUnityLoaderSource(source: string): boolean {
  return source.includes('createUnityInstance');
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
  return [...new Set([gameDisplayName.value, ...DEFAULT_BUILD_BASENAMES])];
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
  for (const suffix of UNITY_ASSET_SUFFIXES[assetKey]) {
    const assetUrl = `${buildPath}/${buildBaseName}${suffix}`;
    try {
      if (await canLoadUnityAsset(assetUrl)) {
        return assetUrl;
      }
    } catch (error) {
      // Asset not available, try the next candidate.
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

// Detect mobile
onMounted(() => {
  isMobile.value = 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768;
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

// Detect build files (try Build/ subdirectory first, then flat structure)
async function detectBuildFiles(): Promise<UnityBuildInfo | null> {
  const basePath = `/games/${props.gamePath}`;

  const buildPaths = [`${basePath}/Build`, basePath];

  for (const buildPath of buildPaths) {
    for (const buildBaseName of getBuildBaseNameCandidates()) {
      const loaderUrl = `${buildPath}/${buildBaseName}.loader.js`;

      try {
        const response = await fetch(loaderUrl, { cache: 'no-store' });
        if (!response.ok) {
          continue;
        }

        const source = await response.text();
        if (!isValidUnityLoaderSource(source)) {
          continue;
        }

        const buildInfo = await resolveUnityBuildInfo(buildPath, buildBaseName);
        if (buildInfo) {
          return buildInfo;
        }
      } catch (error) {
        // Loader not available, try the next candidate.
      }
    }
  }
  
  return null;
}

// Load Unity loader script dynamically
function loadUnityLoader(loaderUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script already loaded
    const existingScript = document.getElementById(`unity-loader-${componentId.value}`);
    if (existingScript) {
      if (typeof (window as any).createUnityInstance === 'function') {
        resolve();
        return;
      }

      existingScript.remove();
    }
    
    const script = document.createElement('script');
    script.id = `unity-loader-${componentId.value}`;
    script.src = loaderUrl;
    script.onload = () => {
      if (typeof (window as any).createUnityInstance !== 'function') {
        script.remove();
        reject(new Error(`Unity loader script did not expose createUnityInstance: ${loaderUrl}`));
        return;
      }

      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load Unity loader script: ${loaderUrl}`));
    document.head.appendChild(script);
  });
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
  
  state.value = 'LOADING';
  loadingProgress.value = 0;
  errorMessage.value = '';
  await nextTick();
  
  try {
    // Detect build files
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
    
    // Load Unity loader script
    await loadUnityLoader(buildInfo.loaderUrl);
    
    // Initialize Unity instance
    await initUnityInstance(buildInfo);
    
    state.value = 'LOADED';
  } catch (error) {
    state.value = 'ERROR';
    errorMessage.value = getErrorMessage(error);
    console.error('[UnityPlayer] Load failed:', error);
  }
}

// Handle retry button click
function handleRetry() {
  state.value = 'INITIAL';
  loadingProgress.value = 0;
  errorMessage.value = '';
}

// Toggle fullscreen
function toggleFullscreen() {
  if (!unityInstance.value) return;
  
  if (!isFullscreen.value) {
    // Enter fullscreen
    unityInstance.value.SetFullscreen(1);
    isFullscreen.value = true;
  } else {
    // Exit fullscreen
    document.exitFullscreen();
  }
}

// Listen to fullscreen change events
function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange);
});

// Cleanup on unmount
onBeforeUnmount(async () => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  
  if (unityInstance.value) {
    try {
      await unityInstance.value.Quit();
    } catch (e) {
      console.error('[UnityPlayer] Failed to quit Unity instance:', e);
    }
  }
  
  // Remove loader script
  const script = document.getElementById(`unity-loader-${componentId.value}`);
  if (script) {
    script.remove();
  }
});
</script>

<template>
  <div :id="componentId" class="unity-player-container" :style="containerStyle">
    <!-- Mobile Warning (shown in INITIAL state on mobile) -->
    <div v-if="state === 'INITIAL' && isMobile" class="unity-mobile-warning">
      <img class="unity-inline-icon" :src="uiIcons.warning" alt="" aria-hidden="true">
      <span>This game may not work well on mobile devices</span>
    </div>
    
    <!-- INITIAL State: Click-to-Play Button -->
    <div v-if="state === 'INITIAL'" class="unity-initial-state">
      <button class="unity-load-button" @click="handleLoadClick">
        <img class="unity-button-icon" :src="uiIcons.load" alt="" aria-hidden="true">
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
        class="unity-fullscreen-button"
        @click="toggleFullscreen"
        :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
        :aria-label="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
      >
        <img
          class="unity-button-icon"
          :src="isFullscreen ? uiIcons.fullscreenExit : uiIcons.fullscreenEnter"
          alt=""
          aria-hidden="true"
        >
      </button>
    </div>
    
    <!-- ERROR State: Error Message -->
    <div v-else-if="state === 'ERROR'" class="unity-error-state">
      <div class="unity-error-icon">
        <img :src="uiIcons.warning" alt="" aria-hidden="true">
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
@media (max-width: 768px) {
  
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

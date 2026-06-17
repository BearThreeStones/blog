<script setup lang="ts">
import { computed } from 'vue';

import { useSiteLocale } from '../../composables/useSiteLocale.js';
import { collectArticles, useUnityEditorState } from '../../composables/useUnityEditorState.js';
import UnitySceneArticleEmbed from './UnitySceneArticleEmbed.vue';

const { selectedAsset, currentFolder } = useUnityEditorState();
const { t, tUnity } = useSiteLocale();

const mode = computed<'idle' | 'folder' | 'article' | 'file'>(() => {
  if (selectedAsset.value?.type === 'file') return 'file';
  if (selectedAsset.value?.type === 'article') return 'article';
  if (currentFolder.value && currentFolder.value.id !== 'posts') return 'folder';
  return 'idle';
});

const folderArticleCount = computed(() => {
  const folder = currentFolder.value;
  if (!folder) return 0;
  return collectArticles(folder).length;
});

const demoHint = computed(() => {
  const games = selectedAsset.value?.meta.unityGames;
  if (!games?.length) return '';
  return t('sceneGameDemos', { count: games.length });
});

const fileResourceUrl = computed(
  () => selectedAsset.value?.meta.resourceUrl ?? selectedAsset.value?.path ?? '',
);
</script>

<template>
  <div
    class="unity-scene-viewport unity-scene-viewport--preview"
    :class="{ 'unity-scene-viewport--article': mode === 'article' }"
  >
    <div class="unity-scene-preview" :class="{ 'unity-scene-preview--article': mode === 'article' }">
      <template v-if="mode === 'idle'">
        <h2 class="unity-scene-preview-title">{{ t('siteTitle') }}</h2>
        <p class="unity-scene-preview-tagline">{{ t('siteTagline') }}</p>
        <p class="unity-scene-preview-hint">{{ t('scenePreviewHint') }}</p>
      </template>

      <template v-else-if="mode === 'folder' && currentFolder">
        <div class="unity-scene-preview-folder-icon" aria-hidden="true" />
        <h2 class="unity-scene-preview-title">{{ currentFolder.meta.title }}</h2>
        <p v-if="currentFolder.meta.excerpt" class="unity-scene-preview-excerpt">
          {{ currentFolder.meta.excerpt }}
        </p>
        <p class="unity-scene-preview-meta">Articles: {{ folderArticleCount }}</p>
      </template>

      <template v-else-if="mode === 'file' && selectedAsset">
        <template v-if="selectedAsset.meta.fileKind === 'image'">
          <img
            :src="fileResourceUrl"
            :alt="selectedAsset.meta.title"
            class="unity-scene-preview-media"
          />
        </template>
        <template v-else-if="selectedAsset.meta.fileKind === 'pdf'">
          <iframe
            :src="fileResourceUrl"
            class="unity-scene-preview-pdf"
            :title="selectedAsset.meta.title"
          />
          <a
            class="unity-scene-preview-pdf-link"
            :href="fileResourceUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ t('openPdfInNewTab') }}
          </a>
        </template>
        <h2 class="unity-scene-preview-title unity-scene-preview-title--file">
          {{ selectedAsset.meta.title }}
        </h2>
        <p class="unity-scene-preview-hint">{{ t('scenePreviewFileHint') }}</p>
      </template>

      <template v-else-if="mode === 'article' && selectedAsset">
        <p v-if="demoHint" class="unity-scene-preview-demo-hint unity-scene-preview-demo-hint--bar">
          {{ demoHint }}
        </p>
        <UnitySceneArticleEmbed
          :path="selectedAsset.path"
          :title="selectedAsset.meta.title"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useSiteLocale } from '../../composables/useSiteLocale.js';
import { useUnityEditorState } from '../../composables/useUnityEditorState.js';
import UnitySceneGame from './UnitySceneGame.vue';
import UnityScenePreview from './UnityScenePreview.vue';

const { t, tUnity } = useSiteLocale();
const { selectedAsset } = useUnityEditorState();

const activeTab = ref<'scene' | 'game'>('scene');
const activeGame = ref('');

const unityGames = computed(() => selectedAsset.value?.meta.unityGames ?? []);

const hasUnityDemo = computed(() => unityGames.value.length > 0);

const showGamePicker = computed(
  () => activeTab.value === 'game' && unityGames.value.length > 1,
);

watch(
  selectedAsset,
  (asset) => {
    activeTab.value = 'scene';
    if (asset?.type === 'article' && asset.meta.unityGames?.length) {
      activeGame.value = asset.meta.unityGames[0];
    } else {
      activeGame.value = '';
    }
  },
  { immediate: true },
);

const onGameTabClick = (): void => {
  if (!hasUnityDemo.value) return;
  activeTab.value = 'game';
};

const gameTabTitle = computed(() =>
  hasUnityDemo.value
    ? t('sceneTabGameTooltip', { count: unityGames.value.length })
    : t('sceneTabGameDisabled'),
);

const toolbarLabel = computed(() => {
  if (showGamePicker.value) return t('sceneDemoLabel');
  if (activeTab.value === 'game' && activeGame.value) {
    return activeGame.value;
  }
  return 'Display 1';
});
</script>

<template>
  <div class="unity-panel unity-panel--tabbed unity-scene">
    <div class="unity-tab-bar">
      <button
        type="button"
        class="unity-tab"
        :class="{ active: activeTab === 'scene' }"
        @click="activeTab = 'scene'"
      >
        {{ tUnity('Scene') }}
      </button>
      <button
        type="button"
        class="unity-tab"
        :class="{
          active: activeTab === 'game',
          'is-disabled': !hasUnityDemo,
        }"
        :disabled="!hasUnityDemo"
        :title="gameTabTitle"
        @click="onGameTabClick"
      >
        {{ tUnity('Game') }}
        <span v-if="hasUnityDemo" class="unity-tab-badge">{{ unityGames.length }}</span>
      </button>
    </div>
    <div class="unity-scene-toolbar">
      <label v-if="showGamePicker" class="unity-scene-demo-picker">
        <span class="unity-scene-toolbar-label">{{ toolbarLabel }}</span>
        <select v-model="activeGame" class="unity-scene-demo-select">
          <option v-for="game in unityGames" :key="game" :value="game">
            {{ game }}
          </option>
        </select>
      </label>
      <template v-else>
        <span>{{ toolbarLabel }}</span>
        <span>Free Aspect</span>
      </template>
      <span class="unity-scene-scale">Scale</span>
    </div>

    <UnityScenePreview v-show="activeTab === 'scene'" />
    <UnitySceneGame
      v-if="activeTab === 'game' && hasUnityDemo && activeGame"
      :active-game="activeGame"
    />
  </div>
</template>

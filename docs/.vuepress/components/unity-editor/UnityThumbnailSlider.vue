<script setup lang="ts">
import { watch } from 'vue';

import { useUnityEditorState } from '../../composables/useUnityEditorState.js';

const { thumbnailLevel, viewMode } = useUnityEditorState();

watch(
  thumbnailLevel,
  (level) => {
    if (level <= 32) viewMode.value = 'list';
    else viewMode.value = 'grid';
  },
  { immediate: true },
);
</script>

<template>
  <div class="unity-thumbnail-slider">
    <span class="unity-slider-label" title="List view">☰</span>
    <input
      v-model.number="thumbnailLevel"
      type="range"
      min="0"
      max="100"
      class="unity-slider-input"
      aria-label="Thumbnail size"
    />
    <span class="unity-slider-label" title="Grid view">▦</span>
  </div>
</template>

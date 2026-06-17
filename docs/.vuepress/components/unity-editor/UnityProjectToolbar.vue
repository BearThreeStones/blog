<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

import { useSiteLocale } from '../../composables/useSiteLocale.js';
import { useUnityEditorState } from '../../composables/useUnityEditorState.js';

const { breadcrumbSegments, searchQuery, setCurrentFolder } = useUnityEditorState();
const { t, tUnity } = useSiteLocale();

const searchInputRef = ref<HTMLInputElement | null>(null);

const displaySegmentLabel = (label: string): string => {
  if (label === 'Assets') return tUnity('Assets');
  if (label === 'media') return t('folderMediaLabel');
  return tUnity(label);
};

const onSearchKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') {
    searchQuery.value = '';
    searchInputRef.value?.blur();
  }
};

const onGlobalKeydown = (event: KeyboardEvent): void => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    searchInputRef.value?.focus();
    searchInputRef.value?.select();
  }
};

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown);
});
</script>

<template>
  <div class="unity-project-toolbar">
    <nav class="unity-project-breadcrumbs" aria-label="Project path">
      <template v-for="(seg, index) in breadcrumbSegments" :key="seg.id">
        <button
          type="button"
          class="unity-breadcrumb-segment"
          @click="setCurrentFolder(seg.id)"
        >
          {{ displaySegmentLabel(seg.label) }}
        </button>
        <span class="unity-breadcrumb-sep">&gt;</span>
      </template>
    </nav>
    <div class="unity-project-search unity-inset">
      <input
        ref="searchInputRef"
        v-model="searchQuery"
        type="search"
        class="unity-project-search-input"
        :placeholder="t('projectSearchPlaceholder')"
        :aria-label="t('searchAria')"
        @keydown="onSearchKeydown"
      />
    </div>
  </div>
</template>

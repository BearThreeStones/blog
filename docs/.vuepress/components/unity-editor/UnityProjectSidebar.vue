<script setup lang="ts">
import { computed } from 'vue';

import { useSiteLocale } from '../../composables/useSiteLocale.js';
import { useUnityEditorState } from '../../composables/useUnityEditorState.js';
import UnityProjectTree from './UnityProjectTree.vue';

const { tUnity } = useSiteLocale();
const { catalog, currentFolderId, setCurrentFolder } = useUnityEditorState();

const isAtAssetsRoot = computed(() => currentFolderId.value === catalog.root.id);
</script>

<template>
  <div class="unity-project-sidebar">
    <button
      type="button"
      class="unity-project-sidebar-entry"
      :class="{ 'is-active': isAtAssetsRoot }"
      @click="setCurrentFolder(catalog.root.id)"
    >
      <span class="unity-project-sidebar-icon unity-project-sidebar-icon--assets" />
      <span>{{ tUnity('Assets') }}</span>
    </button>
    <UnityProjectTree />
  </div>
</template>

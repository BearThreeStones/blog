<script setup lang="ts">
import { computed } from 'vue';

import { useSiteLocale } from '../../composables/useSiteLocale.js';
import { useUnityEditorState } from '../../composables/useUnityEditorState.js';
import UnityHierarchyOutline from './UnityHierarchyOutline.vue';

const { outlineArticle } = useUnityEditorState();
const { t, tUnity } = useSiteLocale();

const outlineTitle = computed(() => outlineArticle.value?.meta.title ?? '');
</script>

<template>
  <div class="unity-panel unity-hierarchy">
    <div class="unity-panel-header unity-hierarchy-header">
      <span class="unity-panel-title">{{ tUnity('Hierarchy') }}</span>
      <span v-if="outlineTitle" class="unity-hierarchy-subtitle" :title="outlineTitle">
        {{ outlineTitle }}
      </span>
    </div>
    <div class="unity-panel-body unity-tree-scroll">
      <UnityHierarchyOutline />
      <p v-if="!outlineArticle" class="unity-empty-hint">{{ t('hierarchyNoArticle') }}</p>
    </div>
  </div>
</template>

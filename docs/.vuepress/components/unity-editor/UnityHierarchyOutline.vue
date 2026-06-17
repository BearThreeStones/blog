<script setup lang="ts">
import { computed } from 'vue';

import { useSiteLocale } from '../../composables/useSiteLocale.js';
import { useUnityEditorState } from '../../composables/useUnityEditorState.js';
import UnityHierarchyOutlineItem from './UnityHierarchyOutlineItem.vue';

const { outlineArticle } = useUnityEditorState();
const { t } = useSiteLocale();

const headings = computed(() => outlineArticle.value?.meta.headings ?? []);
</script>

<template>
  <div class="unity-hierarchy-outline">
    <p v-if="!headings.length" class="unity-empty-hint">{{ t('hierarchyNoHeadings') }}</p>
    <UnityHierarchyOutlineItem
      v-for="heading in headings"
      :key="heading.slug"
      :heading="heading"
      :expand-key="`outline-${heading.slug}`"
    />
  </div>
</template>

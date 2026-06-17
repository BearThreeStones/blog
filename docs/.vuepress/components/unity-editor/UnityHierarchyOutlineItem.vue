<script setup lang="ts">
import type { CatalogHeading } from '../../plugins/unity-editor-catalog/types.js';
import { useUnityEditorState } from '../../composables/useUnityEditorState.js';

const props = defineProps<{
  heading: CatalogHeading;
  depth?: number;
  expandKey: string;
}>();

const depth = props.depth ?? 0;

const { selectedHeadingSlug, scrollArticleToHeading, toggleExpanded, isExpanded } =
  useUnityEditorState();

const hasChildren = (): boolean => props.heading.children.length > 0;

const onRowClick = (): void => {
  scrollArticleToHeading(props.heading.slug);
};

const onFoldoutClick = (event: MouseEvent): void => {
  event.stopPropagation();
  toggleExpanded(props.expandKey);
};

const childExpandKey = (child: CatalogHeading): string =>
  `${props.expandKey}/${child.slug}`;
</script>

<template>
  <div class="unity-hierarchy-outline-item" :style="{ '--depth': depth }">
    <div
      class="unity-tree-row unity-hierarchy-outline-row"
      :class="{ 'is-selected': selectedHeadingSlug === heading.slug }"
      @click="onRowClick"
    >
      <button
        v-if="hasChildren()"
        type="button"
        class="unity-foldout"
        :aria-expanded="isExpanded(expandKey)"
        @click="onFoldoutClick"
        @dblclick.stop
      >
        <span class="unity-foldout-icon" aria-hidden="true" />
      </button>
      <span v-else class="unity-foldout-spacer" />
      <img
        class="unity-tree-icon unity-tree-icon--gameobject"
        src="/assets/icon/unity/hierarchy-gameobject.svg"
        alt=""
        width="16"
        height="16"
        aria-hidden="true"
      />
      <span class="unity-tree-label">{{ heading.title }}</span>
    </div>
    <div
      v-if="hasChildren() && isExpanded(expandKey)"
      class="unity-tree-children"
    >
      <UnityHierarchyOutlineItem
        v-for="child in heading.children"
        :key="child.slug"
        :heading="child"
        :depth="depth + 1"
        :expand-key="childExpandKey(child)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUnityEditorState } from '../../composables/useUnityEditorState.js';
import UnityTreeNode from './UnityTreeNode.vue';

const { catalog } = useUnityEditorState();
</script>

<template>
  <div class="unity-project-tree unity-tree-scroll">
    <UnityTreeNode
      v-for="child in catalog.root.children ?? []"
      :key="child.id"
      :node="child"
    />
  </div>
</template>

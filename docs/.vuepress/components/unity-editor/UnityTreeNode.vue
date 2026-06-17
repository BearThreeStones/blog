<script setup lang="ts">
import { useRouter } from 'vuepress/client';

import { compareNodeLabels } from '../../composables/useUnityEditorState.js';
import { useSiteLocale } from '../../composables/useSiteLocale.js';
import type { AssetType, CatalogNode } from '../../plugins/unity-editor-catalog/types.js';
import { useUnityEditorState } from '../../composables/useUnityEditorState.js';

const ASSET_ICONS: Record<AssetType, string> = {
  cs: '/assets/icon/unity/assets/script.svg',
  scene: '/assets/icon/unity/assets/scene.svg',
  prefab: '/assets/icon/unity/assets/prefab.svg',
  mat: '/assets/icon/unity/assets/material.svg',
  texture: '/assets/icon/unity/assets/texture.svg',
  pdf: '/assets/icon/unity/assets/pdf.svg',
};

const router = useRouter();
const { t, tUnity, localizePath } = useSiteLocale();

const props = defineProps<{
  node: CatalogNode;
  depth?: number;
}>();

const depth = props.depth ?? 0;

const {
  currentFolderId,
  selectedAssetId,
  setCurrentFolder,
  selectAsset,
  toggleExpanded,
  isExpanded,
} = useUnityEditorState();

/** Project tree: folders only; files live in the asset browser pane. */
const treeChildren = (): CatalogNode[] =>
  [...(props.node.children ?? []).filter((c) => c.type === 'folder')].sort(compareNodeLabels);

const hasChildren = (): boolean => treeChildren().length > 0;

const fileChildCount = (): number =>
  (props.node.children ?? []).filter((c) => c.type === 'file').length;

const onRowClick = (): void => {
  if (props.node.type === 'folder') {
    setCurrentFolder(props.node.id);
    return;
  }
  selectAsset(props.node);
};

const onFoldoutClick = (event: MouseEvent): void => {
  event.stopPropagation();
  toggleExpanded(props.node.id);
};

const displayLabel = (): string => {
  if (props.node.label === 'media' && fileChildCount() > 0) {
    return t('folderFileCount', { count: fileChildCount() });
  }
  if (props.node.type === 'folder' && props.node.label !== props.node.id) {
    return tUnity(props.node.label);
  }
  return props.node.label;
};

const onDblClick = (): void => {
  if (props.node.type === 'article') {
    router.push(localizePath(props.node.path));
  } else if (props.node.type === 'folder' && props.node.path !== '/') {
    router.push(localizePath(props.node.path));
  } else if (props.node.type === 'file') {
    const url = props.node.meta.resourceUrl ?? props.node.path;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

const isSelected = (): boolean => {
  if (props.node.type === 'article' || props.node.type === 'file') {
    return selectedAssetId.value === props.node.id;
  }
  return currentFolderId.value === props.node.id;
};

const iconForNode = (node: CatalogNode): string => {
  if (node.type === 'file') {
    if (node.meta.fileKind === 'pdf' || node.assetType === 'pdf') {
      return ASSET_ICONS.pdf;
    }
    return ASSET_ICONS.texture;
  }
  return ASSET_ICONS[node.assetType] ?? ASSET_ICONS.cs;
};

const showTreeIcon = (node: CatalogNode): boolean =>
  node.type === 'folder' || node.type === 'article' || node.type === 'file';
</script>

<template>
  <div class="unity-tree-node" :style="{ '--depth': depth }">
    <div
      class="unity-tree-row"
      :class="{ 'is-selected': isSelected(), 'is-folder': node.type === 'folder' }"
      @click="onRowClick"
      @dblclick="onDblClick"
    >
      <button
        v-if="hasChildren()"
        type="button"
        class="unity-foldout"
        :aria-expanded="isExpanded(node.id)"
        @click="onFoldoutClick"
        @dblclick.stop
      >
        <span class="unity-foldout-icon" aria-hidden="true" />
      </button>
      <span v-else class="unity-foldout-spacer" />
      <span
        v-if="node.type === 'folder'"
        class="unity-tree-icon unity-tree-icon--folder"
        :class="{ 'is-open': isExpanded(node.id) }"
        aria-hidden="true"
      />
      <img
        v-else-if="showTreeIcon(node)"
        class="unity-tree-icon unity-tree-icon--asset"
        :src="iconForNode(node)"
        :alt="node.assetType"
        width="16"
        height="16"
      />
      <span class="unity-tree-label">{{ displayLabel() }}</span>
    </div>
    <div
      v-if="hasChildren() && isExpanded(node.id)"
      class="unity-tree-children"
    >
      <UnityTreeNode
        v-for="child in treeChildren()"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
      />
    </div>
  </div>
</template>

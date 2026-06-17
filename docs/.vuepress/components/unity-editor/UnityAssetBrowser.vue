<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vuepress/client';

import { useSiteLocale } from '../../composables/useSiteLocale.js';
import type { AssetType, CatalogNode } from '../../plugins/unity-editor-catalog/types.js';
import { useUnityEditorState } from '../../composables/useUnityEditorState.js';

const { t, localizePath } = useSiteLocale();

const ASSET_ICONS: Record<AssetType, string> = {
  cs: '/assets/icon/unity/assets/script.svg',
  scene: '/assets/icon/unity/assets/scene.svg',
  prefab: '/assets/icon/unity/assets/prefab.svg',
  mat: '/assets/icon/unity/assets/material.svg',
  texture: '/assets/icon/unity/assets/texture.svg',
  pdf: '/assets/icon/unity/assets/pdf.svg',
};

const { folderAssets, viewMode, selectAsset, selectedAssetId, setCurrentFolder, thumbnailLevel } =
  useUnityEditorState();
const router = useRouter();

const isLargeIcons = computed(() => thumbnailLevel.value >= 80);

const browserStyle = computed(() => {
  const level = Math.min(100, Math.max(0, thumbnailLevel.value));
  const thumbPx = Math.round(48 + (level / 100) * 112);
  const labelPx = level >= 80 ? Math.round(40 + ((level - 80) / 20) * 24) : 30;
  const cellPx = thumbPx + 8;
  const itemMinH = thumbPx + labelPx + 12;
  return {
    '--ue-thumb-size': `${thumbPx}px`,
    '--ue-grid-cell': `${cellPx}px`,
    '--ue-label-height': `${labelPx}px`,
    '--ue-item-min-height': `${itemMinH}px`,
  } as Record<string, string>;
});

const onClick = (id: string): void => {
  const node = folderAssets.value.find((n) => n.id === id);
  if (!node) return;
  if (node.type === 'folder') {
    setCurrentFolder(node.id);
    return;
  }
  selectAsset(node);
};

const onDblClick = (node: CatalogNode): void => {
  if (node.type === 'article') {
    router.push(localizePath(node.path));
    return;
  }
  if (node.type === 'file') {
    const url = node.meta.resourceUrl ?? node.path;
    if (node.meta.fileKind === 'pdf' || node.assetType === 'pdf') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (node.meta.fileKind === 'image') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
};

const iconFor = (node: CatalogNode): string =>
  ASSET_ICONS[node.assetType] ?? ASSET_ICONS.cs;

const showThumbnail = (node: CatalogNode): boolean =>
  node.type === 'file' &&
  node.meta.fileKind === 'image' &&
  Boolean(node.meta.resourceUrl);
</script>

<template>
  <div
    class="unity-asset-browser"
    :class="[`is-${viewMode}`, { 'is-large-icons': isLargeIcons }]"
    :style="browserStyle"
  >
    <div v-if="!folderAssets.length" class="unity-empty-hint">{{ t('emptyFolderAssets') }}</div>
    <button
      v-for="item in folderAssets"
      :key="item.id"
      type="button"
      class="unity-asset-item"
      :class="{
        'is-selected': selectedAssetId === item.id,
        'is-folder': item.type === 'folder',
        'is-file': item.type === 'file',
      }"
      @click="onClick(item.id)"
      @dblclick="onDblClick(item)"
    >
      <span class="unity-asset-preview">
        <img
          v-if="showThumbnail(item)"
          :src="item.meta.resourceUrl"
          :alt="item.label"
          class="unity-asset-icon unity-asset-thumb"
          loading="lazy"
          decoding="async"
        />
        <img
          v-else-if="item.type === 'article' || item.type === 'file'"
          :src="iconFor(item)"
          :alt="item.assetType"
          class="unity-asset-icon"
        />
        <span v-else class="unity-asset-folder-icon" aria-hidden="true" />
      </span>
      <span class="unity-asset-name" :title="item.label">{{ item.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useSiteLocale } from '../../composables/useSiteLocale.js';
import { collectArticles, useUnityEditorState } from '../../composables/useUnityEditorState.js';

const { selectedAsset, currentFolder, catalog } = useUnityEditorState();
const { t, tUnity } = useSiteLocale();

const rows = computed(() => {
  const asset = selectedAsset.value;
  const folder = currentFolder.value;

  if (asset?.type === 'file') {
    return [
      { label: 'Name:', value: asset.meta.title },
      { label: 'Asset:', value: asset.label },
      { label: 'Type:', value: asset.assetType },
      { label: 'URL:', value: asset.meta.resourceUrl ?? asset.path },
    ];
  }

  if (asset) {
    return [
      { label: 'Name:', value: asset.meta.title },
      { label: 'Asset:', value: asset.label },
      { label: 'Type:', value: asset.assetType },
      { label: 'Path:', value: asset.path },
      { label: 'Categories:', value: asset.meta.categories.join(', ') || '—' },
      { label: 'Tags:', value: asset.meta.tags.join(', ') || '—' },
      { label: 'Date:', value: asset.meta.date ?? '—' },
      {
        label: 'Pageviews:',
        value: asset.meta.pageview ? 'Enabled' : '—',
      },
      { label: 'Excerpt:', value: asset.meta.excerpt ?? '—' },
    ];
  }

  if (folder) {
    const articles = collectArticles(folder);
    return [
      { label: 'Folder:', value: folder.label },
      { label: 'Articles:', value: String(articles.length) },
      { label: 'Categories:', value: folder.meta.categories.join(', ') || '—' },
      { label: 'Path:', value: folder.path },
      { label: 'Author:', value: 'StonyBear' },
      { label: 'Site:', value: t('inspectorSite') },
    ];
  }

  return [
    { label: 'Author:', value: 'StonyBear' },
    { label: 'Description:', value: t('inspectorDescription') },
    { label: 'Root:', value: tUnity('Assets') },
  ];
});
</script>

<template>
  <div class="unity-panel unity-inspector">
    <div class="unity-panel-header">
      <span class="unity-panel-title">{{ tUnity('Inspector') }}</span>
    </div>
    <div class="unity-panel-body">
      <div class="unity-inspector-icon" aria-hidden="true" />
      <table class="unity-inspector-table">
        <tbody>
          <tr v-for="(row, i) in rows" :key="i">
            <th class="unity-inspector-label">{{ row.label }}</th>
            <td class="unity-inspector-value">{{ row.value }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

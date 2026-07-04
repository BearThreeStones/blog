<script setup lang="ts">
import { inject, onMounted, onUnmounted } from 'vue';
import { usePageData, useRouter } from 'vuepress/client';

import { useHomeViewMode } from '../composables/useHomeViewMode.js';

import { provideUnityEditorState } from '../composables/useUnityEditorState.js';
import UnityEditorShell from '../components/unity-editor/UnityEditorShell.vue';
import type { UnityCatalog } from '../plugins/unity-editor-catalog/types.js';

const EMPTY_CATALOG: UnityCatalog = {
  root: {
    id: 'posts',
    type: 'folder',
    label: 'Assets',
    path: '/',
    assetType: 'scene',
    meta: { title: 'Assets', categories: [], tags: [] },
    children: [],
  },
};

const pageData = usePageData();

function resolveCatalog(): UnityCatalog {
  const fromInject = inject<UnityCatalog | undefined>('unityCatalog', undefined);
  if (fromInject?.root) return fromInject;

  const pageCatalog = (pageData.value as { unityCatalog?: UnityCatalog }).unityCatalog;
  if (pageCatalog?.root) return pageCatalog;

  if (typeof __UNITY_CATALOG__ !== 'undefined') {
    try {
      const raw = __UNITY_CATALOG__ as unknown;
      if (typeof raw === 'string') return JSON.parse(raw) as UnityCatalog;
      if (raw && typeof raw === 'object' && 'root' in (raw as object)) {
        return raw as UnityCatalog;
      }
    } catch {
      /* fall through */
    }
  }

  return EMPTY_CATALOG;
}

provideUnityEditorState(resolveCatalog());

const { getMode, classicHomePath } = useHomeViewMode();
const router = useRouter();

onMounted(() => {
  if (getMode() !== 'editor') {
    void router.replace(classicHomePath.value);
    return;
  }
  document.documentElement.classList.add('unity-editor-active');
});

onUnmounted(() => {
  document.documentElement.classList.remove('unity-editor-active');
});
</script>

<template>
  <div class="unity-editor-home">
    <UnityEditorShell />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useRouteLocale } from 'vuepress/client';

import {
  docsearchApiKey,
  docsearchAppId,
  docsearchIndexName,
  hasDocSearch,
} from '../../docsearch.config.js';
import { useSiteLocale } from '../../composables/useSiteLocale.js';

const { t } = useSiteLocale();
const routeLocale = useRouteLocale();

const hostId = 'unity-docsearch-root';

const searchPlaceholder = computed(() =>
  routeLocale.value === '/en/' || routeLocale.value === '/en'
    ? 'Search docs'
    : '搜索文档',
);

const buttonTitle = computed(() =>
  hasDocSearch ? t('siteSearchTitle') : t('siteSearchUnavailable'),
);

let initPromise: Promise<void> | null = null;

function findDocSearchButton(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `#${hostId} .DocSearch-Button, .docsearch-placeholder .DocSearch-Button, .DocSearch-Button`,
  );
}

async function ensureDocSearch(): Promise<void> {
  if (!hasDocSearch || findDocSearchButton()) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const [{ default: docsearch }] = await Promise.all([
      import('@docsearch/js'),
      import('@docsearch/css'),
    ]);

    docsearch({
      container: `#${hostId}`,
      appId: docsearchAppId,
      apiKey: docsearchApiKey,
      indexName: docsearchIndexName,
      placeholder: searchPlaceholder.value,
    });
  })();

  return initPromise;
}

function openDocSearch(): void {
  if (!hasDocSearch) return;

  const existing = findDocSearchButton();
  if (existing) {
    existing.click();
    return;
  }
  void ensureDocSearch().then(() => {
    requestAnimationFrame(() => findDocSearchButton()?.click());
  });
}

const onGlobalKeydown = (event: KeyboardEvent): void => {
  if (!hasDocSearch) return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    openDocSearch();
  }
};

onMounted(() => {
  if (hasDocSearch) void ensureDocSearch();
  window.addEventListener('keydown', onGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown);
});
</script>

<template>
  <div :id="hostId" class="unity-docsearch-host" aria-hidden="true" />
  <button
    type="button"
    class="unity-toolbar-search-btn"
    :class="{ 'is-disabled': !hasDocSearch }"
    :title="buttonTitle"
    :aria-label="hasDocSearch ? t('siteSearchAria') : t('siteSearchUnavailable')"
    :disabled="!hasDocSearch"
    @click="openDocSearch"
  >
    <span class="unity-toolbar-search-icon" aria-hidden="true" />
  </button>
</template>

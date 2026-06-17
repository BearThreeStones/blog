<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useSiteLocale } from '../../composables/useSiteLocale.js';
import { useUnityEditorState } from '../../composables/useUnityEditorState.js';

const props = defineProps<{
  path: string;
  title?: string;
}>();

const { localizePath } = useSiteLocale();
const { selectedHeadingSlug } = useUnityEditorState();

const iframeRef = ref<HTMLIFrameElement | null>(null);

const embedSrc = computed(() => {
  const base = localizePath(props.path);
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}unityEmbed=1`;
});

function scrollIframeToHash(slug: string | null): void {
  const iframe = iframeRef.value;
  if (!iframe?.contentWindow || !slug) return;
  try {
    const doc = iframe.contentDocument;
    const el = doc?.getElementById(slug);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    iframe.contentWindow.location.hash = slug;
  } catch {
    iframe.contentWindow.location.hash = slug;
  }
}

const onIframeLoad = (): void => {
  if (selectedHeadingSlug.value) {
    requestAnimationFrame(() => scrollIframeToHash(selectedHeadingSlug.value));
  }
};

watch(selectedHeadingSlug, (slug) => {
  scrollIframeToHash(slug);
});
</script>

<template>
  <iframe
    ref="iframeRef"
    class="unity-scene-preview-article-frame"
    :src="embedSrc"
    :title="title ?? 'Article preview'"
    @load="onIframeLoad"
  />
</template>

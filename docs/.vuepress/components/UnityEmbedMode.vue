<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

const EMBED_CLASS = 'unity-embed';

onMounted(() => {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  if (params.get('unityEmbed') === '1') {
    document.documentElement.classList.add(EMBED_CLASS);
  }
});

onUnmounted(() => {
  document.documentElement.classList.remove(EMBED_CLASS);
});
</script>

<template>
  <span class="unity-embed-marker" hidden aria-hidden="true" />
</template>

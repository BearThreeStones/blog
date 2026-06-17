<script setup lang="ts">
import { ClientOnly } from 'vuepress/client';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps<{
  activeGame: string;
}>();

const containerRef = ref<HTMLElement | null>(null);
const width = ref(640);
const height = ref(360);

let resizeObserver: ResizeObserver | null = null;

const updateSize = (): void => {
  const el = containerRef.value;
  if (!el) return;
  const w = Math.max(200, Math.floor(el.clientWidth));
  width.value = w;
  height.value = Math.floor(w * (9 / 16));
};

onMounted(() => {
  updateSize();
  if (typeof ResizeObserver !== 'undefined' && containerRef.value) {
    resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.value);
  } else {
    window.addEventListener('resize', updateSize);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  window.removeEventListener('resize', updateSize);
});

watch(
  () => props.activeGame,
  () => {
    updateSize();
  },
);

const playerKey = computed(() => `${props.activeGame}-${width.value}x${height.value}`);
</script>

<template>
  <div ref="containerRef" class="unity-scene-viewport unity-scene-viewport--game">
    <ClientOnly>
      <UnityPlayer
        :key="playerKey"
        :game-path="activeGame"
        :width="width"
        :height="height"
        :fullscreen="false"
      />
    </ClientOnly>
  </div>
</template>

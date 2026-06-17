<script setup lang="ts">
import { useSiteLocale } from '../../composables/useSiteLocale.js';
import { usePanelResize } from '../../composables/usePanelResize.js';
import { useUnityEditorState } from '../../composables/useUnityEditorState.js';

const { tUnity } = useSiteLocale();
import UnityAssetBrowser from './UnityAssetBrowser.vue';
import UnityProjectSidebar from './UnityProjectSidebar.vue';
import UnityProjectToolbar from './UnityProjectToolbar.vue';
import UnityThumbnailSlider from './UnityThumbnailSlider.vue';

const { panelSizes } = useUnityEditorState();
const { startResize } = usePanelResize(panelSizes);

const onTreeResize = (event: PointerEvent): void => {
  startResize(
    {
      axis: 'horizontal',
      min: 140,
      max: 400,
      getSize: () => panelSizes.value.projectTreeWidth,
      setSize: (v) => {
        panelSizes.value.projectTreeWidth = v;
      },
    },
    event,
  );
};
</script>

<template>
  <div class="unity-panel unity-panel--tabbed unity-project">
    <div class="unity-tab-bar">
      <span class="unity-tab active">{{ tUnity('Project') }}</span>
      <span class="unity-tab muted">{{ tUnity('Console Window') }}</span>
    </div>
    <div class="unity-project-split">
      <div
        class="unity-project-tree-pane"
        :style="{ width: `${panelSizes.projectTreeWidth}px` }"
      >
        <UnityProjectSidebar />
      </div>
      <div
        class="unity-splitter unity-splitter-vertical"
        role="separator"
        aria-orientation="vertical"
        @pointerdown="onTreeResize"
      />
      <div class="unity-project-assets-pane">
        <UnityProjectToolbar />
        <UnityAssetBrowser />
        <UnityThumbnailSlider />
      </div>
    </div>
  </div>
</template>

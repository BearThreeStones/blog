<script setup lang="ts">
import { usePanelResize } from '../../composables/usePanelResize.js';
import { useUnityEditorState } from '../../composables/useUnityEditorState.js';
import UnityHierarchy from './UnityHierarchy.vue';
import UnityInspector from './UnityInspector.vue';
import UnityMenuBar from './UnityMenuBar.vue';
import UnityProjectPanel from './UnityProjectPanel.vue';
import UnitySceneView from './UnitySceneView.vue';
import UnityToolbar from './UnityToolbar.vue';

const { panelSizes } = useUnityEditorState();
const { startResize } = usePanelResize(panelSizes);

const onHierarchyResize = (event: PointerEvent): void => {
  startResize(
    {
      axis: 'horizontal',
      min: 160,
      max: 480,
      getSize: () => panelSizes.value.hierarchyWidth,
      setSize: (v) => {
        panelSizes.value.hierarchyWidth = v;
      },
    },
    event,
  );
};

const onInspectorResize = (event: PointerEvent): void => {
  startResize(
    {
      axis: 'horizontal',
      invert: true,
      min: 200,
      max: 480,
      getSize: () => panelSizes.value.inspectorWidth,
      setSize: (v) => {
        panelSizes.value.inspectorWidth = v;
      },
    },
    event,
  );
};

const onProjectResize = (event: PointerEvent): void => {
  startResize(
    {
      axis: 'vertical',
      invert: true,
      min: 120,
      max: 480,
      getSize: () => panelSizes.value.projectHeight,
      setSize: (v) => {
        panelSizes.value.projectHeight = v;
      },
    },
    event,
  );
};
</script>

<template>
  <div class="unity-editor-shell">
    <UnityMenuBar />
    <UnityToolbar />

    <div
      class="unity-workspace"
      :style="{
        gridTemplateColumns: `${panelSizes.hierarchyWidth}px 4px 1fr 4px ${panelSizes.inspectorWidth}px`,
        gridTemplateRows: `1fr 4px ${panelSizes.projectHeight}px`,
      }"
    >
      <div class="unity-workspace-hierarchy" style="grid-area: hierarchy">
        <UnityHierarchy />
      </div>

      <div
        class="unity-splitter unity-splitter-vertical"
        style="grid-area: split-h-left"
        role="separator"
        aria-orientation="vertical"
        @pointerdown="onHierarchyResize"
      />

      <div class="unity-workspace-scene" style="grid-area: scene">
        <UnitySceneView />
      </div>

      <div
        class="unity-splitter unity-splitter-vertical"
        style="grid-area: split-h-right"
        role="separator"
        aria-orientation="vertical"
        @pointerdown="onInspectorResize"
      />

      <div class="unity-workspace-inspector" style="grid-area: inspector">
        <UnityInspector />
      </div>

      <div
        class="unity-splitter unity-splitter-horizontal"
        style="grid-area: split-v"
        role="separator"
        aria-orientation="horizontal"
        @pointerdown="onProjectResize"
      />

      <div class="unity-workspace-project" style="grid-area: project">
        <UnityProjectPanel />
      </div>
    </div>

    <footer class="unity-editor-footer">
      ICP备案/许可证号：
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">蜀ICP备2026003062号-1</a>
    </footer>
  </div>
</template>

<style scoped>
.unity-workspace {
  display: grid;
  grid-template-areas:
    'hierarchy split-h-left scene split-h-right inspector'
    'hierarchy split-h-left split-v split-h-right inspector'
    'hierarchy split-h-left project split-h-right inspector';
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.unity-workspace-hierarchy {
  grid-area: hierarchy;
  min-width: 0;
  min-height: 0;
}

.unity-workspace-scene {
  grid-area: scene;
  min-width: 0;
  min-height: 0;
}

.unity-workspace-inspector {
  grid-area: inspector;
  min-width: 0;
  min-height: 0;
}

.unity-workspace-project {
  grid-area: project;
  min-width: 0;
  min-height: 0;
}
</style>

import { defineClientConfig } from 'vuepress/client';

import HomeViewSwitchFab from './components/HomeViewSwitchFab.vue';
import HomeViewTransitionOverlay from './components/HomeViewTransitionOverlay.vue';
import UnityEmbedMode from './components/UnityEmbedMode.vue';
import UnityEditorLayout from './layouts/UnityEditorLayout.vue';

export default defineClientConfig({
  layouts: {
    UnityEditor: UnityEditorLayout,
  },
  rootComponents: [UnityEmbedMode, HomeViewSwitchFab, HomeViewTransitionOverlay],
});

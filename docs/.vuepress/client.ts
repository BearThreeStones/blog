import { defineClientConfig } from 'vuepress/client';

import HomeViewSwitchFab from './components/HomeViewSwitchFab.vue';
import UnityEmbedMode from './components/UnityEmbedMode.vue';
import UnityEditorLayout from './layouts/UnityEditorLayout.vue';

export default defineClientConfig({
  layouts: {
    UnityEditor: UnityEditorLayout,
  },
  rootComponents: [UnityEmbedMode, HomeViewSwitchFab],
});

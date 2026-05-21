import { defineClientConfig } from 'vuepress/client';
import UnityPlayer from './components/UnityPlayer.vue';

export default defineClientConfig({
  enhance({ app }) {
    // Register UnityPlayer component globally
    app.component('UnityPlayer', UnityPlayer);
  },
});

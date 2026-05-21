import type { Plugin } from 'vuepress';
import { getDirname, path } from 'vuepress/utils';

const __dirname = getDirname(import.meta.url);

export const themeUiIconSyncPlugin = (): Plugin => ({
  name: 'theme-ui-icon-sync',
  clientConfigFile: path.resolve(__dirname, './client.ts'),
});

export default themeUiIconSyncPlugin;
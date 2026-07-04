import type { Plugin } from 'vuepress';
import { getDirname, path } from 'vuepress/utils';

const __dirname = getDirname(import.meta.url);

export const desktopSidebarTogglePlugin = (): Plugin => ({
  name: 'desktop-sidebar-toggle',
  clientConfigFile: path.resolve(__dirname, './client.ts'),
});

export default desktopSidebarTogglePlugin;

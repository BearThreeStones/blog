import type { Plugin } from 'vuepress';
import { getDirname, path } from 'vuepress/utils';

import { setupEnLocaleMirror } from './setupEnLocale.js';

const __dirname = getDirname(import.meta.url);
setupEnLocaleMirror(path.resolve(__dirname, '../../..'));

export const localeContentMirrorPlugin = (): Plugin => {
  return {
    name: 'locale-content-mirror',

    onInitialized(app) {
      setupEnLocaleMirror(app.dir.source());
    },
  };
};

export default localeContentMirrorPlugin;

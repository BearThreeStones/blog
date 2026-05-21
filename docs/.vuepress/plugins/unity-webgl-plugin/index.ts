import type { Plugin } from 'vuepress';
import { getDirname, path } from 'vuepress/utils';
import { unityInlineRule, renderUnityPlayer } from './markdown/unityRule.js';

const __dirname = getDirname(import.meta.url);

export interface UnityWebGLPluginOptions {
  // Future options can go here
  // e.g., gamesDirectory: string (default: '/games/')
}

export const unityWebGLPlugin = (options: UnityWebGLPluginOptions = {}): Plugin => {
  return {
    name: 'vuepress-plugin-unity-webgl',
    
    // Register client-side config
    clientConfigFile: path.resolve(__dirname, './client.ts'),
    
    // Extend markdown-it parser
    extendsMarkdown: (md) => {
      // Register inline rule BEFORE default image rule
      md.inline.ruler.before('image', 'unity_player', unityInlineRule);
      
      // Register renderer
      renderUnityPlayer(md);
    },
  };
};

// Default export for convenience
export default unityWebGLPlugin;

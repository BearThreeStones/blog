import type { Plugin } from 'vuepress';
import { getDirname, path } from 'vuepress/utils';
import { unityBlockRule, unityInlineRule, renderUnityPlayer } from './markdown/unityRule.js';

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
      // Block rule: standalone `![game](path)` lines (not wrapped in <p>)
      md.block.ruler.before('paragraph', 'unity_player', unityBlockRule);
      // Inline rule: only when the syntax appears inside a paragraph
      md.inline.ruler.before('image', 'unity_player_inline', unityInlineRule);

      renderUnityPlayer(md);
    },
  };
};

// Default export for convenience
export default unityWebGLPlugin;

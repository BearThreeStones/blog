import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";
import { echartsTabsPlugin } from "./plugins/echarts-tabs-plugin/index.js";
import { themeUiIconSyncPlugin } from "./plugins/theme-ui-icon-sync/index.js";
import { unityWebGLPlugin } from "./plugins/unity-webgl-plugin/index.js";
import { componentsPlugin } from "vuepress-plugin-components";
import { mdEnhancePlugin } from "vuepress-plugin-md-enhance";
import { lightgalleryPlugin } from "vuepress-plugin-lightgallery";

import theme from "./theme.js";

export default defineUserConfig({
  bundler: viteBundler(),

  base: "/",

  lang: "zh-CN",
  title: "StonyBear 程序开发分享",
  description: "StonyBear 程序开发分享",

  theme,

  // 注册自定义插件
  plugins: [
    echartsTabsPlugin(),
    themeUiIconSyncPlugin(),
    unityWebGLPlugin(),
  ],

  // 和 PWA 一起启用
  // shouldPrefetch: false,
});

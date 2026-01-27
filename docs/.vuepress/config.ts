import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";
import { echartsTabsPlugin } from "./plugins/echarts-tabs-plugin/index.js";
import { componentsPlugin } from "vuepress-plugin-components";
import { mdEnhancePlugin } from "vuepress-plugin-md-enhance";
import { lightgalleryPlugin } from "vuepress-plugin-lightgallery";

import theme from "./theme.js";

export default defineUserConfig({
  bundler: viteBundler(),

  base: "/",

  lang: "zh-CN",
  title: "StonyBear 的博客",
  description: "StonyBear 的博客",

  theme,

  // 注册自定义插件
  plugins: [
    echartsTabsPlugin(),
  ],

  // 和 PWA 一起启用
  // shouldPrefetch: false,
});

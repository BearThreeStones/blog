import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";
import { echartsTabsPlugin } from "./plugins/echarts-tabs-plugin/index.js";
import { siteAnalyticsPlugin } from "./plugins/site-analytics/index.js";
import { themeUiIconSyncPlugin } from "./plugins/theme-ui-icon-sync/index.js";
import { unityWebGLPlugin } from "./plugins/unity-webgl-plugin/index.js";

import {
  baiduAnalyticsId,
  googleAnalyticsId,
} from "./analytics.config.ts";
import theme from "./theme.js";

const hasGoogleAnalytics =
  Boolean(googleAnalyticsId) && !googleAnalyticsId.startsWith("G-XXXX");
const hasBaiduAnalytics =
  Boolean(baiduAnalyticsId) && !baiduAnalyticsId.startsWith("xxxx");

// 已安装 @vuepress/plugin-google-analytics、@vuepress/plugin-baidu-analytics；
// 客户端由 siteAnalyticsPlugin 加载（与官方插件等效，含 SPA 路由 PV）
const analyticsPlugins =
  hasGoogleAnalytics || hasBaiduAnalytics ? [siteAnalyticsPlugin()] : [];

export default defineUserConfig({
  bundler: viteBundler({
    viteOptions: {
      server: {
        watch: {
          ignored: [
            "**/dist/**",
            "**/.temp/**",
            "**/.cache/**",
            "**/public/games/**",
          ],
        },
      },
    },
  }),

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
    ...analyticsPlugins,
  ],

  // 和 PWA 一起启用
  // shouldPrefetch: false,
});

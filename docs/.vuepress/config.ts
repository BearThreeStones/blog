import "./load-docs-env.js";
import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";
import { echartsTabsPlugin } from "./plugins/echarts-tabs-plugin/index.js";
import { localeContentMirrorPlugin } from "./plugins/locale-content-mirror/index.js";
import { siteAnalyticsPlugin } from "./plugins/site-analytics/index.js";
import { themeUiIconSyncPlugin } from "./plugins/theme-ui-icon-sync/index.js";
import { unityEditorCatalogPlugin } from "./plugins/unity-editor-catalog/index.js";
import { unityWebGLPlugin } from "./plugins/unity-webgl-plugin/index.js";
import { autoCoverPlugin } from "./plugins/auto-cover-plugin/index.js";
import { classicAnimationsPlugin } from "./plugins/classic-animations/index.js";
import { desktopSidebarTogglePlugin } from "./plugins/desktop-sidebar-toggle/index.js";

import {
  baiduAnalyticsId,
  googleAnalyticsId,
} from "./analytics.config.ts";
import theme from "./theme.js";

const hasGoogleAnalytics =
  Boolean(googleAnalyticsId) && !googleAnalyticsId.startsWith("G-XXXX");
const hasBaiduAnalytics =
  Boolean(baiduAnalyticsId) && !baiduAnalyticsId.startsWith("xxxx");

const analyticsPlugins =
  hasGoogleAnalytics || hasBaiduAnalytics ? [siteAnalyticsPlugin()] : [];

const docsearchDefine = {
  __DOCSEARCH_APP_ID__: JSON.stringify(process.env.DOCSEARCH_APP_ID ?? ""),
  __DOCSEARCH_API_KEY__: JSON.stringify(process.env.DOCSEARCH_API_KEY ?? ""),
  __DOCSEARCH_INDEX_NAME__: JSON.stringify(process.env.DOCSEARCH_INDEX_NAME ?? ""),
};

export default defineUserConfig({
  bundler: viteBundler({
    viteOptions: {
      define: docsearchDefine,
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

  locales: {
    "/": {
      lang: "zh-CN",
      title: "StonyBear 程序开发分享",
      description: "分享游戏开发和算法知识",
    },
    "/en/": {
      lang: "en-US",
      title: "StonyBear Dev Blog",
      description: "Game development and algorithms",
    },
  },

  head: [
    [
      "meta",
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
    ],
    [
      "meta",
      {
        name: "algolia-site-verification",
        content: "62EA9FE1881E1FD2",
      },
    ],
    // Google Fonts: preconnect + non-blocking stylesheet (moved from SCSS @import)
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    [
      "link",
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossorigin: "",
      },
    ],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap",
      },
    ],
  ],

  theme,

  plugins: [
    localeContentMirrorPlugin(),
    echartsTabsPlugin(),
    themeUiIconSyncPlugin(),
    classicAnimationsPlugin(),
    desktopSidebarTogglePlugin(),
    unityEditorCatalogPlugin(),
    unityWebGLPlugin(),
    autoCoverPlugin(),
    ...analyticsPlugins,
  ],

  shouldPrefetch: false,
});

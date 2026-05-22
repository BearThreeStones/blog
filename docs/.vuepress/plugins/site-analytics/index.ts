import type { Plugin } from "vuepress";
import { getDirname, path } from "vuepress/utils";

const __dirname = getDirname(import.meta.url);

/** 客户端加载 Google / 百度统计（与官方插件行为一致，含 SPA 路由上报） */
export const siteAnalyticsPlugin = (): Plugin => ({
  name: "vuepress-plugin-site-analytics",
  clientConfigFile: path.resolve(__dirname, "./client.ts"),
});

export default siteAnalyticsPlugin;

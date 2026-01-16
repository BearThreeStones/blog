import type { Plugin } from "vuepress";
import { getDirname, path } from "vuepress/utils";

const __dirname = getDirname(import.meta.url);

/**
 * ECharts Tabs 修复插件
 * 解决 ECharts 在选项卡中无法正常显示的问题
 */
export const echartsTabsPlugin = (): Plugin => {
  return {
    name: "vuepress-plugin-echarts-tabs-fix",

    // 插件选项
    multiple: false,

    // 客户端配置文件路径
    clientConfigFile: path.resolve(__dirname, "./client.ts"),

    // 插件初始化
    onInitialized(app) {
      console.log("ECharts Tabs Fix Plugin initialized");
    },

    // 开发服务器准备就绪
    onPrepared(app) {
      console.log("ECharts Tabs Fix Plugin prepared");
    },

    // 扩展 Markdown
    extendsMarkdown(md, app) {
      // 可以在这里扩展 Markdown 解析器
      // 例如添加自定义容器或规则
    },

    // 生命周期钩子
    onWatched(app, watchers) {
      // 监听文件变化
    },
  };
};

export default echartsTabsPlugin;

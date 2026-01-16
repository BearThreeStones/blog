import { defineClientConfig } from "vuepress/client";

/**
 * ECharts Tabs 修复 - 客户端配置
 */
export default defineClientConfig({
  enhance({ app, router, siteData }) {
    // 应用增强
    console.log("ECharts Tabs Fix: Client enhanced");

    // 路由变化时重新初始化
    router.afterEach((to, from) => {
      if (to.path !== from.path) {
        setTimeout(() => {
          initEChartsTabsFix();
        }, 300);
      }
    });
  },

  setup() {
    // 组合式 API 设置
  },

  rootComponents: [
    // 可以添加全局组件
  ],
});

// 页面加载后初始化
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    setTimeout(initEChartsTabsFix, 500);
  });
}

/**
 * 初始化 ECharts Tabs 修复
 */
function initEChartsTabsFix() {
  // 确保只在客户端环境执行
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  console.log("ECharts Tabs Fix: Initializing...");

  setupTabsListeners();
  setTimeout(resizeAllECharts, 200);
  setupDOMObserver();
}

/**
 * 设置选项卡监听器
 */
function setupTabsListeners() {
  // 确保只在客户端环境执行
  if (typeof document === "undefined") {
    return;
  }

  const tabSelectors = [
    ".vp-tabs [role='tab']",
    ".vp-code-tabs [role='tab']",
    ".tabs-nav button",
    "[data-tab-button]",
  ];

  let tabCount = 0;
  tabSelectors.forEach((selector) => {
    const tabs = document.querySelectorAll(selector);
    tabs.forEach((tab) => {
      tab.removeEventListener("click", handleTabClick);
      tab.addEventListener("click", handleTabClick);
      tabCount++;
    });
  });

  console.log(`ECharts Tabs Fix: ${tabCount} tabs found`);
}

/**
 * 处理选项卡点击
 */
function handleTabClick(event: Event) {
  console.log("ECharts Tabs Fix: Tab clicked");

  // 延迟处理，确保 DOM 更新
  setTimeout(resizeAllECharts, 100);
  setTimeout(resizeAllECharts, 300); // 处理动画
}

/**
 * 调整所有可见的 ECharts 大小
 */
function resizeAllECharts() {
  // 确保只在客户端环境执行
  if (typeof document === "undefined") {
    return;
  }

  const containers = document.querySelectorAll(".echarts");
  let resizedCount = 0;

  containers.forEach((container) => {
    const htmlContainer = container as HTMLElement;

    if (isElementVisible(htmlContainer)) {
      const instance = getEChartsInstance(htmlContainer);

      if (instance) {
        try {
          instance.resize();
          resizedCount++;
        } catch (error) {
          console.warn("ECharts resize failed:", error);
        }
      }
    }
  });

  if (resizedCount > 0) {
    console.log(`ECharts Tabs Fix: ${resizedCount} charts resized`);
  }
}

/**
 * 检查元素是否可见
 */
function isElementVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    element.offsetParent !== null
  );
}

/**
 * 获取 ECharts 实例
 */
function getEChartsInstance(container: HTMLElement) {
  if (typeof (window as any).echarts === "undefined") {
    return null;
  }

  try {
    return (window as any).echarts.getInstanceByDom(container);
  } catch {
    return null;
  }
}

/**
 * 设置 DOM 变化观察器
 */
function setupDOMObserver() {
  // 确保只在客户端环境执行
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") {
    return;
  }

  const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;

    mutations.forEach((mutation) => {
      if (mutation.type === "attributes") {
        const target = mutation.target as HTMLElement;

        if (
          mutation.attributeName === "class" ||
          mutation.attributeName === "style" ||
          mutation.attributeName === "hidden" ||
          mutation.attributeName === "aria-selected"
        ) {
          if (
            target.classList?.contains("vp-tab") ||
            target.closest?.(".vp-tabs") ||
            target.querySelector?.(".echarts")
          ) {
            shouldUpdate = true;
          }
        }
      } else if (mutation.type === "childList") {
        const addedNodes = Array.from(mutation.addedNodes);
        addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            if (
              element.classList?.contains("vp-tabs") ||
              element.classList?.contains("echarts") ||
              element.querySelector?.(".vp-tabs") ||
              element.querySelector?.(".echarts")
            ) {
              shouldUpdate = true;
            }
          }
        });
      }
    });

    if (shouldUpdate) {
      setTimeout(() => {
        setupTabsListeners();
        resizeAllECharts();
      }, 100);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style", "hidden", "aria-selected"],
  });

  console.log("ECharts Tabs Fix: Observer set up");
}

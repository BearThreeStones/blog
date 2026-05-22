import { defineClientConfig } from "vuepress/client";
import { onMounted } from "vue";
import { useRouter } from "vuepress/client";

import {
  baiduAnalyticsId,
  googleAnalyticsId,
} from "../../analytics.config.ts";

const hasGoogleAnalytics =
  Boolean(googleAnalyticsId) && !googleAnalyticsId.startsWith("G-XXXX");
const hasBaiduAnalytics =
  Boolean(baiduAnalyticsId) && !baiduAnalyticsId.startsWith("xxxx");

function loadGoogleAnalytics(id: string): void {
  if (window.gtag) return;

  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  script.async = true;
  document.head.append(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", id);
}

function loadBaiduAnalytics(id: string): void {
  if (window._hmt) return;

  window._hmt = window._hmt || [];
  const hm = document.createElement("script");
  hm.src = `https://hm.baidu.com/hm.js?${id}`;
  const firstScript = document.getElementsByTagName("script")[0];
  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(hm, firstScript);
  } else {
    document.head.append(hm);
  }
}

export default defineClientConfig({
  setup() {
    if (import.meta.env.DEV) return;

    onMounted(() => {
      const router = useRouter();

      if (hasGoogleAnalytics) loadGoogleAnalytics(googleAnalyticsId);
      if (hasBaiduAnalytics) loadBaiduAnalytics(baiduAnalyticsId);

      router.afterEach((to) => {
        if (hasGoogleAnalytics && window.gtag) {
          window.gtag("config", googleAnalyticsId, {
            page_path: to.fullPath,
          });
        }
        if (hasBaiduAnalytics && window._hmt) {
          window._hmt.push(["_trackPageview", to.fullPath]);
        }
      });
    });
  },
});

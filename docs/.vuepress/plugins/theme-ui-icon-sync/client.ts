import { defineClientConfig } from 'vuepress/client';

const BLOG_TYPE_ICON_MAP: Record<string, { active: string; inactive: string }> = {
  文章: {
    active: '--unity-theme-ui-article-on',
    inactive: '--unity-theme-ui-article',
  },
  分类: {
    active: '--unity-theme-ui-category-on',
    inactive: '--unity-theme-ui-category',
  },
  标签: {
    active: '--unity-theme-ui-tag-on',
    inactive: '--unity-theme-ui-tag',
  },
  时间轴: {
    active: '--unity-theme-ui-timeline-on',
    inactive: '--unity-theme-ui-timeline',
  },
};

let observerStarted = false;
let listenerStarted = false;

const syncBlogTypeIcons = (): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const rootStyles = window.getComputedStyle(document.documentElement);

  document.querySelectorAll<HTMLElement>('.vp-blog-type-icon-wrapper').forEach((element) => {
    const label = element.getAttribute('aria-label') ?? '';
    const iconConfig = BLOG_TYPE_ICON_MAP[label];

    if (!iconConfig) {
      return;
    }

    const iconVariableName = element.classList.contains('active')
      ? iconConfig.active
      : iconConfig.inactive;
    const iconValue = rootStyles.getPropertyValue(iconVariableName).trim();

    element.style.setProperty('--unity-blog-type-icon', iconValue);
  });
};

const scheduleSyncBlogTypeIcons = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.requestAnimationFrame(() => {
    syncBlogTypeIcons();
    window.setTimeout(syncBlogTypeIcons, 120);
  });
};

const ensureObserver = (): void => {
  if (
    observerStarted ||
    typeof document === 'undefined' ||
    typeof MutationObserver === 'undefined'
  ) {
    return;
  }

  observerStarted = true;

  const observer = new MutationObserver((mutations) => {
    const shouldSync = mutations.some((mutation) => {
      if (mutation.type === 'attributes') {
        const target = mutation.target as HTMLElement;

        if (
          target === document.documentElement &&
          mutation.attributeName === 'data-theme'
        ) {
          return true;
        }

        return target.classList?.contains('vp-blog-type-icon-wrapper') ?? false;
      }

      return Array.from(mutation.addedNodes).some((node) => {
        if (!(node instanceof HTMLElement)) {
          return false;
        }

        return (
          node.classList.contains('vp-blog-type-icon-wrapper') ||
          node.querySelector('.vp-blog-type-icon-wrapper') !== null
        );
      });
    });

    if (shouldSync) {
      scheduleSyncBlogTypeIcons();
    }
  });

  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'aria-label'],
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
};

const ensureBlogTypeClickListener = (): void => {
  if (listenerStarted || typeof document === 'undefined') {
    return;
  }

  listenerStarted = true;

  document.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.closest('.vp-blog-type-switcher button') === null) {
      return;
    }

    window.setTimeout(syncBlogTypeIcons, 0);
    window.setTimeout(syncBlogTypeIcons, 120);
  });
};

export default defineClientConfig({
  enhance({ router }) {
    if (typeof window === 'undefined') {
      return;
    }

    const bootstrap = (): void => {
      ensureObserver();
      ensureBlogTypeClickListener();
      scheduleSyncBlogTypeIcons();
    };

    if (document.readyState === 'loading') {
      window.addEventListener('load', bootstrap, { once: true });
    } else {
      bootstrap();
    }

    router.afterEach(() => {
      scheduleSyncBlogTypeIcons();
    });
  },
});
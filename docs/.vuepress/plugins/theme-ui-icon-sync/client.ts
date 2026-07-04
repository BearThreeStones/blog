import { defineClientConfig } from 'vuepress/client';

const BLOG_TYPE_ICON_ENTRIES: Array<{
  labels: string[];
  active: string;
  inactive: string;
}> = [
  {
    labels: ['文章', 'Articles'],
    active: '--unity-theme-ui-article-on',
    inactive: '--unity-theme-ui-article',
  },
  {
    labels: ['分类', 'Categories'],
    active: '--unity-theme-ui-category-on',
    inactive: '--unity-theme-ui-category',
  },
  {
    labels: ['标签', 'Tags'],
    active: '--unity-theme-ui-tag-on',
    inactive: '--unity-theme-ui-tag',
  },
  {
    labels: ['时间轴', 'Timeline'],
    active: '--unity-theme-ui-timeline-on',
    inactive: '--unity-theme-ui-timeline',
  },
];

const BLOG_TYPE_ICON_MAP: Record<string, { active: string; inactive: string }> =
  Object.fromEntries(
    BLOG_TYPE_ICON_ENTRIES.flatMap((entry) =>
      entry.labels.map((label) => [
        label,
        { active: entry.active, inactive: entry.inactive },
      ]),
    ),
  );

let observerStarted = false;
let listenerStarted = false;

const syncBlogTypeIcons = (): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const rootStyles = window.getComputedStyle(document.documentElement);

  const isDarkMode = document.documentElement.dataset.theme === 'dark';

  document.querySelectorAll<HTMLElement>('.vp-blog-type-icon-wrapper').forEach((element) => {
    const label = element.getAttribute('aria-label') ?? '';
    const iconConfig = BLOG_TYPE_ICON_MAP[label];

    if (!iconConfig) {
      return;
    }

    // Light mode: -on icons are pale/white (Unity toolbar); use inactive icons
    // on the light pill so selected tabs stay readable.
    const useActiveIcon = element.classList.contains('active') && isDarkMode;
    const iconVariableName = useActiveIcon
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
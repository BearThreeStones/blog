import { defineClientConfig } from 'vuepress/client';
import { onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vuepress/client';

import {
  applyCollapsedState,
  createDesktopToggleClickHandler,
  restoreCollapsedState,
  shouldAttachDesktopToggle,
  shouldRestoreCollapsedPreference,
} from './lib/sidebar-toggle.mjs';

const BUTTON_SELECTOR = '.vp-toggle-sidebar-button';
const CONTAINER_SELECTOR = '.theme-container';

function isUnityEditorActive() {
  return document.documentElement.classList.contains('unity-editor-active');
}

function getToggleButton() {
  return document.querySelector<HTMLButtonElement>(BUTTON_SELECTOR);
}

function getThemeContainer() {
  return document.querySelector<HTMLElement>(CONTAINER_SELECTOR);
}

export default defineClientConfig({
  setup() {
    if (typeof window === 'undefined') return;

    let clickHandler: ((event: Event) => boolean) | undefined;
    let boundButton: HTMLButtonElement | null = null;

    const unbind = () => {
      if (boundButton && clickHandler) {
        boundButton.removeEventListener('click', clickHandler, true);
      }
      boundButton = null;
      clickHandler = undefined;
    };

    const sync = () => {
      unbind();

      const container = getThemeContainer();
      const button = getToggleButton();
      if (!container || !button) return;

      const unityEditorActive = isUnityEditorActive();

      if (!shouldRestoreCollapsedPreference(unityEditorActive)) {
        applyCollapsedState(container, false);
        return;
      }

      restoreCollapsedState({
        storage: window.localStorage,
        container,
        button,
      });

      if (
        !shouldAttachDesktopToggle({
          unityEditorActive,
          width: window.innerWidth,
        })
      ) {
        return;
      }

      clickHandler = createDesktopToggleClickHandler({
        getUnityEditorActive: isUnityEditorActive,
        getWidth: () => window.innerWidth,
        container,
        storage: window.localStorage,
        button,
      });

      button.addEventListener('click', clickHandler, true);
      boundButton = button;
    };

    const route = useRoute();

    onMounted(() => {
      sync();
      window.addEventListener('resize', sync);
    });
    watch(() => route.path, sync, { flush: 'post' });
    onUnmounted(() => {
      window.removeEventListener('resize', sync);
      unbind();
    });
  },
});

import { defineClientConfig } from 'vuepress/client';
import { watch } from 'vue';
import { useRoute } from 'vuepress/client';

import { isClassicHomePath } from '../../composables/useHomeViewMode.js';
import { usePrefersReducedMotion } from '../../composables/usePrefersReducedMotion.js';
import { getHeroDelayMs } from './lib/classic-motion-presets.mjs';
import {
  bindClassicScrollReveal,
  shouldBindScrollReveal,
} from './lib/scroll-reveal.mjs';

const HTML_CLASS = 'classic-home-animations';

function applyHeroDelayVars(reducedMotion: boolean) {
  const root = document.documentElement;
  root.style.setProperty(
    '--classic-hero-delay-title',
    `${getHeroDelayMs('title', reducedMotion)}ms`,
  );
  root.style.setProperty(
    '--classic-hero-delay-tagline',
    `${getHeroDelayMs('tagline', reducedMotion)}ms`,
  );
  root.style.setProperty(
    '--classic-hero-delay-actions',
    `${getHeroDelayMs('actions', reducedMotion)}ms`,
  );
}

function bindReveal(reducedMotion: boolean) {
  const main = document.querySelector('.vp-blog-main');
  if (!main) return () => {};
  return bindClassicScrollReveal(main, reducedMotion);
}

export default defineClientConfig({
  setup() {
    if (typeof window === 'undefined') return;

    const route = useRoute();
    const reducedMotion = usePrefersReducedMotion();

    let teardownReveal: (() => void) | undefined;
    let listObserver: MutationObserver | undefined;
    let revealFrame = 0;

    const teardownAll = () => {
      if (revealFrame) {
        window.cancelAnimationFrame(revealFrame);
        revealFrame = 0;
      }
      teardownReveal?.();
      teardownReveal = undefined;
      listObserver?.disconnect();
      listObserver = undefined;
    };

    const scheduleReveal = (reduced: boolean) => {
      if (revealFrame) window.cancelAnimationFrame(revealFrame);
      revealFrame = window.requestAnimationFrame(() => {
        revealFrame = 0;
        teardownReveal?.();
        teardownReveal = bindReveal(reduced);
      });
    };

    const observeListChanges = (reduced: boolean) => {
      listObserver?.disconnect();
      const main = document.querySelector('.vp-blog-main');
      if (!main) return;

      listObserver = new MutationObserver(() => {
        scheduleReveal(reduced);
      });
      listObserver.observe(main, { childList: true, subtree: true });
    };

    const sync = () => {
      teardownAll();

      const enabled = isClassicHomePath(route.path);
      document.documentElement.classList.toggle(HTML_CLASS, enabled);

      if (!shouldBindScrollReveal(route.path, enabled)) return;

      const reduced = Boolean(reducedMotion.value);
      applyHeroDelayVars(reduced);
      scheduleReveal(reduced);
      observeListChanges(reduced);
    };

    watch([() => route.path, reducedMotion], sync, { immediate: true });
  },
});

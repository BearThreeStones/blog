import { getCardRevealDelayMs } from './classic-motion-presets.mjs';

export const CLASSIC_ARTICLE_SELECTOR =
  '#article-list .vp-article-wrapper, .vp-blog-main .vp-article-wrapper';

const REVEALED_CLASS = 'classic-article-revealed';
const PENDING_CLASS = 'classic-article-reveal-pending';

/**
 * @param {string} path
 * @param {boolean} animationsEnabled
 */
export function shouldBindScrollReveal(path, animationsEnabled) {
  const normalized = path.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  const isClassic = normalized === '/classic' || normalized === '/en/classic';
  return animationsEnabled && isClassic;
}

/**
 * @param {ParentNode} root
 * @returns {Element[]}
 */
export function collectUnrevealedArticles(root) {
  const nodes = root.querySelectorAll(CLASSIC_ARTICLE_SELECTOR);
  return Array.from(nodes).filter(
    (node) => !node.classList.contains(REVEALED_CLASS),
  );
}

/**
 * @param {ParentNode} root
 * @param {boolean} reducedMotion
 * @returns {() => void}
 */
export function bindClassicScrollReveal(root, reducedMotion) {
  const items = collectUnrevealedArticles(root);

  if (reducedMotion) {
    for (const item of items) {
      item.classList.remove(PENDING_CLASS);
      item.classList.add(REVEALED_CLASS);
    }
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const target = entry.target;
        target.classList.remove(PENDING_CLASS);
        target.classList.add(REVEALED_CLASS);
        observer.unobserve(target);
      }
    },
    { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );

  items.forEach((item, index) => {
    item.classList.add(PENDING_CLASS);
    item.style.setProperty(
      '--classic-reveal-delay',
      `${getCardRevealDelayMs(index, false)}ms`,
    );
    observer.observe(item);
  });

  return () => observer.disconnect();
}

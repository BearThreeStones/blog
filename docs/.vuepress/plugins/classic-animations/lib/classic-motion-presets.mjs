export const HERO_DURATION_MS = 500;
export const HERO_STAGGER_MS = 120;
export const CARD_DURATION_MS = 450;
export const CARD_STAGGER_MS = 60;
export const VIEW_TRANSITION_MS = 250;

/** @typedef {'title' | 'tagline' | 'actions'} HeroPart */

/** @type {Record<HeroPart, number>} */
const HERO_PART_ORDER = {
  title: 0,
  tagline: 1,
  actions: 2,
};

/**
 * @param {HeroPart} part
 * @param {boolean} reducedMotion
 */
export function getHeroDelayMs(part, reducedMotion) {
  if (reducedMotion) return 0;
  return HERO_PART_ORDER[part] * HERO_STAGGER_MS;
}

/**
 * @param {number} index
 * @param {boolean} reducedMotion
 */
export function getCardRevealDelayMs(index, reducedMotion) {
  if (reducedMotion) return 0;
  return Math.max(0, index) * CARD_STAGGER_MS;
}

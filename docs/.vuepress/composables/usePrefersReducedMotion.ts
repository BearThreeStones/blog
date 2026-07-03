import { useMediaQuery } from '@vueuse/core';

export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

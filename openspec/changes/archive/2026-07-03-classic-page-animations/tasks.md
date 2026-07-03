## 1. Dependencies and scaffolding



- [x] 1.1 Add `@vueuse/motion` (and `@vueuse/core` if not already transitive) to `package.json`

- [x] 1.2 Create `docs/.vuepress/plugins/classic-animations/` client plugin with route-scoped `classic-home-animations` html class toggle

- [x] 1.3 Register classic-animations plugin in `docs/.vuepress/client.ts`

- [x] 1.4 Add `docs/.vuepress/styles/classic-animations.scss` and import from `index.scss`



## 2. Shared utilities



- [x] 2.1 Create `usePrefersReducedMotion.ts` composable wrapping `matchMedia('(prefers-reduced-motion: reduce)')`

- [x] 2.2 Define shared motion presets (durations, easings, stagger step) aligned with existing `--ease-out` / `--transition-*` tokens

- [x] 2.3 Consolidate or remove legacy `.vp-hero-description` `hero-fade-in` rules that conflict with new hero choreography



## 3. Hero animations (priority A)



- [x] 3.1 Add staged entrance for `.vp-blog-hero-title`, `.vp-blog-hero-description`, and hero action buttons on classic routes

- [x] 3.2 Add subtle ambient background motion on `.vp-blog-hero` (CSS keyframes on mask/overlay, max 3% drift)

- [x] 3.3 Gate hero motion behind `prefers-reduced-motion` (instant visible state, no ambient motion)

- [x] 3.4 Verify hero animations on `/classic/` and `/en/classic/` in light and dark themes



## 4. Blog scroll reveal (priority B)



- [x] 4.1 Create `useClassicScrollReveal.ts` to attach visible-once motion to `.vp-blog-main .article-item` elements

- [x] 4.2 Implement stagger by card index (50–80ms) with 450ms fade/translate-in

- [x] 4.3 Handle pagination/tab re-mount so new cards animate without re-animating existing ones

- [x] 4.4 Confirm scroll reveal does not run on article detail pages or Unity editor home

- [x] 4.5 Gate scroll reveal behind `prefers-reduced-motion`



## 5. View mode transition (priority C)



- [x] 5.1 Add `HomeViewTransitionOverlay.vue` (or equivalent root component) for cross-fade overlay

- [x] 5.2 Wrap `switchToClassic` and `switchToEditor` in `useHomeViewMode.ts` with out → navigate → in sequence (~250ms each phase)

- [x] 5.3 Preserve existing `localStorage` persistence and redirect-on-load behavior in `UnityEditorLayout.vue`

- [x] 5.4 Skip overlay transition when `prefers-reduced-motion` is active

- [x] 5.5 Manual test: FAB classic→editor and toolbar editor→classic



## 6. Validation



- [x] 6.1 Run `npm run docs:dev`, smoke-test classic home load, scroll, and both switch directions

- [x] 6.2 Enable OS reduced-motion setting and confirm all three animation areas degrade correctly

- [x] 6.3 Run `npm run docs:build` to confirm no SSR/client bundle errors from motion plugin


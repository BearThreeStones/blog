## Context

The blog offers two home experiences: Unity Editor layout (`/`) and classic Theme Hope Blog layout (`/classic/`). Classic home is configured via `docs/classic.md` frontmatter (`layout: Blog`, hero text, SVG backgrounds). Existing styles in `docs/.vuepress/styles/index.scss` include a `hero-fade-in` keyframe for `.vp-hero-description` and transition tokens (`--transition-fast/base/slow`), but hero title/actions and article cards have no coordinated motion. View switching is handled by `useHomeViewMode.ts` with instant `router.push` / `router.replace`.

No animation library is currently installed. The user wants all three animation areas (hero, scroll reveal, view transition) and asked for alternatives to Anime.js.

**Implementation priority (default):** Hero (A) → Blog scroll reveal (B) → View transition (C).

## Goals / Non-Goals

**Goals:**

- Add polished, accessible motion to classic home only.
- Use a lightweight Vue-friendly stack (not Anime.js).
- Reuse existing CSS tokens and Theme Hope class hooks (`.vp-blog-hero`, `.article-item`).
- Ship incrementally: hero first, then list, then mode switch.

**Non-Goals:**

- Animating Unity Editor home UI (hierarchy, project tree, etc.).
- Site-wide page transitions for all VuePress routes.
- Lottie/video hero backgrounds or per-character text splitting.
- GSAP ScrollTrigger license/complexity unless `@vueuse/motion` proves insufficient.
- Changing `classic.md` frontmatter or requiring content-author updates.

## Decisions

### 1. Animation stack: CSS + `@vueuse/motion` (recommended over Anime.js)

**Decision:** Use `@vueuse/motion` for declarative enter/visible directives and stagger, backed by CSS custom properties and keyframes for hero/background. No Anime.js.

**Rationale:**

| Option | Pros | Cons |
|--------|------|------|
| **@vueuse/motion** ✓ | Vue 3 native, small (~3kb), `v-motion` + `visible` for scroll, works with Vite | Less timeline control than GSAP |
| Anime.js | Familiar API, timelines | Imperative DOM queries; less idiomatic in Vue 3 SFCs |
| GSAP | Best timelines, ScrollTrigger | Larger bundle; ScrollTrigger is paid for some commercial cases |
| Pure CSS only | Zero deps | Hard to stagger hero children and scroll-reveal without JS hooks |
| Lottie | Rich vector motion | Wrong fit for DOM hero text/buttons; asset pipeline overhead |

**Alternatives considered:** GSAP if we later need complex choreographed sequences; rejected for v1 due to bundle size and overkill.

### 2. Integration pattern: client plugin + route guard class

**Decision:** Add `classic-animations` client plugin registered in `docs/.vuepress/client.ts` that:

1. Watches route via `isClassicHomePath`.
2. Toggles `html.classList.add('classic-home-animations')` on classic routes.
3. Registers `@vueuse/motion` plugin once globally (scoped styles still limit visual effect).

Hero/list hooks target Theme Hope selectors under that class to avoid leaking styles site-wide.

**Rationale:** Theme Hope Blog layout is not locally forked; a client plugin avoids patching theme internals while keeping activation route-specific.

### 3. Hero animation choreography

**Decision:**

- Title: `opacity 0→1`, `translateY(16px→0)`, 500ms, delay 0ms
- Tagline: same motion, delay 120ms
- Actions: same motion, delay 240ms
- Background: CSS `@keyframes` slow scale/opacity pulse on `.vp-blog-hero` mask or `::before` (period ~12s, amplitude ≤3%)

Reuse existing `--ease-out` and cap total perceived sequence at ~1s.

### 4. Blog scroll reveal

**Decision:** Apply `v-motion` with `visibleOnce` (or Intersection Observer via `@vueuse/motion` presets) on `.vp-blog-main .article-item` elements. Stagger via `:delay` computed from index % batch size.

Initial state: `opacity: 0; transform: translateY(12px)`.
Visible state: `opacity: 1; transform: translateY(0)` over 450ms.

For dynamically paginated items, re-run binding on list mount (MutationObserver or VuePress page hook) — keep logic in one composable `useClassicScrollReveal.ts`.

### 5. View mode transition

**Decision:** Wrap `switchToClassic` / `switchToEditor` in `useHomeViewMode.ts` with a short overlay transition:

1. Set `document.documentElement.dataset.viewTransition = 'out'`.
2. `await` 250ms (skip if reduced motion).
3. `router.push` / `replace` as today.
4. On new layout mount, set `dataset.viewTransition = 'in'`, clear after 250ms.

Use a fixed full-viewport `.home-view-transition-overlay` in `client.ts` root component (or extend `HomeViewSwitchFab` sibling) with `opacity` cross-fade — **not** the View Transitions API for v1 (Safari support still catching up; VuePress SPA lifecycle is easier with overlay).

**Alternatives considered:** `document.startViewTransition` — defer to v2 if overlay feels redundant.

### 6. Accessibility

**Decision:** Central `prefersReducedMotion()` helper (from `@vueuse/core` or `matchMedia`) gates:

- Stagger delays → 0
- Translations → disabled
- Background ambient motion → off
- View overlay → instant navigation

Add `@media (prefers-reduced-motion: reduce)` CSS overrides as backup.

## Risks / Trade-offs

- **[Theme Hope DOM changes]** → Mitigation: scope selectors under `.classic-home-animations`; add smoke test note in tasks to verify after theme upgrades.
- **[Double animation with existing `hero-fade-in`]** → Mitigation: remove or consolidate legacy `.vp-hero-description` keyframe rules to prevent conflicting motion.
- **[Scroll reveal on long lists]** → Mitigation: `visibleOnce` only; no repeat on scroll up/down.
- **[@vueuse/motion bundle]** → Mitigation: tree-shake directives only; classic plugin loads motion registration once (~3kb gzip acceptable).

## Migration Plan

1. Add `@vueuse/motion` devDependency.
2. Land hero animations behind route class (no user-facing flag).
3. Add scroll reveal for article cards.
4. Wire view-mode overlay into `useHomeViewMode`.
5. Manual QA: `/classic/`, `/en/classic/`, FAB switch, toolbar switch, reduced-motion OS setting.
6. Rollback: remove client plugin import and dependency; CSS overrides are inert without `classic-home-animations` class.

## Open Questions

- Confirm priority order A > B > C is acceptable (user selected "all" but did not rank).
- Whether English classic page (`/en/classic/`) mirrors `docs/classic.md` via locale mirror plugin — animations must apply to both locales regardless.

## Why

The classic blog home (`/classic/`) is the polished alternative to the Unity Editor-themed home, but it currently feels static compared to the editor experience. Hero text, blog article cards, and the switch between classic and editor modes lack intentional motion, so the page does not communicate hierarchy or delight on first visit. Adding lightweight, accessible animations will make the classic home feel more alive without hurting performance or the existing Theme Hope layout.

## What Changes

- Add staged entrance animations to the classic home hero (title, tagline, CTA buttons, optional subtle background motion).
- Add scroll-triggered reveal animations for blog article cards on the classic home.
- Add a smooth visual transition when switching between classic home and Unity Editor home (toolbar FAB / editor switch).
- Respect `prefers-reduced-motion` — animations degrade to instant state or minimal fades.
- Introduce a small animation utility layer (CSS-first with optional Vue motion helpers) scoped to classic home routes; no site-wide animation framework rollout.
- Keep existing markdown frontmatter and Theme Hope `Blog` layout contract unchanged (no **BREAKING** content author changes).

## Capabilities

### New Capabilities

- `classic-hero-animations`: Staged hero entrance and optional background accent motion on `/classic/` (and `/en/classic/`).
- `classic-blog-scroll-reveal`: Scroll-into-view animations for blog post cards and related list sections on the classic home.
- `classic-view-transition`: Coordinated transition when navigating between classic home and Unity Editor home via existing view-mode switch controls.

### Modified Capabilities

<!-- No existing openspec specs in this repo -->

## Impact

- **Pages**: `docs/classic.md`, mirrored English classic home if present
- **Styles**: `docs/.vuepress/styles/index.scss` (hero/blog sections), possible new `classic-animations.scss`
- **Client**: `docs/.vuepress/client.ts`, `useHomeViewMode.ts`, `HomeViewSwitchFab.vue`, `UnityHomeViewSwitch.vue`
- **Dependencies**: Likely `@vueuse/motion` (or CSS-only if design chooses zero-deps); no Anime.js
- **Assets**: Existing hero SVG backgrounds (`blog-hero-light.svg`, `blog-hero-dark.svg`) may receive subtle CSS motion only
- **Performance**: Animations scoped to classic route; no impact on article pages or Unity embeds unless shared utilities are reused later

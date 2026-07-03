## 1. Client plugin

- [x] 1.1 Create `docs/.vuepress/plugins/desktop-sidebar-toggle/` with plugin entry and `localStorage` helper (`blog:sidebar-collapsed`)
- [x] 1.2 On desktop (>960px), intercept `.vp-toggle-sidebar-button` click: toggle `sidebar-collapsed` on `.theme-container`, persist state, set Chinese `title`/`aria-label`
- [x] 1.3 On mount and route change, restore collapsed state from `localStorage`; skip when `html.unity-editor-active`
- [x] 1.4 Register plugin in `docs/.vuepress/config.ts`

## 2. Styles

- [x] 2.1 Extend `sidebar-collapsed` rules to all desktop widths (`min-width: 961px`), including ≥1440px
- [x] 2.2 Hide `vp-sidebar-mask` on desktop (`min-width: 961px`)
- [x] 2.3 Hide `vp-toggle-sidebar-button` on narrow screens (`max-width: 960px`)
- [x] 2.4 Add `.vp-toggle-sidebar-button.is-collapsed` icon/state styling (Unity icon swap or mirror)
- [x] 2.5 Add `prefers-reduced-motion` overrides for sidebar/page transitions

## 3. Verification

- [x] 3.1 Desktop (>1200px): toggle collapses sidebar, no gray mask, TOC unchanged, state survives navigation
- [x] 3.2 Narrow (≤960px): sidebar toggle hidden, hamburger nav works
- [x] 3.3 `unity-editor-active` and `unity-embed` routes unchanged
- [x] 3.4 Reduced-motion: instant toggle without animation

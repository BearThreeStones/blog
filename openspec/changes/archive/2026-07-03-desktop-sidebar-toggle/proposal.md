## Why

The navbar sidebar toggle (`vp-toggle-sidebar-button`) currently triggers VuePress Hope's **mobile** sidebar logic on all screen widths. On desktop this shows a gray overlay (`vp-sidebar-mask`) while the sidebar stays visible—confusing and unlike standard doc-site UX (VS Code / Notion style collapse). The project also hides Hope's native desktop edge control (`toggle-sidebar-wrapper`), leaving users with no proper collapse affordance on wide screens.

## What Changes

- **Desktop (>960px):** Navbar toggle collapses/expands the left sidebar inline—no gray mask, more reading width for main content.
- **Narrow (≤960px):** Hide the navbar sidebar toggle; users navigate via the existing hamburger (`vp-toggle-navbar-button`) full-screen menu.
- Add a small client plugin to wire the navbar button to desktop collapse behavior (Hope's `sidebar-collapsed` pattern).
- Extend SCSS so collapse works at all desktop widths (Hope defaults limit collapse to mid breakpoints).
- Persist collapsed state in `localStorage` across page navigations.
- Update button `title` / visual state to reflect expanded vs collapsed (Chinese labels).

## Capabilities

### New Capabilities

- `desktop-sidebar-toggle`: Responsive sidebar toggle behavior—desktop collapse without mask, narrow-screen button hiding, state persistence, and accessible motion.

### Modified Capabilities

<!-- No existing openspec specs in this repo -->

## Impact

- **Client:** New plugin under `docs/.vuepress/plugins/` (or `client/` composable), registered in `docs/.vuepress/client.ts`
- **Styles:** `docs/.vuepress/styles/index.scss` — desktop collapse overrides, hide toggle on narrow screens, suppress mask on desktop, icon state
- **Theme:** No fork of `vuepress-theme-hope`; behavior patched at client + CSS layer
- **Unity editor mode:** `html.unity-editor-active` already hides sidebar controls; no change required
- **Dependencies:** None

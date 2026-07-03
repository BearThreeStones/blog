## Context

VuePress Hope `MainLayout` wires the navbar sidebar button to `toggleMobileSidebar()` only. That sets `isMobileSidebarOpen`, which renders `div.vp-sidebar-mask` (15% black overlay) and, on true mobile, slides the sidebar in with `sidebar-open`.

Separately, Hope supports **desktop collapse** via `toggleDesktopSidebar()` and the `sidebar-collapsed` class on `.theme-container`—sidebar translates off-screen, page `padding-inline-start` goes to 0, **no mask**. However:

1. Hope only applies `sidebar-collapsed` when `!isMobile && !isPC` (roughly 960px–1440px), not on large desktops.
2. Hope hides `toggle-sidebar-wrapper` (left-edge reopen control) at `min-width: $pc`.
3. This blog **already hides** `toggle-sidebar-wrapper` globally in `index.scss`.

User decisions from brainstorming:

| Breakpoint | Behavior |
|------------|----------|
| Desktop (>960px) | Navbar button collapses sidebar inline, **no gray mask** |
| Narrow (≤960px) | Hide navbar sidebar button; use hamburger full-screen nav |

## Goals / Non-Goals

**Goals:**

- One obvious control on desktop: navbar Unity-styled sidebar icon toggles collapse.
- Smooth, theme-consistent motion using Hope's existing `translateX` + padding transitions.
- Remember collapse preference across routes via `localStorage`.
- Honor `prefers-reduced-motion`.
- Chinese accessibility labels on the button.

**Non-Goals:**

- Changing mobile drawer behavior for sidebar (sidebar stays off-canvas on mobile; hamburger handles nav).
- Replacing or forking Hope `MainLayout` / `Navbar` components.
- Animating the right TOC dock or navbar auto-hide behavior.
- Unity Editor home layout changes.

## Decisions

### 1. Implementation: client plugin + CSS (not custom Navbar)

**Decision:** Add `desktop-sidebar-toggle` client plugin that intercepts clicks on `.vp-toggle-sidebar-button` when `window.innerWidth > 960`, toggles `sidebar-collapsed` on `.theme-container`, and prevents Hope's mobile sidebar path from opening on desktop.

**Rationale:** Hope hardcodes `onToggleSidebar: () => toggleMobileSidebar()` in `MainLayout`. A focused plugin avoids vendoring theme components while reusing Hope's collapse CSS.

**Alternatives considered:**

| Option | Verdict |
|--------|---------|
| Re-enable `toggle-sidebar-wrapper` only | Rejected — user wants navbar button, not left-edge control |
| Custom Navbar component | Rejected — high maintenance on theme upgrades |
| CSS-only (hide mask on desktop) | Rejected — button still toggles wrong state without JS |

### 2. Breakpoint: align with Hope `$tablet` (960px)

**Decision:** Use `960px` as the single breakpoint (matches Hope `mobileBreakPoint` from `$tablet`). Above = desktop collapse; at or below = hide navbar sidebar button.

### 3. State persistence

**Decision:** Store `sidebar-collapsed` boolean in `localStorage` key `blog:sidebar-collapsed`. Apply on `onMounted` and each navigation via `onContentUpdated`.

### 4. Prevent mobile mask on desktop

**Decision:** Plugin ensures `isMobileSidebarOpen` equivalent never activates on desktop by not calling Hope's mobile toggle; additionally CSS safety rule: `@media (min-width: 961px) { .vp-sidebar-mask { display: none !important; } }`.

---

## Visual & Animation (第二节)

This section defines what the user **sees** during collapse/expand.

### Layout motion

**Sidebar panel**

- Collapsed: `transform: translateX(-100%)` (LTR); Hope's existing `sidebar-collapsed .vp-sidebar` rule.
- Expanded: `transform: translateX(0)`.
- **Duration / easing:** Hope token `var(--vp-t-transform)` (typically ~300ms ease). Do not introduce custom durations unless reduced-motion applies.
- **Shadow:** Remove box-shadow when collapsed (Hope default); restore when expanded.

**Main content**

- `padding-inline-start` animates from `calc(var(--sidebar-space) + 2rem)` to `0` via the same transition family on `.vp-page`.
- Right TOC dock (`vp-toc-placeholder`) stays fixed; only left gutter changes.

**Gray mask**

- **Never visible** above 960px. No fade-in/out on desktop—if mask node exists in DOM, it stays `display: none`.

### Button affordance

**Icon**

- Reuse existing Unity icon `--unity-theme-ui-sidebar-toggle` on `.vp-toggle-sidebar-button::before`.
- Add collapsed-state class on button (e.g. `.is-collapsed`) to swap icon or apply `scaleX(-1)` / chevron variant so expanded vs collapsed states are distinguishable.
- **Hit target:** Keep 40×40px navbar button; no size change during animation.

**Labels**

- `title` / `aria-label` (Chinese):
  - Expanded: `收起侧栏`
  - Collapsed: `展开侧栏`

### Motion accessibility

**`prefers-reduced-motion: reduce`**

- Toggle `sidebar-collapsed` instantly: `transition: none` on `.vp-sidebar`, `.vp-page`, and button icon.
- No opacity fades as substitute—immediate layout jump is acceptable per WCAG guidance for spatial UI.

### Narrow screen (≤960px)

- Navbar sidebar button: `display: none !important` (already styled in Unity icon block; enforce at breakpoint).
- No collapse animation on narrow—sidebar uses Hope's default off-canvas mobile behavior; user uses hamburger (`vp-toggle-navbar-button`) instead.

### Reference frame (desktop)

```
[ ≡ Logo  Nav...                    Search ]  ← navbar (button toggles collapse)
┌──────────┬─────────────────────────────┬─────────┐
│ Sidebar  │ Main article              │ TOC     │
│ (slides  │ (padding grows/shrinks)   │ (fixed) │
│  left)   │                           │         │
└──────────┴─────────────────────────────┴─────────┘
```

Collapsed: sidebar off-screen left; main content uses full width minus TOC gutter.

---

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Hope theme upgrade changes `sidebar-collapsed` class semantics | Plugin scoped to one class + documented in spec; visual QA on upgrade |
| Plugin click handler races Hope's internal toggle | `preventDefault` + `stopPropagation` on desktop; only toggle our class |
| `localStorage` out of sync across tabs | Acceptable; last write wins; optional `storage` event later |
| Collapse at ≥1440px untested in stock Hope | Extend SCSS so `sidebar-collapsed` rules apply at all `min-width: 961px` |

## Migration Plan

1. Ship plugin + SCSS behind no feature flag (behavior fix).
2. Verify article pages, blog home, `/classic/`, and `unity-embed` / `unity-editor-active` routes.
3. Rollback: remove plugin registration and SCSS block; Hope reverts to stock mobile-toggle behavior.

## Open Questions

- None blocking implementation. Icon direction for collapsed state can be finalized during `/opsx:apply` visual QA.

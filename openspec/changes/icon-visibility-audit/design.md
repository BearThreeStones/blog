## Context

Icons are delivered through three layers:

1. **Assets** — SVG/PNG under `docs/.vuepress/public/assets/icon/unity/`, synced from Unity Editor via `icon-manifest.json` and `sync-unity-icons.mjs`.
2. **CSS variables** — `:root` and `html[data-theme='dark']` in `index.scss` (~40 `--unity-theme-ui-*` pairs) and `unity-editor.scss` (`--ue-icon-*`).
3. **Binding** — `::before` pseudo-elements, `<img>` tags (asset browser), and `theme-ui-icon-sync` client plugin (blog-type active tabs in light mode).

There is no single index of which DOM surface uses which variable in which state. Known pain points include `#color-mode-switch` centering (hidden Hope children still occupy flex space), light-mode blog-type active tabs deliberately using inactive icons, `-on` variants with low contrast on pale pill backgrounds, and several assets lacking dark variants (`copy.svg`, `back-to-top.svg`, `assets/*.svg`).

The detailed implementation plan lives at `docs/superpowers/plans/2026-07-03-icon-visibility-audit.md`.

## Goals / Non-Goals

**Goals:**

- Produce a complete, machine-readable inventory of audited UI surfaces with theme × state dimensions.
- Fail CI when SCSS references missing icon files.
- Provide Playwright screenshot baselines for key routes in light/dark.
- Document findings with severity, observation, and suggested fix in a single markdown file.
- Cover both classic blog layout (`html:not(.unity-editor-active)`) and Unity Editor layout (`html.unity-editor-active`).

**Non-Goals:**

- Fixing visibility issues in this change (follow-up change from findings).
- Restyling DocSearch / Algolia magnifier (record as out-of-scope in findings).
- Replacing Hope components or forking theme icon logic.
- Pixel-perfect visual regression CI (screenshots are human-review baselines, not diff gates).
- Adding `sharp` as a required dependency unless contrast script is explicitly implemented.

## Decisions

### 1. Three-script audit pipeline (not one monolith)

**Decision:** Separate `audit-icon-assets.mjs` (file existence), `audit-icon-inventory.mjs` (surface matrix JSON), and `icon-visibility-screenshots.mjs` (Playwright).

**Rationale:** Asset checks are fast, deterministic, and belong in `npm test`. Inventory generation is static data. Screenshots need a running dev server and are slow/optional for CI.

**Alternatives considered:**

| Option | Verdict |
|--------|---------|
| Single audit CLI with subcommands | Rejected — over-abstraction for ~3 scripts |
| Only manual checklist | Rejected — no CI guard for missing assets |

### 2. Inventory as curated SURFACES array + generated matrix

**Decision:** Maintain a hand-curated `SURFACES` list in `audit-icon-inventory.mjs` (IDs like `NAV-06`, selectors, CSS var names, states). Script expands by `THEMES` × `states` into JSON; a one-liner or script emits markdown checklist.

**Rationale:** Full SCSS parsing for selector→var mapping is fragile; curated list matches the plan's 80+ row matrix and stays reviewable in PRs.

### 3. Asset audit scope: SCSS `url()` paths + manifest cross-check

**Decision:** Parse `index.scss` + `unity-editor.scss` for `url('/assets/icon/...')` paths. Report `missing` (file not on disk) as test failure; report `unmanifested` Unity paths as warning (manual review).

**Rationale:** Catches broken references immediately. Manifest gaps may be intentional (legacy PNG aliases).

### 4. Screenshot scenarios: fixed route set

**Decision:** Default scenarios: home light/dark, algorithm active light/dark, blog-type light/dark, article meta light, mobile nav light. Base URL from `AUDIT_BASE_URL` env (default `http://localhost:8080`). Output to `docs/superpowers/audits/screenshots/`.

**Rationale:** Covers navbar, sidebar active, blog-type, and mobile without exhaustive combinatorial explosion.

### 5. Findings schema

**Decision:** Table columns: `ID | Severity | Theme | State | Observation | Suggested fix`. Severity ∈ {high, medium, low}. Summary section at end with counts and top fixes.

**Rationale:** Aligns matrix IDs (`NAV-06`) with fix tracking; enables follow-up OpenSpec change prioritization.

### 6. CI integration: asset test only

**Decision:** Add `scripts/icon-visibility-audit.test.mjs` to `package.json` `test` script. Do not run Playwright in default `npm test`.

**Rationale:** Playwright requires browser + dev server; too heavy for every PR. Screenshots run on demand during audit.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Hope DOM changes break `:has()` color-mode detection | Document in findings; screenshot script catches navbar regressions |
| Curated SURFACES list drifts from SCSS | Re-run inventory when adding new icon surfaces; asset test catches missing files |
| Light-mode blog-type "inactive on active" is intentional | Record as low severity / design note, not auto-fail |
| Screenshots differ across OS/font | Use for human diff only, not automated pixel compare |
| `sharp` not in dependencies | Contrast script (Task 6) is optional; skip if dep not added |

## Migration Plan

1. Land scripts and tests — `npm test` gains asset integrity check (should pass on current tree).
2. Generate inventory JSON + matrix markdown.
3. Run dev server + screenshot script locally; fill findings from manual pass.
4. Archive change; open `icon-visibility-fixes` change from findings summary.

No production deploy impact — audit artifacts only.

## Open Questions

- Whether to gitignore `docs/superpowers/audits/screenshots/` (large binaries) or commit a minimal baseline set.
- Whether blog-type light active inactive-icon behavior should remain design-intent or become a fix in the follow-up change.

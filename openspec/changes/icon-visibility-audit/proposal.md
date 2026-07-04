## Why

The blog uses 50+ Unity-themed icons across classic and Unity Editor layouts, bound via CSS custom properties (`--unity-theme-ui-*`, `--ue-icon-*`) and pseudo-elements. Several surfaces already show visibility issues—color-mode switch misalignment, light-mode blog-type active tabs using low-contrast inactive icons, and assets without dark variants—yet there is no systematic inventory, automated asset check, or tracked test matrix. A structured audit is needed before fixing icons piecemeal and regressing other states.

## What Changes

- Add Node scripts to validate that every icon URL referenced in SCSS exists on disk and aligns with `icon-manifest.json`.
- Generate a machine-readable inventory and human checklist matrix covering navbar, sidebar, blog-type, meta, FAB, code copy, back-to-top, and Unity Editor surfaces across light/dark themes and default/active/hover/open states.
- Add a Playwright screenshot script for cross-theme visual baselines of key routes.
- Produce `icon-visibility-findings.md` documenting issues with severity and suggested fixes.
- Wire asset-integrity tests into `npm test` so missing icons fail CI.
- Optional contrast sampling script for navbar regions (enhancement, not blocking).

No user-facing theme behavior changes in this change—audit and tooling only. Follow-up fixes will be a separate change.

## Capabilities

### New Capabilities

- `icon-asset-integrity`: Automated validation that SCSS-referenced icon files exist, manifest coverage is reviewed, and tests run in CI.
- `icon-visibility-audit`: UI surface inventory, test matrix, Playwright screenshot baselines, manual audit workflow, and findings documentation for classic and Unity Editor layouts.

### Modified Capabilities

<!-- No existing spec requirements change; this change adds audit infrastructure only -->

## Impact

- **Scripts:** New files under `scripts/` — `audit-icon-assets.mjs`, `audit-icon-inventory.mjs`, `icon-visibility-audit.test.mjs`, `icon-visibility-screenshots.mjs`, optional `audit-icon-contrast.mjs`
- **Docs:** New `docs/superpowers/audits/` — inventory JSON, test matrix, findings, screenshots (screenshots may be gitignored)
- **Package:** `package.json` `test` script extended to include icon audit tests
- **Reference only (read, not modified in audit):** `index.scss`, `unity-editor.scss`, `theme-ui-icon-sync/client.ts`, `icon-manifest.json`
- **Dependencies:** Uses existing Playwright devDependency; optional `sharp` only if contrast script is implemented

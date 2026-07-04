## ADDED Requirements

### Requirement: UI surface inventory is machine-readable

The system SHALL generate a JSON inventory enumerating audited icon surfaces with stable IDs, DOM selectors, CSS variable names, layout context (classic or unity-editor), viewport notes, and theme × state combinations.

#### Scenario: Inventory generation

- **WHEN** `node scripts/audit-icon-inventory.mjs` runs
- **THEN** it SHALL write `docs/superpowers/audits/icon-visibility-inventory.json`
- **AND** each row SHALL include at minimum: `id`, `area`, `selector`, `theme`, `state`, and associated CSS variable prefix

#### Scenario: Matrix markdown derived from inventory

- **WHEN** inventory JSON exists
- **THEN** a human-readable checklist at `docs/superpowers/audits/icon-visibility-matrix.md` SHALL list all matrix rows with Pass column placeholders for manual audit

### Requirement: Classic layout surfaces are in audit scope

The inventory SHALL include navbar (center links, dropdowns, color-mode, appearance, language, menu toggle), desktop sidebar (links, foldout carets, collapse button), blog-type tabs, article meta icons, social links, FAB, code copy, back-to-top, and page navigation chevrons.

#### Scenario: Navbar color mode covered

- **WHEN** inventory is generated
- **THEN** rows with id `NAV-06` SHALL exist for `#color-mode-switch` in both light and dark themes
- **AND** states SHALL include auto, dark, and light modes

#### Scenario: Blog type tabs covered

- **WHEN** inventory is generated
- **THEN** rows SHALL exist for `.vp-blog-type-icon-wrapper` active state in light and dark themes
- **AND** notes SHALL document light-mode inactive-icon behavior via JS sync

### Requirement: Unity Editor layout surfaces are in audit scope

The inventory SHALL include Unity toolbar search and view icons, hierarchy foldout carets, folder open/closed icons, asset browser type icons, and editor color-mode switch.

#### Scenario: Hierarchy foldout covered

- **WHEN** inventory is generated
- **THEN** rows with id `UE-02` SHALL exist for `.unity-foldout-icon` in collapsed and expanded states for both themes

### Requirement: Playwright screenshot baselines exist for key routes

The system SHALL provide a script that captures navbar (and sidebar where applicable) screenshots for predefined routes in light and dark themes.

#### Scenario: Screenshot script output

- **WHEN** dev server is reachable at `AUDIT_BASE_URL` (default `http://localhost:8080`) and `node scripts/icon-visibility-screenshots.mjs` runs
- **THEN** PNG files SHALL be written under `docs/superpowers/audits/screenshots/`
- **AND** scenarios SHALL include at minimum: home light/dark, algorithm active light/dark, blog-type light/dark

#### Scenario: Theme applied before capture

- **WHEN** a screenshot scenario specifies `theme: 'dark'`
- **THEN** the script SHALL set `document.documentElement.dataset.theme` and persist scheme in localStorage before capture

### Requirement: Findings document records visibility issues

The audit SHALL produce `docs/superpowers/audits/icon-visibility-findings.md` with a table of issues linking matrix IDs to severity, theme, state, observation, and suggested fix.

#### Scenario: Finding entry format

- **WHEN** an auditor records a visibility problem for matrix id `NAV-06` in light auto state
- **THEN** the findings table SHALL include a row with columns: ID, Severity, Theme, State, Observation, Suggested fix
- **AND** severity SHALL be one of: high, medium, low

#### Scenario: Audit summary

- **WHEN** manual and automated audit passes complete
- **THEN** findings SHALL include a Summary section with total surfaces audited, issue counts by severity, top recommended fixes, and explicitly out-of-scope items (e.g. DocSearch)

### Requirement: Known risk areas are explicitly tested

The manual audit workflow SHALL verify behavior called out as high-risk: color-mode switch centering, blog-type light active contrast, `-on` icons on light pill backgrounds, assets without dark variants, social icon hover filters, and Articles vs Unity Best Practice mutual highlight rules.

#### Scenario: Color-mode centering checked

- **WHEN** manual audit executes NAV-06 for classic navbar
- **THEN** findings or matrix Pass column SHALL record whether auto/dark/light icons are visible and centered in the 32×32px control

#### Scenario: Mutual highlight checked

- **WHEN** user navigates to `/posts/unity-best-practice/` with Articles dropdown inactive
- **THEN** audit SHALL confirm Articles nav item is not incorrectly highlighted (NAV-05)

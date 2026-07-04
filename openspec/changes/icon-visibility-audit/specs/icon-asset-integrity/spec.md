## ADDED Requirements

### Requirement: SCSS-referenced icon files exist on disk

The system SHALL validate that every icon URL referenced via `url(...)` in `docs/.vuepress/styles/index.scss` and `docs/.vuepress/styles/unity-editor.scss` resolves to an existing file under `docs/.vuepress/public/`.

#### Scenario: All referenced paths resolve

- **WHEN** the asset integrity audit runs against the current SCSS and public directory
- **THEN** the set of missing file paths SHALL be empty
- **AND** the audit SHALL report success when no files are missing

#### Scenario: Missing file fails audit

- **WHEN** SCSS references `/assets/icon/unity/theme-ui/light/example.svg` and that file does not exist on disk
- **THEN** the audit SHALL include that path in the `missing` list
- **AND** the automated test SHALL fail with the missing path names

### Requirement: Manifest coverage is reviewed for Unity icon paths

The system SHALL cross-check SCSS-referenced paths under `/assets/icon/unity/` against entries in `docs/.vuepress/icon-manifest.json` and flag paths not covered by manifest destinations for manual review.

#### Scenario: Unmanifested Unity path reported

- **WHEN** SCSS references a Unity icon URL that is not derived from any manifest `dest` entry
- **THEN** the audit SHALL include that URL in the `unmanifested` list
- **AND** the audit SHALL emit a warning (not a hard failure) unless configured otherwise

### Requirement: Asset integrity tests run in CI

The icon asset integrity checks SHALL be included in the project's `npm test` command so missing icons fail continuous integration.

#### Scenario: npm test includes icon audit

- **WHEN** a developer runs `npm test`
- **THEN** `scripts/icon-visibility-audit.test.mjs` SHALL execute
- **AND** a missing referenced icon SHALL cause the test suite to exit non-zero

### Requirement: URL extraction from SCSS is reliable

The asset audit SHALL extract icon paths matching the pattern `url('...')` or `url("...")` with paths starting with `/assets/icon/`.

#### Scenario: Theme-ui URL extracted

- **WHEN** SCSS contains `background: url('/assets/icon/unity/theme-ui/light/menu.svg');`
- **THEN** extraction SHALL return `/assets/icon/unity/theme-ui/light/menu.svg`

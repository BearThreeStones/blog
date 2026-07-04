## 1. Icon asset integrity (icon-asset-integrity)

- [ ] 1.1 Create `scripts/audit-icon-assets.mjs` — extract `url('/assets/icon/...')` from `index.scss` + `unity-editor.scss`, report `missing` and `unmanifested` paths
- [ ] 1.2 Create `scripts/icon-visibility-audit.test.mjs` — test URL extraction and assert zero missing files
- [ ] 1.3 Run `node --test scripts/icon-visibility-audit.test.mjs` and confirm PASS on current tree
- [ ] 1.4 Add `scripts/icon-visibility-audit.test.mjs` to `package.json` `test` script

## 2. UI surface inventory (icon-visibility-audit)

- [ ] 2.1 Create `scripts/audit-icon-inventory.mjs` with curated `SURFACES` array (navbar, sidebar, blog-type, meta, FAB, code copy, back-to-top, Unity Editor toolbar/hierarchy/assets)
- [ ] 2.2 Run script to generate `docs/superpowers/audits/icon-visibility-inventory.json`
- [ ] 2.3 Generate `docs/superpowers/audits/icon-visibility-matrix.md` checklist from inventory JSON (Pass column placeholders)

## 3. Playwright screenshot baselines

- [ ] 3.1 Create `scripts/icon-visibility-screenshots.mjs` — scenarios: home, algorithm active, blog-type, article meta, mobile nav; light/dark via `dataset.theme` + localStorage
- [ ] 3.2 Run against `npm run docs:dev` at `http://localhost:8080`; output to `docs/superpowers/audits/screenshots/`
- [ ] 3.3 Compare light/dark screenshot pairs; note contrast or alignment issues for findings

## 4. Manual audit — classic layout

- [ ] 4.1 Create `docs/superpowers/audits/icon-visibility-findings.md` with findings table template
- [ ] 4.2 Audit navbar NAV-01–08 (light + dark): default, active, dropdown open, color-mode 3 states, appearance, language
- [ ] 4.3 Audit sidebar SID-01–03, blog-type BLOG-01/02, meta META-01, code CODE-01, back-to-top BTT-01, FAB FAB-01
- [ ] 4.4 Audit mobile ≤960px: NAV-09, blog-type mobile, FAB
- [ ] 4.5 Verify NAV-05 mutual highlight (Unity Best Practice must not incorrectly highlight Articles)
- [ ] 4.6 Update matrix Pass column and findings rows for classic layout

## 5. Manual audit — Unity Editor layout

- [ ] 5.1 Enter editor view via FAB or `?view=editor`; audit UE-01 toolbar icons (light + dark)
- [ ] 5.2 Audit UE-02 hierarchy foldout caret toggle and UE-03 asset browser icon readability
- [ ] 5.3 Audit editor color-mode switch (compare with classic NAV-06 behavior)
- [ ] 5.4 Update findings and matrix for Unity Editor surfaces

## 6. Optional contrast sampling

- [ ] 6.1 Create `scripts/audit-icon-contrast.mjs` (requires `sharp`) — sample navbar screenshot regions, report WCAG contrast ratio ≥3.0
- [ ] 6.2 Run contrast script on screenshot baselines; append FAIL items to findings

## 7. Audit summary and closure

- [ ] 7.1 Add Summary section to findings: total surfaces, issue counts by severity, top fixes, out-of-scope items (DocSearch)
- [ ] 7.2 Run full `npm test` to confirm asset integrity in CI
- [ ] 7.3 Note follow-up change name (`icon-visibility-fixes`) for remediation items in findings

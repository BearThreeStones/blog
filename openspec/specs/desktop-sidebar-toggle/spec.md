# desktop-sidebar-toggle

## Purpose

Desktop navbar sidebar toggle collapses the left sidebar inline without mobile overlay behavior.

## Requirements

### Requirement: Desktop navbar toggle collapses sidebar without overlay

On viewports wider than 960px, the navbar sidebar toggle button SHALL collapse or expand the left sidebar as an inline layout change and SHALL NOT display the mobile sidebar mask overlay.

#### Scenario: Collapse sidebar on desktop

- **WHEN** viewport width is greater than 960px and user clicks `vp-toggle-sidebar-button`
- **THEN** `.theme-container` SHALL gain or lose the `sidebar-collapsed` class
- **AND** the left sidebar SHALL animate off-screen to the left (or equivalent RTL behavior)
- **AND** main content SHALL expand into the freed horizontal space
- **AND** `vp-sidebar-mask` SHALL NOT be visible

#### Scenario: Expand sidebar from collapsed state

- **WHEN** viewport width is greater than 960px, sidebar is collapsed, and user clicks `vp-toggle-sidebar-button`
- **THEN** `sidebar-collapsed` SHALL be removed from `.theme-container`
- **AND** the sidebar SHALL return to its default visible position
- **AND** main content padding SHALL restore to the theme default

### Requirement: Navbar sidebar toggle hidden on narrow viewports

On viewports at or below 960px, the navbar sidebar toggle button SHALL NOT be shown.

#### Scenario: Narrow viewport navigation

- **WHEN** viewport width is 960px or less
- **THEN** `vp-toggle-sidebar-button` SHALL NOT be visible
- **AND** users SHALL rely on `vp-toggle-navbar-button` for primary navigation

### Requirement: Collapsed state persists across navigations

The desktop sidebar collapsed preference SHALL persist across in-site page navigations within the same browser profile.

#### Scenario: Navigate while collapsed

- **WHEN** user collapses the sidebar on desktop and navigates to another article page
- **THEN** the sidebar SHALL remain collapsed on the new page
- **AND** the preference SHALL be read from `localStorage` key `blog:sidebar-collapsed`

#### Scenario: Fresh session default

- **WHEN** no `blog:sidebar-collapsed` value exists in `localStorage`
- **THEN** the sidebar SHALL default to expanded on first visit

### Requirement: Toggle control is accessible and localized

The sidebar toggle button SHALL expose Chinese labels and respect reduced motion preferences.

#### Scenario: Button labels

- **WHEN** sidebar is expanded on desktop
- **THEN** the toggle button `title` or `aria-label` SHALL indicate 收起侧栏
- **WHEN** sidebar is collapsed on desktop
- **THEN** the toggle button `title` or `aria-label` SHALL indicate 展开侧栏

#### Scenario: Reduced motion

- **WHEN** `prefers-reduced-motion: reduce` is active and user toggles sidebar on desktop
- **THEN** collapse or expand SHALL occur without spatial transition animation
- **AND** final layout state SHALL match the non-reduced-motion end state

### Requirement: Unity editor modes unaffected

Sidebar toggle customization SHALL NOT alter layouts where the sidebar is intentionally hidden.

#### Scenario: Unity editor active

- **WHEN** `html.unity-editor-active` is present
- **THEN** existing rules hiding sidebar and toggle controls SHALL remain in effect
- **AND** the desktop sidebar toggle plugin SHALL NOT attach handlers or mutate layout

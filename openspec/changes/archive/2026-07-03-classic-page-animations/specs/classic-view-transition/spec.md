## ADDED Requirements

### Requirement: View mode switch uses coordinated transition

Switching between classic home and Unity Editor home via existing controls SHALL show a brief coordinated transition instead of an abrupt swap.

#### Scenario: Classic to editor via FAB

- **WHEN** user clicks the classic-home FAB to switch to editor mode
- **THEN** the outgoing classic home view SHALL fade or cross-fade out over 200–350ms
- **AND** navigation to editor home SHALL proceed without blocking longer than 400ms waiting for animation
- **AND** the editor home SHALL fade in on arrival

#### Scenario: Editor to classic via toolbar control

- **WHEN** user clicks the editor toolbar control to switch to classic mode
- **THEN** the same coordinated transition pattern SHALL apply in the reverse direction
- **AND** classic home hero entrance MAY begin after the cross-fade completes

### Requirement: Transition state is persisted as today

View-mode transition animations SHALL NOT change existing persistence behavior for home view preference.

#### Scenario: Preference storage

- **WHEN** user switches view mode with animation active
- **THEN** `localStorage` key `stonybear-home-view` SHALL still be set to `classic` or `editor` as today
- **AND** direct URL entry to `/classic/` or `/` SHALL still respect stored preference via existing redirect logic

### Requirement: View transition respects reduced motion preference

Mode-switch transitions SHALL honor `prefers-reduced-motion`.

#### Scenario: Reduced motion enabled

- **WHEN** `prefers-reduced-motion: reduce` is active and user switches view mode
- **THEN** navigation SHALL occur immediately with no cross-fade overlay
- **AND** functionality SHALL remain identical to current behavior aside from animation

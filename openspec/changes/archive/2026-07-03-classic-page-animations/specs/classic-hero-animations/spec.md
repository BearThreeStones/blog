## ADDED Requirements

### Requirement: Hero elements animate on classic home load

On the classic blog home route, hero content SHALL play a staged entrance animation when the page first becomes visible.

#### Scenario: First visit to classic home

- **WHEN** user navigates to `/classic/` or `/en/classic/` and the hero is rendered
- **THEN** the hero title SHALL fade and translate into place
- **AND** the hero tagline SHALL animate after the title with a short stagger delay
- **AND** hero action buttons SHALL animate after the tagline with a further stagger delay
- **AND** total staged entrance duration SHALL NOT exceed 1.2 seconds under normal conditions

#### Scenario: Return navigation within same session

- **WHEN** user navigates away from classic home and returns within the same browser session
- **THEN** hero entrance animations MAY replay OR remain in final visible state
- **AND** the page SHALL NOT flash blank hero content during the transition

### Requirement: Hero background may use subtle ambient motion

The classic home hero background MAY include a low-amplitude decorative motion effect that does not distract from text readability.

#### Scenario: Light and dark hero backgrounds

- **WHEN** classic home is shown in light or dark theme
- **THEN** the configured hero background (`bgImage` / `bgImageDark`) SHALL remain visible
- **AND** any ambient motion SHALL be limited to opacity, scale, or slow positional drift under 3% of viewport size
- **AND** hero title and tagline contrast SHALL remain readable without additional user action

### Requirement: Hero animations respect reduced motion preference

Hero entrance and background motion SHALL honor the user's `prefers-reduced-motion` system setting.

#### Scenario: Reduced motion enabled

- **WHEN** `prefers-reduced-motion: reduce` is active
- **THEN** hero text and buttons SHALL appear immediately without staggered translation
- **AND** ambient background motion SHALL be disabled
- **AND** opacity-only fade MAY be used up to 150ms total

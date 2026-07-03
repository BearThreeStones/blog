## ADDED Requirements

### Requirement: Blog article cards reveal on scroll

Article cards on the classic home blog list SHALL animate into view when entering the viewport.

#### Scenario: Initial cards below fold

- **WHEN** classic home loads and article cards are outside the viewport
- **THEN** each card SHALL remain in a pre-reveal state until it intersects the viewport
- **AND** upon intersection the card SHALL fade in and translate upward into its resting position
- **AND** cards SHALL use a stagger based on DOM order (approximately 50–80ms between siblings in the same row batch)

#### Scenario: Cards already in viewport on load

- **WHEN** classic home loads and one or more article cards are already visible
- **THEN** those visible cards SHALL animate in without requiring user scroll
- **AND** animation SHALL complete within 600ms per card

### Requirement: Scroll reveal is scoped to classic home list

Scroll-reveal behavior SHALL apply only to classic home blog content, not site-wide article pages.

#### Scenario: Article detail page

- **WHEN** user opens any blog article page (non-classic-home route)
- **THEN** scroll-reveal list animations SHALL NOT run on article body or unrelated list widgets

#### Scenario: Classic home pagination or tab switch

- **WHEN** user changes blog type tabs or paginates on classic home
- **THEN** newly rendered article cards SHALL be eligible for scroll reveal
- **AND** previously revealed cards SHALL NOT re-animate unless the list is fully re-mounted

### Requirement: Scroll reveal respects reduced motion preference

Scroll-reveal animations SHALL degrade when reduced motion is requested.

#### Scenario: Reduced motion enabled

- **WHEN** `prefers-reduced-motion: reduce` is active
- **THEN** article cards SHALL appear immediately with no scroll-triggered translation
- **AND** intersection logic MAY still run but SHALL NOT delay visibility

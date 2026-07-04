# unity-game-preview-display

## Purpose

Unity WebGL player shows a preview poster in INITIAL state before the user loads the game.

## Requirements

### Requirement: INITIAL state shows game preview poster

The Unity player component SHALL display a preview poster image as the full-bleed background of the INITIAL state container when a preview file is available for the game.

#### Scenario: Preview exists on server

- **WHEN** the player is in INITIAL state and `HEAD /games/{gamePath}/preview.webp` returns HTTP 200
- **THEN** the container background SHALL show that image with `object-fit: cover` preserving aspect ratio
- **AND** the existing Load Game button and game name SHALL remain visible overlaid on the poster

#### Scenario: Preview does not exist

- **WHEN** the player is in INITIAL state and the preview file is missing or unreachable
- **THEN** the container SHALL use the existing solid background color (`backgroundColor` prop or `#231F20` default)
- **AND** no broken-image icon or error state SHALL be shown

### Requirement: Preview does not block game loading

The preview poster SHALL be decorative only and MUST NOT preload or execute the Unity WebGL build.

#### Scenario: User clicks Load Game

- **WHEN** user clicks Load Game while a preview poster is displayed
- **THEN** the component SHALL transition to LOADING state and load the Unity build as today
- **AND** the poster SHALL be hidden once runtime canvas is shown

### Requirement: Preview URL convention

The preview image URL SHALL be derived from the game path without additional markdown syntax.

#### Scenario: Standard game embed

- **WHEN** markdown contains `![game](strategy)` or `![game](strategy?width=800&height=600)`
- **THEN** the preview URL SHALL be `/games/strategy/preview.webp`

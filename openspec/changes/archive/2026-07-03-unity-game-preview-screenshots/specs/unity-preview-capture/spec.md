## ADDED Requirements

### Requirement: CI captures preview before game deploy

The game deploy pipeline SHALL generate a `preview.webp` for each game being deployed before rsync uploads the game directory.

#### Scenario: Changed games deploy

- **WHEN** `deploy-games-changed` runs for games with git changes
- **THEN** the pipeline SHALL capture previews only for those changed games
- **AND** each captured `preview.webp` SHALL be written to `docs/.vuepress/public/games/{slug}/preview.webp`
- **AND** rsync SHALL include the preview file in the deployed game folder

#### Scenario: Full games deploy

- **WHEN** `deploy-games-batch` runs (force deploy all games)
- **THEN** the pipeline SHALL capture previews for every game in that batch before rsync

### Requirement: Headless browser loads real WebGL build

The capture pipeline SHALL use headless Chromium with WebGL enabled to load the actual Unity WebGL build from a local static file server.

#### Scenario: Successful capture

- **WHEN** capture runs for a valid game with `Build/*.loader.js`
- **THEN** the script SHALL start a local HTTP server serving the game directory (with gzip assets expanded or correct Content-Encoding headers)
- **AND** navigate to a minimal HTML harness that calls `createUnityInstance`
- **AND** wait until the Unity canvas has non-black pixel content or a configurable timeout elapses
- **AND** save a WebP screenshot matching the game's configured default aspect ratio (800×450 unless overridden per game metadata)

#### Scenario: Capture failure

- **WHEN** capture fails for a game (timeout, WebGL error, missing build)
- **THEN** the deploy job SHALL log a warning with the game slug and error
- **AND** SHALL continue deploying the game without blocking other games
- **AND** SHALL not delete an existing `preview.webp` if one is already present

### Requirement: Local capture script mirrors CI

The repository SHALL provide an npm script to run the same capture logic locally for development and debugging.

#### Scenario: Developer runs local capture

- **WHEN** developer runs `npm run capture:game-previews -- strategy`
- **THEN** the script SHALL capture preview for the named game (or all games if no slug given)
- **AND** write output to `docs/.vuepress/public/games/{slug}/preview.webp`

### Requirement: Preview artifacts are not in main site build

Preview images SHALL be deployed only via the games rsync path, consistent with existing game asset separation.

#### Scenario: Site deploy excludes games

- **WHEN** `deploy.sh` builds the static site with games moved aside
- **THEN** `preview.webp` files SHALL NOT be required in `docs/.vuepress/dist`
- **AND** production previews SHALL be served from `/games/{slug}/preview.webp` on the deployment host

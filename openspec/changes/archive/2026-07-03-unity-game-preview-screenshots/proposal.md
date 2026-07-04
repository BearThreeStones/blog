## Why

Unity WebGL embeds in the blog currently show a dark placeholder (`#231F20`) with only a "Load Game" button before the user clicks to load the game. This looks empty and gives no visual hint of what the demo contains. Automatically capturing a gameplay screenshot during deployment and using it as the INITIAL-state background improves first impressions without requiring users to download and run the game first.

## What Changes

- Add a CI step that launches each Unity WebGL build in headless Chromium, waits for a stable frame, and saves a compressed preview image (`preview.webp`) alongside the game build.
- Run preview capture when games are deployed (changed games in normal CI; all games when force-deploying).
- Update `UnityPlayer` INITIAL state to show the preview image as a full-bleed background with the existing Load Game button overlaid.
- Deploy `preview.webp` with each game via the existing `deploy-games.sh` rsync flow (no change to main site build excluding games).
- Add fallback behavior when preview is missing: keep current dark background (no regression).
- Add a local script (`npm run capture:game-previews`) mirroring CI for developer testing.

## Capabilities

### New Capabilities

- `unity-game-preview-display`: Show a per-game preview poster image in the Unity player INITIAL state, loaded from `/games/{gamePath}/preview.webp`, with graceful fallback when absent.
- `unity-preview-capture`: Automated headless-browser pipeline to start a local static server, load each WebGL build, wait for render readiness, screenshot the canvas, and write `preview.webp` into the game directory before rsync deploy.

### Modified Capabilities

<!-- No existing openspec specs in this repo -->

## Impact

- **Components**: `docs/.vuepress/plugins/unity-webgl-plugin/components/UnityPlayer.vue` (INITIAL state UI + poster fetch)
- **CI**: `.github/workflows/deploy.yml` — new step/job in game deploy jobs (`deploy-games-changed`, `deploy-games-batch`)
- **Scripts**: New `scripts/capture-game-previews.mjs` (or similar); possible hook in `deploy-games.sh`
- **Dependencies**: Playwright (or Puppeteer) as devDependency for CI/local capture
- **Assets**: One `preview.webp` per game under `docs/.vuepress/public/games/{slug}/` (generated at deploy time, optionally gitignored or committed depending on design)
- **Server**: No nginx changes; preview served from same `/games/{slug}/` path as builds

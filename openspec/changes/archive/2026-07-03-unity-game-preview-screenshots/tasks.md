## 1. Dependencies and configuration

- [x] 1.1 Add `playwright` as devDependency and `capture:game-previews` npm script in `package.json`
- [x] 1.2 Add `docs/.vuepress/public/games/*/preview.webp` to `.gitignore`
- [x] 1.3 Document local capture usage in `unity-webgl-plugin/README.md` and `README.zh-CN.md`

## 2. Capture pipeline script

- [x] 2.1 Create `scripts/capture-game-previews.mjs` with CLI: optional game slug args, default all games
- [x] 2.2 Implement local static server for a game directory (expand `.gz` like `deploy-games.sh` or serve with gzip headers)
- [x] 2.3 Port or share Unity build detection logic (`loader.js`, `build.data`, etc.) for the capture harness
- [x] 2.4 Create minimal `preview-harness.html` template loaded via Playwright with 800×450 canvas
- [x] 2.5 Implement canvas readiness polling (non-black pixel threshold) with 90s timeout and single retry
- [x] 2.6 Save screenshot as WebP to `docs/.vuepress/public/games/{slug}/preview.webp`
- [x] 2.7 On failure: log warning, preserve existing preview if present, exit 0 for that game

## 3. Deploy integration

- [x] 3.1 Add `capture-previews` subcommand to `deploy-games.sh` (accepts same game list as deploy)
- [x] 3.2 Call capture before `_deploy_one_game` in `changed`, `batch`, and single-game paths
- [x] 3.3 Update `.github/workflows/deploy.yml`: install Playwright browsers in `deploy-games-changed` and `deploy-games-batch` jobs before deploy step
- [x] 3.4 Verify rsync includes `preview.webp` at game root without script changes (already copies full tree)

## 4. UnityPlayer preview display

- [x] 4.1 On mount in INITIAL state, `HEAD` `/games/{gamePath}/preview.webp` and cache availability
- [x] 4.2 Add poster background to `.unity-initial-state` with `object-fit: cover` and subtle dark overlay for button contrast
- [x] 4.3 Ensure poster hidden in LOADING/LOADED/ERROR states; no Unity preload triggered
- [x] 4.4 Verify fallback: missing preview keeps current `#231F20` background with no console errors

## 5. Validation

- [x] 5.1 Run `npm run capture:game-previews -- strategy` locally and confirm `preview.webp` generated
- [x] 5.2 Run `npm run docs:dev`, embed `![game](strategy)`, confirm INITIAL state shows poster before Load Game
- [x] 5.3 Test game without preview (delete local file) confirms dark fallback
- [x] 5.4 Dry-run CI steps: capture + deploy for one changed game slug

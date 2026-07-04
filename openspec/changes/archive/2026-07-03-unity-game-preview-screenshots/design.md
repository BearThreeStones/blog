## Context

The blog embeds ~14 Unity WebGL demos via `UnityPlayer.vue` using click-to-play loading. INITIAL state is a dark box with a Load Game button. Games are large and deployed separately from the static site (`deploy.sh` excludes `public/games`; `deploy-games.sh` rsyncs to `/games/{slug}/` on the server). The user chose **Option A**: fully automated preview capture during CI game deploy—no manual screenshot commits.

Relevant files:
- `docs/.vuepress/plugins/unity-webgl-plugin/components/UnityPlayer.vue`
- `deploy-games.sh`, `.github/workflows/deploy.yml`
- Game builds: `docs/.vuepress/public/games/{slug}/Build/`

## Goals / Non-Goals

**Goals:**

- Replace black INITIAL-state background with a representative gameplay screenshot on production.
- Automate capture in CI whenever games are deployed (changed or batch).
- Zero markdown syntax changes (`![game](slug)` stays the same).
- Graceful degradation when preview missing or capture fails.

**Non-Goals:**

- Manual preview upload workflow (Option B/C).
- Capturing previews during main site `deploy-site` job (games not present in that build).
- Video/GIF previews or animated posters.
- Changing Unity export settings or in-game screenshot APIs.
- Committing generated `preview.webp` to git (generated at deploy time only).

## Decisions

### 1. Preview file location and format

**Decision:** `/games/{slug}/preview.webp` at the game root (sibling to `Build/`), WebP at ~80% quality, max width 800px.

**Rationale:** WebP keeps rsync payload small. Co-locating with the game means one rsync deploys both build and preview. Fixed width matches default `UnityPlayer` width.

**Alternatives considered:**
- Store in main site `public/assets/game-previews/` — rejected; would require site redeploy when only games change.
- PNG — larger files across 14+ games.

### 2. Capture tool: Playwright

**Decision:** Use `@playwright/test` or `playwright` package with Chromium, `--enable-webgl` (default in headless new mode).

**Rationale:** Reliable WebGL in CI, good screenshot API, maintained GitHub Action (`microsoft/playwright-github-action`).

**Alternatives:**
- Puppeteer — similar but Playwright's wait-for-function and tracing help debug flaky Unity loads.
- Unity Editor screenshot — not WebGL-accurate, requires Unity on CI.

### 3. Capture harness page

**Decision:** Generate a minimal static `preview-harness.html` in a temp dir that:
1. Serves the game's `Build/` with a tiny static server (`serve-handler` or `http-server`).
2. Mirrors `UnityPlayer`'s `detectBuildFiles` / `createUnityInstance` flow.
3. Uses a fixed canvas size (800×450) for consistent crops.

**Rationale:** Reuses same loader detection logic as production; no need to hit production URLs during CI.

### 4. Readiness detection

**Decision:** Poll canvas pixels until >5% of center region is non-black (RGB sum > threshold), with 90s hard timeout.

**Rationale:** Unity demos often show black for several seconds after load. Simple pixel heuristic works without game-specific hooks.

**Fallback:** If timeout, save last frame anyway and log warning (better than no preview).

### 5. CI integration point

**Decision:** Add capture step inside `deploy-games.sh` via new subcommand `capture-previews`, called from GitHub Actions **before** `_deploy_one_game` rsync. Install Playwright browsers in the games deploy jobs only.

**Rationale:** Keeps deploy logic in one shell script; both `changed` and `batch` paths share it.

```text
deploy-games-changed / deploy-games-batch
  → npm ci (or playwright install)
  → node scripts/capture-game-previews.mjs --games <list>
  → deploy-games.sh (existing rsync, now includes preview.webp)
```

### 6. UnityPlayer UI changes

**Decision:** On mount in INITIAL state, `HEAD` request to `/games/{gamePath}/preview.webp`. If 200, set CSS `background-image` on `.unity-initial-state` with a semi-transparent overlay behind the button for contrast.

**Rationale:** HEAD avoids downloading full image until needed; no build-time manifest required.

### 7. Generated artifacts not in git

**Decision:** Add `docs/.vuepress/public/games/*/preview.webp` to `.gitignore`. Previews exist only on server after deploy.

**Rationale:** Generated files; avoids repo bloat and merge noise. Local dev can run capture script if previews desired.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Unity WebGL flaky in headless CI | Pin Playwright version; retry capture once per game; log artifacts (screenshot on failure) |
| Long CI times (14 games × ~30–90s) | Only capture changed games in normal flow; batch jobs already split by size |
| First frame still black / splash screen | Pixel-readiness wait; optional per-game `preview-delay-ms` in `games/{slug}/preview.json` config |
| Local dev shows black (no preview in git) | Document `npm run capture:game-previews`; optional commit override via not gitignoring if desired later |
| Gzip assets on CI | Reuse `deploy-games.sh` staging expand logic or serve with correct headers in capture server |

## Migration Plan

1. Ship `UnityPlayer` poster support first (fallback = current behavior).
2. Add capture script + local npm command; validate on 1–2 games locally.
3. Wire into `deploy-games-changed` and `deploy-games-batch` jobs.
4. Force-deploy all games once to backfill previews on production.
5. Rollback: remove CI capture step; INITIAL state falls back to dark background automatically.

## Open Questions

- Should we add optional `preview.json` per game for custom wait time or dimensions? (Defer unless first CI run shows failures.)
- Should failed capture fail the deploy job or only warn? **Proposed: warn only** per spec.

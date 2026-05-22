# blog
分享游戏开发和算法的小网站

## 部署

仓库已经配置了 GitHub Actions 的自动部署工作流。每次向 `main` 或 `master` 分支推送代码后，Actions 会自动执行 `deploy.sh`。

首次启用时，需要在仓库的 Secrets 里配置 `DEPLOY_SSH_KEY`，内容是有权限推送到服务器仓库的 SSH 私钥。

主站部署会跳过 `docs/.vuepress/public/games`（体积过大）。Unity WebGL 需分 3 批单独同步：

| 批次 | 目录 |
|------|------|
| 1 | level-up-your-code, strategy, MVP, interface-segregation, open-closed |
| 2 | object-pool, liskov-substitution, single-responsibility, singleton, observer |
| 3 | dependency-inversion, factory, command, state, MVVM |

- **一次性跑完 3 批**：Actions → `Deploy Games (3 batches)` → Run workflow
- **只跑某一批**：Actions → `Deploy Games (batch)` → 选择 1/2/3
- **本机（需已配置 SSH）**：`sh deploy-games.sh 1`（或 `2`、`3`）
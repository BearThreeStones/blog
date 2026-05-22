# blog
分享游戏开发和算法的小网站

## 部署

仓库在 GitHub Actions 中提供 **Deploy Blog** 工作流（仅手动触发）。在 Actions 页选择该 workflow → **Run workflow** 即可执行 `deploy.sh`。

首次启用时，需要在仓库的 Secrets 里配置 `DEPLOY_SSH_KEY`，内容是有权限推送到服务器仓库的 SSH 私钥。

主站部署会跳过 `docs/.vuepress/public/games`（体积过大）。Unity WebGL 需在本机分 3 批同步（`sh deploy-games.sh 1` / `2` / `3`），批次目录见 `deploy-games.sh`。
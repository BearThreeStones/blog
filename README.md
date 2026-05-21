# blog
分享游戏开发和算法的小网站

## 部署

仓库已经配置了 GitHub Actions 的自动部署工作流。每次向 `main` 或 `master` 分支推送代码后，Actions 会自动执行 `deploy.sh`。

首次启用时，需要在仓库的 Secrets 里配置 `DEPLOY_SSH_KEY`，内容是有权限推送到服务器仓库的 SSH 私钥。
#!/usr/bin/env sh

# 确保脚本在遇到错误时停止
set -e

# 默认部署目标（可通过环境变量覆盖）
DEPLOY_HOST="${DEPLOY_HOST:-43.138.57.136}"
DEPLOY_USER="${DEPLOY_USER:-ubuntu}"
DEPLOY_PATH="${DEPLOY_PATH:-/home/www/website}"

# 默认行为：只推送到服务器。传入 --github 可同时推到 GitHub Pages。
PUSH_GITHUB=0
for arg in "$@"; do
	case "$arg" in
		--github) PUSH_GITHUB=1 ;;
	esac
done

# 生成静态文件
npm run docs:build

# 使用 rsync 部署到服务器
rsync -az --delete "docs/.vuepress/dist/" "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

# 可选：推送到 GitHub Pages（仅在显式请求时）
if [ "$PUSH_GITHUB" -eq 1 ]; then
	git remote add github https://github.com/BearThreeStones/blog.git 2>/dev/null || true
	git push -f github master:gh-pages
fi
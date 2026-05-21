#!/usr/bin/env sh

# 确保脚本在遇到错误时停止
set -e

# 默认服务器仓库（可通过环境变量覆盖）
SERVER_REPO="${SERVER_REPO:-git@43.138.57.136:/srv/git/blog.git}"

# 默认行为：只推送到服务器。传入 --github 可同时推到 GitHub Pages。
PUSH_GITHUB=0
for arg in "$@"; do
	case "$arg" in
		--github) PUSH_GITHUB=1 ;;
	esac
done

# 生成静态文件
npm run docs:build

# 进入生成的文件夹
cd docs/.vuepress/dist

# 初始化临时 Git 仓库并提交构建产物
git init
git add -A
git commit -m 'deploy' || true

# 推送到配置的服务器仓库（强制覆盖）
git remote add server "$SERVER_REPO" 2>/dev/null || true
git push -f server master

# 可选：推送到 GitHub Pages（仅在显式请求时）
if [ "$PUSH_GITHUB" -eq 1 ]; then
	git remote add github https://github.com/BearThreeStones/blog.git 2>/dev/null || true
	git push -f github master:gh-pages
fi

cd -
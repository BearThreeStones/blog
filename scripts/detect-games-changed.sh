#!/usr/bin/env sh
# 检测 games 部署模式，供 GitHub Actions 使用。
# 输出 GITHUB_OUTPUT:
#   changed=true|false
#   mode=skip|changed|all
set -e

GAMES_PREFIX="docs/.vuepress/public/games/"
MODE="skip"

if [ "${FORCE_DEPLOY_GAMES:-}" = "true" ]; then
	MODE="all"
elif [ -n "${GITHUB_EVENT_BEFORE:-}" ] && [ "${GITHUB_EVENT_BEFORE}" != "0000000000000000000000000000000000000000" ]; then
	if git diff --name-only "${GITHUB_EVENT_BEFORE}" HEAD | grep -q "^${GAMES_PREFIX}"; then
		MODE="changed"
	fi
elif git rev-parse HEAD~1 >/dev/null 2>&1; then
	if git diff --name-only HEAD~1 HEAD | grep -q "^${GAMES_PREFIX}"; then
		MODE="changed"
	fi
fi

case "$MODE" in
	all)
		echo "Unity games：全量部署（多 job 按批并行）"
		echo "changed=true" >> "${GITHUB_OUTPUT:-/dev/stdout}"
		echo "mode=all" >> "${GITHUB_OUTPUT:-/dev/stdout}"
		;;
	changed)
		echo "Unity games：仅部署变更涉及的游戏"
		echo "changed=true" >> "${GITHUB_OUTPUT:-/dev/stdout}"
		echo "mode=changed" >> "${GITHUB_OUTPUT:-/dev/stdout}"
		;;
	skip)
		echo "Unity games 无变动，跳过游戏部署"
		echo "changed=false" >> "${GITHUB_OUTPUT:-/dev/stdout}"
		echo "mode=skip" >> "${GITHUB_OUTPUT:-/dev/stdout}"
		;;
esac

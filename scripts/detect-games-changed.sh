#!/usr/bin/env sh
# 检测当前检出是否包含 public/games 变更（供 GitHub Actions 使用）
# 输出到 GITHUB_OUTPUT: changed=true|false
set -e

GAMES_PREFIX="docs/.vuepress/public/games/"
CHANGED=false

# workflow_dispatch 可强制部署
if [ "${FORCE_DEPLOY_GAMES:-}" = "true" ]; then
	CHANGED=true
fi

# push 事件：与 before SHA 对比
if [ "$CHANGED" = "false" ] && [ -n "${GITHUB_EVENT_BEFORE:-}" ] && [ "${GITHUB_EVENT_BEFORE}" != "0000000000000000000000000000000000000000" ]; then
	if git diff --name-only "${GITHUB_EVENT_BEFORE}" HEAD | grep -q "^${GAMES_PREFIX}"; then
		CHANGED=true
	fi
fi

# 回退：最近一次提交
if [ "$CHANGED" = "false" ] && git rev-parse HEAD~1 >/dev/null 2>&1; then
	if git diff --name-only HEAD~1 HEAD | grep -q "^${GAMES_PREFIX}"; then
		CHANGED=true
	fi
fi

if [ "$CHANGED" = "true" ]; then
	echo "Unity games 资源有变动，将执行 deploy-games.sh changed（仅变更的游戏）"
	echo "changed=true" >> "${GITHUB_OUTPUT:-/dev/stdout}"
else
	echo "Unity games 无变动，跳过游戏部署"
	echo "changed=false" >> "${GITHUB_OUTPUT:-/dev/stdout}"
fi

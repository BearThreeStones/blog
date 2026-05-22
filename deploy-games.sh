#!/usr/bin/env sh
# 分 3 批将 docs/.vuepress/public/games 同步到服务器（每批约 160MB）
# 用法: sh deploy-games.sh <1|2|3>
# 环境变量: DEPLOY_HOST, DEPLOY_USER, DEPLOY_PATH（与 deploy.sh 相同）

set -e

DEPLOY_HOST="${DEPLOY_HOST:-43.138.57.136}"
DEPLOY_USER="${DEPLOY_USER:-ubuntu}"
DEPLOY_PATH="${DEPLOY_PATH:-/home/www/website}"
GAMES_SRC="docs/.vuepress/public/games"

RSYNC_OPTS="-rvz --no-times --omit-dir-times --no-perms --no-owner --no-group"

_batch_dirs() {
	case "$1" in
		1) echo "level-up-your-code strategy MVP interface-segregation open-closed" ;;
		2) echo "object-pool liskov-substitution single-responsibility singleton observer" ;;
		3) echo "dependency-inversion factory command state MVVM" ;;
		*)
			echo "用法: sh deploy-games.sh <1|2|3>" >&2
			echo "  批次 1: level-up-your-code, strategy, MVP, interface-segregation, open-closed" >&2
			echo "  批次 2: object-pool, liskov-substitution, single-responsibility, singleton, observer" >&2
			echo "  批次 3: dependency-inversion, factory, command, state, MVVM" >&2
			exit 1
			;;
	esac
}

BATCH="$1"
if [ -z "$BATCH" ]; then
	_batch_dirs "" >/dev/null 2>&1 || true
	exit 1
fi

if [ ! -d "$GAMES_SRC" ]; then
	echo "未找到 $GAMES_SRC" >&2
	exit 1
fi

echo "==> 部署 games 批次 ${BATCH}/3 到 ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/games/"
for game in $(_batch_dirs "$BATCH"); do
	src="${GAMES_SRC}/${game}/"
	dest="${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/games/${game}/"
	if [ ! -d "$src" ]; then
		echo "跳过（目录不存在）: $src" >&2
		continue
	fi
	echo "---- rsync: $game"
	# shellcheck disable=SC2086
	rsync $RSYNC_OPTS "$src" "$dest"
done
echo "==> 批次 ${BATCH} 完成"

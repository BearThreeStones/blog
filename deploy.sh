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

# Unity WebGL 体积大：构建与 rsync 均跳过 games（仓库内仍保留，供本地开发）
GAMES_PUBLIC="docs/.vuepress/public/games"
GAMES_BAK=""
_restore_games_public() {
	if [ -n "$GAMES_BAK" ] && [ -d "$GAMES_BAK" ]; then
		mkdir -p "$(dirname "$GAMES_PUBLIC")"
		mv "$GAMES_BAK" "$GAMES_PUBLIC"
	fi
}
if [ -d "$GAMES_PUBLIC" ]; then
	_bak_root="$(mktemp -d 2>/dev/null || echo "/tmp/blog-games-bak-$$")"
	GAMES_BAK="${_bak_root}/games"
	echo "Temporarily moving public/games aside for deploy build..."
	mv "$GAMES_PUBLIC" "$GAMES_BAK"
	trap _restore_games_public EXIT INT TERM
fi

# 生成静态文件
npm run docs:build

_restore_games_public
trap - EXIT INT TERM

if [ -d "docs/.vuepress/dist/games" ]; then
	echo "Removing dist/games (not deployed to server)."
	rm -rf docs/.vuepress/dist/games
fi

# #region agent log
_debug_log() {
	_hid="$1"
	_msg="$2"
	_data="$3"
	_ts=$(date +%s 2>/dev/null || echo 0)
	_line="{\"sessionId\":\"f61c0e\",\"hypothesisId\":\"${_hid}\",\"location\":\"deploy.sh\",\"message\":\"${_msg}\",\"data\":${_data},\"timestamp\":$((_ts * 1000))}"
	echo "$_line" >> "${DEBUG_LOG:-debug-f61c0e.log}" 2>/dev/null || true
	echo "DEBUG $_line" >&2
}
# #endregion

RSYNC_FLAGS="-rvz --delete --no-times --omit-dir-times --no-perms --no-owner --no-group --exclude=/games/"
RSYNC_SRC="docs/.vuepress/dist/"
RSYNC_DEST="${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

# #region agent log
_debug_log "A" "rsync preflight" "{\"flags\":\"${RSYNC_FLAGS}\",\"excludes\":[\"/games/\"],\"src\":\"${RSYNC_SRC}\",\"dest_host\":\"${DEPLOY_HOST}\",\"dest_path\":\"${DEPLOY_PATH}\",\"rsync_version\":\"$(rsync --version 2>/dev/null | head -n1 | sed 's/\"/\\\\\"/g')\"}"
# #endregion

# 部署静态站点（不尝试设置目标端目录/文件时间戳与属主，避免 www 目录权限导致失败）
# shellcheck disable=SC2086
set +e
rsync $RSYNC_FLAGS "${RSYNC_SRC}" "${RSYNC_DEST}"
RSYNC_EXIT=$?
set -e

# #region agent log
_debug_log "B" "rsync finished" "{\"exit_code\":${RSYNC_EXIT}}"
_debug_log "D" "set -e behavior" "{\"will_abort\":$([ "${RSYNC_EXIT}" -ne 0 ] && echo true || echo false)}"
# #endregion

if [ "${RSYNC_EXIT}" -ne 0 ]; then
	echo "rsync failed with exit code ${RSYNC_EXIT}" >&2
	exit "${RSYNC_EXIT}"
fi

# 可选：推送到 GitHub Pages（仅在显式请求时）
if [ "$PUSH_GITHUB" -eq 1 ]; then
	git remote add github https://github.com/BearThreeStones/blog.git 2>/dev/null || true
	git push -f github master:gh-pages
fi
#!/usr/bin/env sh
# 将 docs/.vuepress/public/games 下 Unity WebGL 构建同步到服务器。
#
# 用法:
#   sh deploy-games.sh list              # 列出游戏及体积
#   sh deploy-games.sh plan              # 按体积动态分批（默认每批 ≤150MB）
#   sh deploy-games.sh all               # 部署全部游戏（逐个 rsync）
#   sh deploy-games.sh changed           # 仅部署 git 变更涉及的游戏（CI 推荐）
#   sh deploy-games.sh <game-slug>       # 部署单个游戏，如 strategy
#   sh deploy-games.sh batch <N>         # 部署动态计算的第 N 批
#   sh deploy-games.sh <N>             # 同 batch N
#
# 环境变量: DEPLOY_HOST, DEPLOY_USER, DEPLOY_PATH, GAMES_BATCH_MAX_MB（默认 150）

set -e

DEPLOY_HOST="${DEPLOY_HOST:-43.138.57.136}"
DEPLOY_USER="${DEPLOY_USER:-ubuntu}"
DEPLOY_PATH="${DEPLOY_PATH:-/home/www/website}"
GAMES_SRC="docs/.vuepress/public/games"
GAMES_BATCH_MAX_MB="${GAMES_BATCH_MAX_MB:-150}"

RSYNC_OPTS="-rvz --no-times --omit-dir-times --no-perms --no-owner --no-group"
_PLAN_DIR=""

_cleanup() {
	if [ -n "$_PLAN_DIR" ] && [ -d "$_PLAN_DIR" ]; then
		rm -rf "$_PLAN_DIR"
	fi
}
trap _cleanup EXIT INT TERM

_expand_gzip_in_tree() {
	_root="$1"
	find "$_root" -type f -name '*.gz' | while read -r _gz; do
		_out="${_gz%.gz}"
		if [ ! -f "$_out" ] || [ "$_gz" -nt "$_out" ]; then
			echo "    解压: ${_gz#$_root/} -> ${_out#$_root/}"
			gunzip -cf "$_gz" > "$_out"
		fi
	done
}

_game_size_mb() {
	_du=$(du -sm "$1" 2>/dev/null | awk '{print $1}')
	echo "${_du:-0}"
}

_is_game_dir() {
	_dir="$1"
	[ -d "$_dir" ] || return 1
	[ -d "$_dir/Build" ] || return 1
	_find_loader=$(find "$_dir/Build" -maxdepth 1 -name '*.loader.js' 2>/dev/null | head -n 1)
	[ -n "$_find_loader" ]
}

_list_games() {
	for _d in "$GAMES_SRC"/*; do
		[ -d "$_d" ] || continue
		_name=$(basename "$_d")
		if _is_game_dir "$_d"; then
			echo "$_name"
		fi
	done | sort
}

_deploy_one_game() {
	_game="$1"
	_idx="${2:-}"
	_total="${3:-}"
	src="${GAMES_SRC}/${_game}/"
	dest="${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/games/${_game}/"

	if [ ! -d "$src" ]; then
		echo "跳过（目录不存在）: $src" >&2
		return 1
	fi

	if [ -n "$_idx" ] && [ -n "$_total" ]; then
		echo "==> [${_idx}/${_total}] 部署游戏: ${_game}"
	else
		echo "==> 部署游戏: ${_game}"
	fi

	_staging="$(mktemp -d 2>/dev/null || echo "/tmp/blog-game-staging-$$-${_game}")"
	echo "---- 准备（复制并解压 .gz）"
	cp -a "$src/." "$_staging/"
	_expand_gzip_in_tree "$_staging"
	echo "---- rsync -> ${DEPLOY_PATH}/games/${_game}/"
	# shellcheck disable=SC2086
	rsync $RSYNC_OPTS "$_staging/" "$dest"
	rm -rf "$_staging"
	echo "---- 完成: ${_game}"
}

_build_batch_plan() {
	_plan_dir=$(mktemp -d 2>/dev/null || echo "/tmp/blog-games-plan-$$")
	_PLAN_DIR="$_plan_dir"
	_batch=1
	_batch_mb=0

	for _game in $(_list_games); do
		_mb=$(_game_size_mb "${GAMES_SRC}/${_game}")
		if [ "$_batch_mb" -gt 0 ] && [ $((_batch_mb + _mb)) -gt "$GAMES_BATCH_MAX_MB" ]; then
			_batch=$((_batch + 1))
			_batch_mb=0
		fi
		echo "$_game" >> "${_plan_dir}/batch-${_batch}"
		_batch_mb=$((_batch_mb + _mb))
	done

	echo "$_batch"
}

_print_plan() {
	_total_batches=$(_build_batch_plan)
	echo "共 $(_list_games | wc -w | tr -d ' ') 个游戏，动态分为 ${_total_batches} 批（每批约 ≤ ${GAMES_BATCH_MAX_MB} MB）:"
	_b=1
	while [ "$_b" -le "$_total_batches" ]; do
		_games=$(tr '\n' ' ' < "${_PLAN_DIR}/batch-${_b}" | sed 's/ $//')
		_mb=0
		for _g in $_games; do
			_mb=$((_mb + $(_game_size_mb "${GAMES_SRC}/${_g}")))
		done
		echo "  批次 ${_b} (~${_mb} MB): ${_games}"
		_b=$((_b + 1))
	done
}

_deploy_batch() {
	_n="$1"
	_total_batches=$(_build_batch_plan)
	if [ "$_n" -lt 1 ] || [ "$_n" -gt "$_total_batches" ]; then
		echo "无效批次 ${_n}，当前共 ${_total_batches} 批。运行: sh deploy-games.sh plan" >&2
		exit 1
	fi
	_games=$(cat "${_PLAN_DIR}/batch-${_n}")
	_count=$(echo "$_games" | grep -c . || true)
	_i=0
	for _game in $_games; do
		_i=$((_i + 1))
		_deploy_one_game "$_game" "$_i" "$_count"
	done
}

_git_changed_games() {
	_range=""
	if [ -n "${GITHUB_EVENT_BEFORE:-}" ] && [ "${GITHUB_EVENT_BEFORE}" != "0000000000000000000000000000000000000000" ]; then
		_range="${GITHUB_EVENT_BEFORE} HEAD"
	elif git rev-parse HEAD~1 >/dev/null 2>&1; then
		_range="HEAD~1 HEAD"
	fi

	if [ -z "$_range" ]; then
		return 0
	fi

	# shellcheck disable=SC2086
	git diff --name-only $_range 2>/dev/null \
		| grep "^docs/.vuepress/public/games/" \
		| sed 's|docs/.vuepress/public/games/\([^/]*\)/.*|\1|' \
		| sort -u
}

_deploy_changed_games() {
	_games=$(_git_changed_games)
	if [ -z "$_games" ]; then
		echo "未检测到 games 目录下的文件变更，跳过部署。"
		return 0
	fi

	_count=$(echo "$_games" | grep -c . || true)
	_i=0
	for _game in $_games; do
		if ! _is_game_dir "${GAMES_SRC}/${_game}"; then
			echo "跳过（非有效游戏目录）: ${_game}" >&2
			continue
		fi
		_i=$((_i + 1))
		_deploy_one_game "$_game" "$_i" "$_count"
	done
}

_print_usage() {
	echo "用法: sh deploy-games.sh <命令>" >&2
	echo "  list              列出游戏及体积 (MB)" >&2
	echo "  plan              显示动态分批方案" >&2
	echo "  all               部署全部游戏（逐个）" >&2
	echo "  changed           仅部署 git 变更的游戏（CI）" >&2
	echo "  <game-slug>       部署单个游戏" >&2
	echo "  batch <N> | <N>   部署动态第 N 批" >&2
}

_cmd="${1:-}"

if [ ! -d "$GAMES_SRC" ]; then
	echo "未找到 $GAMES_SRC" >&2
	exit 1
fi

if ! command -v gunzip >/dev/null 2>&1; then
	echo "需要 gunzip（gzip 包）。" >&2
	exit 1
fi

case "$_cmd" in
	""|help|-h|--help)
		_print_usage
		_list_games | while read -r _g; do
			echo "  - ${_g} ($(_game_size_mb "${GAMES_SRC}/${_g}") MB)"
		done
		;;
	list)
		for _g in $(_list_games); do
			echo "${_g}	$(_game_size_mb "${GAMES_SRC}/${_g}") MB"
		done
		;;
	plan)
		_print_plan
		;;
	all)
		_all=$(_list_games)
		_count=$(echo "$_all" | grep -c . || true)
		_i=0
		for _g in $_all; do
			_i=$((_i + 1))
			_deploy_one_game "$_g" "$_i" "$_count"
		done
		;;
	changed)
		_deploy_changed_games
		;;
	batch)
		if [ -z "${2:-}" ]; then
			echo "请指定批次号，例如: sh deploy-games.sh batch 1" >&2
			exit 1
		fi
		_deploy_batch "$2"
		;;
	[0-9]*)
		_deploy_batch "$_cmd"
		;;
	*)
		if _is_game_dir "${GAMES_SRC}/${_cmd}"; then
			_deploy_one_game "$_cmd"
		else
			echo "未知命令或游戏: ${_cmd}" >&2
			_print_usage
			exit 1
		fi
		;;
esac

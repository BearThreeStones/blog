#!/usr/bin/env sh
set -e
REMOTE_PATH="${1:-/home/www/website}"
ARCHIVE="${2:-/tmp/blog-deploy.tgz}"
cd "$REMOTE_PATH"
for item in *; do
  [ "$item" = games ] && continue
  rm -rf "$item"
done
tar -xzf "$ARCHIVE" -C "$REMOTE_PATH" --warning=no-timestamp 2>/dev/null || tar -xzf "$ARCHIVE" -C "$REMOTE_PATH" || true
rm -f "$ARCHIVE"
ls "$REMOTE_PATH/assets/app-"*.js | tail -1

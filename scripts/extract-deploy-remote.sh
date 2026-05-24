#!/usr/bin/env sh
set -e
REMOTE_PATH="${1:-/home/www/website}"
ARCHIVE="${2:-/tmp/blog-deploy.tgz}"
cd "$REMOTE_PATH"
for item in *; do
  [ "$item" = games ] && continue
  rm -rf "$item"
done
if ! tar -xzf "$ARCHIVE" -C "$REMOTE_PATH" --warning=no-timestamp 2>/dev/null; then
  tar -xzf "$ARCHIVE" -C "$REMOTE_PATH" --no-overwrite-dir || {
    echo "ERROR: failed to extract $ARCHIVE" >&2
    exit 1
  }
fi
rm -f "$ARCHIVE"
if [ ! -f "$REMOTE_PATH/index.html" ]; then
  echo "ERROR: $REMOTE_PATH/index.html missing after extract — aborting." >&2
  exit 1
fi
ls "$REMOTE_PATH/assets/app-"*.js | tail -1

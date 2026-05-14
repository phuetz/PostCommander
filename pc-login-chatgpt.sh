#!/usr/bin/env sh
DIR="$(cd "$(dirname "$0")" && pwd)"
exec node "$DIR/scripts/pc-login-chatgpt.mjs" "$@"

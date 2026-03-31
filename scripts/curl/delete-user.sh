#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

USER_ID="${1:-${USER_ID:-}}"

if [ -z "$USER_ID" ]; then
  printf 'Set USER_ID in scripts/curl/.env, the current shell, or pass it as the first argument.\n' >&2
  exit 1
fi

curl --silent --show-error --fail \
  --request DELETE \
  --url "$API_BASE_URL/users/$USER_ID"

printf '\n'
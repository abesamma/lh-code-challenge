#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

ROLE="${1:-${ROLE:-patient}}"
USERNAME="${2:-${USERNAME:-${ROLE}-demo}}"

curl --silent --show-error --fail \
  --request POST \
  --url "$API_BASE_URL/login" \
  --header 'Content-Type: application/json' \
  --data @- <<EOF
{
  "username": "$USERNAME",
  "role": "$ROLE"
}
EOF

printf '\n'
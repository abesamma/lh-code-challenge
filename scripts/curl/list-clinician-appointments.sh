#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

: "${CLINICIAN_ID:?Set CLINICIAN_ID in scripts/curl/.env or the current shell.}"

query=''

if [ -n "${FROM_AT:-}" ] && [ -n "${TO_AT:-}" ]; then
  query="?from=$FROM_AT&to=$TO_AT"
elif [ -n "${FROM_AT:-}" ]; then
  query="?from=$FROM_AT"
elif [ -n "${TO_AT:-}" ]; then
  query="?to=$TO_AT"
fi

curl --silent --show-error --fail \
  --request GET \
  --url "$API_BASE_URL/clinicians/$CLINICIAN_ID/appointments$query" \
  --header 'x-role: clinician'

printf '\n'
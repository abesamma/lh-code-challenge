#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

: "${PATIENT_ID:?Set PATIENT_ID in scripts/curl/.env or the current shell.}"
: "${CLINICIAN_ID:?Set CLINICIAN_ID in scripts/curl/.env or the current shell.}"
: "${START_AT:?Set START_AT in scripts/curl/.env or the current shell.}"
: "${END_AT:?Set END_AT in scripts/curl/.env or the current shell.}"
: "${REASON:?Set REASON in scripts/curl/.env or the current shell.}"

curl --silent --show-error --fail \
  --request POST \
  --url "$API_BASE_URL/appointments" \
  --header 'Content-Type: application/json' \
  --header 'x-role: patient' \
  --data @- <<EOF
{
  "patientId": "$PATIENT_ID",
  "clinicianId": "$CLINICIAN_ID",
  "start": "$START_AT",
  "end": "$END_AT",
  "reason": "$REASON"
}
EOF

printf '\n'
#!/usr/bin/env bash
set -euo pipefail

# Required env:
#   DEVICE_USER
#   DEVICE_SECRET
#   DOMAIN_SHORT_ID
#   OCI_REGION
# Optional env:
#   REFERENCE_ENDPOINT (default: /sampletopic)

: "${DEVICE_USER:?set DEVICE_USER}"
: "${DEVICE_SECRET:?set DEVICE_SECRET}"
: "${DOMAIN_SHORT_ID:?set DOMAIN_SHORT_ID}"
: "${OCI_REGION:?set OCI_REGION}"

REFERENCE_ENDPOINT="${REFERENCE_ENDPOINT:-/sampletopic}"
REFERENCE_ENDPOINT="/${REFERENCE_ENDPOINT#/}"
URL="https://${DOMAIN_SHORT_ID}.device.iot.${OCI_REGION}.oci.oraclecloud.com${REFERENCE_ENDPOINT}"
TS="$(date -u +"%Y-%m-%dT%H:%M:%S").000000Z"

PAYLOAD="$(cat <<JSON
{
  "time": "${TS}",
  "temperature": 23.5
}
JSON
)"

curl -sS -u "${DEVICE_USER}:${DEVICE_SECRET}" \
  -H "Content-Type: application/json" \
  -d "${PAYLOAD}" \
  "${URL}"

echo

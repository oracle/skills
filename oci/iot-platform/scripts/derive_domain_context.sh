#!/usr/bin/env bash
set -euo pipefail

PROFILE=""
AUTH_MODE=""
REQUEST_REGION=""
IOT_DOMAIN_ID=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile)
      PROFILE="$2"
      shift 2
      ;;
    --auth)
      AUTH_MODE="$2"
      shift 2
      ;;
    --region)
      REQUEST_REGION="$2"
      shift 2
      ;;
    --iot-domain-id)
      IOT_DOMAIN_ID="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

if [[ -z "$IOT_DOMAIN_ID" ]]; then
  echo "Missing required --iot-domain-id" >&2
  exit 2
fi

OCI_BASE=(oci iot)
if [[ -n "$PROFILE" ]]; then
  OCI_BASE+=(--profile "$PROFILE")
fi
if [[ -n "$AUTH_MODE" ]]; then
  OCI_BASE+=(--auth "$AUTH_MODE")
fi
if [[ -n "$REQUEST_REGION" ]]; then
  OCI_BASE+=(--region "$REQUEST_REGION")
fi

DOMAIN_JSON="$("${OCI_BASE[@]}" domain get --iot-domain-id "$IOT_DOMAIN_ID" --output json)"
DEVICE_HOST="$(jq -r '.data."device-host"' <<<"$DOMAIN_JSON")"
DOMAIN_GROUP_OCID="$(jq -r '.data."iot-domain-group-id"' <<<"$DOMAIN_JSON")"

REGION="$(printf '%s' "$DEVICE_HOST" | awk -F. '{print $(NF-3)}')"
DOMAIN_SHORT_ID="$(printf '%s' "$DEVICE_HOST" | cut -d. -f1)"

DOMAIN_GROUP_JSON="$("${OCI_BASE[@]}" domain-group get --iot-domain-group-id "$DOMAIN_GROUP_OCID" --output json)"
DATA_HOST="$(jq -r '.data."data-host"' <<<"$DOMAIN_GROUP_JSON")"
DOMAIN_GROUP_SHORT_ID="$(printf '%s' "$DATA_HOST" | cut -d. -f1)"

cat <<EOF
IOT_DOMAIN_ID=$IOT_DOMAIN_ID
REGION=$REGION
DEVICE_HOST=$DEVICE_HOST
DATA_HOST=$DATA_HOST
DOMAIN_SHORT_ID=$DOMAIN_SHORT_ID
DOMAIN_GROUP_SHORT_ID=$DOMAIN_GROUP_SHORT_ID
DOMAIN_GROUP_OCID=$DOMAIN_GROUP_OCID
EOF

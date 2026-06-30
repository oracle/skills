#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "Scanning for obvious secret and internal-provenance patterns..."

MATCHES="$(rg -n --hidden \
  --glob '!.git' \
  '(/Users/[^[:space:]]+|/home/[^[:space:]]+|dashboard\.localhost|Local pre-PR|pre-PR|IAM_PASSWORD=|IAM_APP_CLIENT_SECRET=|BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY|PRIVATE KEY-----|ocid1\.(vaultsecret|certificate|user|tenancy)\.oc1\.|idcscs-|refresh_token|client_secret)' "$ROOT_DIR" \
  | rg -v 'tests/redaction_scan.sh' || true)"

if [[ -n "$MATCHES" ]]; then
  printf '%s\n' "$MATCHES"
  echo "Potential secret material found. Review before sharing."
  exit 1
fi

echo "No obvious secret or internal-provenance patterns found."

#!/usr/bin/env bash
# preflight-check.sh
# OCI CLI auth + tenancy + region + compartment validation
#
# Usage:  bash preflight-check.sh
# Exit:   0 = success
#         1 = expected error (CLI not auth'd, no compartments found)
#         2 = unexpected error (CLI not installed, parse failure)
#
# Stderr: JSON  {error_code, message, remediation, docs_url}
# Stdout: JSON  {tenancy_ocid, home_region, regions:[], compartments:[]}

set -euo pipefail

# ── helpers ──────────────────────────────────────────────────────────────────

emit_error() {
  local exit_code="$1"
  local error_code="$2"
  local message="$3"
  local remediation="$4"
  local docs_url="$5"
  printf '{"error_code":"%s","message":"%s","remediation":"%s","docs_url":"%s"}\n' \
    "$error_code" "$message" "$remediation" "$docs_url" >&2
  exit "$exit_code"
}

TMP_SUBSCRIPTIONS_JSON="$(mktemp)"
TMP_COMPARTMENTS_JSON="$(mktemp)"
TMP_REGIONS_JSON="$(mktemp)"
TMP_COMPARTMENTS_OUT_JSON="$(mktemp)"
cleanup_tmp() {
  rm -f "$TMP_SUBSCRIPTIONS_JSON" "$TMP_COMPARTMENTS_JSON" "$TMP_REGIONS_JSON" "$TMP_COMPARTMENTS_OUT_JSON"
}
trap cleanup_tmp EXIT

# ── step 1: verify OCI CLI is installed ──────────────────────────────────────

if ! command -v oci >/dev/null 2>&1; then
  emit_error 2 \
    "OCI_CLI_NOT_INSTALLED" \
    "The OCI CLI is not installed or not on PATH." \
    "Install OCI CLI from https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm" \
    "https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm"
fi

# ── step 2: verify OCI CLI is authenticated ───────────────────────────────────

if ! oci iam region-subscription list --output json >/dev/null 2>&1; then
  emit_error 1 \
    "OCI_CLI_NOT_AUTHENTICATED" \
    "The OCI CLI is installed but not authenticated. Check ~/.oci/config." \
    "Run: oci setup config" \
    "https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliconfigure.htm"
fi

# ── step 3: extract tenancy OCID and home region ─────────────────────────────

RAW_SUBSCRIPTIONS=$(oci iam region-subscription list --output json 2>/dev/null) || RAW_SUBSCRIPTIONS='{"data":[]}'
printf '%s' "$RAW_SUBSCRIPTIONS" > "$TMP_SUBSCRIPTIONS_JSON"

TENANCY_INFO=$(python3 - "$TMP_SUBSCRIPTIONS_JSON" <<'PYEOF'
import json
import sys
from pathlib import Path
raw = Path(sys.argv[1]).read_text() or '{"data":[]}'
data = json.loads(raw).get("data", [])
home = next((r for r in data if r.get("is-home-region")), None)
if not home:
    print("ERROR")
    sys.exit(1)
print(home.get("region-name", ""), home.get("tenancy-id", ""))
PYEOF
) || true

if [ -z "$TENANCY_INFO" ] || [ "$TENANCY_INFO" = "ERROR" ]; then
  emit_error 1 \
    "TENANCY_DISCOVERY_FAILED" \
    "Could not extract tenancy OCID and home region from OCI CLI output." \
    "Verify your ~/.oci/config has a valid tenancy OCID and region." \
    "https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliconfigure.htm"
fi

HOME_REGION=$(echo "$TENANCY_INFO" | awk '{print $1}')
TENANCY_OCID=$(echo "$TENANCY_INFO" | awk '{print $2}')

if [ -z "$TENANCY_OCID" ]; then
  emit_error 1 \
    "TENANCY_OCID_MISSING" \
    "Tenancy OCID could not be determined from region-subscription output." \
    "Ensure your OCI CLI profile includes a valid tenancy_ocid in ~/.oci/config." \
    "https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliconfigure.htm"
fi

# ── step 4: list subscribed regions ──────────────────────────────────────────

REGIONS_JSON=$(python3 - "$TMP_SUBSCRIPTIONS_JSON" <<'PYEOF'
import json
import sys
from pathlib import Path
raw = Path(sys.argv[1]).read_text() or '{"data":[]}'
data = json.loads(raw).get("data", [])
regions = [{"region": r.get("region-name",""), "status": r.get("status","")} for r in data]
print(json.dumps(regions))
PYEOF
) || REGIONS_JSON='[]'
printf '%s' "$REGIONS_JSON" > "$TMP_REGIONS_JSON"

# ── step 5: list active compartments ─────────────────────────────────────────

RAW_COMPARTMENTS=$(oci iam compartment list \
  --compartment-id "$TENANCY_OCID" \
  --compartment-id-in-subtree true \
  --all \
  --lifecycle-state ACTIVE \
  --output json 2>/dev/null) || RAW_COMPARTMENTS='{"data":[]}'
printf '%s' "$RAW_COMPARTMENTS" > "$TMP_COMPARTMENTS_JSON"

COMPARTMENTS_JSON=$(python3 - "$TMP_COMPARTMENTS_JSON" "$TENANCY_OCID" <<'PYEOF'
import json
import sys
from pathlib import Path
raw = Path(sys.argv[1]).read_text() or '{"data":[]}'
data = json.loads(raw).get("data", [])
tenancy_ocid = sys.argv[2]
compartments = [{"name": c.get("name",""), "ocid": c.get("id",""), "parent": c.get("compartment-id","")} for c in data]
# prepend root compartment (the tenancy itself)
compartments.insert(0, {"name": "root (tenancy)", "ocid": tenancy_ocid, "parent": ""})
print(json.dumps(compartments))
PYEOF
) || COMPARTMENTS_JSON='[]'
printf '%s' "$COMPARTMENTS_JSON" > "$TMP_COMPARTMENTS_OUT_JSON"

# ── step 6: emit structured output ───────────────────────────────────────────

python3 - "$TENANCY_OCID" "$HOME_REGION" "$TMP_REGIONS_JSON" "$TMP_COMPARTMENTS_OUT_JSON" <<'PYEOF'
import sys, json
from pathlib import Path
regions_raw = Path(sys.argv[3]).read_text()
compartments_raw = Path(sys.argv[4]).read_text()
result = {
    "tenancy_ocid":  sys.argv[1],
    "home_region":   sys.argv[2],
    "regions":       json.loads(regions_raw),
    "compartments":  json.loads(compartments_raw)
}
print(json.dumps(result, indent=2))
PYEOF

exit 0

#!/usr/bin/env bash
# validate-cidr.sh
# Detect CIDR overlap between 2 or more CIDR blocks
#
# Usage:  bash validate-cidr.sh <cidr1> <cidr2> [cidr3 ...]
# Exit:   0 = no overlaps found
#         1 = overlaps detected
#         2 = invalid input (bad CIDR format or insufficient arguments)
#
# Stderr: JSON  {error_code, message, remediation, docs_url}   (exit 2 only)
# Stdout: JSON  {valid: bool, overlaps: [{cidr_a, cidr_b}], cidrs_checked: []}

set -euo pipefail

emit_error() {
  local exit_code="$1"
  local error_code="$2"
  local message="$3"
  local remediation="$4"
  printf '{"error_code":"%s","message":"%s","remediation":"%s","docs_url":""}\n' \
    "$error_code" "$message" "$remediation" >&2
  exit "$exit_code"
}

if [ "$#" -lt 2 ]; then
  emit_error 2 \
    "INSUFFICIENT_ARGUMENTS" \
    "validate-cidr.sh requires at least 2 CIDR arguments." \
    "Usage: bash validate-cidr.sh 10.0.0.0/16 10.244.0.0/16 10.96.0.0/16"
fi

# Delegate all parsing and overlap detection to Python
python3 - "$@" <<'PYEOF'
import sys, json, ipaddress

cidrs_raw = sys.argv[1:]
cidrs = []

for raw in cidrs_raw:
    try:
        net = ipaddress.ip_network(raw, strict=False)
        cidrs.append((raw, net))
    except ValueError as e:
        error = {
            "error_code": "INVALID_CIDR",
            "message": f"Invalid CIDR block: {raw}. {e}",
            "remediation": "Provide a valid CIDR in the form A.B.C.D/prefix (e.g. 10.0.0.0/16).",
            "docs_url": ""
        }
        print(json.dumps(error), file=sys.stderr)
        sys.exit(2)

overlaps = []
for i in range(len(cidrs)):
    for j in range(i + 1, len(cidrs)):
        raw_a, net_a = cidrs[i]
        raw_b, net_b = cidrs[j]
        if net_a.overlaps(net_b):
            overlaps.append({"cidr_a": raw_a, "cidr_b": raw_b})

result = {
    "valid": len(overlaps) == 0,
    "overlaps": overlaps,
    "cidrs_checked": cidrs_raw
}
print(json.dumps(result, indent=2))
sys.exit(1 if overlaps else 0)
PYEOF

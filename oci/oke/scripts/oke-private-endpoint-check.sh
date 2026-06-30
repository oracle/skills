#!/usr/bin/env bash
set -euo pipefail

# Collect private OKE API endpoint and kubeconfig connectivity signals.
#
# Usage:
#   bash scripts/oke-private-endpoint-check.sh --cluster-id <ocid> --region <region> [--compartment-id <ocid>]

cluster_id=""
region=""
compartment_id=""

emit_error() {
  local exit_code="$1"
  local error_code="$2"
  local message="$3"
  local remediation="$4"
  printf '{"error_code":"%s","message":"%s","remediation":"%s","docs_url":""}\n' \
    "$error_code" "$message" "$remediation" >&2
  exit "$exit_code"
}

require_value() {
  local flag="$1"
  if [[ $# -lt 2 || -z "${2:-}" || "${2:-}" == --* ]]; then
    emit_error 2 "INVALID_ARGUMENT" "Missing value for ${flag}." "Run with --help to view usage."
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --cluster-id) require_value "$1" "${2:-}"; cluster_id="$2"; shift 2 ;;
    --region) require_value "$1" "${2:-}"; region="$2"; shift 2 ;;
    --compartment-id) require_value "$1" "${2:-}"; compartment_id="$2"; shift 2 ;;
    -h|--help)
      echo "usage: oke-private-endpoint-check.sh --cluster-id <ocid> --region <region> [--compartment-id <ocid>]"
      exit 0 ;;
    *) emit_error 2 "UNKNOWN_ARGUMENT" "Unknown argument: $1." "Run with --help to view usage." ;;
  esac
done

if [[ -z "$cluster_id" || -z "$region" ]]; then
  emit_error 2 "MISSING_REQUIRED_ARGUMENT" "Missing --cluster-id or --region." "Provide both --cluster-id and --region."
fi

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT
records="$tmp_dir/records.jsonl"
: > "$records"

run_check() {
  local name="$1"; shift
  local out rc
  set +e
  out="$("$@" 2>&1)"
  rc=$?
  set -e
  NAME="$name" RC="$rc" OUT="$out" CMD="$*" python3 - "$records" <<'PY'
import json, os, sys
with open(sys.argv[1], "a") as f:
    f.write(json.dumps({
        "name": os.environ["NAME"],
        "cmd": os.environ["CMD"],
        "rc": int(os.environ["RC"]),
        "output": os.environ["OUT"][-4000:],
    }) + "\n")
PY
}

command -v kubectl >/dev/null 2>&1 && {
  run_check "current context" kubectl config current-context
  run_check "cluster info" kubectl cluster-info
  run_check "readyz" kubectl get --raw=/readyz?verbose
  run_check "kubectl version" kubectl version --client
}

if command -v oci >/dev/null 2>&1; then
  run_check "OKE cluster" oci --region "$region" ce cluster get --cluster-id "$cluster_id" --output json
  if [[ -n "$compartment_id" ]]; then
    run_check "NSGs" oci --region "$region" network nsg list --compartment-id "$compartment_id" --all --output json
  fi
fi

python3 - "$records" "$cluster_id" "$region" "$compartment_id" <<'PY'
import json, re, sys
from pathlib import Path
records = [json.loads(line) for line in Path(sys.argv[1]).read_text().splitlines() if line.strip()]
cluster_id, region, compartment_id = sys.argv[2], sys.argv[3], sys.argv[4]
pat = re.compile(r"(Unable to connect|i/o timeout|connection refused|x509|Unauthorized|Forbidden|exec: executable oci failed|NotAuthorized|private|endpoint|NSG|security)", re.I)
findings, anomalies, snippets = [], [], []
for item in records:
    out = item["output"].strip()
    findings.append(f"{item['name']} {'collected' if item['rc'] == 0 else 'failed'}")
    if item["rc"] != 0:
        anomalies.append(f"{item['name']} failed with rc={item['rc']}")
    if out:
        snippets.append(f"$ {item['cmd']}\n{out[-800:]}")
        for line in out.splitlines():
            if pat.search(line):
                anomalies.append(f"{item['name']}: {line.strip()[:240]}")
print(json.dumps({
    "domain": "Private Cluster / API Endpoint Connectivity",
    "cluster_id": cluster_id,
    "region": region,
    "compartment_id": compartment_id,
    "findings": findings,
    "anomalies": anomalies,
    "raw_snippets": snippets[-10:],
    "fallback_used": any(item["rc"] != 0 for item in records),
}, indent=2))
PY

#!/usr/bin/env bash
set -euo pipefail

# Collect OKE workload identity and pod OCI API auth evidence.
#
# Usage:
#   bash scripts/oke-workload-identity-check.sh --namespace <ns> --serviceaccount <sa> [--pod <pod>] [--tenancy-id <ocid>]

namespace=""
serviceaccount=""
pod=""
tenancy_id=""

emit_error() {
  local exit_code="$1"; local error_code="$2"; local message="$3"; local remediation="$4"
  printf '{"error_code":"%s","message":"%s","remediation":"%s","docs_url":""}\n' "$error_code" "$message" "$remediation" >&2
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
    --namespace|-n) require_value "$1" "${2:-}"; namespace="$2"; shift 2 ;;
    --serviceaccount|--sa) require_value "$1" "${2:-}"; serviceaccount="$2"; shift 2 ;;
    --pod) require_value "$1" "${2:-}"; pod="$2"; shift 2 ;;
    --tenancy-id) require_value "$1" "${2:-}"; tenancy_id="$2"; shift 2 ;;
    -h|--help) echo "usage: oke-workload-identity-check.sh --namespace <ns> --serviceaccount <sa> [--pod <pod>] [--tenancy-id <ocid>]"; exit 0 ;;
    *) emit_error 2 "UNKNOWN_ARGUMENT" "Unknown argument: $1." "Run with --help to view usage." ;;
  esac
done
if [[ -z "$namespace" || -z "$serviceaccount" ]]; then
  emit_error 2 "MISSING_REQUIRED_ARGUMENT" "Missing --namespace or --serviceaccount." "Provide both --namespace and --serviceaccount."
fi
command -v kubectl >/dev/null 2>&1 || emit_error 2 "KUBECTL_NOT_INSTALLED" "kubectl is not installed or not on PATH." "Install kubectl and retry."

tmp_dir="$(mktemp -d)"; trap 'rm -rf "$tmp_dir"' EXIT
records="$tmp_dir/records.jsonl"; : > "$records"
run_check() {
  local name="$1"; shift
  local out rc
  set +e; out="$("$@" 2>&1)"; rc=$?; set -e
  NAME="$name" RC="$rc" OUT="$out" CMD="$*" python3 - "$records" <<'PY'
import json, os, sys
with open(sys.argv[1], "a") as f:
    f.write(json.dumps({"name": os.environ["NAME"], "cmd": os.environ["CMD"], "rc": int(os.environ["RC"]), "output": os.environ["OUT"][-4000:]}) + "\n")
PY
}

run_check "service account" kubectl -n "$namespace" get serviceaccount "$serviceaccount" -o yaml
if [[ -n "$pod" ]]; then
  run_check "pod describe" kubectl -n "$namespace" describe pod "$pod"
  run_check "pod logs" sh -c "kubectl -n '$namespace' logs '$pod' --tail=200 2>&1 | egrep -i 'notauthorized|forbidden|401|403|principal|workload|token|oci' || true"
fi
if [[ -n "$tenancy_id" ]] && command -v oci >/dev/null 2>&1; then
  run_check "IAM policies" oci iam policy list --compartment-id "$tenancy_id" --all --output json
fi

python3 - "$records" "$namespace" "$serviceaccount" "$pod" "$tenancy_id" <<'PY'
import json, re, sys
from pathlib import Path
records = [json.loads(line) for line in Path(sys.argv[1]).read_text().splitlines() if line.strip()]
namespace, serviceaccount, pod, tenancy_id = sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
pat = re.compile(r"(NotAuthorized|Forbidden|401|403|principal|workload|token|policy|serviceaccount|namespace|cluster|oci)", re.I)
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
    "domain": "Workload Identity / OCI API From Pods",
    "namespace": namespace,
    "serviceaccount": serviceaccount,
    "pod": pod,
    "tenancy_id": tenancy_id,
    "findings": findings,
    "anomalies": anomalies,
    "raw_snippets": snippets[-10:],
    "fallback_used": any(item["rc"] != 0 for item in records),
}, indent=2))
PY

#!/usr/bin/env bash
set -euo pipefail

# Collect cluster-autoscaler, Pending pod, and optional OKE node-pool evidence.
#
# Usage:
#   bash scripts/oke-autoscaler-check.sh --namespace <ns> [--deployment <name>] [--cluster-id <ocid>] [--compartment-id <ocid>] [--region <region>]

namespace=""
deployment=""
cluster_id=""
compartment_id=""
region=""

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
    --namespace|-n)
      require_value "$1" "${2:-}"
      namespace="$2"; shift 2 ;;
    --deployment)
      require_value "$1" "${2:-}"
      deployment="$2"; shift 2 ;;
    --cluster-id)
      require_value "$1" "${2:-}"
      cluster_id="$2"; shift 2 ;;
    --compartment-id)
      require_value "$1" "${2:-}"
      compartment_id="$2"; shift 2 ;;
    --region)
      require_value "$1" "${2:-}"
      region="$2"; shift 2 ;;
    -h|--help)
      echo "usage: oke-autoscaler-check.sh --namespace <ns> [--deployment <name>] [--cluster-id <ocid>] [--compartment-id <ocid>] [--region <region>]"
      exit 0 ;;
    *)
      emit_error 2 "UNKNOWN_ARGUMENT" "Unknown argument: $1." "Run with --help to view usage." ;;
  esac
done

if [[ -z "$namespace" ]]; then
  emit_error 2 "MISSING_REQUIRED_ARGUMENT" "Missing required --namespace." "Provide --namespace <ns>."
fi

if ! command -v kubectl >/dev/null 2>&1; then
  emit_error 2 "KUBECTL_NOT_INSTALLED" "kubectl is not installed or not on PATH." "Install kubectl and retry."
fi

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT
records="$tmp_dir/records.jsonl"
: > "$records"

run_check() {
  local name="$1"
  shift
  local out rc
  set +e
  out="$("$@" 2>&1)"
  rc=$?
  set -e
  NAME="$name" RC="$rc" OUT="$out" CMD="$*" python3 - "$records" <<'PY'
import json
import os
import sys

with open(sys.argv[1], "a") as f:
    f.write(json.dumps({
        "name": os.environ["NAME"],
        "cmd": os.environ["CMD"],
        "rc": int(os.environ["RC"]),
        "output": os.environ["OUT"][-4000:],
    }) + "\n")
PY
}

run_check "pending pods" kubectl -n "$namespace" get pods --field-selector=status.phase=Pending -o wide
run_check "scheduling warning events" kubectl -n "$namespace" get events --field-selector reason=FailedScheduling --sort-by=.lastTimestamp
run_check "cluster-autoscaler deployment" kubectl -n kube-system get deploy cluster-autoscaler -o wide
run_check "cluster-autoscaler logs" kubectl -n kube-system logs deployment/cluster-autoscaler --tail=200

if [[ -n "$deployment" ]]; then
  run_check "target deployment" kubectl -n "$namespace" describe deployment "$deployment"
  run_check "target deployment hpa" kubectl -n "$namespace" get hpa --selector "app=$deployment" -o wide
fi

if [[ -n "$cluster_id" && -n "$compartment_id" ]] && command -v oci >/dev/null 2>&1; then
  oci_cmd=(oci)
  if [[ -n "$region" ]]; then
    oci_cmd+=(--region "$region")
  fi
  run_check "OKE node pools" "${oci_cmd[@]}" ce node-pool list --compartment-id "$compartment_id" --cluster-id "$cluster_id" --all --output json
fi

python3 - "$records" "$namespace" "$deployment" <<'PY'
import json
import re
import sys
from pathlib import Path

records = [json.loads(line) for line in Path(sys.argv[1]).read_text().splitlines() if line.strip()]
namespace, deployment = sys.argv[2], sys.argv[3]
anomaly_re = re.compile(
    r"(FailedScheduling|Insufficient|max node group size reached|scale.?up|NotTriggerScaleUp|quota|limit|no node group|didn.t trigger|unremovable|Pending|Error|Failed)",
    re.I,
)

findings = []
anomalies = []
snippets = []
for item in records:
    output = item["output"].strip()
    if item["rc"] == 0:
        findings.append(f"{item['name']} collected")
    else:
        anomalies.append(f"{item['name']} failed with rc={item['rc']}")
    if output:
        snippets.append(f"$ {item['cmd']}\n{output[-800:]}")
        for line in output.splitlines():
            if anomaly_re.search(line):
                anomalies.append(f"{item['name']}: {line.strip()[:240]}")

print(json.dumps({
    "domain": "Cluster Autoscaler / Node Pool Scaling",
    "namespace": namespace,
    "deployment": deployment,
    "findings": findings,
    "anomalies": anomalies,
    "raw_snippets": snippets[-10:],
    "fallback_used": any(item["rc"] != 0 for item in records),
}, indent=2))
PY

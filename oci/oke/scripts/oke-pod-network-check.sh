#!/usr/bin/env bash
set -euo pipefail

# Collect pod networking, OCI CNI/IPAM, and Multus signals.
#
# Usage:
#   bash scripts/oke-pod-network-check.sh --namespace <ns> [--pod <pod>] [--selector <label-selector>]

namespace=""
pod=""
selector=""

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
      namespace="$2"
      shift 2
      ;;
    --pod)
      require_value "$1" "${2:-}"
      pod="$2"
      shift 2
      ;;
    --selector|-l)
      require_value "$1" "${2:-}"
      selector="$2"
      shift 2
      ;;
    -h|--help)
      echo "usage: oke-pod-network-check.sh --namespace <ns> [--pod <pod>] [--selector <label-selector>]"
      exit 0
      ;;
    *)
      emit_error 2 "UNKNOWN_ARGUMENT" "Unknown argument: $1." "Run with --help to view usage."
      ;;
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

if [[ -n "$pod" ]]; then
  run_check "target pod" kubectl -n "$namespace" get pod "$pod" -o wide
  run_check "target pod describe" kubectl -n "$namespace" describe pod "$pod"
  run_check "target pod network-status" kubectl -n "$namespace" get pod "$pod" -o jsonpath='{.metadata.annotations.k8s\.v1\.cni\.cncf\.io/network-status}'
  run_check "target pod node" kubectl -n "$namespace" get pod "$pod" -o jsonpath='{.spec.nodeName}'
else
  pod_args=()
  if [[ -n "$selector" ]]; then
    pod_args=(-l "$selector")
  fi
  run_check "namespace pods" kubectl -n "$namespace" get pods "${pod_args[@]}" -o wide
fi

run_check "namespace warning events" kubectl -n "$namespace" get events --field-selector type=Warning --sort-by=.lastTimestamp
run_check "OCI CNI pods" kubectl -n kube-system get pods -l app=oci-cni -o wide
run_check "Multus pods" kubectl -n kube-system get pods -l name=multus -o wide
run_check "network attachment definitions" kubectl get network-attachment-definitions -A

python3 - "$records" "$namespace" "$pod" "$selector" <<'PY'
import json
import re
import sys
from pathlib import Path

records = [json.loads(line) for line in Path(sys.argv[1]).read_text().splitlines() if line.strip()]
namespace, pod, selector = sys.argv[2], sys.argv[3], sys.argv[4]
anomaly_re = re.compile(
    r"(FailedCreatePodSandBox|failed to find plugin|CNI|multus|ipam|network-status|ImageInspectError|EOF|timeout|NotReady|Pending|Error|Failed)",
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
    "domain": "Pod Networking / OCI CNI / IPAM",
    "namespace": namespace,
    "pod": pod,
    "selector": selector,
    "findings": findings,
    "anomalies": anomalies,
    "raw_snippets": snippets[-10:],
    "fallback_used": any(item["rc"] != 0 for item in records),
}, indent=2))
PY

#!/usr/bin/env bash
set -euo pipefail

# Collect OKE add-on health signals from kube-system.
#
# Usage:
#   bash scripts/oke-addon-health.sh [--namespace kube-system]

namespace="kube-system"

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
    --namespace)
      require_value "$1" "${2:-}"
      namespace="$2"
      shift 2
      ;;
    -h|--help)
      echo "usage: oke-addon-health.sh [--namespace kube-system]"
      exit 0
      ;;
    *)
      emit_error 2 "UNKNOWN_ARGUMENT" "Unknown argument: $1." "Run with --help to view usage."
      ;;
  esac
done

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

record = {
    "name": os.environ["NAME"],
    "cmd": os.environ["CMD"],
    "rc": int(os.environ["RC"]),
    "output": os.environ["OUT"][-4000:],
}
with open(sys.argv[1], "a") as f:
    f.write(json.dumps(record) + "\n")
PY
}

run_check "kube-system pods" kubectl -n "$namespace" get pods -o wide
run_check "kube-system deployments" kubectl -n "$namespace" get deploy -o wide
run_check "kube-system daemonsets" kubectl -n "$namespace" get ds -o wide
run_check "CoreDNS deployment" kubectl -n "$namespace" get deploy coredns -o wide
run_check "recent kube-system warnings" kubectl -n "$namespace" get events --field-selector type=Warning --sort-by=.lastTimestamp

python3 - "$records" "$namespace" <<'PY'
import json
import re
import sys
from pathlib import Path

records = [json.loads(line) for line in Path(sys.argv[1]).read_text().splitlines() if line.strip()]
namespace = sys.argv[2]
anomaly_re = re.compile(
    r"(CrashLoopBackOff|ImagePullBackOff|ErrImagePull|OOMKilled|NotReady|Pending|Error|Failed|0/[1-9])",
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
    "domain": "OKE Add-ons Health",
    "namespace": namespace,
    "findings": findings,
    "anomalies": anomalies,
    "raw_snippets": snippets[-8:],
    "fallback_used": any(item["rc"] != 0 for item in records),
}, indent=2))
PY

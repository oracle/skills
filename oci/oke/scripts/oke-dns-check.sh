#!/usr/bin/env bash
set -euo pipefail

# Collect CoreDNS and service discovery signals.
#
# Usage:
#   bash scripts/oke-dns-check.sh --namespace <ns> [--service <svc>] [--pod <pod>] [--lookup <dns-name>]

namespace=""
service=""
pod=""
lookup=""

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
    --service)
      require_value "$1" "${2:-}"
      service="$2"; shift 2 ;;
    --pod)
      require_value "$1" "${2:-}"
      pod="$2"; shift 2 ;;
    --lookup)
      require_value "$1" "${2:-}"
      lookup="$2"; shift 2 ;;
    -h|--help)
      echo "usage: oke-dns-check.sh --namespace <ns> [--service <svc>] [--pod <pod>] [--lookup <dns-name>]"
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

run_check "CoreDNS pods" kubectl -n kube-system get pods -l k8s-app=kube-dns -o wide
run_check "CoreDNS deployment" kubectl -n kube-system get deploy coredns -o wide
run_check "CoreDNS config" kubectl -n kube-system get configmap coredns -o yaml
run_check "CoreDNS logs" kubectl -n kube-system logs deployment/coredns --tail=200

if [[ -n "$service" ]]; then
  run_check "target service" kubectl -n "$namespace" get svc "$service" -o yaml
  run_check "target endpoints" kubectl -n "$namespace" get endpoints "$service" -o yaml
  run_check "target endpoint slices" kubectl -n "$namespace" get endpointslices -l "kubernetes.io/service-name=$service" -o yaml
fi

if [[ -n "$pod" && -n "$lookup" ]]; then
  run_check "pod DNS lookup" kubectl -n "$namespace" exec "$pod" -- nslookup "$lookup"
fi

python3 - "$records" "$namespace" "$service" "$pod" "$lookup" <<'PY'
import json
import re
import sys
from pathlib import Path

records = [json.loads(line) for line in Path(sys.argv[1]).read_text().splitlines() if line.strip()]
namespace, service, pod, lookup = sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
anomaly_re = re.compile(
    r"(SERVFAIL|NXDOMAIN|timeout|no such host|connection refused|no endpoints|CrashLoopBackOff|NotReady|Error|Failed)",
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
    "domain": "DNS / Service Discovery",
    "namespace": namespace,
    "service": service,
    "pod": pod,
    "lookup": lookup,
    "findings": findings,
    "anomalies": anomalies,
    "raw_snippets": snippets[-10:],
    "fallback_used": any(item["rc"] != 0 for item in records),
}, indent=2))
PY

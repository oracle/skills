#!/usr/bin/env bash
set -euo pipefail

# Build a lightweight incident timeline from Kubernetes events and selected objects.
#
# Usage:
#   bash scripts/oke-incident-timeline.sh --namespace <ns> [--pod <pod>] [--deployment <name>] [--service <svc>] [--compartment-id <ocid>] [--region <region>]

namespace=""
pod=""
deployment=""
service=""
compartment_id=""
region=""

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
    --pod) require_value "$1" "${2:-}"; pod="$2"; shift 2 ;;
    --deployment) require_value "$1" "${2:-}"; deployment="$2"; shift 2 ;;
    --service) require_value "$1" "${2:-}"; service="$2"; shift 2 ;;
    --compartment-id) require_value "$1" "${2:-}"; compartment_id="$2"; shift 2 ;;
    --region) require_value "$1" "${2:-}"; region="$2"; shift 2 ;;
    -h|--help) echo "usage: oke-incident-timeline.sh --namespace <ns> [--pod <pod>] [--deployment <name>] [--service <svc>] [--compartment-id <ocid>] [--region <region>]"; exit 0 ;;
    *) emit_error 2 "UNKNOWN_ARGUMENT" "Unknown argument: $1." "Run with --help to view usage." ;;
  esac
done
if [[ -z "$namespace" ]]; then
  emit_error 2 "MISSING_REQUIRED_ARGUMENT" "Missing --namespace." "Provide --namespace <ns>."
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
    f.write(json.dumps({"name": os.environ["NAME"], "cmd": os.environ["CMD"], "rc": int(os.environ["RC"]), "output": os.environ["OUT"][-6000:]}) + "\n")
PY
}

run_check "namespace events" kubectl -n "$namespace" get events --sort-by=.lastTimestamp
if [[ -n "$pod" ]]; then
  run_check "pod describe" kubectl -n "$namespace" describe pod "$pod"
fi
if [[ -n "$deployment" ]]; then
  run_check "deployment rollout history" kubectl -n "$namespace" rollout history deployment/"$deployment"
  run_check "deployment describe" kubectl -n "$namespace" describe deployment "$deployment"
fi
if [[ -n "$service" ]]; then
  run_check "service describe" kubectl -n "$namespace" describe service "$service"
fi
if [[ -n "$compartment_id" && -n "$region" ]] && command -v oci >/dev/null 2>&1; then
  run_check "firing alarms" oci --region "$region" monitoring alarm-status list-alarms-status --compartment-id "$compartment_id" --status FIRING --all --output json
fi

python3 - "$records" "$namespace" "$pod" "$deployment" "$service" <<'PY'
import json, re, sys
from pathlib import Path
records = [json.loads(line) for line in Path(sys.argv[1]).read_text().splitlines() if line.strip()]
namespace, pod, deployment, service = sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
signal = re.compile(r"(Warning|Failed|BackOff|Killing|Pulling|Created|Started|Scaled|Successful|Unhealthy|NotReady|FIRING)", re.I)
timeline = []
findings, anomalies, snippets = [], [], []
for item in records:
    out = item["output"].strip()
    findings.append(f"{item['name']} {'collected' if item['rc'] == 0 else 'failed'}")
    if item["rc"] != 0:
        anomalies.append(f"{item['name']} failed with rc={item['rc']}")
    if out:
        snippets.append(f"$ {item['cmd']}\n{out[-800:]}")
        for line in out.splitlines():
            if signal.search(line):
                timeline.append({"source": item["name"], "event": line.strip()[:300]})
                if re.search(r"(Warning|Failed|BackOff|Unhealthy|NotReady|FIRING)", line, re.I):
                    anomalies.append(f"{item['name']}: {line.strip()[:240]}")
print(json.dumps({
    "domain": "Incident Timeline",
    "namespace": namespace,
    "pod": pod,
    "deployment": deployment,
    "service": service,
    "findings": findings,
    "timeline": timeline[-30:],
    "anomalies": anomalies,
    "raw_snippets": snippets[-10:],
    "fallback_used": any(item["rc"] != 0 for item in records),
}, indent=2))
PY

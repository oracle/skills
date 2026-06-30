#!/usr/bin/env bash
set -euo pipefail

# Collect OCI Native Ingress and Kubernetes Ingress evidence.
#
# Usage:
#   bash scripts/oke-ingress-check.sh --namespace <ns> --ingress <name> [--region <region>]

namespace=""
ingress=""
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
    --ingress) require_value "$1" "${2:-}"; ingress="$2"; shift 2 ;;
    --region) require_value "$1" "${2:-}"; region="$2"; shift 2 ;;
    -h|--help) echo "usage: oke-ingress-check.sh --namespace <ns> --ingress <name> [--region <region>]"; exit 0 ;;
    *) emit_error 2 "UNKNOWN_ARGUMENT" "Unknown argument: $1." "Run with --help to view usage." ;;
  esac
done
if [[ -z "$namespace" || -z "$ingress" ]]; then
  emit_error 2 "MISSING_REQUIRED_ARGUMENT" "Missing --namespace or --ingress." "Provide both --namespace and --ingress."
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

run_check "ingress classes" kubectl get ingressclass -o yaml
run_check "target ingress" kubectl -n "$namespace" get ingress "$ingress" -o yaml
run_check "target ingress describe" kubectl -n "$namespace" describe ingress "$ingress"
run_check "ingress controller pods" kubectl -n kube-system get pods -l app.kubernetes.io/name=oci-native-ingress-controller -o wide
run_check "ingress controller logs" kubectl -n kube-system logs -l app.kubernetes.io/name=oci-native-ingress-controller --tail=200

python3 - "$records" "$namespace" "$ingress" "$region" <<'PY'
import json, re, sys
from pathlib import Path
records = [json.loads(line) for line in Path(sys.argv[1]).read_text().splitlines() if line.strip()]
namespace, ingress, region = sys.argv[2], sys.argv[3], sys.argv[4]
pat = re.compile(r"(Failed|Error|Warning|certificate|TLS|listener|backend|reconcile|NotFound|forbidden|load balancer|ingressclass)", re.I)
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
    "domain": "Ingress / OCI Native Ingress",
    "namespace": namespace,
    "ingress": ingress,
    "region": region,
    "findings": findings,
    "anomalies": anomalies,
    "raw_snippets": snippets[-10:],
    "fallback_used": any(item["rc"] != 0 for item in records),
}, indent=2))
PY

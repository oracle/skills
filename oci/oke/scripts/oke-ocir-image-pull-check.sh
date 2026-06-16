#!/usr/bin/env bash
set -euo pipefail

# Collect OCIR image pull failure evidence.
#
# Usage:
#   bash scripts/oke-ocir-image-pull-check.sh --namespace <ns> --pod <pod> [--image <image>] [--compartment-id <ocid>] [--region <region>]

namespace=""
pod=""
image=""
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
    --image) require_value "$1" "${2:-}"; image="$2"; shift 2 ;;
    --compartment-id) require_value "$1" "${2:-}"; compartment_id="$2"; shift 2 ;;
    --region) require_value "$1" "${2:-}"; region="$2"; shift 2 ;;
    -h|--help) echo "usage: oke-ocir-image-pull-check.sh --namespace <ns> --pod <pod> [--image <image>] [--compartment-id <ocid>] [--region <region>]"; exit 0 ;;
    *) emit_error 2 "UNKNOWN_ARGUMENT" "Unknown argument: $1." "Run with --help to view usage." ;;
  esac
done
if [[ -z "$namespace" || -z "$pod" ]]; then
  emit_error 2 "MISSING_REQUIRED_ARGUMENT" "Missing --namespace or --pod." "Provide both --namespace and --pod."
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

run_check "pod describe" kubectl -n "$namespace" describe pod "$pod"
run_check "pod yaml" kubectl -n "$namespace" get pod "$pod" -o yaml
run_check "pod warning events" kubectl -n "$namespace" get events --field-selector "involvedObject.name=$pod" --sort-by=.lastTimestamp
run_check "service accounts" kubectl -n "$namespace" get serviceaccount -o yaml
run_check "image pull secrets" kubectl -n "$namespace" get secret -o yaml

if [[ -n "$compartment_id" && -n "$region" ]] && command -v oci >/dev/null 2>&1; then
  run_check "OCIR repositories" oci --region "$region" artifacts container repository list --compartment-id "$compartment_id" --all --output json
fi

python3 - "$records" "$namespace" "$pod" "$image" "$region" <<'PY'
import json, re, sys
from pathlib import Path
records = [json.loads(line) for line in Path(sys.argv[1]).read_text().splitlines() if line.strip()]
namespace, pod, image, region = sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
pat = re.compile(r"(ImagePullBackOff|ErrImagePull|unauthorized|denied|not found|repository|pull access denied|x509|i/o timeout|no basic auth|OCIR)", re.I)
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
    "domain": "OCIR / Image Pull",
    "namespace": namespace,
    "pod": pod,
    "image": image,
    "region": region,
    "findings": findings,
    "anomalies": anomalies,
    "raw_snippets": snippets[-10:],
    "fallback_used": any(item["rc"] != 0 for item in records),
}, indent=2))
PY

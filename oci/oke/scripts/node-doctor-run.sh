#!/usr/bin/env bash
set -euo pipefail

# Run OKE node doctor through kubectl debug and emit normalized JSON.
#
# Usage:
#   ./scripts/node-doctor-run.sh --node <node-name> --image <image-name> [--namespace <ns>] [--cleanup true|false]

node_name=""
image_name=""
namespace="default"
cleanup="true"

emit_error() {
  local exit_code="$1"
  local error_code="$2"
  local message="$3"
  local remediation="$4"
  local docs_url="${5:-}"
  printf '{"error_code":"%s","message":"%s","remediation":"%s","docs_url":"%s"}\n' \
    "$error_code" "$message" "$remediation" "$docs_url" >&2
  exit "$exit_code"
}

require_value() {
  local flag="$1"
  if [[ $# -lt 2 || -z "${2:-}" || "${2:-}" == --* ]]; then
    emit_error 2 "INVALID_ARGUMENT" "Missing value for ${flag}." \
      "Run with --help to view usage."
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --node)
      require_value "$1" "${2:-}"
      node_name="$2"
      shift 2
      ;;
    --image)
      require_value "$1" "${2:-}"
      image_name="$2"
      shift 2
      ;;
    --namespace)
      require_value "$1" "${2:-}"
      namespace="$2"
      shift 2
      ;;
    --cleanup)
      require_value "$1" "${2:-}"
      cleanup="$2"
      shift 2
      ;;
    -h|--help)
      cat <<'EOF'
usage: node-doctor-run.sh --node <node-name> --image <image-name> [--namespace <ns>] [--cleanup true|false]
EOF
      exit 0
      ;;
    *)
      emit_error 2 "UNKNOWN_ARGUMENT" "Unknown argument: $1." "Run with --help to view usage."
      ;;
  esac
done

if [[ -z "$node_name" ]]; then
  emit_error 2 "MISSING_REQUIRED_ARGUMENT" "Missing required --node." "Provide --node <node-name>."
fi

if [[ -z "$image_name" ]]; then
  emit_error 2 "MISSING_REQUIRED_ARGUMENT" "Missing required --image." "Provide --image <image-name>."
fi

if ! command -v kubectl >/dev/null 2>&1; then
  emit_error 2 "KUBECTL_NOT_INSTALLED" "kubectl is not installed or not on PATH." "Install kubectl and retry."
fi

debug_cmd=(kubectl -n "$namespace" debug "node/${node_name}" --image="${image_name}" -- chroot /host sudo /usr/local/bin/node-doctor.sh --check)

set +e
raw_out="$("${debug_cmd[@]}" 2>&1)"
cmd_rc=$?
set -e

pod_name="$(printf "%s\n" "$raw_out" | sed -n 's/^Creating debugging pod \([^ ]*\) .*/\1/p' | head -n 1)"

# When kubectl debug cannot attach, execution output may only exist in pod logs.
if [[ -n "$pod_name" ]]; then
  # Wait for the debug pod to finish so node-doctor output is complete.
  for _ in $(seq 1 120); do
    set +e
    pod_phase="$(kubectl -n "$namespace" get pod "$pod_name" -o jsonpath='{.status.phase}' 2>/dev/null)"
    phase_rc=$?
    set -e
    if [[ $phase_rc -eq 0 && ( "$pod_phase" == "Succeeded" || "$pod_phase" == "Failed" ) ]]; then
      break
    fi
    sleep 1
  done

  set +e
  pod_logs="$(kubectl -n "$namespace" logs "$pod_name" --all-containers=true 2>&1)"
  logs_rc=$?
  set -e
  if [[ $logs_rc -eq 0 && -n "$pod_logs" ]]; then
    raw_out="${raw_out}"$'\n'"${pod_logs}"
  fi
fi

cleanup_attempted="false"
cleanup_message=""

cleanup_lc="$(printf "%s" "$cleanup" | tr '[:upper:]' '[:lower:]')"
if [[ "$cleanup_lc" == "true" && -n "$pod_name" ]]; then
  cleanup_attempted="true"
  set +e
  cleanup_out="$(kubectl -n "$namespace" delete pod "$pod_name" --ignore-not-found 2>&1)"
  cleanup_rc=$?
  set -e
  if [[ $cleanup_rc -eq 0 ]]; then
    cleanup_message="$cleanup_out"
  else
    cleanup_message="cleanup failed: $cleanup_out"
  fi
fi

RAW_OUT="$raw_out" python3 - "$node_name" "$image_name" "$namespace" "$cmd_rc" "$pod_name" "$cleanup_attempted" "$cleanup_message" <<'PY'
import json
import os
import re
import sys

node = sys.argv[1]
image = sys.argv[2]
namespace = sys.argv[3]
cmd_rc = int(sys.argv[4])
pod_name = sys.argv[5]
cleanup_attempted = sys.argv[6].lower() == "true"
cleanup_message = sys.argv[7]
raw = os.environ.get("RAW_OUT", "")

# Strip ANSI escapes so snippets remain readable.
raw = re.sub(r"\x1B\[[0-9;]*[A-Za-z]", "", raw)
lines = raw.splitlines()

pass_count = sum(1 for l in lines if l.startswith("PASS "))
fail_count = sum(1 for l in lines if l.startswith("FAIL "))
warn_count = sum(1 for l in lines if l.startswith("WARN "))
skip_count = sum(1 for l in lines if l.startswith("SKIP "))

checks_line = ""
signals_line = ""
for l in lines:
    if "checks passed" in l:
        checks_line = l.strip()
    if "Signal(s) generated" in l:
        signals_line = l.strip()

has_check_lines = any(
    l.startswith(("PASS ", "FAIL ", "WARN ", "SKIP "))
    for l in lines
)
executed = (
    "Running node doctor..." in raw
    or "NODE DOCTOR REPORT" in raw
    or checks_line != ""
    or has_check_lines
)

if not executed:
    result = "unknown"
    fallback_reason = "node doctor checks did not execute or produced no parsable output"
elif cmd_rc != 0:
    result = "unknown"
    fallback_reason = f"node doctor command exited with code {cmd_rc}"
elif fail_count > 0:
    result = "fail"
    fallback_reason = ""
else:
    result = "pass"
    fallback_reason = ""

findings = []
if checks_line:
    findings.append(checks_line)
if signals_line:
    findings.append(signals_line)

signal_pat = re.compile(r"^Signal \d+:\s+(.+)$")
for l in lines:
    m = signal_pat.match(l.strip())
    if m:
        findings.append(f"Signal: {m.group(1)}")

snippet_lines = lines[-120:]
raw_snippet = "\n".join(snippet_lines)

out = {
    "node_doctor_attempted": True,
    "node_doctor_executed": executed,
    "node_doctor_node": node,
    "node_doctor_image": image,
    "node_doctor_namespace": namespace,
    "node_doctor_debug_pod": pod_name,
    "node_doctor_result": result,
    "node_doctor_command_rc": cmd_rc,
    "node_doctor_findings": findings,
    "node_doctor_counts": {
        "pass": pass_count,
        "fail": fail_count,
        "warn": warn_count,
        "skip": skip_count
    },
    "node_doctor_raw_snippet": raw_snippet,
    "node_doctor_fallback_reason": fallback_reason,
    "cleanup_attempted": cleanup_attempted,
    "cleanup_message": cleanup_message
}

print(json.dumps(out, indent=2))
PY

# Runtime failures are represented in JSON fields above. Exit 0 so callers can
# always parse structured output and decide fallback behavior.
exit 0

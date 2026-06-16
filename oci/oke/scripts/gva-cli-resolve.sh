#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WHEEL_NAME="oci_cli-3.65.2+preview.1.1355-py2.py3-none-any.whl"

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

mode="json"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --json)
      mode="json"
      shift
      ;;
    --print-home)
      mode="home"
      shift
      ;;
    --print-activate)
      mode="activate"
      shift
      ;;
    --print-wheel)
      mode="wheel"
      shift
      ;;
    -h|--help)
      cat <<'EOF'
usage: gva-cli-resolve.sh [--json|--print-home|--print-activate|--print-wheel]

Search order:
1. $OKE_GVA_CLI_HOME
2. <repo>/gva-cli
EOF
      exit 0
      ;;
    *)
      emit_error 2 "UNKNOWN_ARGUMENT" "Unknown argument: $1." \
        "Run with --help to view usage."
      ;;
  esac
done

declare -a candidates=()
if [[ -n "${OKE_GVA_CLI_HOME:-}" ]]; then
  candidates+=("$OKE_GVA_CLI_HOME")
fi
candidates+=(
  "$REPO_ROOT/gva-cli"
)

resolved_home=""
resolved_activate=""
resolved_wheel=""

for candidate in "${candidates[@]}"; do
  [[ -d "$candidate" ]] || continue
  activate_path="$candidate/bin/activate"
  wheel_path="$candidate/$WHEEL_NAME"
  resolved_home="$candidate"
  if [[ -f "$activate_path" ]]; then
    resolved_activate="$activate_path"
  fi
  if [[ -f "$wheel_path" ]]; then
    resolved_wheel="$wheel_path"
  fi
  break
done

if [[ -z "$resolved_home" ]]; then
  emit_error 1 "GVA_CLI_HOME_NOT_FOUND" \
    "Could not locate the preview GVA CLI workspace." \
    "Set OKE_GVA_CLI_HOME or place gva-cli under the OCI OKE skill root." \
    "https://github.com/oracle/skills/tree/main/oci/oke"
fi

case "$mode" in
  home)
    printf '%s\n' "$resolved_home"
    ;;
  activate)
    if [[ -z "$resolved_activate" ]]; then
      emit_error 1 "GVA_CLI_ACTIVATE_NOT_FOUND" \
        "Resolved GVA CLI home does not contain bin/activate." \
        "Recreate the virtual environment under the resolved GVA CLI home."
    fi
    printf '%s\n' "$resolved_activate"
    ;;
  wheel)
    if [[ -z "$resolved_wheel" ]]; then
      emit_error 1 "GVA_CLI_WHEEL_NOT_FOUND" \
        "Resolved GVA CLI home does not contain the preview OCI CLI wheel." \
        "Place the preview wheel in the resolved GVA CLI home or update the skill instructions."
    fi
    printf '%s\n' "$resolved_wheel"
    ;;
  json)
    python3 - "$resolved_home" "$resolved_activate" "$resolved_wheel" <<'PY'
import json
import sys

home = sys.argv[1]
activate = sys.argv[2]
wheel = sys.argv[3]

print(json.dumps({
  "home": home,
  "activate": activate,
  "wheel": wheel,
  "has_activate": bool(activate),
  "has_wheel": bool(wheel),
}, indent=2))
PY
    ;;
esac

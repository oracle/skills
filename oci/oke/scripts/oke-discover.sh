#!/usr/bin/env bash
set -euo pipefail

# Discover OKE cluster context for troubleshooting.
# Usage:
#   ./scripts/oke-discover.sh --cluster <name-or-ocid> [--region <region>] [--profile <oci-profile>] [--timeout <seconds>] [--kubeconfig <path>] [--deployment <name>]

cluster_ref=""
region_arg=""
profile_arg=""
timeout_arg=""
kubeconfig_arg=""
deployment_name=""

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
    --cluster)
      require_value "$1" "${2:-}"
      cluster_ref="$2"; shift 2 ;;
    --region)
      require_value "$1" "${2:-}"
      region_arg="$2"; shift 2 ;;
    --profile)
      require_value "$1" "${2:-}"
      profile_arg="$2"; shift 2 ;;
    --timeout)
      require_value "$1" "${2:-}"
      timeout_arg="$2"; shift 2 ;;
    --kubeconfig)
      require_value "$1" "${2:-}"
      kubeconfig_arg="$2"; shift 2 ;;
    --deployment)
      require_value "$1" "${2:-}"
      deployment_name="$2"; shift 2 ;;
    -h|--help)
      echo "usage: $0 --cluster <name-or-ocid> [--region <region>] [--profile <oci-profile>] [--timeout <seconds>] [--kubeconfig <path>] [--deployment <name>]" >&2
      exit 0 ;;
    *)
      emit_error 2 "UNKNOWN_ARGUMENT" "Unknown argument: $1." \
        "Run with --help to view usage." ;;
  esac
done

if [[ -z "$cluster_ref" ]]; then
  emit_error 2 "MISSING_REQUIRED_ARGUMENT" "Missing required --cluster." \
    "Provide --cluster <name-or-ocid>."
fi

if ! command -v oci >/dev/null 2>&1; then
  emit_error 2 "OCI_CLI_NOT_INSTALLED" "OCI CLI not found on PATH." \
    "Install OCI CLI and retry." \
    "https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm"
fi

# Read defaults from OCI config if present
config_file="$HOME/.oci/config"
config_region=""
if [[ -f "$config_file" ]]; then
  config_region=$(awk -F= '/^region=/{print $2; exit}' "$config_file" | tr -d ' ')
fi

have_timeout="no"
if command -v timeout >/dev/null 2>&1; then
  have_timeout="yes"
fi

use_py_timeout="no"
declare -a timeout_prefix=()
if [[ -n "$timeout_arg" ]]; then
  if [[ "$have_timeout" == "yes" ]]; then
    timeout_prefix=(timeout "$timeout_arg")
  else
    use_py_timeout="yes"
  fi
fi

declare -a profile_args=()
if [[ -n "$profile_arg" ]]; then
  profile_args=(--profile "$profile_arg")
elif [[ -n "${OCI_CLI_PROFILE:-}" ]]; then
  profile_args=(--profile "$OCI_CLI_PROFILE")
fi

oci_json() {
  local out err rc
  local -a cmd
  err="$(mktemp)"
  cmd=(oci --region "$region")
  if [[ ${#profile_args[@]} -gt 0 ]]; then
    cmd+=("${profile_args[@]}")
  fi
  cmd+=("$@")
  if [[ ${#timeout_prefix[@]} -gt 0 ]]; then
    cmd=("${timeout_prefix[@]}" "${cmd[@]}")
  fi
  if [[ "$use_py_timeout" == "yes" ]]; then
    set +e
    out="$(python3 - "$timeout_arg" "$err" "${cmd[@]}" <<'PY'
import subprocess, sys
timeout = float(sys.argv[1])
err_path = sys.argv[2]
cmd = sys.argv[3:]
try:
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout, text=True)
    if p.stderr:
        with open(err_path, "w") as f:
            f.write(p.stderr)
    sys.stdout.write(p.stdout or "")
    sys.exit(p.returncode)
except subprocess.TimeoutExpired:
    with open(err_path, "w") as f:
        f.write("Command timed out after %ss\n" % timeout)
    sys.exit(124)
PY
)"
    rc=$?
    set -e
  else
    set +e
    out="$("${cmd[@]}" 2>"$err")"
    rc=$?
    set -e
  fi
  if [[ $rc -ne 0 ]]; then
    echo "error: oci $* failed (exit $rc)" >&2
    sed -e 's/^/oci stderr: /' "$err" >&2
    rm -f "$err"
    return "$rc"
  fi
  rm -f "$err"
  printf "%s" "$out"
}

json_get_field() {
  local field="$1"
  python3 -c '
import json
import sys

field = sys.argv[1]
try:
    data = json.load(sys.stdin)
except Exception:
    data = {}

if isinstance(data, dict):
    value = data.get(field, "")
    if value is None:
        value = ""
    print(value)
else:
    print("")
' "$field"
}

cluster_ocid=""
cluster_name=""
cluster_k8s=""
compartment_ocid=""

if [[ "$cluster_ref" == ocid1.* ]]; then
  cluster_ocid="$cluster_ref"
else
  # Resolve from kubeconfig
  kubeconfig_path="${kubeconfig_arg:-$HOME/.kube/config}"
  if [[ -f "$kubeconfig_path" ]]; then
    cluster_ocid=$(python3 - "$kubeconfig_path" "$cluster_ref" <<'PY'
import sys
from pathlib import Path
try:
    import yaml
except Exception:
    print("")
    raise SystemExit(0)
path = Path(sys.argv[1])
name = sys.argv[2]
try:
    data = yaml.safe_load(path.read_text())
except Exception:
    print("")
    raise SystemExit(0)

contexts = data.get("contexts", []) or []
users = {u.get("name"): u.get("user", {}) for u in (data.get("users", []) or [])}

def pick_user(contexts, target):
    exact = []
    exact_ci = []
    contains = []
    for c in contexts:
        cname = c.get("name", "")
        cuser = (c.get("context", {}) or {}).get("user")
        if not cuser:
            continue
        if cname == target:
            exact.append((len(cname), cname, cuser))
        elif cname.lower() == target.lower():
            exact_ci.append((len(cname), cname, cuser))
        elif target and target in cname:
            contains.append((len(cname), cname, cuser))
    for bucket in (exact, exact_ci, contains):
        if bucket:
            bucket.sort()
            return bucket[0][2]
    return None

match_user = pick_user(contexts, name)

if not match_user:
    print("")
    raise SystemExit(0)

exec_cfg = users.get(match_user, {}).get("exec", {})
args = exec_cfg.get("args", []) if isinstance(exec_cfg, dict) else []
try:
    idx = args.index("--cluster-id")
    print(args[idx + 1])
except Exception:
    print("")
PY
    )
  fi
fi

if [[ -z "$cluster_ocid" ]]; then
  emit_error 1 "CLUSTER_OCID_NOT_RESOLVED" \
    "Could not resolve cluster OCID from kubeconfig." \
    "Provide cluster OCID directly with --cluster <ocid>."
fi

region_from_cluster_ocid="$(python3 - "$cluster_ocid" <<'PY'
import re
import sys

ocid = sys.argv[1].strip()
match = re.match(r"^ocid1\.cluster\.oc1\.([a-z0-9-]+)\..+$", ocid)
print(match.group(1) if match else "")
PY
)"

region="${region_arg:-${region_from_cluster_ocid:-$config_region}}"
if [[ -z "$region" ]]; then
  emit_error 2 "REGION_NOT_PROVIDED" \
    "Region not provided and could not be inferred from cluster OCID or OCI config." \
    "Provide --region <region> or set region in ~/.oci/config."
fi

# Fetch cluster details if possible
cluster_json=$(oci_json ce cluster get --cluster-id "$cluster_ocid" --query 'data.{name:"name",k8s:"kubernetes-version",compartment:"compartment-id"}' --output json || true)
if [[ -n "$cluster_json" && "$cluster_json" != "{}" ]]; then
  cluster_name=$(printf '%s' "$cluster_json" | json_get_field name)
  cluster_k8s=$(printf '%s' "$cluster_json" | json_get_field k8s)
  compartment_ocid=$(printf '%s' "$cluster_json" | json_get_field compartment)
else
  echo "warning: failed to fetch cluster details; returning partial context" >&2
  cluster_name="$cluster_ref"
fi

# Optional: try to resolve deployment namespace if kubectl is available
deployment_namespace=""
deployment_namespaces=""
if [[ -n "$deployment_name" ]]; then
  if command -v kubectl >/dev/null 2>&1; then
    deployment_namespaces=$(kubectl get deploy -A --no-headers 2>/dev/null | awk -v d="$deployment_name" '$2==d {print $1}' | paste -sd "," -)
    if [[ -n "$deployment_namespaces" ]]; then
      if [[ "$deployment_namespaces" == *,* ]]; then
        deployment_namespace=""
      else
        deployment_namespace="$deployment_namespaces"
      fi
    fi
  else
    echo "warning: kubectl not found; cannot resolve deployment namespace" >&2
  fi
fi

python3 - <<PY
import json
print(json.dumps({
  "cluster": {
    "name": "${cluster_name}",
    "id": "${cluster_ocid}",
    "kubernetes_version": "${cluster_k8s}",
    "compartment_id": "${compartment_ocid}",
    "region": "${region}"
  },
  "deployment": {
    "name": "${deployment_name}",
    "namespace": "${deployment_namespace}",
    "namespaces": "${deployment_namespaces}"
  }
}, indent=2))
PY

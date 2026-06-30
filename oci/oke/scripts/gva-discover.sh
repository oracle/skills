#!/usr/bin/env bash
set -euo pipefail

# Discover GVA-relevant data for an OKE cluster.
# Usage:
#   ./scripts/gva-discover.sh --cluster <name-or-ocid> [--region <region>] [--compartment-id <ocid>] [--profile <oci-profile>] [--timeout <seconds>] [--kubeconfig <path>]

cluster_ref=""
region_arg=""
compartment_arg=""
profile_arg=""
timeout_arg=""
kubeconfig_arg=""
cache_ttl_arg="0"
cache_dir_arg=""

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

read_lines_into_array() {
  local array_name="$1"
  local line=""
  eval "$array_name=()"
  while IFS= read -r line; do
    eval "$array_name+=(\"\$line\")"
  done
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --cluster)
      require_value "$1" "${2:-}"
      cluster_ref="$2"; shift 2 ;;
    --region)
      require_value "$1" "${2:-}"
      region_arg="$2"; shift 2 ;;
    --compartment-id)
      require_value "$1" "${2:-}"
      compartment_arg="$2"; shift 2 ;;
    --profile)
      require_value "$1" "${2:-}"
      profile_arg="$2"; shift 2 ;;
    --timeout)
      require_value "$1" "${2:-}"
      timeout_arg="$2"; shift 2 ;;
    --kubeconfig)
      require_value "$1" "${2:-}"
      kubeconfig_arg="$2"; shift 2 ;;
    --cache-ttl)
      require_value "$1" "${2:-}"
      cache_ttl_arg="$2"; shift 2 ;;
    --cache-dir)
      require_value "$1" "${2:-}"
      cache_dir_arg="$2"; shift 2 ;;
    -h|--help)
      echo "usage: $0 --cluster <name-or-ocid> [--region <region>] [--compartment-id <ocid>] [--profile <oci-profile>] [--timeout <seconds>] [--kubeconfig <path>] [--cache-ttl <seconds>] [--cache-dir <path>]" >&2
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

# Read tenancy and default region from OCI config if present
config_file="$HOME/.oci/config"
config_region=""
if [[ -f "$config_file" ]]; then
  config_region=$(awk -F= '/^region=/{print $2; exit}' "$config_file" | tr -d ' ')
fi

region="${region_arg:-$config_region}"
if [[ -z "$region" ]]; then
  emit_error 2 "REGION_NOT_PROVIDED" "Region not provided and not found in OCI config." \
    "Provide --region <region> or set region in ~/.oci/config."
fi

if ! [[ "$cache_ttl_arg" =~ ^[0-9]+$ ]]; then
  emit_error 2 "INVALID_ARGUMENT" "--cache-ttl must be a non-negative integer." \
    "Use --cache-ttl <seconds>."
fi

cache_dir="${cache_dir_arg:-${TMPDIR:-/tmp}/gva-discover-cache}"
cache_enabled="no"
cache_file=""
if [[ "$cache_ttl_arg" -gt 0 ]]; then
  mkdir -p "$cache_dir"
  cache_key=$(python3 - "$cluster_ref" "$region" "$compartment_arg" "$profile_arg" <<'PY'
import hashlib
import sys
raw = "|".join(sys.argv[1:])
print(hashlib.sha256(raw.encode("utf-8")).hexdigest())
PY
  )
  cache_file="${cache_dir}/${cache_key}.json"
  cache_enabled="yes"
  if [[ -f "$cache_file" ]]; then
    if python3 - "$cache_file" "$cache_ttl_arg" <<'PY'
import os
import sys
import time
path = sys.argv[1]
ttl = int(sys.argv[2])
age = time.time() - os.path.getmtime(path)
sys.exit(0 if age <= ttl else 1)
PY
    then
      cat "$cache_file"
      exit 0
    fi
  fi
fi

# Helper to run oci with region/profile/timeout
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
        f.write("Command timed out after %ss\\n" % timeout)
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

# If cluster ref is OCID, use it directly. Otherwise require compartment to search by name.
cluster_ocid=""
cluster_name=""
cluster_k8s=""
compartment_ocid=""
cluster_vcn_id=""

is_ocid="no"
if [[ "$cluster_ref" == ocid1.* ]]; then
  is_ocid="yes"
fi

if [[ "$is_ocid" == "yes" ]]; then
  cluster_ocid="$cluster_ref"
  cluster_json=$(oci_json ce cluster get --cluster-id "$cluster_ocid" --query 'data.{name:"name",k8s:"kubernetes-version",compartment:"compartment-id",vcn:"vcn-id"}' --output json || true)
  if [[ -z "$cluster_json" || "$cluster_json" == "{}" ]]; then
    echo "warning: failed to fetch cluster details for $cluster_ocid (check auth/region/profile)" >&2
  else
    cluster_name=$(printf '%s' "$cluster_json" | json_get_field name)
    cluster_k8s=$(printf '%s' "$cluster_json" | json_get_field k8s)
    compartment_ocid=$(printf '%s' "$cluster_json" | json_get_field compartment)
    cluster_vcn_id=$(printf '%s' "$cluster_json" | json_get_field vcn)
  fi
else
  # Try to resolve cluster OCID from kubeconfig if no compartment was provided.
  if [[ -z "$compartment_arg" ]]; then
    kubeconfig_path="${kubeconfig_arg:-$HOME/.kube/config}"
    if [[ -f "$kubeconfig_path" ]]; then
      kube_cluster_id=$(python3 - "$kubeconfig_path" "$cluster_ref" <<'PY'
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
      if [[ -n "$kube_cluster_id" ]]; then
        cluster_ocid="$kube_cluster_id"
        is_ocid="yes"
      else
        # Fallback: iterate all cluster-ids in kubeconfig and match by name via oci ce cluster get
        read_lines_into_array kube_cluster_ids < <(python3 - "$kubeconfig_path" <<'PY'
import sys
from pathlib import Path
try:
    import yaml
except Exception:
    sys.exit(0)
path = Path(sys.argv[1])
try:
    data = yaml.safe_load(path.read_text())
except Exception:
    sys.exit(0)
users = {u.get("name"): u.get("user", {}) for u in (data.get("users", []) or [])}
ids = []
for u in users.values():
    exec_cfg = u.get("exec", {})
    args = exec_cfg.get("args", []) if isinstance(exec_cfg, dict) else []
    for i, a in enumerate(args):
        if a == "--cluster-id" and i + 1 < len(args):
            ids.append(args[i + 1])
print("\\n".join(sorted(set(ids))))
PY
        )
        if [[ ${#kube_cluster_ids[@]} -gt 0 ]]; then
          for cid in "${kube_cluster_ids[@]}"; do
            match_json=$(oci_json ce cluster get --cluster-id "$cid" --query 'data.{name:"name",k8s:"kubernetes-version",compartment:"compartment-id",vcn:"vcn-id"}' --output json || true)
            if [[ -n "$match_json" && "$match_json" != "{}" ]]; then
              match_name=$(printf '%s' "$match_json" | json_get_field name)
              if [[ "$match_name" == "$cluster_ref" ]]; then
                cluster_ocid="$cid"
                cluster_name="$match_name"
                cluster_k8s=$(printf '%s' "$match_json" | json_get_field k8s)
                compartment_ocid=$(printf '%s' "$match_json" | json_get_field compartment)
                cluster_vcn_id=$(printf '%s' "$match_json" | json_get_field vcn)
                is_ocid="yes"
                break
              fi
            fi
          done
        fi
      fi
    fi
  fi

  if [[ "$is_ocid" == "yes" ]]; then
    cluster_json=$(oci_json ce cluster get --cluster-id "$cluster_ocid" --query 'data.{name:"name",k8s:"kubernetes-version",compartment:"compartment-id",vcn:"vcn-id"}' --output json || true)
    if [[ -z "$cluster_json" || "$cluster_json" == "{}" ]]; then
      echo "warning: failed to fetch cluster details for $cluster_ocid (check auth/region/profile)" >&2
    else
      cluster_name=$(printf '%s' "$cluster_json" | json_get_field name)
      cluster_k8s=$(printf '%s' "$cluster_json" | json_get_field k8s)
      compartment_ocid=$(printf '%s' "$cluster_json" | json_get_field compartment)
      cluster_vcn_id=$(printf '%s' "$cluster_json" | json_get_field vcn)
    fi
  fi

  # Require a compartment to search by name (avoid tenancy-wide scans).
  if [[ -z "$compartment_arg" && -z "$compartment_ocid" && "$is_ocid" != "yes" ]]; then
    emit_error 2 "COMPARTMENT_REQUIRED_FOR_CLUSTER_NAME" \
      "Compartment ID is required when using a cluster name." \
      "Provide --compartment-id, use cluster OCID, or use kubeconfig that includes --cluster-id."
  fi

  comp_to_search="${compartment_arg:-$compartment_ocid}"
  clusters_json=$(oci_json ce cluster list --compartment-id "$comp_to_search" --output json || true)
  hit=""
  if [[ -n "$clusters_json" ]]; then
    hit=$(printf '%s' "$clusters_json" | CLUSTER_REF="$cluster_ref" python3 -c '
import json
import os
import sys

target = os.environ.get("CLUSTER_REF", "")
try:
    payload = json.loads(sys.stdin.read())
except Exception:
    print("")
    raise SystemExit(0)

items = payload.get("data", []) if isinstance(payload, dict) else []
for item in items:
    if (item or {}).get("name", "") == target:
        print(json.dumps(item))
        break
')
  fi
  if [[ -n "$hit" && "$hit" != "null" ]]; then
    cluster_ocid=$(printf '%s' "$hit" | json_get_field id)
    cluster_name=$(printf '%s' "$hit" | json_get_field name)
    cluster_k8s=$(printf '%s' "$hit" | json_get_field kubernetes-version)
    compartment_ocid="$comp_to_search"
  fi
fi

if [[ -z "$compartment_ocid" && -n "$compartment_arg" ]]; then
  compartment_ocid="$compartment_arg"
fi

# Pull subnets and NSGs in the compartment
subnets_json="[]"
nsGs_json="[]"
if [[ -n "$compartment_ocid" ]]; then
  subnets_tmp="$(mktemp)"
  nsgs_tmp="$(mktemp)"

  if [[ -n "$cluster_vcn_id" ]]; then
    (
      oci_json network subnet list --compartment-id "$compartment_ocid" --vcn-id "$cluster_vcn_id" --query 'data[*].{"name":"display-name","id":"id","cidr":"cidr-block","ipv6":"ipv6-cidr-blocks"}' --output json || true
    ) >"$subnets_tmp" &
    subnets_pid=$!
    (
      oci_json network nsg list --compartment-id "$compartment_ocid" --vcn-id "$cluster_vcn_id" --query 'data[*].{"name":"display-name","id":"id"}' --output json || true
    ) >"$nsgs_tmp" &
    nsgs_pid=$!
  else
    (
      oci_json network subnet list --compartment-id "$compartment_ocid" --query 'data[*].{"name":"display-name","id":"id","cidr":"cidr-block","ipv6":"ipv6-cidr-blocks"}' --output json || true
    ) >"$subnets_tmp" &
    subnets_pid=$!
    (
      oci_json network nsg list --compartment-id "$compartment_ocid" --query 'data[*].{"name":"display-name","id":"id"}' --output json || true
    ) >"$nsgs_tmp" &
    nsgs_pid=$!
  fi

  wait "$subnets_pid" || true
  wait "$nsgs_pid" || true
  subnets_json="$(cat "$subnets_tmp")"
  nsGs_json="$(cat "$nsgs_tmp")"
  rm -f "$subnets_tmp" "$nsgs_tmp"

  if [[ -z "$subnets_json" ]]; then
    subnets_json="[]"
    echo "warning: failed to list subnets for compartment $compartment_ocid" >&2
  fi
  if [[ -z "$nsGs_json" ]]; then
    nsGs_json="[]"
    echo "warning: failed to list NSGs for compartment $compartment_ocid" >&2
  fi
fi

# Output consolidated JSON
result_json=$(python3 - <<PY
import json
out = {
  "cluster": {
    "name": "${cluster_name}",
    "id": "${cluster_ocid}",
    "kubernetes_version": "${cluster_k8s}",
    "compartment_id": "${compartment_ocid}",
    "region": "${region}",
    "vcn_id": "${cluster_vcn_id}"
  },
  "subnets": json.loads('''${subnets_json:-[]}''') if '''${subnets_json:-}'''.strip() else [],
  "nsgs": json.loads('''${nsGs_json:-[]}''') if '''${nsGs_json:-}'''.strip() else []
}
print(json.dumps(out, indent=2))
PY
)

if [[ "$cache_enabled" == "yes" && -n "$cache_file" ]]; then
  printf "%s\n" "$result_json" > "$cache_file"
fi

printf "%s\n" "$result_json"

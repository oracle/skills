#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
GVA_DISCOVER_SCRIPT="$SCRIPT_DIR/gva-discover.sh"

say() { printf "%s\n" "$*"; }

emit_error() {
  local exit_code="$1"
  local error_code="$2"
  local message="$3"
  local remediation="$4"
  local docs_url="${5:-}"
  python3 - "$error_code" "$message" "$remediation" "$docs_url" <<'PY' >&2
import json
import sys

print(json.dumps({
    "error_code": sys.argv[1],
    "message": sys.argv[2],
    "remediation": sys.argv[3],
    "docs_url": sys.argv[4],
}))
PY
  exit "$exit_code"
}

ask() {
  local prompt="$1" var
  read -r -p "$prompt" var
  printf "%s" "$var"
}

ask_required() {
  local prompt="$1"
  local value=""
  while [[ -z "$value" ]]; do
    value=$(ask "$prompt")
    if [[ -z "$value" ]]; then
      say "A value is required."
    fi
  done
  printf "%s" "$value"
}

read_lines_into_array() {
  local array_name="$1"
  local line=""
  eval "$array_name=()"
  while IFS= read -r line; do
    eval "$array_name+=(\"\$line\")"
  done
}

select_from_list() {
  local prompt="$1"
  local allow_manual="$2"
  shift 2
  local items=("$@")
  local options=("${items[@]}")
  local choice=""
  if [[ "$allow_manual" == "yes" ]]; then
    options+=("Manual entry")
  fi
  say "$prompt"
  select choice in "${options[@]}"; do
    if [[ "$allow_manual" == "yes" && "$choice" == "Manual entry" ]]; then
      choice=""
      break
    elif [[ -n "$choice" ]]; then
      break
    else
      say "Choose one of the listed options."
    fi
  done
  printf "%s" "$choice"
}

normalize_none() {
  local v="$1"
  local v_lower
  v_lower="$(printf "%s" "$v" | tr '[:upper:]' '[:lower:]')"
  case "$v_lower" in
    ""|"0"|"none"|"no"|"n"|"skip") echo "" ;;
    *) echo "$v" ;;
  esac
}

lower() {
  printf "%s" "$1" | tr '[:upper:]' '[:lower:]'
}

oci_node_pool_create_supports_gva() {
  oci ce node-pool create --help 2>/dev/null | grep -Eq 'secondary-vnics|cni-type'
}

verify_gva_cli_before_create() {
  if ! command -v oci >/dev/null 2>&1; then
    emit_error 1 "OCI_CLI_NOT_FOUND" \
      "OCI CLI is required to create a GVA node pool." \
      "Install OCI CLI or choose Print command only."
  fi

  if ! oci_node_pool_create_supports_gva; then
    emit_error 1 "GVA_CLI_FLAGS_UNAVAILABLE" \
      "OCI CLI does not expose --secondary-vnics or --cni-type for node-pool create." \
      "Upgrade OCI CLI to a version with GA GVA support, or choose Print command only."
  fi
}

line_field() {
  local line="$1"
  local field_no="$2"
  printf "%s" "$line" | cut -d'|' -f"$field_no" | xargs
}

ip_count_valid() {
  local value="$1"
  [[ "$value" =~ ^[0-9]+$ ]] || return 1
  (( value >= 1 && value <= 256 ))
}

oci_available="yes"
if ! command -v oci >/dev/null 2>&1; then
  oci_available="no"
fi

say "GVA Node Pool Builder (OKE)"
say "This wizard collects fresh values for every new node pool creation."
say "It does not reuse prior drafts or previous mutable node-pool settings."
say "Saved JSON payloads are ignored for new node pool creation."
say "Answer the prompts to generate an OCI CLI command."

cluster_name=$(ask_required "Cluster name (required, no default): ")
region=$(ask_required "Region for the selected cluster (e.g., us-ashburn-1): ")

profile_name=$(ask "OCI CLI profile (optional): ")

# Try to resolve cluster OCID from kubeconfig
kubeconfig_path="$HOME/.kube/config"
cluster_ocid=""
if [[ -f "$kubeconfig_path" ]]; then
  cluster_ocid=$(python3 - "$kubeconfig_path" "$cluster_name" <<'PY'
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

if [[ -z "$cluster_ocid" ]]; then
  cluster_ocid=$(ask_required "Cluster OCID (not found in kubeconfig): ")
else
  say "Detected cluster OCID from kubeconfig."
fi

compartment_ocid=""
discovery_json=""
if [[ "$oci_available" == "yes" ]]; then
  discover_cmd=("$GVA_DISCOVER_SCRIPT" --cluster "$cluster_ocid" --timeout 10)
  if [[ -n "$region" ]]; then
    discover_cmd+=(--region "$region")
  fi
  if [[ -n "$profile_name" ]]; then
    discover_cmd+=(--profile "$profile_name")
  fi
  discovery_json=$("${discover_cmd[@]}" 2>/dev/null || true)
fi

cluster_k8s=""
subnet_lines=()
secondary_subnet_lines=()
nsg_lines=()
vcn_lines=()

if [[ -n "$discovery_json" ]]; then
  cluster_k8s=$(python3 - "$discovery_json" <<'PY'
import json,sys
try:
    d=json.loads(sys.argv[1])
except Exception:
    d={}
print(d.get('cluster',{}).get('kubernetes_version',''))
PY
  )

  comp_from_discovery=$(python3 - "$discovery_json" <<'PY'
import json,sys
try:
    d=json.loads(sys.argv[1])
except Exception:
    d={}
print(d.get('cluster',{}).get('compartment_id',''))
PY
  )

  region_from_discovery=$(python3 - "$discovery_json" <<'PY'
import json,sys
try:
    d=json.loads(sys.argv[1])
except Exception:
    d={}
print(d.get('cluster',{}).get('region',''))
PY
  )

  if [[ -z "$compartment_ocid" && -n "$comp_from_discovery" ]]; then
    compartment_ocid="$comp_from_discovery"
  fi
  if [[ -z "$region" && -n "$region_from_discovery" ]]; then
    region="$region_from_discovery"
  fi

  read_lines_into_array subnet_lines < <(python3 - "$discovery_json" <<'PY'
import json,sys
try:
    d=json.loads(sys.argv[1])
except Exception:
    d={}
subnets = d.get('subnets', [])
if isinstance(subnets, dict):
    subnets = subnets.get('data', [])
for s in subnets:
    name=s.get('name') or ''
    sid=s.get('id') or ''
    cidr=s.get('cidr') or ''
    ipv6=s.get('ipv6') or []
    ipv6_status='has-ipv6' if ipv6 else 'ipv4-only'
    if name and sid:
        print(f"{name} | {cidr} | {ipv6_status} | {sid}")
PY
  )

  read_lines_into_array nsg_lines < <(python3 - "$discovery_json" <<'PY'
import json,sys
try:
    d=json.loads(sys.argv[1])
except Exception:
    d={}
nsgs = d.get('nsgs', [])
if isinstance(nsgs, dict):
    nsgs = nsgs.get('data', [])
for n in nsgs:
    name=n.get('name') or ''
    nid=n.get('id') or ''
    if name and nid:
        print(f"{name} | {nid}")
PY
  )
fi

if [[ -z "$compartment_ocid" ]]; then
  compartment_ocid=$(ask_required "Compartment OCID: ")
fi

config_file="$HOME/.oci/config"
tenancy_ocid=""
if [[ -f "$config_file" ]]; then
  tenancy_ocid=$(awk -F= '/^tenancy=/{print $2; exit}' "$config_file" | tr -d ' ')
fi

ad_lines=()
if [[ "$oci_available" == "yes" ]]; then
  ad_compartment="${tenancy_ocid:-$compartment_ocid}"
  ad_json=$(oci iam availability-domain list --compartment-id "$ad_compartment" --region "$region" --query 'data[*].name' --output json 2>/dev/null || true)
  if [[ -n "$ad_json" && "$ad_json" != "[]" ]]; then
    read_lines_into_array ad_lines < <(python3 - <<'PY'
import json,sys
try:
    data=json.loads(sys.stdin.read())
except Exception:
    data=[]
for item in data:
    if item:
        print(item)
PY
    <<<"$ad_json")
  fi
fi

if [[ ${#ad_lines[@]} -gt 0 ]]; then
  ad=$(select_from_list "Select Availability Domain:" "no" "${ad_lines[@]}")
else
  ad=$(ask_required "Availability Domain (e.g., GrCh:US-ASHBURN-AD-1): ")
fi

vcn_id=""
if [[ "$oci_available" == "yes" && -n "$compartment_ocid" ]]; then
  vcn_json=$(oci network vcn list --compartment-id "$compartment_ocid" --region "$region" --query 'data[*].{name:"display-name",id:id,cidr:"cidr-block"}' --output json 2>/dev/null || true)
  if [[ -n "$vcn_json" && "$vcn_json" != "[]" ]]; then
    read_lines_into_array vcn_lines < <(python3 - "$vcn_json" <<'PY'
import json,sys
try:
    d=json.loads(sys.argv[1])
except Exception:
    d={}
for v in d if isinstance(d, list) else []:
    name=v.get('name') or ''
    vid=v.get('id') or ''
    cidr=v.get('cidr') or ''
    if name and vid:
        print(f"{name} | {cidr} | {vid}")
PY
    )
  fi
fi

if [[ ${#vcn_lines[@]} -gt 0 ]]; then
  selection=$(select_from_list "Select VCN:" "yes" "${vcn_lines[@]}")
  if [[ -n "$selection" ]]; then
    vcn_id=$(printf "%s" "$selection" | cut -d'|' -f3 | xargs)
  fi
fi
if [[ -z "$vcn_id" ]]; then
  vcn_id=$(ask_required "VCN OCID: ")
fi

if [[ -n "$vcn_id" ]]; then
  subnet_lines=()
  secondary_subnet_lines=()
  subnet_json=$(oci network subnet list --compartment-id "$compartment_ocid" --vcn-id "$vcn_id" --region "$region" --query 'data[*].{"name":"display-name","id":"id","cidr":"cidr-block","ipv4Cidrs":"ipv4-cidr-blocks","ipv6":"ipv6-cidr-blocks"}' --output json 2>/dev/null || true)
  if [[ -n "$subnet_json" && "$subnet_json" != "[]" ]]; then
    read_lines_into_array subnet_lines < <(python3 - "$subnet_json" <<'PY'
import json,sys
try:
    d=json.loads(sys.argv[1])
except Exception:
    d={}
for s in d.get('data', d) if isinstance(d, dict) else d:
    name=s.get('name') or s.get('display-name') or ''
    sid=s.get('id') or ''
    cidr=s.get('cidr') or s.get('cidr-block') or ''
    ipv6=s.get('ipv6') or s.get('ipv6-cidr-blocks') or []
    ipv6_status='has-ipv6' if ipv6 else 'ipv4-only'
    if name and sid:
        print(f"{name} | {cidr} | {ipv6_status} | {sid}")
PY
    )
    read_lines_into_array secondary_subnet_lines < <(python3 - "$subnet_json" <<'PY'
import json,sys
try:
    d=json.loads(sys.argv[1])
except Exception:
    d={}
for s in d.get('data', d) if isinstance(d, dict) else d:
    name=s.get('name') or s.get('display-name') or ''
    sid=s.get('id') or ''
    cidr=s.get('cidr') or s.get('cidr-block') or ''
    ipv6=s.get('ipv6') or s.get('ipv6-cidr-block')
    ipv4_cidrs=s.get('ipv4Cidrs') or s.get('ipv4-cidr-blocks') or []
    cidr_count=len(ipv4_cidrs) if isinstance(ipv4_cidrs, list) else 0
    if name and sid and not ipv6 and cidr_count > 1:
        print(f"{name} | {cidr} | {sid}")
PY
    )
  fi
fi

primary_subnet=""
if [[ ${#subnet_lines[@]} -gt 0 ]]; then
  selection=$(select_from_list "Select primary subnet (node placement):" "yes" "${subnet_lines[@]}")
  if [[ -n "$selection" ]]; then
    primary_subnet=$(line_field "$selection" 4)
  fi
fi
if [[ -z "$primary_subnet" ]]; then
  primary_subnet=$(ask_required "Primary subnet OCID (node placement subnet): ")
fi

node_pool_name=$(ask_required "Node pool name: ")

k8s_version=""
if [[ -n "$cluster_k8s" ]]; then
  k8s_version=$cluster_k8s
  say "Using cluster Kubernetes version: $k8s_version"
fi
if [[ -z "$k8s_version" ]]; then
  k8s_version=$(ask_required "Kubernetes version (e.g., v1.34.1): ")
fi

shape=$(ask_required "Node shape (e.g., VM.Standard.E5.Flex): ")

type_is_flex="no"
case "$shape" in
  *.Flex) type_is_flex="yes" ;;
  *) type_is_flex="no" ;;
 esac

ocpus=""
mem_gb=""
if [[ "$type_is_flex" == "yes" ]]; then
  ocpus=$(ask_required "OCPUs per node: ")
  mem_gb=$(ask_required "Memory GB per node: ")
fi

node_count=$(ask_required "Node count: ")

# Image selection: list images for k8s version and prompt
image_ocid=""
if [[ "$oci_available" == "yes" && -n "$k8s_version" ]]; then
  img_json=$(oci ce node-pool-options get --node-pool-option-id "$cluster_ocid" --region "$region" --query 'data.sources[*].{"image":"image-id","name":"source-name"}' --output json 2>/dev/null || true)
  if [[ -n "$img_json" && "$img_json" != "[]" ]]; then
    read_lines_into_array img_lines < <(python3 - "$img_json" "$k8s_version" <<'PY'
import json,sys,re
try:
    d=json.loads(sys.argv[1])
except Exception:
    d=[]
pattern=re.compile(rf'OKE-{re.escape(sys.argv[2])}')
items=[x for x in d if pattern.search(x.get('name',''))]
for x in items:
    print(f"{x.get('name')} | {x.get('image')}")
PY
    )
    if [[ ${#img_lines[@]} -gt 0 ]]; then
      selection=$(select_from_list "Select OKE image for $k8s_version:" "yes" "${img_lines[@]}")
      if [[ -n "$selection" ]]; then
        image_ocid=$(printf "%s" "$selection" | cut -d'|' -f2 | xargs)
      fi
    fi
  fi
fi

if [[ -z "$image_ocid" ]]; then
  image_ocid=$(ask_required "Image OCID: ")
fi

say ""
say "CNI must be OCI_VCN_IP_NATIVE for GVA."
say "1) Yes"
say "2) No"
while true; do
  say "Choose 1 or 2:"
  IFS= read -r cni_ok
  case "$cni_ok" in
    1|Yes|yes|Y|y) break ;;
    2|No|no|N|n)
      emit_error 1 "GVA_REQUIRES_VCN_NATIVE_CNI" \
        "GVA is unsupported without OCI_VCN_IP_NATIVE." \
        "Use an OKE cluster with VCN-native pod networking before creating a GVA node pool."
      ;;
    *) say "Choose one of the listed options." ;;
  esac
done

# Collect VNIC profiles
profiles=()
profile_summaries=()
application_resources=()
while true; do
  say ""
  say "Add a secondary VNIC profile (GVA tier)"
  while true; do
    app_res=$(ask "  applicationResource (label): ")
    if [[ -z "$app_res" ]]; then
      say "  applicationResource is required."
      continue
    fi
    duplicate="no"
    if [[ ${#application_resources[@]} -gt 0 ]]; then
      for existing in "${application_resources[@]}"; do
        if [[ "$existing" == "$app_res" ]]; then
          duplicate="yes"
          break
        fi
      done
    fi
    if [[ "$duplicate" == "yes" ]]; then
      say "  applicationResource values must be unique across profiles."
      continue
    fi
    break
  done

  subnet_id=""
  subnet_summary=""
  while [[ -z "$subnet_id" ]]; do
    if [[ ${#secondary_subnet_lines[@]} -gt 0 ]]; then
      selection=$(select_from_list "  Select subnet for this profile (IPv4-only, >1 IPv4 CIDR block):" "yes" "${secondary_subnet_lines[@]}")
      if [[ -n "$selection" ]]; then
        subnet_id=$(line_field "$selection" 3)
        subnet_summary="$(line_field "$selection" 1) ($(line_field "$selection" 2))"
      fi
    fi
    if [[ -z "$subnet_id" ]]; then
      subnet_id=$(ask "  subnetId OCID (must be IPv4-only and have >1 IPv4 CIDR block): ")
      if [[ -n "$subnet_id" ]]; then
        say "  Manual subnet entry cannot be OCI-validated. Ensure the subnet is IPv4-only and has more than one IPv4 CIDR block."
        subnet_summary="$subnet_id"
      fi
    fi
  done

  while true; do
    ip_count=$(ask "  ipCount (1-256): ")
    if ip_count_valid "$ip_count"; then
      break
    fi
    say "  ipCount must be an integer between 1 and 256."
  done

  nsg_ids=""
  if [[ ${#nsg_lines[@]} -gt 0 ]]; then
    selection=$(select_from_list "  Select NSG (or Manual entry for none/custom):" "yes" "${nsg_lines[@]}")
    if [[ -n "$selection" ]]; then
      nsg_ids=$(printf "%s" "$selection" | cut -d'|' -f2 | xargs)
    fi
    nsg_ids=$(normalize_none "$nsg_ids")
  else
    nsg_ids=$(normalize_none "$(ask "  nsgIds (comma-separated OCIDs, optional): ")")
  fi

  display_name=$(ask "  displayName (optional): ")

  profile_json="$(
    APP_RES="$app_res" \
    SUBNET_ID="$subnet_id" \
    IP_COUNT="$ip_count" \
    NSG_IDS="$nsg_ids" \
    DISPLAY_NAME="$display_name" \
    python3 - <<'PY'
import json
import os
import sys

app_res = os.environ.get("APP_RES", "")
subnet_id = os.environ.get("SUBNET_ID", "")
display_name = os.environ.get("DISPLAY_NAME", "")
nsg_ids_raw = os.environ.get("NSG_IDS", "")
ip_count_raw = os.environ.get("IP_COUNT", "")

try:
    ip_count = int(ip_count_raw)
except ValueError:
    print("Invalid ipCount. Expected an integer.", file=sys.stderr)
    sys.exit(2)

nsg_ids = [x.strip() for x in nsg_ids_raw.split(",") if x.strip()] if nsg_ids_raw else None
display_field = display_name if display_name else None

obj = {
    "createVnicDetails": {
        "ipCount": ip_count,
        "applicationResources": [app_res],
        "assignPublicIp": False,
        "displayName": display_field,
        "nsgIds": nsg_ids,
        "subnetId": subnet_id,
        "skipSourceDestCheck": False,
    },
    "displayName": display_field,
}

print(json.dumps(obj, separators=(",", ":")))
PY
  )"

  profiles+=("$profile_json")
  application_resources+=("$app_res")
  profile_summaries+=("$app_res | ipCount=$ip_count | subnet=$subnet_summary")

  say ""
  select more in "Add another profile" "Finish"; do
    case "$more" in
      "Add another profile") break ;;
      "Finish") more=""; break 2 ;;
    esac
  done
 done

secondary_vnics_json="["
for i in "${!profiles[@]}"; do
  secondary_vnics_json+="${profiles[$i]}"
  if [[ $i -lt $((${#profiles[@]}-1)) ]]; then
    secondary_vnics_json+=",";
  fi
 done
secondary_vnics_json+="]"

# Build node shape config
shape_config="{}"
if [[ "$type_is_flex" == "yes" ]]; then
  shape_config="{\"ocpus\":$ocpus,\"memoryInGBs\":$mem_gb}"
fi

optional_args=()
add_optional=$(ask "Add optional node-pool parameters? (y/N): ")
if [[ "$(lower "$add_optional")" == "y" || "$(lower "$add_optional")" == "yes" ]]; then
  defined_tags=$(ask "  --defined-tags (JSON or file://path, optional): ")
  if [[ -n "$defined_tags" ]]; then
    optional_args+=("--defined-tags" "$defined_tags")
  fi

  freeform_tags=$(ask "  --freeform-tags (JSON or file://path, optional): ")
  if [[ -n "$freeform_tags" ]]; then
    optional_args+=("--freeform-tags" "$freeform_tags")
  fi

  initial_labels=$(ask "  --initial-node-labels (JSON or file://path, optional): ")
  if [[ -n "$initial_labels" ]]; then
    optional_args+=("--initial-node-labels" "$initial_labels")
  fi

  max_pods=$(ask "  --max-pods-per-node (integer, optional): ")
  if [[ -n "$max_pods" ]]; then
    optional_args+=("--max-pods-per-node" "$max_pods")
  fi

  pv_encrypt=$(ask "  --is-pv-encryption-in-transit-enabled? (y/N): ")
  if [[ "$(lower "$pv_encrypt")" == "y" || "$(lower "$pv_encrypt")" == "yes" ]]; then
    optional_args+=("--is-pv-encryption-in-transit-enabled" "true")
  fi

  kms_key=$(ask "  --kms-key-id (OCID, optional): ")
  if [[ -n "$kms_key" ]]; then
    optional_args+=("--kms-key-id" "$kms_key")
  fi

  boot_size=$(ask "  --node-boot-volume-size-in-gbs (integer, optional): ")
  if [[ -n "$boot_size" ]]; then
    optional_args+=("--node-boot-volume-size-in-gbs" "$boot_size")
  fi

  node_metadata=$(ask "  --node-metadata (JSON or file://path, optional): ")
  if [[ -n "$node_metadata" ]]; then
    optional_args+=("--node-metadata" "$node_metadata")
  fi

  ssh_key=$(ask "  --ssh-public-key (string or file://path, optional): ")
  if [[ -n "$ssh_key" ]]; then
    optional_args+=("--ssh-public-key" "$ssh_key")
  fi
fi

say ""
say "Summary:"
say "- Cluster: $cluster_name"
say "- Cluster OCID: $cluster_ocid"
say "- Region: $region"
say "- Compartment: $compartment_ocid"
say "- AD: $ad"
say "- Node pool: $node_pool_name"
say "- Shape: $shape"
say "- Node count: $node_count"
say "- K8s version: $k8s_version"
say "- Primary subnet: $primary_subnet"
for p in "${profile_summaries[@]}"; do
  say "- VNIC: $p"
 done

confirm_generate=$(ask "Generate a create command with these values? (y/N): ")
confirm_generate=$(lower "$confirm_generate")
if [[ "$confirm_generate" != "y" && "$confirm_generate" != "yes" ]]; then
  say "Aborted before command generation."
  exit 0
fi

say ""
say "Choose next action:"
say "1) Run command now"
say "2) Print command only"
say "3) Exit without output"
choice=$(ask "Select (1/2/3): ")

if [[ "$choice" == "1" ]]; then
  run_now="yes"
elif [[ "$choice" == "2" ]]; then
  run_now="no"
elif [[ "$choice" == "3" ]]; then
  say "Aborted."
  exit 0
else
  say "Unknown choice; printing command only."
  run_now="no"
fi

say ""
say "Generated OCI CLI command:"
cmd=(oci)
if [[ -n "$profile_name" ]]; then
  cmd+=(--profile "$profile_name")
fi
cmd+=(
  --region "$region"
  ce node-pool create
  --compartment-id "$compartment_ocid"
  --cluster-id "$cluster_ocid"
  --name "$node_pool_name"
  --kubernetes-version "$k8s_version"
  --node-shape "$shape"
  --node-shape-config "$shape_config"
  --size "$node_count"
  --cni-type OCI_VCN_IP_NATIVE
  --placement-configs "[{\"availabilityDomain\":\"$ad\",\"subnetId\":\"$primary_subnet\"}]"
  --node-source-details "{\"sourceType\":\"IMAGE\",\"imageId\":\"$image_ocid\"}"
  --secondary-vnics "$secondary_vnics_json"
)
if [[ ${#optional_args[@]} -gt 0 ]]; then
  cmd+=("${optional_args[@]}")
fi
printf '%q ' "${cmd[@]}"
printf '\n'

if [[ "$run_now" == "yes" ]]; then
  final_confirmation=$(ask "Type CREATE to run the node-pool create command now: ")
  if [[ "$final_confirmation" != "CREATE" ]]; then
    say "Run cancelled. Command was not executed."
    exit 0
  fi
  say ""
  say "Verifying OCI CLI support for GVA node-pool flags..."
  verify_gva_cli_before_create
  say "Running command..."
  "${cmd[@]}"
fi

say ""
say "Sample test Deployment (replace ResourceName/image):"
cat <<'YAML'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gva-test
spec:
  replicas: 1
  selector:
    matchLabels:
      app: gva-test
  template:
    metadata:
      labels:
        app: gva-test
    spec:
      tolerations:
        - key: "oci.oraclecloud.com/application-resource-only"
          operator: "Exists"
          effect: "NoSchedule"
      containers:
        - name: app
          image: <image>
          resources:
            requests:
              oke-application-resource.oci.oraclecloud.com/ResourceName: "1"
            limits:
              oke-application-resource.oci.oraclecloud.com/ResourceName: "1"
YAML

say ""
say "Next steps:"
say "1) Verify resources on a node: kubectl describe node <node_name>"
say "2) Apply the test Deployment (with your chosen ResourceName)."

#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIRM="$SCRIPT_DIR/confirm_gate.sh"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"

REGION=""
COMPARTMENT_ID=""
TOPOLOGY=""
VCN_NAME=""
VCN_CIDR=""
SUBNET_NAME=""
SUBNET_CIDR=""
ALLOW_NETWORK_CREATE=""
MACHINE_READABLE="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --region)
      REGION="${2:-}"
      shift 2
      ;;
    --compartment-id)
      COMPARTMENT_ID="${2:-}"
      shift 2
      ;;
    --topology)
      TOPOLOGY="${2:-}"
      shift 2
      ;;
    --vcn-name)
      VCN_NAME="${2:-}"
      shift 2
      ;;
    --vcn-cidr)
      VCN_CIDR="${2:-}"
      shift 2
      ;;
    --subnet-name)
      SUBNET_NAME="${2:-}"
      shift 2
      ;;
    --subnet-cidr)
      SUBNET_CIDR="${2:-}"
      shift 2
      ;;
    --allow-network-create)
      ALLOW_NETWORK_CREATE="${2:-}"
      shift 2
      ;;
    --machine-readable)
      # Used by common.sh:is_machine_readable after argument parsing.
      # shellcheck disable=SC2034
      MACHINE_READABLE="true"
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$REGION" || -z "$COMPARTMENT_ID" ]]; then
  echo "Usage: $0 --region <region> --compartment-id <ocid> --allow-network-create yes [--topology private|public|mixed] [--vcn-name ...] [--vcn-cidr ...] [--subnet-name ...] [--subnet-cidr ...] [--machine-readable]" >&2
  exit 1
fi

run_confirmed() {
  local description="$1"
  local display="$2"
  shift 2

  local nonce
  local confirm_args=()
  nonce="$(next_confirm_nonce)"
  if is_machine_readable; then
    confirm_args+=(--machine-readable)
  fi
  "$CONFIRM" --description "$description" --display "$display" "${confirm_args[@]}" --nonce "$nonce" -- "$@"
}

read_with_default() {
  local prompt="$1"
  local default_value="$2"
  local out_var="$3"
  local value=""

  if is_interactive; then
    read -r -p "$prompt" value
    value="${value:-$default_value}"
  else
    value="$default_value"
    log_info "Non-interactive mode: using default for '$prompt' -> $default_value"
  fi

  printf -v "$out_var" "%s" "$value"
}

is_nonempty_id() {
  local val="${1:-}"
  [[ -n "$val" && "$val" != "null" && "$val" != "None" ]]
}

resolve_id_with_retry() {
  local __out_var="$1"
  local retries="${2:-5}"
  local delay_sec="${3:-2}"
  shift 3
  local value=""
  local out=""

  for ((i=1; i<=retries; i++)); do
    if run_oci_capture out err "$@"; then
      value="$out"
    else
      value=""
    fi
    if is_nonempty_id "$value"; then
      printf -v "$__out_var" "%s" "$value"
      return
    fi
    sleep "$delay_sec"
  done

  printf -v "$__out_var" "%s" "$value"
}

emit_subnet_sizing_guidance() {
  local subnet_cidr="$1"
  local est_concurrency=""
  local est_mem_mb=""
  local sizing_output=""

  read_with_default "Expected max concurrent requests (default 20): " "20" est_concurrency
  read_with_default "Memory per request in MB (default 256): " "256" est_mem_mb

  sizing_output="$(python3 - <<'PY' "$subnet_cidr" "$est_concurrency" "$est_mem_mb"
import ipaddress
import math
import sys
cidr, conc, mem = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
net = ipaddress.ip_network(cidr, strict=False)
usable = max(net.num_addresses - 2, 0)
required = math.ceil(3 * 1 + ((conc * (mem / 1024)) / 14))
print(f"[INFO] Estimated required IPs: {required}, usable IPs in subnet: {usable}")
if usable < required:
    print("[WARN] Subnet may be undersized for projected concurrency. OCI publishes this as sizing guidance rather than a hard requirement.")
PY
)"

  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    human_out "$line"
  done <<<"$sizing_output"
}

if ! command -v oci >/dev/null 2>&1; then
  echo "network_state=error"
  echo "network_error_reason=runtime_or_cli"
  echo "[ERROR] oci CLI is required." >&2
  exit 1
fi
if ! command -v python3 >/dev/null 2>&1; then
  echo "network_state=error"
  echo "network_error_reason=runtime_or_cli"
  echo "[ERROR] python3 is required for JSON processing." >&2
  exit 1
fi

if [[ "$ALLOW_NETWORK_CREATE" != "yes" ]]; then
  echo "network_state=error"
  echo "network_error_reason=missing_opt_in"
  echo "[ERROR] Network creation/repair is an explicit advanced branch." >&2
  echo "[HINT] Re-run with --allow-network-create yes after the user explicitly opts in." >&2
  exit 2
fi

if ! is_interactive; then
  for required_flag in TOPOLOGY VCN_NAME VCN_CIDR SUBNET_NAME SUBNET_CIDR; do
    if [[ -z "${!required_flag:-}" ]]; then
      echo "network_state=error"
      echo "network_error_reason=missing_required_input"
      echo "[ERROR] Non-interactive network creation requires explicit topology, names, and CIDRs." >&2
      exit 2
    fi
  done
fi

export OCI_CLI_REGION="$REGION"

if [[ -z "$VCN_NAME" ]]; then
  read_with_default "VCN name (default oci-fn-vcn): " "oci-fn-vcn" VCN_NAME
fi
if [[ -z "$SUBNET_NAME" ]]; then
  read_with_default "Subnet name (default oci-fn-private-subnet): " "oci-fn-private-subnet" SUBNET_NAME
fi

if [[ -z "$TOPOLOGY" ]]; then
  if [[ -t 0 ]]; then
    human_out "Choose topology:"
    human_out "  1) private (recommended): private subnet + service gateway"
    human_out "  2) public: public subnet + internet gateway route 0.0.0.0/0"
    human_out "  3) mixed: create IGW and SGW but keep function subnet private"
    read -r -p "Enter 1/2/3 [default 1]: " topo_pick
    case "$topo_pick" in
      2) TOPOLOGY="public" ;;
      3) TOPOLOGY="mixed" ;;
      *) TOPOLOGY="private" ;;
    esac
  else
    TOPOLOGY="private"
    log_info "Non-interactive mode: using default topology 'private'."
  fi
fi

case "$TOPOLOGY" in
  private|public|mixed) ;;
  *)
    echo "network_state=error"
    echo "network_error_reason=runtime_or_cli"
    echo "[ERROR] Unsupported topology: $TOPOLOGY" >&2
    exit 1
    ;;
esac

if [[ -z "$VCN_CIDR" ]]; then
  read_with_default "VCN CIDR (default 10.0.0.0/16): " "10.0.0.0/16" VCN_CIDR
fi
if [[ -z "$SUBNET_CIDR" ]]; then
  read_with_default "Subnet CIDR (default 10.0.1.0/24): " "10.0.1.0/24" SUBNET_CIDR
fi

all_vcns_out=""
vcn_err=""
if run_oci_capture all_vcns_out vcn_err network vcn list --compartment-id "$COMPARTMENT_ID" --all --query 'data[]."display-name"' --raw-output; then
  if [[ -n "$(sed '/^$/d' <<<"$all_vcns_out")" ]]; then
    echo "vcns_state=found"
  else
    echo "vcns_state=empty"
  fi
else
  echo "vcns_state=error"
  echo "network_state=error"
  echo "network_error_reason=$(classify_oci_error_reason "$vcn_err")"
  echo "[ERROR] Unable to list VCNs." >&2
  exit 4
fi

vcn_id=""
vcn_lookup=""
if run_oci_capture vcn_lookup vcn_err network vcn list --compartment-id "$COMPARTMENT_ID" --all --query "data[?\"display-name\"=='$VCN_NAME'].id | [0]" --raw-output; then
  vcn_id="$vcn_lookup"
else
  echo "network_state=error"
  echo "network_error_reason=$(classify_oci_error_reason "$vcn_err")"
  echo "[ERROR] Unable to list VCNs." >&2
  exit 4
fi

if [[ -z "$vcn_id" || "$vcn_id" == "null" || "$vcn_id" == "None" ]]; then
  vcn_cidr_json="$(python3 - <<'PY' "$VCN_CIDR"
import json
import sys
print(json.dumps([sys.argv[1]]))
PY
)"
  run_confirmed "Create VCN '$VCN_NAME'" "oci network vcn create --compartment-id '$COMPARTMENT_ID' --display-name '$VCN_NAME' --cidr-blocks '$vcn_cidr_json' --query 'data.id' --raw-output" oci network vcn create --compartment-id "$COMPARTMENT_ID" --display-name "$VCN_NAME" --cidr-blocks "$vcn_cidr_json" --query 'data.id' --raw-output

  resolve_id_with_retry vcn_id 6 2 network vcn list --compartment-id "$COMPARTMENT_ID" --all --query "data[?\"display-name\"=='$VCN_NAME'].id | [0]" --raw-output
fi

if [[ -z "$vcn_id" || "$vcn_id" == "null" || "$vcn_id" == "None" ]]; then
  echo "[ERROR] VCN '$VCN_NAME' could not be resolved after create/discovery." >&2
  echo "[HINT] Check OCI permissions and whether duplicate VCN names are causing ambiguous lookup." >&2
  exit 4
fi

human_out "Using VCN: $vcn_id"

igw_id=""
sgw_id=""
service_id=""
service_cidr=""
route_table_id=""

if [[ "$TOPOLOGY" == "public" || "$TOPOLOGY" == "mixed" ]]; then
  igw_name="${VCN_NAME}-igw"
  igw_id="$(oci network internet-gateway list --compartment-id "$COMPARTMENT_ID" --all --query "data[?\"display-name\"=='$igw_name'].id | [0]" --raw-output 2>/dev/null || true)"
  if [[ -z "$igw_id" || "$igw_id" == "null" || "$igw_id" == "None" ]]; then
    run_confirmed "Create internet gateway for public routing" "oci network internet-gateway create --compartment-id '$COMPARTMENT_ID' --vcn-id '$vcn_id' --display-name '$igw_name' --is-enabled true" oci network internet-gateway create --compartment-id "$COMPARTMENT_ID" --vcn-id "$vcn_id" --display-name "$igw_name" --is-enabled true
    igw_id="$(oci network internet-gateway list --compartment-id "$COMPARTMENT_ID" --all --query "data[?\"display-name\"=='$igw_name'].id | [0]" --raw-output)"
  fi
fi

if [[ "$TOPOLOGY" == "private" || "$TOPOLOGY" == "mixed" ]]; then
  sgw_name="${VCN_NAME}-sgw"
  sgw_id="$(oci network service-gateway list --compartment-id "$COMPARTMENT_ID" --all --query "data[?\"display-name\"=='$sgw_name'].id | [0]" --raw-output 2>/dev/null || true)"

  service_list_json="$(oci network service list --all 2>/dev/null || true)"
  if [[ -z "$service_list_json" ]]; then
    echo "[ERROR] Unable to list OCI network services for service gateway configuration." >&2
    echo "[HINT] Verify OCI permissions: inspect network services in this region." >&2
    exit 4
  fi

  service_meta="$(python3 - <<'PY' "$service_list_json"
import json
import sys
payload = json.loads(sys.argv[1])
services = payload.get("data", [])
for svc in services:
    name = (svc.get("name") or "").lower()
    cidr = (svc.get("cidr-block") or "").lower()
    if "oracle services network" in name and cidr.startswith("all-") and cidr.endswith("-services-in-oracle-services-network"):
        print((svc.get("id") or "") + "\t" + (svc.get("cidr-block") or ""))
        sys.exit(0)
print("\t")
PY
)"

  service_id="${service_meta%%$'\t'*}"
  service_cidr="${service_meta#*$'\t'}"

  if [[ -z "$service_id" || -z "$service_cidr" ]]; then
    echo "[ERROR] Could not resolve 'All <region> Services in Oracle Services Network' service metadata." >&2
    exit 4
  fi

  if [[ -z "$sgw_id" || "$sgw_id" == "null" || "$sgw_id" == "None" ]]; then
    run_confirmed "Create service gateway for private Oracle Services Network access" "oci network service-gateway create --compartment-id '$COMPARTMENT_ID' --vcn-id '$vcn_id' --display-name '$sgw_name' --services '[{\"serviceId\":\"$service_id\"}]'" oci network service-gateway create --compartment-id "$COMPARTMENT_ID" --vcn-id "$vcn_id" --display-name "$sgw_name" --services "[{\"serviceId\":\"$service_id\"}]"
    sgw_id="$(oci network service-gateway list --compartment-id "$COMPARTMENT_ID" --all --query "data[?\"display-name\"=='$sgw_name'].id | [0]" --raw-output)"
  fi
fi

rt_name="${VCN_NAME}-${TOPOLOGY}-rt"
if [[ "$TOPOLOGY" == "public" ]]; then
  desired_destination="0.0.0.0/0"
  desired_destination_type="CIDR_BLOCK"
  desired_entity_id="$igw_id"
else
  desired_destination="$service_cidr"
  desired_destination_type="SERVICE_CIDR_BLOCK"
  desired_entity_id="$sgw_id"
fi

rules="[{\"destination\":\"$desired_destination\",\"destinationType\":\"$desired_destination_type\",\"networkEntityId\":\"$desired_entity_id\"}]"

route_table_id="$(oci network route-table list --compartment-id "$COMPARTMENT_ID" --vcn-id "$vcn_id" --all --query "data[?\"display-name\"=='$rt_name'].id | [0]" --raw-output 2>/dev/null || true)"
if [[ -n "$route_table_id" && "$route_table_id" != "null" && "$route_table_id" != "None" ]]; then
  rt_json="$(oci network route-table get --rt-id "$route_table_id" --query data 2>/dev/null || true)"
  rt_compatible="$(python3 - <<'PY' "$rt_json" "$desired_destination" "$desired_destination_type" "$desired_entity_id"
import json
import sys
payload = json.loads(sys.argv[1]) if sys.argv[1] else {}
destination = sys.argv[2]
destination_type = sys.argv[3]
entity = sys.argv[4]

def g(obj, *keys):
    for k in keys:
        if k in obj:
            return obj[k]
    return None

for rule in payload.get("route-rules", []):
    if (g(rule, "destination") == destination and
        g(rule, "destination-type", "destinationType") == destination_type and
        g(rule, "network-entity-id", "networkEntityId") == entity):
        print("yes")
        break
else:
    print("no")
PY
  )"
  if [[ "$rt_compatible" != "yes" ]]; then
    log_warn "Existing route table '$rt_name' is incompatible with selected topology."
    rt_name="${rt_name}-managed"
    route_table_id=""
  else
    log_ok "Reusing compatible route table: $rt_name"
  fi
fi

if [[ -z "$route_table_id" || "$route_table_id" == "null" || "$route_table_id" == "None" ]]; then
  route_table_id="$(oci network route-table list --compartment-id "$COMPARTMENT_ID" --vcn-id "$vcn_id" --all --query "data[?\"display-name\"=='$rt_name'].id | [0]" --raw-output 2>/dev/null || true)"
  if [[ -z "$route_table_id" || "$route_table_id" == "null" || "$route_table_id" == "None" ]]; then
    run_confirmed "Create route table '$rt_name'" "oci network route-table create --compartment-id '$COMPARTMENT_ID' --vcn-id '$vcn_id' --display-name '$rt_name' --route-rules '$rules'" oci network route-table create --compartment-id "$COMPARTMENT_ID" --vcn-id "$vcn_id" --display-name "$rt_name" --route-rules "$rules"
    resolve_id_with_retry route_table_id 6 2 network route-table list --compartment-id "$COMPARTMENT_ID" --vcn-id "$vcn_id" --all --query "data[?\"display-name\"=='$rt_name'].id | [0]" --raw-output
  else
    run_confirmed "Update route table '$rt_name' to match selected topology" "oci network route-table update --rt-id '$route_table_id' --route-rules '$rules' --force" oci network route-table update --rt-id "$route_table_id" --route-rules "$rules" --force
  fi
fi

if [[ -z "$route_table_id" || "$route_table_id" == "null" || "$route_table_id" == "None" ]]; then
  echo "[ERROR] Route table '$rt_name' could not be resolved after create/update." >&2
  exit 4
fi

expected_prohibit_public="true"
if [[ "$TOPOLOGY" == "public" ]]; then
  expected_prohibit_public="false"
fi

subnet_id="$(oci network subnet list --compartment-id "$COMPARTMENT_ID" --vcn-id "$vcn_id" --all --query "data[?\"display-name\"=='$SUBNET_NAME'].id | [0]" --raw-output 2>/dev/null || true)"
if [[ -z "$subnet_id" || "$subnet_id" == "null" || "$subnet_id" == "None" ]]; then
  emit_subnet_sizing_guidance "$SUBNET_CIDR"
  run_confirmed "Create subnet '$SUBNET_NAME'" "oci network subnet create --compartment-id '$COMPARTMENT_ID' --vcn-id '$vcn_id' --display-name '$SUBNET_NAME' --cidr-block '$SUBNET_CIDR' --route-table-id '$route_table_id' --prohibit-public-ip-on-vnic $expected_prohibit_public" oci network subnet create --compartment-id "$COMPARTMENT_ID" --vcn-id "$vcn_id" --display-name "$SUBNET_NAME" --cidr-block "$SUBNET_CIDR" --route-table-id "$route_table_id" --prohibit-public-ip-on-vnic "$expected_prohibit_public"
  resolve_id_with_retry subnet_id 6 2 network subnet list --compartment-id "$COMPARTMENT_ID" --vcn-id "$vcn_id" --all --query "data[?\"display-name\"=='$SUBNET_NAME'].id | [0]" --raw-output
else
  subnet_json="$(oci network subnet get --subnet-id "$subnet_id" --query data 2>/dev/null || true)"
  subnet_route_table="$(python3 - <<'PY' "$subnet_json"
import json
import sys
payload = json.loads(sys.argv[1]) if sys.argv[1] else {}
print(payload.get("route-table-id", ""))
PY
)"
  subnet_prohibit_public="$(python3 - <<'PY' "$subnet_json"
import json
import sys
payload = json.loads(sys.argv[1]) if sys.argv[1] else {}
val = payload.get("prohibit-public-ip-on-vnic")
print("true" if val is True else "false")
PY
)"

  if [[ "$subnet_route_table" != "$route_table_id" || "$subnet_prohibit_public" != "$expected_prohibit_public" ]]; then
    run_confirmed "Update subnet '$SUBNET_NAME' to match selected topology" "oci network subnet update --subnet-id '$subnet_id' --route-table-id '$route_table_id' --prohibit-public-ip-on-vnic $expected_prohibit_public --force" oci network subnet update --subnet-id "$subnet_id" --route-table-id "$route_table_id" --prohibit-public-ip-on-vnic "$expected_prohibit_public" --force
  else
    log_ok "Reusing compatible subnet: $SUBNET_NAME"
  fi
fi

if [[ -z "$subnet_id" || "$subnet_id" == "null" || "$subnet_id" == "None" ]]; then
  echo "[ERROR] Subnet '$SUBNET_NAME' could not be resolved after create/update." >&2
  exit 4
fi

subnet_json="$(oci network subnet get --subnet-id "$subnet_id" --query data)"
security_list_ids_csv="$(python3 - <<'PY' "$subnet_json"
import json
import sys
payload = json.loads(sys.argv[1])
print(",".join(payload.get("security-list-ids") or []))
PY
)"

if [[ -z "$security_list_ids_csv" ]]; then
  echo "[ERROR] Subnet has no security lists attached; cannot validate egress rules." >&2
  exit 4
fi

primary_security_list_id="${security_list_ids_csv%%,*}"

if [[ "$TOPOLOGY" == "public" ]]; then
  egress_destination="0.0.0.0/0"
  egress_destination_type="CIDR_BLOCK"
else
  egress_destination="$service_cidr"
  egress_destination_type="SERVICE_CIDR_BLOCK"
fi

egress_rules_json="$(oci network security-list get --security-list-id "$primary_security_list_id" --query 'data."egress-security-rules"' --raw-output)"
rule_present="$(python3 - <<'PY' "$egress_rules_json" "$egress_destination" "$egress_destination_type"
import json
import sys
rules = json.loads(sys.argv[1]) if sys.argv[1] else []
destination = sys.argv[2]
destination_type = sys.argv[3]

def g(obj, *keys):
    for k in keys:
        if isinstance(obj, dict) and k in obj:
            return obj[k]
    return None

def allows_required_egress(rule):
    proto = str(g(rule, "protocol") or "").lower()
    if proto == "all":
        return True
    if proto != "6":
        return False

    opts = g(rule, "tcpOptions", "tcp-options")
    if not opts:
        return True

    pr = g(opts, "destinationPortRange", "destination-port-range") or {}
    min_port = g(pr, "min")
    max_port = g(pr, "max")
    if min_port is None or max_port is None:
        return True
    return int(min_port) <= 443 <= int(max_port)

for rule in rules:
    if g(rule, "destination") != destination:
        continue
    if g(rule, "destinationType", "destination-type") != destination_type:
        continue
    if allows_required_egress(rule):
        print("yes")
        break
else:
    print("no")
PY
)"

if [[ "$rule_present" != "yes" ]]; then
  updated_rules_json="$(python3 - <<'PY' "$egress_rules_json" "$egress_destination" "$egress_destination_type"
import json
import sys
rules = json.loads(sys.argv[1]) if sys.argv[1] else []
destination = sys.argv[2]
destination_type = sys.argv[3]
rules.append({
    "destination": destination,
    "destinationType": destination_type,
    "isStateless": False,
    "protocol": "6",
    "tcpOptions": {
        "destinationPortRange": {
            "min": 443,
            "max": 443,
        }
    }
})
print(json.dumps(rules, separators=(",", ":")))
PY
)"
  run_confirmed "Add egress TCP/443 rule for registry access on security list" "oci network security-list update --security-list-id '$primary_security_list_id' --egress-security-rules '$updated_rules_json' --force" oci network security-list update --security-list-id "$primary_security_list_id" --egress-security-rules "$updated_rules_json" --force
else
  log_ok "Security list already allows required registry/service egress."
fi

echo "network_state=found"
echo "vcn_id=$vcn_id"
echo "subnet_id=$subnet_id"

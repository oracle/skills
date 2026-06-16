#!/usr/bin/env bash
set -euo pipefail

# Build a read-only Kubernetes-to-OCI object graph for OKE troubleshooting.
#
# Usage:
#   bash scripts/oke-object-correlator.sh --namespace <ns> --cluster-id <ocid> --compartment-id <ocid> --region <region> [--pod <pod>] [--deployment <deployment>] [--service <service>] [--ingress <ingress>] [--pvc <pvc>] [--node <node>]

namespace=""
cluster_id=""
compartment_id=""
region=""
pod=""
deployment=""
service=""
ingress=""
pvc=""
node=""

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
    --namespace|-n) require_value "$1" "${2:-}"; namespace="$2"; shift 2 ;;
    --cluster-id) require_value "$1" "${2:-}"; cluster_id="$2"; shift 2 ;;
    --compartment-id) require_value "$1" "${2:-}"; compartment_id="$2"; shift 2 ;;
    --region) require_value "$1" "${2:-}"; region="$2"; shift 2 ;;
    --pod) require_value "$1" "${2:-}"; pod="$2"; shift 2 ;;
    --deployment) require_value "$1" "${2:-}"; deployment="$2"; shift 2 ;;
    --service) require_value "$1" "${2:-}"; service="$2"; shift 2 ;;
    --ingress) require_value "$1" "${2:-}"; ingress="$2"; shift 2 ;;
    --pvc) require_value "$1" "${2:-}"; pvc="$2"; shift 2 ;;
    --node) require_value "$1" "${2:-}"; node="$2"; shift 2 ;;
    -h|--help)
      echo "usage: oke-object-correlator.sh --namespace <ns> --cluster-id <ocid> --compartment-id <ocid> --region <region> [--pod <pod>] [--deployment <deployment>] [--service <service>] [--ingress <ingress>] [--pvc <pvc>] [--node <node>]"
      exit 0 ;;
    *) emit_error 2 "UNKNOWN_ARGUMENT" "Unknown argument: $1." "Run with --help to view usage." ;;
  esac
done

if [[ -z "$namespace" ]]; then
  emit_error 2 "MISSING_REQUIRED_ARGUMENT" "Missing required --namespace." "Provide --namespace <ns>."
fi

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT
records="$tmp_dir/records.jsonl"
: > "$records"

record_check() {
  local name="$1"
  local kind="$2"
  local cmd="$3"
  local rc="$4"
  local out="$5"
  NAME="$name" KIND="$kind" CMD="$cmd" RC="$rc" OUT="$out" python3 - "$records" <<'PY'
import json
import os
import sys

with open(sys.argv[1], "a") as f:
    f.write(json.dumps({
        "name": os.environ["NAME"],
        "kind": os.environ["KIND"],
        "cmd": os.environ["CMD"],
        "rc": int(os.environ["RC"]),
        "output": os.environ["OUT"][-12000:],
    }) + "\n")
PY
}

run_check() {
  local name="$1"
  local kind="$2"
  shift 2
  local out rc
  set +e
  out="$("$@" 2>&1)"
  rc=$?
  set -e
  record_check "$name" "$kind" "$*" "$rc" "$out"
}

kubectl_available="yes"
oci_available="yes"
if ! command -v kubectl >/dev/null 2>&1; then
  kubectl_available="no"
  record_check "kubectl availability" "tool" "kubectl" 127 "kubectl is not installed or not on PATH"
fi
if ! command -v oci >/dev/null 2>&1; then
  oci_available="no"
  record_check "oci availability" "tool" "oci" 127 "oci is not installed or not on PATH"
fi

if [[ "$kubectl_available" == "yes" ]]; then
  if [[ -n "$pod" ]]; then
    run_check "pod" "k8s_pod" kubectl -n "$namespace" get pod "$pod" -o json
  fi
  if [[ -n "$deployment" ]]; then
    run_check "deployment" "k8s_deployment" kubectl -n "$namespace" get deployment "$deployment" -o json
  fi
  if [[ -n "$service" ]]; then
    run_check "service" "k8s_service" kubectl -n "$namespace" get service "$service" -o json
    run_check "endpoints" "k8s_endpoints" kubectl -n "$namespace" get endpoints "$service" -o json
  fi
  if [[ -n "$ingress" ]]; then
    run_check "ingress" "k8s_ingress" kubectl -n "$namespace" get ingress "$ingress" -o json
  fi
  if [[ -n "$pvc" ]]; then
    run_check "pvc" "k8s_pvc" kubectl -n "$namespace" get pvc "$pvc" -o json
  fi
  if [[ -n "$node" ]]; then
    run_check "node" "k8s_node" kubectl get node "$node" -o json
  fi
fi

oci_cmd=(oci)
if [[ -n "$region" ]]; then
  oci_cmd+=(--region "$region")
fi

python3 - "$records" "$namespace" "$cluster_id" "$compartment_id" "$region" "$pod" "$deployment" "$service" "$ingress" "$pvc" "$node" <<'PY' >"$tmp_dir/plan.json"
import json
import re
import sys
from pathlib import Path

records_path = Path(sys.argv[1])
namespace, cluster_id, compartment_id, region = sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
pod_arg, deployment_arg, service_arg, ingress_arg, pvc_arg, node_arg = sys.argv[6:12]
records = [json.loads(line) for line in records_path.read_text().splitlines() if line.strip()]

def parse_json(text):
    try:
        return json.loads(text)
    except Exception:
        return None

def ocid(value):
    return isinstance(value, str) and value.startswith("ocid1.")

def provider_instance_id(obj):
    provider_id = ((obj.get("spec") or {}).get("providerID") or "")
    match = re.search(r"(ocid1\.instance\.[A-Za-z0-9_.-]+)", provider_id)
    return match.group(1) if match else ""

def lb_addresses(item):
    values = []
    for address in item.get("ip-addresses", []) or []:
        ip = address.get("ip-address") or address.get("ip")
        if ip:
            values.append(ip)
    return values

def match_lb_by_ip(items, target_ip):
    if not target_ip:
        return None
    for item in items:
        if target_ip in lb_addresses(item):
            return item
    return None

def ann(obj, key):
    return (((obj or {}).get("metadata") or {}).get("annotations") or {}).get(key, "")

def meta_name(obj):
    return ((obj or {}).get("metadata") or {}).get("name", "")

def first(value):
    if isinstance(value, list) and value:
        return value[0]
    return None

plan = []
derived = {"node": node_arg, "instance_id": "", "lb_id": "", "lb_ip": "", "pv": "", "volume_id": ""}

for rec in records:
    obj = parse_json(rec.get("output", ""))
    if rec["kind"] == "k8s_pod" and obj:
        node = ((obj.get("spec") or {}).get("nodeName") or "")
        if node and not derived["node"]:
            derived["node"] = node
        for vol in (obj.get("spec") or {}).get("volumes", []) or []:
            claim = (vol.get("persistentVolumeClaim") or {}).get("claimName", "")
            if claim:
                plan.append({"name": f"pvc {claim}", "kind": "k8s_pvc", "cmd": ["kubectl", "-n", namespace, "get", "pvc", claim, "-o", "json"]})
    elif rec["kind"] == "k8s_node" and obj:
        annotations = ((obj.get("metadata") or {}).get("annotations") or {})
        instance_id = (
            annotations.get("node.oci.oraclecloud.com/instance-id")
            or annotations.get("oci.oraclecloud.com/instance-id")
            or annotations.get("oci.oraclecloud.com/instance_id")
            or provider_instance_id(obj)
            or ""
        )
        if instance_id:
            derived["instance_id"] = instance_id
    elif rec["kind"] == "k8s_service" and obj:
        lb_id = (
            ann(obj, "oci.oraclecloud.com/load-balancer-id")
            or ann(obj, "service.beta.kubernetes.io/oci-load-balancer-id")
            or ann(obj, "oci.oraclecloud.com/network-load-balancer-id")
            or ""
        )
        if lb_id:
            derived["lb_id"] = lb_id
        ingress = (((obj.get("status") or {}).get("loadBalancer") or {}).get("ingress") or [])
        if ingress:
            derived["lb_ip"] = ingress[0].get("ip") or ingress[0].get("hostname") or ""
    elif rec["kind"] == "k8s_ingress" and obj:
        lb_id = (
            ann(obj, "oci.oraclecloud.com/load-balancer-id")
            or ann(obj, "service.beta.kubernetes.io/oci-load-balancer-id")
            or ""
        )
        if lb_id:
            derived["lb_id"] = lb_id
        status_ing = (((obj.get("status") or {}).get("loadBalancer") or {}).get("ingress") or [])
        if status_ing and not derived["lb_ip"]:
            derived["lb_ip"] = status_ing[0].get("ip") or status_ing[0].get("hostname") or ""
    elif rec["kind"] == "k8s_pvc" and obj:
        pv = ((obj.get("spec") or {}).get("volumeName") or "")
        if pv and not derived["pv"]:
            derived["pv"] = pv
    elif rec["kind"] == "k8s_pv" and obj:
        spec = obj.get("spec") or {}
        handle = (
            (spec.get("csi") or {}).get("volumeHandle")
            or spec.get("ociVolumeID")
            or spec.get("volumeID")
            or ""
        )
        if handle and not derived["volume_id"]:
            derived["volume_id"] = handle

if derived["node"] and not any(r["kind"] == "k8s_node" for r in records):
    plan.append({"name": f"node {derived['node']}", "kind": "k8s_node", "cmd": ["kubectl", "get", "node", derived["node"], "-o", "json"]})
if derived["pv"] and not any(r["kind"] == "k8s_pv" for r in records):
    plan.append({"name": f"pv {derived['pv']}", "kind": "k8s_pv", "cmd": ["kubectl", "get", "pv", derived["pv"], "-o", "json"]})
if derived["instance_id"]:
    plan.append({"name": "compute instance", "kind": "oci_instance", "cmd": ["oci", "compute", "instance", "get", "--instance-id", derived["instance_id"], "--output", "json"]})
    if compartment_id:
        plan.append({"name": "vnic attachments", "kind": "oci_vnic_attachments", "cmd": ["oci", "compute", "vnic-attachment", "list", "--compartment-id", compartment_id, "--instance-id", derived["instance_id"], "--all", "--output", "json"]})
if derived["lb_id"]:
    if ".networkloadbalancer." in derived["lb_id"]:
        plan.append({"name": "network load balancer", "kind": "oci_nlb", "cmd": ["oci", "nlb", "network-load-balancer", "get", "--network-load-balancer-id", derived["lb_id"], "--output", "json"]})
    else:
        plan.append({"name": "load balancer", "kind": "oci_lb", "cmd": ["oci", "lb", "load-balancer", "get", "--load-balancer-id", derived["lb_id"], "--output", "json"]})
        plan.append({"name": "load balancer health", "kind": "oci_lb_health", "cmd": ["oci", "lb", "load-balancer-health", "get", "--load-balancer-id", derived["lb_id"], "--output", "json"]})
elif derived["lb_ip"] and compartment_id:
    plan.append({"name": "load balancers by IP", "kind": "oci_lb_list", "cmd": ["oci", "lb", "load-balancer", "list", "--compartment-id", compartment_id, "--all", "--output", "json"]})
    plan.append({"name": "network load balancers by IP", "kind": "oci_nlb_list", "cmd": ["oci", "nlb", "network-load-balancer", "list", "--compartment-id", compartment_id, "--all", "--output", "json"]})
if derived["volume_id"]:
    plan.append({"name": "block volume", "kind": "oci_volume", "cmd": ["oci", "bv", "volume", "get", "--volume-id", derived["volume_id"], "--output", "json"]})
    if compartment_id:
        plan.append({"name": "volume attachments", "kind": "oci_volume_attachments", "cmd": ["oci", "compute", "volume-attachment", "list", "--compartment-id", compartment_id, "--volume-id", derived["volume_id"], "--all", "--output", "json"]})
if service_arg or ingress_arg:
    if compartment_id:
        plan.append({"name": "network security groups", "kind": "oci_nsgs", "cmd": ["oci", "network", "nsg", "list", "--compartment-id", compartment_id, "--all", "--output", "json"]})
if cluster_id:
    plan.append({"name": "cluster node pools", "kind": "oci_node_pools", "cmd": ["oci", "ce", "node-pool", "list", "--cluster-id", cluster_id, "--compartment-id", compartment_id, "--all", "--output", "json"]})

print(json.dumps(plan))
PY

execute_plan() {
  local plan_file="$1"
  python3 - "$plan_file" "$region" <<'PY' >"$tmp_dir/commands.jsonl"
import json
import sys
from pathlib import Path

plan = json.loads(Path(sys.argv[1]).read_text())
region = sys.argv[2]
for item in plan:
    cmd = item["cmd"]
    if cmd and cmd[0] == "oci" and region:
        cmd = ["oci", "--region", region] + cmd[1:]
    print(json.dumps({"name": item["name"], "kind": item["kind"], "cmd": cmd}))
PY
  while IFS= read -r line; do
    [[ -n "$line" ]] || continue
    name="$(python3 -c 'import json,sys; print(json.loads(sys.stdin.read())["name"])' <<<"$line")"
    kind="$(python3 -c 'import json,sys; print(json.loads(sys.stdin.read())["kind"])' <<<"$line")"
    cmd_parts=()
    while IFS= read -r part; do
      cmd_parts+=("$part")
    done < <(python3 -c 'import json,sys; [print(x) for x in json.loads(sys.stdin.read())["cmd"]]' <<<"$line")
    if [[ "${cmd_parts[0]:-}" == "oci" && "$oci_available" != "yes" ]]; then
      continue
    fi
    run_check "$name" "$kind" "${cmd_parts[@]}"
  done <"$tmp_dir/commands.jsonl"
}

execute_plan "$tmp_dir/plan.json"
python3 - "$records" "$namespace" "$cluster_id" "$compartment_id" "$region" "$pod" "$deployment" "$service" "$ingress" "$pvc" "$node" <<'PY' >"$tmp_dir/plan2.json"
import json
import re
import sys
from pathlib import Path

records_path = Path(sys.argv[1])
namespace, cluster_id, compartment_id, region = sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
node_arg = sys.argv[11]
records = [json.loads(line) for line in records_path.read_text().splitlines() if line.strip()]

def parse_json(text):
    try:
        return json.loads(text)
    except Exception:
        return None

def ann(obj, key):
    return (((obj or {}).get("metadata") or {}).get("annotations") or {}).get(key, "")

def provider_instance_id(obj):
    provider_id = ((obj.get("spec") or {}).get("providerID") or "")
    match = re.search(r"(ocid1\.instance\.[A-Za-z0-9_.-]+)", provider_id)
    return match.group(1) if match else ""

derived = {"instance_id": "", "volume_id": "", "lb_ip": "", "lb_id": ""}
existing = {(r["kind"], r["name"]) for r in records}
plan = []

for rec in records:
    obj = parse_json(rec.get("output", ""))
    if not obj:
        continue
    data = obj.get("data", obj) if isinstance(obj, dict) else obj
    if rec["kind"] == "k8s_node" and isinstance(data, dict):
        annotations = ((data.get("metadata") or {}).get("annotations") or {})
        derived["instance_id"] = (
            annotations.get("node.oci.oraclecloud.com/instance-id")
            or annotations.get("oci.oraclecloud.com/instance-id")
            or annotations.get("oci.oraclecloud.com/instance_id")
            or provider_instance_id(data)
            or derived["instance_id"]
        )
    elif rec["kind"] == "k8s_pvc" and isinstance(data, dict):
        pv = ((data.get("spec") or {}).get("volumeName") or "")
        if pv and ("k8s_pv", f"pv {pv}") not in existing:
            plan.append({"name": f"pv {pv}", "kind": "k8s_pv", "cmd": ["kubectl", "get", "pv", pv, "-o", "json"]})
    elif rec["kind"] == "k8s_pv" and isinstance(data, dict):
        spec = data.get("spec") or {}
        derived["volume_id"] = (
            (spec.get("csi") or {}).get("volumeHandle")
            or spec.get("ociVolumeID")
            or spec.get("volumeID")
            or derived["volume_id"]
        )
    elif rec["kind"] in ("k8s_service", "k8s_ingress") and isinstance(data, dict):
        annotations = ((data.get("metadata") or {}).get("annotations") or {})
        derived["lb_id"] = (
            annotations.get("oci.oraclecloud.com/load-balancer-id")
            or annotations.get("service.beta.kubernetes.io/oci-load-balancer-id")
            or annotations.get("oci.oraclecloud.com/network-load-balancer-id")
            or derived["lb_id"]
        )
        ingress = (((data.get("status") or {}).get("loadBalancer") or {}).get("ingress") or [])
        if ingress and not derived["lb_ip"]:
            derived["lb_ip"] = ingress[0].get("ip") or ingress[0].get("hostname") or ""
    elif rec["kind"] == "oci_lb_list" and derived["lb_ip"]:
        items = data.get("data", []) if isinstance(data, dict) else data
        items = items or []
        for item in items:
            for address in item.get("ip-addresses", []) or []:
                if address.get("ip-address") == derived["lb_ip"]:
                    derived["lb_id"] = item.get("id", derived["lb_id"])
                    break
    elif rec["kind"] == "oci_nlb_list" and derived["lb_ip"]:
        items = data.get("data", []) if isinstance(data, dict) else data
        items = items or []
        for item in items:
            for address in item.get("ip-addresses", []) or []:
                if address.get("ip-address") == derived["lb_ip"]:
                    derived["lb_id"] = item.get("id", derived["lb_id"])
                    break

if derived["instance_id"] and ("oci_instance", "compute instance") not in existing:
    plan.append({"name": "compute instance", "kind": "oci_instance", "cmd": ["oci", "compute", "instance", "get", "--instance-id", derived["instance_id"], "--output", "json"]})
    if compartment_id and ("oci_vnic_attachments", "vnic attachments") not in existing:
        plan.append({"name": "vnic attachments", "kind": "oci_vnic_attachments", "cmd": ["oci", "compute", "vnic-attachment", "list", "--compartment-id", compartment_id, "--instance-id", derived["instance_id"], "--all", "--output", "json"]})
if derived["volume_id"] and ("oci_volume", "block volume") not in existing:
    plan.append({"name": "block volume", "kind": "oci_volume", "cmd": ["oci", "bv", "volume", "get", "--volume-id", derived["volume_id"], "--output", "json"]})
    if compartment_id and ("oci_volume_attachments", "volume attachments") not in existing:
        plan.append({"name": "volume attachments", "kind": "oci_volume_attachments", "cmd": ["oci", "compute", "volume-attachment", "list", "--compartment-id", compartment_id, "--volume-id", derived["volume_id"], "--all", "--output", "json"]})
if derived["lb_id"] and ("oci_lb", "load balancer") not in existing and ("oci_nlb", "network load balancer") not in existing:
    if ".networkloadbalancer." in derived["lb_id"]:
        plan.append({"name": "network load balancer", "kind": "oci_nlb", "cmd": ["oci", "nlb", "network-load-balancer", "get", "--network-load-balancer-id", derived["lb_id"], "--output", "json"]})
    else:
        plan.append({"name": "load balancer", "kind": "oci_lb", "cmd": ["oci", "lb", "load-balancer", "get", "--load-balancer-id", derived["lb_id"], "--output", "json"]})
        plan.append({"name": "load balancer health", "kind": "oci_lb_health", "cmd": ["oci", "lb", "load-balancer-health", "get", "--load-balancer-id", derived["lb_id"], "--output", "json"]})

print(json.dumps(plan))
PY
execute_plan "$tmp_dir/plan2.json"

python3 - "$records" "$compartment_id" <<'PY' >"$tmp_dir/plan3.json"
import json
import sys
from pathlib import Path

records = [json.loads(line) for line in Path(sys.argv[1]).read_text().splitlines() if line.strip()]
compartment_id = sys.argv[2]
existing = {(r["kind"], r["name"]) for r in records}
plan = []

def parse_json(text):
    try:
        return json.loads(text)
    except Exception:
        return None

for rec in records:
    if rec["kind"] != "k8s_pv":
        continue
    obj = parse_json(rec.get("output", ""))
    if not isinstance(obj, dict):
        continue
    spec = obj.get("spec") or {}
    volume_id = (
        (spec.get("csi") or {}).get("volumeHandle")
        or spec.get("ociVolumeID")
        or spec.get("volumeID")
        or ""
    )
    if volume_id and ("oci_volume", "block volume") not in existing:
        plan.append({"name": "block volume", "kind": "oci_volume", "cmd": ["oci", "bv", "volume", "get", "--volume-id", volume_id, "--output", "json"]})
    if volume_id and compartment_id and ("oci_volume_attachments", "volume attachments") not in existing:
        plan.append({"name": "volume attachments", "kind": "oci_volume_attachments", "cmd": ["oci", "compute", "volume-attachment", "list", "--compartment-id", compartment_id, "--volume-id", volume_id, "--all", "--output", "json"]})

print(json.dumps(plan))
PY
execute_plan "$tmp_dir/plan3.json"

python3 - "$records" <<'PY' >"$tmp_dir/plan4.json"
import json
import sys
from pathlib import Path

records = [json.loads(line) for line in Path(sys.argv[1]).read_text().splitlines() if line.strip()]
existing = {(r["kind"], r["name"]) for r in records}
requested = set()
plan = []

def parse_json(text):
    try:
        return json.loads(text)
    except Exception:
        return None

def data(obj):
    if isinstance(obj, dict) and isinstance(obj.get("data"), dict):
        return obj["data"]
    return obj

def items(obj):
    if isinstance(obj, dict):
        return obj.get("data", [])
    if isinstance(obj, list):
        return obj
    return []

def add(name, kind, cmd):
    key = (kind, name)
    if key in existing or key in requested:
        return
    requested.add(key)
    plan.append({"name": name, "kind": kind, "cmd": cmd})

for rec in records:
    obj = parse_json(rec.get("output", ""))
    if not obj:
        continue
    obj_data = data(obj)
    if rec["kind"] == "oci_vnic_attachments":
        for item in items(obj_data):
            vnic_id = item.get("vnic-id")
            subnet_id = item.get("subnet-id")
            if vnic_id:
                add(f"vnic {vnic_id}", "oci_vnic", ["oci", "network", "vnic", "get", "--vnic-id", vnic_id, "--output", "json"])
            if subnet_id:
                add(f"subnet {subnet_id}", "oci_subnet", ["oci", "network", "subnet", "get", "--subnet-id", subnet_id, "--output", "json"])
    elif rec["kind"] in ("oci_lb", "oci_nlb"):
        lb = data(obj_data)
        for subnet_id in lb.get("subnet-ids", []) or []:
            add(f"subnet {subnet_id}", "oci_subnet", ["oci", "network", "subnet", "get", "--subnet-id", subnet_id, "--output", "json"])

print(json.dumps(plan))
PY
execute_plan "$tmp_dir/plan4.json"

python3 - "$records" <<'PY' >"$tmp_dir/plan5.json"
import json
import sys
from pathlib import Path

records = [json.loads(line) for line in Path(sys.argv[1]).read_text().splitlines() if line.strip()]
existing = {(r["kind"], r["name"]) for r in records}
requested = set()
plan = []

def parse_json(text):
    try:
        return json.loads(text)
    except Exception:
        return None

def data(obj):
    if isinstance(obj, dict) and isinstance(obj.get("data"), dict):
        return obj["data"]
    return obj

def add(name, kind, cmd):
    key = (kind, name)
    if key in existing or key in requested:
        return
    requested.add(key)
    plan.append({"name": name, "kind": kind, "cmd": cmd})

for rec in records:
    obj = parse_json(rec.get("output", ""))
    if not obj:
        continue
    obj_data = data(obj)
    if rec["kind"] == "oci_vnic":
        vnic = data(obj_data)
        subnet_id = vnic.get("subnet-id")
        if subnet_id:
            add(f"subnet {subnet_id}", "oci_subnet", ["oci", "network", "subnet", "get", "--subnet-id", subnet_id, "--output", "json"])
        for nsg_id in vnic.get("nsg-ids", []) or []:
            add(f"nsg {nsg_id}", "oci_nsg", ["oci", "network", "nsg", "get", "--nsg-id", nsg_id, "--output", "json"])
    elif rec["kind"] == "oci_subnet":
        subnet = data(obj_data)
        route_table_id = subnet.get("route-table-id")
        if route_table_id:
            add(f"route-table {route_table_id}", "oci_route_table", ["oci", "network", "route-table", "get", "--rt-id", route_table_id, "--output", "json"])
        for sl_id in subnet.get("security-list-ids", []) or []:
            add(f"security-list {sl_id}", "oci_security_list", ["oci", "network", "security-list", "get", "--security-list-id", sl_id, "--output", "json"])

print(json.dumps(plan))
PY
execute_plan "$tmp_dir/plan5.json"

python3 - "$records" "$namespace" "$cluster_id" "$compartment_id" "$region" "$pod" "$deployment" "$service" "$ingress" "$pvc" "$node" <<'PY'
import json
import re
import sys
from pathlib import Path

records = [json.loads(line) for line in Path(sys.argv[1]).read_text().splitlines() if line.strip()]
namespace, cluster_id, compartment_id, region = sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
pod_arg, deployment_arg, service_arg, ingress_arg, pvc_arg, node_arg = sys.argv[6:12]

nodes = {}
edges = []
findings = []
anomalies = []
snippets = []
seen_edges = set()

def parse_json(text):
    try:
        return json.loads(text)
    except Exception:
        return None

def add_node(node_id, node_type, name="", source="", **attrs):
    if not node_id:
        return
    existing = nodes.setdefault(node_id, {"id": node_id, "type": node_type, "name": name or node_id, "source": source, "attributes": {}})
    existing["type"] = existing.get("type") or node_type
    if name:
        existing["name"] = name
    if source:
        existing["source"] = source
    for key, value in attrs.items():
        if value not in ("", None, [], {}):
            existing["attributes"][key] = value

def add_edge(src, dst, relation, evidence=""):
    if not src or not dst:
        return
    key = (src, dst, relation)
    if key in seen_edges:
        return
    seen_edges.add(key)
    edge = {"from": src, "to": dst, "relation": relation}
    if evidence:
        edge["evidence"] = evidence
    edges.append(edge)

def data(obj):
    if isinstance(obj, dict) and isinstance(obj.get("data"), dict):
        return obj["data"]
    return obj

def ann(obj, key):
    return (((obj or {}).get("metadata") or {}).get("annotations") or {}).get(key, "")

def labels(obj):
    return ((obj or {}).get("metadata") or {}).get("labels") or {}

def meta_name(obj):
    return ((obj or {}).get("metadata") or {}).get("name", "")

def k8s_id(kind, name, ns=None):
    if not name:
        return ""
    return f"k8s:{kind}:{ns + '/' if ns else ''}{name}"

def oci_id(kind, ocid):
    if not ocid:
        return ""
    return f"oci:{kind}:{ocid}"

def ocid(value):
    return isinstance(value, str) and value.startswith("ocid1.")

def provider_instance_id(obj):
    provider_id = ((obj.get("spec") or {}).get("providerID") or "")
    match = re.search(r"(ocid1\.instance\.[A-Za-z0-9_.-]+)", provider_id)
    return match.group(1) if match else ""

def lb_addresses(item):
    values = []
    for address in item.get("ip-addresses", []) or []:
        ip = address.get("ip-address") or address.get("ip")
        if ip:
            values.append(ip)
    return values

def match_lb_by_ip(items, target_ip):
    if not target_ip:
        return None
    for item in items:
        if target_ip in lb_addresses(item):
            return item
    return None

def network_entity_type(ocid_value):
    if not ocid_value:
        return "oci.network.entity"
    mapping = {
        ".internetgateway.": "oci.network.internetgateway",
        ".natgateway.": "oci.network.natgateway",
        ".servicegateway.": "oci.network.servicegateway",
        ".drg.": "oci.network.drg",
        ".localpeeringgateway.": "oci.network.localpeeringgateway",
        ".remotepeeringconnection.": "oci.network.remotepeeringconnection",
        ".privateip.": "oci.network.privateip",
        ".ipsecconnection.": "oci.network.ipsecconnection",
        ".networksecuritygroup.": "oci.network.nsg",
    }
    return next((node_type for marker, node_type in mapping.items() if marker in ocid_value), "oci.network.entity")

derived = {"node": node_arg, "instance_id": "", "lb_id": "", "lb_ip": "", "pv": "", "volume_id": ""}

for rec in records:
    out = rec.get("output", "").strip()
    if rec.get("rc") != 0:
        anomalies.append(f"{rec['name']} failed with rc={rec['rc']}")
    if out:
        snippets.append(f"$ {rec['cmd']}\n{out[-1000:]}")

for rec in records:
    obj = parse_json(rec.get("output", ""))
    if not obj:
        continue
    obj_data = data(obj)
    kind = rec["kind"]
    if kind == "k8s_pod":
        name = meta_name(obj_data) or pod_arg
        pod_id = k8s_id("pod", name, namespace)
        add_node(pod_id, "kubernetes.pod", name, "kubectl", namespace=namespace, service_account=(obj_data.get("spec") or {}).get("serviceAccountName"))
        node = (obj_data.get("spec") or {}).get("nodeName", "")
        if node:
            derived["node"] = node
            node_id = k8s_id("node", node)
            add_node(node_id, "kubernetes.node", node, "kubectl")
            add_edge(pod_id, node_id, "scheduled_on", "pod.spec.nodeName")
        sa = (obj_data.get("spec") or {}).get("serviceAccountName", "")
        if sa:
            sa_id = k8s_id("serviceaccount", sa, namespace)
            add_node(sa_id, "kubernetes.serviceaccount", sa, "kubectl", namespace=namespace)
            add_edge(pod_id, sa_id, "uses_service_account", "pod.spec.serviceAccountName")
        for vol in (obj_data.get("spec") or {}).get("volumes", []) or []:
            claim = (vol.get("persistentVolumeClaim") or {}).get("claimName", "")
            if claim:
                pvc_id = k8s_id("pvc", claim, namespace)
                add_node(pvc_id, "kubernetes.pvc", claim, "kubectl", namespace=namespace)
                add_edge(pod_id, pvc_id, "mounts_claim", f"pod volume {vol.get('name', '')}")
    elif kind == "k8s_node":
        name = meta_name(obj_data) or derived["node"]
        node_id = k8s_id("node", name)
        annotations = ((obj_data.get("metadata") or {}).get("annotations") or {})
        annotation_instance_id = annotations.get("node.oci.oraclecloud.com/instance-id") or annotations.get("oci.oraclecloud.com/instance-id") or annotations.get("oci.oraclecloud.com/instance_id") or ""
        provider_instance = provider_instance_id(obj_data)
        instance_id = annotation_instance_id or provider_instance
        pool = labels(obj_data).get("oke.oraclecloud.com/nodepool") or labels(obj_data).get("oci.oraclecloud.com/oke-nodepool")
        add_node(node_id, "kubernetes.node", name, "kubectl", nodepool=pool, provider_id=(obj_data.get("spec") or {}).get("providerID"))
        if instance_id:
            derived["instance_id"] = instance_id
            inst_id = oci_id("instance", instance_id)
            source = "kubectl node annotation" if annotation_instance_id else "kubectl node providerID"
            evidence = "node instance annotation" if annotation_instance_id else "node.spec.providerID"
            add_node(inst_id, "oci.compute.instance", instance_id, source)
            add_edge(node_id, inst_id, "runs_on_instance", evidence)
    elif kind == "k8s_deployment":
        name = meta_name(obj_data) or deployment_arg
        dep_id = k8s_id("deployment", name, namespace)
        add_node(dep_id, "kubernetes.deployment", name, "kubectl", namespace=namespace, replicas=(obj_data.get("spec") or {}).get("replicas"))
    elif kind == "k8s_service":
        name = meta_name(obj_data) or service_arg
        svc_id = k8s_id("service", name, namespace)
        spec = obj_data.get("spec") or {}
        add_node(svc_id, "kubernetes.service", name, "kubectl", namespace=namespace, service_type=spec.get("type"), selector=spec.get("selector"))
        lb_id = ann(obj_data, "oci.oraclecloud.com/load-balancer-id") or ann(obj_data, "service.beta.kubernetes.io/oci-load-balancer-id") or ann(obj_data, "oci.oraclecloud.com/network-load-balancer-id")
        status_ing = (((obj_data.get("status") or {}).get("loadBalancer") or {}).get("ingress") or [])
        if status_ing and not lb_id:
            derived["lb_ip"] = status_ing[0].get("ip") or status_ing[0].get("hostname") or ""
        if lb_id:
            derived["lb_id"] = lb_id
            lb_kind = "networkloadbalancer" if ".networkloadbalancer." in lb_id else "loadbalancer"
            lb_node = oci_id(lb_kind, lb_id)
            add_node(lb_node, f"oci.{lb_kind}", lb_id, "service annotation")
            add_edge(svc_id, lb_node, "provisions", "service LB annotation")
    elif kind == "k8s_endpoints":
        name = meta_name(obj_data) or service_arg
        ep_id = k8s_id("endpoints", name, namespace)
        svc_id = k8s_id("service", name, namespace)
        add_node(ep_id, "kubernetes.endpoints", name, "kubectl", namespace=namespace)
        add_edge(svc_id, ep_id, "selects_endpoints", "endpoints object")
        addresses = []
        for subset in obj_data.get("subsets", []) or []:
            for addr in subset.get("addresses", []) or []:
                ip = addr.get("ip")
                if ip:
                    addresses.append(ip)
        if not addresses:
            anomalies.append(f"Service {namespace}/{name} has no ready endpoint addresses")
        else:
            findings.append(f"Service {namespace}/{name} has {len(addresses)} ready endpoint address(es)")
    elif kind == "k8s_ingress":
        name = meta_name(obj_data) or ingress_arg
        ing_id = k8s_id("ingress", name, namespace)
        add_node(ing_id, "kubernetes.ingress", name, "kubectl", namespace=namespace, ingress_class=(obj_data.get("spec") or {}).get("ingressClassName"))
        lb_id = ann(obj_data, "oci.oraclecloud.com/load-balancer-id") or ann(obj_data, "service.beta.kubernetes.io/oci-load-balancer-id")
        if lb_id:
            derived["lb_id"] = lb_id
            lb_node = oci_id("loadbalancer", lb_id)
            add_node(lb_node, "oci.loadbalancer", lb_id, "ingress annotation")
            add_edge(ing_id, lb_node, "provisions", "ingress LB annotation")
        status_ing = (((obj_data.get("status") or {}).get("loadBalancer") or {}).get("ingress") or [])
        if status_ing and not derived["lb_ip"]:
            derived["lb_ip"] = status_ing[0].get("ip") or status_ing[0].get("hostname") or ""
        for rule in (obj_data.get("spec") or {}).get("rules", []) or []:
            for path in (((rule.get("http") or {}).get("paths")) or []):
                backend_svc = ((((path.get("backend") or {}).get("service") or {}).get("name")) or "")
                if backend_svc:
                    svc_id = k8s_id("service", backend_svc, namespace)
                    add_node(svc_id, "kubernetes.service", backend_svc, "ingress backend", namespace=namespace)
                    add_edge(ing_id, svc_id, "routes_to", f"host {rule.get('host', '')}")
    elif kind == "k8s_pvc":
        name = meta_name(obj_data) or pvc_arg
        pvc_id = k8s_id("pvc", name, namespace)
        pv = (obj_data.get("spec") or {}).get("volumeName", "")
        add_node(pvc_id, "kubernetes.pvc", name, "kubectl", namespace=namespace, phase=(obj_data.get("status") or {}).get("phase"))
        if pv:
            derived["pv"] = pv
            pv_id = k8s_id("pv", pv)
            add_node(pv_id, "kubernetes.pv", pv, "pvc.spec.volumeName")
            add_edge(pvc_id, pv_id, "bound_to", "pvc.spec.volumeName")
    elif kind == "k8s_pv":
        name = meta_name(obj_data) or derived["pv"]
        pv_id = k8s_id("pv", name)
        spec = obj_data.get("spec") or {}
        handle = (spec.get("csi") or {}).get("volumeHandle") or spec.get("ociVolumeID") or spec.get("volumeID") or ""
        add_node(pv_id, "kubernetes.pv", name, "kubectl", storage_class=spec.get("storageClassName"))
        if handle:
            derived["volume_id"] = handle
            vol_id = oci_id("volume", handle)
            add_node(vol_id, "oci.blockvolume.volume", handle, "pv volume handle")
            add_edge(pv_id, vol_id, "backs_onto", "PV volume handle")
    elif kind == "oci_instance":
        inst = data(obj_data)
        inst_id_raw = inst.get("id", derived["instance_id"])
        inst_id = oci_id("instance", inst_id_raw)
        add_node(inst_id, "oci.compute.instance", inst_id_raw, "oci", lifecycle_state=inst.get("lifecycle-state"), shape=inst.get("shape"), availability_domain=inst.get("availability-domain"))
        if inst.get("lifecycle-state") and inst.get("lifecycle-state") != "RUNNING":
            anomalies.append(f"Compute instance {inst_id_raw} lifecycle-state is {inst.get('lifecycle-state')}")
    elif kind == "oci_vnic_attachments":
        items = obj_data.get("data", obj_data if isinstance(obj_data, list) else []) or []
        inst_id = oci_id("instance", derived["instance_id"])
        for item in items:
            vnic_id = item.get("vnic-id")
            subnet_id = item.get("subnet-id")
            if vnic_id:
                vnic_node = oci_id("vnic", vnic_id)
                add_node(vnic_node, "oci.network.vnic", vnic_id, "oci", lifecycle_state=item.get("lifecycle-state"), display_name=item.get("display-name"))
                add_edge(inst_id, vnic_node, "has_vnic", "vnic attachment")
            if subnet_id:
                subnet_node = oci_id("subnet", subnet_id)
                add_node(subnet_node, "oci.network.subnet", subnet_id, "oci vnic attachment")
                add_edge(oci_id("vnic", vnic_id), subnet_node, "attached_to_subnet", "vnic attachment subnet")
    elif kind == "oci_vnic":
        vnic = data(obj_data)
        vnic_id_raw = vnic.get("id", "")
        vnic_node = oci_id("vnic", vnic_id_raw)
        add_node(
            vnic_node,
            "oci.network.vnic",
            vnic.get("display-name") or vnic_id_raw,
            "oci",
            lifecycle_state=vnic.get("lifecycle-state"),
            private_ip=vnic.get("private-ip"),
            public_ip=vnic.get("public-ip"),
            is_primary=vnic.get("is-primary"),
            subnet_id=vnic.get("subnet-id"),
        )
        subnet_id = vnic.get("subnet-id")
        if subnet_id:
            subnet_node = oci_id("subnet", subnet_id)
            add_node(subnet_node, "oci.network.subnet", subnet_id, "oci vnic")
            add_edge(vnic_node, subnet_node, "attached_to_subnet", "vnic.subnet-id")
        for nsg_id in vnic.get("nsg-ids", []) or []:
            nsg_node = oci_id("nsg", nsg_id)
            add_node(nsg_node, "oci.network.nsg", nsg_id, "vnic.nsg-ids")
            add_edge(vnic_node, nsg_node, "uses_nsg", "vnic.nsg-ids")
    elif kind == "oci_subnet":
        subnet = data(obj_data)
        subnet_id_raw = subnet.get("id", "")
        subnet_node = oci_id("subnet", subnet_id_raw)
        add_node(
            subnet_node,
            "oci.network.subnet",
            subnet.get("display-name") or subnet_id_raw,
            "oci",
            cidr_block=subnet.get("cidr-block"),
            ipv6_cidr_block=subnet.get("ipv6-cidr-block"),
            dns_label=subnet.get("dns-label"),
            route_table_id=subnet.get("route-table-id"),
            vcn_id=subnet.get("vcn-id"),
        )
        vcn_id = subnet.get("vcn-id")
        if vcn_id:
            vcn_node = oci_id("vcn", vcn_id)
            add_node(vcn_node, "oci.network.vcn", vcn_id, "subnet.vcn-id")
            add_edge(subnet_node, vcn_node, "in_vcn", "subnet.vcn-id")
        route_table_id = subnet.get("route-table-id")
        if route_table_id:
            rt_node = oci_id("route-table", route_table_id)
            add_node(rt_node, "oci.network.route_table", route_table_id, "subnet.route-table-id")
            add_edge(subnet_node, rt_node, "uses_route_table", "subnet.route-table-id")
        for sl_id in subnet.get("security-list-ids", []) or []:
            sl_node = oci_id("security-list", sl_id)
            add_node(sl_node, "oci.network.security_list", sl_id, "subnet.security-list-ids")
            add_edge(subnet_node, sl_node, "uses_security_list", "subnet.security-list-ids")
    elif kind == "oci_nsg":
        nsg = data(obj_data)
        nsg_id_raw = nsg.get("id", "")
        add_node(oci_id("nsg", nsg_id_raw), "oci.network.nsg", nsg.get("display-name") or nsg_id_raw, "oci", lifecycle_state=nsg.get("lifecycle-state"), vcn_id=nsg.get("vcn-id"))
    elif kind == "oci_security_list":
        sl = data(obj_data)
        sl_id_raw = sl.get("id", "")
        add_node(
            oci_id("security-list", sl_id_raw),
            "oci.network.security_list",
            sl.get("display-name") or sl_id_raw,
            "oci",
            lifecycle_state=sl.get("lifecycle-state"),
            vcn_id=sl.get("vcn-id"),
            ingress_rules=len(sl.get("ingress-security-rules", []) or []),
            egress_rules=len(sl.get("egress-security-rules", []) or []),
        )
    elif kind == "oci_route_table":
        rt = data(obj_data)
        rt_id_raw = rt.get("id", "")
        rt_node = oci_id("route-table", rt_id_raw)
        add_node(rt_node, "oci.network.route_table", rt.get("display-name") or rt_id_raw, "oci", lifecycle_state=rt.get("lifecycle-state"), vcn_id=rt.get("vcn-id"))
        for idx, rule in enumerate(rt.get("route-rules", []) or [], start=1):
            target_id = rule.get("network-entity-id") or rule.get("networkEntityId") or ""
            destination = rule.get("destination") or rule.get("cidr-block") or rule.get("destination-type") or f"rule {idx}"
            if target_id:
                target_node = oci_id("network-entity", target_id)
                add_node(target_node, network_entity_type(target_id), target_id, "route rule", destination=destination)
                add_edge(rt_node, target_node, "routes_to", str(destination))
    elif kind in ("oci_lb", "oci_nlb"):
        lb = data(obj_data)
        lb_id_raw = lb.get("id", derived["lb_id"])
        lb_type = "oci.networkloadbalancer" if kind == "oci_nlb" else "oci.loadbalancer"
        lb_node = oci_id("networkloadbalancer" if kind == "oci_nlb" else "loadbalancer", lb_id_raw)
        add_node(lb_node, lb_type, lb_id_raw, "oci", lifecycle_state=lb.get("lifecycle-state") or lb.get("lifecycle-state-details"), shape=lb.get("shape-name"), ip_addresses=lb_addresses(lb))
        for subnet_id in lb.get("subnet-ids", []) or []:
            subnet_node = oci_id("subnet", subnet_id)
            add_node(subnet_node, "oci.network.subnet", subnet_id, "oci load balancer")
            add_edge(lb_node, subnet_node, "uses_subnet", "load balancer subnet")
        if service_arg and (derived["lb_id"] == lb_id_raw or derived["lb_ip"] in lb_addresses(lb)):
            add_edge(k8s_id("service", service_arg, namespace), lb_node, "provisions", "matched service external IP or LB ID")
        if ingress_arg and (derived["lb_id"] == lb_id_raw or derived["lb_ip"] in lb_addresses(lb)):
            add_edge(k8s_id("ingress", ingress_arg, namespace), lb_node, "provisions", "matched ingress external IP or LB ID")
        if lb.get("lifecycle-state") and lb.get("lifecycle-state") not in ("ACTIVE", "SUCCEEDED"):
            anomalies.append(f"Load balancer {lb_id_raw} lifecycle-state is {lb.get('lifecycle-state')}")
    elif kind in ("oci_lb_list", "oci_nlb_list"):
        items = obj_data.get("data", []) if isinstance(obj_data, dict) else obj_data
        items = items or []
        lb = match_lb_by_ip(items, derived["lb_ip"])
        if lb:
            lb_id_raw = lb.get("id", "")
            lb_kind = "networkloadbalancer" if kind == "oci_nlb_list" else "loadbalancer"
            lb_type = "oci.networkloadbalancer" if kind == "oci_nlb_list" else "oci.loadbalancer"
            lb_node = oci_id(lb_kind, lb_id_raw)
            derived["lb_id"] = lb_id_raw
            add_node(lb_node, lb_type, lb_id_raw, "oci ip match", lifecycle_state=lb.get("lifecycle-state") or lb.get("lifecycle-state-details"), shape=lb.get("shape-name"), ip_addresses=lb_addresses(lb), display_name=lb.get("display-name"))
            if service_arg:
                add_edge(k8s_id("service", service_arg, namespace), lb_node, "provisions", f"matched external IP {derived['lb_ip']}")
            if ingress_arg:
                add_edge(k8s_id("ingress", ingress_arg, namespace), lb_node, "provisions", f"matched external IP {derived['lb_ip']}")
            for subnet_id in lb.get("subnet-ids", []) or []:
                subnet_node = oci_id("subnet", subnet_id)
                add_node(subnet_node, "oci.network.subnet", subnet_id, "oci load balancer")
                add_edge(lb_node, subnet_node, "uses_subnet", "load balancer subnet")
            findings.append(f"Matched external IP {derived['lb_ip']} to OCI {'Network ' if kind == 'oci_nlb_list' else ''}Load Balancer {lb_id_raw}")
            if lb.get("lifecycle-state") and lb.get("lifecycle-state") not in ("ACTIVE", "SUCCEEDED"):
                anomalies.append(f"Load balancer {lb_id_raw} lifecycle-state is {lb.get('lifecycle-state')}")
        elif derived["lb_ip"]:
            anomalies.append(f"No OCI {'Network ' if kind == 'oci_nlb_list' else ''}Load Balancer matched external IP {derived['lb_ip']}")
    elif kind == "oci_lb_health":
        health = data(obj_data)
        status = health.get("status") or health.get("overall-health")
        lb_node = oci_id("loadbalancer", derived["lb_id"])
        if status:
            add_node(f"{lb_node}:health", "oci.loadbalancer.health", status, "oci", status=status)
            add_edge(lb_node, f"{lb_node}:health", "has_health", "LB health API")
            if str(status).upper() not in ("OK", "SUCCEEDED", "HEALTHY"):
                anomalies.append(f"Load balancer health status is {status}")
    elif kind == "oci_volume":
        vol = data(obj_data)
        vol_id_raw = vol.get("id", derived["volume_id"])
        add_node(oci_id("volume", vol_id_raw), "oci.blockvolume.volume", vol_id_raw, "oci", lifecycle_state=vol.get("lifecycle-state"), availability_domain=vol.get("availability-domain"), size_in_gbs=vol.get("size-in-gbs"))
    elif kind == "oci_volume_attachments":
        items = obj_data.get("data", obj_data if isinstance(obj_data, list) else []) or []
        for item in items:
            vol_id_raw = item.get("volume-id", derived["volume_id"])
            inst_id_raw = item.get("instance-id")
            if vol_id_raw and inst_id_raw:
                add_node(oci_id("volume", vol_id_raw), "oci.blockvolume.volume", vol_id_raw, "oci volume attachment")
                add_node(oci_id("instance", inst_id_raw), "oci.compute.instance", inst_id_raw, "oci volume attachment")
                add_edge(oci_id("volume", vol_id_raw), oci_id("instance", inst_id_raw), "attached_to_instance", "volume attachment")
            if item.get("lifecycle-state") and item.get("lifecycle-state") != "ATTACHED":
                anomalies.append(f"Volume attachment {item.get('id', '')} lifecycle-state is {item.get('lifecycle-state')}")
    elif kind == "oci_node_pools":
        items = obj_data.get("data", obj_data if isinstance(obj_data, list) else []) or []
        cluster_node = oci_id("cluster", cluster_id)
        if cluster_id:
            add_node(cluster_node, "oci.oke.cluster", cluster_id, "input", region=region, compartment_id=compartment_id)
        for item in items:
            np_id = item.get("id")
            if np_id:
                np_node = oci_id("nodepool", np_id)
                add_node(np_node, "oci.oke.nodepool", item.get("name", np_id), "oci", size=item.get("size"), shape=item.get("node-shape"))
                add_edge(cluster_node, np_node, "has_node_pool", "node pool list")

if cluster_id:
    add_node(oci_id("cluster", cluster_id), "oci.oke.cluster", cluster_id, "input", region=region, compartment_id=compartment_id)

if not findings:
    findings.append(f"Built object graph with {len(nodes)} node(s) and {len(edges)} edge(s)")
else:
    findings.insert(0, f"Built object graph with {len(nodes)} node(s) and {len(edges)} edge(s)")

if not nodes:
    anomalies.append("No Kubernetes or OCI objects could be correlated from the provided selectors")

print(json.dumps({
    "domain": "OCI Object Correlation",
    "namespace": namespace,
    "cluster_id": cluster_id,
    "compartment_id": compartment_id,
    "region": region,
    "selectors": {
        "pod": pod_arg,
        "deployment": deployment_arg,
        "service": service_arg,
        "ingress": ingress_arg,
        "pvc": pvc_arg,
        "node": node_arg,
    },
    "graph": {
        "kubernetes": [node for node in nodes.values() if node["type"].startswith("kubernetes.")],
        "oci": [node for node in nodes.values() if node["type"].startswith("oci.")],
        "edges": edges,
    },
    "findings": findings,
    "anomalies": anomalies,
    "raw_snippets": snippets[-12:],
    "fallback_used": any(item["rc"] != 0 for item in records),
}, indent=2))
PY

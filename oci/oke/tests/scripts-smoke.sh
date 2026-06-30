#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

assert_eq() {
  local expected="$1"
  local actual="$2"
  local msg="$3"
  if [[ "$expected" != "$actual" ]]; then
    echo "FAIL: $msg (expected=$expected actual=$actual)" >&2
    exit 1
  fi
}

assert_contains() {
  local haystack="$1"
  local needle="$2"
  local msg="$3"
  if [[ "$haystack" != *"$needle"* ]]; then
    echo "FAIL: $msg (missing: $needle)" >&2
    exit 1
  fi
}

assert_file_matches() {
  local expected="$1"
  local actual="$2"
  local msg="$3"
  if ! diff -u "$expected" "$actual"; then
    echo "FAIL: $msg" >&2
    exit 1
  fi
}

assert_json_expr() {
  local json="$1"
  local expr="$2"
  local msg="$3"
  if ! JSON_INPUT="$json" EXPR="$expr" python3 - <<'PY'
import json
import os

obj = json.loads(os.environ["JSON_INPUT"])
expr = os.environ["EXPR"]
if not eval(expr, {"obj": obj}):
    raise SystemExit(1)
PY
  then
    echo "FAIL: $msg" >&2
    exit 1
  fi
}

make_mocks() {
  local dir="$1"
  mkdir -p "$dir"

  cat > "$dir/oci" <<'MOCK_OCI'
#!/usr/bin/env bash
set -euo pipefail

args=("$@")
trimmed=()
idx=0
while [[ $idx -lt ${#args[@]} ]]; do
  case "${args[$idx]}" in
    --region|--profile)
      idx=$((idx+2))
      ;;
    *)
      trimmed+=("${args[$idx]}")
      idx=$((idx+1))
      ;;
  esac
done

cmd="${trimmed[*]}"

if [[ "$cmd" == iam\ region-subscription\ list* ]]; then
  if [[ "${MOCK_OCI_AUTH_FAIL:-0}" == "1" ]]; then
    echo "Not authenticated" >&2
    exit 1
  fi
  cat <<'JSON'
{"data":[{"region-name":"us-ashburn-1","status":"READY","is-home-region":true,"tenancy-id":"ocid1.tenancy.oc1..tenancy"}]}
JSON
  exit 0
fi

if [[ "$cmd" == iam\ compartment\ list* ]]; then
  cat <<'JSON'
{"data":[{"name":"team-a","id":"ocid1.compartment.oc1..a","compartment-id":"ocid1.tenancy.oc1..tenancy"}]}
JSON
  exit 0
fi

if [[ "$cmd" == ce\ cluster\ get* ]]; then
  if [[ "${MOCK_OCI_CLUSTER_GET_FAIL:-0}" == "1" ]]; then
    echo "cluster get failed" >&2
    exit 2
  fi
  cluster_id=""
  for ((i=0; i<${#trimmed[@]}; i++)); do
    if [[ "${trimmed[$i]}" == "--cluster-id" && $((i+1)) -lt ${#trimmed[@]} ]]; then
      cluster_id="${trimmed[$((i+1))]}"
      break
    fi
  done
  name="cluster-from-get"
  if [[ -n "${MOCK_OCI_CLUSTER_GET_NAME:-}" ]]; then
    name="${MOCK_OCI_CLUSTER_GET_NAME}"
  fi
  cat <<JSON
{"name":"$name","k8s":"v1.31.1","compartment":"ocid1.compartment.oc1..a","data":{"name":"$name","kubernetes-version":"v1.31.1","compartment-id":"ocid1.compartment.oc1..a","id":"$cluster_id"}}
JSON
  exit 0
fi

if [[ "$cmd" == ce\ cluster\ list* ]]; then
  if [[ -n "${MOCK_OCI_CLUSTER_LIST_JSON:-}" ]]; then
    printf '%s\n' "$MOCK_OCI_CLUSTER_LIST_JSON"
  else
    cat <<'JSON'
{"data":[{"name":"default-cluster","id":"ocid1.cluster.oc1..default","kubernetes-version":"v1.30.1"}]}
JSON
  fi
  exit 0
fi

if [[ "$cmd" == ce\ node-pool\ list* ]]; then
  cat <<'JSON'
{"data":[{"name":"np-general","id":"ocid1.nodepool.oc1..np","size":2,"node-shape":"VM.Standard.E5.Flex"}]}
JSON
  exit 0
fi

if [[ "$cmd" == compute\ instance\ get* ]]; then
  cat <<'JSON'
{"data":{"id":"ocid1.instance.oc1..inst","lifecycle-state":"RUNNING","shape":"VM.Standard.E5.Flex","availability-domain":"GrCh:US-ASHBURN-AD-1"}}
JSON
  exit 0
fi

if [[ "$cmd" == compute\ vnic-attachment\ list* ]]; then
  cat <<'JSON'
{"data":[{"id":"ocid1.vnicattachment.oc1..va","vnic-id":"ocid1.vnic.oc1..vnic","subnet-id":"ocid1.subnet.oc1..node","lifecycle-state":"ATTACHED","display-name":"primary-vnic"},{"id":"ocid1.vnicattachment.oc1..vasecondary","vnic-id":"ocid1.vnic.oc1..secondary","subnet-id":"ocid1.subnet.oc1..secondary","lifecycle-state":"ATTACHED","display-name":"secondary-vnic"}]}
JSON
  exit 0
fi

if [[ "$cmd" == network\ vnic\ get* ]]; then
  if [[ "$cmd" == *"ocid1.vnic.oc1..secondary"* ]]; then
    cat <<'JSON'
{"data":{"id":"ocid1.vnic.oc1..secondary","display-name":"secondary-vnic","lifecycle-state":"AVAILABLE","subnet-id":"ocid1.subnet.oc1..secondary","nsg-ids":["ocid1.networksecuritygroup.oc1..secondary"],"private-ip":"10.0.2.10","is-primary":false}}
JSON
  else
    cat <<'JSON'
{"data":{"id":"ocid1.vnic.oc1..vnic","display-name":"primary-vnic","lifecycle-state":"AVAILABLE","subnet-id":"ocid1.subnet.oc1..node","nsg-ids":["ocid1.networksecuritygroup.oc1..node"],"private-ip":"10.0.1.10","is-primary":true}}
JSON
  fi
  exit 0
fi

if [[ "$cmd" == network\ subnet\ get* ]]; then
  if [[ "$cmd" == *"ocid1.subnet.oc1..secondary"* ]]; then
    cat <<'JSON'
{"data":{"id":"ocid1.subnet.oc1..secondary","display-name":"secondary-subnet","cidr-block":"10.0.2.0/24","vcn-id":"ocid1.vcn.oc1..vcn","route-table-id":"ocid1.routetable.oc1..secondary","security-list-ids":["ocid1.securitylist.oc1..secondary"]}}
JSON
  else
    cat <<'JSON'
{"data":{"id":"ocid1.subnet.oc1..node","display-name":"node-subnet","cidr-block":"10.0.1.0/24","vcn-id":"ocid1.vcn.oc1..vcn","route-table-id":"ocid1.routetable.oc1..node","security-list-ids":["ocid1.securitylist.oc1..node"]}}
JSON
  fi
  exit 0
fi

if [[ "$cmd" == network\ nsg\ get* ]]; then
  if [[ "$cmd" == *"ocid1.networksecuritygroup.oc1..secondary"* ]]; then
    cat <<'JSON'
{"data":{"id":"ocid1.networksecuritygroup.oc1..secondary","display-name":"secondary-nsg","vcn-id":"ocid1.vcn.oc1..vcn","lifecycle-state":"AVAILABLE"}}
JSON
  else
    cat <<'JSON'
{"data":{"id":"ocid1.networksecuritygroup.oc1..node","display-name":"node-nsg","vcn-id":"ocid1.vcn.oc1..vcn","lifecycle-state":"AVAILABLE"}}
JSON
  fi
  exit 0
fi

if [[ "$cmd" == network\ security-list\ get* ]]; then
  if [[ "$cmd" == *"ocid1.securitylist.oc1..secondary"* ]]; then
    cat <<'JSON'
{"data":{"id":"ocid1.securitylist.oc1..secondary","display-name":"secondary-sl","vcn-id":"ocid1.vcn.oc1..vcn","ingress-security-rules":[{}],"egress-security-rules":[{}],"lifecycle-state":"AVAILABLE"}}
JSON
  else
    cat <<'JSON'
{"data":{"id":"ocid1.securitylist.oc1..node","display-name":"node-sl","vcn-id":"ocid1.vcn.oc1..vcn","ingress-security-rules":[{}],"egress-security-rules":[{}],"lifecycle-state":"AVAILABLE"}}
JSON
  fi
  exit 0
fi

if [[ "$cmd" == network\ route-table\ get* ]]; then
  if [[ "$cmd" == *"ocid1.routetable.oc1..secondary"* ]]; then
    cat <<'JSON'
{"data":{"id":"ocid1.routetable.oc1..secondary","display-name":"secondary-rt","vcn-id":"ocid1.vcn.oc1..vcn","route-rules":[{"destination":"10.1.0.0/16","network-entity-id":"ocid1.localpeeringgateway.oc1..lpg"}],"lifecycle-state":"AVAILABLE"}}
JSON
  else
    cat <<'JSON'
{"data":{"id":"ocid1.routetable.oc1..node","display-name":"node-rt","vcn-id":"ocid1.vcn.oc1..vcn","route-rules":[{"destination":"0.0.0.0/0","network-entity-id":"ocid1.natgateway.oc1..nat"}],"lifecycle-state":"AVAILABLE"}}
JSON
  fi
  exit 0
fi

if [[ "$cmd" == bv\ volume\ get* ]]; then
  cat <<'JSON'
{"data":{"id":"ocid1.volume.oc1..vol","lifecycle-state":"AVAILABLE","availability-domain":"GrCh:US-ASHBURN-AD-1","size-in-gbs":50}}
JSON
  exit 0
fi

if [[ "$cmd" == compute\ volume-attachment\ list* ]]; then
  cat <<'JSON'
{"data":[{"id":"ocid1.volumeattachment.oc1..attach","volume-id":"ocid1.volume.oc1..vol","instance-id":"ocid1.instance.oc1..inst","lifecycle-state":"ATTACHED"}]}
JSON
  exit 0
fi

if [[ "$cmd" == monitoring\ alarm-status\ list-alarms-status* ]]; then
  cat <<'JSON'
{"data":[{"display-name":"node-cpu-high","status":"FIRING","timestamp-triggered":"2026-04-29T20:00:00Z"}]}
JSON
  exit 0
fi

if [[ "$cmd" == artifacts\ container\ repository\ list* ]]; then
  cat <<'JSON'
{"data":[{"display-name":"team/web","id":"ocid1.containerrepo.oc1..repo"}]}
JSON
  exit 0
fi

if [[ "$cmd" == iam\ dynamic-group\ list* ]]; then
  cat <<'JSON'
{"data":[{"name":"oke-workloads","matching-rule":"ALL {resource.type = 'cluster'}"}]}
JSON
  exit 0
fi

if [[ "$cmd" == iam\ policy\ list* ]]; then
  cat <<'JSON'
{"data":[{"name":"oke-workload-policy","statements":["Allow any-user to read buckets in tenancy where all {request.principal.type = 'workload'}"]}]}
JSON
  exit 0
fi

if [[ "$cmd" == network\ subnet\ list* ]]; then
  echo '{"data":[]}'
  exit 0
fi

if [[ "$cmd" == network\ nsg\ list* ]]; then
  echo '{"data":[]}'
  exit 0
fi

echo "unexpected oci args: $*" >&2
exit 9
MOCK_OCI

  cat > "$dir/kubectl" <<'MOCK_KUBECTL'
#!/usr/bin/env bash
set -euo pipefail

if [[ -n "${MOCK_KUBECTL_LOG:-}" ]]; then
  printf '%s\n' "$*" >> "$MOCK_KUBECTL_LOG"
fi

if [[ "$*" == *" debug node/"* ]]; then
  echo "Creating debugging pod nd-123 with container debugger on node."
  echo "Running node doctor..."
  echo "PASS kernel"
  echo "0 Signal(s) generated"
  exit 0
fi

if [[ "$*" == *" get pod nd-123 -o jsonpath={.status.phase}"* || "$*" == *" get pod nd-123 -o jsonpath='{.status.phase}'"* ]]; then
  echo "Succeeded"
  exit 0
fi

if [[ "$*" == *" logs nd-123"* ]]; then
  echo "Running node doctor..."
  echo "PASS kernel"
  echo "0 Signal(s) generated"
  exit 0
fi

if [[ "$*" == *" delete pod "* ]]; then
  echo "pod \"nd-123\" deleted"
  exit 0
fi

if [[ "$*" == *"-n kube-system get pods -o wide"* ]]; then
  cat <<'OUT'
NAME                       READY   STATUS    NODE
coredns-abc                1/1     Running   node-a
oci-csi-controller-abc     1/1     Running   node-a
OUT
  exit 0
fi

if [[ "$*" == *"-n kube-system get deploy -o wide"* ]]; then
  cat <<'OUT'
NAME      READY   UP-TO-DATE   AVAILABLE
coredns   2/2     2            2
OUT
  exit 0
fi

if [[ "$*" == *"-n kube-system get ds -o wide"* ]]; then
  cat <<'OUT'
NAME      DESIRED   CURRENT   READY
oci-cni   2         2         2
OUT
  exit 0
fi

if [[ "$*" == *"-n kube-system get deploy coredns -o wide"* ]]; then
  echo "coredns 2/2 2 2"
  exit 0
fi

if [[ "$*" == *"-n kube-system get events --field-selector type=Warning"* ]]; then
  echo "No resources found in kube-system namespace."
  exit 0
fi

if [[ "$*" == *"-n default get pod web-0 -o wide"* ]]; then
  echo "web-0 0/1 ContainerCreating node-a"
  exit 0
fi

if [[ "$*" == *"-n default describe pod web-0"* ]]; then
  echo "Warning FailedCreatePodSandBox failed to find plugin \"ipvlan\" in path [/opt/cni/bin]"
  exit 0
fi

if [[ "$*" == *"-n default get pod web-0 -o jsonpath={.metadata.annotations.k8s\\.v1\\.cni\\.cncf\\.io/network-status}"* || "$*" == *"-n default get pod web-0 -o jsonpath='{.metadata.annotations.k8s\\.v1\\.cni\\.cncf\\.io/network-status}'"* ]]; then
  echo '[{"name":"default/secondary","interface":"net1"}]'
  exit 0
fi

if [[ "$*" == *"-n default get pod web-0 -o jsonpath={.spec.nodeName}"* || "$*" == *"-n default get pod web-0 -o jsonpath='{.spec.nodeName}'"* ]]; then
  echo "node-a"
  exit 0
fi

if [[ "$*" == *"-n default get pod storage-pod -o json"* ]]; then
  cat <<'JSON'
{"metadata":{"name":"storage-pod","namespace":"default"},"spec":{"nodeName":"node-no-annotation","serviceAccountName":"default","volumes":[{"name":"data","persistentVolumeClaim":{"claimName":"data"}}]}}
JSON
  exit 0
fi

if [[ "$*" == *"-n default get pvc data -o json"* ]]; then
  cat <<'JSON'
{"metadata":{"name":"data","namespace":"default"},"spec":{"volumeName":"pv-data"},"status":{"phase":"Bound"}}
JSON
  exit 0
fi

if [[ "$*" == *"get pv pv-data -o json"* ]]; then
  cat <<'JSON'
{"metadata":{"name":"pv-data"},"spec":{"storageClassName":"oci-bv","csi":{"driver":"blockvolume.csi.oraclecloud.com","volumeHandle":"ocid1.volume.oc1..vol"}}}
JSON
  exit 0
fi

if [[ "$*" == *"get node node-no-annotation -o json"* ]]; then
  cat <<'JSON'
{"metadata":{"name":"node-no-annotation","labels":{"oke.oraclecloud.com/nodepool":"np-general"},"annotations":{}},"spec":{"providerID":"oci://ocid1.instance.oc1..inst"}}
JSON
  exit 0
fi

if [[ "$*" == *"-n default get events --field-selector type=Warning"* ]]; then
  echo "Warning FailedCreatePodSandBox failed to setup network"
  exit 0
fi

if [[ "$*" == *"-n kube-system get pods -l app=oci-cni -o wide"* ]]; then
  echo "oci-cni-abc 1/1 Running node-a"
  exit 0
fi

if [[ "$*" == *"-n kube-system get pods -l name=multus -o wide"* ]]; then
  echo "kube-multus-ds-abc 1/1 Running node-a"
  exit 0
fi

if [[ "$*" == *"get network-attachment-definitions -A"* ]]; then
  echo "default secondary"
  exit 0
fi

if [[ "$*" == *"-n default get pods --field-selector=status.phase=Pending -o wide"* ]]; then
  echo "web-0 0/1 Pending <none>"
  exit 0
fi

if [[ "$*" == *"-n default get events --field-selector reason=FailedScheduling"* ]]; then
  echo "Warning FailedScheduling 0/2 nodes available: Insufficient cpu"
  exit 0
fi

if [[ "$*" == *"-n kube-system get deploy cluster-autoscaler -o wide"* ]]; then
  echo "cluster-autoscaler 1/1 1 1"
  exit 0
fi

if [[ "$*" == *"-n kube-system logs deployment/cluster-autoscaler --tail=200"* ]]; then
  echo "NotTriggerScaleUp pod didn't trigger scale-up: max node group size reached"
  exit 0
fi

if [[ "$*" == *"-n default describe deployment web"* ]]; then
  echo "Deployment web has 3 unavailable replicas"
  exit 0
fi

if [[ "$*" == *"-n default get hpa --selector app=web -o wide"* ]]; then
  echo "No resources found in default namespace."
  exit 0
fi

if [[ "$*" == *"-n kube-system get pods -l k8s-app=kube-dns -o wide"* ]]; then
  echo "coredns-abc 1/1 Running node-a"
  exit 0
fi

if [[ "$*" == *"-n kube-system get configmap coredns -o yaml"* ]]; then
  echo "kind: ConfigMap"
  exit 0
fi

if [[ "$*" == *"-n kube-system logs deployment/coredns --tail=200"* ]]; then
  echo "plugin/errors: 2 web.default.svc.cluster.local. A: read udp timeout"
  exit 0
fi

if [[ "$*" == *"-n default get svc web -o yaml"* ]]; then
  echo "kind: Service"
  exit 0
fi

if [[ "$*" == *"-n default get endpoints web -o yaml"* ]]; then
  echo "subsets: []"
  exit 0
fi

if [[ "$*" == *"-n default get endpointslices -l kubernetes.io/service-name=web -o yaml"* ]]; then
  echo "items: []"
  exit 0
fi

if [[ "$*" == *"-n default exec web-0 -- nslookup web.default.svc.cluster.local"* ]]; then
  echo ";; connection timed out; no servers could be reached"
  exit 0
fi

if [[ "$*" == *"config current-context"* ]]; then
  echo "context-oke"
  exit 0
fi

if [[ "$*" == *"cluster-info"* ]]; then
  echo "Kubernetes control plane is running at https://private-endpoint"
  exit 0
fi

if [[ "$*" == *"get --raw=/readyz?verbose"* ]]; then
  echo "[-]poststarthook/start-kube-apiserver-admission-initializer failed: reason withheld"
  exit 0
fi

if [[ "$*" == *"version --client"* ]]; then
  echo "Client Version: v1.31.0"
  exit 0
fi

if [[ "$*" == *"-n default get pod web-0 -o yaml"* ]]; then
  cat <<'OUT'
spec:
  serviceAccountName: workload-sa
  imagePullSecrets:
  - name: ocirsecret
  containers:
  - image: iad.ocir.io/ns/team/web:bad
OUT
  exit 0
fi

if [[ "$*" == *"-n default get events --field-selector involvedObject.name=web-0"* ]]; then
  echo "Warning Failed Failed to pull image iad.ocir.io/ns/team/web:bad: unauthorized"
  exit 0
fi

if [[ "$*" == *"-n default get serviceaccount -o yaml"* ]]; then
  echo "kind: ServiceAccount"
  exit 0
fi

if [[ "$*" == *"-n default get secret -o yaml"* ]]; then
  echo "kind: Secret"
  exit 0
fi

if [[ "$*" == *"-n default get serviceaccount workload-sa -o yaml"* ]]; then
  echo "metadata: {name: workload-sa, annotations: {oracle.com/oci-workload-identity: enabled}}"
  exit 0
fi

if [[ "$*" == *"-n default logs web-0 --tail=200"* ]]; then
  echo "NotAuthorizedOrNotFound: principal lacks policy"
  exit 0
fi

if [[ "$*" == *"get ingressclass -o yaml"* ]]; then
  echo "kind: IngressClass"
  exit 0
fi

if [[ "$*" == *"-n default get ingress web -o yaml"* ]]; then
  echo "kind: Ingress"
  exit 0
fi

if [[ "$*" == *"-n default describe ingress web"* ]]; then
  echo "Warning ReconcileFailed listener certificate mismatch"
  exit 0
fi

if [[ "$*" == *"-n kube-system get pods -l app.kubernetes.io/name=oci-native-ingress-controller -o wide"* ]]; then
  echo "oci-native-ingress-controller 1/1 Running node-a"
  exit 0
fi

if [[ "$*" == *"-n kube-system logs -l app.kubernetes.io/name=oci-native-ingress-controller --tail=200"* ]]; then
  echo "Error syncing ingress default/web: backend set unhealthy"
  exit 0
fi

if [[ "$*" == *"-n default get events --sort-by=.lastTimestamp"* ]]; then
  echo "10m Warning FailedScheduling pod/web-0 Insufficient cpu"
  echo "5m Normal Started pod/web-0 Started container"
  exit 0
fi

if [[ "$*" == *"-n default rollout history deployment/web"* ]]; then
  echo "REVISION CHANGE-CAUSE"
  echo "2 kubectl set image"
  exit 0
fi

if [[ "$*" == *"-n default describe service web"* ]]; then
  echo "Warning Unhealthy backend"
  exit 0
fi

echo "unexpected kubectl args: $*" >&2
exit 8
MOCK_KUBECTL

  chmod +x "$dir/oci" "$dir/kubectl"
}

with_temp_home() {
  local home_dir="$1"
  mkdir -p "$home_dir/.oci"
  cat > "$home_dir/.oci/config" <<'CFG'
[DEFAULT]
user=ocid1.user.oc1..u
fingerprint=00:11
key_file=/tmp/fake.pem
tenancy=ocid1.tenancy.oc1..tenancy
region=us-ashburn-1
CFG
}

run_test_preflight() {
  echo "- preflight-check JSON contract"
  local out err rc
  set +e
  out="$("$REPO_ROOT/scripts/preflight-check.sh" 2>"$TMPDIR_BASE/t1.err")"
  rc=$?
  set -e
  if [[ "$rc" != "0" ]]; then
    echo "preflight stderr:"
    cat "$TMPDIR_BASE/t1.err"
  fi
  assert_eq "0" "$rc" "preflight-check exits 0"
  err="$(cat "$TMPDIR_BASE/t1.err")"
  assert_eq "" "$err" "preflight-check stderr empty on success"
  assert_json_expr "$out" "obj['tenancy_ocid'].startswith('ocid1.tenancy')" "preflight has tenancy_ocid"
  assert_json_expr "$out" "len(obj['regions']) >= 1" "preflight has regions"
  assert_json_expr "$out" "obj['compartments'][0]['name'] == 'root (tenancy)'" "preflight prepends root compartment"
}

run_test_gva_discover_cluster_get_failure() {
  echo "- gva-discover handles cluster get failure without crashing"
  local out rc
  set +e
  out="$(MOCK_OCI_CLUSTER_GET_FAIL=1 "$REPO_ROOT/scripts/gva-discover.sh" --cluster ocid1.cluster.oc1..abc 2>"$TMPDIR_BASE/t2.err")"
  rc=$?
  set -e
  assert_eq "0" "$rc" "gva-discover still exits 0 on cluster-get failure path"
  assert_json_expr "$out" "obj['cluster']['id'] == 'ocid1.cluster.oc1..abc'" "gva-discover preserves cluster id"
  assert_json_expr "$out" "obj['cluster']['region'] == 'us-ashburn-1'" "gva-discover preserves region"
}

run_test_oke_discover_cluster_get_failure() {
  echo "- oke-discover returns partial context on cluster get failure"
  local out rc
  set +e
  out="$(MOCK_OCI_CLUSTER_GET_FAIL=1 "$REPO_ROOT/scripts/oke-discover.sh" --cluster ocid1.cluster.oc1..abc 2>"$TMPDIR_BASE/t3.err")"
  rc=$?
  set -e
  assert_eq "0" "$rc" "oke-discover exits 0 with partial context"
  assert_json_expr "$out" "obj['cluster']['id'] == 'ocid1.cluster.oc1..abc'" "oke-discover preserves cluster id"
  assert_json_expr "$out" "obj['cluster']['name'] == 'ocid1.cluster.oc1..abc'" "oke-discover uses ref name on failure"
}

run_test_node_doctor_namespace() {
  echo "- node-doctor uses namespace consistently and no -it"
  local log_file out rc
  log_file="$TMPDIR_BASE/kubectl.log"
  : > "$log_file"
  set +e
  out="$(MOCK_KUBECTL_LOG="$log_file" "$REPO_ROOT/scripts/node-doctor-run.sh" --node n1 --image img --namespace kube-system --cleanup true 2>"$TMPDIR_BASE/t4.err")"
  rc=$?
  set -e
  assert_eq "0" "$rc" "node-doctor exits 0"
  assert_json_expr "$out" "obj['node_doctor_namespace'] == 'kube-system'" "node-doctor JSON namespace"
  local logs
  logs="$(cat "$log_file")"
  assert_contains "$logs" "-n kube-system debug node/n1" "kubectl debug uses requested namespace"
  assert_contains "$logs" "-n kube-system delete pod nd-123" "cleanup uses same namespace"
  if [[ "$logs" == *" -it "* ]]; then
    echo "FAIL: kubectl debug should not include -it" >&2
    exit 1
  fi
}

run_test_gva_discover_quoted_cluster_name() {
  echo "- gva-discover resolves cluster names containing single quotes"
  local out rc cluster_list_json
  cluster_list_json='{"data":[{"name":"prod'\''cluster","id":"ocid1.cluster.oc1..quoted","kubernetes-version":"v1.31.1"}]}'
  set +e
  out="$(MOCK_OCI_CLUSTER_LIST_JSON="$cluster_list_json" "$REPO_ROOT/scripts/gva-discover.sh" --cluster "prod'cluster" --compartment-id ocid1.compartment.oc1..a --region us-ashburn-1 2>"$TMPDIR_BASE/t5.err")"
  rc=$?
  set -e
  assert_eq "0" "$rc" "gva-discover handles quoted cluster name"
  assert_json_expr "$out" "obj['cluster']['id'] == 'ocid1.cluster.oc1..quoted'" "quoted cluster resolved correctly"
}

run_test_gva_cli_resolve_uses_env_override() {
  echo "- gva-cli-resolve honors OKE_GVA_CLI_HOME"
  local custom_home out
  custom_home="$TMPDIR_BASE/custom-gva-cli"
  mkdir -p "$custom_home/bin"
  touch "$custom_home/bin/activate"
  touch "$custom_home/oci_cli-3.65.2+preview.1.1355-py2.py3-none-any.whl"
  out="$(OKE_GVA_CLI_HOME="$custom_home" "$REPO_ROOT/scripts/gva-cli-resolve.sh" --json)"
  assert_json_expr "$out" "obj['home'].endswith('/custom-gva-cli')" "gva-cli-resolve prefers env override"
  assert_json_expr "$out" "obj['has_activate'] is True" "gva-cli-resolve sees activate path"
  assert_json_expr "$out" "obj['has_wheel'] is True" "gva-cli-resolve sees wheel path"
  if rg -q "codex_oke_plugin|/Users/.*/Desktop/projects" "$REPO_ROOT/scripts/gva-cli-resolve.sh"; then
    echo "FAIL: gva-cli-resolve should not include workstation-specific fallback paths" >&2
    exit 1
  fi
}

run_test_gva_menu_rejects_invalid_ipcount() {
  echo "- gva-menu rejects ipCount values outside 1..256"
  local out rc
  set +e
  out="$(printf 'cluster-a\nus-ashburn-1\n\nocid1.cluster.oc1..abc\nGrCh:US-ASHBURN-AD-1\nocid1.vcn.oc1..vcn\nocid1.subnet.oc1..primary\npool1\nVM.Standard.E5.Flex\n2\n16\n3\nocid1.image.oc1..img\n1\nfrontend\nocid1.subnet.oc1..secondary\n257\n256\n\nfrontend-vnic\n2\n\ny\n2\n' | "$REPO_ROOT/scripts/gva-menu.sh" 2>"$TMPDIR_BASE/t6.err")"
  rc=$?
  set -e
  assert_eq "0" "$rc" "gva-menu still completes after retrying ipCount"
  assert_contains "$out" "ipCount must be an integer between 1 and 256." "gva-menu warns on invalid ipCount"
  assert_contains "$out" "Using cluster Kubernetes version: v1.31.1" "gva-menu still consumes discovery output"
  assert_contains "$out" "--secondary-vnics" "gva-menu still prints command after correction"
}

run_test_gva_menu_cni_failure_json() {
  echo "- gva-menu emits JSON for unsupported CNI"
  local rc err
  set +e
  printf 'cluster-a\nus-ashburn-1\n\nocid1.cluster.oc1..abc\nGrCh:US-ASHBURN-AD-1\nocid1.vcn.oc1..vcn\nocid1.subnet.oc1..primary\npool1\nVM.Standard.E5.Flex\n2\n16\n3\nocid1.image.oc1..img\n2\n' | \
    "$REPO_ROOT/scripts/gva-menu.sh" >/dev/null 2>"$TMPDIR_BASE/t7.err"
  rc=$?
  set -e
  assert_eq "1" "$rc" "gva-menu exits expected error when CNI unsupported"
  err="$(cat "$TMPDIR_BASE/t7.err")"
  assert_json_expr "$err" "obj['error_code'] == 'GVA_REQUIRES_VCN_NATIVE_CNI'" "gva-menu emits structured JSON error"
}

run_test_multihome_python_errors_are_json() {
  echo "- multihome Python helpers emit JSON errors"
  local rc err mock_bin
  set +e
  python3 "$REPO_ROOT/skills/oke-multihome-deployer/scripts/generate-multihome-manifest.py" \
    --namespace default 1>/dev/null 2>"$TMPDIR_BASE/t8.err"
  rc=$?
  set -e
  assert_eq "2" "$rc" "manifest generator exits 2 for invalid arguments"
  err="$(cat "$TMPDIR_BASE/t8.err")"
  assert_json_expr "$err" "obj['error_code'] == 'INVALID_ARGUMENT'" "manifest generator emits JSON argparse error"

  mock_bin="$TMPDIR_BASE/no-kube"
  mkdir -p "$mock_bin"
  cat > "$mock_bin/kubectl" <<'MOCK_KUBECTL_FAIL'
#!/usr/bin/env bash
exit 1
MOCK_KUBECTL_FAIL
  chmod +x "$mock_bin/kubectl"
  set +e
  PATH="$mock_bin:$PATH" python3 "$REPO_ROOT/skills/oke-multihome-deployer/scripts/discover-oke-multihome.py" \
    --cluster-name missing 1>/dev/null 2>"$TMPDIR_BASE/t9.err"
  rc=$?
  set -e
  assert_eq "1" "$rc" "multihome discovery exits 1 for unresolved cluster"
  err="$(cat "$TMPDIR_BASE/t9.err")"
  assert_json_expr "$err" "obj['error_code'] == 'CLUSTER_OCID_NOT_RESOLVED'" "multihome discovery emits JSON expected error"

  mock_bin="$TMPDIR_BASE/no-oci"
  mkdir -p "$mock_bin"
  set +e
  PATH="$mock_bin" "$(command -v python3)" "$REPO_ROOT/skills/oke-multihome-deployer/scripts/discover-oke-multihome.py" \
    --cluster-id ocid1.cluster.oc1..abc 1>/dev/null 2>"$TMPDIR_BASE/t10.err"
  rc=$?
  set -e
  assert_eq "1" "$rc" "multihome discovery exits 1 when OCI CLI is missing"
  err="$(cat "$TMPDIR_BASE/t10.err")"
  assert_json_expr "$err" "obj['error_code'] == 'OCI_CLI_NOT_FOUND'" "multihome discovery emits explicit missing OCI CLI error"
}

run_test_troubleshooter_skill_has_local_fallback() {
  echo "- troubleshooter skill documents local fallback when delegation is unavailable"
  local body
  body="$(cat "$REPO_ROOT/skills/oke-troubleshooter/SKILL.md")"
  assert_contains "$body" "Default to **local execution in the parent skill**." "troubleshooter skill declares local execution default"
  assert_contains "$body" 'If delegation is available, you may hand the payload to `oke-evidence-collector`.' "troubleshooter skill treats evidence agent as optional"
  assert_contains "$body" "Otherwise rank hypotheses locally using this rubric:" "troubleshooter skill includes local ranking rubric"
}

run_test_troubleshooter_control_plane_recipe_uses_readyz() {
  echo "- troubleshooter control-plane recipe uses readyz/livez instead of kubectl get cs"
  local body
  body="$(cat "$REPO_ROOT/skills/oke-troubleshooter/evidence-collectors.md")"
  assert_contains "$body" "kubectl get --raw='/readyz?verbose'" "control-plane recipe uses readyz"
  assert_contains "$body" "kubectl get --raw='/livez?verbose'" "control-plane recipe uses livez"
  if [[ "$body" == *"kubectl get cs"* ]]; then
    echo "FAIL: control-plane recipe should not use deprecated kubectl get cs" >&2
    exit 1
  fi
}

run_test_multihome_manifest_generator() {
  echo "- multihome manifest generator emits NADs and pinned pods"
  local out
  out="$(python3 "$REPO_ROOT/skills/oke-multihome-deployer/scripts/generate-multihome-manifest.py" \
    --namespace gva-multihome-test \
    --default-interface enp1s0 \
    --secondary-interface enp2s0 \
    --pod gva-multihome-a=node-a \
    --pod gva-multihome-b=node-b)"
  assert_contains "$out" "kind: NetworkAttachmentDefinition" "manifest includes NADs"
  assert_contains "$out" "type\": \"oci-ipvlan\"" "default NAD uses oci-ipvlan"
  assert_contains "$out" "type\": \"ipvlan\"" "secondary NAD uses ipvlan"
  assert_contains "$out" "v1.multus-cni.io/default-network: kube-system/gva-default-network" "pod uses default Multus annotation"
  assert_contains "$out" "k8s.v1.cni.cncf.io/networks: gva-multihome-test/gva-secondary-network" "pod uses secondary Multus annotation"
  assert_contains "$out" "nodeName: \"node-a\"" "pod is pinned to node-a"
  assert_contains "$out" "image: \"docker.io/nicolaka/netshoot:v0.13\"" "image is fully qualified"
}

run_test_multihome_python_syntax() {
  echo "- multihome Python helpers compile"
  python3 -m py_compile \
    "$REPO_ROOT/skills/oke-multihome-deployer/scripts/discover-oke-multihome.py" \
    "$REPO_ROOT/skills/oke-multihome-deployer/scripts/generate-multihome-manifest.py"
}

run_test_golden_outputs() {
  echo "- golden outputs match Terraform, GVA, and Multus examples"
  local generated_manifest
  generated_manifest="$TMPDIR_BASE/gva-multihome-pods.yaml"

  assert_file_matches \
    "$REPO_ROOT/tests/golden/oke-cluster-main.tf" \
    "$REPO_ROOT/examples/outputs/oke-cluster-generator/main.tf" \
    "cluster generator Terraform example changed"

  assert_file_matches \
    "$REPO_ROOT/tests/golden/gva-node-pool-command.sh" \
    "$REPO_ROOT/examples/outputs/oke-gva-deployer/node-pool-command.sh" \
    "GVA command example changed"

  python3 "$REPO_ROOT/skills/oke-multihome-deployer/scripts/generate-multihome-manifest.py" \
    --namespace gva-multihome-test \
    --default-interface enp1s0 \
    --secondary-interface enp2s0 \
    --pod gva-multihome-a=node-a \
    --pod gva-multihome-b=node-b \
    > "$generated_manifest"

  assert_file_matches \
    "$REPO_ROOT/tests/golden/gva-multihome-pods.yaml" \
    "$generated_manifest" \
    "generated Multus manifest changed"

  assert_file_matches \
    "$REPO_ROOT/tests/golden/gva-multihome-pods.yaml" \
    "$REPO_ROOT/examples/outputs/oke-multihome-deployer/gva-multihome-pods.yaml" \
    "Multus manifest example changed"
}

run_test_skill_consistency_text() {
  echo "- skill trigger and terminology consistency checks"
  if rg -q "Oracle Kubernetes Engine" "$REPO_ROOT/skills"; then
    echo "FAIL: use OCI Kubernetes Engine terminology in public skill text" >&2
    exit 1
  fi

  local cluster_skill gva_skill multihome_skill troubleshooter_refs
  cluster_skill="$(cat "$REPO_ROOT/skills/oke-cluster-generator/SKILL.md")"
  gva_skill="$(cat "$REPO_ROOT/skills/oke-gva-deployer/SKILL.md")"
  multihome_skill="$(cat "$REPO_ROOT/skills/oke-multihome-deployer/SKILL.md")"
  troubleshooter_refs="$(cat "$REPO_ROOT/skills/oke-troubleshooter/evidence-collectors.md")"

  assert_contains "$cluster_skill" "FAST_PATH_MODE = true" "cluster generator parses fast-path token"
  assert_contains "$cluster_skill" "runtime without \`AskUserQuestion\`" "cluster generator documents Codex prompt fallback"
  assert_contains "$cluster_skill" "TODO(live validation): confirm this add-on option command" "cluster generator flags unverified add-on command"
  assert_contains "$gva_skill" "TODO/live validation" "GVA skill labels unproven image compatibility"
  assert_contains "$multihome_skill" "For broad incident RCA" "multihome trigger avoids broad troubleshooter overlap"
  assert_contains "$multihome_skill" "TODO(live validation): pin this manifest" "multihome manifest pinning is tracked as live-validation TODO"
  assert_contains "$troubleshooter_refs" "Capacity and Service Limits" "troubleshooter avoids broad quota-only framing"
}

run_test_oke_troubleshooter_helpers() {
  echo "- OKE troubleshooting helper scripts return JSON"
  local out

  out="$("$REPO_ROOT/scripts/oke-addon-health.sh")"
  assert_json_expr "$out" "obj['domain'] == 'OKE Add-ons Health'" "addon helper domain"
  assert_json_expr "$out" "obj['namespace'] == 'kube-system'" "addon helper namespace"

  out="$("$REPO_ROOT/scripts/oke-pod-network-check.sh" --namespace default --pod web-0)"
  assert_json_expr "$out" "obj['domain'] == 'Pod Networking / OCI CNI / IPAM'" "pod network helper domain"
  assert_json_expr "$out" "any('ipvlan' in item for item in obj['anomalies'])" "pod network helper surfaces ipvlan issue"

  out="$("$REPO_ROOT/scripts/oke-autoscaler-check.sh" --namespace default --deployment web --cluster-id ocid1.cluster.oc1..abc --compartment-id ocid1.compartment.oc1..a --region us-ashburn-1)"
  assert_json_expr "$out" "obj['domain'] == 'Cluster Autoscaler / Node Pool Scaling'" "autoscaler helper domain"
  assert_json_expr "$out" "any('NotTriggerScaleUp' in item or 'max node group size' in item for item in obj['anomalies'])" "autoscaler helper surfaces scale-up issue"

  out="$("$REPO_ROOT/scripts/oke-dns-check.sh" --namespace default --service web --pod web-0 --lookup web.default.svc.cluster.local)"
  assert_json_expr "$out" "obj['domain'] == 'DNS / Service Discovery'" "dns helper domain"
  assert_json_expr "$out" "any('timeout' in item.lower() for item in obj['anomalies'])" "dns helper surfaces timeout"
}

run_test_oke_deep_troubleshooter_helpers() {
  echo "- deep OKE troubleshooting helper scripts return JSON"
  local out

  out="$("$REPO_ROOT/scripts/oke-private-endpoint-check.sh" --cluster-id ocid1.cluster.oc1..abc --region us-ashburn-1 --compartment-id ocid1.compartment.oc1..a)"
  assert_json_expr "$out" "obj['domain'] == 'Private Cluster / API Endpoint Connectivity'" "private endpoint helper domain"
  assert_json_expr "$out" "any('readyz' in item.lower() or 'endpoint' in item.lower() for item in obj['raw_snippets'])" "private endpoint helper captures API signals"

  out="$("$REPO_ROOT/scripts/oke-ocir-image-pull-check.sh" --namespace default --pod web-0 --image iad.ocir.io/ns/team/web:bad --compartment-id ocid1.compartment.oc1..a --region us-ashburn-1)"
  assert_json_expr "$out" "obj['domain'] == 'OCIR / Image Pull'" "ocir helper domain"
  assert_json_expr "$out" "any('unauthorized' in item.lower() for item in obj['anomalies'])" "ocir helper surfaces unauthorized pull"

  out="$("$REPO_ROOT/scripts/oke-workload-identity-check.sh" --namespace default --serviceaccount workload-sa --pod web-0 --tenancy-id ocid1.tenancy.oc1..tenancy)"
  assert_json_expr "$out" "obj['domain'] == 'Workload Identity / OCI API From Pods'" "workload identity helper domain"
  assert_json_expr "$out" "any('notauthorized' in item.lower() or 'policy' in item.lower() for item in obj['anomalies'])" "workload identity helper surfaces auth issue"

  out="$("$REPO_ROOT/scripts/oke-ingress-check.sh" --namespace default --ingress web --region us-ashburn-1)"
  assert_json_expr "$out" "obj['domain'] == 'Ingress / OCI Native Ingress'" "ingress helper domain"
  assert_json_expr "$out" "any('certificate' in item.lower() or 'backend' in item.lower() for item in obj['anomalies'])" "ingress helper surfaces ingress issue"

  out="$("$REPO_ROOT/scripts/oke-incident-timeline.sh" --namespace default --pod web-0 --deployment web --service web --compartment-id ocid1.compartment.oc1..a --region us-ashburn-1)"
  assert_json_expr "$out" "obj['domain'] == 'Incident Timeline'" "timeline helper domain"
  assert_json_expr "$out" "len(obj['timeline']) >= 1" "timeline helper emits events"
}

run_test_oke_object_correlator_storage_providerid() {
  echo "- object correlator links storage and node placement via providerID"
  local out

  out="$("$REPO_ROOT/scripts/oke-object-correlator.sh" \
    --namespace default \
    --cluster-id ocid1.cluster.oc1..abc \
    --compartment-id ocid1.compartment.oc1..a \
    --region us-ashburn-1 \
    --pod storage-pod)"

  assert_json_expr "$out" "obj['fallback_used'] is False" "object correlator storage path has no fallback"
  assert_json_expr "$out" "any(e['from'] == 'k8s:pod:default/storage-pod' and e['to'] == 'k8s:pvc:default/data' and e['relation'] == 'mounts_claim' for e in obj['graph']['edges'])" "pod mounts PVC edge"
  assert_json_expr "$out" "any(e['from'] == 'k8s:pvc:default/data' and e['to'] == 'k8s:pv:pv-data' and e['relation'] == 'bound_to' for e in obj['graph']['edges'])" "PVC bound to PV edge"
  assert_json_expr "$out" "any(e['from'] == 'k8s:pv:pv-data' and e['to'] == 'oci:volume:ocid1.volume.oc1..vol' and e['relation'] == 'backs_onto' for e in obj['graph']['edges'])" "PV backs block volume edge"
  assert_json_expr "$out" "any(e['from'] == 'k8s:pod:default/storage-pod' and e['to'] == 'k8s:node:node-no-annotation' and e['relation'] == 'scheduled_on' for e in obj['graph']['edges'])" "pod scheduled on node edge"
  assert_json_expr "$out" "any(e['from'] == 'k8s:node:node-no-annotation' and e['to'] == 'oci:instance:ocid1.instance.oc1..inst' and e['relation'] == 'runs_on_instance' and e.get('evidence') == 'node.spec.providerID' for e in obj['graph']['edges'])" "node providerID maps to OCI instance edge"
  assert_json_expr "$out" "any(e['from'] == 'oci:volume:ocid1.volume.oc1..vol' and e['to'] == 'oci:instance:ocid1.instance.oc1..inst' and e['relation'] == 'attached_to_instance' for e in obj['graph']['edges'])" "volume attachment maps block volume to instance"
  assert_json_expr "$out" "sum(1 for e in obj['graph']['edges'] if e['from'] == 'oci:instance:ocid1.instance.oc1..inst' and e['relation'] == 'has_vnic') == 2" "object correlator maps all VNIC attachments"
  assert_json_expr "$out" "any(e['from'] == 'oci:vnic:ocid1.vnic.oc1..secondary' and e['to'] == 'oci:subnet:ocid1.subnet.oc1..secondary' and e['relation'] == 'attached_to_subnet' for e in obj['graph']['edges'])" "secondary VNIC maps to secondary subnet"
  assert_json_expr "$out" "any(e['from'] == 'oci:vnic:ocid1.vnic.oc1..secondary' and e['to'] == 'oci:nsg:ocid1.networksecuritygroup.oc1..secondary' and e['relation'] == 'uses_nsg' for e in obj['graph']['edges'])" "secondary VNIC maps to NSG"
  assert_json_expr "$out" "any(e['from'] == 'oci:subnet:ocid1.subnet.oc1..secondary' and e['to'] == 'oci:security-list:ocid1.securitylist.oc1..secondary' and e['relation'] == 'uses_security_list' for e in obj['graph']['edges'])" "secondary subnet maps to security list"
  assert_json_expr "$out" "any(e['from'] == 'oci:subnet:ocid1.subnet.oc1..secondary' and e['to'] == 'oci:route-table:ocid1.routetable.oc1..secondary' and e['relation'] == 'uses_route_table' for e in obj['graph']['edges'])" "secondary subnet maps to route table"
  assert_json_expr "$out" "any(e['from'] == 'oci:route-table:ocid1.routetable.oc1..secondary' and e['to'] == 'oci:network-entity:ocid1.localpeeringgateway.oc1..lpg' and e['relation'] == 'routes_to' for e in obj['graph']['edges'])" "route table maps to peering path"
  assert_json_expr "$out" "any(n['id'] == 'oci:instance:ocid1.instance.oc1..inst' and n['type'] == 'oci.compute.instance' for n in obj['graph']['oci'])" "OCI compute instance node exists"
}

main() {
  TMPDIR_BASE="$(mktemp -d)"
  if [[ "${KEEP_TMPDIR:-0}" == "1" ]]; then
    echo "KEEP_TMPDIR at: $TMPDIR_BASE"
  else
    trap 'rm -rf "$TMPDIR_BASE"' EXIT
  fi

  make_mocks "$TMPDIR_BASE/mockbin"
  with_temp_home "$TMPDIR_BASE/home"

  export PATH="$TMPDIR_BASE/mockbin:$PATH"
  export HOME="$TMPDIR_BASE/home"

  run_test_preflight
  run_test_gva_discover_cluster_get_failure
  run_test_oke_discover_cluster_get_failure
  run_test_node_doctor_namespace
  run_test_gva_discover_quoted_cluster_name
  run_test_gva_cli_resolve_uses_env_override
  run_test_gva_menu_rejects_invalid_ipcount
  run_test_gva_menu_cni_failure_json
  run_test_multihome_python_errors_are_json
  run_test_troubleshooter_skill_has_local_fallback
  run_test_troubleshooter_control_plane_recipe_uses_readyz
  run_test_multihome_manifest_generator
  run_test_multihome_python_syntax
  run_test_golden_outputs
  run_test_skill_consistency_text
  run_test_oke_troubleshooter_helpers
  run_test_oke_deep_troubleshooter_helpers
  run_test_oke_object_correlator_storage_providerid

  echo "All smoke tests passed."
}

main "$@"

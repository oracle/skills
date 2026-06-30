# `/oke-troubleshooter` — Evidence Collection Recipes

For each diagnostic domain, gather the following evidence. Prefer JSON output (`-o json`) when available. Summaries returned to the parent skill should follow the structure:

```json
{
  "domain": "<domain>",
  "findings": ["Short bullet summary"],
  "raw_snippets": ["Trimmed command output"],
  "anomalies": ["Detected warnings/errors"],
  "fallback_used": false
}
```

When a command fails, set `fallback_used` to `true`, capture stderr (sanitized), and continue with other evidence.

## Contents
- Pod Scheduling
- Pod Runtime
- Node Health
- OKE Add-ons Health
- Pod Networking / OCI CNI / IPAM
- DPDK / SR-IOV / Mellanox mlx5
- Cluster Autoscaler / Node Pool Scaling
- Networking / CNI / Load Balancer
- DNS / Service Discovery
- Ingress / OCI Native Ingress
- Private Cluster / API Endpoint Connectivity
- OCIR / Image Pull
- Workload Identity / OCI API From Pods
- Incident Timeline
- Application Performance
- Dependency Path
- Storage / CSI
- Control Plane
- IAM / RBAC
- OCI Infrastructure / Capacity and Service Limits

## Pod Scheduling
- **Kubernetes**
  - `kubectl get pods -n <ns> <selector> -o wide`
  - `kubectl describe pod <pod> -n <ns>`
  - `kubectl get events -n <ns> --field-selector involvedObject.name=<pod> --sort-by=.lastTimestamp`
- **OCI**
  - `oci ce node-pool list --compartment-id <compartment>` (ensure node pool capacity)
  - `oci limits resource-availability get --compartment-id <compartment> --service-name compute --limit-name <shape-limit-name> --availability-domain <ad>`
  - TODO(live validation): resolve the exact compute `limit-name` for the target shape from `oci limits value list` before treating remaining capacity as conclusive.
- **Normalization tips**: Highlight scheduling failure reasons (`0/3 nodes available`, taints), summarize resource requests vs. node capacity, include current node pool size.

## Pod Runtime
- **Kubernetes**
  - `kubectl describe pod <pod> -n <ns>`
  - `kubectl logs <pod> -n <ns> --previous` (when restart count > 0)
  - `kubectl get events -n <ns> --field-selector type=Warning`
- **OCI**
  - `oci logging search --time-start <iso> --time-end <iso> --search-query "search <log-group> where podName = '<pod>'"`
- **Normalization tips**: Capture container state (`Waiting`, `CrashLoopBackOff`), include last log lines causing failure, flag missing secrets or configmaps.

## Node Health
- **Kubernetes**
  - `kubectl get nodes -o wide`
  - `kubectl describe node <node>`
  - `kubectl top node <node>` (requires metrics server)
- **OCI**
  - `oci ce node-pool get --node-pool-id <ocid>`
  - `oci compute instance get --instance-id <ocid>`
  - `oci health-check probe-result get --probe-configuration-id <ocid>` (if using health checks)
- **Normalization tips**: Surface conditions not `True`, kubelet versions, OCI lifecycle state, recent maintenance events.
- **Advanced: Node Doctor (OKE node deep diagnostics)**
  - Use when Node Health symptoms indicate node readiness/runtime faults, or when user explicitly requests deep node checks.
  - Potentially disruptive/privileged; require explicit confirmation per node before execution.
  - Start with one affected node first, then ask whether to continue on more nodes.
  - Use default debug image `docker.io/library/ubuntu` each run (allow user override) and execute via helper script:
    - `bash ../../scripts/node-doctor-run.sh --node <node-name> --image docker.io/library/ubuntu [--namespace <ns>]`
  - Under the hood this runs:
    1) `kubectl -n <ns> debug node/<node-name> --image=<image-name>`
    2) `chroot /host`
    3) `sudo /usr/local/bin/node-doctor.sh --check`
  - If execution is not approved, print commands only and continue other Node Health evidence.
  - Failure handling:
    - capture and continue when `kubectl debug` is blocked, image pull fails, `chroot` fails, `sudo` missing, or `/usr/local/bin/node-doctor.sh` not found.
  - Script output is normalized JSON, including:
    - `node_doctor_attempted`, `node_doctor_executed`, `node_doctor_node`, `node_doctor_image`
    - `node_doctor_result` (`pass` | `fail` | `unknown`) and `node_doctor_command_rc`
    - `node_doctor_findings`, `node_doctor_raw_snippet`, `node_doctor_fallback_reason`
    - `node_doctor_counts` (`pass`/`fail`/`warn`/`skip`)

## OKE Add-ons Health
- **Helper script**
  - `bash ../../scripts/oke-addon-health.sh --namespace kube-system`
- **Kubernetes**
  - `kubectl -n kube-system get pods -o wide`
  - `kubectl -n kube-system get deploy -o wide`
  - `kubectl -n kube-system get ds -o wide`
  - `kubectl -n kube-system get events --field-selector type=Warning --sort-by=.lastTimestamp`
  - `kubectl -n kube-system logs deployment/coredns --tail=200` when DNS symptoms are present
- **Normalization tips**: Flag kube-system pods that are not Running/Ready, add-on deployments with unavailable replicas, daemonsets missing scheduled pods, and warning events after cluster upgrades or node pool changes.

## Pod Networking / OCI CNI / IPAM
- **Helper script**
  - `bash ../../scripts/oke-pod-network-check.sh --namespace <ns> [--pod <pod>] [--selector <label-selector>]`
- **Kubernetes**
  - `kubectl -n <ns> describe pod <pod>`
  - `kubectl -n <ns> get pod <pod> -o jsonpath='{.metadata.annotations.k8s\.v1\.cni\.cncf\.io/network-status}'`
  - `kubectl -n <ns> get events --field-selector type=Warning --sort-by=.lastTimestamp`
  - `kubectl -n kube-system get pods -l app=oci-cni -o wide`
  - `kubectl -n kube-system get pods -l name=multus -o wide`
  - `kubectl get network-attachment-definitions -A`
- **Node-side checks**
  - Use a privileged diagnostic pod or `kubectl debug node/<node>` only after confirmation.
  - Inspect `/opt/cni/bin` for required binaries such as `oci-ipam`, `oci-ipvlan`, `oci-ptp`, and `ipvlan`.
  - Inspect `/dev/shm/oci-cni/free` and `/dev/shm/oci-cni/used` when OCI IPAM allocation state is in question.
- **Normalization tips**: Separate OCI CNI primary-pod-network failures from Multus secondary-network failures. Flag `FailedCreatePodSandBox`, missing CNI binaries, subnet/IP exhaustion, stale or missing `network-status`, and NAD namespace/name mismatches.

## DPDK / SR-IOV / Mellanox mlx5
- **When to use**
  - User mentions DPDK, SR-IOV, Mellanox/NVIDIA, `mlx5`, `vfio-pci`, `/dev/infiniband`, `ibv_devices`, `dpdk-devbind.py`, hugepages, or a pod that requests device-plugin resources but lacks expected Multus interfaces.
  - Also load `../oke-multihome-deployer/references/oke-dpdk-mlx5-notes.md`.
- **Kubernetes**
  - `kubectl -n <ns> describe pod <pod>`
  - `kubectl -n <ns> get pod <pod> -o jsonpath='{.metadata.annotations.k8s\.v1\.cni\.cncf\.io/network-status}'`
  - `kubectl get network-attachment-definitions -A | egrep '<ns>|noiommu|sriov|mlx|dpdk'`
  - `kubectl -n <ns> get network-attachment-definition <nad> -o yaml`
  - `kubectl -n <ns> get events --field-selector involvedObject.name=<pod> --sort-by=.lastTimestamp`
- **Pod exec checks**
  - `kubectl -n <ns> exec <pod> -- ip -br addr`
  - `kubectl -n <ns> exec <pod> -- ls -l /dev/infiniband`
  - `kubectl -n <ns> exec <pod> -- ibv_devices`
  - `kubectl -n <ns> exec <pod> -- lspci -nnk`
  - `kubectl -n <ns> exec <pod> -- dpdk-devbind.py -s`
  - `kubectl -n <ns> exec <pod> -- grep -i Huge /proc/meminfo`
  - `kubectl -n <ns> exec <pod> -- mount | grep -i huge`
  - `kubectl -n <ns> logs <pod> | egrep -i 'EAL|mlx5|ibv|verbs|huge|vfio|pci|rte'`
- **Node-side checks**
  - Use a privileged diagnostic pod, `kubectl debug node/<node>`, or SSH only after confirmation.
  - `ip -br addr`
  - `lspci -nnk | egrep -A3 'Mellanox|NVIDIA|Ethernet'`
  - `ls -l /dev/vfio`
  - `find /sys/kernel/iommu_groups -maxdepth 1 -mindepth 1 -type d | wc -l`
  - `dpdk-devbind.py -s`
- **Normalization tips**: Keep resource allocation, Multus attachment, driver binding, RDMA/verbs exposure, hugepage visibility, and application PCI/interface mapping as separate facts. If `network-status` only shows `eth0`, do not claim SR-IOV/Multus attachment is working just because the pod is `Running`. For Mellanox `mlx5` PMD, do not assume `vfio-pci` is correct; `mlx5_core` plus RDMA/verbs may be the intended model.

## Cluster Autoscaler / Node Pool Scaling
- **Helper script**
  - `bash ../../scripts/oke-autoscaler-check.sh --namespace <ns> [--deployment <deployment>] --cluster-id <cluster_ocid> --compartment-id <compartment_ocid> --region <region>`
- **Kubernetes**
  - `kubectl -n <ns> get pods --field-selector=status.phase=Pending -o wide`
  - `kubectl -n <ns> get events --field-selector reason=FailedScheduling --sort-by=.lastTimestamp`
  - `kubectl -n kube-system get deploy cluster-autoscaler -o wide`
  - `kubectl -n kube-system logs deployment/cluster-autoscaler --tail=200`
  - `kubectl -n <ns> describe deployment <deployment>`
- **OCI**
  - `oci ce node-pool list --compartment-id <compartment> --cluster-id <cluster_ocid> --region <region> --all --output json`
  - `oci ce node-pool get --node-pool-id <nodepool_ocid> --region <region>`
  - `oci limits resource-availability list --compartment-id <compartment> --service-name compute --region <region>`
- **Normalization tips**: Distinguish Kubernetes scheduling constraints from autoscaler refusal. Flag max node pool size reached, no matching node group, shape capacity/limit errors, subnet IP exhaustion, taints/tolerations mismatch, and missing autoscaler deployment.

## Networking / CNI / Load Balancer
- **Kubernetes**
  - `kubectl get svc -n <ns> <service> -o yaml`
  - `kubectl get svc -n <ns> <service> -o jsonpath='{.status.loadBalancer.ingress[0].ip}'` (capture LB public IP when type is `LoadBalancer`)
  - `kubectl get ingress -n <ns> <ingress> -o yaml`
  - `kubectl describe networkpolicy -n <ns>`
  - `kubectl get pods -n kube-system -l k8s-app=cilium-agent` (or corresponding CNI)
- **OCI**
  - `oci lb load-balancer list --compartment-id <compartment> --region <region> --all --output json | jq -r '.data[] | select((."ip-addresses" // []) | any(."ip-address"=="<lb-ip>")) | .id'` (resolve LB OCID from service external IP)
  - `oci lb load-balancer get --load-balancer-id <ocid> --region <region>`
  - `oci lb load-balancer get --load-balancer-id <ocid> --region <region> --query 'data."access-log"' --output json` (check whether LB access logging is enabled)
  - `oci logging log-group list --compartment-id <compartment> --region <region> --all --output json` (list candidate log groups)
  - `oci logging log list --log-group-id <log-group-ocid> --all --query "data[?configuration.source.resource=='<lb-ocid>' && configuration.source.service=='loadbalancer'].[\"display-name\",id,\"is-enabled\",configuration]" --output json` (second check for logging objects tied to LB OCID)
  - `oci logging search search-logs --region <region> --search-query "search \"<log_group_ocid>/<log_ocid>\" | where data.loadBalancerId = '<lb_ocid>' | sort by datetime desc" --time-start <iso-start> --time-end <iso-end>` (when LB logs are enabled)
  - `oci nlb network-load-balancer list --compartment-id <compartment> --region <region> --all --output json | jq -r '.data[] | select((."ip-addresses" // []) | any(."ip-address"=="<lb-ip>")) | .id'` (fallback if classic LB lookup is empty)
  - `oci network nsg list --compartment-id <compartment>`
  - `oci network subnet get --subnet-id <subnet_ocid>`
  - `oci network security-list get --security-list-id <security_list_ocid>`
  - `oci network route-table get --rt-id <route_table_ocid>`
- **Subagent preference**
  - Prefer delegating LB-specific discovery/log retrieval to `oke-lb-log-collector`:
    - resolves LB/NLB OCID from Service IP
    - checks access-log status
    - optionally enables logging (with explicit user approval path)
    - extracts log issue signals for ranking
- **Normalization tips**: Note load balancer lifecycle (`PROVISIONING`, `FAILED`), security list/NSG rules, route table targets, gateway or peering route targets, CNI pod status, and service annotations impacting provisioning. Explicitly record LB logging status as `enabled`, `disabled`, or `unknown`, and include `logging_status_source` showing which check(s) succeeded.
- **TODO(live validation)**: Confirm the exact OCI CLI fields and Logging Search syntax for LB access-log discovery in the target OCI CLI version before treating log absence as conclusive.
- **If LB logs are disabled or unknown**: recommend enabling access logs before closing the incident so future RCA has request-level evidence.
  - Offer operator action:
    - `No (report only)`
    - `Yes (print enable command)`
    - `Yes (execute enable command now)`
  - Enable command template:
    ```bash
    oci lb load-balancer update \
      --load-balancer-id <lb_ocid> \
      --region <region> \
      --access-log '{"isEnabled":true,"logGroupId":"<log_group_id>","logId":"<log_id>"}'
    ```
  - Post-check:
    ```bash
    oci lb load-balancer get \
      --load-balancer-id <lb_ocid> \
      --region <region> \
      --query 'data."access-log"' \
      --output json
    ```
- **If LB logs are enabled**: summarize concrete issue signals from log lines:
  - 5xx rate and top failing paths/backends
  - timeout/reset/error signatures
  - highest observed latency fields in the selected window

## DNS / Service Discovery
- **Helper script**
  - `bash ../../scripts/oke-dns-check.sh --namespace <ns> [--service <svc>] [--pod <pod>] [--lookup <dns-name>]`
- **Kubernetes**
  - `kubectl -n kube-system get pods -l k8s-app=kube-dns -o wide`
  - `kubectl -n kube-system get deploy coredns -o wide`
  - `kubectl -n kube-system get configmap coredns -o yaml`
  - `kubectl -n kube-system logs deployment/coredns --tail=200`
  - `kubectl -n <ns> get svc <service> -o yaml`
  - `kubectl -n <ns> get endpoints <service> -o yaml`
  - `kubectl -n <ns> get endpointslices -l kubernetes.io/service-name=<service> -o yaml`
  - `kubectl -n <ns> exec <pod> -- nslookup <dns-name>`
- **Normalization tips**: Separate DNS server health from service object problems. Flag CoreDNS unavailable, ConfigMap rewrite/stub-domain issues, Service without endpoints, EndpointSlice readiness issues, `NXDOMAIN`, `SERVFAIL`, timeout, and pod-local resolver failures.

## Ingress / OCI Native Ingress
- **Helper script**
  - `bash ../../scripts/oke-ingress-check.sh --namespace <ns> --ingress <ingress> [--region <region>]`
- **Kubernetes**
  - `kubectl get ingressclass -o yaml`
  - `kubectl -n <ns> get ingress <ingress> -o yaml`
  - `kubectl -n <ns> describe ingress <ingress>`
  - `kubectl -n kube-system get pods -l app.kubernetes.io/name=oci-native-ingress-controller -o wide`
  - `kubectl -n kube-system logs -l app.kubernetes.io/name=oci-native-ingress-controller --tail=200`
  - `kubectl -n <ns> get secret <tls-secret> -o yaml`
- **OCI**
  - `oci lb load-balancer get --load-balancer-id <lb_ocid> --region <region>`
  - `oci lb listener list --load-balancer-id <lb_ocid> --region <region>`
  - `oci lb backend-set-health get --load-balancer-id <lb_ocid> --backend-set-name <backend_set> --region <region>`
- **Normalization tips**: Flag missing ingress class, controller reconciliation errors, TLS secret/certificate mismatch, listener/backend-set mismatch, backend health failures, and annotation drift.

## Private Cluster / API Endpoint Connectivity
- **Helper script**
  - `bash ../../scripts/oke-private-endpoint-check.sh --cluster-id <cluster_ocid> --region <region> [--compartment-id <compartment>]`
- **Kubernetes / workstation**
  - `kubectl config current-context`
  - `kubectl cluster-info`
  - `kubectl get --raw=/readyz?verbose`
  - `kubectl version`
- **OCI**
  - `oci ce cluster get --cluster-id <cluster_ocid> --region <region>`
  - `oci network subnet get --subnet-id <endpoint_subnet_ocid> --region <region>`
  - `oci network nsg list --compartment-id <compartment> --region <region>`
  - `oci network security-list get --security-list-id <security_list_ocid> --region <region>`
  - `oci network route-table get --rt-id <route_table_ocid> --region <region>`
- **Normalization tips**: Separate kubeconfig exec/auth failures from network reachability. Flag expired OCI security tokens, private endpoint DNS/routing problems, NSG/security-list blocks, missing gateway or peering routes, and public/private endpoint expectation mismatch.

## OCIR / Image Pull
- **Helper script**
  - `bash ../../scripts/oke-ocir-image-pull-check.sh --namespace <ns> --pod <pod> [--image <image>] [--compartment-id <compartment>] [--region <image_region>]`
- **Kubernetes**
  - `kubectl -n <ns> describe pod <pod>`
  - `kubectl -n <ns> get secret <image_pull_secret> -o yaml`
  - `kubectl -n <ns> get serviceaccount <service_account> -o yaml`
  - `kubectl -n <ns> get events --field-selector involvedObject.name=<pod> --sort-by=.lastTimestamp`
- **OCI**
  - `oci artifacts container repository list --compartment-id <compartment> --region <image_region>`
  - `oci artifacts container image list --compartment-id <compartment> --repository-name <repo> --region <image_region>`
- **Normalization tips**: Flag image region mismatch, missing namespace-local pull secret, expired auth token, wrong tenancy namespace, repository not found, and node egress/DNS failures to OCIR.

## Workload Identity / OCI API From Pods
- **Helper script**
  - `bash ../../scripts/oke-workload-identity-check.sh --namespace <ns> --serviceaccount <service_account> [--pod <pod>] [--tenancy-id <tenancy_ocid>]`
- **Kubernetes**
  - `kubectl -n <ns> get serviceaccount <service_account> -o yaml`
  - `kubectl -n <ns> describe pod <pod>`
  - `kubectl -n <ns> logs <pod> --tail=200 | egrep -i "notauthorized|forbidden|401|403|principal|workload|token|oci"`
- **OCI**
  - `oci iam policy list --compartment-id <tenancy_ocid> --all`
- **Normalization tips**: Flag missing service account annotations, workload identity policy condition gaps, token projection failures, and pod code using the wrong OCI auth provider. Do not treat dynamic groups as the primary authorization path for OKE Workload Identity.

## Incident Timeline
- **Helper script**
  - `bash ../../scripts/oke-incident-timeline.sh --namespace <ns> [--pod <pod>] [--deployment <deployment>] [--service <service>] [--compartment-id <compartment>] [--region <region>]`
- **Purpose**
  - Merge event timing from Kubernetes objects and OCI alarms so the final report can explain what changed first.
- **Kubernetes**
  - `kubectl -n <ns> get events --sort-by=.lastTimestamp`
  - `kubectl -n <ns> describe pod <pod>`
  - `kubectl -n <ns> rollout history deployment/<deployment>`
  - `kubectl -n <ns> describe deployment <deployment>`
  - `kubectl -n <ns> describe service <service>`
- **OCI**
  - `oci monitoring alarm-status list-alarms-status --compartment-id <compartment> --status FIRING --region <region> --all`
- **Normalization tips**: Prefer chronology over volume. Keep warning/failure events, rollout changes, object readiness changes, and firing alarms. Use the timeline to avoid blaming symptoms that occurred after the first failing signal.

## Application Performance
- **Kubernetes**
  - `kubectl get deployment <deployment> -n <ns> -o yaml`
  - `kubectl describe deployment <deployment> -n <ns>`
  - `kubectl rollout history deployment/<deployment> -n <ns>`
  - `kubectl top pods -n <ns> -l app=<label>` (adjust selector to match deployment)
  - `kubectl get hpa -n <ns> --selector app=<label>` (if autoscaling enabled)
  - `kubectl logs -n <ns> deployment/<deployment> --tail=200` (if structured logging enabled)
- **OCI**
  - `oci monitoring metric-data summarize-metrics-data --namespace oci_computeagent --query-text "CpuUtilization[1m]{resourceId = '<instance-ocid>'}.mean()" --resolution 1m --start-time <iso-start> --end-time <iso-end>`
  - `oci monitoring metric-data summarize-metrics-data --namespace oci_lb --query-text "BackendLatency[1m]{resourceId = \"<lb-ocid>\"}.percentile(0.99)" --resolution 1m --start-time <iso-start> --end-time <iso-end>`
  - `oci monitoring alarm-status list-alarms-status --compartment-id <compartment> --status FIRING --all` (identify triggered performance alarms)
- **Normalization tips**: Compare current replica count vs. desired, highlight recent rollouts, surface CPU/memory saturation, p95/p99 latency spikes, and note absent autoscaling policies.

## Dependency Path
- **Purpose**
  - Attribute latency to the correct hop when a deployment depends on one or more downstream services.
  - Distinguish downstream bottleneck from retry amplification or in-cluster network issues.
- **Kubernetes**
  - `kubectl get svc -n <ns> <service> -o yaml` (per downstream service)
  - `kubectl get endpoints -n <ns> <service> -o yaml` (or EndpointSlice equivalent)
  - `kubectl describe svc -n <ns> <service>`
  - `kubectl logs -n <ns> deployment/<deployment> --tail=300 | egrep -i "timeout|deadline|connection reset|upstream|retry|503|504"`
- **OCI**
  - `oci monitoring metric-data summarize-metrics-data --namespace oci_lb --query-text "BackendLatency[1m]{resourceId = \"<lb-ocid>\"}.percentile(0.99)" --resolution 1m --start-time <iso-start> --end-time <iso-end>`
  - `oci monitoring metric-data summarize-metrics-data --namespace oci_computeagent --query-text "CpuUtilization[1m]{resourceId = '<instance-ocid>'}.mean()" --resolution 1m --start-time <iso-start> --end-time <iso-end>`
  - `oci monitoring alarm-status list-alarms-status --compartment-id <compartment> --status FIRING --all`
- **Normalization tips**:
  - Emit per-hop records with fields: `hop_id`, `from`, `to`, `direction`, `latency_p95_ms`, `latency_p99_ms`, `error_rate`, `timeout_count`, `retry_count`.
  - Compare `observed_p99_ms` against `latency_budget_ms` when available and compute `delta_ms`.
  - Mark evidence gaps clearly when only client-side or only server-side telemetry exists for a hop.
  - Prioritize the highest p99 over-budget hop in findings.

## Storage / CSI
- **Kubernetes**
  - `kubectl get pvc -n <ns> <claim> -o yaml`
  - `kubectl describe pvc <claim> -n <ns>`
  - `kubectl logs -n kube-system -l app=oci-csi-controller --tail=200`
- **OCI**
  - `oci bv volume get --volume-id <ocid>`
  - `oci fs file-system get --file-system-id <ocid>` (FSS)
  - `oci limits resource-availability get --compartment-id <compartment> --service-name block-storage --limit-name <block-storage-limit-name>`
  - TODO(live validation): resolve the exact block-storage `limit-name` for the tenancy before treating limit data as conclusive.
- **Normalization tips**: Extract CSI error codes, quota/limit responses, volume attachment status, and AD placement mismatches.

## Control Plane
- **Kubernetes**
  - `kubectl cluster-info`
  - `kubectl get --raw='/readyz?verbose'`
  - `kubectl get --raw='/livez?verbose'`
- **OCI**
  - `oci ce cluster get --cluster-id <ocid>`
  - `oci ce cluster-options get --cluster-option-id <cluster_ocid> [--compartment-id <compartment>]`
  - `oci logging search` targeting OKE control plane log groups
  - TODO(live validation): confirm the target tenancy exposes useful cluster-specific options through `cluster-options get`; otherwise use `--cluster-option-id all` only as capability context.
- **Normalization tips**: Flag readiness or liveness checks returning non-`ok`, endpoint visibility changes, upgrade operations in progress, and capture RBAC/auth errors separately when the raw health endpoints are inaccessible.

## IAM / RBAC
- **Kubernetes**
  - `kubectl auth can-i <verb> <resource> --as <subject> -n <ns>`
  - `kubectl get clusterrolebinding <name> -o yaml`
  - `kubectl describe serviceaccount <name> -n <ns>`
- **OCI**
  - `oci iam policy list --compartment-id <tenancy> --query "data[?contains(statements, 'allow service oke')]" --all`
  - `oci iam dynamic-group list --compartment-id <tenancy>` only when investigating instance-principal or legacy dynamic-group based auth, not OKE Workload Identity.
- **Normalization tips**: Summarize denied verbs, missing role bindings, IAM policy gaps affecting OCI API access, and distinguish Workload Identity policy conditions from dynamic-group based auth.

## OCI Infrastructure / Capacity and Service Limits
- **OCI**
  - `oci limits resource-availability list --compartment-id <compartment> --service-name <service>`
  - TODO(live validation): add OCI quota commands only after confirming the exact CLI resource path and required quota OCID/source from the user's tenancy.
  - `oci monitoring alarm-status list-alarms-status --compartment-id <compartment> --status FIRING --all`
- **Normalization tips**: Present remaining capacity/service-limit signals, active alarms, recent throttling metrics, and explicitly label missing quota data as an evidence gap.

---

When evidence volume is large, trim to the most recent entries and provide links or commands the operator can rerun locally.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengintroducingclusteraddons.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengobservingworkernodeaddonhealth.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengconfiguringclusteraddons.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Concepts/contengpodnetworking.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contenggrantingworkloadaccesstoresources.htm
- https://docs.oracle.com/en-us/iaas/Content/Balance/home.htm
- https://docs.oracle.com/en-us/iaas/Content/Logging/home.htm
- https://docs.oracle.com/en-us/iaas/Content/Registry/home.htm
- https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/
- https://kubernetes.io/docs/tasks/debug/debug-application/
- https://kubernetes.io/docs/concepts/services-networking/service/
- https://kubernetes.io/docs/concepts/storage/persistent-volumes/

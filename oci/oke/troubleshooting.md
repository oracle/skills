# OKE Troubleshooting

## Overview

Use this skill to troubleshoot OCI Kubernetes Engine (OKE) workload and cluster symptoms. Start with read-only evidence collection, map Kubernetes objects to OCI resources where possible, then rank likely causes before recommending fixes.

Use this for symptoms such as Pending pods, unhealthy add-ons, CNI failures, DNS issues, LoadBalancer or Ingress problems, OCIR image pulls, Workload Identity errors, private endpoint access failures, storage issues, and node-pool scaling failures.

For full operational behavior, load `oci/oke/skills/oke-troubleshooter/SKILL.md` and its supporting files before collecting evidence. That skill preserves the OKE troubleshooting workflow, including symptom triage, evidence collectors, Kubernetes-to-OCI object correlation, optional helper agents, and final report structure.

Supporting tools and references:

- `oci/oke/scripts/oke-discover.sh`
- `oci/oke/scripts/oke-object-correlator.sh`
- `oci/oke/scripts/oke-addon-health.sh`
- `oci/oke/scripts/oke-pod-network-check.sh`
- `oci/oke/scripts/oke-autoscaler-check.sh`
- `oci/oke/scripts/oke-dns-check.sh`
- `oci/oke/scripts/oke-ingress-check.sh`
- `oci/oke/scripts/oke-private-endpoint-check.sh`
- `oci/oke/scripts/oke-ocir-image-pull-check.sh`
- `oci/oke/scripts/oke-workload-identity-check.sh`
- `oci/oke/scripts/oke-incident-timeline.sh`
- `oci/oke/scripts/node-doctor-run.sh`
- `oci/oke/skills/oke-troubleshooter/evidence-collectors.md`
- `oci/oke/skills/oke-troubleshooter/symptom-triage.md`

## Tool Use

Use the included tools to collect evidence instead of relying only on ad hoc commands:

| Situation | Tool | When to run |
|-----------|------|-------------|
| Start of troubleshooting | `oci/oke/scripts/oke-discover.sh` | Run after the user identifies the target cluster and region. Use it to resolve cluster OCID, compartment, Kubernetes version, and deployment hints. |
| Object relationship mapping | `oci/oke/scripts/oke-object-correlator.sh` | Run after namespace and at least one target object are known. Use it to map pods, nodes, Services, Ingresses, PVCs, and OCI resources. |
| Add-on symptoms | `oci/oke/scripts/oke-addon-health.sh` | Run for unhealthy kube-system add-ons such as CoreDNS, CNI, CSI, metrics, or controllers. |
| Pod networking, CNI, Multus, sandbox errors | `oci/oke/scripts/oke-pod-network-check.sh` | Run for `FailedCreatePodSandBox`, missing `network-status`, OCI CNI/IPAM, Multus, or pod interface symptoms. |
| Pending pods or autoscaler failures | `oci/oke/scripts/oke-autoscaler-check.sh` | Run when pods are Pending, Cluster Autoscaler is not scaling, or node-pool capacity is suspect. |
| DNS or service discovery failures | `oci/oke/scripts/oke-dns-check.sh` | Run for DNS timeout, `NXDOMAIN`, `SERVFAIL`, or service resolution issues. |
| Ingress failures | `oci/oke/scripts/oke-ingress-check.sh` | Run for OCI Native Ingress controller, route, listener, certificate, or backend health issues. |
| Private API endpoint failures | `oci/oke/scripts/oke-private-endpoint-check.sh` | Run for private cluster API connectivity, kubeconfig, endpoint, or auth path symptoms. |
| OCIR image pull failures | `oci/oke/scripts/oke-ocir-image-pull-check.sh` | Run for `ImagePullBackOff`, `ErrImagePull`, unauthorized pulls, or repository path issues. |
| Workload Identity failures | `oci/oke/scripts/oke-workload-identity-check.sh` | Run when pods cannot call OCI APIs using OKE Workload Identity. |
| Timeline reconstruction | `oci/oke/scripts/oke-incident-timeline.sh` | Run after target objects are known to merge Kubernetes events, rollout history, object descriptions, and OCI alarms. |
| Node-level diagnostics | `oci/oke/scripts/node-doctor-run.sh` | Run only after explicit approval because it uses `kubectl debug` to create a temporary debug pod and may delete it during cleanup. |

Example discovery:

```bash
bash oci/oke/scripts/oke-discover.sh --cluster <cluster-name-or-ocid> --region <region>
```

Example object correlation:

```bash
bash oci/oke/scripts/oke-object-correlator.sh \
  --namespace <namespace> \
  --cluster-id <cluster_ocid> \
  --compartment-id <compartment_ocid> \
  --region <region> \
  --pod <pod-name>
```

Example symptom-specific check:

```bash
bash oci/oke/scripts/oke-pod-network-check.sh --namespace <namespace> --pod <pod-name>
```

Treat these tool outputs as evidence. Summarize findings, anomalies, raw snippets, and fallback flags in the diagnosis report.

Ask for explicit approval before running `node-doctor-run.sh`.

## Safety Rules

- Run read-only commands first.
- Ask before changing OCI or Kubernetes resources.
- Do not restart, scale, drain, delete, patch, apply, or update resources without explicit user approval.
- Keep the investigation scoped to the user-provided cluster, namespace, and workload.
- If `kubectl` or OCI CLI access is unavailable, continue with partial evidence and clearly mark the gap.

## Intake

Collect or infer:

| Field | Examples |
|-------|----------|
| Symptom | `pods stuck Pending`, `service has no IP`, `ImagePullBackOff` |
| Cluster | OKE cluster name, OCID, or kubeconfig context |
| Region | `us-ashburn-1` |
| Namespace | `default`, `prod`, `payments` |
| Workload | Deployment, Pod, Service, Ingress, PVC, or ServiceAccount |
| Time window | `15m`, `1h`, `24h` |
| Impact | production, lower environment, single workload, cluster-wide |

Confirm the active kubeconfig context before collecting evidence:

```bash
kubectl config current-context
kubectl config get-contexts
```

If the context does not match the target cluster, stop and ask the user to switch context or provide the correct kubeconfig.

## Symptom Routing

| Symptom | Primary evidence |
|---------|------------------|
| Pods Pending or Unschedulable | Pod events, node capacity, taints/tolerations, node selectors, autoscaler logs, OCI limits |
| ImagePullBackOff or ErrImagePull | Pod events, image path, imagePullSecrets, service account, OCIR repository and IAM policy |
| CrashLoopBackOff or OOMKilled | Pod logs, previous logs, resource requests/limits, node pressure |
| CNI or pod sandbox failures | Pod events, kube-system CNI pods, OCI VCN-native CNI logs, subnet IP capacity, Multus NADs, all node VNICs, NSGs, security lists, route tables, gateways, and peering paths |
| Service has no LoadBalancer IP | Service events, OCI load balancer state, subnets, NSGs, security lists, route tables, gateways, peering paths, and quota |
| Ingress failure | Ingress events, OCI Native Ingress controller logs, listener/certificate/backend health, subnets, NSGs, security lists, route tables, gateways, and peering paths |
| DNS timeout or NXDOMAIN | CoreDNS health, Service and EndpointSlice state, pod lookup tests |
| PVC Pending or attach failure | PVC/PV events, CSI controller logs, volume AD, node AD, block volume limits |
| Workload cannot call OCI API | ServiceAccount, Workload Identity policy, SDK provider, namespace and cluster identity |
| Private API endpoint unreachable | Kubeconfig, endpoint subnet, NSGs, security lists, route tables, gateways, peering paths, bastion, or operator host path |

## Evidence Collection Pattern

Start broad, then narrow.

1. Confirm client tools:

```bash
kubectl version --client
oci --version
```

2. Capture cluster and namespace state:

```bash
kubectl get nodes -o wide
kubectl get pods -A
kubectl get events -A --sort-by=.lastTimestamp
kubectl get deploy,rs,pod,svc,ingress,pvc -n <namespace> -o wide
```

3. Inspect the failing object:

```bash
kubectl describe pod <pod> -n <namespace>
kubectl logs <pod> -n <namespace> --previous
kubectl describe service <service> -n <namespace>
kubectl describe ingress <ingress> -n <namespace>
kubectl describe pvc <pvc> -n <namespace>
```

4. Check OKE system components:

```bash
kubectl get pods -n kube-system -o wide
kubectl get daemonset,deployment -n kube-system
```

5. Use OCI CLI for matching OCI-side state when the cluster OCID, compartment OCID, and region are known:

```bash
oci ce cluster get --cluster-id <cluster_ocid> --region <region>
oci ce node-pool list --compartment-id <compartment_ocid> --cluster-id <cluster_ocid> --region <region>
```

Only run broader OCI inventory commands when they are needed to explain the Kubernetes symptom.

## Kubernetes to OCI Correlation

When enough selectors are known, map Kubernetes objects to OCI resources:

| Kubernetes object | OCI resource to check |
|-------------------|-----------------------|
| Node | Compute instance, all VNIC attachments including primary and secondary VNICs, attached subnets, VNIC NSGs, subnet security lists, route tables, gateways or peering paths, node pool |
| Service type `LoadBalancer` | OCI Load Balancer, backend set, listeners, subnets, NSGs, security lists, route tables, gateways or peering path |
| Ingress | OCI Load Balancer resources managed by the ingress controller, subnets, NSGs, security lists, route tables, gateways or peering path |
| PVC/PV | Block Volume or File Storage resource and attachment state |
| Pod with VCN-native networking | Pod subnet IP capacity, OCI CNI allocation path, NSGs, security lists, route table, gateways or peering path |
| Pod using Workload Identity | Cluster, namespace, service account, IAM policy conditions |

Use this correlation to avoid treating every symptom as only a Kubernetes problem.

## Diagnosis Report

Present findings in this order:

1. Confirmed context:
   - Cluster
   - Region
   - Namespace
   - Workload
   - Time window

2. Top findings:
   - Evidence
   - Why it matters
   - Confidence

3. Likely causes:
   - Rank from most likely to least likely.
   - Link each cause to the evidence that supports it.

4. Recommended actions:
   - Separate read-only validation from mutating remediation.
   - Ask before any remediation command.

5. Residual risks:
   - Missing permissions
   - Missing logs
   - Time-window gaps
   - OCI visibility gaps

## Common Mistakes

- Troubleshooting the current kubeconfig context before confirming it is the target OKE cluster.
- Treating a Pending pod as only a Kubernetes scheduler issue without checking node-pool limits, OCI quota, and shape availability.
- Debugging LoadBalancer Services without checking the OCI load balancer, backend health, subnets, NSGs, and service events together.
- Assuming DNS is broken before checking Service selectors and EndpointSlices.
- Rotating image pull secrets before confirming the image path, region key, OCIR namespace, and repository permissions.
- Mixing Workload Identity with dynamic group assumptions. OKE Workload Identity uses workload identity policy conditions, not dynamic groups.
- Applying fixes before preserving the events and logs needed to explain the incident.
- Checking NSGs but forgetting subnet security lists, route tables, gateways, and peering paths.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengdownloadkubeconfigfile.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Concepts/contengpodnetworking.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Concepts/contengpodnetworking_topic-OCI_CNI_plugin.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengconfiguringclusteraddons.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contenggrantingworkloadaccesstoresources.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengAttaching_Multiple_VNICs.htm

# `/oke-troubleshooter` — Symptom Triage Reference

Use this table to map the user's symptom description to diagnostic domains. Start with the listed prompts to confirm context before collecting evidence. Domains can be added or removed based on the user's answers.

| Symptom keywords | Primary domains | Clarifying questions |
|------------------|-----------------|----------------------|
| `ImagePullBackOff`, `ErrImagePull`, failed registry auth | Pod runtime, IAM/RBAC | Namespace? Image registry (OCIR/3rd-party)? Recently rotated secrets? |
| `Pending` pods, `Unschedulable`, `Insufficient` resources | Pod scheduling, Node health | Which namespace/workload? Any recent cluster scale events? Require specific node labels/shapes? |
| Autoscaler not adding nodes, `NotTriggerScaleUp`, max node group size, scale-up failed | Cluster Autoscaler / Node Pool Scaling, Pod scheduling, OCI infra | Which workload is Pending? Is cluster-autoscaler installed? Node pool min/max? Any OCI service-limit or capacity errors? |
| `CrashLoopBackOff`, `OOMKilled`, high restart counts | Pod runtime, Node health | First failure timestamp? Any recent config/secret changes? Container logs already reviewed? |
| `Node NotReady`, `NodeReady=False`, `Kubelet stopped posting` | Node health, Control plane | Specific node pool or AD? Recent maintenance events or OCI alarms? |
| kube-system add-on unhealthy, CoreDNS down, CSI controller down, CNI daemonset down, metrics missing | OKE Add-ons Health, Node health, Control plane | Which add-on? All nodes or one AD/node pool? Any recent upgrade or add-on change? |
| Slow responses, high latency, throughput drop, users reporting "app is slow" | Application performance, Pod runtime, Networking/CNI/LB, Dependency path | Which Deployment/Service? Baseline latency? Any recent rollout or config change? HPA or autoscaling enabled? Which downstream dependencies are called on-request? |
| Service has no LB IP, `Pending` load balancer, ingress failing | Networking/CNI/LB, OCI infra | Public or private load balancer? Correct subnets/NSGs applied? Any recent network policy updates? |
| Ingress route broken, OCI native ingress controller errors, TLS listener/cert mismatch | Ingress / OCI Native Ingress, Networking/CNI/LB, OCI infra | Which Ingress and ingress class? TLS or HTTP? Any recent annotation/certificate changes? |
| DNS timeout, `NXDOMAIN`, `SERVFAIL`, service discovery failure, cannot resolve service | DNS / Service Discovery, OKE Add-ons Health, Networking/CNI/LB | Which pod performs lookup? Which service/DNS name? Does Service have ready endpoints? |
| `FailedCreatePodSandBox`, CNI plugin error, OCI IPAM allocation failure, missing `ipvlan`, Multus network-status missing | Pod Networking / OCI CNI / IPAM, OKE Add-ons Health, Node health | Which pod/node? Is this Multus/GVA? Which NAD/interface? Any subnet IP exhaustion? |
| DPDK init fails, Mellanox `mlx5`, `vfio-pci`, `/dev/infiniband`, `ibv_devices`, hugepages, SR-IOV resources requested but no `net1`/`network-status` entries | Pod Networking / OCI CNI / IPAM, Node health, Pod runtime | Which pod/node? Which NADs and device-plugin resources? Does `network-status` show the requested networks? Are target VFs bound to `mlx5_core` or `vfio-pci`? Are hugepages and RDMA/verbs devices visible in the pod? |
| Timeout reaching API server, `x509` errors, control-plane degraded | Control plane, Networking | Using public or private endpoint? Any recent API endpoint visibility changes? |
| Private endpoint unreachable, kubeconfig exec auth fails, bastion/operator path broken | Private Cluster / API Endpoint Connectivity, Control plane, Networking | From which workstation or jump host? Public or private endpoint? OCI security token current? |
| PVC stuck `Pending`, volume attachment failures, CSI errors | Storage, Node health | Block Volume or File Storage? Specific availability domain? Existing capacity or service-limit alarms? |
| OCI limits exceeded, `TooManyRequests`, throttling | OCI infra, Control plane | Which service returned the error? Was there a recent surge in provisioning? |
| `Forbidden`, RBAC denial, service account issues | IAM/RBAC, Pod runtime | Which user/service account? Recent policy updates? Using workload identity? |
| Pod cannot call OCI API, workload identity auth failure, policy condition mismatch | Workload Identity / OCI API From Pods, IAM/RBAC, Pod runtime | Which service account and namespace? Which OCI SDK/API? What auth error appears in pod logs? |
| `ImagePullBackOff` from OCIR, unauthorized, repo not found | OCIR / Image Pull, Pod runtime, IAM/RBAC, Networking/CNI/LB | Which image region/namespace/repo? Is imagePullSecret in same namespace? Node egress path available? |

### Additional triage prompts
- Confirm target namespace, cluster region, and compartment when not provided.
- Ask whether the symptom is impacting production or a lower environment to set urgency.
- Capture desired timeframe for evidence (`last 15m`, `last 1h`, etc.) to scope CLI queries.
- For latency incidents, capture dependency-path context:
  - Request entrypoint (ingress/API/worker trigger).
  - Downstream services called by the target deployment (internal and external).
  - Critical-path dependencies versus optional/background calls.
  - If known, end-to-end p95/p99 baseline and rough per-hop latency budget.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Concepts/contengpodnetworking.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengobservingworkernodeaddonhealth.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengconfiguringclusteraddons.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contenggrantingworkloadaccesstoresources.htm
- https://kubernetes.io/docs/tasks/debug/debug-application/
- https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/

---
name: oke-troubleshooter
description: Use this skill when the user wants to diagnose or root-cause issues with an OCI Kubernetes Engine cluster or workload. Trigger phrases include "pods pending", "troubleshoot OKE", "service has no IP", "cluster unhealthy", DPDK/SR-IOV mlx5 pod failures, Multus network-status issues, or broad incident RCA across Kubernetes and OCI resources. Do not use it for greenfield Terraform generation, GVA node-pool creation or update review, or routine Multus manifest deployment when no incident is being investigated; route those to oke-cluster-generator, oke-gva-deployer, or oke-multihome-deployer.
---

You are an experienced Site Reliability Engineer for OCI Kubernetes Engine. Guide the user through an evidence-driven investigation that spans Kubernetes signals and OCI infrastructure.

Supporting references (load on demand):
- `symptom-triage.md` — initial mapping of symptom → diagnostic domains.
- `evidence-collectors.md` — command recipes for each domain.
- `final-report-template.md` — standard final report structure.
- `../../shared/oci-resource-map.md` — K8s-to-OCI mapping commands.
- `../oke-multihome-deployer/references/oke-dpdk-mlx5-notes.md` — DPDK, Multus, Mellanox mlx5, `vfio-pci`, hugepage, and RDMA/verbs diagnostic rules.

Optional accelerators (use only when the runtime supports delegation; never block on them):
- `../../agents/oke-evidence-collector.md` — agent for command execution and evidence normalization.
- `../../agents/oke-hypothesis-analyst.md` — agent for scoring hypotheses.
- `../../agents/oke-lb-log-collector.md` — agent for LB OCID resolution, logging-status checks, and LB log signal extraction.

Scripts rely on the global error contract: exit 0 success, exit 1 expected issues, exit 2 unexpected. Emit JSON errors on stderr in failure scenarios.

Helper scripts:
- `../../scripts/oke-discover.sh` — resolve cluster OCID from kubeconfig and fetch compartment/region via OCI CLI
- `../../scripts/oke-addon-health.sh` — collect kube-system add-on health signals
- `../../scripts/oke-pod-network-check.sh` — collect OCI CNI/IPAM, Multus, pod sandbox, and NAD signals
- `../../scripts/oke-autoscaler-check.sh` — collect Pending pod, cluster-autoscaler, and node-pool scaling signals
- `../../scripts/oke-dns-check.sh` — collect CoreDNS, Service, EndpointSlice, and pod DNS lookup signals
- `../../scripts/oke-ingress-check.sh` — collect OCI Native Ingress controller and Ingress object signals
- `../../scripts/oke-private-endpoint-check.sh` — collect private endpoint, kubeconfig, and API reachability signals
- `../../scripts/oke-ocir-image-pull-check.sh` — collect OCIR image pull, secret, service account, and repository signals
- `../../scripts/oke-workload-identity-check.sh` — collect service account, pod log, token projection, and workload identity IAM policy signals
- `../../scripts/oke-incident-timeline.sh` — merge Kubernetes events, rollout history, object descriptions, and OCI alarms into a timeline
- `../../scripts/oke-object-correlator.sh` — build a Kubernetes-to-OCI object graph for pods, nodes, services, ingress, PVCs, load balancers, instances, VNICs, volumes, and node pools

---

## Execution Mode

- Default to **local execution in the parent skill**.
- Use the optional agents above only as accelerators when the current runtime clearly supports agent delegation.
- If agents are unavailable, disabled, or return malformed output, continue locally with the same command list and payload shape. Do not stop the investigation solely because delegation is unavailable.
- Normalize local evidence to the same JSON shape documented in `evidence-collectors.md`.
- Never execute a mutating Kubernetes or OCI action unless the exact command or action has been shown to the user and explicitly approved in the current session.
- Treat `kubectl apply`, `kubectl patch`, `kubectl annotate`, `kubectl delete`, `kubectl rollout restart`, `kubectl scale`, node cordon/drain/debug flows, OCI create/update/delete operations, and LB logging enablement as approval-required. Approval for one command does not approve follow-up mutations.

## Phase 0 — Input & Preflight
1. **Parse Arguments**
   - `$ARGUMENTS` holds an optional symptom string. If empty, ask the user for a concise description (e.g., `"pods stuck Pending in prod namespace"`).
   - Extract namespace hints (`-n`, `namespace:`) and resource names when present.
2. **Auto-Discover Cluster Context**
   - Ask for **cluster name** if not provided.
   - First list kubeconfig contexts to identify managed clusters and current context:
     ```bash
     kubectl config get-contexts
     ```
   - Use this output to suggest likely cluster/context names before prompting for manual input.
   - Derive `active_cluster_region` from the active kube context (`kubectl config view --minify`, user exec args, or cluster metadata tied to the current context) and treat it as authoritative.
   - Resolve **cluster OCID** from `~/.kube/config` when possible.
   - Use tenancy defaults from `~/.oci/config` only for auth/profile hints, not for region selection.
   - Run:
     ```bash
     bash ../../scripts/oke-discover.sh --cluster <cluster-name-or-ocid> [--region <region>] [--profile <oci-profile>] [--timeout <seconds>] [--kubeconfig <path>] [--deployment <name>]
     ```
   - Always pass `--region <active_cluster_region>` to discovery and all OCI CLI calls in later phases.
   - Never use implicit OCI CLI region or fallback/default region.
   - Use the JSON output to auto-populate: `cluster_ocid`, `compartment_ocid`, `region`, `kubernetes_version`, and deployment namespace when available.
   - If discovery reports a different region than `active_cluster_region`, flag the mismatch, keep `active_cluster_region` for all subsequent commands, and ask for confirmation only if the mismatch prevents resource resolution.
   - Prompt only for fields that remain missing after discovery.
   - **Single-cluster scope enforcement**:
     - Treat the user-provided cluster (`name` or `ocid`) as the only in-scope target for the entire session.
     - Do not run baseline checks, inventory commands, or evidence collection against any other cluster.
     - If current `kubectl` context does not match the discovered cluster identity, stop and ask the user to switch context or provide the correct kubeconfig before continuing.
     - If OCI lookup must be retried, retry only for the same specified cluster (for example with corrected `--region`/`--profile`), never by probing other clusters.
3. **Confirm Context**
   - Ask only for missing essentials after discovery: namespace, target Deployment/Service name, desired time window (`15m`, `1h`, default `1h`), impact level (prod/non-prod).
4. **Tool Availability Checks**
   - Run `kubectl version --client` and `oci --version`.
   - Record `KUBECTL_AVAILABLE`/`OCI_AVAILABLE` booleans. If a CLI is missing, inform the user that evidence will be partial and continue with available tools.
5. **Session State**
   - Initialize state structure:
     ```json
     {
       "symptom": "...",
       "namespace": "...",
       "time_window": "1h",
       "cluster_ocid": "...",
       "compartment_ocid": "...",
       "region": "...",
       "domains": [],
       "dependency_map": {
         "entrypoint": "",
         "hops": [],
         "critical_path": [],
         "latency_budget_ms": {}
       },
       "fallbacks": {"kubectl": false, "oci": false},
       "evidence": [],
       "node_doctor": {
         "enabled": false,
         "execution_mode": "ask_then_execute",
         "image": "",
         "targets": [],
         "results": []
       }
     }
     ```

---

## Phase 1 — Symptom Triage
1. Load `symptom-triage.md` and identify candidate domains matching the symptom keywords (including application performance cases such as “deployment nginx is slow”).
2. Present the suggested domains to the user with brief rationales. Allow them to:
   - Confirm the list.
   - Add or remove domains.
   - Provide additional focus (specific pod, service, node pool, PVC, IAM entity).
3. For application latency symptoms, model dependency context before evidence collection:
   - Capture request entrypoint (Ingress/API/Job), target deployment, and downstream services (internal and external).
   - Mark critical-path dependencies vs optional/background calls.
   - Capture baseline latency and per-hop budget when known.
4. Capture clarifying answers (from the table's questions) and store them in session state (e.g., `POD_NAME`, `SERVICE_NAME`, `DEPLOYMENT_NAME`, `LABEL_SELECTOR`, `BASELINE_LATENCY`, `DEPENDENCY_MAP`).

---

## Phase 2 — Dependency Path Modeling
1. Build a dependency map before running domain collectors when latency/throughput symptoms are present.
2. Dependency map structure:
   ```json
   {
     "entrypoint": "ingress/payments",
     "hops": [
       {"from": "ingress/payments", "to": "deployment/payments-api", "protocol": "HTTP"},
       {"from": "deployment/payments-api", "to": "svc/orders", "protocol": "gRPC"},
       {"from": "deployment/payments-api", "to": "svc/redis", "protocol": "TCP"}
     ],
     "critical_path": ["ingress/payments->deployment/payments-api", "deployment/payments-api->svc/orders"],
     "latency_budget_ms": {
       "end_to_end_p99": 500,
       "ingress/payments->deployment/payments-api": 120,
       "deployment/payments-api->svc/orders": 220
     }
   }
   ```
3. If dependency data is incomplete, continue with a partial map and explicitly mark confidence reduction in later phases.

---

## Phase 3 — Evidence Collection
1. Build the OCI object correlation graph before domain-specific collectors when enough selectors are known.
   - Run the correlator with all discovered selectors, even if only one target object is known:
     ```bash
     bash ../../scripts/oke-object-correlator.sh \
       --namespace <ns> \
       --cluster-id <cluster_ocid> \
       --compartment-id <compartment_ocid> \
       --region <region> \
       [--pod <pod>] \
       [--deployment <deployment>] \
       [--service <service>] \
       [--ingress <ingress>] \
       [--pvc <pvc>] \
       [--node <node>]
     ```
   - Treat the output as evidence with fields: `domain`, `graph.kubernetes`, `graph.oci`, `graph.edges`, `findings`, `anomalies`, `raw_snippets`, and `fallback_used`.
   - Use the graph to narrow follow-on checks. Examples:
     - If a Service maps to an OCI Load Balancer with unhealthy backend health, focus on backend set, node subnets, NSGs, security lists, route tables, gateways or peering paths, and endpoint readiness.
     - If a Pod maps to a Node and Compute instance, inspect all primary and secondary VNIC attachments, their subnets, NSGs, subnet security lists, route tables, gateways or peering paths, node pool, and AD for node/network checks.
     - If a PVC maps to a Block Volume, compare volume AD and attachment state before blaming CSI.
   - If `fallback_used=true`, continue with domain-specific collectors and call out which object links could not be resolved.
2. For each selected domain:
   - Look up required commands in `evidence-collectors.md`.
   - Build command batches with placeholders filled (namespace, resource names, compartment OCID, time window, and dependency hop identifiers when present).
   - **Auto-run read-only evidence commands without prompting** when tools are available.
   - Never auto-run remediation or mutating commands. Present the exact command, explain the expected impact, and wait for explicit user approval before running it.
   - Example command item:
     ```json
     {
       "cmd": "kubectl describe pod trainer-0 -n ml-team",
       "purpose": "Inspect scheduling events"
     }
     ```
   - For Networking/LB investigations, prefer the dedicated LB collector when delegation is available. Otherwise run the LB commands from `evidence-collectors.md` locally and normalize the same output fields in the parent skill.
   - Use payload fields: `namespace`, `service`, `region`, `compartment_ocid`, `time_window`, and `enable_logging_mode`.
   - Enablement interaction:
     - Ask user only when collector reports `logging_status=disabled|unknown`:
       - `No (report only)`
       - `Yes (print command only)`
       - `Yes (run now)`
     - Map answer to `enable_logging_mode` and rerun collector if needed.
   - Merge collector output into session evidence:
     - `lb_ocid`, `logging_status`, `logging_status_source`, `log_findings`, `anomalies`, `fallback_used`
   - If collector reports fallback/timeouts, continue with Kubernetes networking evidence and call out OCI visibility gap in the report.
   - For OKE-specific domains, prefer the dedicated helper script before generic command batches:
     - OKE Add-ons Health:
       ```bash
       bash ../../scripts/oke-addon-health.sh --namespace kube-system
       ```
     - Pod Networking / OCI CNI / IPAM:
       ```bash
       bash ../../scripts/oke-pod-network-check.sh --namespace <ns> [--pod <pod>] [--selector <label-selector>]
       ```
     - Cluster Autoscaler / Node Pool Scaling:
       ```bash
       bash ../../scripts/oke-autoscaler-check.sh --namespace <ns> [--deployment <deployment>] --cluster-id <cluster_ocid> --compartment-id <compartment_ocid> --region <region>
       ```
     - DNS / Service Discovery:
       ```bash
       bash ../../scripts/oke-dns-check.sh --namespace <ns> [--service <service>] [--pod <pod>] [--lookup <dns-name>]
       ```
     - Ingress / OCI Native Ingress:
       ```bash
       bash ../../scripts/oke-ingress-check.sh --namespace <ns> --ingress <ingress> [--region <region>]
       ```
     - Private Cluster / API Endpoint Connectivity:
       ```bash
       bash ../../scripts/oke-private-endpoint-check.sh --cluster-id <cluster_ocid> --region <region> [--compartment-id <compartment_ocid>]
       ```
     - OCIR / Image Pull:
       ```bash
       bash ../../scripts/oke-ocir-image-pull-check.sh --namespace <ns> --pod <pod> [--image <image>] [--compartment-id <compartment_ocid>] [--region <image_region>]
       ```
     - Workload Identity / OCI API From Pods:
       ```bash
       bash ../../scripts/oke-workload-identity-check.sh --namespace <ns> --serviceaccount <sa> [--pod <pod>] [--tenancy-id <tenancy_ocid>]
       ```
     - Incident Timeline:
       ```bash
       bash ../../scripts/oke-incident-timeline.sh --namespace <ns> [--pod <pod>] [--deployment <deployment>] [--service <service>] [--compartment-id <compartment_ocid>] [--region <region>]
       ```
   - Treat helper JSON output as evidence with fields: `domain`, `findings`, `anomalies`, `raw_snippets`, and `fallback_used`.
   - For Node Health investigations, include optional Node Doctor diagnostics:
     - Trigger when Node Health is selected and there are node readiness/kubelet/runtime signals, or when user explicitly asks.
     - Scope starts with one candidate node first, then ask whether to continue to additional nodes.
     - Default debug image to `docker.io/library/ubuntu` each run (`kubectl debug ... --image=<image-name>`), and allow user override. Keep the selected image in session for additional nodes unless user changes it.
     - Before execution, present the exact sequence and ask explicit confirmation per node:
       1) `bash ../../scripts/node-doctor-run.sh --node <node-name> --image <image-name>`
       2) (script executes `kubectl debug` + `chroot /host` + `sudo /usr/local/bin/node-doctor.sh --check`)
     - Options per node:
       - `Execute now`
       - `Print commands only`
       - `Skip`
     - Treat this flow as potentially disruptive/privileged. Never auto-run without confirmation.
     - Capture normalized output fields in evidence:
       - `node_doctor_attempted`, `node_doctor_executed`, `node_doctor_node`, `node_doctor_image`
       - `node_doctor_result` (`pass` | `fail` | `unknown`) and `node_doctor_command_rc`
       - `node_doctor_findings`, `node_doctor_raw_snippet`, `node_doctor_fallback_reason`
     - If the helper script reports failure (debug blocked, image pull, chroot/sudo/script missing), set fallback details and continue Node Health evidence collection.
3. Assemble collector input payload:
   ```json
   {
     "symptom": "...",
     "domains": ["Pod Scheduling"],
     "namespace": "...",
     "time_window": "...",
     "selectors": {"pod": "...", "service": "...", "deployment": "...", "label": "..."},
     "dependency_map": {
       "entrypoint": "...",
       "hops": [],
       "critical_path": [],
       "latency_budget_ms": {}
     },
     "object_graph": {...},
     "fallbacks": {"kubectl": false, "oci": true},
     "compartment_ocid": "..."
   }
   ```
4. Execute the prepared command list.
   - If delegation is available, you may hand the payload to `oke-evidence-collector`.
   - Otherwise run the commands locally in the parent skill and normalize them to the documented evidence JSON shape (`domain`, `findings`, `raw_snippets`, `anomalies`, `fallback_used`).
   - If delegated collection fails or returns malformed output, fall back to local execution immediately.
5. After all domains processed, summarize key findings to the user before analysis. Note any `fallback_used` signals or missing data.

---

## Phase 4 — Hypothesis Ranking
1. Construct analyst payload containing:
   ```json
   {
     "symptom": "...",
     "domains": [...],
     "dependency_map": {...},
     "object_graph": {...},
     "evidence": [...],
      "fallbacks": {"kubectl": false, "oci": true}
   }
   ```
2. Rank hypotheses.
   - If delegation is available, you may use `oke-hypothesis-analyst`.
   - Otherwise rank hypotheses locally using this rubric:
     - `9-10`: direct, converging evidence for one root cause
     - `6-8`: strong multi-signal correlation with limited ambiguity
     - `3-5`: plausible but missing a decisive signal
     - `1-2`: weak signal or mostly evidence-gap guidance
   - Ensure each hypothesis includes score, bottleneck hop attribution when relevant, evidence bullets, remediation commands, and prevention guidance.
   - Prefer hypotheses that are supported by explicit graph edges across Kubernetes and OCI resources over hypotheses supported only by isolated symptoms.
   - If delegated analysis fails or returns malformed output, fall back to local ranking immediately.
3. Validate that evidence quotes reference actual snippets collected. If not, request clarification from the analyst or adjust evidence payload.

---

## Phase 5 — Report & Next Steps
1. Load `final-report-template.md` and present a structured report using that shape:
   - Table of top hypotheses with scores.
   - Highlight confidence level (e.g., `High`, `Medium`, `Low` based on score thresholds).
   - For latency incidents, include a hop-by-hop budget table: `hop`, `expected_p99_ms`, `observed_p99_ms`, `delta_ms`, `confidence`.
   - Remediation commands rendered in fenced code blocks, prefixed with comments where necessary. Do not execute them unless the user approves the exact command or action after seeing it.
   - Prevention recommendations as concise bullet points.
2. Call out any limitations: missing tooling, commands that failed, domains not yet explored, and missing dependency telemetry.
3. Offer next actions:
   - Rerun for another namespace/resource.
   - Deep-dive into IAM, capacity, or service-limit evidence when the collected data points there.
   - Export findings to a file (future enhancement).
4. Thank the user and remind them to redact sensitive data if sharing the report.

---

## Error Handling
- Missing CLI: Continue with available evidence, set fallback flags, warn the user.
- Permission denied or forbidden: include remediation (e.g., "ensure tenancy OCID has access to compartment").
- Delegation unavailable or subagent failure: continue locally; do not abort the incident flow.
- Unexpected script errors: emit JSON error per contract and stop the current phase while keeping collected data.

## Security & Logging
- Do not echo secret values or service account tokens. Redact with `***`.
- Reference the audit logging guidance: avoid storing credentials in outputs or state.
- Encourage the user to review any local runtime audit log if their agent environment records one.

---

## Invocation Examples
- `Use the OKE troubleshooter for pods stuck Pending in prod namespace`
- `Use the OKE troubleshooter for lb service has no IP us-phoenix-1`
- `Use the OKE troubleshooter for cluster api timing out`
- `Use the OKE troubleshooter for customer is indicating poor performance for deployment`
- `Use the OKE troubleshooter for CoreDNS timeouts in prod`
- `Use the OKE troubleshooter for cluster autoscaler is not adding nodes`
- `Use the OKE troubleshooter for pods fail sandbox creation with OCI CNI IPAM errors`
- `Use the OKE troubleshooter for OCIR ImagePullBackOff unauthorized`
- `/oke-troubleshooter "workload identity pod gets NotAuthorized"`
- `/oke-troubleshooter "private OKE API endpoint unreachable"`
- `/oke-troubleshooter "OCI native ingress TLS backend errors"`

## Latency Walkthrough (Dependency-Aware)
Use this pattern when the incident is "deployment is slow" and the deployment depends on other services.

1. **Input Example**
   - Symptom: `"payments API p99 jumped from 350ms to 1.8s"`
   - Namespace: `prod`
   - Deployment: `payments-api`
   - Time window: `1h`
2. **Dependency Map Example**
   ```json
   {
     "entrypoint": "ingress/payments",
     "hops": [
       {"from": "ingress/payments", "to": "deployment/payments-api", "protocol": "HTTP"},
       {"from": "deployment/payments-api", "to": "svc/orders", "protocol": "gRPC"},
       {"from": "deployment/payments-api", "to": "svc/redis", "protocol": "TCP"}
     ],
     "critical_path": [
       "ingress/payments->deployment/payments-api",
       "deployment/payments-api->svc/orders"
     ],
     "latency_budget_ms": {
       "end_to_end_p99": 500,
       "ingress/payments->deployment/payments-api": 120,
       "deployment/payments-api->svc/orders": 220,
       "deployment/payments-api->svc/redis": 80
     }
   }
   ```
3. **Expected Evidence Interpretation**
   - Compare observed hop p99 to budget and compute delta.
   - Identify the largest over-budget hop on critical path first.
   - Validate with both client-side and server-side evidence when possible.
4. **Expected Report Snippet**
   - Hypothesis: `"Orders dependency latency spike is primary bottleneck"`
   - Confidence: `High` when both sides of hop agree.
   - Budget table:

     | Hop | Expected p99 (ms) | Observed p99 (ms) | Delta (ms) | Confidence |
     |-----|-------------------|-------------------|------------|------------|
     | ingress/payments->payments-api | 120 | 140 | +20 | Medium |
     | payments-api->orders | 220 | 980 | +760 | High |
     | payments-api->redis | 80 | 95 | +15 | Medium |

   - Remediation should target `payments-api->orders` first, then re-measure end-to-end p99.

The skill should deliver actionable insight even when only partial data is available.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengdownloadkubeconfigfile.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Concepts/contengpodnetworking.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengconfiguringclusteraddons.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contenggrantingworkloadaccesstoresources.htm
- https://docs.oracle.com/en-us/iaas/Content/Balance/home.htm
- https://docs.oracle.com/en-us/iaas/Content/Logging/home.htm
- https://kubernetes.io/docs/tasks/debug/debug-application/
- https://kubernetes.io/docs/reference/kubectl/

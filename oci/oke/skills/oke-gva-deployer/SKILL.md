---
name: oke-gva-deployer
description: Use this skill when the user asks to enable, deploy, or configure Generic VNIC Attachment (GVA) for OCI Kubernetes Engine (OKE), create node pools with secondary VNIC profiles, review update plans for existing GVA node pools, map Application Resources to workloads, or explain GVA functionality, constraints, and scheduling behavior. Do not use it for general OKE incident RCA or for deploying Multus test pods after a GVA node pool already exists; use oke-troubleshooter or oke-multihome-deployer for those surfaces.
---

# OKE Generic VNIC Attachment (GVA) Deployer

You are an OCI networking and OKE specialist. Help the user deploy GVA, validate prerequisites, configure node pools with secondary VNIC profiles, and roll out workloads that request Application Resources. Prefer live OCI discovery to reduce user input and confirm choices before generating commands.

Hard constraint:
- Never query existing node pools for this workflow. Do not run `oci ce node-pool list` or `oci ce node-pool get`.
- Do not collect node-level information in this workflow. Do not run `kubectl get nodes`, `kubectl describe node`, or any per-node inspection commands unless the user explicitly asks for node details.
- Collect required values from cluster metadata (`oci ce cluster get`), networking discovery, and user-provided inputs only.
- Always use an interactive menu for node pool creation. For node-pool updates, prepare an explicit update review and do not execute a non-interactive update command unless an update-specific interactive flow is added and the user approves it.
- For every new node pool creation request, collect mutable node-pool inputs again. Never use saved JSON payload files, prior `tmp/` payloads, previous turn values, or previously generated commands without re-prompting and re-confirming them in the current workflow.
- Never start discovery on an implicit/default cluster. Discovery is allowed only after the user explicitly selects or provides a target cluster name/context/OCID in the current turn.
- Never use an OCI config default region for workflow execution. Always ask the user for the region in the current flow and use exactly the region they provide for all OCI CLI calls in that workflow.

Supporting reference (load on demand):
- `references/gva.md` — concise feature summary, constraints, and example CLI / pod specs
- `validation-report-template.md` — standard node-pool validation report structure

Scripts:
- `../../scripts/gva-discover.sh` — discover cluster, subnets, and NSGs to minimize prompts
- `../../scripts/gva-menu.sh` — guided interactive flow that consumes discovery data and prints CLI command + test manifest

---

## Phase 0 — Intake
Flow requirements:
1) Confirm the target cluster first. If the user did not explicitly provide a cluster name/context/OCID in the prompt, ask which cluster to use before running discovery or generating commands.
   - Do not assume a default cluster (for example `cluster3`) even if scripts offer one.
   - If multiple kube contexts exist, require explicit selection before discovery.
2) Resolve **cluster OCID** from `~/.kube/config` when possible.
3) Resolve **tenancy defaults** from `~/.oci/config` only for non-region values if needed.
   - Always ask the user for the region in the current flow.
   - Use only the user-provided region for all OCI CLI calls in this workflow.
4) Use OCI CLI to retrieve cluster details, then **auto-populate** whatever is available.
5) Prompt only for missing information.

If the cluster is not using VCN-Native CNI, stop and explain that GVA is unsupported for Flannel/Cilium.

---

## Phase 1 — Fast Discovery (Mandatory)
For speed, use this sequence first before broader discovery:

1) Resolve cluster OCID from kubeconfig.
2) Pull cluster details:

```bash
oci ce cluster get --cluster-id <cluster-ocid> --region <region>
```

3) Pull VCNs only in the cluster compartment:

```bash
oci network vcn list --compartment-id <compartment-ocid> --region <region>
```

4) Ask the user which VCN to use.
5) Pull subnets only for the selected VCN:

```bash
oci network subnet list --compartment-id <compartment-ocid> --vcn-id <selected-vcn-ocid> --region <region>
```

6) Pull NSGs in the selected VCN (or compartment fallback if needed):

```bash
oci network nsg list --compartment-id <compartment-ocid> --vcn-id <selected-vcn-ocid> --region <region>
```

Only if this flow fails should you fall back to the broader discovery helper below.

## Phase 1b — Discovery Helper (Fallback)
When OCI CLI is available and authenticated, you may run:

```bash
bash ../../scripts/gva-discover.sh --cluster <cluster-name-or-ocid> [--region <region>] [--compartment-id <ocid>] [--profile <oci-profile>] [--timeout <seconds>] [--kubeconfig <path>]
```

Use the JSON output to populate:
- Cluster OCID, Kubernetes version, compartment OCID, region
- Subnet list (name, OCID, CIDR)
- NSG list (name, OCID)

If any list is empty or the CLI call fails, fall back to manual prompts for that item.
Do not use node pool discovery as fallback.

---

## Phase 2 — Conversational Menu UX (Mandatory)
Use a one-at-a-time menu flow in chat. Do not ask for multiple unrelated fields in a single prompt.

Interaction rules:
- Ask exactly one configuration item per turn.
- For each menu, allow either:
  - Numeric option selection (for example `1`, `2`, `3`), or
  - Direct custom value typed by the user without a special keyword.
- Exception: for Availability Domain selection, only allow choosing from discovered AD options (no custom AD text).
- Prefer numeric menus consistently across all steps.
- Do not mark options as "recommended" unless the user explicitly asks for recommendations.
- If the user requests more options, expand the menu rather than truncating.
- Confirm and carry forward each accepted value before asking the next item.
- When the user starts a new node pool creation, always begin a fresh create flow for mutable values such as node pool name, shape, node count, placement subnet, AD, image, and each GVA profile, even if earlier runs already gathered similar values.
- Do not use an old `--from-json` request body as the source of truth for a new node pool create.

Menu order:
1) VCN selection
2) `node_pool_name`
3) `node_shape`
4) shape config (OCPUs + memory) when shape is Flex
5) node count
6) Availability Domains (allow one, two, or all three; comma-separated)
7) primary node subnet
8) image selection (filter by Kubernetes version; validate shape architecture/family compatibility before finalizing)
9) Secondary VNIC profile fields:
   - `applicationResource` label
   - GVA secondary subnet
   - NSG selection (`none` allowed)
   - `ipCount` (1-256)
10) Ask: "Add another secondary VNIC profile?" and repeat step 9 until user says no.

Data presentation rules:
- VCN menu must list all discovered VCNs in the target compartment (name + CIDR + OCID or selectable key).
- Subnet menus must list all discovered subnets in the user-selected VCN (name + CIDR + OCID or selectable key).
- Image menus must list OKE images matching the cluster Kubernetes version. If the helper cannot prove shape architecture/family compatibility from image metadata, mark that compatibility check as TODO/live validation and ask the user to confirm before finalizing.
- NSG menus must include all discovered NSGs and a "none" option.
- Availability Domain menu must list discovered ADs and accept only numeric multi-select input (`1,2,3` style); reject custom AD values.
- When a validation rule narrows choices (for example secondary subnet 2+ CIDR rule), render the filtered menu in the same format as the full menu (numeric key + name + CIDR), not key-only output.
- For every filtered menu, re-number options contiguously from `1..N` (do not reuse original indices like `4,10,11`).

Compatibility guardrails:
- Validate image compatibility with node shape architecture/family before finalizing.
- If there is a mismatch (for example ARM image with x86 shape), stop and ask user to change either image or shape.
- Build one profile per secondary VNIC entry collected in step 9/10.
- After each secondary subnet selection, verify the subnet is IPv4-only (no IPv6 CIDR); if not, reject it and prompt for another subnet.
- After each secondary subnet selection, verify the subnet has more than one IPv4 CIDR block; if not, reject it and prompt for another subnet.

Automation option:
- If user asks to use scripts, you may run:
  - `bash ../../scripts/gva-menu.sh`
  - `bash ../../scripts/gva-discover.sh ...`
  But preserve the same conversational behavior above when operating in chat.
  - When using scripts, pass/run only with the user-selected cluster; never accept or rely on script defaults for cluster selection.

---

## Phase 3 — Design VNIC Profiles
Create a table of VNIC profiles with these fields:
- `applicationResource` (string label used by pods)
- `subnetId` (OCID)
- `ipCount` (integer, max 256)
- `nsgIds` (list, optional)
- `displayName` (optional)
- `assignPublicIp` (optional, default false)
- `tags` (optional)

Validate:
- Each `applicationResource` is unique.
- Total IPs across VNICs fits expected pod count + buffer.
- Subnets align with intended traffic isolation.
- Each GVA secondary subnet is IPv4-only and has more than one IPv4 CIDR block.

## Phase 3b — Required Variable Checklist (Always Collect)
Before generating create commands or update review commands, collect and confirm:
- Cluster context/name
- Cluster OCID
- Region
- Compartment OCID
- VCN OCID
- Kubernetes version
- Node pool name (must be explicitly provided; do not auto-finalize a default name without user confirmation)
- Node shape
- OCPUs (if Flex)
- Memory in GB (if Flex)
- Node count
- Availability Domain(s) (one or more)
- Primary node subnet (placement subnet)
- Image OCID matching cluster Kubernetes version
- Secondary VNIC profile list (one or more)
- `applicationResource` label per profile
- GVA secondary subnet per profile
- NSG IDs per profile
- `ipCount` per profile (1-256)
- Secondary VNIC display name (recommended)
- Whether additional GVA profiles are required (explicit yes/no loop)
- Optional node pool parameters (tags, labels, boot volume, SSH key, etc.)
- Final explicit create confirmation in the current turn before generating a runnable command

---

## Phase 4 — Create Node Pool or Review Update (CLI)
Execution constraint:
- Keep node pool creation interactive (prompt/confirm driven). Command previews are allowed, but do not run non-interactive create or update commands directly.

CLI runtime workflow (mandatory before create):
1) Check the installed OCI CLI for GA GVA node-pool flags:
```bash
oci --version
oci ce node-pool create --help | grep -E 'secondary-vnics|cni-type'
```
2) If the flags are missing, stop before create and ask the operator to upgrade
the regular OCI CLI through their normal install path. A preview OCI CLI is no
longer required for this workflow.

`../../scripts/gva-menu.sh` performs this check before executing a confirmed
create command. If the check fails, print the command only and ask the operator
to install an OCI CLI version with GVA flag support.

If the user uses OCI CLI, generate a command using the prepared profiles. Use the template below and replace placeholders.

```bash
oci ce node-pool create \
  --compartment-id "<compartment_ocid>" \
  --cluster-id "<cluster_ocid>" \
  --name "<node_pool_name>" \
  --kubernetes-version "<k8s_version>" \
  --node-shape "<shape>" \
  --node-shape-config '{"ocpus":<n>,"memoryInGBs":<gb>}' \
  --size <node_count> \
  --cni-type OCI_VCN_IP_NATIVE \
  --placement-configs '[{"availabilityDomain":"<ad>","subnetId":"<primary_subnet_ocid>"}]' \
  --node-source-details '{"sourceType":"IMAGE","imageId":"<image_ocid>"}' \
  --secondary-vnics '<secondary_vnics_json>'
```

Use availability domains discovered from IAM for the tenant (for example `GrCh:US-ASHBURN-AD-1`), not guessed aliases.

If the user uses Terraform, ask which module/resource they are using and map the same profile fields without guessing.

---

## Phase 5 — Verify Node Resources
Provide user-run verification commands only (do not execute node queries from the agent). Instruct the user to confirm that GVA resources appear on nodes:

```bash
kubectl describe node <node_name>
```

Expected signals:
- Extended resources like `oke-application-resource.oci.oraclecloud.com/<AppResource>`
- Taint: `oci.oraclecloud.com/application-resource-only:NoSchedule`

---

## Phase 6 — Deploy Workloads
Provide a pod/deployment snippet that:
- Requests exactly **1** unit of the chosen Application Resource
- Adds a toleration for the GVA taint

Highlight validation rules:
- Exactly one Application Resource type per pod
- Resource count must be exactly 1
- Pods without toleration will not schedule

---

## Troubleshooting Quick Hits
- **Pods Pending**: No available IPs for requested resource, missing toleration, or wrong resource name
- **Validation webhook errors**: Pod requests multiple resources or incorrect count
- **Capacity issues**: Increase node pool size or rebalance `ipCount` across profiles

---

## Output Expectations
Deliverables should include:
1. A short explanation of GVA functionality
2. A finalized VNIC profile table
3. A ready-to-run CLI command (or Terraform mapping notes)
4. A sample workload manifest
5. A verification checklist with pass/fail placeholders so the user can record node
   resource validation after running `kubectl describe node <node_name>`
6. A final validation report using `validation-report-template.md` when post-create
   validation evidence is available

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengAttaching_Multiple_VNICs.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Concepts/contengpodnetworking_topic-OCI_CNI_plugin.htm
- https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/ce/node-pool/create.html
- https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/ce/node-pool/update.html
- https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
- https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/

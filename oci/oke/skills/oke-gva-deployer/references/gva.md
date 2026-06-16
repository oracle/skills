# Generic VNIC Attachment (GVA) — Reference Summary

Source baseline: public OKE documentation for attaching multiple secondary VNICs
for pod networking.

## What GVA Does
- Provides per-secondary-VNIC configuration for OKE pods.
- Each secondary VNIC can have its own subnet, NSGs, tags, and IP allocation.
- Pods request a specific Application Resource label to select the VNIC type.

## Why It Matters
- Enables workload isolation by network tier.
- Avoids identical secondary VNICs in standard VCN-Native CNI.
- Supports compliance and multi-tenant segmentation.

## Key Concepts
- Primary VNIC: node management and control plane traffic.
- Secondary VNICs: pod networking.
- Application Resource: label that maps pod requests to a VNIC profile.
- Scheduler only places pods on nodes that have matching resources.

## Prerequisites
- OKE cluster with **VCN-Native CNI** (GVA not supported on Flannel).
- Subnets and NSGs per workload tier.
- Each GVA secondary subnet must be IPv4-only and have more than one IPv4 CIDR block.
- Node pool permissions to create/manage VNICs.

## Constraints and Limits
- `ipCount` per VNIC is capped at **256**.
- Pods can request **only one** Application Resource type.
- Pods must request **exactly 1** unit of that resource.
- Pod-level Application Resource selection is for a single secondary VNIC profile.
  Use Multus and NetworkAttachmentDefinitions (NADs) for pods that need multiple
  interfaces; do not combine pod-level Application Resource requests with Multus
  network annotations in the same pod spec.
- VNIC attachment limits depend on instance shape.

## Node Behavior
- Nodes expose extended resources:
  `oke-application-resource.oci.oraclecloud.com/<ResourceName>`
- Nodes are tainted:
  `oci.oraclecloud.com/application-resource-only:NoSchedule`

## CLI Version Note
- GVA node-pool create is expected to use the regular OCI CLI. Confirm local support with `oci ce node-pool create --help | grep -E 'secondary-vnics|cni-type'`.
  Confirm availability in the user's environment before relying on it.

## Example Secondary VNIC JSON (template)
Use as `--secondary-vnics '<json>'` in CLI.

```json
[
  {
    "createVnicDetails": {
      "ipCount": 256,
      "applicationResources": ["Frontend"],
      "assignPublicIp": false,
      "displayName": "vnic-frontend",
      "nsgIds": ["ocid1.nsg..."],
      "subnetId": "ocid1.subnet...",
      "skipSourceDestCheck": false
    },
    "displayName": "vnicattachment-frontend"
  }
]
```

## Example Pod Snippet (template)

```yaml
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
          oke-application-resource.oci.oraclecloud.com/Frontend: "1"
        limits:
          oke-application-resource.oci.oraclecloud.com/Frontend: "1"
```

## max-pods Guidance
- GVA reduces per-interface pod capacity (256 IPs per VNIC).
- Set kubelet `max-pods` via cloud-init accordingly.
- HostNetwork pods still count toward max-pods.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengAttaching_Multiple_VNICs.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Concepts/contengpodnetworking_topic-OCI_CNI_plugin.htm
- https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/ce/node-pool/create.html
- https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
- https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/

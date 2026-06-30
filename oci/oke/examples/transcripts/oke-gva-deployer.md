# OKE GVA Deployer Transcript

This is a shortened successful run for creating a GVA-enabled node pool.

## Prompt

```text
Use the OKE GVA deployer
```

## Transcript

**Agent:** Which OKE cluster should I configure?

**User:** `demo-oke`, region `us-ashburn-1`.

**Agent:** I found the cluster OCID in kubeconfig and discovered VCN, subnet, and NSG
options. I will ask for one mutable node-pool value at a time.

**User choices:**

| Field | Value |
| --- | --- |
| Node pool name | `gva-workers` |
| Shape | `VM.Standard.E5.Flex` |
| OCPUs / memory | `2` / `16` |
| Node count | `3` |
| Primary subnet | `<primary_subnet_ocid>` |
| Application Resource | `frontend` |
| Secondary subnet | `<secondary_subnet_ocid>` |
| `ipCount` | `32` |

**Agent:** Generated a create command and a validation workload manifest. The command
is printed for review; it is not run unless you explicitly choose to run it.

## What This Produces

See [sample GVA command output](../outputs/oke-gva-deployer/node-pool-command.sh).

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengAttaching_Multiple_VNICs.htm
- https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/ce/node-pool/create.html
- https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/

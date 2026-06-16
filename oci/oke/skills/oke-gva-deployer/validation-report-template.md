# OKE GVA Node Pool Validation Report Template

Use this structure after generating a GVA node-pool command or after the user reports
post-create validation results.

## Summary

State whether the GVA node-pool configuration is ready to create, created and
validated, or blocked by missing information.

## Node Pool Configuration

| Field | Value |
| --- | --- |
| Cluster | `<cluster>` |
| Region | `<region>` |
| Node pool | `<node_pool>` |
| Shape | `<shape>` |
| Node count | `<count>` |
| Primary subnet | `<subnet_ocid>` |
| Kubernetes version | `<version>` |

## Secondary VNIC Profiles

| Application Resource | Subnet | `ipCount` | NSGs | Display name |
| --- | --- | ---: | --- | --- |
| `<resource>` | `<subnet_ocid>` | `<count>` | `<nsgs>` | `<name>` |

## Generated Artifacts

| Artifact | Purpose |
| --- | --- |
| OCI CLI command | Creates the GVA-enabled node pool |
| Workload manifest | Requests one Application Resource and tolerates the GVA taint |
| Verification checklist | Confirms extended resources and scheduling constraints |

## Validation Checklist

| Check | Command | Result |
| --- | --- | --- |
| Extended resource present | `kubectl describe node <node_name>` | `<pass/fail/not-run>` |
| GVA taint present | `kubectl describe node <node_name>` | `<pass/fail/not-run>` |
| Test workload schedules | `kubectl -n <namespace> get pods -o wide` | `<pass/fail/not-run>` |
| Workload requests exactly one resource | `kubectl -n <namespace> get pod <pod> -o yaml` | `<pass/fail/not-run>` |

## Remediation

If validation fails, keep these causes separate: missing Application Resource on nodes,
wrong resource name in workload, missing toleration, invalid `ipCount`, subnet capacity,
or incompatible node-pool image/shape.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengAttaching_Multiple_VNICs.htm
- https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
- https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/

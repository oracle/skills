# OKE Cluster Generator Transcript

This is a shortened successful run that shows the shape of the interaction and the
artifacts produced. Values are placeholders.

## Prompt

```text
Use the OKE cluster generator fast-path us-ashburn-1 demo-private-oke
```

## Transcript

**User:** Generate an OKE Terraform stack quickly for a private worker cluster in
`us-ashburn-1`.

**Agent:** I will use fast path defaults for a production-friendly starter stack:
Enhanced cluster, private API endpoint, VCN-native pod networking, one Flex node pool,
Block Volume CSI enabled, Oracle-managed encryption, managed CoreDNS and kube-proxy,
and no public worker nodes. I still need your tenancy OCID and compartment OCID.

**User:** Use `<tenancy_ocid>` and `<compartment_ocid>`.

**Agent:** Summary before generation:

| Area | Choice |
| --- | --- |
| Region | `us-ashburn-1` |
| Cluster | `demo-private-oke` |
| Cluster type | Enhanced |
| API endpoint | Private |
| CNI | VCN-native pod networking |
| VCN | Create new VCN, `10.0.0.0/16` |
| Pod CIDR | `10.244.0.0/16` |
| Service CIDR | `10.96.0.0/16` |
| Node pool | `general`, 3 nodes, `VM.Standard.E5.Flex`, 2 OCPUs, 16 GB |
| Storage | Block Volume CSI |
| Add-ons | CoreDNS, kube-proxy |

**User:** Generate it.

**Agent:** Generated Terraform and ORM assets:

- `provider.tf`
- `main.tf`
- `variables.tf`
- `outputs.tf`
- `terraform.tfvars.example`
- `schema.yaml`

## What This Produces

See [sample Terraform output](../outputs/oke-cluster-generator/main.tf).

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm
- https://github.com/oracle-terraform-modules/terraform-oci-oke
- https://docs.oracle.com/en-us/iaas/Content/ResourceManager/home.htm

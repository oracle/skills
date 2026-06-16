# OCI Resource Mapping Cheatsheet

Use these command chains to relate Kubernetes objects to Oracle Cloud Infrastructure resources during troubleshooting.

## Automated Correlation
Use the object correlator first when you have a namespace and one or more target selectors. It runs read-only `kubectl` and `oci` lookups and returns a normalized graph with Kubernetes nodes, OCI nodes, and edges between them.

```bash
./scripts/oke-object-correlator.sh \
  --namespace <ns> \
  --cluster-id <cluster-ocid> \
  --compartment-id <compartment-ocid> \
  --region <region> \
  [--pod <pod>] \
  [--deployment <deployment>] \
  [--service <service>] \
  [--ingress <ingress>] \
  [--pvc <pvc>] \
  [--node <node>]
```

Expected graph edges include:
- `scheduled_on`: Pod to Kubernetes node.
- `runs_on_instance`: Kubernetes node to OCI Compute instance.
- `has_vnic`: OCI instance to each primary or secondary VNIC attachment.
- `attached_to_subnet`: VNIC to subnet.
- `uses_nsg`: VNIC to Network Security Group.
- `uses_security_list`: Subnet to security list.
- `uses_route_table`: Subnet to route table.
- `routes_to`: Route table to gateway, DRG, private IP, or peering target.
- `provisions`: Kubernetes Service or Ingress to OCI Load Balancer.
- `bound_to` and `backs_onto`: PVC to PV to OCI Block Volume.

Use the manual command chains below when the correlator cannot resolve a link or when you need to inspect a specific object in more detail.

## Pod → Node → Instance
1. Identify the node hosting the pod:
   ```bash
   kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.nodeName}'
   ```
2. Fetch node annotations for the instance OCID:
   ```bash
   kubectl get node <node> -o jsonpath='{.metadata.annotations."node\.oci\.oraclecloud\.com/instance-id"}'
   ```
3. Inspect the OCI instance:
   ```bash
   oci compute instance get --instance-id <instance-ocid>
   ```
4. List VNIC attachments for the instance:
   ```bash
   oci compute vnic-attachment list \
     --compartment-id <compartment-ocid> \
     --instance-id <instance-ocid> \
     --all
   ```
5. Inspect each VNIC and its subnet path:
   ```bash
   oci network vnic get --vnic-id <vnic-ocid>
   oci network subnet get --subnet-id <subnet-ocid>
   oci network security-list get --security-list-id <security-list-ocid>
   oci network route-table get --rt-id <route-table-ocid>
   ```

## Service / Ingress → Load Balancer
1. Obtain OCI load balancer OCID from annotations:
   ```bash
   kubectl get svc <service> -n <ns> -o jsonpath='{.metadata.annotations."oci\.oraclecloud\.com/load-balancer-id"}'
   ```
2. Describe load balancer health:
   ```bash
   oci lb load-balancer get --load-balancer-id <lb-ocid>
   ```
3. Review backend set health:
   ```bash
   oci lb load-balancer-health get \
     --load-balancer-id <lb-ocid>
   ```
   For a specific backend set:
   ```bash
   oci lb backend-set-health get \
     --load-balancer-id <lb-ocid> \
     --backend-set-name <backend-set>
   ```

## PersistentVolumeClaim → Block Volume / File System
1. Retrieve PV name and volume handle:
   ```bash
   kubectl get pvc <claim> -n <ns> -o jsonpath='{.spec.volumeName} {.spec.volumeHandle}'
   ```
2. If Block Volume:
   ```bash
   oci bv volume get --volume-id <volume-ocid>
   ```
   For attachment details:
   ```bash
   oci compute volume-attachment list --compartment-id <compartment> --volume-id <volume-ocid>
   ```
3. If File Storage (FSS):
   ```bash
   oci fs file-system get --file-system-id <filesystem-ocid>
   ```

## Namespace / Service Account → IAM Policies
1. Locate relevant IAM policy statements:
   ```bash
   oci iam policy list --compartment-id <tenancy-ocid> --all \
     --query "data[].{name:name, statements:statements}"
   ```
2. Cross-check Kubernetes service account annotations and projected token behavior:
   ```bash
   kubectl get serviceaccount <sa> -n <ns> -o yaml
   ```

## Node Pool → Availability Domains
1. Identify node pool OCID:
   ```bash
   oci ce node-pool list --compartment-id <compartment> --cluster-id <cluster-ocid>
   ```
2. Fetch node pool details:
   ```bash
   oci ce node-pool get --node-pool-id <nodepool-ocid>
   ```
3. Map to AD and subnet IDs; confirm subnet health via:
   ```bash
   oci network subnet get --subnet-id <subnet-ocid>
   ```

Keep this document in sync with any future automation covering additional OCI resource types.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm
- https://docs.oracle.com/en-us/iaas/Content/Balance/home.htm
- https://docs.oracle.com/en-us/iaas/Content/Block/Concepts/overview.htm
- https://docs.oracle.com/en-us/iaas/Content/File/Concepts/filestorageoverview.htm
- https://docs.oracle.com/en-us/iaas/Content/Identity/policieshow/Policy_Basics.htm
- https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/
- https://kubernetes.io/docs/reference/kubectl/

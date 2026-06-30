# OKE Multus Multi-Interface Pods

## Overview

Use this skill to plan, deploy, or troubleshoot Multus NetworkAttachmentDefinitions (NADs) and multi-interface pods on OCI Kubernetes Engine (OKE), especially on node pools with multiple secondary VNIC profiles.

Use this when a pod needs more than one network interface, such as `eth0` plus `net1`, or when validating that a Multus attachment uses the intended OKE secondary VNIC path.

For full operational behavior, load `oci/oke/skills/oke-multihome-deployer/SKILL.md` and its supporting files before generating manifests or validating pods. That skill preserves the Multus multihome workflow, including OKE/GVA discovery, manifest generation, validation reports, and DPDK/SR-IOV notes.

Supporting tools and references:

- `oci/oke/skills/oke-multihome-deployer/scripts/discover-oke-multihome.py`
- `oci/oke/skills/oke-multihome-deployer/scripts/generate-multihome-manifest.py`
- `oci/oke/skills/oke-multihome-deployer/references/oke-multihome-notes.md`
- `oci/oke/skills/oke-multihome-deployer/references/oke-dpdk-mlx5-notes.md`
- `oci/oke/skills/oke-multihome-deployer/validation-report-template.md`

## Tool Use

Use the included tools during the Multus multihome workflow:

| Phase | Tool | When to use |
|-------|------|-------------|
| Discovery | `oci/oke/skills/oke-multihome-deployer/scripts/discover-oke-multihome.py` | Run after the user identifies the cluster, context, region, or compartment. Use it to discover node pools, placement subnets, secondary VNIC subnets, and suggested manifest generator arguments. |
| Manifest generation | `oci/oke/skills/oke-multihome-deployer/scripts/generate-multihome-manifest.py` | Run after the user confirms namespace, NAD names, interfaces, image, and target nodes. It generates YAML but does not apply it. |

Example discovery:

```bash
python3 oci/oke/skills/oke-multihome-deployer/scripts/discover-oke-multihome.py \
  --cluster-id <cluster_ocid> \
  --region <region> \
  --compartment-id <compartment_ocid> \
  --pretty
```

Example manifest generation:

```bash
python3 oci/oke/skills/oke-multihome-deployer/scripts/generate-multihome-manifest.py \
  --namespace gva-multihome-test \
  --default-interface enp1s0 \
  --secondary-interface enp2s0 \
  --pod gva-multihome-a=<node-a> \
  --pod gva-multihome-b=<node-b>
```

Show generated YAML to the user before applying it. Applying manifests requires explicit approval.

## When to Use

Use this skill for:

- Multus installation and health checks on OKE.
- NetworkAttachmentDefinition review.
- Multi-interface pod manifests.
- `k8s.v1.cni.cncf.io/networks` annotations.
- `v1.multus-cni.io/default-network` annotations.
- Pod `network-status` validation.
- Missing `net1` interfaces.
- OKE secondary VNIC profile selection from NAD configuration.

Use `oci/oke/gva-node-pools.md` instead when a pod only needs to select one secondary VNIC profile through an Application Resource request.

## Core Model

OKE supports different pod-networking models:

| Model | Selection mechanism | Use case |
|-------|---------------------|----------|
| Single pinned secondary VNIC profile | Pod-level Application Resource request | Pod needs exactly one selected secondary VNIC path |
| Multi-interface pod | Multus annotations and NADs | Pod needs multiple interfaces |
| Secondary VNIC profiles without Application Resources | NAD device selection or default CNI behavior | Capacity or interface-based selection without scheduler resource pinning |

Do not combine pod-level Application Resource requests with Multus pod network annotations in the same pod spec. If a multi-interface pod needs to select a secondary VNIC profile, define that selection in the NAD, such as with `deviceSelector.appResource` when supported.

## Prerequisites

Confirm:

- The cluster uses VCN-native pod networking.
- Worker nodes are in a node pool configured with the required secondary VNIC profiles.
- Multus is installed and healthy.
- Required CNI binaries exist on every target worker node.
- NADs are created in the correct namespace.
- Subnets and NSGs allow the traffic being tested.
- The pod image is available from a reachable registry.

## Health Checks

Check Multus:

```bash
kubectl get pods -n kube-system -l app=multus -o wide
kubectl get daemonset -n kube-system
```

Check NADs:

```bash
kubectl get network-attachment-definitions -A
kubectl get network-attachment-definition <nad-name> -n <namespace> -o yaml
```

Check the target pod:

```bash
kubectl describe pod <pod-name> -n <namespace>
kubectl get pod <pod-name> -n <namespace> -o jsonpath='{.metadata.annotations.k8s\.v1\.cni\.cncf\.io/network-status}'
```

Check interfaces inside the pod:

```bash
kubectl exec -n <namespace> <pod-name> -- ip addr
kubectl exec -n <namespace> <pod-name> -- ip route
```

## NAD Review

Review each NAD for:

- Correct namespace.
- Correct CNI type for the intended path.
- Correct subnet or IPAM configuration.
- Correct parent interface or `deviceSelector`.
- Valid JSON inside the NAD `config`.
- Security model and expected traffic path.

A default-network NAD can be used to make `eth0` selection explicit:

```yaml
metadata:
  annotations:
    v1.multus-cni.io/default-network: kube-system/oci-vcn-native-network
    k8s.v1.cni.cncf.io/networks: default/secondary-network
```

The additional network annotation attaches extra interfaces such as `net1`.

## Validation Flow

1. Confirm the pod is scheduled onto the intended node pool:

```bash
kubectl get pod <pod-name> -n <namespace> -o wide
```

2. Confirm Multus network status exists:

```bash
kubectl describe pod <pod-name> -n <namespace>
```

Look for the `k8s.v1.cni.cncf.io/network-status` annotation.

3. Confirm expected interfaces:

```bash
kubectl exec -n <namespace> <pod-name> -- ip -brief addr
```

Expected result:

```text
lo               UNKNOWN
eth0             UP
net1             UP
```

4. Confirm IP addresses are from the intended subnets.

5. Confirm routes match the expected traffic path:

```bash
kubectl exec -n <namespace> <pod-name> -- ip route
```

6. Test connectivity only to approved targets:

```bash
kubectl exec -n <namespace> <pod-name> -- ping -c 3 <target-ip>
```

## Common Failure Patterns

### Pod Has Only `eth0`

Likely causes:

- NAD name or namespace does not match the pod annotation.
- Multus is not running or not injected as expected.
- The additional NAD failed validation.
- The pod annotation is malformed.

### Pod Sandbox Creation Fails

Likely causes:

- CNI binary referenced by the NAD is missing on the node.
- NAD JSON is invalid.
- OCI IPAM cannot allocate an address.
- Selected secondary VNIC profile has no available pod IP capacity.
- Node is missing the expected parent interface.

### Pod Schedules But Traffic Fails

Likely causes:

- NSG or security-list rules block traffic.
- Route table does not support the path.
- The pod IP is from a different subnet than expected.
- The wrong interface is being used.
- Return traffic is blocked.

### DPDK or SR-IOV Workload Fails

First separate the layers:

- Kubernetes device-plugin resources only prove resource allocation.
- Multus `network-status` proves interface attachment.
- NAD configuration defines what each attached network means.
- Driver, RDMA, hugepages, and DPDK application configuration are separate checks.

Do not assume the application failure is a network attachment failure until `network-status`, pod interfaces, and device visibility have been checked.

## Common Mistakes

- Combining Multus annotations with pod-level Application Resource requests.
- Creating NADs in `default` while the workload runs in another namespace.
- Referencing a short NAD name when a fully qualified `<namespace>/<name>` reference is needed.
- Assuming `net1` exists without checking `network-status`.
- Testing connectivity before confirming interface IPs and routes.
- Replacing node CNI binaries broadly when only one missing plugin binary needs investigation.
- Treating SR-IOV or DPDK resource allocation as proof that Multus attached the expected network.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengAttaching_Multiple_VNICs.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Concepts/contengpodnetworking_topic-OCI_CNI_plugin.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Concepts/contengpodnetworking.htm
- https://github.com/k8snetworkplumbingwg/multus-cni
- https://github.com/k8snetworkplumbingwg/network-attachment-definition-client

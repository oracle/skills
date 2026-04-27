# Oracle Cloud Infrastructure Skills

This file is a sample skeleton for how a domain-level `SKILL.md` can be structured for Oracle Cloud Infrastructure content.

Use it as a pattern for future OCI domain navigation, not as a todo list or commitment to a final taxonomy.

## How to Use This Domain

1. Start with the routing table below.
2. Read only the specific file or category you need.
3. Use the sections below as a template for organizing OCI skills as the domain evolves.

## Directory Structure

```text
skills/oci/
├── core/           Example: tenancy, regions, compartments, IAM
├── compute/        Example: instances, images, autoscaling
├── networking/     Example: VCN, load balancers, DNS, connectivity
├── storage/        Example: object, block, file, backup
├── databases/      Example: OCI database services and operations
├── security/       Example: IAM, vault, key management, guardrails
├── observability/  Example: logging, monitoring, alarms, tracing
├── devops/         Example: pipelines, resource manager, automation
└── integration/    Example: functions, events, API Gateway, messaging
```

## Category Routing

| Topic | Directory |
|-------|-----------|
| Tenancy structure, compartments, IAM, quotas, tagging | `skills/oci/core/` |
| Compute instances, custom images, autoscaling, OS management | `skills/oci/compute/` |
| VCN, subnets, gateways, load balancers, DNS, connectivity | `skills/oci/networking/` |
| Object Storage, Block Volumes, File Storage, backups | `skills/oci/storage/` |
| OCI database services, lifecycle operations, connectivity | `skills/oci/databases/` |
| Vault, keys, secrets, security zones, cloud guard | `skills/oci/security/` |
| Logging, Monitoring, Alarms, Events, tracing | `skills/oci/observability/` |
| Resource Manager, CLI, Terraform, pipelines, automation | `skills/oci/devops/` |
| Functions, API Gateway, Streaming, Notifications, integration patterns | `skills/oci/integration/` |

## Key Starting Points

- Sample section only
- Use this area to link a few high-value entry points once the domain has real content
- Prefer OCI documentation and service-specific examples when the domain is populated

## Common Multi-Step Flows

| Task | Recommended Sequence |
|------|----------------------|
| Sample environment setup flow | `core` → `networking` → `security` |
| Provision a secure OCI environment | `core` → `networking` → `security` |
| Deploy an application on OCI | `compute` → `networking` → `observability` |
| Automate OCI infrastructure changes | `devops` → `security` → `observability` |

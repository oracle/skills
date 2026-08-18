# Exadata deployment context

Source: [upstream Exadata Database module folder](https://github.com/oci-landing-zones/terraform-oci-modules-oracle-database/tree/main/exadata-database).

Read this before collecting module inputs. These are operational deployment prerequisites, not optional Terraform configuration values. Mention them only as non-blocking context; validate through OCI MCP only IDs supplied by or required in the requested module object. Never block configuration generation because an operational prerequisite is absent or cannot be verified. This skill never creates, remediates, or deploys prerequisites.

## Tenancy access and authentication

- Require an active OCI tenancy and IAM permissions sufficient to create the requested database resources. See [Exadata Cloud Service IAM policies](https://docs.oracle.com/en-us/iaas/exadatacloud/doc/ecs-policy-details.html).
- Require configured OCI API-key authentication. The user must create and retain their RSA private key securely; reference only its local path and never place key contents or its password in Terraform files. See [OCI Terraform provider authentication preparation](https://docs.oracle.com/en-us/iaas/Content/dev/terraform/tutorials/tf-provider.htm#prepare).

## Network deployment context

- Before deploying an Exadata Cloud Service environment, ensure a VCN exists in the target region. It may be created through the [OCI Core Landing Zone Exadata VCN template](https://github.com/oci-landing-zones/terraform-oci-core-landingzone/tree/main/templates/standalone-three-tier-vcn-custom) or the [OCI Console VCN workflow](https://docs.oracle.com/en-us/iaas/Content/Network/Tasks/create_vcn.htm#top).
- Before deploying an environment with a VM Cluster, ensure two available subnets exist: a **client subnet** for database client connections and a **backup subnet** for Object Storage and backup operations.
- Prefer private subnets. Confirm the supplied subnets are appropriate for the target Exadata availability domain, have valid route tables, and have security lists or NSGs covering the required ingress and egress.
- Require a route from the attached subnet to OCI Object Storage for backups and wallet access. Use a [Service Gateway](https://docs.oracle.com/en-us/iaas/Content/Network/Tasks/servicegateway.htm) for private access, or an [Internet Gateway](https://docs.oracle.com/en-us/iaas/Content/Network/Tasks/managingIGs.htm) only when the network design calls for public access.

## Required OCI MCP checks

Before generation, use OCI MCP to validate supplied tenancy/compartment IDs and all supplied optional IDs. Validate VCN, subnet, and NSG IDs only when they are inputs to the requested configuration object, such as a VM Cluster. Do not infer route-table, gateway, security-list, or NSG configuration from a supplied subnet ID: inspect it with the applicable read-only OCI MCP commands or ask the user for the approved network evidence.

## Configuration input failure response

If a required configuration input is missing or unusable, stop before writing Terraform and use this pattern:

> I cannot generate the requested Exadata configuration yet. The following required configuration inputs are missing or unusable: `<list only missing or invalid inputs for the requested module object>`. This skill does not create, remediate, or deploy resources.

# Upstream module support matrix

Source repository: `https://github.com/oci-landing-zones/terraform-oci-modules-iam`

Verify the current repository tree and the selected module's documentation before generation. This matrix is the initial allowlist, not permission to guess undocumented inputs.

| Requested capability | Status | Exact upstream submodule | Notes |
| --- | --- | --- | --- |
| Compartments | Supported | `compartments` | Supports compartment definitions and nesting through its documented configuration. |
| Compartment hierarchy | Supported | `compartments` | Keep parents and children in the supplied order. |
| IAM groups | Supported | `groups` | Local groups; member assignment refers to existing user names. |
| Assign existing users to a group | Supported within `groups` | `groups` | Not a standalone membership module. |
| IAM dynamic groups | Supported | `dynamic-groups` | Requires a matching rule. |
| IAM policies | Supported | `policies` | Requires explicit policy statements and scope. |
| Identity Domains | Supported | `identity-domains` | Confirm the requested resource type and input shape in the module's current `SPEC.md`. |
| Create classic IAM users | Not supported | — | The Terraform module for classic IAM users is not supported. |
| Standalone classic IAM memberships | Not supported | — | The Terraform module for standalone memberships is not supported. Use `groups` only to attach existing user names. |
| Cloud Guard security zones or recipes | Not supported | — | The Terraform module for Cloud Guard is not supported. |
| Any other OCI IAM/governance feature | Unknown/not supported | — | Treat as unavailable unless the current upstream tree documents a matching top-level module. |

## Rejection response

Use this response pattern and stop generation for the unsupported part:

> The Terraform module for `<requested capability>` is not supported by `oci-landing-zones/terraform-oci-modules-iam`, so I cannot generate a module block for it.

If a request combines supported and unsupported capabilities, ask whether to continue with only the supported portion. Do not include the unavailable feature in Terraform.

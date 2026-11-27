# Fixed skill scope and upstream support

Source repository: `https://github.com/oci-landing-zones/terraform-oci-modules-iam`

Apply the DB intent gate in `SKILL.md` and [db-operations-scope.md](db-operations-scope.md) before using this matrix. Generation requires all three: an allowed resource type and operation under this skill, relevance to the established DB operation, and verified upstream support at the selected ref. An excluded request is outside this skill's scope, not evidence that its upstream module is unsupported.

This is a fixed allowlist. Only `compartments`, `groups`, `dynamic-groups`, `policies`, and `identity-domains` may be used, and only for the resource types and workflows explicitly covered here and in their linked references. A new upstream module, resource type, or operation does not expand this scope, even inside an allowed module or when requested for DB use. Extending scope requires a separate, explicit update to the skill; an ordinary Terraform request does not authorize that update.

Verify the repository tree and selected module documentation at the exact source ref before generation. These checks establish implementation support and input shape for an already allowed request; they cannot admit an unlisted resource type or excluded operation. Adapt documented inputs for allowed resources to the selected ref without broadening the skill's scope. The allowlist alone is not proof of upstream support or permission to guess undocumented inputs. Existing membership, matching-rule, policy, and lifecycle restrictions remain in force.

| Requested capability | Status | Exact upstream submodule | Notes |
| --- | --- | --- | --- |
| Compartments | Supported | `compartments` | Supports compartment definitions and nesting through its documented configuration. |
| Compartment hierarchy | Supported | `compartments` | Keep parents and children in the supplied order. |
| IAM groups | Supported | `groups` | Local groups; initial membership can assign verified existing users. |
| Add existing users to a classic DB group | Conditional | `groups` | The existing group must be owned by the target module/configuration/state. Add named entries to `members`; see `group-membership.md`. |
| Remove existing users from a classic DB group | Conditional | `groups` | Both group and specific membership resources must be owned by the target module/state. External unmanaged memberships are not removed by deleting configuration entries. |
| Initial or updated Identity Domains group memberships | Conditional | `identity-domains` | Initial assignment is supported. Existing-group updates require verified ownership and a compatible established mode; current default `ignore_external_membership_updates = true` ignores updates. Do not switch modes to force support. |
| Identity Domains groups | Supported; updates conditional | `identity-domains` | Domain-group configuration only. All existing-group attribute updates, including descriptions/tags, must pass [group-update support checks](lifecycle-safety.md#identity-domains-group-update-support); an ignored update is an upstream limitation of that mode. Membership assignments/changes also follow `group-membership.md`. |
| IAM dynamic groups | Supported | `dynamic-groups` | Resolve DB purpose and intended resource membership through `dynamic-group-matching-rules.md`; derive or validate the rule. User-authored syntax is not required. |
| Identity Domains dynamic groups | Supported | `identity-domains` | Resolve the domain and apply the same matching-criteria checks; verify the selected ref's domain dynamic-group schema and implementation. |
| IAM policies | Supported | `policies` | Grants use `policy-access-assessment.md`. Reductions, statement removals, and policy deletions use `policy-revocation.md`: report exact edits, ownership, impact, and residual access, then obtain confirmation before writing. The agent may derive syntax from resolved intent. |
| Identity domains | Supported | `identity-domains` | Domain definitions needed for the DB operation; use the identity-domain collection section and verify the selected ref's schema. |
| Identity Domains identity providers | Supported | `identity-domains` | Only the DB-related identity-provider integration described in `input-collection.md`; verify the selected ref's schema. |
| Identity Domains applications | Supported | `identity-domains` | Only the application types explicitly listed in [input-collection.md](input-collection.md#applications-identity_domain_applications_configuration), for the established DB access/automation requirement. The module name does not permit other domain resource types. |
| Standalone user-account creation/administration | Outside skill scope | — | Excluded for both classic IAM and Identity Domains, regardless of upstream additions. Do not infer account-management support from domain bootstrap fields. |
| Memberships in arbitrary existing unmanaged groups | No direct module path | — | No standalone membership module or external-group membership input. Do not recreate, automatically import/adopt, or substitute direct resources. A membership-only request for an eligible managed group remains supported. |
| Replace the entire membership list, including external members | Outside this skill's membership workflow | — | Offer supported named additions/removals instead; do not promise authoritative replacement. |
| Cloud Guard security zones or recipes | Outside skill scope | — | No Cloud Guard module path or workflow is allowed by this skill. |
| Any other resource type or operation not covered by this skill | Outside skill scope | — | Generate no configuration for it, even if upstream adds support or the user establishes DB intent. Do not use a new module, an allowed module's new resource family, direct provider resources, or a custom module as a workaround. |

## Rejection response

For membership work, use [group-membership.md](group-membership.md) to distinguish an absent upstream capability, unknown ownership, an incompatible existing mode, and a skill scope boundary. Do not say the whole group module is unsupported merely because a particular existing group is ineligible.

For ignored Identity Domains group attribute updates, including descriptions/tags, use the specific upstream-implementation explanation in [lifecycle-safety.md](lifecycle-safety.md#identity-domains-group-update-support). This is neither a new scope exclusion nor proof that the entire module lacks update support; it applies to the verified resource branch and requested fields.

For a request outside the fixed allowlist or an excluded operation, stop that portion and say:

> `<requested capability>` is outside the current scope of `build-oci-iam-main-tf`. This skill generates only its explicitly supported IAM configurations for DB Operations; upstream additions do not expand its scope automatically.

No upstream lookup is needed to establish a known scope exclusion. Do not claim that upstream lacks the capability merely because the skill excludes it.

For an otherwise allowed request whose required upstream capability is verified absent at the selected ref, stop that portion and say:

> The Terraform module for `<requested capability>` is not supported by `oci-landing-zones/terraform-oci-modules-iam` at `<selected ref>`, so I cannot generate a module block for it.

If upstream verification is incomplete, report support as unverified and pause that portion; do not equate an unreadable source with absent support. If a request combines eligible capabilities with ones outside this allowlist or unavailable upstream, ask whether to continue with only the eligible portion. Do not include excluded or unavailable features in Terraform.

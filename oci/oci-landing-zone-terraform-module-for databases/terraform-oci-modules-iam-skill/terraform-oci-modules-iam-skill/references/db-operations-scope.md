# IAM scope for DB operations

Upstream module support is necessary but does not establish DB relevance. Apply the intent gate in `SKILL.md` first, then map each requested IAM change to the database operation it enables. All five module families can support DB operations; none is a mandatory new resource for every DB task.

## Resource selection

| Module family | Eligible DB purpose | Exclude or omit when |
| --- | --- | --- |
| `compartments` | Place database resources or their required supporting resources in an intended compartment hierarchy; for example, a compartment for ExaDB-D. | The compartment serves an unrelated workload. Do not create a new compartment when the request uses an existing one. |
| `groups` | Define DB operator groups and supported existing-user onboarding/offboarding through `group-membership.md`. | The requested change serves unrelated access. Do not create a new group when an existing group is specified, or treat its existence as Terraform ownership. |
| `policies` | Grant or revoke the permissions needed by the specified operators, automation principals, or OCI services for the DB task and its dependencies. | Statements grant unrelated service administration or permissions beyond the stated operation. |
| `dynamic-groups` | Identify non-human principals that perform the DB operation, such as a supported resource principal or an automation instance that manages databases; resolve criteria through `dynamic-group-matching-rules.md`. | The task involves human users only, or no DB automation/resource-principal requirement exists. A resource/group name alone is not DB-purpose evidence. A dynamic group is not required just because a database is being provisioned. |
| `identity-domains` | Configure supported domain groups, dynamic groups, or a specifically needed domain/federation/application integration for DB operator access or DB automation. | The request is general enterprise identity administration, unrelated application SSO, or a new domain without a DB access requirement. Prefer the existing domain; do not create a domain merely to provision ExaDB-D. |

DB relevance never expands the [fixed skill allowlist](module-support.md). Evaluate only the resource types and operations already admitted there; upstream additions remain outside scope, including additions inside an allowed module.

For Identity Domains, evaluate each requested domain, group, dynamic group, identity provider, and application separately. A DB operator group does not justify adding all other domain features. Verify both the allowed resource type and its input schema at the selected upstream ref. Do not infer user-creation support from the module name or from domain administrator bootstrap fields.

For “add/remove users”, follow [group-membership.md](group-membership.md): assign existing users initially to requested new DB groups, or make named changes to eligible module-managed groups. User-account administration and full-list replacement are outside this membership workflow regardless of upstream additions. Resolve the identity model and domain before user lookup, verify the selected ref's member format and management mode, and never assume the module can target an unmanaged external group.

## Access scope

- For access requests, establish the DB service and operation, the actor (human group, dynamic group, or service), and the target resource/compartment scope. A request for just a DB compartment does not require a complete access design.
- Allow IAM permissions for non-database dependencies when they are needed for the stated DB operation, such as using the selected network or accessing a backup bucket or encryption key. Identify the dependency and use the appropriate scope; do not reject a statement solely because its resource type is not a database type.
- Use current Oracle documentation for the particular database service and operation when checking permissions. Do not treat policies for ExaDB-D, ExaDB-C@C, Exascale, Base Database, and Autonomous Database as interchangeable. Avoid defaulting to tenancy-wide `manage all-resources` or broad landing-zone roles.
- For DB access checks or grants, follow [policy-access-assessment.md](policy-access-assessment.md): resolve the resource, operation, principal, and compartments; inspect existing and inherited policies; derive only confirmed missing permissions. Do not require the user to author policy statements. Supplied statements and requested templates must pass the same comparison; do not silently rewrite supplied text or emit unrelated or redundant grants.
- Report live access separately from relevant configuration evidence. Compare only in-scope configuration with established context/inputs and ownership; do not infer an unapplied removal from a mismatch. Clarify material conflicting intent before editing, and allow only the assessment's explicitly authorized correction to an eligible existing definition. Current-access-only questions do not require project discovery or apply-history proof.
- For policy grant reductions, statement removals, or named policy deletions, follow [policy-revocation.md](policy-revocation.md): assess relevant grants and ownership, report concrete proposed edits and residual/unknown access, and wait for confirmation before editing. Do not automatically remove other discovered grants or treat a named deletion as proof of complete access revocation.
- Distinguish the IAM authority needed by the person applying Terraform from the DB permissions being granted to its beneficiaries. Do not automatically grant DB operators authority to administer tenancy IAM.
- A resource may support a future DB operation; do not require the database to exist before generating its IAM prerequisites. Existing input validation and lifecycle checks still apply.

## Example decisions

| Request/context | Action |
| --- | --- |
| “Make compartment abc.” | State the skill's DB purpose, ask whether `abc` will support a DB operation, and wait. A yes permits the normal compartment workflow; a no ends that request under this skill. |
| “Make compartment abc for an ExaDB-D system.” | Proceed to compartment input collection and validation without asking again about DB intent. Do not add groups or policies unless requested. |
| “Create a DB operator group, add existing users, and grant ExaDB-D provisioning access in abc.” | Qualify the group and memberships; establish the ExaDB-D resource type and compartment, assess projected policy coverage for the requested new group, and derive only missing grants. Do not automatically add a dynamic group or a domain. |
| “Remove this group's ability to provision ExaDB-D VM clusters in abc.” | Assess applicable grants, ownership, and supported scoped changes; report exact edits and expected residual access, then wait for confirmation. Do not automatically remove every matching policy. |
| “Delete policy A” with established DB purpose | Resolve A, show its contents, ownership, and effects of deletion, and obtain confirmation of the concrete proposal before editing. |
| “Create a group named db-admins.” | Ask about intended DB use; the name alone is insufficient. |
| “Create a dynamic group for an instance that runs database backup automation.” | DB purpose is explicit; resolve the intended resource and derive its matching rule through `dynamic-group-matching-rules.md`. Handle policies only if also requested. |
| “Create a dynamic group for my database-backup instances” without explanatory context | Ask whether these instances perform database backup operations; a label alone does not establish DB intent. Wait before member-resource lookup. |
| “Create a dynamic group named database-backup.” | Ask about DB purpose before lookup; neither a group name nor a resource name establishes the intended operation. |
| “Create a domain group in our existing domain for ExaDB-D operators.” | Use the supported domain-group configuration; do not create a new identity domain. |
| “Create a compartment for our marketing website.” | Explain that this is outside the DB operations scope; generate no configuration for it. |
| “Create a DB compartment and an unrelated HR SSO application.” | Handle the DB compartment and explicitly exclude the unrelated application. |

## Sources for service-specific checks

- [Upstream IAM module families](https://github.com/oci-landing-zones/terraform-oci-modules-iam)
- [Groups and existing-user membership](https://github.com/oci-landing-zones/terraform-oci-modules-iam/tree/main/groups)
- [Dynamic groups and non-human principals](https://github.com/oci-landing-zones/terraform-oci-modules-iam/tree/main/dynamic-groups)
- [Identity Domains capabilities](https://github.com/oci-landing-zones/terraform-oci-modules-iam/tree/main/identity-domains)
- [Oracle ExaDB-D OCI requirements and required IAM policy](https://docs.oracle.com/en-us/iaas/exadatacloud/doc/oci-req-for-exacs-infra.html)

The module links above use `main` for orientation. The selected source ref remains authoritative for generation.

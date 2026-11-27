# DB policy revocation and removal: assess, report, confirm

Use after the DB intent gate for requests to remove or narrow policy grants, remove statements, or delete a named policy. An outcome request such as "Remove this group's ability to provision VM clusters" authorizes investigation and a proposal; it does not authorize deleting every policy found. **Report the exact proposed policy changes, ownership, impact, and residual access, then obtain explicit confirmation before editing policy configuration.** This applies even when the initial request names a policy to delete. Reuse confirmation already given for the same concrete reviewed proposal if its scope and evidence remain applicable; do not request it again merely because generation has another stage.

User-group membership changes and dynamic-group rule changes retain their own workflows. Do not substitute those changes for a policy revocation. Metadata-only policy edits preserve all statements and the attachment location and use lifecycle checks; changing grant targets, conditions, or template roles/toggles is not metadata-only. A check-only question such as "Would deleting A remove this access?" ends with findings and does not authorize file edits.

## 1. Establish the requested outcome or object change

- For an access outcome, resolve the exact principal and identity domain, DB service/resource type, operation to restrict, and target compartments. Ask only what is missing; "VM cluster" may need service clarification. Distinguish removal of creation rights from removal of all lifecycle rights. Establish any requested permissions to retain.
- For a named policy/statement change, resolve its exact identity and attachment compartment. Inspect its contents to explain affected principals, operations, and scopes; do not require an unrelated provisioning design. Do not silently expand deletion of A into deletion of B.
- Apply `lifecycle-safety.md`'s per-target classification. Current managed ownership requires verified project/backend/workspace, address, and resource identity. Missing local state is unknown ownership, not proof that a policy is unmanaged. A confirmed new unapplied policy has no live grant to revoke: removing it cancels planned access, still requiring review of the exact configuration change and confirmation under this workflow.

## 2. Assess applicable grants and the projected result

Reuse the target resolution, current Oracle permission documentation, read-only MCP procedure, and semantic interpretation in `policy-access-assessment.md`. Do not use its grant-outcome action table or missing-grant generation steps for revocation. Follow pagination, tenancy/home-region, authentication, and failed-read rules; never test permissions by mutating OCI resources.

For an outcome request, inspect policies attached to the target compartments, their ancestor chains through the tenancy, and relevant dependency scopes. Evaluate exact principals, verbs/permissions, resource families, conditions, and applicable denies. Identify alternative grants, including broader or inherited grants, that can preserve the requested ability. Distinguish the named group's grants from access individual members may receive through other groups; do not claim user-wide revocation from a group-scoped assessment.

Compare relevant live statements with configuration already in scope using [the configuration-evidence rules](policy-access-assessment.md#separate-live-access-from-configuration-evidence) before preparing a proposal. Establish the correct project/workspace, effective inputs, selected module ref, and managed-policy mapping. Report verified live access and observed configuration differences separately; do not call a difference a pending/unapplied edit without explicit confirmation or reliable evidence tied to the exact configuration/environment. Describe proposed effects conditionally, without claiming a Terraform plan was run. Do not silently undo another edit. If a material discrepancy's meaning or intended handling is unclear, resolve it before seeking confirmation of the revocation proposal; the grant flow's correction path does not bypass this workflow's confirmation gate.

| Evidence and request | Assessment outcome |
| --- | --- |
| Complete evidence shows the requested ability is currently absent, with no unresolved relevant configuration discrepancy | Report current absence and the scope of the configuration check, if any. Do not automatically clean up policies or claim to know unrelated deployment history; an explicitly requested named deletion is assessed separately. |
| Applicable grants are fully understood and supported edits can achieve the restriction | Prepare a concrete proposal and request confirmation; do not write it yet. |
| Another grant would remain, including a policy outside this project's ownership | Report that residual access and the ownership limitation. Offer only reviewable, eligible local changes or investigation of the appropriate owning configuration; wait for the user's choice. |
| Relevant coverage is unreadable, incomplete, or conditions cannot be resolved | Report the access result as unverified and request the missing evidence. Do not claim complete revocation. A narrower named edit may be considered only under the limited-change rule below. |

A named-policy edit can be assessed without claiming complete effective revocation when the exact policy contents, ownership, proposed change, and direct effects are verified but broader coverage remains unknown. Explain that limitation and require the user to explicitly choose that limited change. An outcome request never defaults to partial editing because full revocation is blocked. Missing access to the policy being changed, unknown ownership, or uncertain direct effects blocks its edit; confirmation and the MCP-unavailable fallback cannot waive those requirements.

## 3. Prepare a concrete, supported proposal

Inspect the existing policies module and exact selected source ref. Trace each affected OCI policy to its configuration key, state address, and direct or template inputs. Read existing metadata and collect only missing inputs needed for the proposed change. Complete the applicable schema, input, lifecycle, and non-mutating validation checks before asking for final confirmation; use the normal generation workflow up to its write step. Existing settings stay unchanged unless included in the requested proposal.

- Prefer the narrowest supported statement removal/narrowing that achieves the requested DB restriction while preserving unrelated principals, operations, conditions, and scopes. Use documented permission/condition semantics; do not invent a policy expression or revoke shared network/storage rights merely to break DB provisioning.
- Show before/after statements or an exact deletion diff. Deleting an entire policy is a distinct action requiring explicit confirmation of that policy and all its removed statements. If removing its last statement requires deleting the policy, state that in the proposal; do not emit an invalid empty statement list or delete the policy as an implicit cleanup.
- For template-generated policies, inspect all emitted effects of the proposed role/toggle change. Do not disable a shared template or migrate to direct policies as a shortcut. If a narrow supported change cannot be established, explain the limitation and offer no executable workaround.
- Keep attachment location distinct from the target scopes in statements. A restriction request does not authorize relocating a policy, changing provider/backend/source revision, editing group membership, or creating/changing deny policies to work around remaining grants.
- A read-only policy finding does not establish Terraform ownership. For an unmanaged policy, report the limitation and offer investigation of its owning configuration if requested. Do not import, adopt, recreate, remove it from state, or perform an OCI write. If an eligible owning project is later placed in scope, verify its ownership and prepare a new reviewable proposal there.

## 4. Report choices and wait for explicit confirmation

Present a compact proposal with:

1. The requested restriction or named object change, principal/domain, and target scope.
2. Each relevant policy's name/OCID, attachment location, contributing statements, and verified ownership classification; identify unverified evidence explicitly.
3. The exact eligible edits, their configuration keys/addresses, and before/after statements or whole-policy deletion. List relevant policies that will remain unchanged.
4. Expected effects on the requested operation, preserved permissions, other affected statements/scopes, and any remaining or unverified access. All proposed edits must stay within this skill's DB scope and ownership boundaries.
5. Available choices: approve the exact eligible change; explicitly accept a limited change with its stated residual/unknown access; request further investigation or a different proposal; or leave configuration unchanged. Show only choices applicable to the evidence. Do not offer an unmanaged-policy edit as executable in the current project.

Ask which concrete option the user wants and **wait before editing any affected policy files**. A general request to revoke access, silence, elapsed time, or approval to investigate is not confirmation of a particular edit. If the user changes the requested scope or new evidence materially changes the policies, statements, ownership, or effects, update the proposal and obtain confirmation for that revision. Do not repeatedly confirm an unchanged proposal already accepted.

Example report when A and B independently grant the same requested ability:

> Policies A and B both grant this group VM-cluster creation access in demo. Removing A alone leaves access through B. This project manages A; B is verified outside this project's management. The proposed local change removes the displayed statement from A and preserves its other statements. You can approve that limited change with access remaining through B, request investigation of B's owning configuration, or leave both unchanged. I will wait for your choice before editing.

If the proposed change instead deletes all of A, say so and display all statements that would be removed. If the user requests investigation of B, continue read-only investigation within the authorized scope; do not edit A as an assumed interim step. If the user requests changes to both, do not implement only A unless they explicitly accept that partial result.

## 5. Write only the confirmed change and report its limits

Before writing, confirm that validation and ownership evidence still support the exact accepted proposal. Apply only that proposal's eligible policy edits; preserve unrelated data, map keys, and module settings. User confirmation does not override unsupported capabilities, unknown ownership, unresolved direct effects, or DB-scope boundaries. No change/investigation-only choices produce no policy edits or Terraform execution handoff.

Show the resulting configuration diff and identify unchanged relevant grants. Describe the access effect as expected after the user's Terraform apply and OCI propagation; never claim that configuration editing has revoked live access. For a limited edit, explicitly state the residual or unverified ability. A claim about actual post-apply access requires fresh read-only assessment after the user reports applying the change. Never execute Terraform, mutate OCI, or alter state under this workflow.

## Decision examples

| Request or finding | Required behavior |
| --- | --- |
| "Remove the group's ability to create ExaDB-D VM clusters in demo" | Assess applicable grants; prepare scoped edits and effects; wait for confirmation before writing. |
| "Delete policy A" | Resolve A and its ownership, show every removed statement and known effects, and wait for confirmation of that concrete deletion. |
| A and B both grant access; only A is managed here | Report both and the limit. Do not remove either by default or silently implement only A. |
| User approves only the displayed A edit and acknowledges access remains via B | Edit only A after validation; report that the ability remains through B. |
| User asks to investigate B's owner | Investigate read-only within scope; do not edit A or B. |
| User approves A and B, but B's ownership is still unknown/unmanaged | Explain the blocked B change and seek an explicit choice about a limited A edit or establishing an eligible management path. No automatic partial write or adoption. |
| A is fully verified, but ancestor-policy visibility is incomplete | Report unknown residual access. A named A-only edit needs explicit acceptance of that limitation; do not claim complete revocation. |
| The proposed edit changes after confirmation | Show the revised concrete proposal and obtain confirmation before applying the revision. |
| "Remove this confirmed unapplied policy draft" | Show cancellation of its planned grants and obtain confirmation; do not describe it as live access revocation. |

## Sources

- [Policy inheritance](https://docs.oracle.com/en-us/iaas/Content/Identity/policieshow/Policy_Inheritance.htm)
- [Policy statements, combined permissions, and attachment](https://docs.oracle.com/en-us/iaas/Content/Identity/Concepts/policies.htm)
- [Policy conditions](https://docs.oracle.com/en-us/iaas/Content/Identity/Concepts/policyadvancedfeatures.htm)
- [Service-specific assessment and additional references](policy-access-assessment.md)
- [Upstream policy module](https://github.com/oci-landing-zones/terraform-oci-modules-iam/tree/main/policies) — verify the selected source ref before proposing configuration changes.

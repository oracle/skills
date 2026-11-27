# DB group membership: onboarding and offboarding

Use after the DB intent gate for initial assignment of existing users to a requested new DB group, or named user additions/removals in an existing DB group. This is configuration generation, not live identity administration. A membership-only request is eligible when the selected group module supports it; no standalone membership module is needed.

## Route the user's intent

- Establish the DB purpose from the request or conversation. For an ambiguous request such as "Add Alice to operators", ask: **"Is this membership change intended to support a DB operation?"** A group name alone does not establish its purpose. Do not repeat the question when DB onboarding or offboarding is already clear.
- Distinguish **create group with initial members**, **add named existing users**, and **remove named members**. Never interpret an add as replacing the list, or a remove-member request as deleting the user or group. "Update members" without a specific delta needs clarification.
- Full-list replacement is outside this skill's membership workflow. Explain that boundary and offer supported named additions/removals; do not silently translate "replace everyone" into an authoritative membership reset. This is a skill boundary, not a claim that every upstream module lacks list-management capabilities.
- Standalone user-account creation, deletion, activation, or other account administration is outside scope regardless of upstream additions; use the scope-exclusion response in `module-support.md`. Do not use identity-domain administrator bootstrap settings to create arbitrary requested members.
- Resolve the group and identity domain from project/conversation context and read-only OCI lookup before collecting the module's member values. Distinguish identical names; do not assume the default domain. A missing group is not permission to create one unless creation was requested.
- Membership-only work does not trigger `policy-access-assessment.md` or new policies. For a combined request, evaluate membership and policy portions separately; satisfied policy access does not satisfy an outstanding membership addition. Do not promise that membership removal revokes access obtained through other groups or policies.

## Eligibility and upstream behavior

For an edit to a previously generated group definition, first apply [lifecycle-safety.md](lifecycle-safety.md#classify-each-target-before-choosing-the-flow). If the user confirms the group is new and never applied, with no conflicting evidence, named edits to its initial member list remain initial-assignment work. Do not require a live group or membership state entries for that draft; check intended group/domain identity, name collisions, and the users who will be assigned. Removing a name from that draft only cancels its planned initial assignment and does not require a live membership or an active removed user. The existing-group ownership, live-membership reconciliation, and established update-mode checks below apply to existing OCI groups. An existing managed group with unapplied edits does not qualify for this draft exception. Preserve the module's mode and unrelated members/settings in either flow.

Select the exact source ref using `terraform-sources.md`. Inspect `variables.tf`, `SPEC.md`, and the implementation (`groups/main.tf` or `identity-domains/groups.tf`) at that ref. The behavior below was checked on `main`; pinned refs must be checked separately. Existing Identity Domains group updates also follow [Identity Domains group update support](lifecycle-safety.md#identity-domains-group-update-support), which covers description/tag changes as well as memberships and supplies the upstream-limitation explanation.

For existing OCI groups, ownership and update-mode requirements apply before proposing a change. A read-only finding that the requested membership is already satisfied may be reported without claiming Terraform ownership; check for conflicting local managed/planned changes before concluding that no configuration change is needed.

| Requested change | Eligible path |
| --- | --- |
| Create a new DB group and assign named existing users | Use the selected group module's initial `members` configuration. A new group does not require a pre-existing state address; do verify its members and avoid name collisions with an existing group. |
| Edit initial members of a confirmed new, unapplied DB group | Apply only the named delta to its planned initial assignment; preserve other members and verify those still to be assigned. No group or membership state entry is required for the draft. |
| Add users to an existing classic group | Require that exact group to be owned by the target module/configuration/state. Add only the requested names to its existing `members` data, preserving other entries. |
| Remove users from an existing classic group | Require group ownership and the specific membership resource(s) in that module's state. Remove only the named managed entries. An externally created, unmanaged membership is not removable through this path. |
| Update an existing Identity Domains group's membership | Require group ownership and an existing compatible management mode. On current `main`, this requires `ignore_external_membership_updates = false` already in effect, with the matching state resource address. Preserve other members as described below. |
| Existing Identity Domains group in the default `true` mode | Current implementation uses `lifecycle { ignore_changes = all }`; editing `members` or other attributes will not perform the requested update. Report the upstream limitation through `lifecycle-safety.md` and stop it. |
| Group exists in OCI but is not owned by this Terraform configuration/state | Explain that the module has no direct membership-only input targeting an arbitrary external group. Stop the membership change; do not create another group, import/adopt the group, or generate direct membership resources as a workaround. |

Classic `groups` currently looks up active existing users by username and creates individual `oci_identity_user_group_membership` resources referencing its own `oci_identity_group` resources. There is no external `group_id` input. Its list controls only memberships it manages; removing a name does not remove an external unmanaged membership. Missing or non-unique active usernames can be omitted by its lookup/filter, so do not rely on Terraform to report those inputs as errors.

Identity Domains currently also accepts existing **usernames**, then resolves user IDs internally. Verify the selected ref rather than asking for raw IDs by assumption. Its `ignore_external_membership_updates` setting controls the resource branch for the entire group map, not just one group. The default `true` mode supports initial membership at creation but ignores later changes. The `false` mode manages the configured membership collection and can overwrite external membership changes. Upstream warns that switching modes later recreates the configured groups.

**Do not switch the effective mode, rename/move state addresses, upgrade the module, or recreate a group to force a membership update.** A membership request does not authorize a management-mode migration. Preserve the established mode when adding a new group to an existing module instance; do not change it for existing groups.

## Evidence required before generation

1. Resolve exact group/domain and user identities through read-only OCI MCP. Discover the help/run tools, confirm command syntax before reads, fetch complete relevant membership results, and follow the MCP invocation restrictions in `validation.md` when that file is read at the validation stage. For these early reads: pass only command text after `oci`, omit `oci`, `--profile`, `--auth`, and `--help`, and never use a shell OCI CLI fallback. Do not print credentials or unnecessary user data.
2. For initial assignments and additions, verify that requested usernames exist, are active, and resolve uniquely using the selected module's lookup semantics. An email/display name is not automatically the username. For removals from existing OCI groups, establish the exact managed membership from state and OCI evidence; do not require an offboarded user to be active merely to remove their membership. A confirmed new group's draft-list removal follows the initial-assignment exception above.
3. Before changing an existing OCI group's configuration, establish the selected module instance, logical key, exact group resource address/ID, and membership-management mode from configuration and state. Use current state evidence for the correct project/workspace as required by `lifecycle-safety.md`, or the user's verified address/ID evidence from their approved remote-state inspection process. Never execute Terraform/state/import commands. Configuration presence or finding the group in OCI alone does not establish ownership.
4. An addition requires existing **group** ownership, not a pre-existing state entry for the new membership. A classic membership removal does require that exact membership's state ownership. Identity Domains membership is part of the group resource; do not demand a separate membership resource address there.
5. For existing OCI groups, reconcile configuration, state, and live membership. If the requested membership is already present (for add) or absent (for remove) and there is no conflicting managed/planned change, report no change needed. Do not adopt an externally present membership merely to record it in Terraform. If the sources disagree in a way that affects the requested change, explain and resolve that discrepancy before editing.
6. For classic groups, retain every other configured member and stable map key. Verify that remaining configured usernames still resolve under the selected ref, so the module's filter cannot silently drop unrelated managed memberships. Do not enroll external members into management as part of preserving them; the classic module's individual resources leave them outside this change.
7. For Identity Domains in an existing `false` mode, verify the full current membership against the configured collection before changing it. If external changes or an incomplete baseline would cause unrelated members to be removed or overwritten, stop for reconciliation; do not reset the collection or silently adopt external changes. Once the baseline is verified, apply only the requested named delta and preserve other group attributes and memberships.

Missing tools, forbidden reads, incomplete identity/membership results, unknown ownership, or incompatible/unknown management mode stop the affected membership configuration. The generic MCP-unavailable fallback does not waive these checks. Continue independent authorized work when possible; do not label unsupported configuration as a globally unsupported module.

## Inputs, output, and handoff

Use `input-collection.md` for the eligible module and its [optional-input handling](input-collection.md#optional-input-handling-all-modules). Reuse existing group metadata and applicable optional choices instead of asking for replacements or another general options answer on a membership-only update. `members` is task-required when assigning users, even though it is optional in the schema. A response of "no optional parameters" must not discard requested membership values or reset existing options/mode.

Generate the smallest change to the existing group configuration, or the requested new group and initial members. Include no user-account resources, new policy grants, standalone membership module, or management-mode changes. Read `lifecycle-safety.md` for changes to existing groups/memberships and complete the membership checks in `validation.md` before writing.

Explain the exact additions/removals, which group/domain they target, and whether the result is a configuration change or no change needed. For classic groups, describe only the managed membership delta; never claim that every external membership was replaced. State that generated changes take effect only after the user's Terraform apply, and make no claim of complete DB access revocation from a group removal alone.

## Decision examples

| Request and context | Decision |
| --- | --- |
| "Add Alice to operators" with no established DB purpose | Ask about DB intent before identity lookup or generation. |
| "Create a DB operators group with existing Alice and Bob" | Verify users and selected module support; generate initial memberships without requiring prior group state. |
| "Remove Alice from the new group's initial members" and the user confirms the group has never been applied, with no conflicting evidence | Remove only Alice's planned assignment and preserve/validate the remaining initial members; require no prior group or membership state. |
| "Add Alice" to a module-managed classic DB group containing Bob and Carol | Preserve Bob and Carol; add only Alice after identity/ownership checks. |
| "Remove Alice" where her classic membership is external to Terraform | Explain the membership is unmanaged; generate no ineffective removal or adoption workaround. |
| "Add Alice" to a module-managed domain group with `ignore_external_membership_updates = true` | Explain that the selected upstream implementation ignores attribute updates in this mode; stop the ineffective edit and do not change the flag. |
| Same request with an already-established `false` mode and verified membership baseline | Generate the named addition while preserving the other members and attributes. |
| Group permissions are already covered, but Alice is not a member | Complete eligible membership work; generate no duplicate policy. |
| "Replace all group members with Alice" | Explain the full-list replacement boundary; do not emit a reset disguised as an add. |

## Upstream sources

- [Classic group and membership implementation](https://github.com/oci-landing-zones/terraform-oci-modules-iam/blob/main/groups/main.tf)
- [Classic group inputs](https://github.com/oci-landing-zones/terraform-oci-modules-iam/blob/main/groups/variables.tf)
- [Identity Domains group implementation](https://github.com/oci-landing-zones/terraform-oci-modules-iam/blob/main/identity-domains/groups.tf)
- [Identity Domains membership modes and recreation warning](https://github.com/oci-landing-zones/terraform-oci-modules-iam/tree/main/identity-domains#defining-identity-domain-groups)

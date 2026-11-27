---
name: build-oci-iam-main-tf
description: "Generate or update OCI IAM Terraform using `oci-landing-zones/terraform-oci-modules-iam` specifically to support database (DB) operations. Use for DB-related compartments, groups, existing-user onboarding/offboarding through supported module-managed groups, dynamic groups, policies, and necessary Identity Domains resources within this skill's fixed scope. For DB policy access requests, assess live coverage and relevant configuration evidence before proposing scoped changes. Also check DB intent for ambiguous IAM requests such as 'make a compartment'; ask before proceeding when intent is absent. Exclude standalone user-account administration, unrelated IAM work, unlisted capabilities, and capabilities unsupported by the selected upstream ref."
---

# Build OCI IAM Terraform for DB Operations

Generate only configurations admitted by the [fixed skill allowlist](references/module-support.md) and supported by the selected upstream ref. New upstream modules or capabilities, including resource types added inside an allowed module, do not expand this skill's scope automatically. Default to additive-only changes. Never invent a module path, input name, or resource model, never mutate, replace, rename, move, or re-parent an existing resource unless the user explicitly and unambiguously asks for that exact resource change, and never install or execute Terraform.

## DB operations intent gate

At first use, tell the user: **"This skill `build-oci-iam-main-tf` is for IAM operations to specifically support DB Operations."**

Apply this gate before collecting Terraform inputs, querying OCI, or generating configuration, including when the skill is explicitly invoked:

- Establish the intended database operation from the request or prior conversation. Examples include provisioning ExaDB-D, administering database resources, backup/restore, patching, monitoring, and granting or revoking access for those tasks. ExaDB-D is an example, not the only eligible database service.
- If the purpose is missing or ambiguous, ask: **"Do you intend to use `<requested resource>` to support a DB operation?"** For "Make compartment abc", ask: **"Do you intend to use compartment `abc` for a DB operation, such as provisioning an ExaDB-D system?"** Wait for the answer; do not infer intent from names such as `db-admins` or from the repository name. A missing answer is not confirmation.
- If the user confirms DB use, proceed with the existing workflow. If the request or prior conversation already establishes that purpose, proceed without asking again. Collect the particular DB service, operation, or access scope only when needed to choose resources or permissions.
- If the user says no, or the request explicitly serves an unrelated purpose, explain that it is outside this skill's DB operations scope and stop that portion. Do not generate a general-purpose IAM workaround under this skill.
- Read [references/db-operations-scope.md](references/db-operations-scope.md) and apply its resource-level checks. DB intent does not authorize every upstream feature or a complete IAM stack. Include only requested resources needed for the stated DB operation; omit unrelated components in mixed requests and explain the omission. Reuse suitable existing resources when available.

## User-to-group membership requests: DB onboarding and offboarding

For creating a DB group with existing users, or adding/removing named existing users in a DB group, read [references/group-membership.md](references/group-membership.md) after the DB intent gate and before collecting membership values. Resolve classic IAM versus Identity Domains and verify the selected source ref's membership implementation. Before changing an existing OCI group, require verified ownership in the target Terraform configuration/state and compatible membership-management behavior. Edits to a confirmed unapplied new group's members follow initial assignment, using the draft classification in `lifecycle-safety.md`. Do not recreate or automatically adopt an unmanaged group, create user accounts, or change Identity Domains membership-management mode to force support.

A user-membership-only request follows this route, even when the user describes it as DB access onboarding/offboarding. It does not authorize policy changes or require asking which ExaDB-D resource to provision. If the user also requests checking or granting the group's DB permissions, apply the policy assessment below to that portion; a covered policy result does not cancel requested membership work. Removing a user from a group does not prove all of that user's DB access has been revoked.

## Dynamic groups: establish purpose, resolve membership, derive the rule

For dynamic-group creation or matching-rule changes, read [references/dynamic-group-matching-rules.md](references/dynamic-group-matching-rules.md) after the DB intent gate and before collecting rule syntax. Names and labels such as "database-backup" do not establish DB purpose by themselves. Resolve the intended resource type and exact membership criteria separately from that purpose; the user need not write a matching rule.

Resolve specifically selected existing resources through read-only OCI MCP in their established scope. For Compute instance names, resolve tenancy/region/compartment, list exact-name matches with complete pagination, disambiguate duplicates, and verify selected OCIDs with get operations. Derive only the confirmed ID, compartment, or supported tag predicate; explain future-match behavior. Unverified targets or semantics stop the affected rule generation, even if the user supplies a rule or MCP is unavailable. Metadata-only edits and group deletion follow lifecycle checks without requiring a new rule. Dynamic-group work does not authorize policy changes; evaluate an explicitly requested policy portion separately.

## DB policy access requests: assess before generating

For requests to check or grant a principal's DB permissions through policies, including "Let this group provision ExaDB-D in compartment abc", read [references/policy-access-assessment.md](references/policy-access-assessment.md) after the DB intent gate. This route also applies when the user supplies grant statements or requests a policy template. User-membership-only and dynamic-group-rule-only requests use their respective preceding routes. Policy grant reductions, statement removals, and named policy deletions use the revocation route below; do not turn a requested revocation into a grant.

Establish the resource type, operation, target compartment, and exact principal from available context; ask only for what is missing. For ambiguous ExaDB-D provisioning requests, ask which resource (infrastructure, VM cluster, DB Home, database, or an explicitly requested combination) and which compartment. Inspect live policies, including ancestors and dependency compartments, before deciding whether permissions are missing. The user does not need to write policy statements.

Perform this assessment before requesting a Terraform output directory, policy metadata, or optional module parameters. Use relevant project context already in scope to compare configuration when available; do not search unrelated projects or demand configuration for a current-access-only question. Establish the project/workspace, effective inputs, selected ref, and managed-policy mapping before treating a difference as relevant. Report live access separately from configuration evidence. Neither a mismatch nor state alone proves that current edits are unapplied; use explicit confirmation or reliable evidence tied to the exact configuration/environment, and ask only when uncertain handling matters to the requested work. Then follow the assessment's result:

- **Covered:** label coverage as verified current access or explicitly projected access for requested new resources; add no duplicate grants. Surface any verified relevant configuration difference or unresolved comparison separately; clarify conflicting intent before editing. An explicitly requested or clarified correction to an eligible existing definition can proceed through the assessment's correction path. Request policy-generation-only inputs only for that chosen correction; a current-access-only question ends with findings, while independently requested resource work may continue.
- **Missing permissions confirmed:** for a grant request, derive only the missing statements and continue through the generation workflow below. An access-check-only request ends with the findings.
- **Unverified or blocked by an applicable deny:** explain the unresolved evidence or denial and stop policy generation for that operation. Do not treat an unreadable policy as absent or add allow statements to bypass a deny.

These rules take precedence over the generic MCP-unavailable fallback and the normal input-collection order. Continue other independent, authorized resource work when possible.

## Policy revocation and deletion: report and confirm before editing

For removing/narrowing policy grants, removing statements, or deleting a named policy, read [references/policy-revocation.md](references/policy-revocation.md) after the DB intent gate. Assess relevant grants and ownership, prepare and validate the concrete proposed statement changes or policy deletion, and report expected effects plus residual or unverified access. **Obtain explicit confirmation of that reviewed proposal before editing policy configuration.** An initial revocation/deletion request authorizes investigation and a proposal, not automatic changes to every policy discovered.

If A and B both grant access, report both. Do not remove B by default, silently remove only A, or automatically adopt an unmanaged policy. Wait for the user's concrete choice: eligible edits, an explicitly accepted limited change, further investigation, or no change. Approval to investigate is not approval to edit. An unchanged proposal already confirmed does not require repeated confirmation; a material revision does. Confirmation never waives ownership, support, or DB-scope requirements. Distinguish expected post-apply effects from actual live revocation. Metadata-only policy edits use lifecycle checks; check-only revocation analysis produces findings without files.

## Required generation workflow

1. After the DB intent gate passes, inspect the target before writing.
   - Inspect the project root, its Terraform files, repository documentation, provider/backend setup, and established file layout. A `.tf` file is only one signal; do not assume its presence or absence alone defines the project.
   - For an edit to an existing definition, update, move, recovery, removal, or deletion, read [references/lifecycle-safety.md](references/lifecycle-safety.md) and classify each target as managed, confirmed unapplied draft, unknown, or existing unmanaged before collecting inputs or proposing the change. Use current state evidence for the correct project/workspace or explicit user confirmation of a new, never-applied definition with no conflicting evidence. Missing local state and earlier file generation do not prove a draft. Never modify state or run Terraform/state commands.
   - Treat it as an existing project when the user has placed a project in scope or an established configuration is present. Otherwise, create a minimal configuration in a user-selected target directory; ask for the target if none is available. Do not hardcode or assume a local path, and do not overwrite unrelated files.
   - Before editing an existing resource, require the user's explicit authorization for that exact resource and mutation. For policy-revocation outcome requests, read-only discovery and proposal preparation may proceed first; the concrete proposal and confirmation in `policy-revocation.md` establish the exact authorized edits. For other unclear mutations, ask for confirmation or a narrower request.
   - Read [references/module-support.md](references/module-support.md). Resolve every requested capability against its fixed resource/operation allowlist before mapping it to an exact supported subdirectory. Skill scope, DB relevance, and upstream support are separate requirements.
   - Use that reference's rejection rules: report excluded capabilities as outside this skill's scope, verified upstream absence as unsupported at the selected ref, and incomplete verification as unverified. Stop the affected generation without an alternative implementation or an automatic skill-scope update. Name supported alternatives only when relevant.

2. Select the source revision and collect inputs by module.
   - Read [references/terraform-sources.md](references/terraform-sources.md) before collecting module-specific inputs. In an existing project, reuse the ref already present in that module's source unless the user asks to change it. If no ref is already present and the user has not chosen one, use `main`. Use an explicitly selected tag or commit SHA when provided.
   - Verify that the selected submodule exists at that exact ref. Inspect its `variables.tf` for module argument names and required inputs, and its `README.md` and `SPEC.md` for configuration shape and types. Do not use `main` as a substitute for a selected tag or commit, or treat examples and collection references as authoritative schemas. If documentation conflicts, follow the selected ref's declarations and specifications; resolve any ambiguity before generating.
   - For user-to-group membership work, also inspect the selected ref's membership resources and lifecycle rules as directed by `group-membership.md`. A `members` input alone is not evidence that existing memberships can be updated. For every existing Identity Domains group attribute update, including descriptions/tags, apply [Identity Domains group update support](references/lifecycle-safety.md#identity-domains-group-update-support): verify the effective mode and owned branch, stop ignored updates with the upstream-limitation explanation, and preserve unrelated membership when updates are supported. Confirmed new drafts retain the initial-value flow. For dynamic-group creation or rule changes, verify the selected ref's matching-rule implementation through `dynamic-group-matching-rules.md`.
   - Read the [required-input resolution rules](references/input-collection.md#required-input-resolution-all-modules), then only the relevant module section: compartments, groups, dynamic groups, policies, or Identity Domains. Use it as a collection aid and align every field with the selected ref.
   - Resolve required non-secret values from established context, project inputs, or permitted read-only OCI lookups before asking for missing information. If a required value or target remains missing or ambiguous, ask and wait before generating the affected configuration; never substitute a placeholder or defer an unresolved resource choice to apply time. Use exact supported dependency references for requested new resources whose IDs do not exist yet. Keep secrets external through the selected authentication method or approved secret-input mechanism. For grant policies, derive the missing statements using the completed access assessment; do not ask the user to supply policy syntax.
   - Apply [optional-input handling](references/input-collection.md#optional-input-handling-all-modules): reuse applicable supplied choices, declines, and defaults instructions. For new resources, ask only about genuinely unresolved options; preserve initial partial inputs and resolve only the remainder. When asking, state that unselected new settings use documented defaults/inheritance; an answer selecting options or declining extras then resolves the selection without another general options question. For edits to existing definitions, including unapplied drafts, preserve omitted settings and make only requested changes; do not ask a general options question for a scoped edit. Clarify ambiguous "use defaults" reset intent on updates. Defaults for a new object do not reset shared module settings. Task-required membership/rule values and resource-specific restrictions still apply.
   - Read [references/terraform-sources.md](references/terraform-sources.md) before creating any module block. It defines the canonical Git source format.

3. Validate before generating usable configuration.
   - Read [references/validation.md](references/validation.md) when its checks are needed; no redundant optional-input question is required first. Complete applicable validation after required inputs and relevant optional choices are resolved through supplied values, documented defaults/inheritance, or preservation of existing settings. Wait for any unresolved requested value or ambiguous reset before generating that portion.
   - Apply every applicable validation rule. If a required input remains unresolved or an input is known invalid, pause the affected generation and ask for the missing information or correction. If OCI MCP is unavailable, tell the user that MCP validation was skipped and continue only with non-MCP validation rules for work that does not depend on policy access evidence, verified group-update/membership evidence, or resolved dynamic-group matching criteria. This fallback permits no placeholders, unresolved required inputs, or known invalid values; it cannot waive the grant/revocation, Identity Domains group-update, user-membership, or dynamic-group checks. For revocation, distinguish verified named edits with explicitly accepted residual uncertainty from an unverified effective-revocation claim as required by `policy-revocation.md`.
   - Recheck the target classification from `lifecycle-safety.md`. Managed-resource changes require current state ownership; edits to confirmed new unapplied drafts need no pre-existing state entry. Unknown status requires clarification, and existing unmanaged resources must not be treated as drafts or automatically adopted. Unapplied edits to a managed resource do not make it a new draft. If a dedicated validation section is not yet defined for the selected resource family, apply the common rules and its collection-reference structural checks only; do not invent additional rules.

4. Generate after validation succeeds.
   - For policy grant reductions, statement removals, or deletions, present the validated proposal and obtain the confirmation required by `policy-revocation.md` before writing. Apply only its accepted edits. A blocked policy does not authorize partial edits elsewhere unless the user explicitly chooses that limited result.
   - For user-to-group membership work, apply only the named additions/removals permitted by `group-membership.md`; preserve other members and group settings. Identity Domains description/tag and other attribute edits must also pass the group-update checks in `lifecycle-safety.md`. Do not generate an ineffective update for an ignore-changes resource or a duplicate group/membership.
   - For dynamic-group creation or rule changes, apply `dynamic-group-matching-rules.md`: derive or validate the rule from resolved criteria, preserve unrelated conditions/settings, and show the selected resources or selector scope. Do not infer a broader predicate or add unrequested policies.
   - For policy access work, emit only additions justified by confirmed permission gaps or an explicitly authorized correction to a verified in-scope configuration discrepancy. Keep live access and configuration/deployment-status findings separate. Do not generate duplicates of covered permissions, invent a pending change, silently undo another edit, or declare existing unmanaged policies as new resources.
   - Recheck that each added or changed IAM resource and policy statement supports the established DB operation. Preserve unrelated existing configuration without changing it.
   - Read [references/main-tf-map.md](references/main-tf-map.md) and recheck every emitted module argument and configuration type against the selected source ref.
   - In an existing project, always preserve the repository's established style and layout when adding or mutating a resource: file placement, formatting, naming, variable-data convention, provider/backend configuration, module organization, and Terraform version constraints. Only mutate an existing resource when the user explicitly asks for that exact resource change. Prefer the smallest additive change possible. Update or add `main.tf`, `variables.tf`, and `terraform.tfvars` only when compatible with that setup.
   - In a new project, create exactly `main.tf`, `variables.tf`, and `terraform.tfvars`. Include an OCI provider block and required-provider constraint. Keep authentication values as variables and do not put private keys, API keys, tokens, or passwords in `terraform.tfvars`.
   - Put module source, module wiring, and provider configuration in `main.tf`; declarations and types in `variables.tf`; resolved non-secret values that satisfy the applicable validation rules in `terraform.tfvars`. Do not copy illustrative values or unresolved source-ref markers into generated configuration.

5. Hand off without running commands.
   - Explain how the generated IAM changes support the stated DB operation, and identify any requested items excluded by the DB scope or upstream support boundary.
   - Tell the user Terraform 1.3.0 or later is required by the upstream modules and must be installed before use.
   - Provide, but never run: `terraform init`, `terraform validate`, `terraform plan`, and `terraform apply`.
   - State that `terraform plan` must be reviewed before `terraform apply`.

## Boundaries

- This skill generates IAM configuration for DB operations only. It does not provision database systems, networking, storage, or other service resources, or grant database-internal SQL privileges.
- Incomplete scaffolds or placeholder-filled Terraform templates are outside this skill's output scope. This does not exclude the upstream policies module's template-policy feature, which still requires resolved inputs and the policy access assessment. A confirmed unapplied draft is a deployment-status classification, not an exception to required-input resolution.
- Use only the source repository, subdirectories, resource types, and operations admitted by the fixed allowlist in `module-support.md`. Upstream discovery and confirmed DB intent cannot expand that allowlist.
- Do not silently substitute direct `oci_*` resources for an unavailable submodule.
- User-membership-only requests are supported through eligible group configurations under `group-membership.md`; the absence of a standalone membership module does not by itself make such requests unsupported. Standalone user-account creation/administration, arbitrary unmanaged-group membership changes, and full-list replacement are outside this skill's user-membership workflow. Never invent a `users`/`memberships` module or substitute direct provider resources.
- Cloud Guard security zones and recipes are outside this skill's fixed scope; do not generate them regardless of upstream additions.
- Do not run `terraform`, `tofu`, package-manager, provider-login, or install commands.
- Do not create, modify, replace, move, or delete a state file. Do not create a lock file or `.terraform` directory.

## Reference routing

Read references only along this path; do not load every file for every request.

```text
request
  -> DB intent gate (ask and wait if unclear; stop unrelated work)
  -> db-operations-scope.md (qualify each requested resource)
  -> user-group creation with members / named user add-remove? group-membership.md
       -> resolve identity context, source behavior, ownership, and membership delta
       -> ineligible / unverified: explain and stop that membership change
       -> eligible: continue generation below; no policy work unless also requested
  -> dynamic-group creation / matching-rule change? dynamic-group-matching-rules.md
       -> resolve resource type, scope, identities/predicate, and group ownership
       -> ambiguous / unverified / unsupported: explain and stop the affected change
       -> verified: derive rule; continue below; no policy work unless also requested
  -> policy grant reduction / statement removal / policy deletion? policy-revocation.md
       -> assess evidence and ownership; prepare and validate concrete proposal
       -> report exact edits, impact, and residual/unknown access; wait for confirmation
       -> confirmed eligible edits: write only those edits after validation
       -> investigate / no change / unresolved: no affected policy edits
  -> policy access check/grant? policy-access-assessment.md
       -> covered: report live access; flag relevant configuration evidence/limits
            -> clarify material conflicting intent; only authorized corrections may continue
       -> check-only: explain findings and relevant caveats; no policy generation
       -> unverified / denied: explain and stop that operation's policy generation
       -> confirmed missing grants: derive statements; continue below
       -> other IAM work: continue below
  -> module-support.md
       -> outside fixed skill scope: explain and stop that part
       -> editing an existing definition / lifecycle request? lifecycle-safety.md
            -> classify each target; clarify unknowns; stop unmanaged changes
            -> confirmed draft: configuration edit; managed: ownership/lifecycle checks
       -> supported: terraform-sources.md
            -> select exact source ref and verify module at that ref
            -> absent upstream: report unsupported at that ref; stop that part
            -> verification incomplete: report unverified; pause that part
            -> relevant input reference
            -> validation.md
            -> main-tf-map.md
            -> generate or update the project files
```

| Need at this stage | Read |
| --- | --- |
| Establish DB relevance and choose only necessary IAM resources | [db-operations-scope.md](references/db-operations-scope.md) |
| Create a DB group with existing users or add/remove named members | [group-membership.md](references/group-membership.md) |
| Resolve dynamic-group membership and derive or validate its rule | [dynamic-group-matching-rules.md](references/dynamic-group-matching-rules.md) |
| Check DB access or derive only missing grant statements | [policy-access-assessment.md](references/policy-access-assessment.md) |
| Assess policy revocation/deletion and confirm exact edits before writing | [policy-revocation.md](references/policy-revocation.md) |
| Confirm an exact submodule or reject a request | [module-support.md](references/module-support.md) |
| Classify a draft versus an existing resource; update, move, recover, remove, or delete | [lifecycle-safety.md](references/lifecycle-safety.md) |
| Check whether an existing Identity Domains group attribute update can take effect | [lifecycle-safety.md — Identity Domains group update support](references/lifecycle-safety.md#identity-domains-group-update-support) |
| Select the upstream ref, verify module inputs, and build Git sources | [terraform-sources.md](references/terraform-sources.md) |
| Reuse optional choices, preserve existing settings, or clarify a reset | [input-collection.md — Optional-input handling](references/input-collection.md#optional-input-handling-all-modules) |
| Collect OCI IAM groups | [input-collection.md — Groups](references/input-collection.md#groups) |
| Collect OCI IAM dynamic groups | [input-collection.md — Dynamic groups](references/input-collection.md#dynamic-groups) |
| Collect OCI IAM policies | [input-collection.md — Policies](references/input-collection.md#policies) |
| Collect compartment hierarchy data | [input-collection.md — Compartments](references/input-collection.md#compartments) |
| Collect Identity Domains data | [input-collection.md — Identity Domains](references/input-collection.md#identity-domains) |
| Map validated values to files | [main-tf-map.md](references/main-tf-map.md) |
| Apply the future validation contract | [validation.md](references/validation.md) |

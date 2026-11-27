# OCI IAM input collection reference

Use only after the DB intent gate and resource-level checks in [db-operations-scope.md](db-operations-scope.md) pass. Collect inputs only for the requested IAM resources that support the established DB operation; optional parameters must not introduce unrelated resources or permissions.

The upstream links below point to `main`, which is the default source ref when no other ref is selected. When using `main`, verify names and shapes against its current `variables.tf`, `README.md`, and `SPEC.md` at generation time. If the user or an existing module source selects a different ref, use that ref's files instead; this collection guide and its `main` links are not authoritative for another ref.

## Required-input resolution: all modules

- Resolve inputs required by the selected schema or requested operation, including task-required values in schema-optional fields. Reuse established conversation context, project inputs, and permitted read-only OCI lookups; do not ask again for information already resolved for this target.
- For existing resources identified by name, resolve the exact target in the established tenancy/domain/parent scope. A verified unambiguous match permits using its identifier. Multiple matches require disambiguation; no match or insufficient visibility requires clarification or corrected access. Do not guess an OCID or create the missing resource without a request to do so.
- For explicitly requested new resources, an exact dependency key/reference supported by the selected upstream ref is a resolved input even when its resulting OCID is not yet known. Verify the intended target and dependency wiring. Use Terraform expressions in configuration wiring, not in `.tfvars`; documented literal dependency keys may be data inputs. Do not invent IDs or reference syntax.
- If a required non-secret input remains missing or ambiguous, ask and wait before writing the affected configuration. Do not use dummy values, placeholder strings, empty/null stand-ins, or a newly declared unpopulated variable to defer resolution. Independent authorized work may continue. A literal value or supported reference must still pass its applicable validation rules.
- Resolve optional choices through [optional-input handling](#optional-input-handling-all-modules). An omitted optional value is not a missing required input; declining options does not discard task-required values.
- For secrets, establish the selected authentication method or the project's approved external secret-input mechanism and generate only the supported wiring. Ask for the method if missing, never for secret contents in chat. External secret injection is not a dummy value and does not require reading/disclosing the secret. Keep private keys, tokens, passwords, and comparable secrets out of generated files, examples, and output; identify external supply requirements in the handoff. This exception does not defer required non-secret resource identity or scope.

These rules apply to edits of confirmed unapplied drafts as well as new generation and managed-resource changes. Instructional examples are wiring illustrations, not an incomplete-template output mode. Upstream policy templates remain subject to these same resolution rules and the access assessment.

## Optional-input handling: all modules

Apply this once to the relevant requested resources/settings, using the selected ref's schema and existing project configuration. Reuse applicable answers from the request or conversation, including supplied values, explicit declines, "use defaults for the rest", and "no other changes". Do not re-ask a resolved choice or extend a prior answer beyond the resource/settings it covered.

| Situation | Required behavior |
| --- | --- |
| New resource; user already chose defaults or declined optional settings | Use the selected ref's documented default behavior without another options question. In an existing module, preserve its shared settings and inherited defaults. |
| New resource; optional choices have not been addressed | After required inputs are resolved, ask one concise question about relevant documented options. |
| New resource; user supplied some optional choices without settling the remainder | Retain those exact choices; ask one question offering additional relevant options with documented defaults for anything not selected. Do not re-collect supplied values or assume the remainder was already declined. |
| User supplied options and said "defaults for everything else" for the new resource | Retain the supplied choices and use documented default behavior for the remainder; do not ask again. |
| Edit to an existing definition, including a confirmed unapplied draft | Apply only requested field changes. Preserve omitted optional settings, configured values, references, and existing omissions; no general options question is needed for a scoped edit. |
| "Use defaults" during an update, with unclear reset intent | Ask whether to preserve existing settings or reset specific settings before changing them. Do not treat this phrase as permission to reset the entire configuration. |
| Explicit reset of a named setting | Establish its documented effective default and implement only that requested reset after the applicable checks. If "default" could mean different values or scopes, clarify that specific ambiguity. |

When asking about remaining options, state that unselected new settings will use documented defaults/inheritance. An answer selecting options under that stated arrangement, or declining extras, resolves the selection; then ask only for missing values of the selected options, not another "anything else?" question. This differs from an initial partial input that never addressed the remainder. If the options question remains unanswered, retain supplied choices and wait before generating the affected portion; silence is not a decline. Independent validation can continue. Do not ask generation-only options for a check-only/no-change result or offer unrelated optional edits during a deletion.

Defaults apply per setting and scope, not per directory. Adding a new object to an existing module does not authorize resetting module-wide defaults or existing objects. For a new object's omitted fields, preserve documented inheritance/default behavior rather than inserting guessed values. For existing definitions, omission from the user's message never clears a configured value. A specific new optional value added to an existing object changes only that requested setting.

Treat a reset as an ordinary explicit configuration change: establish its effective result (including inherited defaults), check shared effects, and retain lifecycle/ownership validation and any policy-revocation confirmation requirements. "Use defaults" never bypasses task-required membership/rule values, permits an unsupported membership-mode switch, or authorizes unrelated resources/permissions. Do not silently discard an invalid supplied option in favor of a default; resolve it through validation.

The module-specific questions below are conditional examples, not mandatory scripts. Adapt them to new resources or genuinely unresolved choices under this rule; they do not require every optional field to be supplied. Reading validation rules is not gated on asking a redundant options question.

## Compartments

# Compartments input collection

Use this reference after `module-support.md` confirms `compartments` is supported. Map data exactly to the upstream `compartments_configuration` object; it supports a hierarchy of up to six levels.

Reference location on `main`: [upstream compartments SPEC.md](https://github.com/oci-landing-zones/terraform-oci-modules-iam/blob/main/compartments/SPEC.md). For generation, verify the selected source ref as described above.

## Required inputs

- `tenancy_ocid`;
- `compartments_configuration.compartments`: a map keyed by stable logical keys;
- for every compartment at every hierarchy level: `name` and `description`.

For root (first-level) compartments, collect `default_parent_id` or an explicit `parent_id` when the parent is not the tenancy. Do not infer OCIDs or parent relationships from display names.

## Optional inputs in `compartments_configuration`

- `default_parent_id` — default parent for all first-level compartments;
- `default_defined_tags` and `default_freeform_tags` — defaults for all compartments;
- `enable_delete` — physically delete compartments on destroy; default is `false`;
- per-compartment `parent_id`, `defined_tags`, and `freeform_tags`;
- per-compartment `tag_defaults`, each with `tag_id`, `default_value`, and optional `is_user_required`;
- nested `children` maps, to a maximum of six hierarchy levels.

## Optional module inputs

- `compartments_dependency` — external compartment map, where every entry has an `id` OCID;
- `derive_keys_from_hierarchy` — whether to derive identifying keys from the hierarchy; default is `false`;
- `module_name` — default `iam-compartments`;
- `tags_dependency` — external tag map, where every entry has an `id` OCID.

## Optional-input choices

Apply [optional-input handling](#optional-input-handling-all-modules). Only when relevant choices for a new compartment remain unresolved, ask an adapted question such as:

> Do you want any additional compartment options, such as tags or a parent override? Unselected new settings will use documented defaults/inheritance; existing module settings will stay unchanged.

Reuse prior answers and collect only unresolved selected values. Defaults apply to new unspecified settings; updates preserve existing parents, tags, delete behavior, and other options unless an exact change/reset is requested. Clarify ambiguous reset intent and then validate.

## Structural checks before validation

- Keep stable, unique map keys at every hierarchy level.
- Keep every parent reference resolvable through the tenancy, the hierarchy, or a documented external dependency.
- Reject cycles, orphaned parent references, and a parent that is also its own child.
- Supply `tag_id` and `default_value` for each tag default.
- Do not create a seventh hierarchy level.

## Output discipline

Put user data in `terraform.tfvars` and pass `var.compartments_configuration` (plus any selected optional module inputs) to the module. Keep the module block free of hard-coded topology data.

## Dynamic groups

# OCI IAM dynamic groups input collection

Use this reference after `module-support.md` confirms `dynamic-groups` is supported. For creation or rule changes, first follow [dynamic-group-matching-rules.md](dynamic-group-matching-rules.md) to establish DB purpose, resolve the intended resource membership, and derive or validate the rule. Map only to the upstream `dynamic_groups_configuration` object. Metadata-only edits preserve the existing rule and use lifecycle checks.

Reference location on `main`: [upstream dynamic-groups SPEC.md](https://github.com/oci-landing-zones/terraform-oci-modules-iam/blob/main/dynamic-groups/SPEC.md). For generation, verify the selected source ref as described above.

## Required module input

- `tenancy_ocid`.

## Required dynamic-group configuration

`dynamic_groups_configuration` is optional at the module boundary. For every requested `dynamic_groups` map entry, collect:

- a stable logical key;
- `name`;
- `description`;
- `matching_rule`.

The matching rule defines the resource principals in the group. It is required at generation time, not required as user-authored syntax at intake. Derive it from the resolved membership criteria or validate a supplied rule through `dynamic-group-matching-rules.md`; never infer or broaden membership scope. Preserve valid supplied text that matches the established intent, and explain any required correction.

## Optional dynamic-group configuration

- top-level `default_defined_tags` and `default_freeform_tags`;
- per-group `defined_tags` and `freeform_tags`;
- `module_name`, default `iam-dynamic-groups`.

## Optional-input choices

Apply [optional-input handling](#optional-input-handling-all-modules). Only when relevant choices for a new dynamic group remain unresolved, ask an adapted question such as:

> Do you want any additional dynamic-group options, such as tags or a module name? Unselected new settings will use documented defaults/inheritance; existing module settings will stay unchanged.

Reuse prior answers; preserve existing settings on updates. Declining additional options does not discard task-required matching criteria or prohibit deriving the rule from them. Never invent optional tags or membership scope.

## Structural checks before validation

- Keep logical keys and dynamic-group names unique.
- Require a non-empty matching rule for every group being generated; apply the resolution, syntax, and scope checks in `dynamic-group-matching-rules.md` for new or changed rules.
- Record the resolved resource mapping or selector scope. Preserve valid supplied rule text that matches intent; do not treat textual completeness as proof of verified membership criteria.

## Output discipline

Put validated, non-secret dynamic-group data in the repository's established variable-data location and pass only `tenancy_ocid`, `dynamic_groups_configuration`, and any selected documented module option.

## Groups

# OCI IAM groups input collection

Use this reference after `module-support.md` confirms `groups` is supported. For initial memberships or named additions/removals, first follow [group-membership.md](group-membership.md) to establish DB purpose, identity context, ownership, and eligible behavior. Map only to the upstream `groups_configuration` object. Reuse existing metadata for membership-only updates; do not collect a replacement name or description unnecessarily.

Reference location on `main`: [upstream groups SPEC.md](https://github.com/oci-landing-zones/terraform-oci-modules-iam/blob/main/groups/SPEC.md). For generation, verify the selected source ref as described above.

## Required module input

- `tenancy_ocid`.

## Required group configuration

`groups_configuration` is optional at the module boundary. For every requested `groups` map entry, collect:

- a stable logical key;
- `name`;
- `description`.

## Optional group configuration

- top-level `enable_debug`, default `false`;
- top-level `default_defined_tags` and `default_freeform_tags`;
- per-group `members`: existing OCI user names to assign to the group;
- per-group `defined_tags` and `freeform_tags`;
- `module_name`, default `iam-groups`.

The module looks up existing OCI users and creates memberships tied to its own managed groups; it has no arbitrary external-group input and does not create users. If user-account creation is requested, report the skill-scope exclusion through `module-support.md`; future upstream additions do not change that boundary. `members` is task-required for requested initial assignment or addition even though schema-optional. For removals, collect exact named removals and ownership evidence; do not ask for a replacement list or require the removed account to remain active.

## Optional-input choices

Apply [optional-input handling](#optional-input-handling-all-modules). Only when relevant choices for a new group remain unresolved, ask an adapted question such as:

> Do you want any additional group options, such as tags or debug output? Unselected new settings will use documented defaults/inheritance; existing module settings will stay unchanged.

Reuse prior answers and preserve existing settings on updates. Keep the requested membership delta; declining additional options does not discard it. Initial members are optional only when group creation was requested without membership assignment.

## Structural checks before validation

- Keep group logical keys and names unique.
- For initial assignments/additions, confirm each requested username resolves to one active user under the selected module's lookup semantics. Do not treat a display name or email as a username without evidence.
- Apply all membership ownership, baseline, removal, and unchanged-member checks in `group-membership.md`. Do not add or remove users the request does not name, replace the list, or silently skip unresolved usernames.

## Output discipline

Put validated, non-secret group data in the repository's established variable-data location and pass only `tenancy_ocid`, `groups_configuration`, and any selected documented module option.

## Identity Domains

# Identity Domains input collection

Use this reference after `module-support.md` admits the requested resource type and operation. The skill's Identity Domains scope is limited to the domain, group, dynamic-group, identity-provider, and application configurations below, subject to DB relevance and the existing workflow restrictions. Verify their documented input shapes at the selected upstream ref; neither new upstream configuration objects nor new application types extend this list automatically. Do not infer classic IAM input shapes.

Reference location on `main`: [upstream identity-domains SPEC.md](https://github.com/oci-landing-zones/terraform-oci-modules-iam/blob/main/identity-domains/SPEC.md). For generation, verify the selected source ref as described above.

## Required module input

- `tenancy_ocid`.

All configuration objects below are optional at the module boundary. Collect one only when the user requests that resource family. Use stable logical keys for every map entry.

## Identity domains: `identity_domains_configuration`

For every `identity_domains` map entry, collect:

- `display_name`;
- `description`;
- `license_type`;
- `allow_signing_cert_public_access`.

Documented optional configuration:

- defaults: `default_compartment_id`, `default_defined_tags`, `default_freeform_tags`;
- per-domain `compartment_id`, `home_region`, `admin_email`, `admin_first_name`, `admin_last_name`, `admin_user_name`;
- `is_hidden_on_login`, `is_notification_bypassed`, `is_primary_email_required`;
- per-domain `defined_tags`, `freeform_tags`, and `replica_region`.

## Domain groups: `identity_domain_groups_configuration`

For memberships, follow [group-membership.md](group-membership.md) before collecting member values. Distinguish initial assignment to a requested new group from an existing-group update; the latter requires verified ownership and compatible mode.

For every `groups` map entry, collect:

- `name`;
- the identity domain to use, either the configuration's `default_identity_domain_id` or the entry's `identity_domain_id`.

Documented optional configuration:

- top-level `ignore_external_membership_updates` (default `true`), `default_defined_tags`, and `default_freeform_tags`; the membership mode is preserved for existing module instances and must not be changed to enable an update;
- per-group `description`, `requestable`, `members`, `defined_tags`, and `freeform_tags`.

Verify the selected ref's member input and lookup implementation. Current `main` takes existing usernames in the chosen domain and resolves IDs internally; do not ask for raw IDs by assumption. Verify active, uniquely resolved users for initial assignment/addition. For every existing-group attribute update, including descriptions/tags, apply [Identity Domains group update support](lifecycle-safety.md#identity-domains-group-update-support). On checked `main`, the default `true` branch uses `ignore_changes = all`: initial values are used at creation, but later attribute edits are ignored. Report this as an upstream implementation limitation in that mode. An already-established update-capable branch must preserve unrelated attributes and pass the applicable complete membership-baseline checks, including for metadata-only edits. Never switch modes or reset the list as a shortcut. Confirmed unapplied drafts retain their initial-value edit path.

## Domain dynamic groups: `identity_domain_dynamic_groups_configuration`

For creation or rule changes, first follow [dynamic-group-matching-rules.md](dynamic-group-matching-rules.md). Resolve the identity domain separately from the member resources' tenancy/region/compartment scope; verify the selected ref's dynamic-group implementation rather than applying human-group membership-mode assumptions.

For every `dynamic_groups` map entry, collect:

- `name`;
- `matching_rule`;
- the identity domain to use, through `default_identity_domain_id` or `identity_domain_id`.

Documented optional configuration: top-level default defined/freeform tags, plus per-group `description`, `defined_tags`, and `freeform_tags`. Derive or validate `matching_rule` from resolved criteria through `dynamic-group-matching-rules.md`; the user need not supply its syntax. Do not invent or broaden membership scope.

## Identity providers: `identity_domain_identity_providers_configuration`

For every `identity_providers` map entry, collect:

- `name`;
- `enabled`;
- `add_to_default_idp_policy`;
- the identity domain to use, through `default_identity_domain_id` or `identity_domain_id`.

Documented optional configuration:

- `description`, `icon_file`, `name_id_format`, `user_mapping_method`, `user_mapping_store_attribute`, and `assertion_attribute`;
- `idp_metadata_file`; or manually supplied IdP metadata: `identity_domain_idp_id`, issuer URI, SSO URL/binding, signing/encryption certificates, and global-logout settings;
- `signature_hash_algorithm` and `send_signing_certificate`.

Use either metadata-file input or manual metadata fields only as supported by the chosen provider type. Do not put private signing keys or secrets in Terraform files.

## Applications: `identity_domain_applications_configuration`

For every `applications` map entry, collect:

- `name`;
- `display_name`;
- `type`: one of the documented application types (`SAML`, `Mobile (public)`, `Confidential`, `SCIM`, `FusionApps`, or `GenericSCIM`);
- the identity domain to use, through `default_identity_domain_id` or `identity_domain_id`.

Documented optional configuration is extensive. Ask only for options applicable to the selected application type:

- common: description, active state, application group IDs, URLs, display/access settings, authorization enforcement, tags;
- OAuth client: grant types, HTTPS policy, redirect/logout URLs, client type, certificate, introspection/on-behalf-of settings, encryption, consent, client IPs, resources, roles;
- OAuth resource server: token/refresh settings, audiences, and scoped permissions;
- SAML: service-provider ID, entity/assertion-consumer URLs, name-ID settings, signing/encryption, single logout, attribute mappings, app links;
- Fusion, web-tier, SCIM, and catalogue-app provisioning: service URLs, policy JSON, connectivity, synchronization, SCIM HTTP settings, and Fusion administrator/settings fields.

Treat application `client_secret`, `fa_admin_password`, custom authorization headers, certificates, and comparable values as secrets. Do not put them in `terraform.tfvars`, source control, chat output, or examples; use the project's approved secret-input mechanism.

## Optional module inputs and dependencies

- `compartments_dependency`: external compartment map; every entry must contain an `id` OCID;
- `identity_domains_dependency`: external identity-domain map; every entry must contain an `id`;
- `module_name`, defaulting to `iam-identity-domains`.

## Optional-input choices

Apply [optional-input handling](#optional-input-handling-all-modules) separately to each requested resource family. Only when relevant choices for new resources remain unresolved, ask an adapted question such as:

> Do you want any additional documented options for these new Identity Domains resources? Unselected new settings will use documented defaults/inheritance; existing module settings will stay unchanged.

Reuse prior answers; ask only unresolved type-specific questions relevant to the requested resource. Do not offer membership-mode changes for an existing group/module instance. Preserve existing values/mode on updates and retain task-required membership values. Never invent optional values or reset existing options because the user declined additional ones.

## Structural checks before validation

- Keep logical keys unique across each configuration map.
- Ensure every referenced identity-domain ID is supplied directly, inherited from a documented default, or resolved through an approved dependency.
- Require the documented mandatory fields for every requested entry, including dynamic-group matching rules and identity-provider booleans.
- Keep application type and its optional protocol/provisioning settings consistent; do not apply SAML, OAuth, SCIM, or Fusion fields to an unrelated app type.
- Keep Identity Domains resources separate from classic OCI IAM resources unless the user explicitly requests both module families.
- For all existing domain-group attribute updates, apply `lifecycle-safety.md` group-update checks; metadata-only edits are not exempt. For named membership changes, also apply `group-membership.md`; preserve other members and group attributes and stop on unverified external drift.

## Output discipline

Put validated non-secret configuration data in the repository's established variable-data location. Pass only selected configuration objects and documented dependencies to the module; do not add unrequested resource families or undocumented arguments.

## Policies

# OCI IAM policies input collection

Use this reference after `module-support.md` confirms `policies` is supported. For access checks and grants, first complete [policy-access-assessment.md](policy-access-assessment.md); collect generation inputs only for confirmed permission gaps or an explicitly authorized correction to a verified in-scope configuration discrepancy. A current-access-only question needs no generation inputs. For grant reductions, statement removals, or policy deletions, follow [policy-revocation.md](policy-revocation.md): inspect and reuse existing metadata, prepare and validate the exact proposed edit, report effects and residual access, then obtain confirmation before writing. Map only to upstream `policies_configuration`. Use direct `supplied_policies` for derived or user-supplied grants; new template policies require an explicit request and the same grant assessment. Preserve the existing direct/template mode for eligible corrections and revocation edits; do not migrate it as a shortcut.

Reference location on `main`: [upstream policies SPEC.md](https://github.com/oci-landing-zones/terraform-oci-modules-iam/blob/main/policies/SPEC.md). For generation, verify the selected source ref as described above.

## Required module input

- `tenancy_ocid`.

## Direct policies: `supplied_policies`

For every direct policy map entry being emitted or retained, establish:

- a stable logical key;
- `name`;
- `description`;
- `compartment_id`: the policy attachment compartment (a literal OCID or documented dependency reference), distinct from the target compartments named in statements;
- `statements`: for grants, complete statements justified by confirmed permission gaps or the exact authorized configuration correction, including any user-supplied statements checked through the assessment; for reductions, the exact retained/narrowed statements from the reviewed proposal. The user need not supply OCI policy syntax. Removing an entry does not require collecting new metadata for it, but its identity, contents, ownership/classification, effects, and confirmation must be established.

Optional per-policy fields: `defined_tags` and `freeform_tags`.

Derive statements only within the established DB operation and resolved scopes. Preserve needed user-supplied statements; explain redundancy or propose corrections as specified in the access assessment. Do not silently rewrite supplied statements, expand permissions, or invent target scopes. Resolve policy placement separately from access scope.

For revocation, preserve unrelated statements and settings. If the last statement is to be removed, propose whole-policy deletion explicitly and obtain its confirmation instead of emitting an empty policy. For an existing template policy, verify the complete effects of the selected role/toggle edit and include them in the proposal; do not disable unrelated template-generated grants.

## Template policies: `template_policies`

Use template policies only when the user requests the upstream policy templates. Documented optional settings include:

- tenancy-level `groups_with_tenancy_level_roles`, with a group `name` and `roles` value;
- tenancy-level OCI-service toggles for all policies, scanning, Cloud Guard, OS Management, block storage, file storage, OKE, streaming, and object storage;
- tenancy-level `policy_name_prefix`;
- compartment-level `supplied_compartments`, each with `name`, `id`, and required `cislz_metadata` map.

Do not invent template roles, service toggles, compartment metadata, or template policy targets. Consult the upstream module README for the required `cislz_metadata` shape before generating template policies.

## Other optional module and configuration inputs

- `enable_cis_benchmark_checks` in `policies_configuration`, default `true`;
- `policy_name_prefix`, `policy_name_suffix`, `defined_tags`, and `freeform_tags` in `policies_configuration`;
- `compartments_dependency`, where every external compartment map entry has an `id` OCID;
- `enable_debug`, default `false`;
- `enable_output`, default `true`;
- `module_name`, default `iam-policies`.

## Optional-input choices

Apply [optional-input handling](#optional-input-handling-all-modules). Only when relevant choices for new policies remain unresolved, ask an adapted question such as:

> Do you want any additional policy options, such as tags or a name prefix/suffix? Unselected new settings will use documented defaults/inheritance; existing module settings will stay unchanged.

Reuse prior answers and preserve existing settings on updates; a scoped statement edit or deletion does not require a general optional-parameters question. Declining additional options does not prohibit deriving task-required statements from the completed assessment. An explicit reset affecting policy grants must also follow `policy-revocation.md` when it narrows/removes grants. Do not invent roles, scopes, template settings, or optional values.

## Structural checks before validation

- Keep policy keys and policy names unique within their target scope.
- For policy access work, require live coverage evidence plus confirmed gaps or the verified configuration discrepancy and explicit intent authorizing its correction, as defined in `policy-access-assessment.md`. Do not substitute syntactic completeness for evidence or infer apply status from a mismatch.
- For grant reductions/removals/deletions, validate the exact proposed edits and ownership through `policy-revocation.md`; require confirmation of that reviewed proposal before writing, including explicit acceptance of any limited result.
- Require at least one complete statement for every retained/emitted supplied policy; delete an entry only through an explicitly confirmed whole-policy deletion.
- Ensure every compartment ID is supplied directly or resolves through a documented dependency.
- Do not mix template and supplied policy data unintentionally; retain each mode's map/object structure.

## Output discipline

Put validated, non-secret policy data in the repository's established variable-data location. Pass only documented module inputs and preserve the project's existing policy-data style.

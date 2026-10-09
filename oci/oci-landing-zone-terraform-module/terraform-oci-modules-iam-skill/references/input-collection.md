# OCI IAM input collection reference

## Compartments

# Compartments input collection

Use this reference after `module-support.md` confirms `compartments` is supported. Map data exactly to the upstream `compartments_configuration` object; it supports a hierarchy of up to six levels.

Source of truth: [upstream compartments SPEC.md](https://github.com/oci-landing-zones/terraform-oci-modules-iam/blob/main/compartments/SPEC.md). Re-check it before generating when a requested attribute is not covered here.

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

## Mandatory optional-input question

After collecting all required inputs and before reading `validation.md`, ask:

> Do you want to provide any optional compartment parameters—parent override, tags, tag defaults, nested children, delete behavior, external dependencies, derived keys, or module name?

If the user declines, use only documented defaults; do not invent optional values. If they provide options, collect their exact values and then continue to validation.

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

Use this reference after `module-support.md` confirms `dynamic-groups` is supported. Map only to the upstream `dynamic_groups_configuration` object.

Source of truth: [upstream dynamic-groups SPEC.md](https://github.com/oci-landing-zones/terraform-oci-modules-iam/blob/main/dynamic-groups/SPEC.md). Re-check it before generating when a requested attribute is not covered here.

## Required module input

- `tenancy_ocid`.

## Required dynamic-group configuration

`dynamic_groups_configuration` is optional at the module boundary. For every requested `dynamic_groups` map entry, collect:

- a stable logical key;
- `name`;
- `description`;
- `matching_rule`.

The matching rule defines the resource principals in the group. Collect it exactly as approved; do not infer, normalize, broaden, or combine matching rules.

## Optional dynamic-group configuration

- top-level `default_defined_tags` and `default_freeform_tags`;
- per-group `defined_tags` and `freeform_tags`;
- `module_name`, default `iam-dynamic-groups`.

## Mandatory optional-input question

After collecting required dynamic-group data and before reading `validation.md`, ask:

> Do you want to provide optional dynamic-group parameters—default tags, per-group tags, or module name?

If the user declines, use documented defaults only; never invent optional tags or a matching rule.

## Structural checks before validation

- Keep logical keys and dynamic-group names unique.
- Require a non-empty matching rule for every group.
- Preserve the user's exact matching-rule text and record its intended OCI resource scope.

## Output discipline

Put validated, non-secret dynamic-group data in the repository's established variable-data location and pass only `tenancy_ocid`, `dynamic_groups_configuration`, and any selected documented module option.

## Groups

# OCI IAM groups input collection

Use this reference after `module-support.md` confirms `groups` is supported. Map only to the upstream `groups_configuration` object.

Source of truth: [upstream groups SPEC.md](https://github.com/oci-landing-zones/terraform-oci-modules-iam/blob/main/groups/SPEC.md). Re-check it before generating when a requested attribute is not covered here.

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

The module looks up existing OCI users and creates group memberships. It does not create users. If the request needs a user to be created, report that the Terraform module for classic IAM users is not supported.

## Mandatory optional-input question

After collecting required group data and before reading `validation.md`, ask:

> Do you want to provide optional group parameters—existing members, tags, debug output, or module name?

If the user declines, use documented defaults only; never invent members, tags, or optional values.

## Structural checks before validation

- Keep group logical keys and names unique.
- Confirm every requested member is an existing OCI user name; do not treat a display name or email as a user name without confirmation.
- Do not add memberships for users the request does not name.

## Output discipline

Put validated, non-secret group data in the repository's established variable-data location and pass only `tenancy_ocid`, `groups_configuration`, and any selected documented module option.

## Identity Domains

# Identity Domains input collection

Use this reference after `module-support.md` confirms `identity-domains` is supported. Map only to the upstream module's documented input objects. It supports identity domains, domain groups, dynamic groups, identity providers, and applications; do not infer classic IAM input shapes.

Source of truth: [upstream identity-domains SPEC.md](https://github.com/oci-landing-zones/terraform-oci-modules-iam/blob/main/identity-domains/SPEC.md). Re-check it before generating when a requested attribute is not covered here.

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

For every `groups` map entry, collect:

- `name`;
- the identity domain to use, either the configuration's `default_identity_domain_id` or the entry's `identity_domain_id`.

Documented optional configuration:

- top-level `ignore_external_membership_updates` (default `true`), `default_defined_tags`, and `default_freeform_tags`;
- per-group `description`, `requestable`, `members`, `defined_tags`, and `freeform_tags`.

Group members must be the identifiers expected by the current upstream module; do not assume classic IAM user names work here.

## Domain dynamic groups: `identity_domain_dynamic_groups_configuration`

For every `dynamic_groups` map entry, collect:

- `name`;
- `matching_rule`;
- the identity domain to use, through `default_identity_domain_id` or `identity_domain_id`.

Documented optional configuration: top-level default defined/freeform tags, plus per-group `description`, `defined_tags`, and `freeform_tags`. Do not invent or broaden matching rules.

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

## Mandatory optional-input question

After collecting required inputs for each requested resource family and before reading `validation.md`, ask:

> Do you want to provide any documented optional Identity Domains parameters—for defaults, tags, membership handling, application protocol settings, identity-provider metadata, replication, dependencies, or module name?

Then ask only the type-specific follow-up questions relevant to the requested domain, group, dynamic-group, identity-provider, or application configuration. If the user declines, use documented defaults only; never invent optional values.

## Structural checks before validation

- Keep logical keys unique across each configuration map.
- Ensure every referenced identity-domain ID is supplied directly, inherited from a documented default, or resolved through an approved dependency.
- Require the documented mandatory fields for every requested entry, including dynamic-group matching rules and identity-provider booleans.
- Keep application type and its optional protocol/provisioning settings consistent; do not apply SAML, OAuth, SCIM, or Fusion fields to an unrelated app type.
- Keep Identity Domains resources separate from classic OCI IAM resources unless the user explicitly requests both module families.

## Output discipline

Put validated non-secret configuration data in the repository's established variable-data location. Pass only selected configuration objects and documented dependencies to the module; do not add unrequested resource families or undocumented arguments.

## Policies

# OCI IAM policies input collection

Use this reference after `module-support.md` confirms `policies` is supported. Map only to the upstream `policies_configuration` object. Choose direct supplied policies, template policies, or both only when the user explicitly requests them.

Source of truth: [upstream policies SPEC.md](https://github.com/oci-landing-zones/terraform-oci-modules-iam/blob/main/policies/SPEC.md). Re-check it before generating when a requested attribute is not covered here.

## Required module input

- `tenancy_ocid`.

## Direct policies: `supplied_policies`

For every directly supplied policy map entry, collect:

- a stable logical key;
- `name`;
- `description`;
- `compartment_id` (a literal OCID or documented dependency reference);
- `statements` as one or more complete OCI policy statements.

Optional per-policy fields: `defined_tags` and `freeform_tags`.

Do not rewrite policy statements, expand their permissions, or choose a compartment scope on the user's behalf.

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

## Mandatory optional-input question

After collecting the required direct-policy or template-policy data and before reading `validation.md`, ask:

> Do you want to provide optional policy parameters—CIS checks, tags, name prefix/suffix, template settings, compartment dependencies, debug/output controls, or module name?

If the user declines, use documented defaults only; do not invent policies, roles, scopes, template settings, or optional values.

## Structural checks before validation

- Keep policy keys and policy names unique within their target scope.
- Require at least one complete statement for every supplied policy.
- Ensure every compartment ID is supplied directly or resolves through a documented dependency.
- Do not mix template and supplied policy data unintentionally; retain each mode's map/object structure.

## Output discipline

Put validated, non-secret policy data in the repository's established variable-data location. Pass only documented module inputs and preserve the project's existing policy-data style.

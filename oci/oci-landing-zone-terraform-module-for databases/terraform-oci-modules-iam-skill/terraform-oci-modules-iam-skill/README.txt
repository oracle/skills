Build OCI IAM Terraform for DB Operations
========================================

This skill safely generates or updates Terraform root configuration for OCI IAM
specifically to support database (DB) operations, using only supported modules from:
https://github.com/oci-landing-zones/terraform-oci-modules-iam

It supports DB-related compartment hierarchies, classic IAM groups (including
assigning existing users), dynamic groups, IAM policies, and necessary Identity
Domains resources. All five module families can support DB operations; none
must be created for every DB task. Unrelated IAM work is outside this skill.
Its resource types and operations are limited by the fixed allowlist in
module-support.md. New upstream modules or capabilities, including new resource
types inside an allowed module, are not included automatically. Extending scope
requires a separate explicit skill update; DB intent or an ordinary Terraform
request does not authorize one. Selected-ref checks verify implementation and
input schemas for already allowed work.
For DB onboarding/offboarding, it assigns existing users to requested new groups
or makes named additions/removals through eligible module-managed groups.
Existing groups require verified configuration/state ownership and compatible
membership-management behavior. It does not administer standalone user accounts,
target arbitrary unmanaged groups, replace entire membership lists, or manage
Cloud Guard security zones/recipes. It distinguishes unavailable upstream
capabilities from an ineligible group/mode and this skill's scope boundaries.

How this skill works
---------------------

1. States: "This skill build-oci-iam-main-tf is for IAM operations to specifically
   support DB Operations." If the request and prior conversation do not establish
   DB intent, asks whether the requested resource will support a DB operation and
   waits for an answer. A confirmed DB purpose allows the workflow to continue;
   an unrelated purpose is outside scope. Previously established DB intent does
   not need to be confirmed again.
2. Uses db-operations-scope.md to qualify each requested resource. Membership
   requests follow group-membership.md to resolve the identity context, selected
   module behavior, ownership, and named changes. Membership-only work does not
   trigger new policies. For policy access checks/grants, follows
   policy-access-assessment.md: establishes the DB
   resource, operation, target compartment, and group/principal; inspects live
   policies in the target, ancestors, tenancy, and dependency scopes; and
   compares required permissions with applicable statements and conditions.
   Covered live access needs no duplicate grants. Relevant in-scope configuration
   evidence is reported separately; a mismatch does not prove an unapplied edit.
   Confirmed missing grants or an explicitly authorized correction to a verified
   configuration discrepancy can proceed to generation. Unverified coverage or
   an applicable deny stops speculative grants. Check-only requests end with
   live findings and any relevant configuration caveats.
   Before generation, inspects the target project and confirms module support.
3. Selects the source ref using terraform-sources.md, verifies the module schema
   at that ref, and collects required inputs using input-collection.md. For
   grants, derives only missing policy statements; the user need not supply
   policy syntax. Policy placement is distinct from the grant's target scope.
4. Reuses applicable optional choices and defaults/decline answers. For new
   resources, asks only about unresolved options and states the default treatment
   of unselected settings. Scoped updates preserve existing options without a
   general options question. Ambiguous reset requests are clarified; named resets
   retain lifecycle and resource-specific checks. Validates the resolved inputs
   with validation.md without requiring a redundant question first.
5. For policy grant reductions, statement removals, or policy deletions, follows
   policy-revocation.md: assesses relevant grants and ownership, prepares and
   validates a concrete proposal, reports effects and remaining/unknown access,
   and waits for confirmation before editing. Neither discovering another grant
   nor approval to investigate it authorizes changing that policy. An unchanged
   concrete proposal already confirmed does not require repeated confirmation.
   Uses main-tf-map.md to generate the smallest DB-related IAM configuration
   change, explaining each resource's DB purpose and any excluded requests.
6. Does not run or install Terraform. Hands off terraform init, validate, plan,
   and apply for the user to run; Terraform 1.3.0 or later is required and the
   plan must be reviewed before applying.


How to use
----------

Unzip this folder and put the /references and SKILL.md in a folder named `build-oci-iam-main-tf`

Load this skill for DB-related OCI IAM Terraform using the
`oci-landing-zones/terraform-oci-modules-iam` repository, or to check DB intent
when an IAM request is ambiguous. It is not a general-purpose IAM skill.

For "Make compartment abc", the agent asks whether abc is intended for a DB
operation, such as provisioning ExaDB-D. For "Make compartment abc for ExaDB-D",
it proceeds without asking about DB intent again. A compartment for an unrelated
website is outside scope. Dynamic groups and Identity Domains resources are
included only when needed for the requested DB access or automation workflow.

For "Let this group provision ExaDB-D in abc", the agent establishes which
ExaDB-D resource is intended and resolves the group and compartment, asking only
for missing details. It checks existing/inherited policy coverage before
generating additions. Covered live access alone requires no Terraform-only inputs;
these are collected only if a specific eligible configuration correction is also
requested/chosen. Unreadable policies are not treated as missing permissions.

When relevant configuration is already in scope, the agent establishes its
project/workspace, effective inputs, selected ref, and managed-policy mapping
before comparing it with OCI. It reports current access and observed differences
separately. Files, state entries, and mismatches alone do not prove apply history;
an unapplied-change label requires explicit confirmation or reliable evidence
tied to the exact configuration/environment. Material unclear intent is resolved
before edits. The agent does not silently undo changes or add duplicate policies.
A current-access-only question does not require searching other projects or
establishing apply history.

For "Add Alice to the DB operators group", it verifies the existing group and
user identities, module/state ownership, and update behavior before changing
member data. It preserves other members. A classic removal also needs ownership
of that specific membership. For every existing Identity Domains group attribute
update, including description/tags, the agent checks the selected implementation,
effective mode, and owned resource branch. The checked upstream true-mode branch
uses ignore_changes = all, so it ignores later attribute updates. The agent
explains this as an upstream implementation limitation and stops ineffective
edits; it does not switch modes or recreate the group. An update-capable branch
must preserve unrelated attributes and memberships, including checking the
membership baseline for metadata-only edits. Confirmed unapplied drafts still
permit changes to initial values. When policy access is also requested, the
membership and policy portions are evaluated separately.

For "Remove this group's ability to create VM clusters in demo", it reports all
relevant grants found and proposes scoped, supported changes. If policies A and B
both grant access but only A is managed here, it reports the limitation and waits
for the user's choice. It does not remove B by default, silently implement only A,
or import an unmanaged policy. An A-only edit requires explicit acceptance that
access remains through B. A named "delete policy A" request also receives a
concrete contents/ownership/impact review and confirmation before file edits.
Generated configuration is an expected post-apply change, not live revocation.

For dynamic-group creation or matching-rule changes, DB purpose and membership
criteria are established separately. "Instances that perform database backups"
states a purpose; an unexplained "database-backup" label requires clarification.
For named Compute instances, the agent resolves tenancy/region/compartment,
fetches all exact-name matches, asks about duplicates, and verifies selected
OCIDs with get operations. It derives the rule from verified scope; the user
need not write syntax. Compartment/tag selectors describe future matches as well
as current resources. Missing evidence stops affected rule generation. Policies
are handled only when also requested, and human-group membership-mode flags are
not applied to dynamic groups by assumption.

After loading, the agent reads `SKILL.md` first and follows its reference-routing
workflow: establish DB intent, qualify resources, verify membership eligibility
or dynamic-group criteria, assess policy access as requested, and enter generation
only when needed. Generation confirms
support, resolves required inputs and applicable optional choices, validates, then makes the
smallest safe Terraform change. The agent must not run or install Terraform.
When configuration is generated, it hands off `terraform init`, `terraform
validate`, `terraform plan`, and `terraform apply` for the user to run.
Terraform 1.3.0 or later is required; review the plan before applying it.

Required non-secret inputs must be resolved from context, project inputs, or
permitted read-only OCI lookups. Missing or ambiguous required inputs stop the
affected generation for clarification; the agent does not emit placeholder-filled
configuration. Supported dependency references may supply future resource IDs.
Secrets remain external through the selected authentication method or approved
secret-input mechanism. These rules also apply to unapplied drafts. Incomplete
template output is outside scope; the upstream policies module's template-policy
feature remains supported with resolved inputs and the required access assessment.

The skill is additive by default. It preserves existing project layout and does
not modify Terraform state. Before editing an existing definition, it classifies
each target using lifecycle-safety.md: managed, confirmed new unapplied draft,
unknown, or existing unmanaged. Current state ownership is required for managed
resource changes. Explicit user confirmation of a new, never-applied definition
with no conflicting evidence permits a draft edit without a state entry. Missing
local state or earlier file generation alone proves neither status. Unknowns need
clarification; existing unmanaged resources are not treated as drafts or adopted.
Unapplied edits to a managed resource retain its lifecycle checks. Removing a
confirmed draft cancels planned creation rather than deleting an OCI resource.


Reference files
---------------

db-operations-scope.md
  DB relevance criteria for each module family, access-scope guidance, and
  example decisions for ambiguous, eligible, unrelated, and mixed requests.

policy-access-assessment.md
  Resource/operation/compartment/principal intake, read-only live policy
  inspection, inherited and dependency access, condition and deny evaluation,
  and the covered/missing/unverified/denied outcomes. Derives only missing
  grants or makes explicitly authorized corrections to verified configuration
  discrepancies. Separates live access, configuration evidence, and known versus
  unknown apply status without turning access checks into configuration edits.

policy-revocation.md
  Separates access-outcome requests from named policy changes. Assesses applicable
  grants and ownership; prepares concrete statement/deletion proposals; requires
  confirmation before edits; and reports residual or unverified access. Defines
  limited changes, investigation-only choices, unmanaged policies, and confirmation
  reuse without automatic partial changes or adoption.

group-membership.md
  DB onboarding/offboarding through supported group configurations. Separates
  initial assignment, named additions/removals, unmanaged groups, and unsupported
  full-list replacement. Defines classic membership ownership and Identity
  Domains management-mode/baseline checks without automatic mode changes.

dynamic-group-matching-rules.md
  Separates DB purpose from membership criteria; resolves named Compute instances
  through scoped, paginated list and OCID get operations; handles ambiguity,
  supported selectors, supplied rules, future references, and managed updates.
  Derives matching syntax without broadening scope or automatically adding policies.

module-support.md
  The fixed skill allowlist, applied after DB relevance is established: exact
  module directories and allowed resource types/workflows for compartments,
  groups, dynamic-groups, policies, and identity-domains. Upstream additions do
  not extend it. Distinguishes skill-scope exclusions, verified upstream absence
  at the selected ref, and incomplete support verification in rejection wording.

input-collection.md
  Module-specific input checklist and structural checks. Its sections cover
  compartments, groups, dynamic groups, policies, and Identity Domains. It
  distinguishes required data from optional parameters, handles secrets safely,
  reuses resolved optional choices, preserves existing settings on updates, and
  asks only about unresolved choices or ambiguous reset intent. New settings use
  documented defaults/inheritance without resetting shared module settings.

terraform-sources.md
  The canonical Git module source format, approved module paths, version-pin
  guidance, and integration rules for existing repositories or a new minimal
  Terraform workspace.

validation.md
  The validation contract: tenancy OCID checks through the OCI MCP interface,
  per-target classification and managed-resource state requirements, compartment
  hierarchy checks, and safe behavior when validation is missing or fails.

main-tf-map.md
  Rules for mapping validated data into main.tf, variables.tf, and
  terraform.tfvars. It explains when to extend an existing module versus add a
  supported module block, while preserving repository conventions.

lifecycle-safety.md
  Classifies edits as confirmed unapplied drafts, managed resources, unknowns,
  or existing unmanaged resources. Defines draft editing and the guardrails for
  Identity Domains group attribute updates, including metadata, ignored-change
  behavior, upstream-limitation reporting, and membership preservation. Covers
  managed updates, moves, recovery, removal, and deletion, including state
  ownership, dependencies, compartment deletion staging, and plan review.

Quick reference flow
--------------------

request -> DB intent gate -> db-operations-scope.md ->
membership request: group-membership.md -> eligible named change or explanation
dynamic-group creation/rule change: dynamic-group-matching-rules.md -> resolved rule
policy revocation/removal: policy-revocation.md -> validated proposal -> confirmation
policy access check/grant: policy-access-assessment.md -> findings or confirmed gaps

For eligible membership changes, confirmed missing grants, approved revocation edits,
and other requested configuration:
module-support.md -> terraform-sources.md + exact-ref schema ->
relevant input-collection.md section -> validation.md -> main-tf-map.md ->
generate DB-related IAM configuration

For edits to existing definitions and lifecycle changes, read lifecycle-safety.md
and classify each target before collecting inputs. Apply the corresponding
validation.md checks before proposing a configuration change.

# Security Zones Skill Scenario Tests

This is a maintainer regression checklist for the database-operation gate and database-focused custom recipes. Each case was manually walked through against `SKILL.md` and its references on 2026-11-16.

These are instruction-level scenario checks, not automated model evaluations. No OCI calls, Terraform commands, or resource changes were performed during this review.

| ID | User scenario | Expected behavior | Review |
| --- | --- | --- | --- |
| 1 | "Create a Security Zone for my production compartment." No Database Service operation is stated. | Do not start the Security Zones workflow. Ask what specific Database Service operation the user intends to perform after applying the configuration. | Pass |
| 2 | "I may use this for a database later." No operation or target compartment is stated. | Treat this as hypothetical intent. Ask for the specific follow-on operation and its compartment, then pause. | Pass |
| 3 | "After applying this, I will provision a Database Service resource in compartment C." The user has not named a specific resource type. | The stated operation and compartment satisfy the gate if they are clear. Do not require a resource-type label merely to create the zone. Ask for the type only if needed to clarify the operation or assess a selected policy's applicability. | Pass |
| 4 | "I have an Autonomous AI Database. Create a zone." No future operation or target compartment is stated. | Having or naming a database type alone does not satisfy the gate. Ask for the intended operation after applying the configuration and its target compartment. | Pass |
| 5 | "Use Oracle's Maximum Security Recipe." | Explain that this Terraform module creates custom recipes and cannot configure the Oracle-managed Maximum Security Recipe. Stop this workflow; do not represent a custom recipe as equivalent. | Pass |
| 6 | "Use a custom recipe for an Always Free Autonomous AI Database." | Do not reject or accept the request based only on a Maximum Security Recipe compatibility restriction. Explain that Maximum-specific limits do not establish custom-recipe compatibility; check the documented scope of the selected custom policies and state uncertainty where documentation does not establish compatibility. | Pass |
| 7 | "I need a recipe containing only Database policies." | Explain that the module always adds at least CIS Level 1, including `deny public_buckets`; it cannot produce a strictly Database-only recipe. Stop if the user requires a strictly Database-only set. | Pass |
| 8 | The user accepts the CIS baseline but has not acknowledged that the Security Zone affects other resources in the compartment and its subcompartments. | Explain the scope and pause for the skill's required acknowledgement before generating configuration. Do not describe this acknowledgement as an OCI API prerequisite. | Pass |
| 9 | The user wants extra policies but has not named any. | Ask whether they want to provide policy names/OCIDs, review the complete active catalog, or add none. Do not select policies for them. | Pass |
| 10 | The user provides extra policy names or OCIDs. | Validate the supplied policies through the documented read-only OCI workflow. Add only user-selected policies with documented Database service/resource scope; pause if scope cannot be established. | Pass |
| 11 | The user asks to review the full policy catalog. | Present every active returned policy with name, description, services, category, and OCID. Identify Database-scoped entries, then ask which ones the user wants for each recipe. Do not omit catalog entries or choose policies on the user's behalf. | Pass |
| 12 | The user says "no extra policies." | Preserve the selected mandatory CIS baseline and omit `security_policies_ocids` for that recipe. | Pass |
| 13 | The target compartment or intended operation is unclear, or required OCI validation is missing/inconclusive. | Ask for unclear intent/scope. For failed or inconclusive required OCI checks, stop as specified in `validation.md`; do not claim an authorization grant is absent when results are inconclusive. | Pass |
| 14 | The user asks the skill to run `terraform apply`. | Do not run Terraform or OCI write operations. Provide the documented handoff commands and require plan review before the user applies. | Pass |

## Conclusions

- The skill requires explicit follow-on Database Service intent and a target compartment; it does not require a database resource-type field.
- Oracle Maximum Security Recipe limits are kept separate from the custom recipes this module creates.
- The skill discloses the module's non-Database CIS baseline and compartment-wide effects before generation.
- Users choose any additional policies. The skill validates selections and does not infer them.
- The manual review found the expected behavior represented in the current instructions. Runtime behavior of another model was not exercised.

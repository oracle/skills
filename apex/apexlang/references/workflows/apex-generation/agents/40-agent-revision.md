> All `node tools/apexctl.mjs ...` commands are package-root relative: run them from the packaged skill root, or invoke that script by explicit path.

# Agent 3 — Revision

Purpose
- Apply only deterministic critique and validator fixes, then prove the result.

Inputs
- accepted critique payload
- draft and Generation Plan
- original intent and context capsule fingerprint
- `problems.json` or explicit rule IDs

<authority_rules>
- Preserve the frozen Generation Plan unless the critique proves that the plan itself violates a higher authority.
- Use the repair capsule as the deterministic fix entrypoint.
- Do not expand scope, redesign unaffected components, or infer missing values.
</authority_rules>

<task_scope>
1. Preserve the reviewed unit identity and run `node tools/apexctl.mjs context repair --problems <problems.json> --unit-id <unit-id> --ir-pointer <ir-pointer>` or pass explicit `--rule-id` values with the same unit metadata.
2. Apply the smallest artifact change described by each resolved recipe.
3. Open owning guidance only when the compact recipe cannot be applied safely.
4. Rerun the exact compiler/local/live check that produced the finding.
5. Repeat only for newly reported deterministic findings; stop when evidence is missing.
</task_scope>

<repair_contract>
- Generation Plan Repair is permitted only when a higher-precedence finding proves plan drift.
- Keep rule ID, cause, changed artifact, deterministic fix, and verification result together.
- Apply the repair in a fresh context containing the same unit capsule and only its projected repair recipes; do not reload earlier units.
- Preserve unrelated source, formatting, identifiers, and behavior.
- Re-run compiler-truth audit after structural changes.
- Do not load the full validator-fix-recipes catalog or broad Draft/Critique checklists.
</repair_contract>

<stop_conditions>
- Stop with Missing Inputs when a recipe needs an unproven schema object, target, mapping, or property.
- Stop when the recipe and compiler/live evidence conflict.
- Do not mark completion until all required checks pass.
</stop_conditions>

Compatibility repair coverage
- `CONTENT_ROW_SELECTION_ITEMS_REQUIRED_001`: `rowSelection { type: focusOnly }` contains no page-item references; single/multiple modes use the documented items and identity column.
- `INTERACTIVE_REPORT_LINK_COLUMN_TYPE_FORBIDDEN_001`: change only top-level Interactive Report column `type: link` to `type: plainText` and preserve the nested link target.
- Deterministic master-detail Content Row autofix requires a `fullRowLink` action that sets the hidden context item. Do not accept native `rowSelection.currentSelectionPageItem` as sufficient for master-detail context setting.
- Mandatory cleanup: remove leaked template-family docs for `APP_TEMPLATE_ARTIFACT_LEAK_001` while retaining only allowed runtime artifacts.
- Repair authority is projected from `assets/validator-fix-recipes.json`; do not load that complete asset.

Output
- Updated artifact paths.
- Applied rule IDs and compact change summaries.
- Verification results and remaining blockers.
- Final capsule fingerprint.

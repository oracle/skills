> All `node tools/apexctl.mjs ...` commands are package-root relative: run them from the packaged skill root, or invoke that script by explicit path.

# Agent 1 — Draft

Purpose
- Produce the initial APEXlang artifact from authoritative inputs and a task-specific context capsule.

Inputs
- `intent`
- `target_type`
- `data_contract`
- resolved app/output path
- optional application spec and UX contract

<authority_rules>
- Follow `references/workflows/apexlang/prompt-contracts.md` and the rule IDs returned by the context resolver.
- Grammar owns syntax; compiler metadata owns semantic legality; the selected structured contract and exact template own the concrete emitted pattern.
- A phase note never overrides the guard, governance, compiler, or live validator.
</authority_rules>

<task_scope>
1. For one component or page, run `node tools/apexctl.mjs context resolve --intent "<normalized intent>" --phase draft`.
2. For a full application, freeze the application spec and UX contract, then run `node tools/apexctl.mjs context resolve --intent "<normalized intent>" --phase draft` for each implementation unit.
3. Select one implementation unit from the frozen application spec, then resolve a fresh task-specific context capsule for it.
4. Generate that unit in a fresh model context containing only the application plan, the retrieved unit, its IR pointer, and necessary compiler/tool results. Do not retain prose or capsules from previously generated units.
5. Prefer one adaptive page unit. Split a page into shell, region, and logic units only when the implementation scope requires it.
6. Do not open the complete rule catalog, complete repair catalog, raw grammar file, full component registry, or broad agent checklists. Use the capsule and compiler/property tools; open a capsule `source_path` only when the compact projection cannot answer a required decision.
7. Keep generation inside the unit capsule's `unit_pattern`, IR pointer, symbol-table projection, selected component families, navigation decisions, and authoritative data contract.
</task_scope>

<allowed_sources>
- User requirements and explicit assertions.
- Resolved schema/live metadata with recorded object evidence.
- The context capsule, structured pattern packs, application spec, UX contract, grammar, compiler metadata, and one exact selected template.
- The resolved target app only for integration facts such as existing IDs, aliases, targets, and shared-component references.
</allowed_sources>

<exact_match_policy>
- Reuse a template only when family, variant, parent, nesting, and conditional mode match.
- Use projected common-template rules plus the selected small variant file. Do not load an entire template family.
- Query compiler truth before introducing any new block, property, enum, slot, template option, or layout attribute.
</exact_match_policy>

<compiler_truth_contract>
- Use `assets/grammar/apexlang.ebnf` for syntax.
- Use `query-valid-props.mjs` or direct compiler metadata for semantic legality.
- Emit `Compiler Truth Evidence` when the structural change is not an exact match.
- Run compiler-truth audit before publish or live work.
</compiler_truth_contract>

<generation_plan_contract>
- Emit a compact Generation Plan for every non-trivial change.
- Freeze artifact scope, selected profile/pattern/template, ordered component inventory, source mode, navigation/target mappings, source trace, and compiler evidence.
- Complete-app generation additionally requires the application spec and UX contract before rendering.
- Persist the UX contract as `.apexlang/app-ux-contract.json` and follow the rules and workflow first.
</generation_plan_contract>

<output_contract>
- Emit only APEXlang artifacts; use triple backticks only for SQL.
- For a new application, materialize `templates/base-app-structure/scaffold-example/**` through the runtime seed manifest before drafting custom artifacts; preserve untouched scaffold structure and customize only requested areas.
- Use LF line endings, four-space indentation, one top-level declaration per block, and one property or parameter per line after its opening declaration/block. Keep opening braces on their declaration or property line, use normal nesting, and keep object-valued properties multiline.
- Do not write final `.apx` text directly. Emit the unit IR/render payload through the staged boundary. Reject compact declarations, inline nested blocks, and same-line sibling properties. Immediately run `node tools/apexctl.mjs apexlang format --app-path <temp_app_path> --strict-structure`; reject structural changes before grammar checks.
- Bind every metavariable and pseudo-identifier from authoritative context before emission.
- Treat unclassified snippets as `illustrative_prompt`; never emit unresolved metavariable templates.
- Preserve concise help, accessibility, security, and maintainability guidance selected by the capsule.
</output_contract>

<stop_conditions>
- Stop with Missing Inputs when database objects, mappings, targets, compiler legality, or a required high-impact design decision cannot be proven.
- Stop on same-rank authority conflicts.
- Do not compensate for missing evidence by widening template scans or inventing richer UI behavior.
</stop_conditions>

Compatibility coverage
- Detailed family rules remain in structured capsules, owning templates, compiler metadata, and validators. This includes Native Content Row row selection (`focusOnly`), Master-detail Content Row selection, Classic Report hidden columns, Smart Filters targets, Content Row projection coverage, Metric Card projection coverage, Metric Card multi-card source pattern, Metric Card property surface, `layout_row_plan`, KPI strips with `recipe: metric-card-strip`, `5 charts -> one `two-up-equal` then one `three-up-equal``, and the rule: Do not literally stack multiple dashboard charts. It also covers Cards image mapping, Template-component row selection identity, Content Row grouping ordering, Report-type template component projection coverage, Image Upload 26.1 contract, and Interactive Report column links that never emit `type: link`.
- SQL/PLSQL checks such as `SQL_PLSQL_LOB_COMPARISON_KEY_FORBIDDEN_001` are validator-owned and must be satisfied before completion.

Output order
1. Compiler Truth Evidence when required.
2. Generation Plan.
3. Generated or updated APEXlang artifacts.
4. Capsule fingerprint and validation commands.

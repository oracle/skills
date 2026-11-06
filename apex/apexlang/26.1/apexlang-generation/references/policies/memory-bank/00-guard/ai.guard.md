# AI Tooling Guard — Authority, Routing, and Stop Conditions

This file is the compact non-bypassable guard. Resolve detailed best practices through `assets/rules.catalog.json`; load only the selected owner named below. Do not treat this file as a generation tutorial.

## Authority and Loading Contract

- Apply precedence: this guard → `references/policies/governance/00-governance.md` → selected workflow/rule owner → exact template.
- Use the APEXlang EBNF as the syntax oracle and compiler metadata, direct compiler validation, or `query-valid-props` as the semantic oracle. Grammar/compiler truth overrides prose and examples.
- Use the rule catalog and structured contracts before broad Markdown. Load the smallest sufficient phase, profile, owner, and exact template projection; keep a compact source trace for non-trivial work.
- Treat templates as exact-match renderer examples, not syntax authority. Do not scan template directories or applications to infer component capability or DSL shape.
- Stop when same-rank authoritative sources conflict. Stop with `Missing Inputs` when authoritative structure, compiler legality, DB evidence, source mappings, or required targets cannot be proven.
- Do not invent blocks, properties, enums, slots, template options, schema objects, identifiers, URLs, targets, or inferred application structure.

Rule IDs: `GRAMMAR_FIRST_AUTHORITY_REQUIRED_001`, `PROGRESSIVE_DISCLOSURE_TRACE_REQUIRED_001`.

## Prompt and Escalation Contract

- Accept free-form requests. Normalize explicit intent and identifiers before asking questions.
- Ask only for critical routing, target, safety, evidence, or output blockers, using short simple English.
- Allow one clarification round. If critical ambiguity remains, stop with `Missing Inputs`; do not require the user to restate the request as a structured payload.
- Permit bounded inference only for low-risk connective details after higher-precedence sources are exhausted. Never infer structural legality or live targets.

Rule ID: `PROMPT_NORMALIZATION_REQUIRED_001`.

## Repository and Artifact Boundaries

- Restrict app-scoped inspection to the resolved target app plus selected `references/policies/**` and `skills/**` owners. App reads are for concrete integration facts only, never pattern discovery.
- Treat `artifacts/` as optional output created lazily. Never use it as startup context, app source, schema evidence, or examples.
- Treat every `apex-exports` path segment as backup/export material. Ignore it unless the user explicitly requests read-only export inspection, migration, or recovery.
- Never read `.archive/`.
- Use `templates/**` as the active scaffold/pattern source. For new apps, publish only `.apex/`, `application.apx`, `deployments/`, `page-groups.apx`, `pages/`, `shared-components/`, and `supporting-objects/`.
- Materialize only manifest-declared entries from `base-app-structure/scaffold-example/**`. Never publish the container or template-only root documentation/metadata.
- Write `.apx` artifacts with LF endings. Normalize CRLF before validation or handoff.

Rule IDs: `APP_TEMPLATE_ARTIFACT_LEAK_001`, `APEXLANG_LF_LINE_ENDINGS_REQUIRED_001`.

## Tooling and Domain Boundary

- Do not use Perl one-liners for APEXlang rewrites containing `@...` aliases unless every `@` is escaped. Prefer Node or Python; treat unescaped Perl replacements containing `@alias` as unsafe.
- Oracle DB Skills Delegation Boundary: use `https://github.com/oracle/skills/tree/main/db` as the source of truth for generic Oracle Database, PL/SQL, SQLcl, and utPLSQL best practices.
- Keep local ownership limited to APEX artifact safety and APEXlang workflow integration: DB evidence, APEX process shape, inline payload gates, extracted-logic naming, and SQLcl adapter behavior needed for APEXlang validate/import/export roundtrips.
- Route generic DB/PLSQL/SQLcl/utPLSQL work to installed upstream skills. Do not recreate generic tutorials when unavailable; stop generic DB-only work with `Missing Inputs` or `Oracle DB skills required`.
- MUST continue APEXlang-specific generation and runtime-safety workflows without requiring a locally installed copy of the upstream DB skills.

Rule IDs: `TOOLING_REWRITE_ALIAS_LITERAL_REQUIRED_001`, `ORACLE_DB_SKILLS_DELEGATION_REQUIRED_001`.

## Security Baseline

Load `references/policies/memory-bank/10-global/apex.global.md` for generation detail and validator repair assets for failures.

- Generated business apps require application Session State Protection, `maxSessionIdleTime: 3600`, and `maxSessionLength: 28800`.
- Keep Page 0 on the minimal global-page contract and omit ordinary page security/authentication properties there.
- Use bare `mustNotBePublicUser` for non-login, non-Page 0 pages unless a stricter verified authorization is selected. The login page is the only default public page; other public pages require explicit review rationale.
- Classify hidden items as protected server-owned values or explicitly documented same-page client-owned UI state. Use checksum protection for the former and `unrestricted` only for the latter.
- Keep report/grid escaping enabled by default. Use reviewed declarative column formatting with escaped substitutions for allowed HTML rendering.
- Reject arbitrary or unsafe URLs, inline handlers, and unallowlisted values. Do not invent secure-cookie DSL; unresolved support is a blocking finding.

Rule IDs: `SECURITY_BASELINE_REQUIRED_001`, `PUBLIC_PAGE_REVIEW_REQUIRED_001`, `HIDDEN_ITEM_SSP_REQUIRED_001`, `REPORT_ESCAPE_REQUIRED_001`, `SECURE_COOKIE_DSL_UNVERIFIED_001`.

## Database Evidence Gate

Load `references/policies/memory-bank/20-data/db.connection.md` first and the selected SQL/page owner only when DB-backed work is in scope.

- Inspect `assets/workspace-intelligence.json` and saved SQLcl connections before asking for DB mode or connection information. Prefer eligible offline schema metadata for evidence; treat `offline` as explicit intent.
- Record one `object_evidence_source` per referenced table, view, package, function, procedure, sequence, and column: `schema_doc`, `live_db`, `user_asserted`, or `unresolved`.
- Do not generate, revise, preserve, or replace object-specific SQL while any required object is unresolved. Templates, sample apps, labels, examples, runtime errors, and guessed code are not object evidence.
- Validate source objects, selected columns, joins, filters, and sort columns from the chosen evidence source before DB-backed generation. Never replace a disproven guess with another guess.
- Offline mode permits planning/drafting only when schema evidence is sufficient. It disables live metadata validation, `apex validate`, and `apex import`.
- Auto-bind one deterministic saved SQLcl connection for live validation, import, diagnostics, or DB object changes. Ask the user only when multiple connections exist or manual `db_connection_name` remains necessary. Require an exact destination workspace name for new-app materialization; for existing apps, resolve workspace identity only if the active runtime reports ambiguity.
- NL2IR context comes only from verified database annotations/comments, never row sampling, names, headings, or inferred meaning. Omit unavailable context instead of synthesizing it.

Stop with `Missing Inputs` when prerequisite selection, connection/workspace selection, or any required object evidence remains unresolved after deterministic discovery and one clarification.

Rule IDs: `DB_MODE_PROMPT_REQUIRED_001`, `DB_CONN_REQUIRED_001`, `DB_OBJECT_EVIDENCE_REQUIRED_001`, `DB_METADATA_REQUIRED_REPORT_001`, `DB_VERIFY_BEFORE_GENERATION_001`.

## Generation Owner Routes

Load only the row matching the selected component or concern. The catalog card remains the compact contract; the owner supplies detail.

| Concern | Canonical owner | Non-bypassable contract | Rule IDs |
|---|---|---|---|
| Calendar links | `30-pages/apex.calendar.md` and `page-components/regions/references/calendar/workflow-calendar-link-targets.md` | Explicitly choose existing versus new form/report target; require target mappings, explicit new-report type, and PK item/filter. Never infer targets. | `CALENDAR_CREATE_LINK_TARGET_REQUIRED_001`, `CALENDAR_VIEW_LINK_TARGET_REQUIRED_001`, `CALENDAR_REPORT_TYPE_REQUIRED_001`, `CALENDAR_REPORT_PK_FILTER_REQUIRED_001` |
| UI composition | `40-components/apex.templates.md` | Use native templates/options/slots/layout first; keep region and item grid scopes separate; do not invent structural CSS. | `COMPOSITION_CONTRACT_REQUIRED_001`, `GRID_SCOPE_REQUIRED_001`, `CSS_CLASS_INVENTION_FORBIDDEN_001` |
| Report rendering | `30-pages/apex.report-column-rendering.md` | SQL/PLSQL returns raw data, not presentation HTML; keep escaping and declarative rendering. | `REPORT_SQL_HTML_LITERAL_FORBIDDEN_001`, `REPORT_ESCAPE_REQUIRED_001` |
| SQL predicates | `20-data/apex.sql.md` | Normalize `_static_id` comparisons with `LOWER()` and use verified metadata. | `STATIC_ID_WHERE_LOWER_REQUIRED_001` |
| ACL roles | `20-data/apex.logic.md` and `shared-components/README.md` | Declare every referenced role exactly once in `acl-roles.apx` with lowercase kebab-case static IDs. | `ACL_ROLE_DECLARATION_REQUIRED_001` |
| Buttons and report links | `40-components/apex.buttons.md` and `10-global/apex.global.md` | Same-app navigation uses declarative target objects. Ask for report link mode; reserve scalar URLs for explicit URL/cross-app behavior. | Selected button and report-link catalog cards |
| REST sources | `40-components/apex.region-data-source.md` plus selected REST templates | Resolve the real alias and one remote-server origin; require authoritative operations/parameters/data profile before consumers; use `restSource`, never guessed aliases or example synchronization values. | `DB_OBJECT_EVIDENCE_REQUIRED_001` plus REST profile |
| Processes and computations | `10-global/apex.global.md`, `20-data/apex.logic.md`, and selected business-logic workflow | Prefer declarative validation; page packaged calls use `invokeApi` unless a justified thin wrapper is required; `appProcess` uses `executeCode`; SQL computations use `sqlQuery`. | Selected business-logic profile and validator rules |
| Inline SQL/PLSQL | `20-data/apex.sql.md` and `20-data/apex.logic.md` | Bodies over 4000 raw characters must be extracted to a verified view/package API; do not invent the object. | `SQL_INLINE_BLOCK_001`, `PLSQL_INLINE_BLOCK_001` |
| PL/SQL calls and extraction | `10-global/apex.global.md` and `20-data/apex.logic.md` | Use named notation for calls with arguments; default extracted app logic to `app_process_api`; never use page-number package names. | Validator/critique contracts |
| Login processes | `30-pages/apex.login-page.md` | Page processes contain authentication primitives only; move other behavior to application processes unless explicitly required at page scope. | Selected login/process contract |

Additional hard requirements:

- Before adding `raise_application_error` for user-correctable submit failures, use native APEX validations when they can express the rule. Reserve process exceptions for failures validations cannot safely pre-check.
- REST discovery requires a successful call, an authoritative specification, or user-provided request/response examples. Without one, stop before creating dependent components.
- REST synchronization requires explicit target schema/table and schedule requirements. Never reuse template placeholders.
- Use named notation in generated APEX artifact PL/SQL. Parameterless calls may omit arguments; never mix named and positional notation.

## Validation and Repair Gate

- Run local lint and compiler-truth audit for every generated or revised `.apx` artifact before publish or live work.
- Treat direct compiler validation/metadata as structural authority and live APEX validation as runtime authority. Prose and templates cannot override either.
- Treat VS Code Problems snapshots as optional diagnostics (`not_provided` when absent), not completion evidence.
- Use `problems.json` as the compact repair interface. Resolve matching `validator-fix-recipes.json` entries, apply the smallest fix, and rerun the failed gate.
- Do not mark validation complete, publish, or offer import while required compiler truth or live evidence is unresolved.

## Runtime and Import Gate

Load `references/ops/runtime-gates.md` only after generation and local/compiler validation succeed.

- Default interactive APEX artifact workflows to checking APEXlang code. When live prerequisites are resolved, run the canonical direct SQLcl validation path; do not defer it as a TODO.
- Prefer the resolved build-root runtime when capable, with PATH SQLcl as fallback. Treat established sandbox-only build-root filesystem failures as environment blockers rather than app defects.
- Live APEX validation is authoritative. Missing runtime inputs or evidence records `LIVE_RUNTIME_VALIDATION_REQUIRED_001` and blocks completion.
- After a successful live check, offer GUI choices: `Check APEXlang code` (recommended) or `Check and import APEXlang code`. If GUI choices are unavailable, stop after checking and report import as a follow-up.
- Import requires the explicit post-check GUI choice, a bounded target-resolution outcome, one intended workspace, and the preserved canonical application ID. Never infer import intent or fall through from update-existing to create-new.
- For import, validate and import in the same authenticated SQLcl session. If the session or target identity changes, stop and revalidate.
- A successful check-only run may complete after validation. An import run may complete only after same-session validation and import succeed for the same resolved app path.

Rule IDs: `LIVE_RUNTIME_VALIDATION_REQUIRED_001`, `RUNTIME_GATE_COMPLETION_REQUIRED_001`, `ONLINE_IMPORT_CONDITIONAL_001`.

## Maintenance and Compatibility Gate

- Resolve `.apex/apexlang.json` and enforce the supported `mmdVersion` plus canonical vocabulary before schema/runtime gates. Normalize deterministic aliases and block unresolved or mixed vocabulary.
- For packaged-build refreshes, classify changes as narrow metadata deltas unless compiler evidence proves added, removed, or renamed DSL/runtime syntax. Keep build facts with the existing owner and do not broaden component-local changes.

Rule ID: `APEXLANG_BUILD_REFRESH_SCOPE_REQUIRED_001`.

## Completion Checklist

Before final handoff, confirm:

1. The selected rule cards and owners match the normalized intent.
2. Every required DB/API/target fact has authoritative evidence.
3. Generated `.apx` is LF-only, compiler-safe, and free of unresolved metavariables or prompt-only identifiers.
4. Validator findings map to deterministic repair recipes and have been rerun.
5. Runtime completion/import claims satisfy the runtime gate.
6. No broader prose, template family, application, artifact, export backup, or archive was loaded as a substitute for routing.

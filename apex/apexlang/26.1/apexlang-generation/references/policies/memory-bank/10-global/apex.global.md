# Global Preferences

- When populating attributes, load the matching component template in `templates/**` and mirror its structure and attribute names exactly.
- Do not create tables in APEXlang output unless the user explicitly asks for DDL; focus on APEX artifacts using existing schemas.
- When the user asks to create a new application (or similar phrasing), first resolve the target app directory. Default to the standard `applications/app_###/` convention only when the repo has an `applications/` root or the user confirms that location. If `applications/` is missing, ask for the exact app directory or bounded scan root and stop with `Missing Inputs` until resolved. Before materializing a brand new app, require the user to specify the destination APEX workspace name, record the selected workspace in session `context-resolution.json` under `db_context.workspace`, and stop with `Missing Inputs` if no exact workspace name is present in session context or passed explicitly with `--workspace-name`. Materialize only named runtime artifacts from `templates/base-app-structure/scaffold-example/` into the resolved app folder: `.apex/apexlang.json`, `application.apx`, `deployments/default.json`, `page-groups.apx`, `pages/p00000-global-page.apx`, `pages/p00001-home.apx`, `pages/p09999-login.apx`, `shared-components/**`, and `supporting-objects/**`. Replace `deployments/default.json.workspace.name` with the selected destination workspace name during materialization. Whole-directory copy from `base-app-structure/` into the app root is forbidden.
- For brand new applications, treat `base-app-structure/` as a minimal seed plus reference family. The scaffold vocabulary is canonical `26.1.0+3102` only: use `navigation`, `navigationMenu`, `navigationBar`, `themeNumber`, `javaScript`, and `pageNumber`; do not emit legacy aliases. Root Markdown and JSON files in `base-app-structure/` are template-space docs and metadata only, and `scaffold-example/` is the executable scaffold source in template space only; template-only docs, metadata, and scaffold containers must not be published into generated app roots. Do not copy optional documentation-only placeholders such as placeholder CSS includes, sample header/footer text, or sample JS. Help text and maintainability comments follow the default guidance contract below and are not optional just because a scaffold example marks them as reference-only.
- Do not guess at value-attribute pairs; always seek guidance from examples in the /templates directory
- Do not create tables unless explicitly asked to do so
- Prefer native APEX process types; use `invokeApi` for packaged page-process calls by default, allow a thin `executeCode` wrapper when direct page-item orchestration is the reliable runtime-safe choice, and use `executeCode` for `appProcess`.
- For all PL/SQL text blocks, if inline body length exceeds 4000 raw characters, critique should emit advisory warning `PLSQL_LENGTH_WARN_001` and recommend package extraction plus page-process `invokeApi` migration.
- For all SQL text blocks, if inline body length exceeds 4000 raw characters, critique should emit advisory warning `SQL_LENGTH_WARN_001` and recommend extraction to a secure view plus page/region/LOV reference rewiring.

# Accessibility and UX Baseline (Universal Theme)

- Labels
  - Every item requires an accessible name. Prefer visible labels. Hidden labels only when documented in UT and with proper aria-label/aria-labelledby fallbacks.
  - Placeholders are never a substitute for labels.
- Landmarks and Regions
  - Use UT region templates that emit proper landmarks. Breadcrumbs, nav, page headers, and main content should expose correct roles.
- UT Classes Only
  - Do not invent CSS classes.
  - Prefer native templates, template options, slots, and layout/alignment attributes from `40-components/apex.templates.md`.
  - Flag any invented or selector-driven layout classes in critique.
- Contrast and Focus
  - Adhere to UT accessible palette. Ensure focus outlines are visible and keyboard traversal is complete.
  - Avoid color-only cues; provide text or icons with accessible names.
- Keyboard and Motion
  - All interactions must be keyboard-operable. Avoid excessive animations; respect reduced-motion preferences.

# Performance Baseline
- Pagination and Row Limits
  - Default pagination is region-specific and must use valid APX tokens from `20-data/apex.sql.md`:
    - Classic Report: `rowRangesXToYNoPagination`
    - Interactive Report: `rowRangesXToY`
    - Interactive Grid: `scroll`
  - When a user explicitly requests a different pagination experience, select from the region-specific catalog in `20-data/apex.sql.md` for report-style regions, or use the Interactive Grid `page`/`scroll` options and record the chosen type.
  - `pagination.displayPosition` applies only to Classic Report and Interactive Report, and only when `pagination.type` is present.
  - Interactive Grid does not support `pagination.displayPosition`; use `pagination.showTotalCount` (boolean) when needed.
  - Reports/IR/IG must still define pagination metadata and reasonable max rows. Avoid unbounded queries.
  - Set maxRowsToProcess to a sensible cap per use case; do not set excessively high limits by default.
- Lazy Loading and Caching
  - Enable lazy loading for below-the-fold or secondary regions.
  - Cache stable LOVs/reference data and static assets.
- Downloads by Role
  - Restrict CSV/Excel/PDF downloads via authorization schemes.
  - Disable formats that are not required; ensure printing server is configured if PDF is allowed.
- SQL Hygiene
  - No SELECT *. No SQL hints. Always bind variables. Push heavy logic to views/packages. Provide ORDER BY explicitly.

- Wrap plsqlExpression and plsqlFunctionBody code in triple backticks when writing validations in APEXlang.
# Internationalization (i18n) Baseline
- Text Messages
  - No hard-coded user-facing strings in labels, headings, help text, region titles, or messages.
  - Use Text Messages / Shared Components and substitution strings.
- Translation Workflow
  - Prepare text keys and maintain message bundles. Ensure all dates, numbers, and currency use standardized format masks and NLS settings.
  - For translation/localization workflows that add or update `globalization` settings, default `languageDerivedFrom` to `browserPreference` unless the user explicitly requests a different derivation strategy.

# Help Text and Annotation Governance
- Concise guidance is the default for generated apps. By default, major pages receive page help, user-editable and filter/control items receive concise help text, primary action buttons receive concise guidance when the component supports it cleanly, and key report columns plus high-value regions receive maintainability annotations/comments.
- This default applies even when the requested output is described as simple, lightweight, baseline, demo, starter, scaffold, or quick. Simplicity reduces wording length and component count; it does not remove the guidance layer.
- Prefer authoritative metadata first for help text and column guidance: database column comments, approved documentation extracts, existing Text Messages, or reviewed page copy.
- When authoritative metadata is absent, provisional concise copy is allowed. Provisional guidance must remain user-facing and neutral, translation-ready, routed through Text Messages or an explicit planned message-key scheme, and treated as maintainability guidance rather than canonical business documentation.
- Page-level help should summarize page purpose, primary actions, and common interpretation notes; keep to two short paragraphs.
- Item inline help (3-6 words, <=60 characters) should clarify acceptable input, intent, or format. Detailed item help may extend to ~400 characters max and should capture why the value matters plus any key validation highlights.
- Repeated help or annotation wording should be centralized in Text Messages whenever the same wording appears on multiple pages, regions, buttons, or items.
- For report columns, add concise user-facing guidance through the supported guidance hook in the selected template family. When no dedicated runtime column-help hook exists, surface the user-facing guidance in page/region help and keep developer-facing column comments on the column itself.
- Developer-facing `comments { comments: ... }` blocks are the default for key report columns and high-value regions. For report/grid columns, keep the comment in a normalized metadata format with the required attributes `Display Label`, `Display in Report`, `Display in Form`, `Format Mask`, `Value Required`, `Read Only`, `Primary Display Column`, and `Authorization Scheme`; include `Summary` only when a short leading business-intent sentence materially helps maintenance. Mirror executable runtime settings such as `appearance.formatMask` or `security.authorizationScheme` when those blocks are present.
- Hidden or purely technical columns may omit user-facing guidance, but important technical, derived, status, and action columns still require developer comments.
- When broader guidance is required within the page layout, use a dedicated Help Text region component rather than expecting every region to expose a help attribute.
- Help text and user-facing column guidance must never include credentials, PII, or sensitive implementation details. Mask internal identifiers unless the user explicitly requires them.
- Always reference the Text Message key (or planned key) in drafts/previews; critique must fail if user-facing literals are emitted without a message plan.
- Critique must also fail when required default guidance is missing from visible form items, filter items, major pages, or business-significant report columns solely because the scaffold was treated as simple.

# DevOps and Logging Baseline
- Install/Seed Scripts
  - Standardize install scripts that seed roles, shared components, and static files. Shared components and assets must be source-controlled.
- External URLs and CSP
  - Ban external asset URLs in production builds. Store assets in Static Application Files (#APP_FILES#) or Theme Files.
  - Define a Content Security Policy (CSP) aligned with allowed origins; critique must flag external references.

# JavaScript governance
- Approved locations: page js.functionAndGlobalVarDeclaration and js.executeWhenPageLoads.
- Keep JS minimal and CSP-safe; prefer Dynamic Actions for UI behavior.
- Prohibit eval/new Function and inline HTML event handlers; external URLs are prohibited.
- Global page JS must be idempotent and minimal; avoid heavy logic here.

# Server-Side Execution Policy — invokeApi Preferred with Thin Wrapper Exception (Non‑Negotiable)

Purpose
- Ensure all PL/SQL package API calls made by page processes use a declarative, parameterized pattern that is testable and maintainable.

Scope
- Applies to all page process blocks calling database packages (procedures/functions).
- Applies to all application process (`appProcess`) blocks.
- Dynamic Content regions using plsqlFunctionBody for rendering HTML are permitted; they must not perform DML.

Policy
- MUST: For page processes, prefer process type: invokeApi for packaged calls when declarative parameter mapping is runtime-safe.
  - Provide invoke { package: PKG_NAME procedureOrFunction: PROC_OR_FUNC }.
  - Provide parameter blocks for each argument with explicit direction (in | out | in out) and value mapping (item, or expression with plsqlExpression).
  - Include parameter { dataType: boolean, hasDefault: true } where the API signature requires it (see login pattern).
- MUST: Allow a thin page-level `executeCode` wrapper for packaged calls when it only orchestrates named-notation package invocation plus direct page-item assignment for page-coupled loaders or branch-gated flows.
- MUST NOT: Use executeCode to re-embed business logic that belongs in the package.
- MUST: For `appProcess`, use `type: executeCode` only.
- MUST NOT: Use `type: invokeApi` in `appProcess`.
- MUST: If `appProcess` calls a package, place the call in `source.plsqlCode` and use named notation.

Enforcement
- Guard: See 00-guard/ai.guard.md for the hard rule and agent enforcement.
- Drafting: Generators must emit invokeApi for page-process packaged calls unless the thin-wrapper exception is justified; appProcess remains executeCode-only.
- Critique: Flag violations by scope (page process vs appProcess) and require conversion only when the compliant exception does not apply.
- Revision: Convert non-compliant process types to the compliant type per scope.

Notes
- Keep business logic in packages; pages orchestrate and map inputs/outputs via items.
- Prefer ARP for simple CRUD; use packaged DML APIs or ARP, not ad hoc executeCode.

# Report Region Link Target Policy (Non-Negotiable)

Purpose
- Force an explicit navigation-mode decision for report-like regions and avoid unnecessary URL indirection for same-app links.

Scope
- Applies to Classic Report, Interactive Report, and Interactive Grid navigation requests.

Policy
- MUST: Ask the user how the region link should behave whenever a report-like region gains or changes navigation.
  - Valid modes are:
    - same application page
    - another application page
    - URL redirect
- MUST: Use declarative page-target syntax when the user chooses a page in the same application and the DSL supports it.
- MUST NOT: Default same-app report links to `type: url`, `f?p=...`, or SQL-computed URL columns when declarative page-target syntax is available.
- MUST: Reserve URL targets for explicit URL mode or cases where the component DSL genuinely requires a URL string.

# APEX Artifact PL/SQL Call Notation — Named Parameters Only (Non‑Negotiable)

Purpose
- Keep generated APEX artifact PL/SQL calls explicit when APEXlang must emit PL/SQL text.

Scope
- Applies to PL/SQL text generated or revised inside Oracle APEX artifacts: processes, dynamic actions, validations, page/item computations, and generated APEXlang fenced PL/SQL blocks.
- Applies to APEX_* calls and custom application package calls inside generated APEX artifact PL/SQL text.
- Does not define generic PL/SQL coding standards for standalone packages, SQL scripts, or SQL Workshop scripts; use upstream Oracle DB skills for that guidance.
- Parameterless routines may be called without arguments.
- Overloaded routines must always be called with named notation.

Policy
- MUST: Use named notation `param_name => value` for every argument when a routine has parameters.
- MUST NOT: Use positional arguments.
- MUST NOT: Mix named and positional notation in the same call.
- Applies inside APEX artifact PL/SQL text contexts we generate or revise: `plsqlCode`, `plsqlFunctionBody`, and `plsqlExpression`.
- Note: `invokeApi` parameter blocks are inherently named.

APEX artifact examples
- Correct:
  ```
  APEX_MAIL.SEND(
    p_to   => 'user@example.com',
    p_from => 'no-reply@example.com',
    p_subj => 'Welcome',
    p_body => 'Hello!'
  );
  APEX_JSON.INITIALIZE_CLOB_OUTPUT(p_preserve => true);
  APEX_JSON.WRITE(p_name => 'status', p_value => 'ok');
  APEX_UTIL.SET_SESSION_STATE(p_name => 'P10_FLAG', p_value => 'Y');
  v_cnt := APEX_STRING.SPLIT_COUNT(p_str => :P10_LIST, p_separator => ',');
  app_process_api.save_order(p_order_id => :P10_ORDER_ID, p_status => :P10_STATUS);
  ```
- Incorrect:
  ```
  APEX_MAIL.SEND('user@example.com', 'no-reply@example.com', 'Welcome', 'Hello!');
  APEX_JSON.INITIALIZE_CLOB_OUTPUT(true);
  APEX_UTIL.SET_SESSION_STATE('P10_FLAG', 'Y');
  f(p_x => x, y); -- mixing named and positional
  ```

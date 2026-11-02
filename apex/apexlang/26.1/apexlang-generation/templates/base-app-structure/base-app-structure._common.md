---
templateId: base-app-structure.common
componentType: template
version: 1.0
imports:
  - references/policies/memory-bank/10-global/apex.global.md
description: Canonical contract for whole-application base app structure runtime-artifact seeding.
---

# Purpose

Define the deterministic runtime-artifact contract for whole-application runs
that use `base-app-structure/` documentation plus the
`base-app-structure/scaffold-example/` executable scaffold source for the
minimum required app, page, and shared-component files before page or
shared-component customization begins. This family is the canonical
`26.1.0+3102` scaffold and must emit only the current vocabulary contract.

---

# Generation Rules (MANDATORY)

1. Load `references/policies/memory-bank/10-global/apex.global.md` and this `_common` file before
   materializing or validating whole-application output.
2. Materialize only the named runtime artifacts from
   `templates/base-app-structure/scaffold-example/` into
   the resolved `applications/app_###/` target before Agent 1 drafts new pages
   or shared components.
3. Whole-directory copy from `base-app-structure/` into the app root is
   forbidden.
4. Keep `base-app-runtime-seed.manifest.json` at the `base-app-structure/`
   root. It is runtime seed metadata and must not be moved into
   `scaffold-example/`.
5. Keep the root Markdown and JSON files in `base-app-structure/` as
   template-space docs and metadata only.
6. Keep `scaffold-example/` as the executable scaffold source in template
   space only; do not publish the `scaffold-example/` directory itself into the
   generated app root.
7. Copy only baseline-required metadata from this family. Optional attributes
   and example text remain omitted unless the user request, requested structure, or
   selected component template explicitly requires them.
8. Preserve the baseline artifact layout unless the user explicitly requests a
   deviation. Customization happens after baseline provisioning, not by
   re-synthesizing the skeleton from memory.
9. Before baseline provisioning of a brand new app, resolve or ask for the
   destination APEX workspace name and record it in session
   `context-resolution.json` under `db_context.workspace`. Stop with
   `Missing Inputs` rather than guessing or reusing a placeholder.
10. Replace `deployments/default.json.workspace.name` with the exact
    selected destination APEX workspace name during materialization.
11. Keep the generated `.apex/apexlang.json`, `application.apx`,
   `deployments/default.json`, `page-groups.apx`, baseline page seeds,
   `shared-components/**`, and `supporting-objects/**` output contract
   synchronized with this family when governance or orchestration docs refer
   to the whole-app scaffold.
12. Treat the Markdown and JSON files at `base-app-structure/` root as
   canonical for routing, guardrails, and materialization metadata.
13. Treat the runtime scaffold payload under
   `base-app-structure/scaffold-example/` as the executable skeleton source.
14. Preserve the canonical scaffold vocabulary in all baseline output files:
   - `application.apx`: `navigation`, `navigationMenu`, `navigationBar`
   - `shared-components/themes/**/theme.apx`: `themeNumber`, `javaScript`,
     `navigationBarList`, `navigationMenuListPosition`,
     `navigationMenuListTop`, `navigationMenuListSide`
   - `shared-components/breadcrumbs.apx`: `pageNumber`

---

# Required Inputs

- Resolved application output root (`applications/app_###/`)
- Destination APEX workspace name in session context for `deployments/default.json.workspace.name`
- Application identity values to update after baseline provisioning (for example
  app name,
  alias, parsing schema, substitutions)
- Explicit user direction if any baseline page or shared component seed should
  be omitted or renamed
- Explicit user direction if optional JS, header/footer text, additional copy,
  or other non-baseline attributes should be emitted
- A Text Message plan, documented source, or provisional copy plan for default
  help text and maintainability comments

---

# Seed Artifact Contract

| Path | Required | Notes |
|------|----------|-------|
| `scaffold-example/application.apx` | yes | Executable base application descriptor; customize identifiers after baseline provisioning. |
| `scaffold-example/.apex/apexlang.json` | yes | Runtime metadata file for the generated app root. |
| `scaffold-example/deployments/default.json` | yes | Deployment metadata for the generated app root. Replace `workspace.name` with the selected destination workspace name during materialization. |
| `scaffold-example/page-groups.apx` | yes | Runtime page-group definition file. |
| `scaffold-example/pages/p00000-global-page.apx` | yes | Global Page seed for Page 0. |
| `scaffold-example/pages/p00001-home.apx` | yes | Home Page seed for Page 1 with only safe default metadata. |
| `scaffold-example/pages/p09999-login.apx` | yes | Login Page seed for Page 9999 with only required login metadata. |
| `scaffold-example/shared-components/**` | yes | Baseline shared components, theme assets, and static files. |
| `scaffold-example/supporting-objects/**` | yes | Runtime supporting-object descriptors and scripts. |

---

# Application Root Contract

## Proven Root Structure

| Surface | Current doc form | Evidence | Notes |
|---------|------------------|----------|-------|
| `app [alias] (...)` | canonical root block | checked-in scaffold | The executable baseline already uses `app`, not `application`. |
| `name` | top-level scalar | checked-in scaffold | Minimal human-facing app name. |
| `globalization { ... }` | nested block | checked-in scaffold + metadata | Language-selection concerns and translation strategy. |
| `logo { ... }` | nested block | metadata-backed app-root contract | Mode-dependent branding block. |
| `navigation { ... }` | nested block | checked-in scaffold + metadata | Structured app-level home/login links. |
| `navigationMenu { ... }` | nested block | checked-in scaffold + metadata | App-level navigation-list configuration. |
| `navigationBar { ... }` | nested block | checked-in scaffold + metadata | App-level navigation-bar configuration. |
| `authentication { ... }` | nested block | checked-in scaffold + metadata | App-root selection of the default authentication scheme. |
| flat runtime / availability / error settings | top-level scalars | metadata-backed guidance | Remain flat until a checked-in app-root example proves alternate nesting. |

## Naming Rules For Application-Root Guidance

- Prefer the token already proven by the checked-in scaffold, for example
  `navigationMenu`.
- Prefer explicit metadata-backed APEXlang names when the source metadata
  defines them, for example `usersCanChooseThemeStyle`, `runOnly`, or
  `runAndBuild`.
- When no checked-in executable example exists, document app-root surfaces
  using the current lower-camel property form and treat them as metadata-backed
  guidance rather than executable proof.

## Domain Guidance

### Globalization and formats
- `globalization.primaryLanguage` is the authoring language of the app.
- `globalization.languageDerivedFrom` is metadata-backed and should be treated
  as an explicit app-root behavior choice rather than an inferred runtime
  detail.
- For translation-ready app scaffolds and localization workflow examples, the
  default `globalization.languageDerivedFrom` should be `browserPreference`
  unless the user explicitly requests a different runtime derivation mode.
- Only use the following values for `globalization.languageDerivedFrom`:
  - `appPreference`
  - `appPrimaryLanguage`
  - `browserPreference`
  - `itemPreference`
  - `notTranslated`
  - `sessiond`
- `globalization.translationMethod` stays at app root because it controls how
  the whole application resolves translation ownership.
- App-wide masks such as `appDateFormat`, `appDateTimeFormat`,
  `appTimestampFormat`, and `appTimestampTzFormat` remain flat root settings.
- Browser-driven choices such as automatic time zone or CSV encoding should be
  documented as runtime behavior, not just presentation preferences.

### Branding and chrome
- `logo { ... }` is the semantic app-root branding surface even when the
  underlying metadata is still represented as several scalar properties.
- Treat `logo.text`, `logo.imageUrl`, and `logo.customHtml` as mode-dependent
  children of that app-root concern.
- `addBuiltWithLove` and similar footer/chrome toggles are app-wide behavior,
  not page content.
- Raw favicon HTML remains an advanced escape hatch. Prefer declarative app
  files and template-backed branding where possible.

### Navigation
- `navigation { ... }` owns structured home/login links at app root.
- `navigationMenu` and `navigationBar` are separate app-root surfaces and
  should not be collapsed into one generic navigation setting.
- The app root chooses which shared lists and list templates drive the menu and
  navigation bar. The shared-component families own the list definitions
  themselves.
- Theme support still gates some app-root navigation behavior, so treat theme
  references and nav references as linked concerns.

### User interface and inheritance
- Theme, theme style, and global page selection are app-root inheritance pivots.
- `globalPage` is an inheritance boundary, not a cosmetic convenience.
- `usersCanChooseThemeStyle` is an app-root behavior switch and should stay
  distinct from the theme-style definition itself.
- App-wide success-message behavior belongs here only when it applies across
  the whole app.

### Authentication boundary
- The application root chooses the current authentication scheme.
- Use `authentication.scheme` for the app-root scheme selection. SQLcl 26.1
  accepts this live-compatible spelling even though the bundled compiler
  metadata still reports the legacy `authenticationScheme` property name.
- The shared `AUTHENTICATION` component definition owns plugin type,
  plugin attributes, remote-server settings, and scheme-specific processing.
- App-level defaults such as deep linking, rejoin sessions, authorization
  posture, and session-state protection remain app-root settings rather than
  nested authentication-plugin configuration.

### Runtime, availability, and notifications
- `compatibilityMode`, `buildStatus`, and `appAvailability` are behavioral
  contracts and should remain visible as app-root defaults.
- Deployment-sensitive settings such as logging, debugging, proxy paths, and
  file-prefix paths belong in app-root guidance because they affect import and
  runtime behavior outside page-level authoring.
- Error display defaults, global notification messaging, and app-wide error
  handlers remain app-root concerns until a more specific checked-in executable
  contract proves otherwise.

## Compact Metadata Inventory

| Area | DSL surface | Notes |
|------|-------------|-------|
| Globalization | `globalization.*`, `automaticTimeZone`, `automaticCsvEncoding`, app-wide format masks | Mix of proven nested block plus flat metadata-backed runtime defaults. |
| Branding | `logo.*`, `addBuiltWithLove`, favicon escape hatch | App-root chrome and branding, with template placeholder dependencies such as `#LOGO#`. |
| Navigation | `navigation.*`, `navigationMenu.*`, `navigationBar.*` | App root selects shared navigation assets and structured link targets. |
| User interface | current theme/style, user style choice, `globalPage`, success-message behavior | Inheritance pivots tied to the whole application. |
| Authentication | `authentication { ... }` plus adjacent security/session defaults | App root selects the scheme; shared components own scheme details. |
| Runtime and availability | compatibility, build status, availability, logging, debugging, proxy/files paths | Metadata-backed flat app-root defaults with deployment/runtime impact. |
| Errors and notifications | default error display, global notifications, app-wide handler hook | App-wide presentation and error-routing defaults. |

---

# Conditional Rendering Rules

- Use this family only for whole-application runs. Page-only, region-only, and
  shared-component-only runs should load their own template families instead of
  treating this family as a universal copy source.
- If the user explicitly opts out of part of the skeleton, preserve the rest of
  the seed and record the requested deviation in the change log or critique.
- If baseline page filenames are refined after baseline provisioning, preserve
  the page numbers (`p00000-*`, `p00001-*`, `p09999-*`) and keep the
  corresponding artifacts present unless the user explicitly directs otherwise.

---

# Guardrails

- Do not synthesize seed files from memory or from generated application output.
- Do not literal-copy documentation placeholders or example-only attributes
  into generated output. This includes values such as `CUSTOM_FILE_NAME.css`,
  sample header/footer text, sample help text, sample comments, and sample
  static-region prose.
- Do not treat help text or maintainability comments as opt-in extras for new
  app scaffolds. Supply them by default using Text Messages, documented
  sources, or provisional translation-ready copy with an explicit message-key
  plan.
- Do not replace this family with legacy alias paths or stale page filenames
  such as `p00001.apx` or `p09999.apx` when documenting the
  checked-in seed artifacts.
- Do not emit or preserve legacy scaffold vocabulary such as `nav`, `navMenu`,
  `navBar`, `themeNo`, `js`, or `pageNo`.
- Keep references markdown-first: use `_index.md` and `_common.md` for routing,
  then materialize the actual generated app artifacts and `shared-components/**` assets.
- For baseline pages, prefer markdown sidecars for optional-section
  documentation and keep the Markdown baseline examples minimal.
- Apply identifier and optional copy/layout customization only after baseline
  provisioning completes.
- Keep app-root guidance consolidated in this family rather than creating a
  second application-definition doc family under `shared-components/`.
- Treat checked-in scaffold syntax as the strongest executable evidence and
  metadata-backed notes as secondary guidance for flat app-root defaults.
- Keep shared-component ownership boundaries explicit: app root selects shared
  assets, while shared-component families own the referenced component
  definitions.

---

# Related Assets

- Family README: `templates/base-app-structure/README.md`
- Routing entrypoint: `templates/base-app-structure/base-app-structure._index.md`
- Seed manifest: `templates/base-app-structure/base-app-runtime-seed.manifest.json`
- Scaffold source root: `templates/base-app-structure/scaffold-example/`
- Global preferences: `references/policies/memory-bank/10-global/apex.global.md`
- Whole-app orchestration: `SKILL.md` (loads `references/workflows/apex-generation.md` for constitutional generation flow)

# Base App Structure Templates

## Purpose
Canonical guidance for the `base-app-structure` whole-application family. The
root of this folder is the documentation and metadata contract for a brand new
application scaffold. The executable scaffold payload lives under
`scaffold-example/`. This family is not a literal whole-directory copy-paste
starter. The checked-in baseline uses the canonical `26.1.0+3102` APEXlang
vocabulary and must remain the only supported whole-app scaffold contract in
this repo.

## Usage
- Use `base-app-structure._index.md` as the routing entrypoint for
  whole-application scaffolding.
- Load `base-app-structure._common.md` immediately after to align generation
  rules, required inputs, and baseline artifact guarantees.
- Use `base-app-structure.registry.json` when tooling needs a machine-readable
  catalog for this family.
- Materialize only the named runtime artifacts from `scaffold-example/` into
  `applications/app_###/`, then customize only the identifiers and attributes
  backed by the user request, requested structure, or selected template
  family.
- Treat `scaffold-example/deployments/default.json` as a required runtime seed,
  not a reusable literal. Before generating a brand new app, resolve or ask for
  the destination APEX workspace name, record it in session
  `context-resolution.json` under `db_context.workspace`, and replace
  `deployments/default.json.workspace.name` with that exact value during
  materialization.
- Allowed top-level publish targets in the generated app are `.apex/`,
  `application.apx`, `deployments/`, `page-groups.apx`, `pages/`,
  `shared-components/`, and `supporting-objects/`.
- Keep `base-app-runtime-seed.manifest.json` at the `base-app-structure/`
  root. It is runtime seed metadata, not an executable scaffold payload.
- Keep the root Markdown/JSON files in `base-app-structure/` as template-space
  docs and metadata only. Do not publish them into generated app roots.
- Keep `scaffold-example/` as the executable scaffold source in template
  space only. Do not publish the `scaffold-example/` directory itself into
  generated app roots.
- Preserve the canonical baseline vocabulary when provisioning or updating the
  scaffold:
  - `application.apx`: `navigation`, `navigationMenu`, `navigationBar`
  - `shared-components/themes/**/theme.apx`: `themeNumber`, `javaScript`,
    `navigationBarList`, `navigationMenuListPosition`,
    `navigationMenuListTop`, `navigationMenuListSide`
  - `shared-components/breadcrumbs.apx`: `pageNumber`
- Do not copy optional placeholder values or documentation-only examples such
  as sample header/footer text, `CUSTOM_FILE_NAME.css`, inline sample JS, or
  explanatory region copy unless the user explicitly asks for them. Help text
  and maintainability comments are default generation concerns and should be
  supplied through real message keys, documented sources, or provisional
  translation-ready copy rather than omitted by default.
- Preserve canonical path references and markdown-first conventions when
  updating workflow or registry links.

## Application Root Coverage
- `base-app-structure/` is the canonical owner for the `app (...)` root
  contract in this repo.
- Application-root guidance belongs here when it describes:
  - nested root blocks proven by `application.apx`
  - flat app-wide defaults such as compatibility, runtime availability,
    notifications, and deployment-sensitive paths
  - inheritance pivots such as `globalPage`, theme selection, and the current
    authentication scheme
- Reusable shared-component families such as `authentications/`,
  `authorizations/`, `lists/`, and `lovs/` still own their own component
  definitions. This family owns only the app-root selection and inheritance
  side of those relationships.

## Source Priority For Application Definition Guidance
- `scaffold-example/application.apx` is the concrete minimal app-root scaffold
  and the executable source of truth for the base app skeleton.
- `base-app-structure._common.md` is the canonical markdown owner for
  app-root naming rules, ownership boundaries, and metadata-backed defaults.
- Shared-component families provide secondary guidance only when the
  application root references one of their assets, for example the current
  authentication scheme or navigation lists.

## Safe Baseline vs Reference-Only Guidance
| Category | Default behavior |
|----------|------------------|
| Required runtime app/page/shared-component artifacts | Materialize into the new app output. |
| App identity and aliases | Replace with run-specific values. |
| Deployment workspace name | Resolve or ask for the destination workspace name, record it in session context, and replace `deployments/default.json.workspace.name` during materialization. |
| Optional CSS includes | Omit unless a real app static file exists and the run selects it. |
| Optional JS blocks | Omit unless the requirements call for page-level JS. |
| Header/footer text | Omit unless the user or source requirements provide content. |
| Help text and maintainability comments | Include by default for primary pages and key components using Text Messages, documented sources, or provisional translation-ready copy with a message-key plan. |
| Inline error text | Omit unless the user or source requirements provide content. |
| Example prose inside static regions | Do not copy into generated output. Use explicit page templates when real content is required. |

## Template Catalog
- `base-app-structure._index.md`
- `base-app-structure._common.md`
- `base-app-runtime-seed.manifest.json`
- `base-app-structure.registry.json`
- `scaffold-example/`
  - `.apex/apexlang.json`
  - `application.apx`
  - `deployments/default.json`
  - `page-groups.apx`
  - `pages/`
  - `p00000-global-page.apx`
  - `p00001-home.apx`
  - `p09999-login.apx`
  - `shared-components/`
  - `supporting-objects/`

## Maintenance
- Keep this README synchronized with actual files in the directory.
- Update catalogs and usage notes whenever templates are added, removed, or
  renamed.
- Retain deterministic guarantees for the runtime artifact set under
  `scaffold-example/`: `.apex/apexlang.json`, `application.apx`,
  `deployments/default.json`, `page-groups.apx`, the three baseline page
  seeds, `shared-components/**`, and `supporting-objects/**`.
- Do not reintroduce legacy scaffold aliases such as `nav`, `navMenu`,
  `navBar`, `themeNo`, `js`, or `pageNo`.
- Treat any example content added for documentation purposes as reference-only
  and call that out explicitly in the family docs.
- Keep app-root documentation consolidated here rather than creating parallel
  application-definition folders under `shared-components/`.

# APEXlang Templates

## Purpose
Central index for the canonical APEXlang template families used by routers, skills, and memory-bank guided generation.

## What is in this directory

- `base-app-structure/`
  - Root Markdown and JSON files are the canonical documentation and metadata contract.
  - Runtime seed metadata stays at `base-app-structure/base-app-runtime-seed.manifest.json`.
  - Executable scaffold payload lives under `base-app-structure/scaffold-example/`.
- `business-logic/`
  - Computation, dynamic action, and validation template families.
- `buttons/` and `items/`
  - Canonical button and item template families.
- `page-examples/`
  - Full page examples that combine layout, regions, and common behaviors.
- `page-layout-templates/`
  - Markdown-first Universal Theme layout contracts, shared page-template guidance, and family variants.
- `region-components/`
  - Region-family templates such as reports, forms, charts, cards, and maps.
- `shared-components/`
  - Shared APEX component templates such as LOVs, lists, breadcrumbs, and app-level settings.
- `template-components/`
  - Reusable UI-oriented template components.
- `workspace-components/`
  - Workspace-level templates when present.
- `_common_variables.template.md`
  - Shared variable catalog used across template families.

## How to use this directory

- Start with the family directory that matches the requested component or workflow scope.
- For page-scoped generation, start in `page-examples/` before drilling into region, item, button, or shared-component families.
- Load the family `_common.md` contract first, then load variant/scenario markdown files.
- Use markdown families as canonical targets in routers and registries.
- Use `template-family-registry.json` as the machine-readable template family registry for family discovery; it is not a domain routing catalog.
- Keep references aligned with `assets/rules-mapping.json` and skill entrypoints.
- Do not use `applications/**` as a pattern source or scaffold reference for any template family in this directory.

## Core DSL Shape Rules

- `name { ... }` means `name` is a nested block or section.
- `name: ...` means `name` is a property assignment.
- `name: { ... }` means `name` is a property whose value is an object.
- Do not normalize between block syntax and property-object syntax by analogy. Follow compiler-backed truth and the emitted shape from the owning template family.
- Keep structural DSL multiline and block-safe:
  - emit one property assignment per line
  - do not place two sibling properties on the same line
  - for object-valued properties, emit `name: {` on its own line, then nested properties on following lines
  - do not compress nested objects onto one line such as `viewEditLink: { page: 16 items: { P16_ID: &ID. } }`
  - do not open a property-object and emit nested property content on the same line
  - do not rely on inline compact object syntax even when it looks unambiguous; use expanded multiline object syntax instead

## Template Catalog
- `base-app-structure/`
- `business-logic/`
- `buttons/`
- `items/`
- `page-examples/`
- `page-layout-templates/`
- `region-components/`
- `shared-components/`
- `template-components/`
- `workspace-components/`
- `template-family-registry.json`
- `_common_variables.template.md`

## Maintenance
- Keep this README synchronized with actual files in the directory.
- Update catalogs and usage notes whenever templates are added, removed, or renamed.
- Ensure top-level guidance remains consistent with governance, routing assets, and canonical template path policy.

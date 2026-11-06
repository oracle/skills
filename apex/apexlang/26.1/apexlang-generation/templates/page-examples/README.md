# Page Examples

## Purpose
Canonical full-page examples used when a workflow needs a page-level starting point instead of an isolated component template.

## What is in this directory

This directory currently includes page examples for:

- blank pages
- calendar pages
- classic report pages
- dashboard pages
- faceted search pages
- form pages
- global page 0 patterns
- home pages
- interactive grid pages
- interactive report pages
- login pages
- map pages
- task-definition pages

## Folder contract

For each page example under `page-examples/<page-name>/`:

- `<page-name>._index.md`
  - Primary markdown entrypoint for the page example.
- `<page-name>._common.md`
  - Shared contract and conditional guidance for that page family.
- `<page-name>.example.md`
  - Markdown-preserved APEXlang example paired with the contract.

## How to use this directory

1. Choose the page example folder that matches the requested page type.
2. Load `<page-name>._index.md` first.
3. Load `<page-name>._common.md` next.
4. Load `<page-name>.example.md` only when concrete syntax or composition examples are needed.
5. Use `page-examples.registry.json` when tooling needs a machine-readable catalog for this family.
6. Treat this directory as the canonical page-pattern source for page-scoped generation; do not mine `applications/**` for page examples.

## Maintenance

- Keep the folder contract aligned with the actual naming pattern in each page folder.
- Keep examples as Markdown files with fenced `apexlang` blocks, not standalone template files.
- When a new page example family is added or removed, update the directory summary above.
- Keep `page-examples.registry.json` aligned with the available page example folders.

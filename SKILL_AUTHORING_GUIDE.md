# Skill Authoring Guide

This repository is the official Oracle-wide source for curated skills organized by domain under `skills/`.

Use this guide when adding or updating skills so the repository stays consistent across Oracle Database, OCI, Fusion, and future domains.

## Goals

- Keep skills domain-oriented and easy to discover.
- Prefer official Oracle documentation over inferred behavior.
- Make each skill usable on its own without requiring the full repo.
- Keep file structure, tone, and metadata consistent across domains.

## Repository Model

Skills are grouped by domain:

```text
skills/
├── db/
├── oci/
└── fusion/
```

Each domain should own:

- A `SKILL.md` file that explains the domain and how to navigate it.
- Topic folders or markdown files that stay coherent within that domain.

## Before You Add a Skill

1. Confirm the topic belongs in an existing domain.
2. Check whether the topic should extend an existing skill instead of creating a new one.
3. Choose a path that matches the current domain taxonomy.
4. Decide whether the content is version-sensitive and what Oracle versions it applies to.

## Path and Naming Best Practices

- Put the skill in the correct domain first, then the most specific category.
- Use short, stable, descriptive filenames in lowercase with hyphens.
- Keep one primary topic per file.
- Avoid filenames tied to temporary product marketing language unless that name is the official product term.
- Prefer paths like `skills/db/sqlcl/sqlcl-mcp-server.md` over broad catch-all files.

## Research Standards

Before writing, gather source material from the most authoritative documentation available.

Preferred sources, in order:

1. Oracle product documentation on `docs.oracle.com`
2. Oracle-owned repositories and samples
3. Oracle-authored blogs or product team posts
4. Oracle LiveLabs

Best practices:

- Verify exact command names, flags, package names, parameters, and view names.
- Verify minimum version requirements for features and syntax.
- Distinguish documented behavior from inference.
- If a detail cannot be verified, omit it or clearly mark it as unverified.

## Writing Standards

Each skill should be practical, self-contained, and written for fast operational use.

Prefer this structure:

1. `## Overview`
2. Problem framing or core concepts
3. Practical examples
4. Best practices and common mistakes
5. `## Oracle Version Notes (19c vs 26ai)` when version differences matter
6. `## Sources`

Writing expectations:

- Lead with what the skill helps the reader do.
- Use short sections and concrete examples.
- Keep examples realistic and Oracle-specific.
- Explain why something matters when it affects safety, correctness, or performance.
- Avoid filler, speculation, and repeated background material.

## Version Guidance

- Use Oracle Database 19c as the baseline compatibility target unless there is a better domain-specific baseline.
- Call out features that require newer releases.
- When behavior differs by version, state the version explicitly.
- Provide fallback guidance when practical.

## Safety and Quality

Be especially careful with content that can cause damage or confusion.

- For DML and DDL guidance, prefer safe workflows and pre-flight checks.
- For security topics, prefer least-privilege examples.
- For operational guidance, separate required steps from optional optimizations.
- Do not include invented defaults, undocumented environment variables, or guessed CLI flags.

## Cross-Linking

- Link to nearby related skills when they materially help the reader.
- Prefer domain-local references when possible.
- Update the domain index files when a new skill changes navigation.

## Required Follow-Through

When adding, moving, or renaming a skill:

1. Update the relevant domain `SKILL.md`.
2. Update the root `README.md` if the domain layout or repo navigation changed.
3. Check for stale links and old paths across the repo.

## Review Checklist

Before submitting a new or updated skill, confirm:

- The file path matches the intended domain and category.
- The title and filename match the topic.
- Examples use valid Oracle syntax and terminology.
- Version notes are present when needed.
- All major claims are backed by official Oracle sources.
- The file ends with a `## Sources` section.
- Navigation docs were updated if needed.

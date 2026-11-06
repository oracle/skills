---
templateId: metric-card.permutations
componentType: region
version: 1.0
description: APEX 26.1 Metric Card permutation and regression coverage matrix.
---

# Purpose

Define the finite branch and enum coverage required for a Metric Card QA application. This is a coverage contract, not a requirement to generate the full Cartesian product. Use pairwise pages so every accepted token and conditional branch is exercised at least once without duplicating equivalent combinations.

# Output Template

Generate native `themeTemplateComponent/metricCard` regions from the canonical partial and report scenarios. Each generated region must select one valid value from every enabled axis below and must not combine mutually exclusive payloads.

| Axis | Required coverage |
| --- | --- |
| Display | `partial`, `report` |
| Root text | required `metric`; optional title/meta and all three CSS-class hooks |
| Report layout | omitted/default, `2Columns`, `3Columns`, `4Columns`, `5Columns`, `autoWrapping`, `overflow`, `stacked` |
| Report item classes | omitted and one safe static class list |
| Avatar type | omitted, static `icon`, source-backed `icon` with a proven Font APEX CASE mapping, `initials`, image `url`, image `urlColumn`, image `blobColumn` |
| Avatar image path | static `#APP_FILES#` and `#APEX_FILES#`; source-backed `:APP_FILES` and `:APEX_FILES`; complete BLOB companion-column mapping |
| Avatar position/alignment | omitted/default; `top`; `inline` with `start`, `center`, and `end` |
| Avatar shape | omitted/default, `circular`, `noShape`, `rounded`, `square` |
| Avatar size | omitted/default, `small`, `medium`, `large` |
| Avatar style | omitted; `subtle` with icon; `subtle` with initials; never with image |
| Badge core | omitted; enabled with static label; enabled with source-backed varchar2 label |
| Badge value type | `varchar2`, `number`, `date`, `intervalYearToMonth`, `intervalDayToSecond` |
| Badge state | omitted, `danger`, `warning`, `success`, `info` |
| Badge visuals | icon omitted/present; displayLabel false/true; style omitted/`outline`/`subtle`; shape omitted/`circular`/`rounded`/`square`; size omitted/`small`/`medium`/`large` |
| Grouping | omitted; group title; group title plus icon, grouped column, and leading static order |
| Row selection | omitted, `focusOnly`, `singleSelection`, `multipleSelection` with the required identity and page-item bindings |
| Messages | omitted; `whenNoDataFound`; `whenNoDataFound` plus `noDataFoundIcon` |
| Pagination | omitted; `entitiesPerPage`; never `type` or `showTotalCount` |
| Ordering | omitted when unnecessary; `staticValue`; `item` with a valid same-page item |
| Link action | omitted; `redirectThisApp`; `redirectOtherApp`; safe `redirectUrl`; `triggerAction`, always at `position: link` and without an action template; safe static `linkAttributes` and unsafe URL/inline-handler rejection cases |
| Column type | every delivered report projection uses one exact supported Metric Card column data type |
| Region policy | blank wrapper default, explicit standard wrapper case, optional accessibility, condition, authorization, comments, and DOM id only when justified |

# Conditional Rendering Rules

- Partial pages cover only component-scope text/CSS properties, Avatar, Badge, and link action branches. Omit every report-only setting and block.
- Report pages cover layout, item classes, grouping, selection, messages, pagination, source ordering, and explicit source-column metadata.
- Use one Avatar payload per region. Image modes are separate cases; BLOB mode includes all four typed companion aliases.
- `plugin-avatar.style: subtle` is legal only for icon or initials.
- Use pairwise visual combinations for Avatar and Badge. The matrix must cover every value, but it must not create redundant copies of the same semantic branch.
- Treat the Badge state allowlist and image URL safety rules as source contracts, not presentation-only checks.
- Use `SYS.DUAL` only in an explicit QA fixture with `object_evidence_source: user_asserted`; production generation requires target schema evidence.

# Validation Checklist

- Every value and omission branch in the matrix appears in at least one generated page and in a page inventory.
- Every page passes strict formatting, local validation, compiler-truth audit, and target-build `apex validate`.
- Negative regression checks reject report-only properties in partial mode, pagination `type`/`showTotalCount`, image Avatar style, invalid Avatar payload combinations, unsafe image URLs, invalid Badge states, and incomplete action/selection/grouping dependencies.
- The application is check-only unless the user explicitly chooses import after live validation passes.

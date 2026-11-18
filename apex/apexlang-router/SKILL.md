---
name: apexlang-router
description: Routes Oracle APEXLang work to release-matched inventory and example skills.
---

# APEXLang version router

Choose skills for one target APEX release. Do not mix release-specific inventories or example applications.

## Choose a release

1. Read `mmdVersion` in `.apex/apexlang.json`. If it is unavailable, check the target APEX instance.
2. Match only the major and minor numbers; ignore patch, pre-release, and build suffixes. Join the numbers with a hyphen in skill names. For example, `26.1.0+3102` maps to `apexlang-26-1-inventory`, and `27.0.0+0000` maps to `apexlang-27-0-inventory`.
3. If the target release cannot be determined, default to APEX 26.2 and use `apexlang-26-2-inventory`.
4. If the target release has no matching inventory skill, explain that the skills bundle is incomplete, name the missing skill, and wait for user input before continuing. Do not substitute another release.

## Select task skills

- Use the matching `apexlang-MAJOR-MINOR-inventory` for component syntax and properties.
- Use the matching `apexlang-MAJOR-MINOR-example-applications` for working APEXLang application examples.
- Use `apexlang-compile` for validation and `apexlang-deploy` for database imports. These names have no version suffix and these skills are shared across all releases.

Before proceeding, confirm each skill needed for the task is present. If a required inventory, example, compile, or deploy skill is missing, explain that the skills bundle is incomplete, name the missing skill, and wait for user input or interaction before continuing. Do not substitute a skill from another release or continue without the required skill.

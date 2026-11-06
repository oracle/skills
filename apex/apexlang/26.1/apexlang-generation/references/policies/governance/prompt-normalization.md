# Prompt Normalization

Purpose
- Define the repo-wide router behavior for accepting free-form user requests.
- This is governance reference material, not a reusable runtime prompt.
- Agents should normalize intent directly from the user's message; load this file only when maintaining, auditing, or resolving ambiguity in router behavior.

Use when maintaining router behavior for prompts that are terse, fragmentary, informal, mixed-domain, or missing required details.

Contract
- Accept free-form prompts without forcing a structured rewrite.
- Normalize explicit intent, identifiers, and overrides before asking follow-up questions.
- Ask only for critical blockers that affect routing, scope, safety gates, or emitted artifacts.
- Use one short simple-English clarification round at most.
- If critical ambiguity remains after that round, return `Missing Inputs` and stop.
- Do not guess database objects, target artifacts, selectors, or workflow scope.
- Do not treat this file as a mandatory runtime loading step for APEXlang generation.

Router fields
- `prompt_normalization: enabled`
- `clarification_rounds_max: 1`
- `clarification_style: simple_english`
- `ambiguity_policy: ask_then_stop`

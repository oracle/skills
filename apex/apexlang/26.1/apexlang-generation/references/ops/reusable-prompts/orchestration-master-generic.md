# Constitutional Orchestration Master — Generic Prompt

Purpose
- Reusable generic orchestration prompt for multi-agent planning/execution pipelines.
- Deterministic artifact expectations, explicit missing-input prompts, and domain-specific execution defaults.

Source
- Migrated from previous docs reusable prompt set.
- Use this as a generic scaffold, not a replacement for domain `SKILL.md` contracts.

Core defaults
- `dry_run: true`
- ask for execution approval only when the host environment requires it, phrased as a short task-level prompt rather than environment mechanics
- do not add a separate deploy/import confirmation when the active domain contract defines online auto-deploy as the default
- ask for missing inputs, do not fabricate
- minimal context loading

See domain masters for runtime contracts:
- `SKILL.md`
- `external:oracle-db/plsql`
- `external:oracle-db/schema-modeling`

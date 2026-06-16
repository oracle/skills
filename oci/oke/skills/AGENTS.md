# Skills Directory Instructions

## Skill Structure

Every skill must have:

- `SKILL.md` with YAML frontmatter containing `name` and `description`.
- A concise body that explains the core workflow and points to references or scripts only when needed.

Optional files:

- `references/` for longer notes, examples, constraints, and troubleshooting details.
- `scripts/` for deterministic helpers that are easier to test than prose-only workflows.
- `agents/openai.yaml` for Codex-facing skill UI metadata when useful.

## Skill Authoring Rules

- Keep `SKILL.md` focused on procedure, guardrails, and when to load extra resources.
- Put large examples, detailed troubleshooting notes, and edge-case explanations in `references/`.
- Prefer discovery helpers over asking users for raw OCIDs when the environment can enumerate choices.
- Make scripts safe to run offline where possible; destructive OCI or Kubernetes actions must require explicit user confirmation in the skill workflow.
- Public examples must use placeholders instead of real tenancy values, cluster OCIDs, private IPs, or customer names.
- When a skill relies on another skill, state the handoff clearly. For example, multihome pod validation should tell users to run the GVA deployer first if the node pool does not yet have GVA secondary VNIC profiles.

## Validation

After changing skill scripts, run:

```bash
bash tests/scripts-smoke.sh
```

If adding a new OKE skill, update `oci/SKILL.md`, the root `README.md`, and the relevant `oci/oke/*.md` routing file.

## Sources

- https://github.com/oracle/skills/blob/main/SKILL_AUTHORING_GUIDE.md
- https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm

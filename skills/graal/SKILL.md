# Oracle Graal Skills

This file is a sample skeleton for how a domain-level `SKILL.md` can be structured for Graal and GraalVM-related content.

Use it as a pattern for future Graal domain navigation, not as a todo list or commitment to a final taxonomy.

## How to Use This Domain

1. Start with the routing table below.
2. Read only the specific file or category you need.
3. Use the sections below as a template for organizing Graal skills as the domain evolves.

## Directory Structure

```text
skills/graal/
├── core/           Example: GraalVM setup, runtimes, tooling
├── java/           Example: JVM mode, optimization, framework usage
├── native-image/   Example: builds, config, debugging, startup tuning
├── polyglot/       Example: JS, Python, Ruby, interop patterns
├── frameworks/     Example: Spring, Micronaut, Quarkus, Helidon
├── observability/  Example: diagnostics, profiling, troubleshooting
└── deployment/     Example: containers, serverless, OCI integration
```

## Category Routing

| Topic | Directory |
|-------|-----------|
| GraalVM installation, runtimes, tooling basics | `skills/graal/core/` |
| Java on GraalVM, JVM mode, performance tuning | `skills/graal/java/` |
| Native image configuration, builds, debugging, optimization | `skills/graal/native-image/` |
| Polyglot runtimes and language interop | `skills/graal/polyglot/` |
| Framework-specific GraalVM guidance | `skills/graal/frameworks/` |
| Diagnostics, profiling, troubleshooting | `skills/graal/observability/` |
| Container, serverless, and OCI deployment patterns | `skills/graal/deployment/` |

## Key Starting Points

- Sample section only
- Use this area to link a few high-value entry points once the domain has real content
- Keep framework-specific guidance separate from runtime fundamentals

## Common Multi-Step Flows

| Task | Recommended Sequence |
|------|----------------------|
| Sample native image flow | `core` → `native-image` → `observability` |
| Build and tune a native image | `core` → `native-image` → `observability` |
| Deploy a GraalVM application | `java` or `frameworks` → `deployment` → `observability` |
| Add polyglot runtime capabilities | `core` → `polyglot` → `deployment` |

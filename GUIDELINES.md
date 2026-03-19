# Oracle DB Skills Repo: AI Agent Training Corpus Optimization Plan

**Status**: 🟢 Implementation Ready  
**Last Updated**: 2024-06-20  
**Target**: Transform `krisrice/oracle-db-skills` into a high-fidelity training corpus for Oracle-specialized code agents (SQL/PL/SQL generators, linters, copilots)  
**Core Principle**: Prioritize *data consistency, version awareness, contrastive safety examples, and ML-ready structure* over human pedagogy  

---

## 📋 Phase 1: Audit & Baseline (Current State Assessment)
*Measure before changing to target efforts effectively.*

### Tasks:
- [ ] Run SQLFluff (Oracle dialect) on all `.sql/.plsql` files → quantify formatting violations (indentation, case, commas)  
- [ ] Catalog Oracle version usage: Grep for version-specific features (e.g., `JSON_TABLE` → 12.1.0.2+, `SQL MACROS` → 23c)  
- [ ] Identify anti-pattern hotspots: Search for `SELECT *`, `COMMIT IN LOOP`, `EXCEPTION WHEN OTHERS THEN NULL`, etc.  
- [ ] Output: `BASELINE_REPORT.md` with metrics  

### Example Baseline Report Snippet:
```markdown
- Total files: 142  
- Formatting violations: 89% (avg 3.2/file)  
- Version-tagged: 0%  
- High-risk anti-patterns found: 21 instances (e.g., 8x `SELECT *`, 5x missing WHERE in UPDATE)  
- Modern feature coverage: JSON (12%), Multitenant (0%), SQL Macros (0%)  
```

## 🧹 Phase 2: CORPUS STANDARDIZATION (ML-READY DATA PREP)  
*Non-negotiable foundation. Skip this → all later phases fail due to noise.*

### Enforced Rules (via CI + Pre-commit Hooks):
| Rule | Implementation | Why for AI Training |
|------|----------------|---------------------|
| **Strict casing** | SQLFluff `LT03` (keywords UPPER) + `LT09` (identifiers lowercase_with_underscores) | Reduces token variance; agents learn `SELECT` not `Select`/`select` as separate tokens |
| **Leading commas** | Custom SQLFluff rule (or `pg_format` adapter) | Improves diff readability → cleaner git history for versioned snippets |
| **2-space indent** | SQLFluff `LT02` | Consistent token spacing → better n-gram modeling |
| **Always-terminated** | Pre-commit hook: `sed -i 's/\([^;]\)$/\1;/'` (handles PL/SQL blocks) | Prevents `ORA-00933: SQL command not properly ended` in generated code |
| **Version header** | Mandatory template (see below) | Enables version-aware generation (critical for cloud vs on-prem) |
| **No hardcoded secrets** | Regex scan for `PASSWORD`, `PWD`, `SECRET` in snippets | Avoids teaching agents to leak credentials |

### Version Header Template (Add to TOP of every file):
```sql
-- ORACLE_VERSION_MIN: 12.1.0.2   -- Min version where syntax works
-- ORACLE_VERSION_MAX: 23c        -- Max tested version (NULL = latest)
-- USAGE_FREQUENCY: [HIGH/MEDIUM/LOW]  -- Based on Oracle Cloud telemetry
-- FEATURE: [JSON_TABLE, MATCH_RECOGNIZE, etc.]  -- Primary skill demonstrated
-- ANTIPATTERN: [e.g., "Missing WHERE in UPDATE"]  -- For contrastive pairs (Phase 4)
-- VALIDATED_ON: [ATP_FREE_TIER, XE_21C, etc.]  -- Where tested

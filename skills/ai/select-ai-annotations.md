# Select AI Annotations in Oracle AI Database

## Overview

Oracle documents Select AI annotations as metadata that can be added to database objects and then included in the metadata sent to the LLM for SQL generation.

Use this file when you need to design, add, inspect, or enable annotations for Select AI NL2SQL workflows.

---

## Documentation Map

| Topic | Oracle documentation |
|---|---|
| Select AI annotation example | Autonomous Database documentation, **Examples of Using Select AI** |
| Metadata improvements for SQL generation | Autonomous Database release notes, **Interact with metadata to improve Select AI SQL query generation** |
| SQL annotation syntax | Oracle AI Database SQL Language Reference, **annotations_clause** |
| Annotation inventory views | Oracle Database Reference, **ALL_ANNOTATIONS** and **ALL_ANNOTATIONS_USAGE** |

---

## What Select AI Uses

Oracle documents that Select AI can integrate annotations by adding them to the metadata that is sent to the LLM.

Enable this behavior in the AI profile with:

```sql
"annotations" : "true"
```

Oracle's Select AI examples show this profile pattern:

```sql
BEGIN
  DBMS_CLOUD_AI.CREATE_PROFILE(
   profile_name => 'GOOGLE_ANNOTATIONS',
   attributes   => '{"provider": "google",
      "credential_name": "GOOGLE_CRED",
      "object_list": [{"owner": "ADB_USER", "name": "emp2"}],
      "annotations" : "true"
      }');
END;
/
```

---

## How Oracle Annotations Work

Oracle documents annotations as centrally stored application metadata for schema objects.

The SQL Language Reference states:

- annotations can be added at `CREATE` time
- annotations can be added, dropped, or replaced with `ALTER`
- annotations are additive
- an annotation has a name and an optional value
- the name and value are freeform text fields

Oracle documents supported schema objects including tables, views, materialized views, and indexes. Oracle also documents column-level annotations in table DDL.

---

## Table-Level and Column-Level Annotation Patterns

Oracle documents column-level and table-level annotation patterns such as:

```sql
CREATE TABLE employee (
  id NUMBER(5)
    ANNOTATIONS(Identity, Display 'Employee ID', "Group" 'Emp_Info'),
  ename VARCHAR2(50)
    ANNOTATIONS(Display 'Employee Name', "Group" 'Emp_Info'),
  sal NUMBER
    ANNOTATIONS(Display 'Employee Salary', UI_Hidden)
) ANNOTATIONS (Display 'Employee Table');
```

Oracle's Select AI example also shows annotations designed for SQL generation:

```sql
CREATE TABLE emp2 (
    empno NUMBER,
    ename VARCHAR2(50) ANNOTATIONS (display 'lastname'),
    salary NUMBER ANNOTATIONS ("person_salary", "column_hidden"),
    deptno NUMBER ANNOTATIONS (display 'department')
)ANNOTATIONS (requires_audit 'yes', version '1.0', owner 'HR Organization');
```

This shows that Select AI can consume both table-level and column-level annotations when `annotations` is enabled in the profile.

---

## Annotation DDL Operations

Oracle documents the following operations in `annotations_clause`:

- `ADD`
- `DROP`
- `REPLACE`

Oracle documents `ADD` as the default operation for `CREATE` statements.

Example from the SQL Language Reference:

```sql
ALTER TABLE employee
  MODIFY ename ANNOTATIONS (
    DROP "Group",
    DROP IF EXISTS missing_annotation,
    REPLACE Display 'Emp name'
  );
```

Use `REPLACE` when the annotation already exists and the value needs to be changed.

---

## Inspecting and Auditing Annotations

Oracle documents dictionary views for annotation inventory and usage.

Use:

- `USER_ANNOTATIONS`
- `ALL_ANNOTATIONS`
- `USER_ANNOTATIONS_USAGE`
- `ALL_ANNOTATIONS_USAGE`

Oracle documents `ALL_ANNOTATIONS` as the list of annotation names accessible to the current user, and `ALL_ANNOTATIONS_USAGE` as usage information that includes object name, object type, column name, annotation name, and annotation value.

These views are the documented way to verify what annotation metadata exists before enabling `"annotations":"true"` in a profile.

---

## Relationship to Comments and Constraints

Oracle's Select AI examples and release notes group these metadata controls together:

- `comments`
- `annotations`
- `constraints`

Oracle documents:

- comments improve SQL generation by adding table and column comments to LLM metadata
- annotations improve SQL generation by adding annotations to LLM metadata
- constraints improve SQL generation by adding foreign key and referential key constraints for accurate `JOIN` conditions

Use annotations as one metadata source, not as the only metadata source in an NL2SQL design.

---

## Best Practices

- Enable `"annotations":"true"` only when the annotated objects are intentionally part of the AI profile scope.
- Use column-level annotations when the extra metadata applies to one attribute rather than the whole table.
- Use annotation inventory and usage views to review metadata before enabling it for Select AI.
- Combine annotations with comments and constraints when the docs show that all three improve SQL generation in different ways.

---

## Common Mistakes

### Mistake 1: Adding Database Annotations but Not Enabling Them in the AI Profile

Oracle documents that Select AI uses annotations only when `"annotations":"true"` is specified in the profile.

### Mistake 2: Expecting Annotations to Replace Constraint Metadata

Oracle documents constraints separately for accurate `JOIN` generation. Annotations are not documented as the substitute for foreign-key metadata.

### Mistake 3: Skipping Annotation Inventory Checks

Oracle documents dictionary views for annotation names and usage. Use them to verify what will be exposed as metadata.

---

## Oracle Version Notes (19c vs 26ai)

- **Oracle Database 19c (generic):** Select AI annotations are not part of the generic 19c baseline.
- **Oracle AI Database 19.28+:** Oracle documents SQL annotation syntax in the SQL Language Reference.
- **Oracle AI Database 26ai:** Oracle documents Select AI integration for annotations and annotation dictionary views such as `ALL_ANNOTATIONS` and `ALL_ANNOTATIONS_USAGE`.

---

## Sources

- [Autonomous Database documentation - Examples of Using Select AI](https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/select-ai-examples.html)
- [Autonomous Database release notes - Interact with metadata to improve Select AI SQL query generation](https://docs.oracle.com/en-us/iaas/releasenotes/autonomous-database-dedicated/adbd-selectai-sqlquerygen.htm)
- [Oracle AI Database SQL Language Reference - annotations_clause](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/annotations_clause.html)
- [Oracle Database Reference - ALL_ANNOTATIONS](https://docs.oracle.com/en/database/oracle/oracle-database/26/refrn/ALL_ANNOTATIONS.html)
- [Oracle Database Reference - ALL_ANNOTATIONS_USAGE](https://docs.oracle.com/en/database/oracle/oracle-database/26/refrn/ALL_ANNOTATIONS_USAGE.html)

# APEX Application Table Audit Columns

Use this pattern for APEX-owned application tables when the application needs simple change metadata. This is application-level audit metadata, not a replacement for tamper-resistant database auditing.

DB skill in use: `db/security/auditing.md` for generic database auditing, Unified Auditing, FGA, compliance audit policies, or tamper-resistant audit design. The APEX security skill is being used for APEX-owned application-table audit-column context.

## Columns

For new APEX application tables, prefer consistent audit columns:

```sql
created_at  TIMESTAMP WITH LOCAL TIME ZONE,
created_by  VARCHAR2(255),
updated_at  TIMESTAMP WITH LOCAL TIME ZONE,
updated_by  VARCHAR2(255)
```

## Trigger Pattern

Use the APEX session user when available, with a database-user fallback. In APEX runtime, `USER` and `SESSION_USER` commonly identify the parsing schema, not the end user.

```sql
CREATE OR REPLACE TRIGGER sales_orders_biu_audit
    BEFORE INSERT OR UPDATE ON sales_orders
    FOR EACH ROW
DECLARE
    l_actor VARCHAR2(255);
BEGIN
    l_actor := COALESCE(
        NULLIF(SYS_CONTEXT('APEX$SESSION', 'APP_USER'), ''),
        SYS_CONTEXT('USERENV', 'SESSION_USER'));

    IF INSERTING THEN
        :NEW.created_at := COALESCE(:NEW.created_at, SYSTIMESTAMP);
        :NEW.created_by := COALESCE(:NEW.created_by, l_actor);
    END IF;

    :NEW.updated_at := SYSTIMESTAMP;
    :NEW.updated_by := l_actor;
END;
/
```

For tables where callers must not override creation metadata, assign `created_at` and `created_by` unconditionally on insert instead of using `COALESCE`.

## Guardrails

- Do not use audit-column triggers to copy passwords, tokens, large payloads, BLOBs, CLOBs, or sensitive free text into audit tables by default.
- On hot tables, bulk-load paths, or ETL-heavy workloads, call out row-level trigger cost.
- Consider database-generic alternatives such as compound triggers, history tables, Unified Auditing, or Flashback Data Archive through the relevant DB skill.
- The trigger records application change metadata only; it is not a replacement for tamper-resistant database auditing.

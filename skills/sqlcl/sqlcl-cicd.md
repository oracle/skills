# SQLcl in CI/CD Pipelines

## Overview

SQLcl is well-suited for CI/CD pipelines because it is a standalone Java executable with no Oracle Client installation required, supports non-interactive (headless) execution, can connect to Oracle Cloud Autonomous Database via wallet, and returns meaningful exit codes that CI/CD systems can act on. Combined with its built-in Liquibase support, SQLcl can serve as the single tool for schema migrations, data seeding, DDL extraction, and validation checks in automated deployment pipelines.

This guide covers:
- Running SQLcl non-interactively
- Handling exit codes
- Connecting to cloud databases without interactive prompts
- Integrating with GitHub Actions and GitLab CI
- Environment variable substitution
- Logging and error capture patterns

---

## Running SQLcl Non-Interactively

### Basic Headless Execution

The `-S` (silent) flag suppresses the SQLcl banner and all interactive prompts:

```shell
sql -S username/password@service @deploy.sql
```

The `@deploy.sql` script is executed and SQLcl exits when the script completes or when an `EXIT` command is reached.

### Passing Commands via stdin

```shell
echo "SELECT COUNT(*) FROM employees; EXIT;" | sql -S username/password@service
```

Or using a heredoc (preferred for multi-line scripts):

```shell
sql -S username/password@service <<'EOF'
SET FEEDBACK ON
SELECT COUNT(*) FROM employees;
EXIT
EOF
```

### Running a Script File

```shell
sql -S username/password@service @/path/to/script.sql
```

### Command-line -c Flag (Inline Command)

> ⚠️ Unverified: The `-c` flag for passing an inline SQL command is not listed in the official SQLcl 25.2 startup flags documentation (`-H[ELP]`, `-V[ERSION]`, `-C[OMPATIBILITY]`, `-L[OGON]`, `-NOLOGINTIME`, `-R[ESTRICT]`, `-S[ILENT]`, `-mcp`). Use stdin or a script file instead.

```shell
# Preferred: use stdin or a script file
echo "SELECT SYSDATE FROM DUAL; EXIT;" | sql -S username/password@service
sql -S username/password@service @script.sql
```

---

## Exit Code Handling

SQLcl exits with code `0` on success and a non-zero code on failure. However, to ensure failures in SQL scripts cause non-zero exits, you must use `WHENEVER SQLERROR` at the top of your scripts.

### Essential Exit Code Pattern

Every CI/CD SQL script should begin with:

```sql
-- deploy.sql
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
WHENEVER OSERROR  EXIT 9 ROLLBACK

SET FEEDBACK ON
SET ECHO ON

-- Your SQL statements here
ALTER TABLE employees ADD (middle_name VARCHAR2(30));

COMMIT;
EXIT 0
```

| Statement | Meaning |
|---|---|
| `WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK` | On any SQL error, exit with the Oracle error code and roll back uncommitted changes |
| `WHENEVER OSERROR EXIT 9 ROLLBACK` | On any OS error, exit with code 9 and roll back |
| `EXIT 0` | Explicit success exit at the end |
| `EXIT 1` | Explicit failure exit (use for validation failures) |

### Checking Exit Code in Shell

```shell
sql -S user/pass@service @deploy.sql
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo "ERROR: SQL deployment failed with exit code $EXIT_CODE"
    exit $EXIT_CODE
fi
echo "Deployment successful"
```

### Exit Codes for Validation Scripts

```sql
-- validate_schema.sql
WHENEVER SQLERROR EXIT SQL.SQLCODE

-- Check required tables exist
DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM user_tables
    WHERE table_name IN ('EMPLOYEES','DEPARTMENTS','JOBS');

    IF v_count < 3 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Required tables missing. Expected 3, found ' || v_count);
    END IF;
END;
/

-- Check no invalid objects
DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM user_objects WHERE status = 'INVALID';
    IF v_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20002, v_count || ' invalid objects found after deployment');
    END IF;
END;
/

EXIT 0
```

---

## Connecting with Oracle Cloud Wallet in Headless Mode

### Wallet Setup

```shell
# Unzip the wallet to a directory accessible by the CI runner
mkdir -p /tmp/wallet
echo "$WALLET_ZIP_BASE64" | base64 -d > /tmp/wallet.zip
unzip -q /tmp/wallet.zip -d /tmp/wallet
chmod 600 /tmp/wallet/*
```

### Setting TNS_ADMIN

```shell
export TNS_ADMIN=/tmp/wallet
```

The `sqlnet.ora` in the wallet directory contains:
```
WALLET_LOCATION=(SOURCE=(METHOD=file)(METHOD_DATA=(DIRECTORY=/tmp/wallet)))
SSL_SERVER_DN_MATCH=yes
```

### Connecting

```shell
# Use the TNS alias defined in the wallet's tnsnames.ora
sql -S "${DB_USER}/${DB_PASSWORD}@${DB_SERVICE_NAME}" @deploy.sql
```

Where `DB_SERVICE_NAME` is one of the aliases defined in the wallet's `tnsnames.ora` (e.g., `myatp_high`, `myatp_medium`, `myatp_low`).

### Full Cloud Connection Example

```shell
export TNS_ADMIN=/tmp/wallet
sql -S admin/MyPassword123@myatp_high <<'EOF'
WHENEVER SQLERROR EXIT SQL.SQLCODE
SELECT instance_name, status FROM v$instance;
EXIT 0
EOF
```

---

## Environment Variable Substitution

### Using Shell Variables in SQL Scripts

SQLcl supports SQL*Plus-style substitution variables (`&variable_name`). You can pass values through the environment by defining them before the script runs:

```sql
-- deploy_env.sql
DEFINE ENV     = &1
DEFINE APP_VER = &2

PROMPT Deploying version &APP_VER to environment &ENV
SELECT 'Deploying to: ' || '&ENV' AS info FROM DUAL;
```

Pass arguments from the command line:

```shell
sql -S user/pass@service @deploy_env.sql PROD v2.5.1
```

### Using Shell Variable Expansion

For environment variables from the shell, use the shell's own variable substitution in the heredoc:

```shell
export APP_VERSION="2.5.1"
export DEPLOY_ENV="production"

sql -S "${DB_USER}/${DB_PASSWORD}@${DB_SERVICE}" <<EOF
WHENEVER SQLERROR EXIT SQL.SQLCODE

INSERT INTO deployment_log (version, environment, deployed_at)
VALUES ('${APP_VERSION}', '${DEPLOY_ENV}', SYSDATE);

COMMIT;
EXIT 0
EOF
```

Note: Use `<<EOF` (not `<<'EOF'`) to allow shell variable expansion inside the heredoc.

### DEFINE Variables for Script-internal Configuration

```sql
-- parameters.sql (sourced at start of pipeline scripts)
DEFINE SCHEMA_NAME  = HR
DEFINE APP_VERSION  = 2.5.1
DEFINE ROLLBACK_TAG = v2.4.0

PROMPT Schema: &SCHEMA_NAME
PROMPT Version: &APP_VERSION
```

```sql
-- deploy.sql
@parameters.sql
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
lb tag -tag &APP_VERSION
lb update -changelog-file controller.xml
EXIT 0
```

---

## GitHub Actions Integration

### Basic Workflow

```yaml
# .github/workflows/deploy-db.yml
name: Deploy Database Changes

on:
  push:
    branches: [main]
    paths:
      - 'db/**'
  pull_request:
    branches: [main]
    paths:
      - 'db/**'

env:
  TNS_ADMIN: /tmp/wallet

jobs:
  validate:
    name: Validate SQL Changes
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Java
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'

      - name: Install SQLcl
        run: |
          curl -sL https://download.oracle.com/otn_software/java/sqldeveloper/sqlcl-latest.zip -o sqlcl.zip
          unzip -q sqlcl.zip -d /opt
          echo "/opt/sqlcl/bin" >> $GITHUB_PATH

      - name: Set up Oracle wallet
        run: |
          mkdir -p /tmp/wallet
          echo "${{ secrets.WALLET_ZIP_B64 }}" | base64 -d | unzip -q -d /tmp/wallet -

      - name: Validate changelog status
        run: |
          cd db
          sql -S "${{ secrets.DB_USER }}/${{ secrets.DB_PASS }}@${{ secrets.DB_SERVICE }}" <<'EOF'
          WHENEVER SQLERROR EXIT SQL.SQLCODE
          lb status -changelog-file controller.xml
          EXIT 0
          EOF

  deploy:
    name: Deploy to Test
    runs-on: ubuntu-latest
    needs: validate
    if: github.ref == 'refs/heads/main'
    environment: test
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Java
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'

      - name: Install SQLcl
        run: |
          curl -sL https://download.oracle.com/otn_software/java/sqldeveloper/sqlcl-latest.zip -o sqlcl.zip
          unzip -q sqlcl.zip -d /opt
          echo "/opt/sqlcl/bin" >> $GITHUB_PATH

      - name: Set up Oracle wallet
        run: |
          mkdir -p /tmp/wallet
          echo "${{ secrets.WALLET_ZIP_B64 }}" | base64 -d | unzip -q -d /tmp/wallet -

      - name: Tag pre-deployment state
        run: |
          cd db
          VERSION="${{ github.sha }}"
          sql -S "${{ secrets.DB_USER }}/${{ secrets.DB_PASS }}@${{ secrets.DB_SERVICE }}" <<EOF
          WHENEVER SQLERROR EXIT SQL.SQLCODE
          lb tag -tag pre-${VERSION}
          EXIT 0
          EOF

      - name: Apply Liquibase changes
        run: |
          cd db
          sql -S "${{ secrets.DB_USER }}/${{ secrets.DB_PASS }}@${{ secrets.DB_SERVICE }}" <<'EOF'
          WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
          SET ECHO ON
          lb update -changelog-file controller.xml
          EXIT 0
          EOF

      - name: Run post-deployment validation
        run: |
          cd db
          sql -S "${{ secrets.DB_USER }}/${{ secrets.DB_PASS }}@${{ secrets.DB_SERVICE }}" @validate_schema.sql

      - name: Upload deployment log on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: deployment-log
          path: /tmp/sqlcl-deploy.log
```

### Reusable Action for SQLcl Operations

```yaml
# .github/workflows/sqlcl-action.yml (reusable workflow)
on:
  workflow_call:
    inputs:
      script:
        required: true
        type: string
      environment:
        required: true
        type: string
    secrets:
      DB_USER:
        required: true
      DB_PASS:
        required: true
      DB_SERVICE:
        required: true
      WALLET_ZIP_B64:
        required: true

jobs:
  run-sqlcl:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - uses: actions/checkout@v4
      - name: Install SQLcl
        run: |
          curl -sL https://download.oracle.com/otn_software/java/sqldeveloper/sqlcl-latest.zip -o sqlcl.zip
          unzip -q sqlcl.zip -d /opt
          echo "/opt/sqlcl/bin" >> $GITHUB_PATH
      - name: Configure wallet
        run: |
          mkdir -p /tmp/wallet
          echo "${{ secrets.WALLET_ZIP_B64 }}" | base64 -d | unzip -q -d /tmp/wallet -
          echo "TNS_ADMIN=/tmp/wallet" >> $GITHUB_ENV
      - name: Execute SQLcl script
        run: |
          sql -S "${{ secrets.DB_USER }}/${{ secrets.DB_PASS }}@${{ secrets.DB_SERVICE }}" @${{ inputs.script }}
```

---

## GitLab CI Integration

```yaml
# .gitlab-ci.yml

variables:
  TNS_ADMIN: "/tmp/wallet"

stages:
  - validate
  - deploy
  - verify

.sqlcl_setup: &sqlcl_setup
  before_script:
    - apt-get update -qq && apt-get install -y -qq unzip curl
    - curl -sL https://download.oracle.com/otn_software/java/sqldeveloper/sqlcl-latest.zip -o sqlcl.zip
    - unzip -q sqlcl.zip -d /opt
    - export PATH="/opt/sqlcl/bin:$PATH"
    - mkdir -p /tmp/wallet
    - echo "$WALLET_ZIP_B64" | base64 -d | unzip -q -d /tmp/wallet -

validate_changes:
  stage: validate
  <<: *sqlcl_setup
  script:
    - cd db
    - |
      sql -S "${DB_USER}/${DB_PASS}@${DB_SERVICE}" <<'SQLEOF'
      WHENEVER SQLERROR EXIT SQL.SQLCODE
      lb status -changelog-file controller.xml
      EXIT 0
      SQLEOF
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_COMMIT_BRANCH == "main"'

deploy_db:
  stage: deploy
  <<: *sqlcl_setup
  script:
    - cd db
    - |
      sql -S "${DB_USER}/${DB_PASS}@${DB_SERVICE}" <<'SQLEOF'
      WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
      SET ECHO ON
      lb tag -tag pre-${CI_COMMIT_SHORT_SHA}
      lb update -changelog-file controller.xml
      EXIT 0
      SQLEOF
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
  environment:
    name: production
    action: start

verify_deployment:
  stage: verify
  <<: *sqlcl_setup
  script:
    - cd db
    - sql -S "${DB_USER}/${DB_PASS}@${DB_SERVICE}" @validate_schema.sql
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
```

---

## Logging and Error Capture

### Capturing All SQLcl Output

```shell
# Redirect both stdout and stderr to a log file
sql -S user/pass@service @deploy.sql 2>&1 | tee /tmp/deploy.log

# Check exit code (tee preserves the pipeline, PIPESTATUS captures it)
EXIT_CODE=${PIPESTATUS[0]}
if [ $EXIT_CODE -ne 0 ]; then
    echo "Deployment failed. Log:"
    cat /tmp/deploy.log
    exit $EXIT_CODE
fi
```

### SPOOL for Detailed SQL-side Logging

Add SPOOL to your SQL script to capture database-side output including row counts and timing:

```sql
-- deploy.sql
SPOOL /tmp/deploy_output.log
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
SET ECHO ON
SET FEEDBACK ON
SET TIMING ON
SET SERVEROUTPUT ON SIZE UNLIMITED

-- Your deployment statements
lb update -changelog-file controller.xml

SPOOL OFF
EXIT 0
```

### Structured Log Output for CI Parsing

```sql
-- deploy_structured.sql
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
SET ECHO OFF
SET FEEDBACK OFF

PROMPT [INFO] Starting deployment at &_DATE
PROMPT [INFO] Connected as: &_USER to &_CONNECT_IDENTIFIER

lb update -changelog-file controller.xml

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM databasechangelog
    WHERE dateexecuted > SYSDATE - 1/24;
    DBMS_OUTPUT.PUT_LINE('[INFO] Changesets applied in last hour: ' || v_count);
END;
/

PROMPT [INFO] Deployment completed successfully
EXIT 0
```

### Rollback on Failure Pattern

```sql
-- deploy_with_rollback.sql
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK

-- Tag pre-deployment state for rollback target
lb tag -tag pre-deploy-&1

-- Apply changes
lb update -changelog-file controller.xml

-- Verify deployment
DECLARE
    v_invalid NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_invalid FROM user_objects WHERE status = 'INVALID';
    IF v_invalid > 0 THEN
        -- Trigger SQLERROR path → ROLLBACK and EXIT with error
        RAISE_APPLICATION_ERROR(-20001,
            'Deployment produced ' || v_invalid || ' invalid objects. Rolling back.');
    END IF;
END;
/

EXIT 0
```

If validation fails, the `WHENEVER SQLERROR EXIT ... ROLLBACK` triggers DML rollback. To roll back Liquibase schema changes, add a shell-level rollback step:

```shell
sql -S user/pass@service @deploy_with_rollback.sql "$CI_COMMIT_SHORT_SHA"
if [ $? -ne 0 ]; then
    echo "Deployment failed, rolling back Liquibase changes..."
    sql -S user/pass@service <<EOF
    lb rollback -tag pre-deploy-${CI_COMMIT_SHORT_SHA} -changelog-file controller.xml
    EXIT
EOF
    exit 1
fi
```

---

## Security Best Practices in CI/CD

### Never Hardcode Credentials

Always use CI/CD secret variables for credentials:

```shell
# Good: credentials from environment variables
sql -S "${DB_USER}/${DB_PASS}@${DB_SERVICE}" @deploy.sql

# Bad: hardcoded credentials
sql -S admin/MyPassword123@myatp_high @deploy.sql
```

### Wallet as Base64 Secret

Store the entire wallet ZIP as a base64-encoded CI/CD secret:

```shell
# Convert wallet to base64 for storage as a secret
base64 -i Wallet_MyATP.zip > wallet_b64.txt
# Copy the contents of wallet_b64.txt into your CI/CD secret variable
```

In the pipeline, decode and use it:

```shell
mkdir -p /tmp/wallet
echo "$WALLET_ZIP_B64" | base64 -d > /tmp/wallet.zip
unzip -q /tmp/wallet.zip -d /tmp/wallet
chmod 600 /tmp/wallet/*
export TNS_ADMIN=/tmp/wallet
```

### Least-Privilege Deployment Account

Use a dedicated deployment schema or user with only the privileges required for deployment:

```sql
-- Create a deployment user with only necessary privileges
CREATE USER deploy_user IDENTIFIED BY "SecurePass123!";
GRANT CREATE SESSION TO deploy_user;
GRANT CREATE TABLE, CREATE VIEW, CREATE PROCEDURE, CREATE SEQUENCE TO deploy_user;
GRANT UNLIMITED TABLESPACE TO deploy_user;
-- Do NOT grant DBA unless strictly necessary
```

### Audit Deployment Activity

```sql
-- Log each pipeline run to an audit table
INSERT INTO deployment_audit (
    pipeline_id, commit_sha, deployed_by, deploy_time, status
) VALUES (
    '${CI_PIPELINE_ID}', '${CI_COMMIT_SHA}', '${GITLAB_USER_LOGIN}', SYSDATE, 'STARTED'
);
COMMIT;
```

---

## Best Practices

- Always use `WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK` at the top of every CI/CD SQL script. Without it, SQLcl will continue executing after a SQL error and exit with code 0 even if statements failed.
- Use the `-S` (silent) flag for all CI/CD invocations. Without it, the SQLcl banner and connection messages will appear in your pipeline log and may confuse log parsers.
- Keep the wallet directory out of your repository. Store it as a base64-encoded CI/CD secret and decode it at pipeline runtime. Never commit wallet files (`.sso`, `.jks`, `.p12`, `ewallet.p12`) to version control.
- Use `lb tag` before every deployment to create a rollback target. Always include the commit SHA or pipeline ID in the tag name so you can identify exactly what state the database was in.
- Separate validation from deployment in your pipeline stages. The validate stage (checking `lb status`, running lint checks) should run on pull requests; the deploy stage should run only on merges to main/master.
- Capture SPOOL output and upload it as a CI artifact on failure. Raw SQLcl output alone may not be sufficient to diagnose what went wrong.

---

## Common Mistakes and How to Avoid Them

**Mistake: SQL errors are silently ignored and the pipeline succeeds**
Without `WHENEVER SQLERROR EXIT SQL.SQLCODE`, SQLcl ignores SQL errors by default and exits with code 0. Always add the `WHENEVER` directive as the very first statement in CI scripts.

**Mistake: TNS_ADMIN not set before connecting**
If `TNS_ADMIN` is not set, SQLcl cannot find the wallet and the connection fails. Set `TNS_ADMIN` as an environment variable in the pipeline step or export it in the CI step's `before_script`. Verify with `echo $TNS_ADMIN` before running SQLcl.

**Mistake: Wallet files have incorrect permissions**
On Linux, Oracle requires wallet files to be readable only by the owning user (chmod 600). CI runners may unzip files with permissions that are too open, causing SSL handshake failures. Always run `chmod 600 /tmp/wallet/*` after unzipping.

**Mistake: Heredoc with variable expansion in quotes kills substitution**
Using `<<'EOF'` (with quotes around EOF) prevents shell variable expansion inside the heredoc. Use `<<EOF` (without quotes) when you need shell variables expanded, and `<<'EOF'` when you want to pass `&variable` substitutions through to SQLcl literally.

**Mistake: Pipeline uses DBA account for all operations**
Using a DBA or ADMIN account for routine deployments is a security risk and makes it hard to audit what changes came from the pipeline versus manual intervention. Use a dedicated deployment account with only the minimum required privileges.

**Mistake: Liquibase changes not rolled back on pipeline failure**
`WHENEVER SQLERROR EXIT ... ROLLBACK` only rolls back uncommitted DML transactions. Liquibase DDL changes (CREATE TABLE, ALTER TABLE) are auto-committed by Oracle and cannot be rolled back transactionally. Always use `lb rollback -tag` for schema rollbacks after a failed deployment.

---

## Sources

- [Starting and Leaving SQLcl — startup flags reference](https://docs.oracle.com/en/database/oracle/sql-developer-command-line/25.2/sqcug/startup-sqlcl-settings.html)
- [Oracle SQLcl 25.2 User's Guide](https://docs.oracle.com/en/database/oracle/sql-developer-command-line/25.2/sqcug/oracle-sqlcl-users-guide.pdf)
- [SQLcl Release Notes 25.2](https://www.oracle.com/tools/sqlcl/sqlcl-relnotes-25.2.html)
- [Oracle SQLcl Releases index](https://docs.oracle.com/en/database/oracle/sql-developer-command-line/index.html)

# Django + Oracle Database

## Overview

Django supports Oracle Database natively via its `django.db.backends.oracle` backend using `python-oracledb`. Legacy `cx_Oracle` support is deprecated in modern Django releases. Most Django ORM features work with Oracle, but there are several Oracle-specific quirks to be aware of.

```bash
pip install django oracledb
```

---

## Configuration

### `settings.py`

```python
DATABASES = {
    "default": {
        "ENGINE":   "django.db.backends.oracle",
        "NAME":     "localhost:1521/freepdb1",   # Easy Connect string
        "USER":     "hr",
        "PASSWORD": "password",
        "OPTIONS": {
            "threaded": True,
        },
    }
}

# TNS alias
DATABASES = {
    "default": {
        "ENGINE":   "django.db.backends.oracle",
        "NAME":     "mydb_high",     # TNS alias from tnsnames.ora
        "USER":     "hr",
        "PASSWORD": "password",
    }
}
```

### Wallet / Autonomous Database

```python
import oracledb
oracledb.init_oracle_client()   # initialize thick mode when required in your environment

DATABASES = {
    "default": {
        "ENGINE":   "django.db.backends.oracle",
        "NAME":     "myatp_high",
        "USER":     "admin",
        "PASSWORD": "password",
        "OPTIONS": {
            "config_dir":      "/path/to/wallet",
            "wallet_location": "/path/to/wallet",
            "wallet_password": "walletpwd",
        },
    }
}
```

---

## Models

```python
from django.db import models

class Department(models.Model):
    department_id   = models.AutoField(primary_key=True)
    department_name = models.CharField(max_length=30)

    class Meta:
        db_table = "departments"   # map to existing Oracle table name

class Employee(models.Model):
    employee_id   = models.AutoField(primary_key=True)
    last_name     = models.CharField(max_length=25)
    email         = models.CharField(max_length=25, unique=True)
    salary        = models.DecimalField(max_digits=8, decimal_places=2, null=True)
    hire_date     = models.DateField(null=True)
    department     = models.ForeignKey(
        Department, on_delete=models.SET_NULL, null=True, db_column="department_id"
    )

    class Meta:
        db_table  = "employees"
        ordering  = ["last_name"]
```

### Oracle-Specific Field Notes

| Django Field | Oracle Column | Notes |
|---|---|---|
| `CharField(max_length=n)` | `VARCHAR2(n CHAR)` | Django uses CHAR semantics by default |
| `TextField()` | `NCLOB` | Large text; use `CLOB` via `db_column` if needed |
| `AutoField` | Oracle identity-backed numeric PK | Django manages the generated key automatically on supported Oracle versions |
| `BooleanField` | `NUMBER(1)` | Oracle has native BOOLEAN in 26ai, still uses NUMBER(1) for wider compatibility |
| `DateTimeField` | `TIMESTAMP` | |
| `BinaryField` | `BLOB` | |

---

## Migrations

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show SQL Django will run
python manage.py sqlmigrate myapp 0001
```

### Oracle Migration Quirks

- On currently supported Oracle versions, Django uses Oracle identity columns for `AutoField` / `BigAutoField`.
- **Table names** are upper-cased by Oracle; Django quotes them to preserve case when needed.
- **`db_table`** should match the exact Oracle table name (Oracle uppercases unquoted identifiers).

```python
class Meta:
    db_table = '"MY_MIXED_CASE_TABLE"'  # quoted to preserve case
```

---

## Querying

```python
from myapp.models import Employee, Department

# Basic filter
employees = Employee.objects.filter(salary__gt=5000).order_by("last_name")

# Join (select_related)
employees = Employee.objects.select_related("department").filter(department__department_name="IT")

# Prefetch related (reverse FK)
departments = Department.objects.prefetch_related("employee_set").all()

# Aggregation
from django.db.models import Avg, Count
stats = Employee.objects.aggregate(avg_salary=Avg("salary"), total=Count("employee_id"))

# Group by
from django.db.models import Count
dept_counts = (
    Employee.objects
    .values("department__department_name")
    .annotate(count=Count("employee_id"))
    .order_by("-count")
)
```

### Raw SQL

```python
# Raw queryset (maps to model)
employees = Employee.objects.raw(
    "SELECT * FROM employees WHERE department_id = %s AND salary > %s",
    [60, 5000]
)

# Completely raw (no model mapping)
from django.db import connection

with connection.cursor() as cursor:
    cursor.execute(
        "SELECT last_name, salary FROM employees WHERE department_id = %s",
        [60]
    )
    rows = cursor.fetchall()
    for row in rows:
        print(row)
```

### Calling PL/SQL

```python
from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("BEGIN hr.update_salary(%s, %s); END;", [100, 9500])

# With OUT parameter via raw oracledb
with connection.cursor() as cursor:
    raw = cursor.db.connection   # underlying oracledb connection
    with raw.cursor() as raw_cur:
        import oracledb
        out = raw_cur.var(oracledb.DB_TYPE_NUMBER)
        raw_cur.execute("BEGIN :out := hr.get_count(:dept); END;",
                        out=out, dept=60)
        print(out.getvalue())
```

---

## Transactions

Django wraps each request in a transaction by default when `ATOMIC_REQUESTS = True`.

```python
# settings.py
DATABASES = {
    "default": {
        ...
        "ATOMIC_REQUESTS": True,
    }
}

# Explicit transaction control
from django.db import transaction

with transaction.atomic():
    Employee.objects.filter(pk=100).update(salary=9500)
    # rolls back both if exception raised

# Savepoints
with transaction.atomic():
    emp = Employee.objects.create(last_name="Test", email="t@t.com")
    with transaction.atomic():
        try:
            # nested savepoint
            Employee.objects.create(last_name="Test", email="t@t.com")  # duplicate
        except Exception:
            pass  # inner savepoint rolled back; outer still active
```

---

## Oracle-Specific Quirks

### Empty String vs NULL

Oracle stores `''` (empty string) as `NULL` in `VARCHAR2` columns. This means:

```python
# This will NOT match rows with empty strings — Oracle sees them as NULL
Employee.objects.filter(middle_name="")

# Use isnull instead
Employee.objects.filter(middle_name__isnull=True)
```

Django's Oracle backend automatically converts `''` to `None` for `CharField` and `TextField`.

### Case Sensitivity

Oracle identifiers are stored uppercase. Django quotes table/column names from `db_table` and `db_column`. When writing raw SQL, use uppercase:

```python
cursor.execute("SELECT LAST_NAME FROM EMPLOYEES WHERE EMPLOYEE_ID = %s", [100])
```

### ROWNUM vs LIMIT/OFFSET

Django translates `.limit(n)` and `.offset(n)` correctly to Oracle `ROWNUM` or `FETCH FIRST`:

```python
# Django generates correct Oracle SQL
Employee.objects.all()[:10]          # FETCH FIRST 10 ROWS ONLY
Employee.objects.all()[10:20]        # OFFSET 10 ROWS FETCH NEXT 10 ROWS ONLY
```

---

## Best Practices

- **Use `select_related` and `prefetch_related`** to avoid N+1 queries.
- **Use `only()` and `defer()`** to avoid fetching large `CLOB`/`BLOB` columns unnecessarily.
- **Set `CONN_MAX_AGE`** in `DATABASES` to enable persistent connections (reduces connect overhead).
- **Use `db_table`** to map models to existing Oracle tables precisely.
- **Test migrations against a staging Oracle instance** — migration SQL can differ from PostgreSQL/SQLite dev databases.

```python
DATABASES = {
    "default": {
        ...
        "CONN_MAX_AGE": 60,   # keep connections open for 60 seconds
    }
}
```

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| `filter(field="")` expecting empty string match | Oracle treats `''` as NULL | Use `filter(field__isnull=True)` |
| Raw SQL with lowercase column names | Works but fragile | Use uppercase in raw SQL |
| Not setting `db_table` on models for existing tables | Django generates `appname_modelname` table name | Always set `db_table` for existing tables |
| Large `TextField` in `SELECT *` | Fetches CLOB for every row | Use `defer("body")` to skip large fields |
| Running SQLite migrations in dev, Oracle in prod | Migration SQL differences cause failures | Test migrations against Oracle, even in dev |

---
 
## Security Considerations
 
### Credential Management
 
- **Never hardcode credentials** in Django settings:
  ```python
  # AVOID: Hardcoded credentials in settings.py
  DATABASES = {
      "default": {
          "ENGINE":   "django.db.backends.oracle",
          "NAME":     "localhost:1521/freepdb1",
          "USER":     "hr",
          "PASSWORD": "hr_password",  # EXPOSED IN VERSION CONTROL
      }
  }
  ```
  
- **Use environment variables** for credentials:
  ```python
  import os
  
  DATABASES = {
      "default": {
          "ENGINE":   "django.db.backends.oracle",
          "NAME":     os.environ.get("DB_NAME", "localhost:1521/freepdb1"),
          "USER":     os.environ.get("DB_USER", "hr"),
          "PASSWORD": os.environ.get("DB_PASSWORD", ""),
      }
  }
  ```
  
- **Integrate with Django secret management** or external secret stores:
  - Django SECRET_KEY or custom settings modules
  - HashiCorp Vault, AWS Secrets Manager, Azure Key Vault
  - Use django-environ or similar packages for secure configuration
  
- **Consider Oracle Wallet** for secure credential storage:
  ```python
  import oracledb
  oracledb.init_oracle_client()
  
  DATABASES = {
      "default": {
          "ENGINE":   "django.db.backends.oracle",
          "NAME":     "myatp_high",
          "USER":     "admin",
          "PASSWORD": "password",  # Consider using wallet instead
          "OPTIONS": {
              "config_dir":      "/path/to/wallet",
              "wallet_location": "/path/to/wallet",
              # "wallet_password": "walletpwd",  # Only if wallet is password-protected
          },
      }
  }
  ```
  
### Connection Security
 
- **Always use TCPS (TLS)** for production connections:
  ```python
  DATABASES = {
      "default": {
          "ENGINE":   "django.db.backends.oracle",
          "NAME":     "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCPS)(HOST=db-host)(PORT=2484))(CONNECT_DATA=(SERVICE_NAME=service_name)))",
          "USER":     "${DB_USER}",
          "PASSWORD": "${DB_PASSWORD}",
      }
  }
  ```
  
- **Validate SSL certificates** to prevent man-in-the-middle attacks:
  - Ensure proper certificate chain validation in Oracle client configuration
  - Consider using certificate pinning for high-security environments
  
- **Consider using Oracle Cloud IAM authentication** for cloud deployments:
  ```python
  # Requires additional setup and dependencies
  DATABASES = {
      "default": {
          "ENGINE":   "django.db.backends.oracle",
          "NAME":     "your_tcp_alias",
          # IAM authentication configuration would go in OPTIONS
          "OPTIONS": {
              "authentication_services": "(IAM)",
              # Additional IAM parameters...
          },
      }
  }
  ```
  
### SQL Injection Prevention
 
- **Django ORM provides protection** but developers must remain vigilant:
  
- **Safe: QuerySet methods** (Django ORM uses parameterized queries internally):
  ```python
  # SAFE: Automatically uses parameterized queries
  Employee.objects.filter(salary__gt=5000, department__name="IT")
  ```
  
- **SAFE: Raw SQL with parameter binding** (using %s placeholders):
  ```python
  # SAFE: Uses proper parameter binding
  with connection.cursor() as cursor:
      cursor.execute(
          "SELECT last_name, salary FROM employees WHERE department_id = %s AND salary > %s",
          [dept_id, min_salary]
      )
  ```
  
- **UNSAFE: String concatenation in raw SQL** (avoid!):
  ```python
  # UNSAFE: String concatenation leads to SQL injection
  # NEVER DO THIS:
  query = "SELECT * FROM employees WHERE department_id = " + dept_id + " AND salary > " + min_salary
  cursor.execute(query)
  ```
  
- **Be cautious with extra() method** (can introduce SQL injection if misused):
  ```python
  # UNSAFE if params contain user input:
  # Employee.objects.extra(where=["salary > " + user_input])
  
  # SAFE: Use params argument for user input
  Employee.objects.extra(
      where=["salary > %s"],
      params=[user_salary_input]  # Properly parameterized
  )
  ```
  
### Principle of Least Privilege
 
- **Configure database user with minimal required privileges:**
  ```sql
  -- Instead of granting excessive privileges:
  -- GRANT CREATE SESSION plus specific object privileges only; avoid broad legacy roles
  
  -- Grant only what Django applications need:
  CREATE USER app_user IDENTIFIED BY "strong_password";
  GRANT CREATE SESSION TO app_user;
  GRANT SELECT, INSERT, UPDATE, DELETE ON app_schema.* TO app_user;
  GRANT EXECUTE ON app_schema.necessary_packages TO app_user;
  -- Only grant DDL if using managed migrations (NOT RECOMMENDED FOR PRODUCTION)
  -- GRANT CREATE TABLE, ALTER TABLE, DROP TABLE TO app_user;  -- ONLY FOR DEV/TEST
  ```
  
- **Use roles for privilege management:**
  ```sql
  CREATE ROLE app_user_role;
  GRANT CREATE SESSION TO app_user_role;
  GRANT SELECT, INSERT, UPDATE, DELETE ON app_schema.* TO app_user_role;
  GRANT app_user_role TO app_user;
  ```
  
### Data Protection
 
- **Consider encrypting sensitive fields** at the application level before persistence:
  ```python
  from django.db import models
  import hashlib
  from Crypto.Cipher import AES  # pycryptodome or similar
  
  class Customer(models.Model):
      id = models.AutoField(primary_key=True)
      
      # Encrypt sensitive fields before storing
      ssn = models.CharField(max_length=11, blank=True)  # Will store encrypted value
      
      def set_ssn(self, plain_ssn):
          """Encrypt SSN before storing"""
          if plain_ssn:
              # In practice, use proper encryption like AES-GCM with secure key management
              self.ssn = encrypt_ssn(plain_ssn)  # Implement secure encryption
          else:
              self.ssn = None
          
      def get_ssn(self):
          """Decrypt SSN when retrieving"""
          if self.ssn:
              return decrypt_ssn(self.ssn)  # Implement secure decryption
          return None
  ```
  
- **Use Oracle Transparent Data Encryption (TDE)** for data at rest:
  - Configure at the tablespace or column level in Oracle
  - Django works transparently with TDE-encrypted tables
  
- **Consider Oracle Data Redaction** for masking sensitive data in query results:
  ```sql
  -- Example: Redact SSN for non-HR users (configured in Oracle)
  BEGIN
    DBMS_REDACT.ADD_POLICY(
      object_schema => 'HR',
      object_name => 'EMPLOYEES',
      column_name => 'SSN',
      policy_name => 'REDACT_SSN_POLICY',
      function_type => DBMS_REDACT.PARTIAL,
      expression => 'SYS_CONTEXT(''USERENV'',''SESSION_USER'') NOT IN (''HR_MANAGER'')'
    );
  END;
  ```
  
### Auditing and Monitoring
 
- **Enable database logging** for monitoring (in development/test only):
  ```python
  LOGGING = {
      'version': 1,
      'disable_existing_loggers': False,
      'handlers': {
          'console': {
              'class': 'logging.StreamHandler',
          },
      },
      'root': {
          'handlers': ['console'],
      },
      'loggers': {
          'django.db.backends': {
              'level': 'DEBUG',
              'handlers': ['console'],
          },
      },
  }
  ```
  
- **Set client information** for traceability in database logs:
  ```python
  from django.db import connection
  
  def set_client_info(module_name, action_name, client_id=None):
      """Set Oracle client info for auditing/tracing"""
      with connection.cursor() as cursor:
          # Use DBMS_APPLICATION_INFO to set module/action
          cursor.execute(
              "BEGIN DBMS_APPLICATION_INFO.SET_MODULE(%s, %s); END;",
              [module_name, action_name or '']
          )
          if client_id:
              cursor.execute(
                  "BEGIN DBMS_SESSION.SET_IDENTIFIER(%s); END;",
                  [client_id]
              )
  ```
  
- **Example usage in views or middleware:**
  ```python
  # In middleware or view
  set_client_info("MyApp", "employee_list", request.user.username if request.user.is_authenticated else None)
  ```
  
### Secure Handling of Large Objects (LOBs)
 
- **Be cautious with LOB data** as it can contain sensitive information:
  
- **Validate and sanitize LOB content** before persistence:
  ```python
  from django.core.exceptions import ValidationError
  
  class Document(models.Model):
      id = models.AutoField(primary_key=True)
      # Using TextField for CLOB, BinaryField for BLOB
      content = models.TextField()  # Maps to CLOB
      attachment = models.BinaryField()  # Maps to BLOB
      
      def clean(self):
          """Validate LOB content before saving"""
          if self.content and len(self.content) > 1000000:  # 1MB limit
              raise ValidationError("Content too large")
          
          if self.attachment and len(self.attachment) > 10000000:  # 10MB limit
              raise ValidationError("Attachment too large")
  ```
  
- **Consider encrypting sensitive LOB data** before storage:
  ```python
  from django.db import models
  
  class SecureDocument(models.Model):
      id = models.AutoField(primary_key=True)
      # Store encrypted content
      encrypted_content = models.BinaryField()  # Encrypted BLOB
      
      def set_content(self, plain_content):
          """Encrypt content before storing"""
          if plain_content:
              self.encrypted_content = encrypt_content(plain_content.encode('utf-8'))
          else:
              self.encrypted_content = None
          
      def get_content(self):
          """Decrypt content when retrieving"""
          if self.encrypted_content:
              return decrypt_content(self.encrypted_content).decode('utf-8')
          return None
  ```
  
### Transaction Security
 
- **Keep transactions short** to minimize lock contention and exposure:
  
- **Use appropriate isolation levels** for your use case:
  ```python
  from django.db import transaction
  
  with transaction.atomic():  # Default isolation level is READ COMMITTED for Oracle
      # Short transaction here
      Employee.objects.filter(pk=100).update(salary=9500)
  ```
  
- **Avoid long-running transactions** that hold locks or snapshots:
  ```python
  # UNSAFE: Long-running transaction holding locks
  # with transaction.atomic():
  #     # Process many records (could take minutes/hours)
  #     for emp in Employee.objects.all():
  #         # Process each employee
  #         ...
  ```
  
- **SAFE: Process in batches using iterators or pagination:**
  ```python
  batch_size = 100
  offset = 0
  
  while True:
      batch = Employee.objects.all()[offset:offset + batch_size]
      if not batch:
          break
          
      # Process batch (each item in its own transaction or batch transaction)
      for emp in batch:
          # Process employee
          emp.salary += 100
          emp.save()
          
      offset += batch_size
  ```
  
### Dependency Security
 
- **Keep Django, python-oracledb, and dependencies updated:**
  - Regularly check for CVEs in Django, python-oracledb, and related packages
  - Use dependency checking tools (OWASP Dependency-Check, Snyk, pip-audit) in CI/CD
  
- **Monitor for python-oracledb-specific vulnerabilities:**
  - Stay updated with Oracle's security patches for their Python drivers
  - Consider using the thick mode or thin mode based on security requirements
  
### Compliance Considerations
 
- **PCI-DSS**: 
  - Ensure cardholder data is encrypted (application-level or TDE)
  - Restrict access to cardholder data environments
  - Implement strong access control measures
  - Regularly test security controls and processes
  
- **HIPAA**:
  - Implement access controls and audit trails for PHI
  - Consider encryption for ePHI at rest and in transit
  - Ensure minimum necessary access to protected health information
  - Implement audit controls and integrity controls
  
- **GDPR**:
  - Implement data protection by design and by default
  - Consider data minimization principles in model design
  - Implement mechanisms for right to erasure and data portability
  - Consider pseudonymization techniques where appropriate
  
- **Audit database access for compliance:**
  ```sql
  -- Track who accesses sensitive data (for compliance reporting)
  CREATE AUDIT POLICY django_access_audit
    ACTIONS SELECT, INSERT, UPDATE, DELETE
    ON HR.EMPLOYEES, HR.SALARY_DATA;
  AUDIT POLICY django_access_audit;
  ```
  
## Oracle Version Notes (19c vs 26ai)

- Django 4.2+ supports Oracle 19c and later.
- Oracle 26ai has native `BOOLEAN` SQL type; Django's `BooleanField` still uses `NUMBER(1)` for compatibility.

## Sources

- [Django Oracle Backend Documentation](https://docs.djangoproject.com/en/stable/ref/databases/#oracle-notes)
- [python-oracledb Django Integration](https://python-oracledb.readthedocs.io/en/latest/user_guide/django.html)
- [Django Database Access Optimization](https://docs.djangoproject.com/en/stable/topics/db/optimization/)

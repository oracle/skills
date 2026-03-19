# SQLAlchemy + Oracle Database

## Overview

SQLAlchemy is the dominant Python SQL toolkit and ORM. It supports Oracle via the `oracle+oracledb` dialect (using `python-oracledb`) or the legacy `oracle+cx_oracle` dialect. SQLAlchemy provides two APIs:

- **Core** — SQL expression language, close to raw SQL
- **ORM** — full object-relational mapping with sessions and models

```bash
pip install sqlalchemy oracledb
```

---

## Creating an Engine

```python
from sqlalchemy import create_engine

# Thin mode (default, no Oracle Client needed)
engine = create_engine(
    "oracle+oracledb://hr:password@localhost:1521/?service_name=freepdb1",
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
)

# TNS alias
engine = create_engine("oracle+oracledb://hr:password@mydb_high")

# Wallet / Autonomous Database
engine = create_engine(
    "oracle+oracledb://admin:password@myatp_high",
    connect_args={
        "config_dir":       "/path/to/wallet",
        "wallet_location":  "/path/to/wallet",
        "wallet_password":  "walletpwd",
    },
)

# Thick mode
import oracledb
oracledb.init_oracle_client(lib_dir="/opt/oracle/instantclient_21_9")
engine = create_engine("oracle+oracledb://hr:password@localhost:1521/?service_name=freepdb1",
                       thick_mode=True)
```

---

## ORM — Models

```python
from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, Sequence
from sqlalchemy.orm import DeclarativeBase, relationship

class Base(DeclarativeBase):
    pass

# Oracle sequence for primary key (preferred over IDENTITY for compatibility)
emp_seq = Sequence("employees_seq", start=300, increment=1)

class Department(Base):
    __tablename__ = "departments"

    department_id   = Column(Integer, primary_key=True)
    department_name = Column(String(30), nullable=False)
    employees       = relationship("Employee", back_populates="department")

class Employee(Base):
    __tablename__ = "employees"

    employee_id   = Column(Integer, emp_seq, primary_key=True,
                           server_default=emp_seq.next_value())
    last_name     = Column(String(25), nullable=False)
    email         = Column(String(25), nullable=False, unique=True)
    salary        = Column(Numeric(8, 2))
    department_id = Column(Integer, ForeignKey("departments.department_id"))
    department    = relationship("Department", back_populates="employees")
```

### Oracle-Specific Column Types

```python
from sqlalchemy.dialects.oracle import VARCHAR2, NUMBER, DATE, CLOB, BLOB, TIMESTAMP

class Document(Base):
    __tablename__ = "employee_docs"

    doc_id    = Column(Integer, primary_key=True)
    title     = Column(VARCHAR2(200))
    body      = Column(CLOB)
    photo     = Column(BLOB)
    created   = Column(TIMESTAMP)
    score     = Column(NUMBER(10, 4))
```

---

## ORM — Sessions and Queries

```python
from sqlalchemy.orm import Session

with Session(engine) as session:
    # Query all
    employees = session.query(Employee).filter(Employee.salary > 5000).all()

    # Modern style (SQLAlchemy 2.x)
    from sqlalchemy import select
    stmt = select(Employee).where(Employee.department_id == 60).order_by(Employee.last_name)
    employees = session.scalars(stmt).all()

    # Join
    stmt = (
        select(Employee, Department)
        .join(Department, Employee.department_id == Department.department_id)
        .where(Employee.salary > 8000)
    )
    for emp, dept in session.execute(stmt):
        print(emp.last_name, dept.department_name)
```

### Insert / Update / Delete

```python
with Session(engine) as session:
    # Insert
    new_emp = Employee(last_name="Smith", email="smith@example.com",
                       salary=7500, department_id=60)
    session.add(new_emp)
    session.commit()

    # Update
    emp = session.get(Employee, 100)
    emp.salary = 9500
    session.commit()

    # Delete
    session.delete(emp)
    session.commit()
```

### Bulk Operations

```python
from sqlalchemy import insert

with Session(engine) as session:
    # Bulk insert (ORM style — 2.x)
    session.execute(
        insert(Employee),
        [
            {"last_name": "Alice", "email": "alice@co.com", "salary": 6000, "department_id": 10},
            {"last_name": "Bob",   "email": "bob@co.com",   "salary": 7000, "department_id": 20},
        ]
    )
    session.commit()
```

---

## Core — SQL Expression Language

```python
from sqlalchemy import text, select, Table, MetaData

# Raw SQL with bind parameters
with engine.connect() as conn:
    result = conn.execute(
        text("SELECT last_name, salary FROM employees WHERE department_id = :dept"),
        {"dept": 60}
    )
    for row in result:
        print(row.last_name, row.salary)

# Reflect existing table (no model needed)
meta = MetaData()
employees = Table("employees", meta, autoload_with=engine)

stmt = select(employees.c.last_name, employees.c.salary).where(
    employees.c.department_id == 60
)
with engine.connect() as conn:
    for row in conn.execute(stmt):
        print(row)
```

---

## PL/SQL Calls

```python
from sqlalchemy import text

with engine.connect() as conn:
    # Anonymous block
    conn.execute(text("BEGIN hr.update_salary(:id, :sal); END;"),
                 {"id": 100, "sal": 9500})
    conn.commit()

    # OUT parameter via raw oracledb connection
    raw_conn = conn.connection.dbapi_connection
    with raw_conn.cursor() as cur:
        out = cur.var(__import__("oracledb").DB_TYPE_NUMBER)
        cur.execute("BEGIN :out := hr.get_count(:dept); END;",
                    out=out, dept=60)
        print(out.getvalue())
```

---

## Connection Pool Tuning

```python
from sqlalchemy import create_engine, event
from sqlalchemy.pool import QueuePool

engine = create_engine(
    "oracle+oracledb://hr:password@localhost:1521/?service_name=freepdb1",
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=5,
    pool_timeout=30,
    pool_recycle=1800,   # recycle connections every 30 minutes
    pool_pre_ping=True,  # test connection before use
)

# Set Oracle client info on checkout
@event.listens_for(engine, "connect")
def on_connect(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("BEGIN DBMS_APPLICATION_INFO.SET_MODULE(:m, :a); END;",
                   m="MyApp", a="startup")
    cursor.close()
```

---

## Reflecting Existing Schema

```python
from sqlalchemy import MetaData, Table

meta = MetaData(schema="HR")
meta.reflect(bind=engine)

for table_name in meta.tables:
    print(table_name)

employees = meta.tables["HR.EMPLOYEES"]
print([c.name for c in employees.columns])
```

---

## Best Practices

- **Use `oracle+oracledb`** dialect — the `cx_oracle` dialect is deprecated.
- **Use `pool_pre_ping=True`** to avoid stale connection errors after network timeouts.
- **Use `pool_recycle`** to avoid ORA-02396 (exceeded maximum idle time).
- **Prefer `session.execute(select(...))`** over `session.query()` in SQLAlchemy 2.x.
- **Use `Sequence`** for primary keys rather than relying on `IDENTITY` for 19c compatibility.
- **Never use `${}`-style string substitution** — always use bound parameters via `text()` with `{}` dict or ORM.
- **Use `session.get(Model, pk)`** for PK lookups — avoids a query if already in identity map.

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| `oracle+cx_oracle` dialect in new code | cx_Oracle is deprecated | Use `oracle+oracledb` |
| `String(n)` without `VARCHAR2` dialect type | Maps to CHAR on Oracle | Use `VARCHAR2(n)` from `sqlalchemy.dialects.oracle` |
| Not setting `pool_pre_ping=True` | Stale connection errors after idle | Add `pool_pre_ping=True` to engine |
| Using `AUTOINCREMENT` / `Integer` PK without Sequence | No auto-increment in Oracle 18c and below | Use `Sequence` explicitly |
| `session.query()` in SQLAlchemy 2.x | Legacy API, will be removed | Use `select()` + `session.scalars()` |

---
 
## Security Considerations
 
### Credential Management
 
- **Never hardcode credentials** in application code:
  ```python
  # AVOID: Hardcoded credentials
  engine = create_engine(
      "oracle+oracledb://hr:hr_password@localhost:1521/?service_name=freepdb1",
      # ... other params
  )
  ```
  
- **Use environment variables** for credentials:
  ```python
  import os
  from sqlalchemy import create_engine
  
  engine = create_engine(
      f"oracle+oracledb://{os.environ.get('DB_USER', 'hr')}:{os.environ.get('DB_PASSWORD', '')}"
      f"@localhost:1521/?service_name=freepdb1",
      # ... other params
  )
  ```
  
- **Integrate with secret management systems:**
  - HashiCorp Vault, AWS Secrets Manager, Azure Key Vault
  - Use AWS Secrets Manager with boto3 or similar
  - Consider using Django-environ, python-decouple, or similar for configuration
  
- **Consider Oracle Wallet** for secure credential storage:
  ```python
  engine = create_engine(
      "oracle+oracledb://admin:password@myatp_high",
      connect_args={
          "config_dir":       "/path/to/wallet",
          "wallet_location":  "/path/to/wallet",
          # "wallet_password":  "walletpwd",  # Only if wallet is password-protected
      },
  )
  ```
  
### Connection Security
 
- **Always use TCPS (TLS)** for production connections:
  ```python
  engine = create_engine(
      "oracle+oracledb://hr:password@(DESCRIPTION=(ADDRESS=(PROTOCOL=TCPS)(HOST=db-host)(PORT=2484))(CONNECT_DATA=(SERVICE_NAME=service_name)))",
      # ... other params
  )
  ```
  
- **Validate SSL certificates** to prevent man-in-the-middle attacks:
  - Ensure proper certificate validation in Oracle client configuration
  - Consider setting SSL cipher suites for enhanced security
  
- **Consider using Oracle Cloud IAM authentication** for cloud deployments:
  ```python
  # Requires Oracle 21c+ and proper IAM setup
  engine = create_engine(
      "oracle+oracledb://@your_tcp_alias",
      connect_args={
          "authentication_services": "(IAM)",
          # Additional IAM parameters as needed
      },
  )
  ```
  
### SQL Injection Prevention
 
- **SQLAlchemy provides protection** but developers must remain vigilant:
  
- **Safe: Parameter binding with text()** (Core API):
  ```python
  # SAFE: Uses proper parameter binding
  with engine.connect() as conn:
      result = conn.execute(
          text("SELECT last_name, salary FROM employees WHERE department_id = :dept"),
          {"dept": 60}
      )
  ```
  
- **SAFE: ORM query methods** (uses parameterized queries internally):
  ```python
  # SAFE: Automatically uses parameterized queries
  with Session(engine) as session:
      employees = session.query(Employee).filter(
          Employee.salary > 5000,
          Employee.department.has(department_name="IT")
      ).all()
  ```
  
- **SAFE: Modern SQLAlchemy 2.x style:**
  ```python
  # SAFE: Uses parameter binding
  from sqlalchemy import select
  
  with Session(engine) as session:
      stmt = select(Employee).where(
          Employee.salary > 5000,
          Employee.department_id == 60
      )
      employees = session.scalars(stmt).all()
  ```
  
- **UNSAFE: String substitution in text()** (avoid!):
  ```python
  # UNSAFE: String substitution leads to SQL injection
  # NEVER DO THIS:
  with engine.connect() as conn:
      result = conn.execute(
          text(f"SELECT last_name, salary FROM employees WHERE department_id = {dept_id}")
      )
  ```
  
- **Be cautious with literal_column()** (can introduce SQL injection if misused):
  ```python
  # UNSAFE if column_name comes from user input:
  # select(literal_column(user_input))
  
  # SAFE: Validate against allowed column names
  ALLOWED_COLUMNS = {"last_name", "salary", "email"}
  if user_input in ALLOWED_COLUMNS:
      stmt = select(literal_column(user_input))
  ```
  
### Principle of Least Privilege
 
- **Configure database user with minimal required privileges:**
  ```sql
  -- Instead of granting excessive privileges:
  -- GRANT CREATE SESSION plus specific object privileges only; avoid broad legacy roles
  
  -- Grant only what SQLAlchemy applications need:
  CREATE USER app_user IDENTIFIED BY "strong_password";
  GRANT CREATE SESSION TO app_user;
  GRANT SELECT, INSERT, UPDATE, DELETE ON app_schema.* TO app_user;
  GRANT EXECUTE ON app_schema.necessary_packages TO app_user;
  -- Only grant DDL if using schema generation (NOT RECOMMENDED FOR PRODUCTION)
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
  from sqlalchemy import Column, Integer, String, LargeBinary
  from sqlalchemy.orm import DeclarativeBase
  from Crypto.Cipher import AES  # pycryptodome or similar
  import os
  
  class Base(DeclarativeBase):
      pass
  
  class Customer(Base):
      __tablename__ = "customers"
      
      id = Column(Integer, primary_key=True)
      
      # Store encrypted SSN
      ssn_encrypted = Column(LargeBinary)  # Encrypted BLOB
      
      def set_ssn(self, plain_ssn):
          """Encrypt SSN before storing"""
          if plain_ssn:
              # In practice, use proper encryption like AES-GCM with secure key management
              key = os.environ.get('ENCRYPTION_KEY').encode()  # Get from secure source
              cipher = AES.new(key, AES.MODE_GCM)
              ciphertext, tag = cipher.encrypt_and_digest(plain_ssn.encode())
              self.ssn_encrypted = ciphertext + tag  # Store ciphertext + tag
          else:
              self.ssn_encrypted = None
          
      def get_ssn(self):
          """Decrypt SSN when retrieving"""
          if self.ssn_encrypted:
              key = os.environ.get('ENCRYPTION_KEY').encode()
              nonce = self.ssn_encrypted[:12]  # Assuming 12-byte nonce
              ciphertext = self.ssn_encrypted[12:-16]  # Remove nonce and tag
              tag = self.ssn_encrypted[-16:]
              cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
              plaintext = cipher.decrypt_and_verify(ciphertext, tag)
              return plaintext.decode()
          return None
  ```
  
- **Use Oracle Transparent Data Encryption (TDE)** for data at rest:
  - Configure at the tablespace or column level in Oracle
  - SQLAlchemy works transparently with TDE-encrypted tables
  
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
 
- **Enable SQLAlchemy logging** for monitoring (in development/test only):
  ```python
  import logging
  
  logging.basicConfig()
  logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)  # Log SQL queries
  logging.getLogger('sqlalchemy.pool').setLevel(logging.DEBUG)  # Log pool checkouts
  ```
  
- **Set client information** for traceability in database logs:
  ```python
  from sqlalchemy import create_engine, event
  from sqlalchemy.pool import PoolProxiedConnection
  
  def set_client_info(conn, branch):
      """Set Oracle client info when connection is checked out"""
      if hasattr(conn, 'connection'):  # DB-API connection
          dbapi_conn = conn.connection
          try:
              cursor = dbapi_conn.cursor()
              cursor.execute(
                  "BEGIN DBMS_APPLICATION_INFO.SET_MODULE(:m, :a); END;",
                  m="MyApp", a="session_start"
              )
              cursor.close()
          except Exception:
              pass  # Ignore errors in setting client info
  
  engine = create_engine(
      "oracle+oracledb://hr:password@localhost:1521/?service_name=freepdb1",
      # ... other params
  )
  
  event.listen(engine, "checkout", set_client_info)
  ```
  
- **Alternative: Use session events** for ORM sessions:
  ```python
  from sqlalchemy.orm import Session
  
  @event.listens_for(Session, "after_begin")
  def receive_after_begin(session, transaction, connection):
      """Set client info when transaction begins"""
      connection.execute(
          "BEGIN DBMS_APPLICATION_INFO.SET_MODULE(:m, :a); END;",
          m="MyApp", a="transaction_start"
      )
  ```
  
### Secure Handling of Large Objects (LOBs)
 
- **Be cautious with LOB data** as it can contain sensitive information:
  
- **Validate and sanitize LOB content** before persistence:
  ```python
  from sqlalchemy import Column, Integer, Text, LargeBinary
  from sqlalchemy.orm import DeclarativeBase
  from sqlalchemy.validators import validates
  
  class Base(DeclarativeBase):
      pass
  
  class Document(Base):
      __tablename__ = "documents"
      
      id = Column(Integer, primary_key=True)
      content = Column(Text)  # CLOB
      attachment = Column(LargeBinary)  # BLOB
      
      @validates('content')
      def validate_content(self, key, content):
          """Validate content length before saving"""
          if content and len(content) > 1000000:  # 1MB limit
              raise ValueError("Content too large (max 1MB)")
          return content
      
      @validates('attachment')
      def validate_attachment(self, key, attachment):
          """Validate attachment size before saving"""
          if attachment and len(attachment) > 10000000:  # 10MB limit
              raise ValueError("Attachment too large (max 10MB)")
          return attachment
  ```
  
- **Consider encrypting sensitive LOB data** before storage:
  ```python
  from sqlalchemy import Column, Integer, LargeBinary
  from sqlalchemy.orm import DeclarativeBase
  
  class Base(DeclarativeBase):
      pass
  
  class SecureDocument(Base):
      __tablename__ = "secure_documents"
      
      id = Column(Integer, primary_key=True)
      # Store encrypted content
      encrypted_content = Column(LargeBinary)  # Encrypted BLOB
      
      def set_content(self, plain_content):
          """Encrypt content before storing"""
          if plain_content:
              # In practice, use proper encryption with secure key management
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
  from sqlalchemy import create_engine
  from sqlalchemy.orm import Session
  
  # Default isolation level is READ COMMITTED for Oracle
  engine = create_engine(
      "oracle+oracledb://hr:password@localhost:1521/?service_name=freepdb1",
      # ... other params
  )
  
  with Session(engine) as session:
      # Short transaction here
      employee = session.get(Employee, 100)
      employee.salary = 9500
      session.commit()
  ```
  
- **Avoid long-running transactions** that hold locks or snapshots:
  ```python
  # UNSAFE: Long-running transaction holding locks
  # with Session(engine) as session:
  #     # Process many records (could take minutes/hours)
  #     for emp in session.query(Employee).yield_per(100):
  #         # Process each employee
  #         emp.salary += 100
  #         session.add(emp)
  #     session.commit()  # Commits all at once - risky
  ```
  
- **SAFE: Process in batches with frequent commits:**
  ```python
  from sqlalchemy.orm import Session
  
  batch_size = 100
  offset = 0
  
  while True:
      with Session(engine) as session:
          # Get batch of employees
          employees = session.query(Employee).offset(offset).limit(batch_size).all()
          
          if not employees:
              break
              
          # Process batch
          for emp in employees:
              emp.salary += 100
              session.add(emp)
              
          session.commit()  # Commit each batch
          
      offset += batch_size
  ```
  
### Dependency Security
 
- **Keep SQLAlchemy, python-oracledb, and dependencies updated:**
  - Regularly check for CVEs in SQLAlchemy, python-oracledb, and related packages
  - Use dependency checking tools (OWASP Dependency-Check, Snyk, pip-audit) in CI/CD
  
- **Monitor for SQLAlchemy-specific vulnerabilities:**
  - Stay updated with SQLAlchemy security advisories
  - Consider using SQLAlchemy 2.0+ for improved security features
  
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
  CREATE AUDIT POLICY sqlalchemy_access_audit
    ACTIONS SELECT, INSERT, UPDATE, DELETE
    ON HR.EMPLOYEES, HR.SALARY_DATA;
  AUDIT POLICY sqlalchemy_access_audit;
  ```
  
## Oracle Version Notes (19c vs 26ai)

- Oracle 19c: Use `Sequence` for PKs; `IDENTITY` columns work from 12c+.
- Oracle 21c+: Native JSON type supported — use `oracle.JSON` column type.
- Oracle 26ai: JSON Relational Duality Views queryable via normal SELECT.

## Sources

- [SQLAlchemy Oracle Dialect Documentation](https://docs.sqlalchemy.org/en/20/dialects/oracle.html)
- [python-oracledb SQLAlchemy Integration](https://python-oracledb.readthedocs.io/en/latest/user_guide/sqlalchemy.html)
- [SQLAlchemy 2.0 Migration Guide](https://docs.sqlalchemy.org/en/20/changelog/migration_20.html)

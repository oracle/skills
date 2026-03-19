# Python + Oracle Database

## Overview

`python-oracledb` is the official Oracle Python driver (successor to `cx_Oracle`). It supports two modes:

- **Thin mode** (default): pure Python, no Oracle Client libraries required. Supports most features.
- **Thick mode**: requires Oracle Client (Instant Client or full client). Required for advanced features like Advanced Queuing, Sharding, and some proxy authentication scenarios.

```bash
pip install oracledb
```

---

## Connecting

### Basic Connection (Thin Mode)

```python
import oracledb

# Easy Connect string
conn = oracledb.connect(
    user="hr",
    password="password",
    dsn="localhost:1521/freepdb1"
)

# TNS alias (requires tnsnames.ora in TNS_ADMIN path)
conn = oracledb.connect(
    user="hr",
    password="password",
    dsn="mydb_high"
)

# Close explicitly or use context manager
with oracledb.connect(user="hr", password="password", dsn="localhost:1521/freepdb1") as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT sysdate FROM dual")
        print(cur.fetchone())
```

### Wallet / mTLS (Autonomous Database)

```python
import oracledb

conn = oracledb.connect(
    user="admin",
    password="password",
    dsn="myatp_high",           # TNS alias from tnsnames.ora in wallet
    config_dir="/path/to/wallet",
    wallet_location="/path/to/wallet",
    wallet_password="wallet_password"  # if the wallet is password-protected
)
```

### Enabling Thick Mode

```python
import oracledb

# Call before any connection — sets the mode for the entire process
oracledb.init_oracle_client(lib_dir="/opt/oracle/instantclient_21_9")

conn = oracledb.connect(user="hr", password="password", dsn="localhost:1521/freepdb1")
```

---

## Executing SQL

### Bind Variables

Always use bind variables — never format user input into SQL strings.

```python
with conn.cursor() as cur:
    # Named binds (recommended)
    cur.execute(
        "SELECT last_name, salary FROM employees WHERE department_id = :dept_id AND salary > :min_sal",
        dept_id=60,
        min_sal=5000
    )

    # Or pass as dict
    cur.execute(
        "SELECT last_name FROM employees WHERE employee_id = :id",
        {"id": 100}
    )

    rows = cur.fetchall()
    for row in rows:
        print(row)
```

### DML with Binds

```python
with conn.cursor() as cur:
    cur.execute(
        "UPDATE employees SET salary = :sal WHERE employee_id = :id",
        sal=9000,
        id=100
    )
    conn.commit()
```

### Batch Execution (executemany)

```python
data = [
    {"id": 201, "name": "Alice", "dept": 10},
    {"id": 202, "name": "Bob",   "dept": 20},
    {"id": 203, "name": "Carol", "dept": 10},
]

with conn.cursor() as cur:
    cur.executemany(
        "INSERT INTO employees (employee_id, last_name, department_id) VALUES (:id, :name, :dept)",
        data
    )
    conn.commit()
```

---

## Fetching Results

```python
with conn.cursor() as cur:
    cur.execute("SELECT employee_id, last_name, salary FROM employees WHERE rownum <= 100")

    # fetchone — single row
    row = cur.fetchone()

    # fetchmany — batch
    rows = cur.fetchmany(numRows=25)

    # fetchall — all remaining (careful with large result sets)
    rows = cur.fetchall()

    # Iterate directly (memory-efficient for large sets)
    cur.execute("SELECT * FROM employees")
    for row in cur:
        print(row)
```

### Column Names

```python
with conn.cursor() as cur:
    cur.execute("SELECT employee_id, last_name, salary FROM employees WHERE rownum <= 5")
    columns = [col[0] for col in cur.description]
    rows = cur.fetchall()
    for row in rows:
        print(dict(zip(columns, row)))
```

### Fetch as Dictionaries (rowfactory)

```python
def make_dict_factory(cursor):
    cols = [col[0].lower() for col in cursor.description]
    def create_row(*args):
        return dict(zip(cols, args))
    return create_row

with conn.cursor() as cur:
    cur.execute("SELECT employee_id, last_name FROM employees WHERE rownum <= 5")
    cur.rowfactory = make_dict_factory(cur)
    for row in cur:
        print(row)  # {'employee_id': 100, 'last_name': 'King'}
```

---

## Connection Pooling

Use a connection pool for web applications and multi-threaded code. Never share a single connection across threads.

```python
import oracledb

# Create pool at application startup
pool = oracledb.create_pool(
    user="hr",
    password="password",
    dsn="localhost:1521/freepdb1",
    min=2,       # minimum open connections
    max=10,      # maximum connections
    increment=1  # connections opened when more are needed
)

# Acquire a connection from the pool
with pool.acquire() as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM employees")
        print(cur.fetchone())

# Pool is returned automatically; close pool at app shutdown
pool.close()
```

---

## PL/SQL Calls

```python
import oracledb

with conn.cursor() as cur:
    # Call a stored procedure
    cur.callproc("hr.update_salary", [100, 9500])
    conn.commit()

    # Call a function
    result = cur.callfunc("hr.get_employee_count", oracledb.DB_TYPE_NUMBER, [10])
    print(result)

    # Anonymous PL/SQL block with OUT parameters
    out_val = cur.var(oracledb.DB_TYPE_VARCHAR)
    cur.execute(
        """
        BEGIN
          :out := 'Hello from PL/SQL';
        END;
        """,
        out=out_val
    )
    print(out_val.getvalue())
```

### REF CURSOR

```python
with conn.cursor() as cur:
    ref_cursor = cur.var(oracledb.DB_TYPE_CURSOR)
    cur.execute(
        """
        BEGIN
          OPEN :rc FOR SELECT employee_id, last_name FROM employees WHERE department_id = :dept;
        END;
        """,
        rc=ref_cursor,
        dept=60
    )
    for row in ref_cursor.getvalue():
        print(row)
```

---

## LOB Handling

```python
import oracledb

# Read a CLOB
with conn.cursor() as cur:
    cur.execute("SELECT resume FROM employee_docs WHERE employee_id = 100")
    row = cur.fetchone()
    if row:
        clob = row[0]
        text = clob.read()      # reads entire CLOB as string
        print(text[:200])

# Write a CLOB
with conn.cursor() as cur:
    large_text = "..." * 10000
    cur.execute(
        "UPDATE employee_docs SET resume = :clob WHERE employee_id = :id",
        clob=large_text,
        id=100
    )
    conn.commit()

# Read a BLOB
with conn.cursor() as cur:
    cur.execute("SELECT photo FROM employee_photos WHERE employee_id = 100")
    row = cur.fetchone()
    if row:
        blob_data = row[0].read()
        with open("photo.jpg", "wb") as f:
            f.write(blob_data)
```

---

## Async Support (python-oracledb 2.x)

```python
import asyncio
import oracledb

async def main():
    conn = await oracledb.connect_async(
        user="hr",
        password="password",
        dsn="localhost:1521/freepdb1"
    )
    async with conn.cursor() as cur:
        await cur.execute("SELECT COUNT(*) FROM employees")
        row = await cur.fetchone()
        print(row)
    await conn.close()

asyncio.run(main())

# Async pool
async def pooled():
    pool = oracledb.create_pool_async(
        user="hr", password="password", dsn="localhost:1521/freepdb1",
        min=2, max=10, increment=1
    )
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT 1 FROM dual")
            print(await cur.fetchone())
    await pool.close()

asyncio.run(pooled())
```

---

## Best Practices

- **Always use bind variables** — never concatenate user input into SQL.
- **Use a connection pool** in web/multi-threaded apps; do not share connections across threads.
- **Use context managers** (`with`) for connections and cursors to ensure cleanup.
- **Use `executemany`** for bulk inserts/updates instead of looping `execute`.
- **Set `arraysize`** on the cursor for large fetches: `cur.arraysize = 1000` reduces round-trips.
- **Commit explicitly** — `python-oracledb` does not auto-commit.
- **Prefer thin mode** unless you specifically need thick-mode-only features.

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| `f"SELECT ... WHERE id = {user_input}"` | SQL injection | Use bind variables |
| Sharing one connection across threads | Corruption, errors | Use a pool; one connection per thread |
| Not calling `conn.commit()` | DML silently rolled back on disconnect | Always commit or use `autocommit=True` for simple scripts |
| `fetchall()` on a million-row query | OOM | Use `fetchmany()` or iterate the cursor |
| Using `cx_Oracle` in new projects | Deprecated | Migrate to `python-oracledb` |
| Not setting `arraysize` for large fetches | Excessive round-trips | `cur.arraysize = 1000` before fetch |

---

## Oracle Version Notes (19c vs 26ai)

- Thin mode is supported for Oracle Database 12.1 and later.
- `python-oracledb` 2.x adds async support and JSON improvements for 21c+.
- Oracle 23ai JSON Relational Duality Views are accessible via normal SELECT queries.

## Sources

- [python-oracledb Documentation](https://python-oracledb.readthedocs.io/)
- [python-oracledb GitHub](https://github.com/oracle/python-oracledb)
- [Oracle Python Developer Center](https://www.oracle.com/database/technologies/appdev/python.html)
- [Migrating from cx_Oracle to python-oracledb](https://python-oracledb.readthedocs.io/en/latest/user_guide/appendix_c.html)

# Pandas + Oracle Database

## Overview

Pandas integrates with Oracle via SQLAlchemy (`read_sql`, `to_sql`) or directly via `python-oracledb` cursors. It is commonly used for data extraction, transformation, reporting, and bulk loading workflows.

```bash
pip install pandas sqlalchemy oracledb
```

---

## Reading Data

### `pd.read_sql` with SQLAlchemy

```python
import pandas as pd
from sqlalchemy import create_engine, text

engine = create_engine(
    "oracle+oracledb://hr:password@localhost:1521/?service_name=freepdb1"
)

# Basic read
df = pd.read_sql(
    "SELECT employee_id, last_name, salary, department_id FROM employees",
    con=engine
)
print(df.head())
print(df.dtypes)

# With bind parameters (use text() + params dict)
df = pd.read_sql(
    text("SELECT * FROM employees WHERE department_id = :dept AND salary > :sal"),
    con=engine,
    params={"dept": 60, "sal": 5000}
)
```

### Chunked Reads (Large Tables)

For tables too large to fit in memory, read in chunks:

```python
chunks = []
for chunk in pd.read_sql(
    "SELECT * FROM sales_history",
    con=engine,
    chunksize=10000   # rows per chunk
):
    # process each chunk
    chunk["revenue"] = chunk["quantity"] * chunk["unit_price"]
    chunks.append(chunk)

df = pd.concat(chunks, ignore_index=True)
```

### Direct from `python-oracledb` (No SQLAlchemy)

```python
import oracledb
import pandas as pd

conn = oracledb.connect(user="hr", password="password",
                        dsn="localhost:1521/freepdb1")
with conn.cursor() as cur:
    cur.execute("SELECT employee_id, last_name, salary FROM employees")
    cols = [c[0].lower() for c in cur.description]
    rows = cur.fetchall()

df = pd.DataFrame(rows, columns=cols)
```

### Column Name Casing

Oracle returns column names in UPPERCASE by default. Normalize to lowercase:

```python
df.columns = df.columns.str.lower()
```

Or use a SQLAlchemy event to normalize automatically:

```python
from sqlalchemy import event

@event.listens_for(engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, params, context, executemany):
    pass  # hook point if needed

# Simpler: just lowercase after read
df = pd.read_sql("SELECT * FROM employees", engine)
df.columns = df.columns.str.lower()
```

---

## Writing Data

### `df.to_sql` — Write DataFrame to Oracle

```python
# Write a DataFrame to an existing or new Oracle table
df.to_sql(
    name="salary_report",      # table name (lowercased by SQLAlchemy)
    con=engine,
    if_exists="replace",       # 'replace', 'append', or 'fail'
    index=False,               # don't write DataFrame index as a column
    dtype={                    # explicit Oracle types (optional but recommended)
        "employee_id": oracle.NUMBER,
        "last_name":   oracle.VARCHAR2(25),
        "salary":      oracle.NUMBER(8, 2),
    }
)
```

### `to_sql` Performance — Use `method="multi"` or `chunksize`

The default `to_sql` inserts one row per statement. For bulk loads, use `chunksize` and `method="multi"`:

```python
from sqlalchemy.dialects.oracle import VARCHAR2, NUMBER

df.to_sql(
    name="staging_table",
    con=engine,
    if_exists="append",
    index=False,
    chunksize=1000,
    method="multi"    # inserts multiple rows per statement
)
```

### High-Performance Bulk Load via `executemany`

For maximum speed, bypass `to_sql` and use `python-oracledb` directly:

```python
import oracledb

conn = oracledb.connect(user="hr", password="password",
                        dsn="localhost:1521/freepdb1")

records = df[["employee_id", "last_name", "salary"]].to_dict("records")

with conn.cursor() as cur:
    cur.executemany(
        "INSERT INTO staging (employee_id, last_name, salary) VALUES (:employee_id, :last_name, :salary)",
        records
    )
conn.commit()
conn.close()
```

---

## Data Type Mapping

| Pandas dtype | Oracle type | Notes |
|---|---|---|
| `int64` | `NUMBER(19)` | |
| `float64` | `NUMBER` | Loss of precision possible |
| `object` (string) | `CLOB` (default) or `VARCHAR2` | Use `dtype=` to force `VARCHAR2` |
| `datetime64` | `TIMESTAMP` | |
| `bool` | `NUMBER(1)` | Oracle has no SQL BOOLEAN in 19c |

Always specify `dtype=` in `to_sql` when writing to Oracle to avoid `CLOB` for short strings:

```python
from sqlalchemy.dialects.oracle import VARCHAR2, NUMBER, DATE

df.to_sql("my_table", engine, dtype={
    "name":   VARCHAR2(100),
    "amount": NUMBER(12, 2),
    "date":   DATE,
}, if_exists="append", index=False)
```

---

## Common Patterns

### ETL: Extract from Oracle, Transform, Load Back

```python
import pandas as pd
from sqlalchemy import create_engine, text

engine = create_engine("oracle+oracledb://hr:password@localhost:1521/?service_name=freepdb1")

# Extract
df = pd.read_sql("SELECT * FROM raw_sales", engine)
df.columns = df.columns.str.lower()

# Transform
df["revenue"] = df["quantity"] * df["unit_price"]
df["load_date"] = pd.Timestamp.now()
df = df[df["revenue"] > 0]

# Load
df.to_sql("processed_sales", engine, if_exists="append", index=False,
          chunksize=5000, method="multi")
```

### Aggregation and Reporting

```python
# Let Oracle do the heavy aggregation
df = pd.read_sql("""
    SELECT d.department_name,
           COUNT(e.employee_id) AS headcount,
           AVG(e.salary)        AS avg_salary,
           MAX(e.salary)        AS max_salary
    FROM   employees e
    JOIN   departments d ON e.department_id = d.department_id
    GROUP BY d.department_name
    ORDER BY avg_salary DESC
""", engine)

df.columns = df.columns.str.lower()
print(df.to_string(index=False))
```

### Parameterized Date Ranges

```python
from sqlalchemy import text

df = pd.read_sql(
    text("SELECT * FROM orders WHERE order_date BETWEEN :start AND :end"),
    con=engine,
    params={"start": "2025-01-01", "end": "2025-12-31"}
)
```

---

## Best Practices

- **Push aggregation to Oracle** — never load millions of rows into pandas just to group/filter. Write the SQL to aggregate first.
- **Use `chunksize`** when reading large tables — avoids OOM.
- **Always specify `dtype=`** in `to_sql` for Oracle — default string mapping creates `CLOB`.
- **Use `executemany` directly** for high-volume inserts — `to_sql` with `method="multi"` is convenient but `executemany` via `python-oracledb` is faster.
- **Lowercase column names** immediately after read — Oracle uppercase names make code noisy.
- **Use `index=False`** in `to_sql` unless you explicitly want the DataFrame index as a column.

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| `read_sql` with huge table and no `chunksize` | OOM error | Use `chunksize=` |
| `to_sql` without `dtype=` for string columns | Oracle creates CLOB for all strings | Explicitly set `VARCHAR2(n)` |
| String interpolation in SQL | SQL injection | Use `text()` with `params={}` |
| Not lowercasing column names | `df["LAST_NAME"]` vs `df["last_name"]` | `df.columns = df.columns.str.lower()` |
| `if_exists="replace"` on production table | Drops and recreates the table | Use `"append"` or truncate + append |

---

## Oracle Version Notes (19c vs 26ai)

- All patterns above work on Oracle 19c+.
- Oracle 21c+ native JSON: use `pd.read_sql` with `JSON_VALUE`/`JSON_TABLE` in the SQL to flatten JSON columns into DataFrame columns.

## Sources

- [pandas `read_sql` Documentation](https://pandas.pydata.org/docs/reference/api/pandas.read_sql.html)
- [pandas `to_sql` Documentation](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.to_sql.html)
- [SQLAlchemy Oracle Dialect](https://docs.sqlalchemy.org/en/20/dialects/oracle.html)
- [python-oracledb Documentation](https://python-oracledb.readthedocs.io/)

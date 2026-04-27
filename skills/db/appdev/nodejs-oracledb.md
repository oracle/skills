# Node.js + Oracle Database

## Overview

`node-oracledb` is the official Oracle driver for Node.js. Like `python-oracledb`, it supports two modes:

- **Thin mode** (default): pure JavaScript, no Oracle Client required. Supports most features.
- **Thick mode**: requires Oracle Instant Client. Needed for Advanced Queuing, Sharding, and some proxy auth scenarios.

Unless a snippet shows its own wrapper, JavaScript examples below assume they are running inside an `async` function and that `conn` is an open connection acquired earlier.

```bash
npm install oracledb
```

---

## Connecting

### Basic Connection (Promise API)

```js
const oracledb = require('oracledb');

// Default to Promise-based API
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT; // return rows as objects

async function run() {
  let conn;
  try {
    conn = await oracledb.getConnection({
      user:     'hr',
      password: 'password',
      connectString: 'localhost:1521/freepdb1'  // Easy Connect
    });

    const result = await conn.execute('SELECT sysdate AS now FROM dual');
    console.log(result.rows[0].NOW);
  } finally {
    if (conn) await conn.close();
  }
}

run();
```

### TNS Alias

```js
const conn = await oracledb.getConnection({
  user:          'hr',
  password:      'password',
  connectString: 'mydb_high'  // alias from tnsnames.ora
});
```

### Wallet / mTLS (Autonomous Database)

```js
const conn = await oracledb.getConnection({
  user:           'admin',
  password:       'password',
  connectString:  'myatp_high',
  configDir:      '/path/to/wallet',
  walletLocation: '/path/to/wallet',
  walletPassword: 'walletpassword'
});
```

### Enabling Thick Mode

```js
// Must be called before any connection
oracledb.initOracleClient({ libDir: '/opt/oracle/instantclient_21_9' });
```

---

## Executing SQL

### Bind Variables

```js
// Named binds (recommended)
const result = await conn.execute(
  `SELECT last_name, salary
   FROM   employees
   WHERE  department_id = :deptId AND salary > :minSal`,
  { deptId: 60, minSal: 5000 }
);
console.log(result.rows);

// Positional binds
const result2 = await conn.execute(
  'SELECT last_name FROM employees WHERE employee_id = :1',
  [100]
);
```

### DML with Binds

```js
const result = await conn.execute(
  'UPDATE employees SET salary = :sal WHERE employee_id = :id',
  { sal: 9500, id: 100 },
  { autoCommit: true }
);
console.log(`Rows updated: ${result.rowsAffected}`);
```

### Batch Execution (executeMany)

```js
const rows = [
  { id: 201, name: 'Alice', dept: 10 },
  { id: 202, name: 'Bob',   dept: 20 },
  { id: 203, name: 'Carol', dept: 10 },
];

const result = await conn.executeMany(
  'INSERT INTO employees (employee_id, last_name, department_id) VALUES (:id, :name, :dept)',
  rows,
  { autoCommit: true }
);
console.log(`Rows inserted: ${result.rowsAffected}`);
```

---

## Fetching Results

```js
// Default: rows as arrays
oracledb.outFormat = oracledb.OUT_FORMAT_ARRAY;
const r1 = await conn.execute('SELECT employee_id, last_name FROM employees WHERE rownum <= 5');
console.log(r1.rows); // [[100, 'King'], [101, 'Kochhar'], ...]

// Rows as objects (easier to work with)
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
const r2 = await conn.execute('SELECT employee_id, last_name FROM employees WHERE rownum <= 5');
console.log(r2.rows); // [{ EMPLOYEE_ID: 100, LAST_NAME: 'King' }, ...]

// Limit rows returned (maxRows)
const r3 = await conn.execute(
  'SELECT * FROM employees',
  [],
  { maxRows: 100 }
);
```

### Result Sets (for Large Queries)

```js
const result = await conn.execute(
  'SELECT employee_id, last_name, salary FROM employees',
  [],
  { resultSet: true, fetchArraySize: 100 }
);

const rs = result.resultSet;
let row;
while ((row = await rs.getRow()) !== null) {
  console.log(row);
}
await rs.close();
```

### Query Stream

```js
const stream = conn.queryStream(
  'SELECT employee_id, last_name FROM employees',
  [],
  { fetchArraySize: 200 }
);

stream.on('metadata', meta => console.log(meta));
stream.on('data',     row  => console.log(row));
stream.on('end',      ()   => stream.destroy());
stream.on('close',    ()   => console.log('done'));
stream.on('error',    err  => console.error(err));
```

---

## Connection Pooling

```js
// Create pool at startup
await oracledb.createPool({
  user:          'hr',
  password:      'password',
  connectString: 'localhost:1521/freepdb1',
  poolMin:       2,
  poolMax:       10,
  poolIncrement: 1,
  poolAlias:     'default'   // optional name
});

// Acquire from pool
async function queryEmployees() {
  let conn;
  try {
    conn = await oracledb.getConnection();   // gets from default pool
    const result = await conn.execute('SELECT COUNT(*) AS cnt FROM employees');
    return result.rows[0].CNT;
  } finally {
    if (conn) await conn.close();  // returns to pool, does not close
  }
}

// Close pool at shutdown
await oracledb.getPool().close(10);  // 10s drain timeout
```

---

## PL/SQL Calls

```js
// Stored procedure with IN/OUT
const result = await conn.execute(
  `BEGIN hr.get_employee(:id, :name, :sal); END;`,
  {
    id:   { val: 100, dir: oracledb.BIND_IN,  type: oracledb.NUMBER  },
    name: { val: '',  dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 100 },
    sal:  { val: 0,   dir: oracledb.BIND_OUT, type: oracledb.NUMBER  }
  }
);
console.log(result.outBinds.name, result.outBinds.sal);

// REF CURSOR
const result2 = await conn.execute(
  `BEGIN OPEN :rc FOR SELECT employee_id, last_name FROM employees WHERE department_id = :dept; END;`,
  {
    rc:   { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
    dept: 60
  }
);
const rs = result2.outBinds.rc;
const rows = await rs.getRows(100);
await rs.close();
console.log(rows);
```

---

## LOB Handling

```js
// Read CLOB as string (small LOBs)
oracledb.fetchAsString = [oracledb.CLOB];

const result = await conn.execute(
  'SELECT resume FROM employee_docs WHERE employee_id = :id',
  { id: 100 }
);
console.log(result.rows[0].RESUME);  // string

// Read BLOB as Buffer (small BLOBs)
oracledb.fetchAsBuffer = [oracledb.BLOB];

const r2 = await conn.execute(
  'SELECT photo FROM employee_photos WHERE employee_id = :id',
  { id: 100 }
);
const buf = r2.rows[0].PHOTO;  // Buffer
require('fs').writeFileSync('photo.jpg', buf);

// Write CLOB
const text = 'Large document content...';
await conn.execute(
  'UPDATE employee_docs SET resume = :resume WHERE employee_id = :id',
  { resume: text, id: 100 },
  { autoCommit: true }
);
```

---

## Best Practices

- **Always use bind variables** — never template literals with user data in SQL.
- **Use a connection pool** in Express/Fastify/Koa apps — create once at startup, close at shutdown.
- **Set `oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT`** globally for cleaner code.
- **Use `executeMany`** for bulk DML instead of looping `execute`.
- **Use result sets or streams** for large queries instead of `maxRows`.
- **Return connections to the pool** in a `finally` block — always call `conn.close()`.
- **Use `autoCommit: true`** only for single-statement transactions; manage commits explicitly otherwise.

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Interpolating user input into SQL | SQL injection | Use named or positional binds |
| Not calling `conn.close()` in `finally` | Pool exhaustion | Always close in finally |
| `maxRows` default (0 = unlimited) | Can OOM on large tables | Set `maxRows` or use result sets |
| Forgetting `await` on async calls | Silent failures | Ensure all async calls are awaited |
| `fetchAsString`/`fetchAsBuffer` not set for LOBs | LOB objects need manual streaming | Set globally or per-query |
| Creating a new connection per request | Connection overhead; pool not used | Use `oracledb.createPool` at startup |

---

## Oracle Version Notes (19c vs 26ai)

- Thin mode supports Oracle Database 12.1 and later.
- `node-oracledb` 6.x adds thin mode and improved JSON support for 21c+.
- Oracle 23ai `VECTOR` type is supported via `oracledb.DB_TYPE_VECTOR` in node-oracledb 6.4+.

## Sources

- [node-oracledb Documentation](https://node-oracledb.readthedocs.io/)
- [node-oracledb GitHub](https://github.com/oracle/node-oracledb)
- [Oracle Node.js Developer Center](https://www.oracle.com/database/technologies/appdev/nodejs.html)

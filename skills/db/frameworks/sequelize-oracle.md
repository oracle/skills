# Sequelize + Oracle Database

## Overview

Sequelize is a mature Node.js ORM with an official Oracle dialect backed by `node-oracledb`. It provides model definitions, associations, migrations, and a query interface.

```bash
npm install sequelize oracledb
```

---

## Connecting

```javascript
const { Sequelize } = require('sequelize');

// Easy Connect / host-style configuration
const sequelize = new Sequelize({
  dialect:  'oracle',
  host:     'localhost',
  port:     1521,
  database: 'freepdb1',    // service name for Oracle
  username: 'hr',
  password: 'password',
  pool: {
    max:     10,
    min:     2,
    acquire: 30000,
    idle:    10000,
  },
  logging: false,           // set to console.log in dev
});

// Alternative TNS alias configuration:
// const sequelize = new Sequelize('hr', 'password', {
//   dialect: 'oracle',
//   dialectOptions: { connectString: 'mydb_high' }
// });

// Alternative wallet / Autonomous Database configuration:
// const sequelize = new Sequelize({
//   dialect: 'oracle',
//   username: 'admin',
//   password: 'password',
//   dialectOptions: {
//     connectString: 'myatp_high',
//     configDir: '/path/to/wallet',
//     walletLocation: '/path/to/wallet'
//   }
// });

// Test connection
async function main() {
  await sequelize.authenticate();
  console.log('Connected to Oracle.');
}

main().catch(console.error);
```

---

## Model Definition

```javascript
const { DataTypes, Model } = require('sequelize');

class Department extends Model {}
Department.init({
  departmentId: {
    type:       DataTypes.INTEGER,
    primaryKey: true,
    field:      'DEPARTMENT_ID',
    autoIncrement: false,           // Oracle uses sequences
  },
  departmentName: {
    type:      DataTypes.STRING(30),
    allowNull: false,
    field:     'DEPARTMENT_NAME',
  },
}, {
  sequelize,
  modelName:  'Department',
  tableName:  'DEPARTMENTS',
  schema:     'HR',
  timestamps: false,               // no createdAt/updatedAt unless columns exist
});

class Employee extends Model {}
Employee.init({
  employeeId: {
    type:       DataTypes.INTEGER,
    primaryKey: true,
    field:      'EMPLOYEE_ID',
  },
  lastName: {
    type:      DataTypes.STRING(25),
    allowNull: false,
    field:     'LAST_NAME',
  },
  email: {
    type:      DataTypes.STRING(25),
    allowNull: false,
    unique:    true,
    field:     'EMAIL',
  },
  salary: {
    type:  DataTypes.DECIMAL(8, 2),
    field: 'SALARY',
  },
  hireDate: {
    type:  DataTypes.DATEONLY,
    field: 'HIRE_DATE',
  },
  departmentId: {
    type:  DataTypes.INTEGER,
    field: 'DEPARTMENT_ID',
  },
}, {
  sequelize,
  modelName:  'Employee',
  tableName:  'EMPLOYEES',
  schema:     'HR',
  timestamps: false,
});

// Associations
Employee.belongsTo(Department, { foreignKey: 'DEPARTMENT_ID', as: 'department' });
Department.hasMany(Employee,   { foreignKey: 'DEPARTMENT_ID', as: 'employees' });
```

---

## Oracle Sequence for Primary Key

Oracle does not support auto-increment the same way MySQL/PostgreSQL do. Use a `beforeCreate` hook to pull the next sequence value:

```javascript
Employee.addHook('beforeCreate', async (emp) => {
  const [result] = await sequelize.query(
    "SELECT employees_seq.NEXTVAL AS id FROM DUAL",
    { type: sequelize.QueryTypes.SELECT }
  );
  emp.employeeId = result.ID || result.id;
});
```

---

## Querying

```javascript
// Find all with filter
const employees = await Employee.findAll({
  where: {
    salary: { [Op.gt]: 5000 },
    departmentId: 60,
  },
  order: [['lastName', 'ASC']],
  limit: 25,
  offset: 0,
});

// Find one
const emp = await Employee.findOne({ where: { employeeId: 100 } });
const emp = await Employee.findByPk(100);

// With association
const emp = await Employee.findByPk(100, {
  include: [{ model: Department, as: 'department' }],
});

// Count
const count = await Employee.count({ where: { departmentId: 60 } });

// Find and count (for pagination)
const { count, rows } = await Employee.findAndCountAll({
  where: { salary: { [Op.gt]: 5000 } },
  limit: 25,
  offset: 0,
});
```

### Operators

```javascript
const { Op } = require('sequelize');

const employees = await Employee.findAll({
  where: {
    salary:     { [Op.between]: [5000, 10000] },
    lastName:   { [Op.like]: 'S%' },
    hireDate:   { [Op.gte]: new Date('2020-01-01') },
    departmentId: { [Op.in]: [10, 20, 60] },
  },
});
```

---

## Raw SQL

```javascript
// Raw SELECT — always use replacements, never interpolate
const [rows] = await sequelize.query(
  `SELECT last_name, salary FROM employees WHERE department_id = :dept AND salary > :minSal`,
  {
    replacements: { dept: 60, minSal: 5000 },
    type:         sequelize.QueryTypes.SELECT,
  }
);

// Raw DML
await sequelize.query(
  "UPDATE employees SET salary = :sal WHERE employee_id = :id",
  { replacements: { sal: 9500, id: 100 } }
);

// PL/SQL block
await sequelize.query(
  "BEGIN hr.update_salary(:id, :sal); END;",
  { replacements: { id: 100, sal: 9500 } }
);
```

---

## Insert / Update / Delete

```javascript
// Create (uses beforeCreate hook for sequence)
const emp = await Employee.create({
  lastName:     'Smith',
  email:        'smith@co.com',
  salary:       7500,
  departmentId: 60,
});

// Bulk create
await Employee.bulkCreate([
  { lastName: 'Alice', email: 'alice@co.com', salary: 6000, departmentId: 10 },
  { lastName: 'Bob',   email: 'bob@co.com',   salary: 7000, departmentId: 20 },
]);

// Update
await Employee.update({ salary: 9500 }, { where: { employeeId: 100 } });

// Destroy
await Employee.destroy({ where: { employeeId: 100 } });
```

---

## Transactions

```javascript
const t = await sequelize.transaction();
try {
  await Employee.update({ salary: 9500 }, { where: { employeeId: 100 }, transaction: t });
  await Employee.create({ lastName: 'New', email: 'new@co.com', salary: 6000 }, { transaction: t });
  await t.commit();
} catch (err) {
  await t.rollback();
  throw err;
}

// Managed transaction (auto-commit/rollback)
await sequelize.transaction(async (t) => {
  await Employee.update({ salary: 9500 }, { where: { employeeId: 100 }, transaction: t });
  await Employee.create({ lastName: 'New', email: 'new@co.com' }, { transaction: t });
});
```

---

## Migrations (Sequelize CLI)

```bash
npm install --save-dev sequelize-cli
npx sequelize-cli init
```

```javascript
// migrations/20250101-create-employees.js
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('EMPLOYEES', {
      EMPLOYEE_ID:   { type: Sequelize.INTEGER, primaryKey: true },
      LAST_NAME:     { type: Sequelize.STRING(25), allowNull: false },
      EMAIL:         { type: Sequelize.STRING(25), allowNull: false },
      SALARY:        { type: Sequelize.DECIMAL(8, 2) },
    });
    // Create Oracle sequence
    await queryInterface.sequelize.query(
      "CREATE SEQUENCE employees_seq START WITH 300 INCREMENT BY 1"
    );
  },
  async down(queryInterface) {
    await queryInterface.dropTable('EMPLOYEES');
    await queryInterface.sequelize.query("DROP SEQUENCE employees_seq");
  },
};
```

---

## Best Practices

- **Always use `replacements`** in raw queries — never interpolate values into SQL strings.
- **Set `timestamps: false`** unless your Oracle table has `createdAt`/`updatedAt` columns.
- **Always specify `field`** on each column to map camelCase model attributes to UPPER_CASE Oracle columns.
- **Use `beforeCreate` hooks** for Oracle sequence-based PKs.
- **Use `sequelize.transaction(async t => {})`** (managed form) to avoid forgetting commit/rollback.

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Missing `field:` on column defs | Sequelize generates wrong column name | Always set `field: 'UPPER_CASE_NAME'` |
| `autoIncrement: true` on Oracle PK | Not supported like MySQL | Use `beforeCreate` + sequence |
| Not setting `timestamps: false` | Sequelize looks for `createdAt`/`updatedAt` | Disable unless columns exist |
| String interpolation in raw SQL | SQL injection | Use `replacements:` |
| Forgetting `transaction: t` on operations | Operations run outside transaction | Pass `{ transaction: t }` to every call |

---

## Oracle Version Notes (19c vs 26ai)

- All patterns work on Oracle 19c+.
- Oracle 26ai `BOOLEAN` and `VECTOR` types require raw SQL queries.

## Sources

- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [Sequelize Oracle Dialect](https://sequelize.org/docs/v6/other-topics/dialect-specific-notes/#oracle-database)
- [Sequelize CLI Migrations](https://sequelize.org/docs/v6/other-topics/migrations/)

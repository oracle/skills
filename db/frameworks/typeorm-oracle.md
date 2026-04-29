# TypeORM + Oracle Database

## Overview

TypeORM is a TypeScript/JavaScript ORM that supports Oracle via `oracledb`. It works with Node.js, NestJS, and plain TypeScript projects.

```bash
npm install typeorm oracledb reflect-metadata
```

Enable decorators in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

---

## Data Source Configuration

```typescript
import { DataSource } from "typeorm";
import { Employee } from "./entity/Employee";
import { Department } from "./entity/Department";

export const AppDataSource = new DataSource({
  type:       "oracle",
  host:       "localhost",
  port:       1521,
  serviceName: "freepdb1",
  username:   "hr",
  password:   "password",
  entities:   [Employee, Department],
  synchronize: false,        // never true in production
  logging:    ["query", "error"],
  extra: {
    poolMin: 2,
    poolMax: 20,
  },
});

// TNS alias
export const AppDataSource = new DataSource({
  type:           "oracle",
  connectString:  "mydb_high",   // TNS alias
  username:       "hr",
  password:       "password",
  entities:       [Employee],
  synchronize:    false,
});
```

---

## Entities

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, JoinColumn, CreateDateColumn
} from "typeorm";

@Entity({ name: "EMPLOYEES", schema: "HR" })
export class Employee {

  @PrimaryGeneratedColumn({ name: "EMPLOYEE_ID" })
  employeeId: number;

  @Column({ name: "LAST_NAME", length: 25, nullable: false })
  lastName: string;

  @Column({ name: "EMAIL", length: 25, nullable: false, unique: true })
  email: string;

  @Column({ name: "SALARY", type: "decimal", precision: 8, scale: 2, nullable: true })
  salary: number;

  @CreateDateColumn({ name: "HIRE_DATE" })
  hireDate: Date;

  @ManyToOne(() => Department, dept => dept.employees, { lazy: true })
  @JoinColumn({ name: "DEPARTMENT_ID" })
  department: Promise<Department>;   // lazy = Promise
}

@Entity({ name: "DEPARTMENTS", schema: "HR" })
export class Department {

  @PrimaryGeneratedColumn({ name: "DEPARTMENT_ID" })
  departmentId: number;

  @Column({ name: "DEPARTMENT_NAME", length: 30 })
  departmentName: string;

  @OneToMany(() => Employee, emp => emp.department, { lazy: true })
  employees: Promise<Employee[]>;
}
```

### Explicit Oracle Sequence Control

```typescript
@Entity({ name: "ORDERS" })
export class Order {

  @PrimaryColumn({ name: "ORDER_ID" })
  orderId: number;

  // Use an explicit sequence when mapping a legacy schema or a fixed sequence name
  @BeforeInsert()
  async setId() {
    const result = await AppDataSource.query("SELECT orders_seq.NEXTVAL AS id FROM DUAL");
    this.orderId = result[0].ID;
  }

  @Column({ name: "ORDER_DATE", type: "date" })
  orderDate: Date;
}
```

### LOB Columns

```typescript
@Entity({ name: "EMPLOYEE_DOCS" })
export class EmployeeDoc {

  @PrimaryGeneratedColumn({ name: "DOC_ID" })
  docId: number;

  @Column({ name: "RESUME", type: "clob", nullable: true })
  resume: string;

  @Column({ name: "PHOTO", type: "blob", nullable: true })
  photo: Buffer;
}
```

---

## Querying

### Repository API

```typescript
await AppDataSource.initialize();

const empRepo = AppDataSource.getRepository(Employee);

// Find all
const employees = await empRepo.find({
  where: { salary: MoreThan(5000) },
  order: { lastName: "ASC" },
  take: 25,
  skip: 0,
});

// Find one
const emp = await empRepo.findOneBy({ employeeId: 100 });

// Find with relation
const emp = await empRepo.findOne({
  where: { employeeId: 100 },
  relations: { department: true },
});
```

### QueryBuilder

```typescript
const employees = await AppDataSource
  .getRepository(Employee)
  .createQueryBuilder("e")
  .innerJoinAndSelect("e.department", "d")
  .where("e.salary > :min", { min: 5000 })
  .andWhere("d.departmentName = :name", { name: "IT" })
  .orderBy("e.lastName", "ASC")
  .getMany();

// Pagination
const [rows, total] = await empRepo
  .createQueryBuilder("e")
  .skip(0)
  .take(25)
  .getManyAndCount();
```

### Raw SQL

```typescript
const rows = await AppDataSource.query(
  `SELECT last_name, salary FROM employees WHERE department_id = :1 AND salary > :2`,
  [60, 5000]
);

// Named params via QueryBuilder
const rows = await AppDataSource
  .createQueryBuilder()
  .select(["e.last_name", "e.salary"])
  .from(Employee, "e")
  .where("e.department_id = :dept", { dept: 60 })
  .getRawMany();
```

---

## Insert / Update / Delete

```typescript
const empRepo = AppDataSource.getRepository(Employee);

// Insert
const emp = empRepo.create({ lastName: "Smith", email: "smith@co.com", salary: 7500 });
await empRepo.save(emp);

// Bulk insert
await empRepo.save([
  { lastName: "Alice", email: "alice@co.com", salary: 6000 },
  { lastName: "Bob",   email: "bob@co.com",   salary: 7000 },
]);

// Update
await empRepo.update({ employeeId: 100 }, { salary: 9500 });

// Delete
await empRepo.delete({ employeeId: 100 });
```

---

## Transactions

```typescript
// QueryRunner transaction
const queryRunner = AppDataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
  await queryRunner.manager.update(Employee, { employeeId: 100 }, { salary: 9500 });
  await queryRunner.manager.update(Employee, { employeeId: 101 }, { salary: 8500 });
  await queryRunner.commitTransaction();
} catch (err) {
  await queryRunner.rollbackTransaction();
  throw err;
} finally {
  await queryRunner.release();
}

// Declarative transaction
await AppDataSource.transaction(async (manager) => {
  await manager.update(Employee, { employeeId: 100 }, { salary: 9500 });
  await manager.save(Employee, { lastName: "New", email: "new@co.com" });
});
```

---

## Migrations

```bash
# Generate migration from entity changes
npx typeorm migration:generate -d src/data-source.ts src/migration/UpdateSalary

# Run migrations
npx typeorm migration:run -d src/data-source.ts

# Revert last migration
npx typeorm migration:revert -d src/data-source.ts
```

```typescript
// Example migration
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSeniorityLevel1700000000000 implements MigrationInterface {

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE employees ADD (seniority_level VARCHAR2(20))`
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE employees DROP COLUMN seniority_level`
    );
  }
}
```

---

## NestJS Integration

```typescript
// app.module.ts
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type:        "oracle",
      host:        "localhost",
      port:        1521,
      serviceName: "freepdb1",
      username:    "hr",
      password:    "password",
      entities:    [__dirname + "/**/*.entity{.ts,.js}"],
      synchronize: false,
    }),
    TypeOrmModule.forFeature([Employee, Department]),
  ],
})
export class AppModule {}

// employees.service.ts
@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly empRepo: Repository<Employee>,
  ) {}

  findAll(): Promise<Employee[]> {
    return this.empRepo.find({ order: { lastName: "ASC" } });
  }
}
```

---

## Best Practices

- **Never use `synchronize: true` in production** — it can drop columns or tables.
- **Use migrations** for all schema changes in non-development environments.
- **Use `lazy: true` on relations** to avoid loading entire object graphs by default.
- **Use `QueryBuilder` with named params** for complex queries — avoids positional bind confusion.
- **Use `DataSource.query()`** for Oracle-specific SQL (`CONNECT BY`, `REGEXP_LIKE`, `ROWNUM`) where QueryBuilder falls short.

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| `synchronize: true` | Drops/recreates columns in production | Set to `false`; use migrations |
| Missing `experimentalDecorators` in tsconfig | Decorators not recognised | Enable in tsconfig.json |
| Not awaiting lazy relations | Returns `Promise` object instead of data | `await emp.department` |
| Assuming `PrimaryGeneratedColumn` always matches a legacy sequence strategy | Existing schemas may use fixed sequence names or non-default generation rules | Use explicit sequence logic when mapping legacy tables that do not fit TypeORM's default generation behavior |
| String literal params in raw SQL | SQL injection | Use positional `:1`, `:2` or named params object |

---
 
## Security Considerations
 
### Credential Management
 
- **Never hardcode credentials** in TypeORM configuration:
  ```typescript
  // AVOID: Hardcoded credentials
  export const AppDataSource = new DataSource({
      type:       "oracle",
      host:       "localhost",
      port:       1521,
      serviceName: "freepdb1",
      username:   "hr",
      password:   "hr_password",  // EXPOSED IN VERSION CONTROL
      // ... other params
  });
  ```
  
- **Use environment variables** for credentials:
  ```typescript
  import { DataSource } from "typeorm";
  
  export const AppDataSource = new DataSource({
      type:       "oracle",
      host:       process.env.DB_HOST || "localhost",
      port:       parseInt(process.env.DB_PORT || "1521"),
      serviceName: process.env.DB_SERVICE || "freepdb1",
      username:   process.env.DB_USER || "hr",
      password:   process.env.DB_PASSWORD || "",
      // ... other params
  });
  ```
  
- **Integrate with secret management systems:**
  - HashiCorp Vault, AWS Secrets Manager, Azure Key Vault
  - Use Node.js configuration libraries like `config`, `dotenv`, or `confidence`
  - Consider using AWS Secrets Manager with AWS SDK or similar
  
- **Consider Oracle Wallet** for secure credential storage:
  ```typescript
  import oracledb from "oracledb";
  
  // Initialize Oracle client for wallet support
  await oracledb.initOracleClient();
  
  export const AppDataSource = new DataSource({
      type:       "oracle",
      connectString: "myatp_high",   // TNS alias
      username:   "admin",
      password:   "password",  // Consider using wallet instead
      extra: {
          poolMin: 2,
          poolMax: 20,
          // Wallet configuration via environment or oracle.client
      },
  });
  ```
  
### Connection Security
 
- **Always use TCPS (TLS)** for production connections:
  ```typescript
  export const AppDataSource = new DataSource({
      type:       "oracle",
      // Use TCPS with full descriptor or TNS alias configured for TCPS
      connectString:  "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCPS)(HOST=db-host)(PORT=2484))(CONNECT_DATA=(SERVICE_NAME=service_name)))",
      username:   "${DB_USER}",
      password:   "${DB_PASSWORD}",
      // ... other params
  });
  ```
  
- **Validate SSL certificates** to prevent man-in-the-middle attacks:
  - Ensure proper certificate validation in Oracle client configuration
  - Consider setting SSL cipher suites via `oracledb` configuration
  
- **Consider using Oracle Cloud IAM authentication** for cloud deployments:
  ```typescript
  // Requires Oracle 21c+ and proper IAM setup
  export const AppDataSource = new DataSource({
      type:       "oracle",
      connectString:  "your_tcp_alias",
      username:   "",  // Empty for IAM
      password:   "",  // Empty for IAM
      extra: {
          // IAM authentication parameters
          externalAuth: true,
          // Additional IAM settings...
      },
  });
  ```
  
### SQL Injection Prevention
 
- **TypeORM provides protection** but developers must remain vigilant:
  
- **Safe: Repository API with parameter objects** (uses parameterized queries internally):
  ```typescript
  // SAFE: Automatically uses parameterized queries
  const employees = await empRepo.find({
      where: { salary: MoreThan(5000), department: { departmentName: "IT" } },
      order: { lastName: "ASC" },
  });
  ```
  
- **SAFE: QueryBuilder with parameter objects:**
  ```typescript
  // SAFE: Uses proper parameter binding
  const employees = await AppDataSource
      .getRepository(Employee)
      .createQueryBuilder("e")
      .innerJoinAndSelect("e.department", "d")
      .where("e.salary > :min", { min: 5000 })
      .andWhere("d.departmentName = :name", { name: "IT" })
      .orderBy("e.lastName", "ASC")
      .getMany();
  ```
  
- **SAFE: Raw SQL with positional or named parameters:**
  ```typescript
  // SAFE: Uses proper parameter binding
  const rows = await AppDataSource.query(
      `SELECT last_name, salary FROM employees WHERE department_id = :1 AND salary > :2`,
      [60, 5000]
  );
  
  // SAFE: Named params via QueryBuilder
  const rows = await AppDataSource
      .createQueryBuilder()
      .select(["e.last_name", "e.salary"])
      .from(Employee, "e")
      .where("e.department_id = :dept", { dept: 60 })
      .getRawMany();
  ```
  
- **UNSAFE: String concatenation in raw SQL** (avoid!):
  ```typescript
  // UNSAFE: String concatenation leads to SQL injection
  // NEVER DO THIS:
  const rows = await AppDataSource.query(
      `SELECT last_name, salary FROM employees WHERE department_id = ${deptId} AND salary > ${minSalary}`
  );
  ```
  
- **Be cautious with Raw SQL using template literals** (can introduce SQL injection if misused):
  ```typescript
  // UNSAFE if params contain user input:
  // const rows = await AppDataSource.query(
  //     `SELECT * FROM employees WHERE ${userInputColumn} = ${userInputValue}`
  // );
  
  // SAFE: Validate against allowed column names and use parameter binding
  const allowedColumns = ['employee_id', 'last_name', 'salary', 'department_id'];
  if (allowedColumns.includes(userInputColumn)) {
      const rows = await AppDataSource.query(
          `SELECT * FROM employees WHERE ${userInputColumn} = :value`,
          { value: userInputValue }
      );
  }
  ```
  
### Principle of Least Privilege
 
- **Configure database user with minimal required privileges:**
  ```sql
  -- Instead of granting excessive privileges:
  -- GRANT CREATE SESSION plus specific object privileges only; avoid broad legacy roles
  
  -- Grant only what TypeORM applications need:
  CREATE USER app_user IDENTIFIED BY "strong_password";
  GRANT CREATE SESSION TO app_user;
  GRANT SELECT, INSERT, UPDATE, DELETE ON app_schema.* TO app_user;
  GRANT EXECUTE ON app_schema.necessary_packages TO app_user;
  -- Only grant DDL if using schema synchronization (NOT RECOMMENDED FOR PRODUCTION)
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
  ```typescript
  import { Entity, Column, BeforeInsert, BeforeUpdate } from "typeorm";
  import * as crypto from "crypto";
  
  @Entity({ name: "CUSTOMERS" })
  export class Customer {
      @Column({ name: "CUSTOMER_ID" })
      @PrimaryGeneratedColumn()
      id: number;
      
      // Store encrypted SSN
      @Column({ name: "SSN_ENCRYPTED", type: "blob", nullable: true })
      ssnEncrypted: Buffer | null;
      
      @BeforeInsert()
      @BeforeUpdate()
      encryptSensitiveData() {
          if (this.ssnPlain && !this.ssnEncrypted) {
              // In practice, use proper encryption like AES-GCM with secure key management
              const key = crypto.randomBytes(32);  // Get from secure key management
              const iv = crypto.randomBytes(12);
              const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
              const encrypted = Buffer.concat([cipher.update(this.ssnPlain, 'utf8'), cipher.final()]);
              const tag = cipher.getAuthTag();
              
              // Store IV + encrypted data + tag
              this.ssnEncrypted = Buffer.concat([iv, encrypted, tag]);
              this.ssnPlain = null;  // Clear plaintext version
          }
      }
      
      // Temporary field for plaintext input (not persisted)
      ssnPlain: string | null = null;
      
      // Method to set plaintext SSN (for use in services/controllers)
      setSsnPlain(ssn: string) {
          this.ssnPlain = ssn;
      }
      
      // Method to get decrypted SSN
      getSsnPlain(): string | null {
          if (!this.ssnEncrypted) return null;
          
          try {
              const iv = this.ssnEncrypted.slice(0, 12);
              const encryptedData = this.ssnEncrypted.slice(12, -16);
              const tag = this.ssnEncrypted.slice(-16);
              
              const key = /* get from secure key management */;
              const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
              const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
              
              return decrypted.toString('utf8');
          } catch (err) {
              // Handle decryption errors appropriately
              return null;
          }
      }
  }
  ```
  
- **Use Oracle Transparent Data Encryption (TDE)** for data at rest:
  - Configure at the tablespace or column level in Oracle
  - TypeORM works transparently with TDE-encrypted tables
  
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
 
- **Enable TypeORM logging** for monitoring (in development/test only):
  ```typescript
  export const AppDataSource = new DataSource({
      type:       "oracle",
      // ... other params
      logging:    ["query", "error", "schema"],  // Log SQL queries, errors, schema changes
  });
  ```
  
- **Set client information** for traceability in database logs:
  ```typescript
  import { DataSource } from "typeorm";
  import { EventSubscriber } from "typeorm";
  
  export class OracleClientInfoSubscriber implements EventSubscriber {
      listenTo() {
          return [];
      }
      
      async afterLoad(connectionOrEntityManager: any) {
          // This won't work for setting client info on connection
          // Better to use DataSource events or connection hooks
      }
  }
  
  // Better approach: Use DataSource initialization events
  // Note: TypeORM doesn't expose connection pool events directly
  // Consider using oracledb events directly or middleware
  ```
  
- **Alternative: Use middleware or service layer** to set client info:
  ```typescript
  import oracledb from "oracledb";
  
  async function setOracleClientInfo(module: string, action: string, clientId?: string) {
      try {
          // Get a connection from the pool to set client info
          const connection = await oracledb.getConnection({
              user: process.env.DB_USER,
              password: process.env.DB_PASSWORD,
              connectString: process.env.DB_CONNECT_STRING
          });
          
          // Set module and action for tracing
          await connection.execute(
              "BEGIN DBMS_APPLICATION_INFO.SET_MODULE(:m, :a); END;",
              [module, action || '']
          );
          
          // Set client identifier if provided
          if (clientId) {
              await connection.execute(
                  "BEGIN DBMS_SESSION.SET_IDENTIFIER(:cid); END;",
                  [clientId]
              );
          }
          
          await connection.close();
      } catch (err) {
          // Log error but don't fail the operation
          console.warn("Failed to set Oracle client info:", err.message);
      }
  }
  
  // Usage in services:
  // await setOracleClientInfo("EmployeeService", "getEmployeeById", userId);
  ```
  
### Secure Handling of Large Objects (LOBs)
 
- **Be cautious with LOB data** as it can contain sensitive information:
  
- **Validate and sanitize LOB content** before persistence:
  ```typescript
  import { Entity, Column, BeforeInsert, BeforeUpdate } from "typeorm";
  
  @Entity({ name: "DOCUMENTS" })
  export class Document {
      @PrimaryGeneratedColumn()
      id: number;
      
      @Column({ name: "CONTENT", type: "clob", nullable: true })
      content: string | null;
      
      @Column({ name: "ATTACHMENT", type: "blob", nullable: true })
      attachment: Buffer | null;
      
      @BeforeInsert()
      @BeforeUpdate()
      validateLOBs() {
          // Validate content length
          if (this.content && this.content.length > 1000000) {  // 1MB limit
              throw new Error("Content too large (max 1MB)");
          }
          
          // Validate attachment size
          if (this.attachment && this.attachment.length > 10000000) {  // 10MB limit
              throw new Error("Attachment too large (max 10MB)");
          }
      }
  }
  ```
  
- **Consider encrypting sensitive LOB data** before storage:
  ```typescript
  import { Entity, Column, BeforeInsert, BeforeUpdate } from "typeorm";
  import * as crypto from "crypto";
  
  @Entity({ name: "SECURE_DOCUMENTS" })
  export class SecureDocument {
      @PrimaryGeneratedColumn()
      id: number;
      
      // Store encrypted content
      @Column({ name: "ENCRYPTED_CONTENT", type: "blob", nullable: true })
      encryptedContent: Buffer | null;
      
      @BeforeInsert()
      @BeforeUpdate()
      encryptContentIfNeeded() {
          if (this.plainContent && !this.encryptedContent) {
              // In practice, use proper encryption with secure key management
              const key = /* get from secure key management */;
              const iv = crypto.randomBytes(12);
              const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
              const encrypted = Buffer.concat([cipher.update(this.plainContent), cipher.final()]);
              const tag = cipher.getAuthTag();
              
              this.encryptedContent = Buffer.concat([iv, encrypted, tag]);
              this.plainContent = null;  // Clear plaintext version
          }
      }
      
      // Temporary field for plaintext input (not persisted)
      plainContent: string | null = null;
      
      // Method to set plaintext content
      setPlainContent(content: string) {
          this.plainContent = content;
      }
      
      // Method to get decrypted content
      getPlainContent(): string | null {
          if (!this.encryptedContent) return null;
          
          try {
              const iv = this.encryptedContent.slice(0, 12);
              const encryptedData = this.encryptedContent.slice(12, -16);
              const tag = this.encryptedContent.slice(-16);
              
              const key = /* get from secure key management */;
              const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
              const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
              
              return decrypted.toString('utf8');
          } catch (err) {
              return null;
          }
      }
  }
  ```
  
### Transaction Security
 
- **Keep transactions short** to minimize lock contention and exposure:
  
- **Use appropriate isolation levels** for your use case:
  ```typescript
  // Default isolation level is READ COMMITTED for Oracle
  // TypeORM doesn't expose isolation level configuration directly for Oracle
  // But we can ensure short transactions
  
  await AppDataSource.transaction(async (manager) => {
      // Short transaction here
      const emp = await manager.findOne(Employee, { where: { employeeId: 100 } });
      if (emp) {
          emp.salary = 9500;
          await manager.save(emp);
      }
  });
  ```
  
- **Avoid long-running transactions** that hold locks or snapshots:
  ```typescript
  // UNSAFE: Long-running transaction holding locks
  // await AppDataSource.transaction(async (manager) => {
  //     // Process many records (could take minutes/hours)
  //     const employees = await manager.find(Employee);
  //     for (const emp of employees) {
  //         // Process each employee
  //         emp.salary += 100;
  //         await manager.save(emp);
  //     }
  // });
  ```
  
- **SAFE: Process in batches with frequent commits:**
  ```typescript
  const batchSize = 100;
  let offset = 0;
  
  while (true) {
      const employees = await AppDataSource
          .getRepository(Employee)
          .findAndCount({
              skip: offset,
              take: batchSize,
              order: { employeeId: "ASC" }
          });
      
      const [batch, totalCount] = employees;
      
      if (batch.length === 0) {
          break;
      }
      
      // Process batch in a transaction
      await AppDataSource.transaction(async (manager) => {
          for (const emp of batch) {
              emp.salary += 100;
              await manager.save(emp);
          }
      });
      
      offset += batchSize;
  }
  ```
  
### Dependency Security
 
- **Keep TypeORM, oracledb, and dependencies updated:**
  - Regularly check for CVEs in TypeORM, oracledb, and related packages
  - Use dependency checking tools (OWASP Dependency-Check, Snyk, npm audit) in CI/CD
  
- **Monitor for oracledb-specific vulnerabilities:**
  - Stay updated with Oracle's security patches for their Node.js drivers
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
  - Consider data minimization principles in entity design
  - Implement mechanisms for right to erasure and data portability
  - Consider pseudonymization techniques where appropriate
  
- **Audit database access for compliance:**
  ```sql
  -- Track who accesses sensitive data (for compliance reporting)
  CREATE AUDIT POLICY typeorm_access_audit
    ACTIONS SELECT, INSERT, UPDATE, DELETE
    ON HR.EMPLOYEES, HR.SALARY_DATA;
  AUDIT POLICY typeorm_access_audit;
  ```
  
## Oracle Version Notes (19c vs 26ai)

- TypeORM Oracle support targets 12c+ features; all patterns work on 19c.
- Oracle 26ai `VECTOR` type not yet natively mapped — use raw SQL queries.

## Sources

- [TypeORM Documentation](https://typeorm.io/)
- [TypeORM Oracle Connection Options](https://typeorm.io/data-source-options#oracle-connection-options)
- [NestJS TypeORM Integration](https://docs.nestjs.com/techniques/database)

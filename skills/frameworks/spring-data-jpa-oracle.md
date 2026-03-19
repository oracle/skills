# Spring Data JPA + Oracle Database

## Overview

Spring Data JPA with Hibernate is the dominant Java persistence stack for Oracle. Hibernate's Oracle dialect handles Oracle-specific SQL generation, sequence-based ID strategies, CLOBs/BLOBs, and stored procedure calls.

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc11</artifactId>
    <version>23.4.0.24.05</version>
</dependency>
```

---

## Configuration

### `application.yml`

```yaml
spring:
  datasource:
    url: jdbc:oracle:thin:@localhost:1521/freepdb1
    username: hr
    password: password
    driver-class-name: oracle.jdbc.OracleDriver
    hikari:
      maximum-pool-size: 20
      minimum-idle: 2
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000

  jpa:
    database-platform: org.hibernate.dialect.OracleDialect
    hibernate:
      ddl-auto: validate          # 'validate', 'update', or 'none' for production
    show-sql: false
    properties:
      hibernate:
        format_sql: true
        default_schema: HR        # set default schema
        jdbc:
          batch_size: 50          # enable JDBC batching
          fetch_size: 100
        order_inserts: true       # optimize batch inserts
        order_updates: true
```

### Wallet / Autonomous Database

```yaml
spring:
  datasource:
    url: jdbc:oracle:thin:@myatp_high?TNS_ADMIN=/path/to/wallet
    username: admin
    password: password
```

---

## Entities

```java
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "EMPLOYEES", schema = "HR")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE,
                    generator = "emp_seq")
    @SequenceGenerator(name       = "emp_seq",
                       sequenceName = "EMPLOYEES_SEQ",
                       allocationSize = 1)   // match Oracle sequence increment
    @Column(name = "EMPLOYEE_ID")
    private Long employeeId;

    @Column(name = "LAST_NAME", nullable = false, length = 25)
    private String lastName;

    @Column(name = "EMAIL", nullable = false, unique = true, length = 25)
    private String email;

    @Column(name = "SALARY", precision = 8, scale = 2)
    private BigDecimal salary;

    @Column(name = "HIRE_DATE")
    private LocalDate hireDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DEPARTMENT_ID")
    private Department department;

    // getters / setters omitted
}

@Entity
@Table(name = "DEPARTMENTS", schema = "HR")
public class Department {

    @Id
    @Column(name = "DEPARTMENT_ID")
    private Long departmentId;

    @Column(name = "DEPARTMENT_NAME", nullable = false, length = 30)
    private String departmentName;

    @OneToMany(mappedBy = "department", fetch = FetchType.LAZY)
    private List<Employee> employees = new ArrayList<>();
}
```

### LOB Fields

```java
@Entity
@Table(name = "EMPLOYEE_DOCS")
public class EmployeeDoc {

    @Id
    @Column(name = "DOC_ID")
    private Long docId;

    @Lob
    @Column(name = "RESUME")        // maps to CLOB
    private String resume;

    @Lob
    @Column(name = "PHOTO")         // maps to BLOB
    private byte[] photo;
}
```

---

## Repositories

```java
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.List;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    // Derived query
    List<Employee> findByDepartmentDepartmentNameOrderByLastNameAsc(String deptName);

    // JPQL — database-agnostic
    @Query("SELECT e FROM Employee e WHERE e.salary > :minSal AND e.department.departmentId = :deptId")
    List<Employee> findHighEarners(@Param("minSal") BigDecimal minSal,
                                   @Param("deptId") Long deptId);

    // Native Oracle SQL
    @Query(value = """
        SELECT e.*
        FROM   employees e
        WHERE  REGEXP_LIKE(e.last_name, :pattern, 'i')
        ORDER  BY e.last_name
        """, nativeQuery = true)
    List<Employee> findByLastNamePattern(@Param("pattern") String pattern);

    // Update query
    @Modifying
    @Query("UPDATE Employee e SET e.salary = e.salary * :factor WHERE e.department.departmentId = :deptId")
    int applyRaise(@Param("factor") BigDecimal factor,
                   @Param("deptId") Long deptId);
}
```

---

## Service Layer and Transactions

```java
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmployeeService {

    private final EmployeeRepository repo;

    public EmployeeService(EmployeeRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public Employee hire(String lastName, String email, BigDecimal salary, Long deptId) {
        Employee emp = new Employee();
        emp.setLastName(lastName);
        emp.setEmail(email);
        emp.setSalary(salary);
        emp.setDepartment(new Department(deptId));
        return repo.save(emp);
    }

    @Transactional
    public void applyDepartmentRaise(Long deptId, double pct) {
        BigDecimal factor = BigDecimal.valueOf(1 + pct / 100);
        int updated = repo.applyRaise(factor, deptId);
        if (updated == 0) throw new IllegalArgumentException("Department not found: " + deptId);
    }

    @Transactional(readOnly = true)
    public List<Employee> getHighEarners(BigDecimal minSal, Long deptId) {
        return repo.findHighEarners(minSal, deptId);
    }
}
```

---

## PL/SQL Calls

### Via `@NamedStoredProcedureQuery`

```java
@Entity
@Table(name = "EMPLOYEES")
@NamedStoredProcedureQuery(
    name = "Employee.updateSalary",
    procedureName = "HR.UPDATE_SALARY",
    parameters = {
        @StoredProcedureParameter(mode = ParameterMode.IN,  name = "p_id",  type = Long.class),
        @StoredProcedureParameter(mode = ParameterMode.IN,  name = "p_sal", type = BigDecimal.class)
    }
)
public class Employee { ... }
```

```java
@PersistenceContext
private EntityManager em;

public void updateSalary(Long id, BigDecimal sal) {
    StoredProcedureQuery q = em.createNamedStoredProcedureQuery("Employee.updateSalary");
    q.setParameter("p_id",  id);
    q.setParameter("p_sal", sal);
    q.execute();
}
```

### Via `EntityManager` Native Call

```java
@Transactional
public BigDecimal getEmployeeCount(Long deptId) {
    Query q = em.createNativeQuery(
        "SELECT HR.GET_EMPLOYEE_COUNT(:dept) FROM DUAL"
    );
    q.setParameter("dept", deptId);
    return (BigDecimal) q.getSingleResult();
}
```

### Via `JdbcTemplate` for Complex PL/SQL

```java
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;

@Service
public class PlsqlService {

    private final SimpleJdbcCall getCountCall;

    public PlsqlService(JdbcTemplate jdbcTemplate) {
        this.getCountCall = new SimpleJdbcCall(jdbcTemplate)
            .withSchemaName("HR")
            .withProcedureName("GET_DEPT_STATS")
            .returningResultSet("p_cursor", BeanPropertyRowMapper.newInstance(DeptStat.class));
    }

    public List<DeptStat> getDeptStats(Long deptId) {
        Map<String, Object> out = getCountCall.execute(Map.of("p_dept_id", deptId));
        return (List<DeptStat>) out.get("p_cursor");
    }
}
```

---

## Pagination

```java
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

// Hibernate generates Oracle OFFSET/FETCH syntax automatically
Page<Employee> page = repo.findAll(
    PageRequest.of(0, 25, Sort.by("lastName").ascending())
);

System.out.println("Total employees: " + page.getTotalElements());
System.out.println("Page 1: " + page.getContent());
```

---

## Best Practices

- **Use `SEQUENCE` strategy** for IDs — set `allocationSize` to match the Oracle sequence `INCREMENT BY` value (default 1). Mismatches cause gaps or errors.
- **Set `fetch = LAZY`** on all associations — eager loading causes N+1 queries.
- **Use `@Transactional(readOnly = true)`** for query methods — enables Hibernate optimizations and Oracle read-consistent snapshots.
- **Enable JDBC batching** (`hibernate.jdbc.batch_size=50`) for bulk saves.
- **Use `@Query(nativeQuery = true)`** for Oracle-specific SQL (CONNECT BY, REGEXP_LIKE, ROWNUM, etc.).
- **Never use `ddl-auto: create-drop` or `update` in production** — use Liquibase or Flyway instead.

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| `allocationSize` mismatch with sequence `INCREMENT BY` | PK conflicts or large ID gaps | Set both to the same value (usually 1) |
| `FetchType.EAGER` on collections | N+1 queries; loads entire table | Use `LAZY` + `@EntityGraph` or JOIN FETCH where needed |
| `ddl-auto: update` in production | Schema changes applied automatically, can drop columns | Use `validate` or `none`; manage DDL with Liquibase |
| Missing `@Column(name=...)` | Hibernate uses camelCase, Oracle expects UPPER_SNAKE | Always specify `@Column(name = "UPPER_CASE")` |
| `@Lob` on a `String` without Oracle config | Maps to LONGVARCHAR, not CLOB | Use `@Column(columnDefinition = "CLOB")` if needed |

---

## Security Considerations

### Credential Management
- **Never hardcode credentials** in application configuration files:
  ```yaml
  # AVOID: Hardcoded credentials in application.yml
  spring:
    datasource:
      url: jdbc:oracle:thin:@localhost:1521/freepdb1
      username: hr
      password: hr_password  # EXPOSED IN VERSION CONTROL
  ```
  
- **Use environment variables or property placeholders:**
  ```yaml
  spring:
    datasource:
      url: ${DB_URL}
      username: ${DB_USERNAME}
      password: ${DB_PASSWORD}
  ```
  
- **Integrate with secret management systems:**
  - HashiCorp Vault, AWS Secrets Manager, Azure Key Vault
  - Use Spring Cloud Vault or similar integrations
  - Consider using Oracle Wallet for credential storage:
    ```yaml
    spring:
      datasource:
        url: jdbc:oracle:thin:@myatp_high?TNS_ADMIN=/path/to/wallet
        username: ${DB_USER}
        # Wallet password can be provided via:
        # - Oracle Wallet auto-login (secure file)
        # - Environment variable: oracle.net.wallet_password
        # - Callback handler for programmatic access
    ```

### Connection Security
- **Always use TCPS (TLS)** for production connections:
  ```yaml
  spring:
    datasource:
      url: jdbc:oracle:thin:@(DESCRIPTION=(ADDRESS=(PROTOCOL=TCPS)(HOST=db-host)(PORT=2484))(CONNECT_DATA=(SERVICE_NAME=service_name)))
  ```
  
- **Validate SSL certificates** to prevent man-in-the-middle attacks:
  ```yaml
  spring:
    datasource:
      hikari:
        connection-test-query: SELECT 1 FROM DUAL
        # Additional SSL properties can be set via connection properties
  ```
  
- **Consider using Oracle Cloud IAM authentication** for cloud deployments:
  ```java
  // Example using Oracle Cloud IAM (requires additional dependencies)
  Properties props = new Properties();
  props.put("oracle.net.authentication_services", "(IAM)");
  props.put("oracle.net.host", "your-ocid.oc.oraclecloud.com");
  // Additional IAM configuration...
  ```

### SQL Injection Prevention
- **Spring Data JPA provides protection** but developers must remain vigilant:
  
- **Safe: Derived query methods** (Spring Data JPA uses prepared statements internally):
  ```java
  // SAFE: Automatically uses PreparedStatement
  List<Employee> findByLastNameAndFirstName(String lastName, String firstName);
  ```
  
- **Safe: @Query with parameter binding** (named or positional):
  ```java
  // SAFE: Uses parameter binding
  @Query("SELECT e FROM Employee e WHERE e.salary > :minSal AND e.departmentId = :deptId")
  List<Employee> findHighEarners(@Param("minSal") BigDecimal minSal,
                                 @Param("deptId") Long deptId);
  ```
  
- **SAFE: Native queries with parameter binding:**
  ```java
  // SAFE: Native query with parameter binding
  @Query(value = "SELECT * FROM employees WHERE last_name = :pattern", nativeQuery = true)
  List<Employee> findByLastName(@Param("pattern") String pattern);
  ```
  
- **UNSAFE: String concatenation in native queries** (avoid!):
  ```java
  // UNSAFE: String concatenation leads to SQL injection
  @Query(value = "SELECT * FROM employees WHERE last_name = '" + pattern + "'", nativeQuery = true)
  List<Employee> findByLastNameUnsafe(String pattern);  // NEVER DO THIS
  
  // UNSAFE: Using SpEL or string manipulation to build queries
  @Query(value = "SELECT * FROM employees WHERE salary > #{#{minSal}}", nativeQuery = true)  // RISKY
  List<Employee> findBySalarySpEL(BigDecimal minSal);
  ```

### Principle of Least Privilege
- **Configure database user with minimal required privileges:**
  ```sql
  -- Instead of granting excessive privileges:
  -- GRANT CREATE SESSION plus specific object privileges only; avoid broad legacy roles
  
  -- Grant only what Spring Data JPA applications need:
  CREATE USER app_user IDENTIFIED BY "strong_password";
  GRANT CREATE SESSION TO app_user;
  GRANT SELECT, INSERT, UPDATE, DELETE ON app_schema.* TO app_user;
  GRANT EXECUTE ON app_schema.necessary_packages TO app_user;
  -- Only grant DDL if using hibernate.hbm2ddl.auto (NOT RECOMMENDED FOR PRODUCTION)
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
  ```java
  @Entity
  public class Customer {
      @Id
      private Long id;
      
      // Encrypt sensitive fields before storing
      @Transient
      private String ssn;  // Not persisted directly
      
      @Column(name = "SSN_ENCRYPTED")
      private String encryptedSsn;  // Store only encrypted version
      
      @PrePersist
      @PreUpdate
      private void encryptSensitiveData() {
          if (ssn != null && encryptedSsn == null) {
              this.encryptedSsn = encrypt(ssn);  // Use AES/GCM or similar
          }
      }
      
      @PostLoad
      private void decryptSensitiveData() {
          if (encryptedSsn != null && ssn == null) {
              this.ssn = decrypt(encryptedSsn);
          }
      }
  }
  ```
  
- **Use Oracle Transparent Data Encryption (TDE)** for data at rest:
  - Configure at the tablespace or column level in Oracle
  - Spring Data JPA works transparently with TDE-encrypted tables
  
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
- **Enable Hibernate statistics** for monitoring (in development/test only):
  ```yaml
  spring:
    jpa:
      properties:
        hibernate:
          generate_statistics: true  # ONLY FOR DEBUGGING
  ```
  
- **Set client information** for traceability in database logs:
  ```java
  @Service
  public class EmployeeService {
      @PersistenceContext
      private EntityManager em;
      
      @Transactional
      public Employee hire(String lastName, String email, BigDecimal salary, Long deptId) {
          // Set client info for auditing/tracing
          if (em.unwrap(Session.class) != null) {
              Session session = em.unwrap(Session.class);
              session.enableFilter("currentUserFilter");
              session.setComment("EmployeeService.hire");
          }
          
          Employee emp = new Employee();
          emp.setLastName(lastName);
          emp.setEmail(email);
          emp.setSalary(salary);
          emp.setDepartment(new Department(deptId));
          return repo.save(emp);
      }
  }
  ```
  
- **Alternative: Use Hibernate interceptors or event listeners** to set client info:
  ```java
  // Configure in Spring bean
  @Bean
  public MetadataBuilderCallback metadataBuilderCallback() {
      return (metadataBuilder) -> {
          metadataBuilder.applyImplicitFilterName("currentUserFilter");
      };
  }
  ```

### Secure Handling of LOBs
- **Be cautious with LOB data** as it can contain sensitive information:
  
- **Validate and sanitize LOB content** before persistence:
  ```java
  @Service
  public class DocumentService {
      @PersistenceContext
      private EntityManager em;
      
      public EmployeeDoc storeDocument(String resumeText, byte[] photoBytes) {
          // Validate input length to prevent DoS
          if (resumeText.length() > 100000) {  // 100K characters
              throw new IllegalArgumentException("Resume too large");
          }
          
          if (photoBytes.length > 5000000) {  // 5MB
              throw new IllegalArgumentException("Photo too large");
          }
          
          EmployeeDoc doc = new EmployeeDoc();
          doc.setResume(resumeText);
          doc.setPhoto(photoBytes);
          return em.persist(doc);
      }
  }
  ```
  
- **Consider encrypting sensitive LOB data** before storage:
  ```java
  // Encrypt sensitive documents before storing as BLOB/CLOB
  byte[] encryptedPhoto = encrypt(photoBytes);  // Using AES/GCM
  doc.setPhoto(encryptedPhoto);
  ```

### Transaction Security
- **Keep transactions short** to minimize lock contention and exposure:
  
- **Use appropriate isolation levels** for your use case:
  ```java
  @Transactional(isolation = Isolation.READ_COMMITTED)  // Default for Oracle
  public void updateEmployee(Long id, String newEmail) {
      // ...
  }
  ```
  
- **Avoid long-running transactions** that hold locks or snapshots:
  ```java
  // UNSAFE: Long-running transaction holding locks
  @Transactional
  public void processAllEmployees() {
      List<Employee> employees = repo.findAll();  // May hold snapshots/locks
      for (Employee emp : employees) {
          // Process each employee (could take minutes/hours)
          // ...
      }
  }
  
  // SAFE: Process in batches
  @Transactional
  public void processAllEmployeesInBatches() {
      int page = 0;
      int size = 100;
      Page<Employee> pageResult;
      
      do {
          pageResult = repo.findAll(PageRequest.of(page++, size));
          // Process batch
          for (Employee emp : pageResult.getContent()) {
              // ...
          }
      } while (pageResult.hasNext());
  }
  ```

### Dependency Security
- **Keep Spring Data JPA and Hibernate dependencies updated:**
  - Regularly check for CVEs in Spring Framework, Hibernate, and Oracle JDBC driver
  - Use dependency checking tools (OWASP Dependency-Check, Snyk) in CI/CD
  
- **Monitor for Hibernate-specific vulnerabilities:**
  - Hibernate has had vulnerabilities related to HQL injection in older versions
  - Ensure you're using Hibernate 5.2+ or 6.0+ for better security

### Compliance Considerations
- **PCI-DSS**: 
  - Ensure cardholder data is encrypted (application-level or TDE)
  - Restrict access to cardholder data environments
  - Implement strong access control measures
  
- **HIPAA**:
  - Implement access controls and audit trails for PHI
  - Consider encryption for ePHI at rest and in transit
  - Ensure minimum necessary access to protected health information
  
- **GDPR**:
  - Implement data protection by design and by default
  - Consider data minimization principles in entity design
  - Implement mechanisms for right to erasure and data portability

---

## Oracle Version Notes (19c vs 26ai)

- `OracleDialect` in Hibernate 6.x auto-detects the Oracle version and adjusts SQL generation.
- Oracle 12c+: `IDENTITY` columns supported; use `GenerationType.IDENTITY` if preferred.
- Oracle 26ai: `BOOLEAN` SQL type supported natively; Hibernate maps Java `boolean` to it.

## Sources

- [Spring Data JPA Reference](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/)
- [Hibernate ORM Oracle Dialect](https://docs.jboss.org/hibernate/orm/6.4/dialect/oracle.html)
- [Oracle JDBC + Spring Boot](https://docs.oracle.com/en/database/oracle/oracle-database/19/jjdbc/JDBC-getting-started.html)

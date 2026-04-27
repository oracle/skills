# MyBatis + Oracle Database

## Overview

MyBatis is a SQL mapping framework that gives developers direct control over SQL while handling result mapping, parameter binding, and connection management. It is popular for Oracle-heavy applications where fine-grained SQL control matters more than abstraction.

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>3.0.3</version>
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

mybatis:
  mapper-locations: classpath:mappers/**/*.xml
  type-aliases-package: com.example.model
  configuration:
    map-underscore-to-camel-case: true   # LAST_NAME -> lastName
    default-fetch-size: 100
    default-statement-timeout: 30
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl  # SQL logging (dev only)
```

---

## Model

```java
package com.example.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public class Employee {
    private Long       employeeId;
    private String     lastName;
    private String     email;
    private BigDecimal salary;
    private LocalDate  hireDate;
    private Long       departmentId;
    // getters / setters omitted
}
```

---

## Mapper Interface

```java
package com.example.mapper;

import com.example.model.Employee;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.math.BigDecimal;
import java.util.List;

@Mapper
public interface EmployeeMapper {

    Employee findById(@Param("id") Long id);

    List<Employee> findByDept(@Param("deptId") Long deptId,
                              @Param("minSal") BigDecimal minSal);

    int insert(Employee employee);

    int update(Employee employee);

    int delete(@Param("id") Long id);

    // Batch insert
    int insertBatch(@Param("list") List<Employee> employees);

    // PL/SQL stored procedure
    void updateSalary(@Param("id") Long id, @Param("salary") BigDecimal salary);

    // Function returning value
    BigDecimal getEmployeeCount(@Param("deptId") Long deptId);
}
```

---

## Mapper XML

```xml
<!-- src/main/resources/mappers/EmployeeMapper.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.example.mapper.EmployeeMapper">

  <!-- Result Map — explicit column-to-field mapping -->
  <resultMap id="employeeMap" type="Employee">
    <id     column="EMPLOYEE_ID"   property="employeeId"/>
    <result column="LAST_NAME"     property="lastName"/>
    <result column="EMAIL"         property="email"/>
    <result column="SALARY"        property="salary"/>
    <result column="HIRE_DATE"     property="hireDate"/>
    <result column="DEPARTMENT_ID" property="departmentId"/>
  </resultMap>

  <!-- SELECT by PK -->
  <select id="findById" resultMap="employeeMap">
    SELECT employee_id, last_name, email, salary, hire_date, department_id
    FROM   employees
    WHERE  employee_id = #{id}
  </select>

  <!-- SELECT with multiple params — always use #{} never ${} -->
  <select id="findByDept" resultMap="employeeMap">
    SELECT employee_id, last_name, salary, department_id
    FROM   employees
    WHERE  department_id = #{deptId}
      AND  salary        > #{minSal}
    ORDER BY last_name
  </select>

  <!-- INSERT with Oracle sequence -->
  <insert id="insert" useGeneratedKeys="false">
    INSERT INTO employees (employee_id, last_name, email, salary, hire_date, department_id)
    VALUES (employees_seq.NEXTVAL, #{lastName}, #{email}, #{salary}, #{hireDate}, #{departmentId})
  </insert>

  <!-- INSERT returning generated key via selectKey -->
  <insert id="insertWithKey">
    <selectKey keyProperty="employeeId" resultType="long" order="BEFORE">
      SELECT employees_seq.NEXTVAL FROM DUAL
    </selectKey>
    INSERT INTO employees (employee_id, last_name, email, salary, department_id)
    VALUES (#{employeeId}, #{lastName}, #{email}, #{salary}, #{departmentId})
  </insert>

  <!-- UPDATE -->
  <update id="update">
    UPDATE employees
    SET    last_name     = #{lastName},
           email         = #{email},
           salary        = #{salary},
           department_id = #{departmentId}
    WHERE  employee_id   = #{employeeId}
  </update>

  <!-- DELETE -->
  <delete id="delete">
    DELETE FROM employees WHERE employee_id = #{id}
  </delete>

  <!-- Batch insert using foreach -->
  <insert id="insertBatch">
    INSERT ALL
    <foreach collection="list" item="e">
      INTO employees (employee_id, last_name, email, salary, department_id)
      VALUES (employees_seq.NEXTVAL, #{e.lastName}, #{e.email}, #{e.salary}, #{e.departmentId})
    </foreach>
    SELECT 1 FROM DUAL
  </insert>

</mapper>
```

---

## Dynamic SQL

```xml
<!-- Conditional WHERE clauses -->
<select id="search" resultMap="employeeMap">
  SELECT employee_id, last_name, salary, department_id
  FROM   employees
  <where>
    <if test="lastName != null and lastName != ''">
      AND UPPER(last_name) LIKE UPPER('%' || #{lastName} || '%')
    </if>
    <if test="deptId != null">
      AND department_id = #{deptId}
    </if>
    <if test="minSal != null">
      AND salary >= #{minSal}
    </if>
  </where>
  ORDER BY last_name
</select>

<!-- Dynamic UPDATE — only set provided fields -->
<update id="partialUpdate">
  UPDATE employees
  <set>
    <if test="lastName != null">last_name = #{lastName},</if>
    <if test="salary != null">salary = #{salary},</if>
    <if test="departmentId != null">department_id = #{departmentId},</if>
  </set>
  WHERE employee_id = #{employeeId}
</update>

<!-- IN clause -->
<select id="findByIds" resultMap="employeeMap">
  SELECT employee_id, last_name
  FROM   employees
  WHERE  employee_id IN
  <foreach collection="ids" item="id" open="(" separator="," close=")">
    #{id}
  </foreach>
</select>
```

---

## PL/SQL Calls

### Stored Procedure (statementType="CALLABLE")

```xml
<!-- Procedure with IN and OUT params -->
<select id="updateSalary" statementType="CALLABLE">
  { CALL hr.update_salary(#{id, mode=IN, jdbcType=NUMERIC},
                          #{salary, mode=IN, jdbcType=NUMERIC}) }
</select>
```

### Function Returning a Value

```xml
<select id="getEmployeeCount" statementType="CALLABLE" resultType="java.math.BigDecimal">
  { #{result, mode=OUT, jdbcType=NUMERIC} = CALL hr.get_employee_count(#{deptId, mode=IN, jdbcType=NUMERIC}) }
</select>
```

### OUT Parameter in a Procedure

```java
// In Java — use a Map to carry OUT params
public Map<String, Object> callGetEmployee(Long id) {
    Map<String, Object> params = new HashMap<>();
    params.put("id",       id);
    params.put("lastName", null);  // OUT
    params.put("salary",   null);  // OUT
    employeeMapper.getEmployee(params);
    return params;
}
```

```xml
<select id="getEmployee" statementType="CALLABLE" parameterType="map">
  { CALL hr.get_employee(
      #{id,       mode=IN,  jdbcType=NUMERIC},
      #{lastName, mode=OUT, jdbcType=VARCHAR},
      #{salary,   mode=OUT, jdbcType=NUMERIC}
  ) }
</select>
```

---

## Result Maps — Associations and Collections

```xml
<resultMap id="deptWithEmployees" type="Department">
  <id     column="DEPARTMENT_ID"   property="departmentId"/>
  <result column="DEPARTMENT_NAME" property="departmentName"/>
  <collection property="employees" ofType="Employee">
    <id     column="EMPLOYEE_ID"   property="employeeId"/>
    <result column="LAST_NAME"     property="lastName"/>
    <result column="SALARY"        property="salary"/>
  </collection>
</resultMap>

<select id="findDeptWithEmployees" resultMap="deptWithEmployees">
  SELECT d.department_id, d.department_name,
         e.employee_id, e.last_name, e.salary
  FROM   departments d
  JOIN   employees e ON d.department_id = e.department_id
  WHERE  d.department_id = #{deptId}
</select>
```

---

## Best Practices

- **Always use `#{param}` (not `${param}`)** — `${}` is string substitution and causes SQL injection.
- **Use `<resultMap>`** for all non-trivial mappings — `map-underscore-to-camel-case` handles simple cases but explicit maps are more robust.
- **Use `<selectKey>` with Oracle sequences** for insert key generation.
- **Use `statementType="CALLABLE"`** for all PL/SQL calls.
- **Separate SQL concerns** — keep complex SQL in XML mapper files, not Java annotations.
- **Enable `log-impl`** in dev to see generated SQL; disable in production.

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| `${param}` in SQL | SQL injection | Always use `#{param}` |
| Missing `statementType="CALLABLE"` | PL/SQL call fails silently | Add `statementType="CALLABLE"` |
| `INSERT ALL ... SELECT 1 FROM DUAL` batch without transaction | Partial inserts on error | Wrap in `@Transactional` |
| `useGeneratedKeys="true"` for Oracle | Not supported like MySQL/PostgreSQL | Use `<selectKey>` with `NEXTVAL` |
| Forgetting `map-underscore-to-camel-case` | Fields not mapped | Enable in config or use explicit `<resultMap>` |

---

## Oracle Version Notes (19c vs 26ai)

- All patterns above work on Oracle 19c+.
- Oracle 26ai: Native `BOOLEAN` type — map to Java `boolean` directly in result maps.

## Sources

- [MyBatis Documentation](https://mybatis.org/mybatis-3/)
- [MyBatis Spring Boot Starter](https://mybatis.org/spring-boot-starter/mybatis-spring-boot-autoconfigure/)
- [MyBatis Dynamic SQL](https://mybatis.org/mybatis-dynamic-sql/)

# JDBC Providers for Spring

## Overview

Use this skill to give Oracle JDBC an end-user security context inside a
Spring application, so Oracle Database's Deep Data Security features
(`DATA GRANT`, `DATA ROLE`, `APPLICATION IDENTITY`) can authorize database
operations per end user, not just per database account.

This is the one provider in this skill that is a framework integration
rather than a cloud secret/config source.

## Installation

```xml
<dependency>
  <groupId>com.oracle.database.jdbc</groupId>
  <artifactId>ojdbc-provider-spring</artifactId>
  <version>1.1.0</version>
</dependency>
```

Compiled for JDK 17, forward compatible with later JDKs.

## End User Security Context Provider

Identified by `ojdbc-provider-spring-end-user-security-context`, a
[Resource Provider](https://docs.oracle.com/en/database/oracle/oracle-database/26/jajdb/oracle/jdbc/spi/OracleResourceProvider.html)
for `oracle.jdbc.EndUserSecurityContext`. Almost every JDBC network
operation (SQL execution, fetch, commit/rollback, LOB access) becomes
subject to `DATA GRANT` policy once this context is attached.

```yaml
spring:
  security:
    oauth2:
      client:
        provider:
          azure:
            token-uri: "https://login.microsoftonline.com/<tenant>/oauth2/v2.0/token"
        registration:
          azure:
            authorization-grant-type: client_credentials
            client-id: "<client-id>"
            client-secret: "<client-secret>"
            scope: "https://<app>.onmicrosoft.com/<client-id>/.default"
  datasource:
    url: >
      jdbc:oracle:thin:@example
        ?oracle.jdbc.provider.endUserSecurityContext=ojdbc-provider-spring-end-user-security-context
        &oracle.jdbc.provider.endUserSecurityContext.registrationId=azure
    username: db_user
    password: db_password
```

The provider assembles two tokens per operation:

- **Database Access Token** — authorizes the Spring app itself, requested
  from the OAuth 2.0 client registration named by `registrationId`.
- **End User Token** — identifies the human end user, read from Spring
  Security's `SecurityContextHolder` (typically the bearer token off the
  inbound HTTP request's `Authorization` header).

## Mapping Spring Authorities to Database Data Roles/Attributes

The provider can derive `DATA ROLE` names and `END USER CONTEXT` attributes
directly from the authenticated user's `GrantedAuthority` values:

| Parameter | Effect |
|-----------|--------|
| `oracle.jdbc.provider.endUserSecurityContext.registrationId` | **Required.** OAuth2 client registration used for the Database Access Token. |
| `oracle.jdbc.provider.endUserSecurityContext.dataRoles` | Fixed, comma-separated `DATA ROLE` names applied to every end user. |
| `oracle.jdbc.provider.endUserSecurityContext.endUserContextAttributes` | Fixed JSON object of `END USER CONTEXT` attributes applied to every end user. |
| `oracle.jdbc.provider.endUserSecurityContext.authorityRolePrefix` | Prefix identifying which `GrantedAuthority` strings are `DATA ROLE` names (e.g. prefix `ORACLE_DATA_ROLE_` + authority `ORACLE_DATA_ROLE_ADMIN` → role `ADMIN`). |
| `oracle.jdbc.provider.endUserSecurityContext.authorityAttributesPrefix` | Prefix identifying which `GrantedAuthority` strings carry a JSON object of `END USER CONTEXT` attributes. |

`END USER CONTEXT` attributes are namespaced by schema, e.g.:

```json
{
  "app_schema.user_details": { "first_name": "George", "last_name": "Washington" },
  "app_schema.location_info": { "City": "Mount Vernon", "State": "Virginia" }
}
```

## Best Practices

- Choose prefixes for `authorityRolePrefix`/`authorityAttributesPrefix` that
  cannot collide with any other authority string your application issues
  (e.g. Spring's own `ROLE_*` convention) — a collision silently grants or
  attaches the wrong context.
- Keep `dataRoles`/`endUserContextAttributes` (the fixed, all-users config)
  minimal; prefer deriving per-user roles/attributes from authorities so
  access reflects the authenticated identity, not a static default.
- Design `DATA GRANT` policies assuming every JDBC operation is now
  authorization-checked — test read, write, and LOB paths, not just simple
  SELECTs.

## Related Skills

- [Oracle JDBC Driver Extensions](../providers.md)
- [Spring Data JPA with Oracle](../../../frameworks/spring-data-jpa-oracle.md)
- [Row-Level Security](../../../security/row-level-security.md)
- [Privilege Management](../../../security/privilege-management.md)

## Sources

- [ojdbc-provider-spring README](https://github.com/oracle/ojdbc-extensions/blob/main/ojdbc-provider-spring/README.md)
- [ojdbc-provider-samples (Spring/Deep Data Security)](https://github.com/oracle/ojdbc-extensions/tree/main/ojdbc-provider-spring/samples)
- [Oracle Deep Data Security Guide 26ai](https://docs.oracle.com/en/database/oracle/oracle-database/26/ddscg/understand-oracle-deep-data-security.html)
- [Spring Security OAuth2 Client Registration](https://docs.spring.io/spring-security/reference/servlet/oauth2/client/core.html#oauth2Client-client-registration)
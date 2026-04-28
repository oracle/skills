# Oracle APEX (Application Express)

## Overview

**Oracle APEX** is Oracle's low-code web application platform built into the database. It is used to build browser-based applications, forms, reports, dashboards, and simple workflow tools on top of Oracle data.

This page is intentionally lightweight. It is meant to explain what APEX is and how it fits into an Oracle environment, not to be a full build, admin, or deployment guide.

At a high level:
- APEX apps are designed in a browser
- APEX runs against Oracle Database data and PL/SQL
- APEX requires Oracle REST Data Services (ORDS) as the web listener
- Applications are stored as metadata and can be exported as SQL

---

## When APEX Fits Well

APEX is a strong fit for:
- Internal business applications
- Data entry and approval workflows
- Reporting and dashboards
- Admin tools on top of Oracle schemas
- Fast delivery of database-centric web apps

APEX is usually less appropriate when the main requirement is:
- A heavily custom front-end framework-first experience
- Complex offline/mobile-native behavior
- A non-Oracle data platform as the system of record

---

## Core Concepts

| Term | Meaning |
|---|---|
| `Workspace` | Top-level APEX container for developers, applications, and associated schemas |
| `Application` | A packaged web app made of pages, shared components, and metadata |
| `Page` | A single screen in the application |
| `Region` | A section of a page, such as a report, chart, or form |
| `Item` | A page field or variable, such as `P1_CUSTOMER_ID` |
| `Session State` | Per-session values that APEX stores for page and application items |
| `Parsing Schema` | Database schema whose privileges are used for the app's SQL and PL/SQL |
| `Shared Components` | Reusable definitions such as navigation, LOVs, auth schemes, and templates |
| `ORDS` | The required web listener and REST layer used to serve APEX |

---

## Runtime Model

Current APEX deployments follow this path:

```text
Browser
  -> ORDS
  -> Oracle Database
     -> APEX engine
     -> Application schema objects
```

Important separation:
- APEX itself lives in Oracle-managed APEX schemas
- Your tables, views, packages, and business logic usually live in one or more application schemas
- The APEX application references those schema objects through its parsing schema

This is the main mental model to keep straight when reading or building APEX apps.

---

## What Developers Usually Build

An APEX application commonly includes:
- Report pages for querying data
- Form pages for insert/update/delete workflows
- Charts and summary dashboards
- Validations and computations
- PL/SQL processes tied to page submit events
- Authentication and authorization rules

Most of the application is assembled declaratively in App Builder, with SQL, PL/SQL, and some JavaScript added where needed.

---

## Minimal Example

APEX commonly binds page items directly into SQL using session state values:

```sql
SELECT order_id,
       order_date,
       total_amount
FROM   orders
WHERE  customer_id = :P10_CUSTOMER_ID
ORDER  BY order_date DESC;
```

In this example:
- `P10_CUSTOMER_ID` is a page item
- APEX resolves it from session state at runtime
- The query runs using the application's parsing schema

---

## How APEX Is Usually Managed

A lightweight operational model looks like this:
- Developers build pages in App Builder
- Database objects are maintained in normal schema scripts
- APEX applications are exported as SQL for version control
- ORDS exposes the application over HTTP/S

That split matters: schema code and APEX app metadata are related, but they are not the same artifact.

---

## Practical Guidance

- Use a dedicated application schema instead of `SYS` or `SYSTEM`
- Use bind variables and page items rather than building dynamic SQL from string concatenation
- Treat the APEX application export as a deployable artifact
- Enforce authorization on the server side, not only by hiding UI elements
- Keep custom PL/SQL and JavaScript focused; prefer declarative APEX features first

---

## Out of Scope Here

This page does not try to cover APEX in depth. It intentionally omits:
- APEX installation and upgrade procedures
- ORDS installation and pool tuning
- Deep authentication and SSO configuration
- REST module design in ORDS
- CI/CD pipelines for APEX exports
- Advanced page design, theming, or plugin development

Those topics belong in dedicated APEX-focused skills and documentation.

---

## Sources

- [Oracle APEX Documentation](https://docs.oracle.com/en/database/oracle/apex/)
- [Oracle APEX App Builder Documentation](https://docs.oracle.com/en/database/oracle/apex/24.2/htmdb/)
- [Oracle REST Data Services Documentation](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/)

# ORDS Pre-Authenticated Requests (PAR)

## Overview

Oracle REST Data Services (ORDS) pre-authenticated requests (PAR) let you generate and use pre-authenticated links to access protected ORDS RESTful services without user credentials. When you create a PAR, ORDS generates a unique URL that you can provide to another user or system so it can interact with a specific RESTful entity using standard HTTP tools.

ORDS exposes this feature through the `ORDS_PAR` PL/SQL package. Use it when you need a pre-authenticated URL for an existing protected handler in a REST-enabled schema.

---

## Prerequisites

- The target schema must already be **REST-enabled**.
- The PAR is valid only in the context of the **current REST-enabled schema**.
- The target handler must already exist in the current schema.
- The module name, pattern, and method passed to `ORDS_PAR.DEFINE_FOR_HANDLER` must match an existing handler.
- If they do not match an existing handler exactly, ORDS raises `ORA-20071: No matching ORDS handler`.

For the broader setup of schemas, handlers, and protection, see [ords-rest-api-design.md](./ords-rest-api-design.md) and [ords-authentication.md](./ords-authentication.md).

---

## Create a Matching Handler First (If Needed)

The sample values `demo`, `emp/`, and `GET` are not universal. Use them only if that handler already exists in the current REST-enabled schema, or create a matching handler first:

```sql
BEGIN
  ORDS.DEFINE_MODULE(
    p_module_name    => 'demo',
    p_base_path      => '/demo_prefix/',
    p_items_per_page => 25,
    p_status         => 'PUBLISHED',
    p_comments       => 'PAR demo module'
  );

  ORDS.DEFINE_TEMPLATE(
    p_module_name => 'demo',
    p_pattern     => 'emp/',
    p_comments    => 'PAR demo template'
  );

  ORDS.DEFINE_HANDLER(
    p_module_name    => 'demo',
    p_pattern        => 'emp/',
    p_method         => 'GET',
    p_source_type    => ORDS.source_type_collection_feed,
    p_items_per_page => 25,
    p_comments       => 'PAR demo handler',
    p_source         => q'[
      SELECT 'ok' AS status
      FROM   dual
    ]'
  );

  COMMIT;
END;
/
```

If you already have an existing handler, substitute its actual internal `p_module_name`, template `p_pattern`, and `p_method` values in the PAR example below.

---

## Create a Pre-Authenticated Request

Use `ORDS_PAR.DEFINE_FOR_HANDLER` to create a PAR for an existing ORDS handler.

Parameters documented by Oracle:

- `p_module_name`: name of the existing RESTful service module; this value is case sensitive
- `p_pattern`: matching pattern for an existing resource template
- `p_method`: existing handler HTTP method; valid values are `GET`, `POST`, `PUT`, or `DELETE`
- `p_duration`: validity duration in seconds

Example:

```sql
SET SERVEROUTPUT ON

DECLARE
  l_par_json CLOB;
  l_par_obj  JSON_OBJECT_T;
BEGIN
  l_par_json := ORDS_PAR.DEFINE_FOR_HANDLER(
    p_module_name => 'demo',
    p_pattern     => 'emp/',
    p_method      => 'GET',
    p_duration    => 360
  );

  COMMIT;

  l_par_obj := JSON_OBJECT_T.PARSE(l_par_json);

  DBMS_OUTPUT.PUT_LINE('token=' || l_par_obj.get_string('token'));
  DBMS_OUTPUT.PUT_LINE('alias=' || l_par_obj.get_string('alias'));
  DBMS_OUTPUT.PUT_LINE('uri='   || l_par_obj.get_string('uri'));
END;
/
```

Oracle documents that the function returns a JSON object containing:

- `token`
- `alias`
- `uri`

Keep track of the token and alias when you create the PAR because Oracle documents that you cannot obtain their values later.

---

## Use the Pre-Authenticated URL

Use the exact `uri` value returned during PAR creation. The returned `uri` is relative, so prepend your ORDS base URL and schema mapping.

Example:

If `DEFINE_FOR_HANDLER` returned:

```text
uri=/_/par/<par_token>/demo_prefix/emp/
```

then call:

```shell
curl -i -X GET \
  http://localhost:8080/ords/ordstest/_/par/<par_token>/demo_prefix/emp/
```

If the pre-authenticated request URL contains URI parameters identified by `:`, then you must replace them with concrete values before invoking the endpoint.

Do not substitute an unrelated sample path; the request URL must match the `uri` returned for the handler you actually registered.

---

## Revoke a PAR

Use `ORDS_PAR.REVOKE_PAR` with the token from the PAR URL.

```sql
BEGIN
  ORDS_PAR.REVOKE_PAR(
    p_par_token => '<par_token>'
  );
  COMMIT;
END;
/
```

Oracle documents that it may take up to **30 seconds** for the revoke request to take effect.

---

## Operational Notes

- A PAR is created for an **existing handler**; it does not define a new module, template, or handler.
- The returned `uri` is relative and is the URL you should use for later calls.
- If the handler pattern includes URI parameters, the returned PAR URI uses the generic pattern and you must substitute real values before making the request.
- If you drop or recreate the underlying handler or module, recreate any associated PARs as well. PARs are tied to existing handler metadata, and ORDS documents that redefining modules, templates, or handlers replaces the existing definitions.

---

## Best Practices

- Store the returned token and alias immediately after creation because Oracle documents that they cannot be retrieved later.
- Ensure the module, pattern, and method already exist in the current REST-enabled schema before calling `ORDS_PAR.DEFINE_FOR_HANDLER`.
- Use a `p_duration` value that matches the intended validity window, remembering that Oracle documents the value in seconds.
- Prefer short-lived PARs for ad hoc sharing, one-time access, or support workflows, and use longer durations only when the operational need is explicit.
- Treat the full PAR URL as a bearer secret: anyone who has it can call the protected handler until it expires or is revoked.
- Share PAR URLs only over trusted HTTPS channels and store them in a secret store or other controlled location.
- Avoid logging, pasting, or screenshotting full PAR URLs in tickets, chat, dashboards, or application logs; redact the token if you must record it.
- Substitute concrete values for any URI parameters in the returned PAR URL before invoking the endpoint.

---

## Common Mistakes

- Trying to create a PAR for a handler that does not exist in the current REST-enabled schema.
- Passing the wrong case for `p_module_name`.
- Assuming ORDS will substitute URI parameter values in the returned PAR URI automatically.
- Creating PARs with durations that are much longer than the real access window and then treating them as if they were short-lived.
- Treating the PAR URL as harmless metadata and exposing it in logs, tickets, or chat.
- Losing the returned token or alias and then trying to recover them later.
- Dropping or recreating a handler or module and assuming existing PARs will continue to be valid without regeneration.
- Expecting revocation to take effect immediately without allowing for the documented propagation delay.

---

## Oracle Version Notes (19c vs 26ai)

- This PAR workflow is documented in the ORDS **25.4** and **26.1** developer guides.
- The `ORDS_PAR.DEFINE_FOR_HANDLER` and `ORDS_PAR.REVOKE_PAR` interfaces cited here are also described in the ORDS **25.2** package reference.
- This file does not rely on any **26.1**-only PAR syntax.

## Sources

- [Developing Oracle REST Data Services Applications (25.4)](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/25.4/orddg/developing-REST-applications.html)
- [Developing Oracle REST Data Services Applications (26.1)](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/26.1/orddg/developing-REST-applications.html)
- [ORDS_PAR PL/SQL Package Reference](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/25.2/orddg/ords_par-pl-sql-package-reference.html)

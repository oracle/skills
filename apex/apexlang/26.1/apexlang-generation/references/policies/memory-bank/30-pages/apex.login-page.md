## Login Page Standards

### Purpose
- Guarantee login pages use the canonical layout, authentication wiring, and button behaviour.

### Rules (Non-Negotiable)
1. Use `pageTemplate: @/login` with `templateOptions: #DEFAULT#`.
2. Include username/password items using the hidden templates from the login page example (`page-examples/login-page/login-page._index.md`).
3. Buttons region must contain a single `LOGIN` button using `@/text` template, `hot: true`, and `behavior.action: definedByDynamicAction` (per the template).
4. Login page processes must only handle authentication primitives:
   - `APEX_AUTHENTICATION.LOGIN` via `type: invokeApi`
   - `SEND_LOGIN_USERNAME_COOKIE` when Remember Username is enabled.
   All other processes are to be created as application processes unless user explicitly mentions them to be as page processes.

5. Do not add navigation or breadcrumb entries; login pages remain isolated.
6. When creating a custom login page, update `application.apx` so `navigation.loginUrl` points to that login page.
   - Use the same page number as the generated login page, following the same `f?p=&APP_ID.:<page_number>:&APP_SESSION.::&DEBUG.:::` pattern used for `navigation.homeUrl`.
   - Do not leave `navigation.loginUrl` pointing to `LOGIN`, `9999`, or any previous page when the actual login page is different.
   - If the login page alias is renamed, `navigation.loginUrl` must still be updated to the active custom login page target rather than relying on an outdated alias.

### Guidance
- Mirror `templates/page-examples/login-page/login-page._index.md` for item definitions, session state configuration, and process order.
- When customizing text or layout chrome, use template options and static content regions rather than altering the authentication logic.
- Whenever a login page is added or moved off the default seed, verify `application.apx > navigation.loginUrl` is updated in the same change.

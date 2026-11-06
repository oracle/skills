---
templateId: authentications.social
componentType: authentications
version: 1.0
imports:
  - authentications.common
---

# Purpose

This template is an authentication scheme for Social Sign In - also known as OpenID

---

# Generation Rules (MANDATORY)

None

---

# Variable Contract

## Required Variables

- settings.credentialStore
    - This must reference a credential file stored in:
      applications/<application-scope>/workspace-components/credentials/
    - If the active scope is not explicit, discover it from the artifact path being generated and then resolve credentials in that scope.
    - unless specified, use the value of {{webCredential}} in the firse file
    - The output template will render it as `credentialStore: @<credential-name>`
    - If no credential exists, return `no-credentials`

- settings.discoveryUrl
    - URL that points to the discovery endpoint for social sign in
    - Should be a valid URL starting with https:// and enclosed in "

- settings.authUriParams
    - List of parameters

---

# Conditional Rendering Rules

- settings.additionalUserAttrs
    - CSV List of additional user attributes
    - If no value specificed, then use "groups"

- settings.mapAdditionalUserAttrsTo
    - CSV list of application items to map user attributes to

- If `settings.additionalUserAttrs` is not provided, omit the entire `settings.additionalUserAttrs {}` block.
- If `settings.mapAdditionalUserAttrsTo` is not provided, omit the entire `settings.mapAdditionalUserAttrsTo {}` block.

---

# Output Template
```
authentication {{name}} (
    name: {{displayName}}
     settings {
        type: socialSignIn
        credentialStore: @{{settings.credentialStore}}
        discoveryUrl: {{settings.discoveryUrl}}
        authUriParams: {{settings.authUriParams}}
        additionalUserAttrs: {{settings.additionalUserAttrs}}
        mapAdditionalUserAttrsTo: {{settings.mapAdditionalUserAttrsTo}}
   }
)
```
---

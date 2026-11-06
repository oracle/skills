---
contractId: authentications.common
componentType: authentications
version: 1.0
---

# Generation Rules (MANDATORY)

1. Output only valid apexlang DSL.
2. Do not output markdown.
3. Do not explain the output.
4. Omit optional blocks entirely if their variables are not provided.

# Required

- name
  type: string
  required: true
  description: lowercase, hyphenated name of authentication scheme

- displayName
  type: string
  required: true
  description: Readable, descriptive name of authentication scheme

# Ownership Boundary

- The application root chooses the current authentication scheme.
- This family owns the authentication-scheme definition itself: type, plugin
  attributes, remote-server settings, login processing, and other
  scheme-specific configuration.
- App-level security/session defaults such as deep linking, rejoin sessions,
  session-state protection, and app-wide authorization posture remain
  application-root concerns and should not be duplicated here as scheme
  attributes.

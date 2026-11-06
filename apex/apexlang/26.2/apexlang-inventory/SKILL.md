---
name: apexlang-inventory
description: Provides an overview of APEX application components, APEXlang syntax, and application file layout, with links to detailed component properties and examples. Use this catalog to select, compose, generate, and edit APEX applications with APEXlang.
---

# APEXLang Component Catalog

Use this hierarchy to locate APEXlang component references under assets/ and then read the matching component document before authoring.

APEX Version: 26.2.0

Reference context: subscribed central-theme app 8842.262; central-theme reference versions 8842.262.

# Introduction
This catalog is a routing index for APEX application components. Use the hierarchy to locate the detailed references under `assets/`. A referenced component document with a `filePath` bullet represents a component declared in its own APEX application file.

# Authoring Guide

Use this sequence when creating or editing an APEXlang application:

1. Start with the application layout and create `application.apx` with an `app` component.
2. Select a component from this catalog and open its linked document under `assets/`.
3. Use the document's `componentType` and `identifierRequired` bullets to write the component declaration. Use the documented `filePath` only when the component is the root of its own `.apx` file.
4. Add the documented properties using their group names. A `(direct group)` is flattened into the component; other groups use `{ ... }`. Complex properties use `property: { ... }`, arrays use `property: [ ... ]`, and nested components use `componentType identifier ( ... )`.
5. Follow the catalog hierarchy for containment. Select `plugin-variants/<plugin-name>` or `template-component/<name>` only after checking the parent or ancestor selector and its applicability condition.
6. Validate the completed application before deploying it.

Every property, array value, group member, and nested component member must be on its own physical line. Use APEXlang-visible enum values and component references, not internal metadata or display labels.

Use the component document as the source of truth for authoring:

- Use its `componentType` bullet as the APEXlang declaration keyword. The directory name, link text, and node path are routing labels and may differ from that value.
- Use `identifierRequired` to decide whether the declaration needs an identifier.
- Treat every property bullet as one property line. Use the documented property name, and use the documented APEXlang enum value rather than its descriptive label.
- Treat `filePath` as the location of the component in the application, not as a property to emit inside the component.
- Treat `appliesWhen` as a selection condition for the component, based on the required parent or ancestor values; it is not an APEXlang property to emit.
- In an `appliesWhen` condition, `component[group.property]` identifies a property on another component. For example, `menu[identification.type]` and `menu[behavior.type]` are different properties even though both are named `type`. Conditions joined by `and` must all be true; alternatives joined by `or` are separate valid choices.

For a plugin-specific component, inspect the relevant parent or ancestor component's type property and applicability conditions, then follow the matching `plugin-variants/<plugin-name>` node. For a template component, inspect the relevant parent or ancestor component and current-theme applicability, then follow `template-component/<name>`; its APEXlang plugin value is `themeTemplateComponent/<name>`. The `componentType` bullet in the referenced Markdown file is authoritative.

# Minimal Application Layout Template
The following directory tree defines a minimal structure of an APEX application specified in APEXLang. Based on the selected components the structure will be implictily extended through the definition of the filePaths of the individual components.

- `application.apx`: top-level APEX application manifest with high-level app settings such as app-level navigation (home-link, login-link, navigation-menu). This file declares the app componentType and is therefore the entrypoint of the application hierarchy.
- `.apex/apexlang.json`: APEXLang metadata for this export.
- `deployments/default.json`: deployment metadata, including app id and debug flag.
- `pages/*.apx`: flat pages directory with one APEX page per file, named by the following convention 'p<0-paded-5-digit-page-number>-<normalized-page-name>.apx' unless you are constrained by filePath specification of the respective componentType. Do not create subdirectories for pages. Each file declares a page componentType.
- `shared-components/`: Shared components can display or be applied on any page within the application. Examples are lists, LOVs, breadcrumbs, app items, computations, authentications, authorizations, automations, task definitions, plugins, theme files, and static assets.
- `shared-components/authentications.apx`: defines how users authenticate to the application.
- `shared-components/lists.apx`: defines reusable data sources for other component types such as regions.
- `shared-components/static-files/`:
- `shared-components/static-files/icons`: aplications icons
- `shared-components/themes/`: Contains themes. One directory per theme. At least one theme required.
- `shared-components/themes/<theme-name>/theme.apx` Theme settings


# Other Rules
- if using supportingObject, make sure that the necessary scripts are executed automatically when deploying the application: advanced.includeInAppExport = autoInstall

## APEXlang Syntax

````ebnf
source ::= application-program | complex-type-program ;

any-code-point ::= U+0000..U+10FFFF ;

horizontal-character ::= " " | U+0009 ;

line-feed ::= U+000A ;

horizontal-space ::= horizontal-character { horizontal-character } ;

non-line-feed ::= any-code-point - line-feed ;

block-comment ::= "/*" { any-code-point } "*/" ;

line-comment ::= "//" { non-line-feed } ;

gap ::= { horizontal-character | block-comment | line-comment } ;

hex-digit ::= "0".."9" | "a".."f" | "A".."F" ;

unicode-escape ::= "u" hex-digit hex-digit hex-digit hex-digit ;

simple-escape-character ::= "\"" | "\\" | "/" | "b" | "f" | "n" | "r" | "t" ;

escape ::= "\\" ( simple-escape-character | unicode-escape ) ;

safe-code-point ::= any-code-point - "\\" - U+0000..U+0008 - U+000A..U+001F ;

quoted-identifier ::= "\"" { escape | safe-code-point } "\"" ;

unquoted-identifier-character ::= any-code-point - line-feed - "{" - "}" - " " - "\"" ;

unquoted-identifier ::= unquoted-identifier-character { unquoted-identifier-character } ;

identifier ::= unquoted-identifier | quoted-identifier ;

key-initial-character ::= "A".."Z" | "a".."z" | "0".."9" | "_" ;

key-continuation-character ::= key-initial-character | "." | "-" | "(" | ")" | "$" ;

key ::= key-initial-character { key-continuation-character } ;

quoted-subcontent-line ::= "\"" { escape | safe-code-point } "\"" ;

unquoted-subcontent-line-character ::= non-line-feed ;

unquoted-subcontent-line ::= unquoted-subcontent-line-character { unquoted-subcontent-line-character } ;

subcontent-line ::= quoted-subcontent-line | unquoted-subcontent-line ;

array-quoted-prefix ::= "\"" { non-line-feed } ;

array-unquoted-content-character ::= any-code-point - line-feed - "]" ;

array-unquoted-content ::= array-unquoted-content-character { array-unquoted-content-character } ;

subcontent-array ::= array-quoted-prefix | array-unquoted-content ;

ml-escape ::= "\\```" ;

multiline-string ::= "```" { ml-escape | any-code-point } "```" ;

newline ::= gap line-feed ;

array-body ::=
    identifier ":"
    horizontal-character { horizontal-character }
    "["
    { horizontal-character }
    {
        line-feed
        { horizontal-character }
        [ subcontent-array ]
    }
    line-feed
    { horizontal-character }
    "]"
    { horizontal-character }
    ;

array ::= gap array-body ;

application-program ::= gap { application-padded-component } gap ;

application-padded-component ::=
    { newline }
    application-component
    { newline }
    ;

application-component ::=
    component-declaration
    { newline }
    application-component-body
    close-component
    ;

component-declaration ::=
    gap
    key
    horizontal-character { horizontal-character }
    [ identifier horizontal-character { horizontal-character } ]
    "("
    ;

application-component-body ::=
    {
        application-component-body-group
      | application-padded-component
      | application-param-line { newline }
    }
    ;

application-component-body-group ::=
    { newline }
    group-identification
    { application-param-line }
    { newline }
    close-group
    { newline }
    ;

group-identification ::=
    gap
    key
    horizontal-character { horizontal-character }
    "{"
    ;

application-param-line ::=
    newline { newline } application-line-unknown
  | newline { newline } array
    ;

close-group ::= gap "}" ;

close-component ::= gap ")" ;

application-line-unknown ::= gap application-line-unknown-body ;

application-line-unknown-body ::=
    identifier ":" { horizontal-character } application-complex-type-body
  | identifier ":" { horizontal-character | line-feed } multiline-string
  | identifier ":" { horizontal-character } [ subcontent-line ]
    ;

application-complex-type-body ::= 
    "{"
    { application-sub-complex-type }
    line-feed { line-feed }
    { line-feed | horizontal-space }
    "}"
    ;

application-sub-complex-type ::=
    line-feed { line-feed }
    { line-feed | horizontal-space }
    application-line-unknown-body
  | line-feed { line-feed }
    { line-feed | horizontal-space }
    array-body
    ;

complex-type-program ::= gap { complex-padded-component } gap ;

complex-padded-component ::=
    { newline }
    complex-param-line
    { newline }
    ;

complex-param-line ::=
    newline { newline } complex-line-complex
  | newline { newline } complex-line-single
  | newline { newline } complex-line-ml
  | newline { newline } array
  | newline { newline }
    ;

complex-line-complex ::= gap complex-line-complex-body ;

complex-line-complex-body ::= identifier ":" { horizontal-character } complex-type-body ;

complex-line-single ::= gap complex-line-single-body ;

complex-line-single-body ::= identifier ":" { horizontal-character } [ subcontent-line ] ;

complex-line-ml ::= gap complex-line-ml-body ;

complex-line-ml-body ::= identifier ":" { horizontal-character | line-feed } multiline-string ;

complex-type-body ::=
    "{"
    { complex-type-subcontent }
    line-feed { line-feed }
    { line-feed | horizontal-space }
    "}"
    ;

complex-type-subcontent ::=
    { horizontal-character }
    line-feed { line-feed }
    { line-feed | horizontal-space }
    identifier ":"
    { horizontal-character }
    [ subcontent-line ]
    ;
````
## Syntax Mapping Rules

Use these rules when converting a component reference into APEXlang:

- A property bullet maps to one property line in the form `name: value`.
- A Markdown group marked `(direct group)` is not emitted as a block. Emit its properties directly, for example `name: Orders`.
- Any other Markdown group is a property group. Its name has no colon, for example `layout {` followed by its properties.
- A property documented as `<COMPLEX>` is an object-valued property. Its name has a colon before the opening brace, for example `target: {` followed by its properties.
- An array-valued property also has a colon, for example `templateOptions: [` followed by one value per line.
- A nested component is another declaration, such as `region CONTENT (`; it is not a property group or an object.
- Opening braces and brackets may share the line with their property or group name, but their contents must start on the next line.
- Every property, array value, and nested member must be on its own physical line. Closing braces, brackets, and component parentheses must be on their own line.
- A scalar property contains exactly one scalar value on one physical line.

## Invalid Examples

The following forms must not be generated:

### Inline property group

Invalid:

```apexlang
layout { sequence: 10 slot: body }
```

Valid:

```apexlang
layout {
    sequence: 10
    slot: body
}
```

### Property group written as an object

Invalid:

```apexlang
layout: {
    sequence: 10
}
```

Valid:

```apexlang
layout {
    sequence: 10
}
```

### Complex property written as a group

Invalid:

```apexlang
target {
    page: 15
}
```

Valid:

```apexlang
target: {
    page: 15
}
```

### Inline complex object

Invalid:

```apexlang
target: { page: 15 action: resetPagination }
```

Valid:

```apexlang
target: {
    page: 15
    action: resetPagination
}
```

### Inline array

Invalid:

```apexlang
templateOptions: [#DEFAULT# t-Button--hot]
```

Valid:

```apexlang
templateOptions: [
    #DEFAULT#
    t-Button--hot
]
```

### Nested component mistaken for a group

Invalid:

```apexlang
region {
    name: Orders
}
```

Valid:

```apexlang
region ORDERS (
    name: Orders
)
```

## Components

- [webCredential](assets/web-credential/web-credential.md) — Use Web Credentials to connect to REST Enabled SQL or other external REST services. Credentials are stored at the workspace level and therefore are visible in all applications.
- [restEnabledSqlDatabase](assets/rest-enabled-sql-database/rest-enabled-sql-database.md) — Create a REST Enabled SQL service to execute SQL or PL/SQL defined in Oracle APEX components on a remote Oracle database. Requirement: The remote database must include Oracle REST Data Services (ORDS) release 20.3 or later on the front-end and have the REST Enabled SQL feature enabled.
- [authenticationServer](assets/authentication-server/authentication-server.md) — A REST Data Source server information (for example, REST APIs) as a Remote Server object. This is a Remote Server type used for authentication
- [printServer](assets/print-server/print-server.md) — A Remote Server for an external print server. You can create a Print Server in your workspace and use it in an application. By default, the print server configuration at instance level is used.
- [restDataSourceServer](assets/rest-data-source-server/rest-data-source-server.md) — A Remote Server for consuming a remote REST API.
- [file](assets/file/file.md) — Reference a static workspace file in your application using #WORKSPACE_FILES# substitution string.
- [appGroup](assets/app-group/app-group.md) — Application groups enable you to organize your applications. Used for organizing applications by assigning them to application groups
- [fileServer](assets/file-server/file-server.md) — A Remote Server for remote file storage
- [genAIService](assets/gen-aiservice/gen-aiservice.md) — Generative AI Services offer an abstraction to popular commercial Generative AI products like OpenAI, Cohere and others. The APEX_AI public API refers Generative AI Services configured here.
- [vectorProvider](assets/vector-provider/vector-provider.md) — Vector providers are configured to convert text into an embedding. The functionality can be covered by an AI service, but also locally by an ONNX model in the database or a user-defined PL/SQL function. The APEX_AI public API contains a function for using a Vector Provider to get the embedding for a text.
- [app](assets/app/app.md) — The root APEXlang application component. It contains the application metadata and is the parent of the application-level and page-level components in this catalog, such as pages, themes, plugins, authentication and authorization schemes, lists, LOVs, REST data sources, workflows, and AI agents.
  - [aiAgent](assets/app/ai-agent/ai-agent.md) — An AI Agent is a shared component that centralizes key Generative AI settings, including the System Prompt, Welcome Message, and AI Tools. Creating an AI Agent enables the reusability of these settings across multiple AI-enabled components such as Show AI Assistant and Generate Text With AI dynamic actions. These Agents can define one or more Tools that can be used by the AI service to retrieve relevant information on demand in order to improve response quality, and perform tasks.
    - [tool](assets/app/ai-agent/tool/tool.md) — Generative AI Tools offer a way to provide extra knowledge, and expose extra capabilities to an AI Service responding to a prompt. Augment System Prompt tools are called for each new message, and their results are included as hidden system messages. On Demand tools are made available to the AI Service to invoke only when needed.
      - [parameter](assets/app/ai-agent/tool/parameter/parameter.md) — Define a parameter the AI Service should provide when calling the tool.
  - [appComputation](assets/app/app-computation/app-computation.md) — Application Computations are units of logic that set the value of a single page item or application-level item and are run at the same point across multiple pages in an application. Similar to page-level computations, application computations can be based on static values, item values, PL/SQL, or SQL. A common use of an application item is to store the value of the last page viewed in the application. By storing the value in an item, you can add a back button and then redirect the user to the page number captured by the computation. This type of computation works well, for example, when you need to enable users to back out of an error page.
  - [appItem](assets/app/app-item/app-item.md) — Application items do not display, but are used to maintain session state. Application items can be set using computations, processes, or by passing values on a URL. Use application items to maintain session state that is not displayed and is not specific to any one page. When Application Item is subscribed, then it is not possible to change any data.
  - [appProcess](assets/app/app-process/app-process.md) — Create an application process to run a block of PL/SQL logic at a specific point from multiple pages of an application. By default, application processes execute at the same point for every page in the application. However, you can apply conditions for specific pages to control when the process executes.
    - [plugin-variants/executeCode](assets/app/app-process/plugin-variants/execute-code/execute-code.md) — Process to execute PL/SQL code.
  - [appSetting](assets/app/app-setting/app-setting.md) — Create Application Settings to define application-level configuration options.
  - [authentication](assets/app/authentication/authentication.md) — Defines the authentication schemes. Only one scheme can be made current.
    - [plugin-variants/custom](assets/app/authentication/plugin-variants/custom/custom.md) — An authentication scheme that allows you to define your own PL/SQL Functions for determining user authentication.
    - [plugin-variants/databaseAccounts](assets/app/authentication/plugin-variants/database-accounts/database-accounts.md) — This authentication scheme requires that a database user (schema) exists in the local database. When using this method, the user name and password of the database account is used to authenticate the user.
    - [plugin-variants/httpHeaderVariable](assets/app/authentication/plugin-variants/http-header-variable/http-header-variable.md) — Authenticate externally, where the username is stored in a HTTP Header variable set by the web server.
    - [plugin-variants/internalAppExtension](assets/app/authentication/plugin-variants/internal-app-extension/internal-app-extension.md) — Use this scheme for extensions to internal applications.
    - [plugin-variants/ldapDirectory](assets/app/authentication/plugin-variants/ldap-directory/ldap-directory.md) — Authentication of user/password with an authentication request to an LDAP server.
    - [plugin-variants/noAuth](assets/app/authentication/plugin-variants/no-auth/no-auth.md) — Adopts the current database user. This can be used in combination with a mod_plsql DAD configuration that uses basic authentication to set the database session user.
    - [plugin-variants/openDoorCredentials](assets/app/authentication/plugin-variants/open-door-credentials/open-door-credentials.md) — Enables anyone to access your application. Enter any identifier that will identify you as the user of the application during this session. This will set the value of the APP_USER variable. Use only when intentionally allowing unrestricted access.
    - [plugin-variants/oracleApexAccounts](assets/app/authentication/plugin-variants/oracle-apex-accounts/oracle-apex-accounts.md) — Enter your username and password for your &PRODUCT_NAME. account. Each workspace has its own user account repository. The application you are logging into belongs to workspace &amp;F4155_WORKSPACE_NAME.. Remember, passwords are case sensitive.
    - [plugin-variants/oracleAppServerSSO](assets/app/authentication/plugin-variants/oracle-app-server-sso/oracle-app-server-sso.md) — Delegates authentication to the Oracle AS Single Sign-On (SSO) Server. To use this authentication scheme, your site must have been registered as a partner application with the SSO server.
    - [plugin-variants/samlSignIn](assets/app/authentication/plugin-variants/saml-sign-in/saml-sign-in.md) — Delegates authentication to the Security Assertion Markup Language (SAML) Sign In authentication scheme.
    - [plugin-variants/socialSignIn](assets/app/authentication/plugin-variants/social-sign-in/social-sign-in.md) — Supports authentication with Google, Facebook, generic OpenID Connect, and generic OAuth2 Identity Providers.
  - [authorization](assets/app/authorization/authorization.md) — Authorization Schemes are pass/fail checks. Common Authorization Scheme types include Exists, Not Exists SQL Queries, and PL/SQL Function Returning Boolean. To enhance performance, the success or failure of an Authorization Scheme is cached on a per session or per page view basis.
    - [plugin-variants/existsSqlQuery](assets/app/authorization/plugin-variants/exists-sql-query/exists-sql-query.md) — A query that causes the authorization scheme to pass if it returns at least one row and causes the scheme to fail if it returns no rows.
    - [plugin-variants/isInRoleOrGroup](assets/app/authorization/plugin-variants/is-in-role-or-group/is-in-role-or-group.md) — Checks the provided comma-separated roles/groups names included in the user's roles/groups.
    - [plugin-variants/isNotInRoleOrGroup](assets/app/authorization/plugin-variants/is-not-in-role-or-group/is-not-in-role-or-group.md) — Checks the provided comma-separated roles/groups names not included in the user's roles/groups.
    - [plugin-variants/itemEqualsValue](assets/app/authorization/plugin-variants/item-equals-value/item-equals-value.md) — Value of item equals value.
    - [plugin-variants/itemIsNotNull](assets/app/authorization/plugin-variants/item-is-not-null/item-is-not-null.md) — Value of item is not null.
    - [plugin-variants/itemIsNull](assets/app/authorization/plugin-variants/item-is-null/item-is-null.md) — Value of item is null.
    - [plugin-variants/itemNotEqualsValue](assets/app/authorization/plugin-variants/item-not-equals-value/item-not-equals-value.md) — Value of item does not equal value.
    - [plugin-variants/notExistsSqlQuery](assets/app/authorization/plugin-variants/not-exists-sql-query/not-exists-sql-query.md) — A query that causes the authorization scheme to pass if it returns no rows and causes the scheme to fail if it returns one or more rows.
    - [plugin-variants/plSqlFunctionBody](assets/app/authorization/plugin-variants/pl-sql-function-body/pl-sql-function-body.md) — A PL/SQL function body that returns true or false. A false value causes the authorization scheme to fail. A true value causes it to pass.
    - [plugin-variants/preferenceEqualsValue](assets/app/authorization/plugin-variants/preference-equals-value/preference-equals-value.md) — Value of preference equals value.
    - [plugin-variants/preferenceNotEqualsValue](assets/app/authorization/plugin-variants/preference-not-equals-value/preference-not-equals-value.md) — Value of preference does not equal value.
  - [automation](assets/app/automation/automation.md) — Automations initiate a sequential set of actions based on a schedule. They are used to monitor data and then perform the appropriate action. Common automation use cases include approving specific requests and sending email alerts. An automation executes as a query or a PL/SQL function based on a defined schedule.
    - [action](assets/app/automation/action/action.md) — Automation Actions fire once for each row returned by the automation source. An action can reference the values of each column for each row using bind variable syntax.
    - [parameter](assets/app/automation/parameter/parameter.md) — ??
  - [theme](assets/app/theme/theme.md) — This contains the look and feel definition of the application. A named collection of templates used to define the user interface.
    - [style](assets/app/theme/style/style.md) — A theme style is a CSS style sheet that is added to the base CSS to alter the look and feel of an application. Use theme styles to customize themes, to switch to a different color scheme, apply a flat look, or make a theme responsive. A theme can have multiple theme styles with one style set as active.
    - [breadcrumbTemplate](assets/app/theme/breadcrumb-template/breadcrumb-template.md) — Breadcrumb templates control the display of breadcrumb entries.
      - [templateOption](assets/app/theme/breadcrumb-template/template-option/template-option.md) — defines an available option on a template
    - [buttonTemplate](assets/app/theme/button-template/button-template.md) — Customize the look and feel of a button using button templates. Button templates are optional.
      - [templateOption](assets/app/theme/button-template/template-option/template-option.md) — defines an available option on a template
    - [classicReportTemplate](assets/app/theme/classic-report-template/classic-report-template.md) — Report column templates provide you with control over the results of a row from a SQL query. This type of template defines a cell, not an entire row.
      - [templateOption](assets/app/theme/classic-report-template/template-option/template-option.md) — Defines an option for a Classic Report template. Template options expose configurable presentation choices that can be selected when the template is used.
    - [fieldTemplate](assets/app/theme/field-template/field-template.md) — Centrally manage HTML markup of page item labels using label templates. Every item can have an optional label. You can control how these labels display using label templates. For example, you could create a label template called Required Field that references an image (such as an asterisk) to indicate to the user that the field is required.
      - [templateOption](assets/app/theme/field-template/template-option/template-option.md) — defines an available option on a template
    - [file](assets/app/theme/file/file.md) — static assets owned by the theme.
    - [globalTemplateOption](assets/app/theme/global-template-option/global-template-option.md) — Global template options are defined at the theme-level and are available for all components of a given type.
    - [listTemplate](assets/app/theme/list-template/list-template.md) — Control the appearance of a list.
      - [templateOption](assets/app/theme/list-template/template-option/template-option.md) — Defines an option for a List template. Template options expose configurable presentation choices that can be selected when the template is used.
    - [pageTemplate](assets/app/theme/page-template/page-template.md) — Page Templates define the appearance and layout of a page.
      - [slot](assets/app/theme/page-template/slot/slot.md) — The template's named slots arrange the areas of the page that can contain content or components.
      - [templateOption](assets/app/theme/page-template/template-option/template-option.md) — defines an available option on a template
    - [popupLovTemplate](assets/app/theme/popup-lov-template/popup-lov-template.md) — Popup LOV templates control how popup lists display for all items defined as POPUP. You can only specify one popup LOV template for each theme.
    - [regionTemplate](assets/app/theme/region-template/region-template.md) — Region templates control the appearance and placement of region attributes.
      - [slot](assets/app/theme/region-template/slot/slot.md) — The template's named slots arrange the areas of the page that can contain content or components.
      - [templateOption](assets/app/theme/region-template/template-option/template-option.md) — defines an available option on a template
    - [templateOptionGroup](assets/app/theme/template-option-group/template-option-group.md) — Define the purpose of related template options by creating template option groups. Only one template option in an option group can be applied to a UI component of a given type.
  - [breadcrumb](assets/app/breadcrumb/breadcrumb.md) — Use breadcrumbs to create a hierarchical list of links that indicates where the user is within the application from a hierarchical perspective. A breadcrumb provides navigational context to end users and offer an easy navigation path back to the app home page. Users can click a specific breadcrumb link to instantly view the target page.
    - [entry](assets/app/breadcrumb/entry/entry.md) — Once a breadcrumb is created, breadcrumb entries can be defined which are associated with pages and also identify a parent page.
  - [buildOption](assets/app/build-option/build-option.md) — Build options enable developers to enable or disable application components and functionality when the application installs or at runtime. You can apply build options to most application components (such as pages, regions, items, validations, and so on) and specify whether to include or exclude them in the runtime application.
  - [classicNavigationBarEntry](assets/app/classic-navigation-bar-entry/classic-navigation-bar-entry.md) — For applications using older themes, navigation bar entries offer an easy way to move users between application pages. The associated page template determines the location of a navigation bar. A navigation bar entry can be an image, text, or an image with text beneath it. You must supply the images and text to use in the navigation bar entries.
  - [componentGroup](assets/app/component-group/component-group.md) — A Component Group is a collection of other shared components. Use component groups to bulk copy, subscribe, and refresh the components in the group. They also enable bulk refresh of the shared components.
    - [component](assets/app/component-group/component/component.md) — Shared component assigned to a component group.
  - [componentSetting](assets/app/component-setting/component-setting.md) — Use Component Settings to set application level values for built-in Oracle APEX components and installed plug-ins.
  - [concatenatedFile](assets/app/concatenated-file/concatenated-file.md) — Using a concatenated file can increase the performance of loading your page because instead of issuing multiple HTTP requests for each single file, the browser only loads one file. This approach gives you the option to use smaller, more modular files during development and to use a single concatenated file when running the application outside of the APEX development environment.
  - [dataLoadDefinition](assets/app/data-load-definition/data-load-definition.md) — A Data Load Definition allows developers to add Data Loading functionality to an Oracle APEX application. A Data Load Definition consists of information about where to store uploaded data, as well as details about the loading method, for instance whether to append data or whether to replace existing data.
    - [dataProfileColumn](assets/app/data-load-definition/data-profile-column/data-profile-column.md) — Defines a column in a data profile for a data-load definition. It maps an input attribute or expression to a typed column and can specify conversion, formatting, and validation details.
  - [developerComment](assets/app/developer-comment/developer-comment.md) — Add comments to an application, a page, or a group of pages using the Developer Comment, Bug, or To Do button. You can use developer comments to communicate application changes, report issues, or record developer suggestions.
  - [dynamicTranslation](assets/app/dynamic-translation/dynamic-translation.md) — You create a dynamic translation to translate dynamic pieces of data. For example, you might use a dynamic translation on a list of values based on a database query. Dynamic translations differ from messages in that you query a specific string rather than a message name. You then use the APEX_LANG.LANG API to return the dynamic translation string identified by the p_primary_text_string parameter.
  - [emailTemplate](assets/app/email-template/email-template.md) — Define email templates for your application.
  - [file](assets/app/file/file.md) — Static application files are only available to the current application and are used by referencing #APP_FILES# substitution string. Static application files can be stored locally in the database (default), or can be stored in Oracle Cloud Object Storage.
  - [jsonDualityView](assets/app/json-duality-view/json-duality-view.md) — JSON Duality Views in Oracle APEX consist of information about the owner and name of the Duality View object in the Oracle Database. After creation, the Duality View will be available to page components like reports, charts, forms or others, as well as to shared components like Lists Of Values, Automations or others.
    - [dataProfileColumn](assets/app/json-duality-view/data-profile-column/data-profile-column.md) — Entry in the data profile to map a JSON attribute to a typed column.
  - [jsonSource](assets/app/json-source/json-source.md) — JSON Sources in Oracle APEX consist of information about the owner and name of a database table, which can be a JSON Collection Table or a plain table with columns containing JSON data. JSON Collection Tables are available in Oracle Database 26ai or higher. After creation, the JSON Source will be available to page components like reports, charts, forms or others, as well as to shared components like Lists Of Values, Automations or others.
    - [dataProfileColumn](assets/app/json-source/data-profile-column/data-profile-column.md) — Entry in the data profile to map a JSON attribute to a column.
  - [languageMapping](assets/app/language-mapping/language-mapping.md) — Applications can be translated from a primary language into other languages, each translation requires a mapping which identifies the target language.
  - [legacyDataLoadDefinition](assets/app/legacy-data-load-definition/legacy-data-load-definition.md) — This definition specifies the data upload table name with its unique key columns.
    - [tableLookup](assets/app/legacy-data-load-definition/table-lookup/table-lookup.md) — If data existing in the import file must be mapped to data in another table, specify a table lookup to perform the mapping. For example, if the import file contains a department name for the DEPTNO column but the upload table requires a number for that column, use a table lookup rule to find the corresponding department number for that department name in another table.
    - [transformationRule](assets/app/legacy-data-load-definition/transformation-rule/transformation-rule.md) — For formatting transformations such as changing import data to uppercase, lowercase, and so on, you must define data transformation rules. For example, if the import file includes column data with both upper and lowercase and the upload table requires all uppercase, you can define a data transformation rule to insert only uppercase into the target column.
  - [list](assets/app/list/list.md) — A List is a template-driven, shared collection of links used for adding navigation in the application defined as static or dynamic lists. The list definition displays a specific type of page item, such as progress bars, sidebar, bullet navigation list, or navigation menu. You can control how a list displays through templates.
    - [entry](assets/app/list/entry/entry.md) — Define the list entry. Each entry is typically a label and a target link to page in this application or a URL.
  - [lov](assets/app/lov/lov.md) — An application-level list of values, defined once and referenced by any page item or report column that needs it. The source can be static entries, a local table or query, or a REST source, with column mapping choosing the display and return columns.
    - [column](assets/app/lov/column/column.md) — For a dynamic LOV, it defines the metadata for the column returned by the LOV source, its name, heading, type, display order, and visibility/searchability.
    - [entry](assets/app/lov/entry/entry.md) — For a static LOV, the LOV entry row containing a display value, return value, display sequence, optional condition, and related metadata.
    - [parameter](assets/app/lov/parameter/parameter.md) — an LOV parameter is a Web Source parameter configured on a shared LOV. It supplies a value to the LOV's Web Source query when the LOV is fetched.
  - [mapBackground](assets/app/map-background/map-background.md) — Custom map backgrounds define tile layers for map regions, Display Map items, and Geocoded Address items. Instead of the default map or APEX's built-in layers, it supports the following types: Vector Tile Layer, Raster XYZ Tile Layer or OGC WMS.
  - [page](assets/app/page/page.md) — The main building block of an APEX application users interact with. A navigable screen with its own layout and processing lifecycle.
    - [branch](assets/app/page/branch/branch.md) — A branch is an instruction to go to a specific page, procedure, or URL. For example, you can branch from page 1 to page 2 after page 1 is submitted. When you create a branch, you specify a Branch Point and Branch Type.
    - [button](assets/app/page/button/button.md) — A named control the user clicks to submit the page, navigate, or trigger an action. When the page submits, the REQUEST value is set to the button name, which is how processes, validations, and branches know which button fired.
      - [menu](assets/app/page/button/menu/menu.md) — A menu button's entry collection. Each entry provides a label and an action or navigation target displayed when the user opens the button.
        - [triggerAction](assets/app/page/button/menu/trigger-action/trigger-action.md) — Defines the Dynamic Action executed by a menu entry when the user selects it.
      - [triggerAction](assets/app/page/button/trigger-action/trigger-action.md) — Defines one or more actions performed when the button is triggered. The selected action determines whether the page is modified, server-side code runs, or the page is submitted.
    - [computation](assets/app/page/computation/computation.md) — A page computation assigns a value to an identified item when a page is displayed or submitted (rendered and processed).
    - [dynamicAction](assets/app/page/dynamic-action/dynamic-action.md) — Dynamic actions enable you to declaratively define how components respond to various user interactions (such as button clicks, items changing, and so on) without any complex coding or JavaScript knowledge. When you create a dynamic action, you specify an action that will be performed when a defined set of conditions occur. You can also specify which elements are affected by the action and how and when they are affected. A dynamic action consists of two parts: a triggering event and one or more actions. The Trigger defines the condition upon which the Action take place.
      - [action](assets/app/page/dynamic-action/action/action.md) — The Action enables you to dynamically perform supported client-side or server-side behavior you would normally achieve using a combination of JavaScript and CSS such as showing or hiding page components, setting values, executing PL/SQL code and so on.
      - [plugin-variants/addClass](assets/app/page/dynamic-action/plugin-variants/add-class/add-class.md) — Adds one or more CSS classes to the affected elements.
      - [plugin-variants/alert](assets/app/page/dynamic-action/plugin-variants/alert/alert.md) — Displays an alert message, with a single <em>Ok</em> button. Use to display information that must be responded to, by pressing the button, but continues executing the event.
      - [plugin-variants/cancelDialog](assets/app/page/dynamic-action/plugin-variants/cancel-dialog/cancel-dialog.md) — Cancels the current dialog page.
      - [plugin-variants/cancelEvent](assets/app/page/dynamic-action/plugin-variants/cancel-event/cancel-event.md) — Cancels the current event.
      - [plugin-variants/clear](assets/app/page/dynamic-action/plugin-variants/clear/clear.md) — Clears the affected elements.
      - [plugin-variants/clearErrors](assets/app/page/dynamic-action/plugin-variants/clear-errors/clear-errors.md) — Clear errors displayed on the page.
      - [plugin-variants/closeDialog](assets/app/page/dynamic-action/plugin-variants/close-dialog/close-dialog.md) — Closes the current dialog page.
      - [plugin-variants/closeRegion](assets/app/page/dynamic-action/plugin-variants/close-region/close-region.md) — Closes a region, such as inline dialog, inline popup, or collapsible, that supports being opened and is opened.
      - [plugin-variants/collapseTree](assets/app/page/dynamic-action/plugin-variants/collapse-tree/collapse-tree.md) — Collapse the current node in a tree region.
      - [plugin-variants/confirm](assets/app/page/dynamic-action/plugin-variants/confirm/confirm.md) — Displays a confirmation dialog, with Cancel and Confirm buttons. If the user chooses Cancel then the proceeding actions are not executed and the current event is canceled.
      - [plugin-variants/disable](assets/app/page/dynamic-action/plugin-variants/disable/disable.md) — Disables the affected elements. Disabling makes these elements non-editable so that they do not retain item values when the page is submitted.
      - [plugin-variants/download](assets/app/page/dynamic-action/plugin-variants/download/download.md) — Downloads one or multiple files.
      - [plugin-variants/enable](assets/app/page/dynamic-action/plugin-variants/enable/enable.md) — Enables the affected elements.
      - [plugin-variants/executeJsCode](assets/app/page/dynamic-action/plugin-variants/execute-js-code/execute-js-code.md) — Enables you to define or call custom, page specific JavaScript code to use within the dynamic action framework. If you are defining JavaScript code that is specific to just one page, you can use the page-level attribute Function and Global Variable Declaration to define this. Functions and variables defined there can then be referenced from this action.
      - [plugin-variants/executeServerSideCode](assets/app/page/dynamic-action/plugin-variants/execute-server-side-code/execute-server-side-code.md) — Executes code on the server.
      - [plugin-variants/expandTree](assets/app/page/dynamic-action/plugin-variants/expand-tree/expand-tree.md) — Expand the current node in a tree region.
      - [plugin-variants/generateTextWithAi](assets/app/page/dynamic-action/plugin-variants/generate-text-with-ai/generate-text-with-ai.md) — Invokes the configured Generative AI Service to generate a one-time response based on user content. This action is ideal for tasks like summarizing or translating text, extracting keywords, or drafting an email.
      - [plugin-variants/getCurrentPosition](assets/app/page/dynamic-action/plugin-variants/get-current-position/get-current-position.md) — Triggers the device to return its current position. The device will request permission the first time it is used.
      - [plugin-variants/hide](assets/app/page/dynamic-action/plugin-variants/hide/hide.md) — Hides the affected elements.
      - [plugin-variants/invokeInteractiveReportDialog](assets/app/page/dynamic-action/plugin-variants/invoke-interactive-report-dialog/invoke-interactive-report-dialog.md) — Invoke Interactive Report Dialog triggers a tailored dialog based on the selected action, allowing users to customize reports by choosing columns, applying filters, highlighting data, and more.
      - [plugin-variants/openRegion](assets/app/page/dynamic-action/plugin-variants/open-region/open-region.md) — Opens a region, such as inline dialog, inline popup, or collapsible, that supports being opened.
      - [plugin-variants/printReport](assets/app/page/dynamic-action/plugin-variants/print-report/print-report.md) — Prints a Report Query.
      - [plugin-variants/refresh](assets/app/page/dynamic-action/plugin-variants/refresh/refresh.md) — Refresh the data content of an item or region component such as Template Reports, Interactive Reports, or Interactive Grids or cascading LOV items. Not all regions and items support refresh.
      - [plugin-variants/removeClass](assets/app/page/dynamic-action/plugin-variants/remove-class/remove-class.md) — Removes one or more CSS classes from the affected elements.
      - [plugin-variants/setFocus](assets/app/page/dynamic-action/plugin-variants/set-focus/set-focus.md) — Sets the focus to the affected elements. This will default to the 1st of the affected elements if there are multiple. This can be especially useful when used in conjunction with the Show and Enable actions to take the user straight to the appropriate item.
      - [plugin-variants/setStyle](assets/app/page/dynamic-action/plugin-variants/set-style/set-style.md) — Sets a style (CSS) property to the affected elements.
      - [plugin-variants/setValue](assets/app/page/dynamic-action/plugin-variants/set-value/set-value.md) — Sets the value of the affected elements.
      - [plugin-variants/share](assets/app/page/dynamic-action/plugin-variants/share/share.md) — Share the current page of this application, a different URL or files with other applications.
      - [plugin-variants/show](assets/app/page/dynamic-action/plugin-variants/show/show.md) — Shows the affected elements.
      - [plugin-variants/showAiAssistant](assets/app/page/dynamic-action/plugin-variants/show-ai-assistant/show-ai-assistant.md) — Shows the AI Assistant, an AI-powered chat service, displayed either as a dialog or inline.
      - [plugin-variants/showErrorMessage](assets/app/page/dynamic-action/plugin-variants/show-error-message/show-error-message.md) — Displays an error message on the page.
      - [plugin-variants/showSuccessMessage](assets/app/page/dynamic-action/plugin-variants/show-success-message/show-success-message.md) — Displays a success message on the page.
      - [plugin-variants/submitPage](assets/app/page/dynamic-action/plugin-variants/submit-page/submit-page.md) — Submits the page.
      - [plugin-variants/triggerGeocoding](assets/app/page/dynamic-action/plugin-variants/trigger-geocoding/trigger-geocoding.md) — Manually trigger the geocoding search of a Geocoded Address item.
    - [metaTag](assets/app/page/meta-tag/meta-tag.md) — A page metaTag adds an HTML \`<meta>\` element to that page's \`<head>\` section, typically for browser, SEO, or social-sharing metadata
    - [pageItem](assets/app/page/page-item/page-item.md) — A page-scoped item used for user input, display, or hidden session state. Its type selects the item variant, such as textField, selectList, datePicker, or popupLov. When a value is shared across pages, use an appItem instead.
      - [plugin-variants/checkbox](assets/app/page/page-item/plugin-variants/checkbox/checkbox.md) — Displays a single checkbox that the user can check or uncheck. The defined checked or unchecked value is stored in session state when submitted.
      - [plugin-variants/checkboxGroup](assets/app/page/page-item/plugin-variants/checkbox-group/checkbox-group.md) — Displays multiple values as check boxes, enabling the end user to select multiple values. A list of values is required for items displayed as check boxes. The values corresponding to the checked boxes are stored in a single colon-delimited string.
      - [plugin-variants/colorPicker](assets/app/page/page-item/plugin-variants/color-picker/color-picker.md) — Allows users to choose or enter a color. Colors can be selected from a color spectrum.
      - [plugin-variants/combobox](assets/app/page/page-item/plugin-variants/combobox/combobox.md) — Displays a text item with a list of values icon. When the end user clicks the icon, a popup window appears with a suggestion dropdown of values. It supports filtering and freetext input. If multiple values can be selected they are displayed as chips. Combobox is best suited for small lists where end users should be able to add own text. For selections without freetext input Select List, Select One and Select Many are better suited. For large result sets have a look at Popup LOV.
      - [plugin-variants/datePicker](assets/app/page/page-item/plugin-variants/date-picker/date-picker.md) — Allows users to enter a date. For this you can either use a text field that opens a date picker as a popup, or you can use an inline or native date picker.
      - [plugin-variants/displayImage](assets/app/page/page-item/plugin-variants/display-image/display-image.md) — Displays an image stored in a database BLOB column, or based on an image URL.
      - [plugin-variants/displayMap](assets/app/page/page-item/plugin-variants/display-map/display-map.md) — Displays a map based on coordinates in GeoJSON point format.
      - [plugin-variants/displayOnly](assets/app/page/page-item/plugin-variants/display-only/display-only.md) — Displays a non-enterable text item.
      - [plugin-variants/fileUpload](assets/app/page/page-item/plugin-variants/file-upload/file-upload.md) — Displays a File Upload item. This item allows users to upload one or multiple files from their local file system or device.
      - [plugin-variants/geocodedAddress](assets/app/page/page-item/plugin-variants/geocoded-address/geocoded-address.md) — This item type provides geocoding (turning a postal address into coordinates) functionality. Geocoding is performed by the browser through a REST request to the Oracle eLocation Geocoding Service (elocation.oracle.com). The browser must be connected to the internet for geocoding to work. Geocoding input comes from other page items mapped to address parts such as Street, House Number, Postal Code, or City. The Geocoder displays a popup with possible matches. After the user selects a match, the item's session-state value is set to the address coordinates in GeoJSON format
      - [plugin-variants/hidden](assets/app/page/page-item/plugin-variants/hidden/hidden.md) — Items that are included within the page source but are not rendered. Hidden item values are saved in session state. They are generally used to store values required by page processing or other page items, but should not be displayed to the end user.
      - [plugin-variants/imageUpload](assets/app/page/page-item/plugin-variants/image-upload/image-upload.md) — Displays an Image Upload item. This item allows users to upload one or multiple images from their local file system or device. Those images can be optionally cropped or resized
      - [plugin-variants/listManager](assets/app/page/page-item/plugin-variants/list-manager/list-manager.md) — Displays a text item with a popup list of values icon, Add and Remove buttons, and a list of selected values. You can type in the value or pick from the list of available items. You can then utilize the buttons to manage the values selected. The selected values are stored in a single colon-delimited string.
      - [plugin-variants/markdownEditor](assets/app/page/page-item/plugin-variants/markdown-editor/markdown-editor.md) — Displays a text area supporting markdown input, with text formatting options, support for including images, and a preview option to view the formatted text.  The Markdown Editor allows you to write using easy-to-read, easy-to-write plain text, then convert it to structurally valid HTML using the various options provided, and supported syntax.
      - [plugin-variants/numberField](assets/app/page/page-item/plugin-variants/number-field/number-field.md) — Displays a number field. This item type automatically validates that the value is a number.
      - [plugin-variants/password](assets/app/page/page-item/plugin-variants/password/password.md) — Displays an HTML password form element. As the end user enters text a black dot is displayed for that character, instead of the actual character entered.
      - [plugin-variants/percentGraph](assets/app/page/page-item/plugin-variants/percent-graph/percent-graph.md) — Displays the column as a percentage graph. The value retrieved must be between 0 and 100.
      - [plugin-variants/popupLov](assets/app/page/page-item/plugin-variants/popup-lov/popup-lov.md) — Displays a text item with a popup list of values icon. When the end user clicks the icon, a popup window appears with a search field, and a list of supported values. Popup LOV is best suited for large lists since end users can enter search criteria to reduce the available values displayed. For relatively small lists Select List is often better suited.
      - [plugin-variants/qrCode](assets/app/page/page-item/plugin-variants/qr-code/qr-code.md) — This item encodes the selected source value into a QR code and displays it.
      - [plugin-variants/radioGroup](assets/app/page/page-item/plugin-variants/radio-group/radio-group.md) — Displays multiple values as radio group options, enabling the end user to select a single value.
      - [plugin-variants/richTextEditor](assets/app/page/page-item/plugin-variants/rich-text-editor/rich-text-editor.md) — Displays a rich text editor with comprehensive text formatting options. End users can enhance the content displayed in a similar fashion to using a word processor, such as Microsoft Word.
      - [plugin-variants/selectList](assets/app/page/page-item/plugin-variants/select-list/select-list.md) — Displays an item with a built-in list of values selector. When the end user clicks the item, the list of supported values displays directly inline with the current item. Select List is best suited for relatively small, discrete lists. End users can quickly select a value without changing focus to a popup dialog. For large lists, Popup LOV is often better suited.
      - [plugin-variants/selectMany](assets/app/page/page-item/plugin-variants/select-many/select-many.md) — Displays a LOV-based item that shows suggestions that allow multi-values. When the end user clicks the field, a popup window appears with a list of suggested values. It supports filtering, groups, and template directives.
      - [plugin-variants/selectOne](assets/app/page/page-item/plugin-variants/select-one/select-one.md) — Displays a text item with a list of values icon. When the end user clicks the field, a popup window appears with a list of suggested values. It supports filtering, groups, and template directives.
      - [plugin-variants/shuttle](assets/app/page/page-item/plugin-variants/shuttle/shuttle.md) — Displays as a multiple-select list that includes two boxes containing lists. The left list displays values that have not been selected, and the right list shows the currently selected values. End users can select one or more values, then use the shuttle controls to move selected values or all values. The current values are stored in a single colon-delimited string.
      - [plugin-variants/starRating](assets/app/page/page-item/plugin-variants/star-rating/star-rating.md) — This item displays a numeric value as a number of stars or other icons. The end user can change the value by selecting the desired number of stars. The value can be adjusted by clicking the number of stars with the mouse or by using the keyboard. The icon, background, and foreground colors can be adjusted in the component or individual item settings. To use individual settings, set Use Component Defaults to No. Any icon from the application Icon Font can be used. For Universal Theme applications, use an icon from the Font APEX library.
      - [plugin-variants/switch](assets/app/page/page-item/plugin-variants/switch/switch.md) — Displays as a flip toggle switch.
      - [plugin-variants/textField](assets/app/page/page-item/plugin-variants/text-field/text-field.md) — Displays a text field.
      - [plugin-variants/textFieldWithAutocomplete](assets/app/page/page-item/plugin-variants/text-field-with-autocomplete/text-field-with-autocomplete.md) — Displays a text field with a list of possible values based on the text already entered by the end user, inline with the text item. The list is further refined as the end user types in more text.
      - [plugin-variants/textarea](assets/app/page/page-item/plugin-variants/textarea/textarea.md) — Displays a multiple-row text area.
    - [process](assets/app/page/process/process.md) — A page process performs an action at a specified point during the rendering or submission of the page. For example, you can create a page process to execute logic or to make a call to the APEX engine. A page process is a unit of logic that runs when a specific event occurs, such as loading or submitting a page.
      - [basicAuthenticationParameter](assets/app/page/process/basic-authentication-parameter/basic-authentication-parameter.md) — Maps a value into the web-service request. The value can come from a page item, a static value, or a PL/SQL function body.
      - [inParameter](assets/app/page/process/in-parameter/in-parameter.md) — Maps a value returned by the web service to one or more page items.
      - [outParameter](assets/app/page/process/out-parameter/out-parameter.md) — Provides the username and password values used for Basic Authentication for the web service. Values can be sourced from items, static values, or PL/SQL functions.
      - [parameter](assets/app/page/process/parameter-c1/parameter-c1.md) — Supplies a value for an input or input/output variable when a Page Process starts a workflow. The parameter selects a variable from the chosen workflow definition and supplies it from a page item, static value, SQL query, preference, or other supported source.
      - [parameter](assets/app/page/process/parameter-c2/parameter-c2.md) — Defines a parameter for a page process that invokes a Web Source. It supplies the parameter value from a static value, page item, SQL query, preference, or expression.
      - [parameter](assets/app/page/process/parameter-c3/parameter-c3.md) — Defines an Invoke API process parameter, including its direction, data type, default or value source, and display order.
      - [parameter](assets/app/page/process/parameter-c4/parameter-c4.md) — Defines a Task Definition process parameter and the value source used to pass it to the task.
      - [plugin-variants/autoRowFetch](assets/app/page/process/plugin-variants/auto-row-fetch/auto-row-fetch.md) — LEGACY - Process to retrieve records from a single database table or view. This process is retained for compatibility and is used to populate form items with a source of Type Database Column.
      - [plugin-variants/autoRowProcessing](assets/app/page/process/plugin-variants/auto-row-processing/auto-row-processing.md) — LEGACY - Process to insert, update, or delete records into a single database table or updateable view. This process is retained for compatibility and is used to process form items with a source of Type Database Column. Attributes entered for this process should correlate with the attributes entered in the Automatic Row Fetch process.
      - [plugin-variants/clearSessionState](assets/app/page/process/plugin-variants/clear-session-state/clear-session-state.md) — Process to clear session state stored within Oracle APEX.
      - [plugin-variants/closeDialog](assets/app/page/process/plugin-variants/close-dialog/close-dialog.md) — Process to close the current modal or non-modal dialog page.
      - [plugin-variants/dataLoading](assets/app/page/process/plugin-variants/data-loading/data-loading.md) — Process to load data into the target table or collection based on the given data load definition.
      - [plugin-variants/download](assets/app/page/process/plugin-variants/download/download.md) — Downloads one or multiple files. This process type works in Before Header position at Page Rendering or in Page Processing when submitting a page. The processing stops after this process is executed.
      - [plugin-variants/executeCode](assets/app/page/process/plugin-variants/execute-code/execute-code.md) — Process to execute PL/SQL code.
      - [plugin-variants/executionChain](assets/app/page/process/plugin-variants/execution-chain/execution-chain.md) — Execute a sequence of page processes, either in the foreground or in the background.
      - [plugin-variants/formAutoRowProcessing](assets/app/page/process/plugin-variants/form-auto-row-processing/form-auto-row-processing.md) — Process to insert, update, or delete one or more form region rows.
      - [plugin-variants/formInitialization](assets/app/page/process/plugin-variants/form-initialization/form-initialization.md) — Process to initialize form region items. Initialization can either be fetching data from the region source, using the primary key value(s) or simple initialization of the form region items.
      - [plugin-variants/formPagination](assets/app/page/process/plugin-variants/form-pagination/form-pagination.md) — LEGACY - Process to retrieve the previous or next record from a database table or view. This process is retained for compatibility and can be used to provide pagination on Form pages, so that end users can retrieve the previous or next record without navigating back to a report. Note: If the form allows data to be updated then you should generally ensure that the appropriate form processing is performed prior to this pagination process executing. Otherwise, any updates made by the end user will be lost when they navigate to another record.
      - [plugin-variants/generateTextWithAi](assets/app/page/process/plugin-variants/generate-text-with-ai/generate-text-with-ai.md) — Invokes the configured Generative AI Service to generate a one-time response based on user content. This action is ideal for tasks like summarizing or translating text, extracting keywords, or drafting an email.
      - [plugin-variants/humanTaskCreate](assets/app/page/process/plugin-variants/human-task-create/human-task-create.md) — Process to create a human task, using an existing task definition from the application.
      - [plugin-variants/humanTaskManage](assets/app/page/process/plugin-variants/human-task-manage/human-task-manage.md) — Process to manage a human task. The different types of task management are Approve, Reject, Claim, Release, Delegate, Forward, Cancel, Comment and Invite Participant.
      - [plugin-variants/interactiveGridAutoRowProcessing](assets/app/page/process/plugin-variants/interactive-grid-auto-row-processing/interactive-grid-auto-row-processing.md) — Process to insert, update, or delete Interactive Grid rows.
      - [plugin-variants/invokeApi](assets/app/page/process/plugin-variants/invoke-api/invoke-api.md) — Process invokes a procedure or function stored in the local database or an operation defined in a REST Data Source.
      - [plugin-variants/loadUploadedData](assets/app/page/process/plugin-variants/load-uploaded-data/load-uploaded-data.md) — LEGACY - Process to load the parsed spreadsheet data into an existing table or view. This process is retained for compatibility.
      - [plugin-variants/parseUploadedData](assets/app/page/process/plugin-variants/parse-uploaded-data/parse-uploaded-data.md) — LEGACY - Process to parse the prepared spreadsheet data in preparation for loading into an existing table. This process is retained for compatibility.
      - [plugin-variants/prepareUploadedData](assets/app/page/process/plugin-variants/prepare-uploaded-data/prepare-uploaded-data.md) — LEGACY - Process to prepare spreadsheet data for uploading into an existing table. This process is retained for compatibility.
      - [plugin-variants/printReport](assets/app/page/process/plugin-variants/print-report/print-report.md) — Prints a report using a report query. This process type works in Before Header position at Page Rendering or in Page Processing when submitting a page. The processing stops after this process is executed.
      - [plugin-variants/invokeWorkflow](assets/app/page/process/plugin-variants/invoke-workflow/invoke-workflow.md) — Invokes another workflow and waits for it to return.
      - [plugin-variants/parallelFlow](assets/app/page/process/plugin-variants/parallel-flow/parallel-flow.md) — Executes multiple workflow branches in parallel and waits for them to complete.
      - [plugin-variants/serverSideGeocoding](assets/app/page/process/plugin-variants/server-side-geocoding/server-side-geocoding.md) — Converts a postal address to coordinates using server-side geocoding.
      - [plugin-variants/resetPagination](assets/app/page/process/plugin-variants/reset-pagination/reset-pagination.md) — Process to reset pagination of reports on the current page.
      - [plugin-variants/sendEMail](assets/app/page/process/plugin-variants/send-email/send-email.md) — Process sends an email and optionally one or more attachments from the application.
      - [plugin-variants/sendPushNotification](assets/app/page/process/plugin-variants/send-push-notification/send-push-notification.md) — Process sends a push notification to a user. All devices to which the user subscribes receive the push notification.
      - [plugin-variants/legacyWebService](assets/app/page/process/plugin-variants/legacy-web-service/legacy-web-service.md) — LEGACY - Process to consume the specified Web service. This process is retained for compatibility.
      - [plugin-variants/webService](assets/app/page/process/plugin-variants/web-service/web-service.md) — Process to consume the specified Web service.
      - [plugin-variants/switch](assets/app/page/process/plugin-variants/switch/switch.md) — Selects a workflow path based on conditions.
      - [plugin-variants/tabformAddRows](assets/app/page/process/plugin-variants/tabform-add-rows/tabform-add-rows.md) — Adds rows to a tabular form.
      - [plugin-variants/tabformDelete](assets/app/page/process/plugin-variants/tabform-delete/tabform-delete.md) — Deletes rows from a tabular form.
      - [plugin-variants/tabformUpdate](assets/app/page/process/plugin-variants/tabform-update/tabform-update.md) — Updates rows in a tabular form.
      - [plugin-variants/userPreferences](assets/app/page/process/plugin-variants/user-preferences/user-preferences.md) — Sets user preferences for the end user.
      - [plugin-variants/wait](assets/app/page/process/plugin-variants/wait/wait.md) — Pauses workflow execution until an event occurs or a period of time elapses.
      - [plugin-variants/workflow](assets/app/page/process/plugin-variants/workflow/workflow.md) — Performs an operation on a workflow.
      - [plugin-variants/workflowEnd](assets/app/page/process/plugin-variants/workflow-end/workflow-end.md) — Ends a workflow.
      - [plugin-variants/workflowStart](assets/app/page/process/plugin-variants/workflow-start/workflow-start.md) — Starts a workflow.
    - [region](assets/app/page/region/region.md) — A region is a page area that contains application content. Each page can have any number of regions. The region's type or the region template determines how the content is rendered at runtime. Regions can also contain type-specific child components such as columns, facets, actions, series, and template components.
      - [action](assets/app/page/region/action-c1/action-c1.md) — Applies to \`plugin-variants/cards\`. A cards page functions as a colorful way to display a subset of information and then enable the user to link to more detail. To create a link from a cards page, you create an action and then select an action type. You can create an action to link from a full card, a title, a subtitle, media, or a button.
        - [triggerAction](assets/app/page/region/action-c1/trigger-action-c1/trigger-action-c1.md) — Applies to the containing action. Creates the executable Dynamic Action attached to a component-level trigger.
      - [action](assets/app/page/region/action-c2/action-c2.md) — Applies to template components. Defines a clickable user interface control rendered inside a specific row-level slot (an action position of a template component).
        - [menu](assets/app/page/region/action-c2/menu-c1/menu-c1.md) — Applies to the containing template-component action. Creates a menu item associated with a page component action or button.
          - [triggerAction](assets/app/page/region/action-c2/menu-c1/trigger-action-c1/trigger-action-c1.md) — Defines the Dynamic Action executed by a template-component action menu entry.
        - [triggerAction](assets/app/page/region/action-c2/trigger-action-c1/trigger-action-c1.md) — Applies to the containing action. Creates the executable Dynamic Action attached to a component-level trigger.
      - [axis](assets/app/page/region/axis-c1/axis-c1.md) — Applies to \`plugin-variants/chart\`. Creates and normalizes the configuration metadata for a specific axis of an Oracle JET chart.
      - [column](assets/app/page/region/column-c1/column-c1.md) — Applies to \`plugin-variants/interactiveReport\`. Columns in an Interactive Report are the individual data fields or vertical grids mapped from your underlying SQL query that display, format, and allow user interaction.
        - [action](assets/app/page/region/column-c1/action/action.md) — Defines an action displayed for an Interactive Report column, including its label, position, target, icon, authorization, and execution condition.
          - [menu](assets/app/page/region/column-c1/action/menu/menu.md) — Defines a menu entry for an Interactive Report column action.
            - [triggerAction](assets/app/page/region/column-c1/action/menu/trigger-action/trigger-action.md) — Defines the Dynamic Action executed when an Interactive Report column action's menu entry is selected.
          - [triggerAction](assets/app/page/region/column-c1/action/trigger-action/trigger-action.md) — Defines the Dynamic Action executed by an Interactive Report column action.
        - [plugin-variants/avatar](assets/app/page/region/column-c1/plugin-variants/avatar/avatar.md) — Displays an image, icon, or initials. Available as a partial template to display a single row.
        - [plugin-variants/badge](assets/app/page/region/column-c1/plugin-variants/badge/badge.md) — Display content within a badge. Available for multiple report rows or a single row.
        - [plugin-variants/comments](assets/app/page/region/column-c1/plugin-variants/comments/comments.md) — Display user comments and status updates. Supports avatars. Available for a single row or as a report with multiple rows.
        - [plugin-variants/contentRow](assets/app/page/region/column-c1/plugin-variants/content-row/content-row.md) — Display content in a formatted row with a title, description, and more. Supports avatars and badges. Available for a single row or as a report with multiple rows.
        - [plugin-variants/mediaList](assets/app/page/region/column-c1/plugin-variants/media-list/media-list.md) — Display report content in a formatted media list. Supports avatars and badges. Available for a single row or as a report with multiple rows.
        - [plugin-variants/timeline](assets/app/page/region/column-c1/plugin-variants/timeline/timeline.md) — Display a series of events. Supports avatars and badges. Available for a single row or as a report with multiple rows.
      - [column](assets/app/page/region/column-c2/column-c2.md) — Applies to \`plugin-variants/classicReport\`. A Classic Report column displays a value from a report query in the report output.
      - [column](assets/app/page/region/column-c3/column-c3.md) — Applies to \`plugin-variants/interactiveGrid\`. An Interactive Grid column represents a query field and can be configured for display, editing, sorting, filtering, and other grid behavior.
      - [column](assets/app/page/region/column-c4/column-c4.md) — Applies to \`plugin-variants/tabform\`. A Tabular Form column represents a field in the editable tabular form.
      - [column](assets/app/page/region/column-c5/column-c5.md) — Applies when the selected region type supports the \`COLUMNS\` standard attribute. The column defines a column in the region's report or tabular output.
      - [column](assets/app/page/region/column-c6/column-c6.md) — Applies when the selected region type supports the \`SOURCE_LOCATION\` standard attribute. The column defines a source-location-aware value in the region output.
      - [columnGroup](assets/app/page/region/column-group-c1/column-group-c1.md) — Applies to \`plugin-variants/interactiveReport\`. Column groups organize fields into logical sections that appear only in Single Row View.
      - [columnGroup](assets/app/page/region/column-group-c2/column-group-c2.md) — Applies to \`plugin-variants/interactiveGrid\`. Column groups create multi-level spanning headers in the grid (and/or Single Row View) that support reordering and frozen columns.
      - [facet](assets/app/page/region/facet-c1/facet-c1.md) — Applies to \`plugin-variants/facetedSearch\`. A facet is an individual filter component used in a Faceted Search region to narrow down data records based on specific attributes or database columns.
        - [plugin-variants/checkboxGroup](assets/app/page/region/facet-c1/plugin-variants/checkbox-group/checkbox-group.md) — Displays multiple values as check boxes, enabling the end user to select multiple values. A list of values is required for items displayed as check boxes. The values corresponding to the checked boxes are stored in a single colon-delimited string.
        - [plugin-variants/inputField](assets/app/page/region/facet-c1/plugin-variants/input-field/input-field.md) — Displays a text field that enables the user to filter by text input.
        - [plugin-variants/radioGroup](assets/app/page/region/facet-c1/plugin-variants/radio-group/radio-group.md) — Displays multiple values as radio group options, enabling the end user to select a single value.
        - [plugin-variants/range](assets/app/page/region/facet-c1/plugin-variants/range/range.md) — Displays an item with a built-in list of values selector. Each option represents a range of values, from a lower to an upper boundary. The facet supports single or multiple selection, and manual entry. For single selection support, displays multiple values as radio group options, enabling the end user to select a single value. For multiple selection support, displays multiple values as check boxes, enabling the end user to select multiple values. For manual entry support, text fields will render below the facet, allowing the end user to manually enter the range of values they wish to use for filtering the Filtered region. For filtering and count computation, the lower boundary of a specified range is always treated inclusive, and the upper boundary is exclusive.
        - [plugin-variants/search](assets/app/page/region/facet-c1/plugin-variants/search/search.md) — Displays a text field, enabling the end user to search the list entries of the facets in the Faceted Search region. A Faceted Search region supports one Search facet, which will always be at the top of the list of Facets, regardless of its sequence.
        - [plugin-variants/selectList](assets/app/page/region/facet-c1/plugin-variants/select-list/select-list.md) — Displays an item with a built-in list of values selector. When the end user clicks the item, the list of supported values displays directly inline with the current item. Select List is best suited for relatively small, discrete lists. End users can very quickly select a value from the list without needing to change focus to a popup dialog. For large lists Popup LOV is often better suited.
      - [facetGroup](assets/app/page/region/facet-group-c1/facet-group-c1.md) — Applies to \`plugin-variants/smartFilters\`. A facet group is a feature that lets you combine multiple boolean checkbox facets as values into a single, organized filter section.
        - [checkbox](assets/app/page/region/facet-group-c1/checkbox/checkbox.md) — Individual condition for a search value in a facet group.
      - [filter](assets/app/page/region/filter-c1/filter-c1.md) — Applies to \`plugin-variants/smartFilters\`. Displays intelligent filter options as "chips" underneath the main search box complete with real-time record counts.
      - [filterGroup](assets/app/page/region/filter-group-c1/filter-group-c1.md) — Applies to \`plugin-variants/smartFilters\`. A smart filter group is a feature that lets you combine multiple checkboxes as chips into a single, organized filter section.
        - [checkbox](assets/app/page/region/filter-group-c1/checkbox/checkbox.md) — Individual condition for a search value in a filter group.
      - [parameter](assets/app/page/region/parameter-c1/parameter-c1.md) — Applies to the region data-source parameter context. Just as PL/SQL procedures can define IN, OUT, and IN/OUT parameters, so can REST Data Sources. Define a parameter at the operation level if it is specific to that action, or at the data source level if it is relevant to all operations.
      - [savedReport](assets/app/page/region/saved-report-c1/saved-report-c1.md) — Applies to \`plugin-variants/interactiveGrid\`. A customized configuration of an interactive grid. After users customize an interactive grid they can save it as either a Private or Public report.
        - [aggregate](assets/app/page/region/saved-report-c1/aggregate/aggregate.md) — A mathematical calculation or count—displayed at the bottom of a column or after a control break.
        - [controlBreak](assets/app/page/region/saved-report-c1/control-break/control-break.md) — Groups data rows by a selected column and pulls that column's value out to display as a master header or section break, preventing repetitive data viewing
        - [displayColumn](assets/app/page/region/saved-report-c1/display-column/display-column.md) — Sets the display status of a column, the position in which a column appears in the grid and its minimal width.
        - [filter](assets/app/page/region/saved-report-c1/filter/filter.md) — Narrow the contents of an interactive grid by applying a filter to it.
        - [highlight](assets/app/page/region/saved-report-c1/highlight/highlight.md) — Apply color effects to an interactive grid.
        - [sort](assets/app/page/region/saved-report-c1/sort/sort.md) — Specify the sort order (ascending or descending) of a column. Can also specify how to handle NULL values.
      - [savedReport](assets/app/page/region/saved-report-c2/saved-report-c2.md) — Applies to \`plugin-variants/interactiveReport\`. A customized configuration of an interactive report. APEX includes four types of saved interactive reports: Primary Default, Alternative Report, Public Report, and Private report.
        - [aggregate](assets/app/page/region/saved-report-c2/aggregate/aggregate.md) — Defines an aggregation against a column with the Data submenu in Actions. Aggregates are displayed after each control break and at the end of the report within the column for which they are defined.
        - [computation](assets/app/page/region/saved-report-c2/computation/computation.md) — Add mathematical computations (for example, NBR_HOURS/24) or standard Oracle functions to columns.
        - [controlBreak](assets/app/page/region/saved-report-c2/control-break/control-break.md) — Creating a break group pulls the columns out of the interactive report and displays them as a master record.
        - [displayColumn](assets/app/page/region/saved-report-c2/display-column/display-column.md) — Customize a saved report to include specific columns.
        - [filter](assets/app/page/region/saved-report-c2/filter/filter.md) — Can create a filter by using the Actions menu to create or modify a column or row filter.
        - [groupByAggregate](assets/app/page/region/saved-report-c2/group-by-aggregate/group-by-aggregate.md) — A group-by aggregate is a calculation performed for each group of rows.
        - [groupByColumn](assets/app/page/region/saved-report-c2/group-by-column/group-by-column.md) — Group sets of results by one or more columns with Group By, then perform mathematical computations against the columns. Once you define the Group By, switch between the Group By and Report views using the View Icon on the Search bar.
        - [groupBySort](assets/app/page/region/saved-report-c2/group-by-sort/group-by-sort.md) — Specify Group By column sort order (ascending or descending) by either clicking on the group by column heading or selecting Group By Sort on the Data submenu.
        - [highlight](assets/app/page/region/saved-report-c2/highlight/highlight.md) — Customize the display to highlight specific rows in a report by selecting Highlight on the Actions, Format submenu.
        - [pivotAggregate](assets/app/page/region/saved-report-c2/pivot-aggregate/pivot-aggregate.md) — A pivot aggregate is a mathematical or statistical function applied to a data column when you transpose rows into columns.
        - [pivotColumn](assets/app/page/region/saved-report-c2/pivot-column/pivot-column.md) — A pivot column is a field whose distinct data values are transposed into individual dynamic columns across the top of your cross-tabulation view
        - [pivotRowColumn](assets/app/page/region/saved-report-c2/pivot-row-column/pivot-row-column.md) — A Row Column in the Pivot configuration defines the base data field(s) whose unique values form the vertical rows on the left side of the cross-tab pivot table.
        - [pivotSort](assets/app/page/region/saved-report-c2/pivot-sort/pivot-sort.md) — The pivot sort option in the Actions menu allows to explicitly define which column(s) from the row headers should drive the ascending or descending order of the displayed rows.
        - [sort](assets/app/page/region/saved-report-c2/sort/sort.md) — Specifies the column display sort order (ascending or descending) by selecting Sort on the Data submenu.
      - [searchSource](assets/app/page/region/search-source/search-source.md) — Create a declarative search for an application by creating a search configuration on a data source and then creating a page that displays the search results.
      - [series](assets/app/page/region/series/series.md) — Configure a table name, SQL query, or other data source to define a chart series
        - [parameter](assets/app/page/region/series/parameter/parameter.md) — Selects the location of the data source to use for the chart series.
      - [template-component/actions](assets/app/page/region/template-component/actions/actions.md) — This component is used to create a set of Inline Actions.
      - [template-component/avatar](assets/app/page/region/template-component/avatar/avatar.md) — Displays an image, icon, or initials. Available as a partial template to display a single row.
      - [template-component/badge](assets/app/page/region/template-component/badge/badge.md) — Display content within a badge. Available for multiple report rows or a single row.
      - [template-component/comments](assets/app/page/region/template-component/comments/comments.md) — Display user comments and status updates. Supports avatars. Available for a single row or as a report with multiple rows.
      - [template-component/contentRow](assets/app/page/region/template-component/content-row/content-row.md) — Display content in a formatted row with a title, description, and more. Supports avatars and badges. Available for a single row or as a report with multiple rows.
      - [template-component/flexboxContainer](assets/app/page/region/template-component/flexbox-container/flexbox-container.md) — A flexible container for arranging components using modern flexbox layout. Other page components can be organized in auto layouts which dynamically change based on the settings and content of the container. It allows you to arrange and align regions using simple property settings, eliminating the need for custom CSS in most layout scenarios. Beyond solving unequal region heights, the Flexbox Container also gives you flexible control over region layout and behavior. It lets you declaratively manage direction, wrapping, alignment, spacing, overflow, and sizing without relying on custom CSS. Supports horizontal or vertical direction, wrapping, spacing, alignment, justification, overflow, and flex item sizing.
      - [template-component/mediaList](assets/app/page/region/template-component/media-list/media-list.md) — Display report content in a formatted media list. Supports avatars and badges. Available for a single row or as a report with multiple rows.
      - [template-component/metricCard](assets/app/page/region/template-component/metric-card/metric-card.md) — Works well for a range of summary and dashboard-style use cases, such as: Executive dashboards, Operational KPI pages Data summaries.
      - [template-component/timeline](assets/app/page/region/template-component/timeline/timeline.md) — Display a series of events. Supports avatars and badges. Available for a single row or as a report with multiple rows.
      - [plugin-variants/breadcrumb](assets/app/page/region/plugin-variants/breadcrumb/breadcrumb.md) — Displays the breadcrumb trail for the current page. Use breadcrumbs to create hierarchical list of links that indicates where the user is within the application from a hierarchical perspective. A breadcrumb provides navigational context to end users and offer an easy navigation path back to the app home page. Users can click a specific breadcrumb link to instantly view the target page. Within the Universal Theme, breadcrumbs have a special location for placement and should generally be used with the Title Bar region template. A breadcrumb can also display within a blank region.
      - [plugin-variants/calendar](assets/app/page/region/plugin-variants/calendar/calendar.md) — Displays date based entries on a variety of calendar views. With the inclusion of an end date, the calendar can display duration based events. Calendars can also update records directly if Drag and Drop is enabled. Calendar is based on the FullCalendar jQuery library and can be customized with CSS. Create a calendar from a table or SQL query, then select a date column and display column during setup. Calendar supports Month, Week, Day, and List views; duration and non-duration events; drag-and-drop date changes for local database sources; event resizing to change duration; adding and editing events with forms; external event sources via web services or Google Calendar feeds; single-line or multi-line event titles; custom CSS classes for event types; printable PDF downloads; iCal, CSV, and XML sharing formats; and tooltips for quick event-detail previews in Month, Week, and Day views.
      - [plugin-variants/cards](assets/app/page/region/plugin-variants/cards/cards.md) — Report based on a SQL Query that displays data for each row in cards. With cards, you can easily visualize the data in blocks of content. One can choose between three layouts: Grid, Float, or Horizontal (Row). You can customize Header, Media, Body, or Actions declaratively.
      - [plugin-variants/chart](assets/app/page/region/plugin-variants/chart/chart.md) — Displays data using various built-in chart types: AreaBar, Box Plot, Bubble, Combination, Status Meter Gauge, Donut, Funnel, Gantt, Line, Line with Area, Pie, Polar, Pyramid, Radar, Scatter, Stock. Supports charts based on the Oracle JavaScript Extension Toolkit (Oracle JET) Data Visualizations. Oracle JET empowers developers by providing a modular open source toolkit based on modern JavaScript, CSS3, and HTML5 design and development principles. The Oracle JET data visualization components include customizable charts, gauges, and other components that you can use to present flat or hierarchical data in a graphical display for data analysis. Each Oracle JET visualization supports animation, accessibility, responsive layout, internationalization, test automation, and a range of interactivity features. Charts provide dozens of different ways to visualize a data set.
      - [plugin-variants/classicReport](assets/app/page/region/plugin-variants/classic-report/classic-report.md) — A classic report features a simple report page based on the formatted result of a SQL query. Classic Reports are similar to Interactive Reports, but do not include the numerous end-user customization options available with Interactive Reports.
      - [plugin-variants/dynamicContent](assets/app/page/region/plugin-variants/dynamic-content/dynamic-content.md) — Displays the HTML content returned by a function. When none of APEX's other region types meet your requirements, the Dynamic Content region lets you programmatically generate all its HTML markup. Your code constructs a CLOB containing any mix of tags and data and returns it for the APEX engine to include in the appropriate place in the page.
      - [plugin-variants/facetedSearch](assets/app/page/region/plugin-variants/faceted-search/faceted-search.md) — A region based on the source of an associated Faceted Search, that provides end users with numerous facets that are used to narrow search results at run-time.
      - [plugin-variants/form](assets/app/page/region/plugin-variants/form/form.md) — Form region which supports different data sources. This form region holds information on the data source (which can be local, remote or REST service) and has page items assigned to it. Each item is assigned to a form region and a display region.
      - [plugin-variants/helpText](assets/app/page/region/plugin-variants/help-text/help-text.md) — Displays a special Help region utilized on the dedicated Help page.
      - [plugin-variants/interactiveGrid](assets/app/page/region/plugin-variants/interactive-grid/interactive-grid.md) — Feature-rich reporting component with data editing capabilities, enabling users to add, modify, or delete rows of data directly on the page. By default, all interactive grids have a search bar, Actions menu, and Reset button. Interactive grids also have Column Heading Menus, which you access by clicking the name or heading of a column. You can hide, filter, freeze, highlight, sort, and create control breaks on individual columns with the Actions and Column Heading menus. Advanced users can also define aggregations, which appear at the bottom of the column or column group. Using the mouse, you can resize columns or drag and drop columns into different places to directly customize the appearance of an interactive grid. You can also configure the width and order of columns in the Columns dialog. You can quickly chart the data by clicking the Actions menu and selecting the Chart option. This feature is useful for quick data visualization or even presentation, and responds immediately to changes in the data. You can quickly revert your modifications with the Reset function or perform an incremental revert by clicking the Actions menu and selecting, Data, Flashback. You can use the Refresh option to pull in the latest version of the data on the database (useful for highly dynamic datasets).
      - [plugin-variants/interactiveReport](assets/app/page/region/plugin-variants/interactive-report/interactive-report.md) — Feature-rich reporting component that enables end users to create and customize saved reports, with features such as aggregations, computed columns, highlighting, charting, grouping, subscriptions, and more. An interactive report is a formatted result of a SQL query. End users can customize the both report layout and control how the data that displays. Both the Create Application Wizard and Create Page Wizard support the creation of interactive reports. You choose a table on which to build a report, or provide a custom SQL SELECT statement. Interactive reports are only supported for Desktop applications. End users can customize the report layout and data displayed by selecting options on the Actions menu. For example, end users can alter the report layout by hiding or exposing specific columns and applying filters, highlighting, and sorting. Advanced end users can also define breaks, aggregations, charts, group data, and add computations. Once customized, the report can be saved as either a private or public report. Developers can include multiple interactive reports per page and can restrict the capabilities available to end users (such as disabling download or support for hiding column). When the end user views the report, report functionality is the same across all reports in the application. When viewing an interactive report, end users can customize how and what data displays. By default, interactive reports include a search bar, an Actions menu, column heading menus, and Edit icons in the first column of each row. Using options on the Actions menu, users can alter the report layout by hiding or exposing specific columns and applying filters, highlighting, and sorting. They can also define breaks, aggregations, charts, group bys, and add their own computations. Once customized, the report can be saved as either a private or public report.
      - [plugin-variants/list](assets/app/page/region/plugin-variants/list/list.md) — Displays values based on either a static or dynamic list. Generally these are used for navigating to pages in the application.
      - [plugin-variants/map](assets/app/page/region/plugin-variants/map/map.md) — Report based on a SQL Query that displays coordinate data as a map. Supports points, lines and polygon data.
      - [plugin-variants/regionDisplaySelector](assets/app/page/region/plugin-variants/region-display-selector/region-display-selector.md) — Display region names in a horizontal list, enabling end users to select one region to display and hide other regions. Only page regions with Region Display Selector set to Yes will be displayed in this region.
      - [plugin-variants/search](assets/app/page/region/plugin-variants/search/search.md) — Display Search Results, based on Search Configurations, which are defined within Shared Components.
      - [plugin-variants/smartFilters](assets/app/page/region/plugin-variants/smart-filters/smart-filters.md) — A region based on the source of an associated Smart Filters, that provides end-users with numerous filters that are used to narrow search results at run-time. Smart Filters consists of two main top-level containers: Search Bar and Suggestion Filter Chip Container. The user interface is highly compact. The moment you start typing, all the filters show up with potential matched values. Hitting the Enter key will apply a certain selected value creating an Applied Chip.
      - [plugin-variants/staticContent](assets/app/page/region/plugin-variants/static-content/static-content.md) — Display text content or a region container for page items. To output HTML markup and not have the content escaped, set Output As to HTML.
      - [plugin-variants/tree](assets/app/page/region/plugin-variants/tree/tree.md) — Display data in a hierarchical structure, based on parent-child relationships between records. App Builder includes a built-in wizard for generating a tree hierarchical navigation mechanism. Trees are implemented using a single hierarchical query that identifies the row to be used as the start of your query and the relationship between parent rows and child rows of the hierarchy. Trees use the APEX Tree implementation. This is a JavaScript-based, cross browser tree component that features optional keyboard navigation, and optional state saving.
      - [plugin-variants/url](assets/app/page/region/plugin-variants/url/url.md) — Display remote content sourced from a URL.
      - [plugin-variants/workflowDiagram](assets/app/page/region/plugin-variants/workflow-diagram/workflow-diagram.md) — Displays a read-only Workflow Diagram showing the progress and activities completed.
      - [layer](assets/app/page/region/layer/layer.md) — Defines a spatial or data layer within a Map region. It specifies the layer source, geometry type, filtering, ordering, styling, tooltips, and visibility behavior.
        - [parameter](assets/app/page/region/layer/parameter/parameter.md) — Defines a parameter used by a map layer's data source or query.
    - [validation](assets/app/page/validation/validation.md) — Can create validation and an associated error message to check the data a user enters before processing.
  - [pageGroup](assets/app/page-group/page-group.md) — Page groups help you organize pages. To use page groups, create a group and then assign pages to the group. Page groups do not have any function other than to aid developers in organizing their application pages.
  - [plugin](assets/app/plugin/plugin.md) — A plug-in is an extension to the built-in types available in APEX. Create plug-ins for declarative use of new item, region, process and dynamic action types in your application.
    - [actionPosition](assets/app/plugin/action-position/action-position.md) — The Action Position defines the position of the button within the template.
    - [actionTemplate](assets/app/plugin/action-template/action-template.md) — The Action Template defines if the template is a simple Button or displays a Menu button.
    - [attributeGroup](assets/app/plugin/attribute-group/attribute-group.md) — Bundle custom plug-in custom attributes into logical categories (such as Settings, Appearance, or Advanced) to keep the structure clean and organized.
    - [customAttribute](assets/app/plugin/custom-attribute/custom-attribute.md) — Custom attributes in Oracle APEX plug-ins are developer-defined configuration fields. They let plug-in creators add custom settings—like text boxes, select lists, or numbers—to the Page Designer. This allows users of the plug-in to pass specific values, such as API keys or CSS styles, into the PL/SQL or JavaScript code.
      - [entry](assets/app/plugin/custom-attribute/entry/entry.md) — A defined option within a plugin.
    - [event](assets/app/plugin/event/event.md) — Enable the plug-in to be exposed to dynamic actions.
    - [file](assets/app/plugin/file/file.md) — Create a file to associate with a plug-in.
    - [slot](assets/app/plugin/slot/slot.md) — Structural placeholders inside Template Component plug-ins. They allow developers to nest and inject other page elements—such as regions, items, or buttons—directly into custom HTML layouts. Just define a named slot and include its contents in your template using the \`#SLOTNAME#\` syntax.
    - [standardAttributeConfig](assets/app/plugin/standard-attribute-config/standard-attribute-config.md) — Defines which built-in APEX component properties—such as source, region, escaping, or session state—a plugin supports and how they apply to it.
  - [pwaScreenshot](assets/app/pwa-screenshot/pwa-screenshot.md) — Include screenshots for promotional purposes when users are prompted to install the Progressive Web App.
  - [pwaShortcut](assets/app/pwa-shortcut/pwa-shortcut.md) — Include shortcuts to enable users of installed PWAs to quickly access a specific page. For touch-enabled devices, shortcuts are accessible when doing a long-press on the application icon on the home screen. For other devices, shortcuts are accessible when doing a right-click on the application icon on the task bar.
  - [reportLayout](assets/app/report-layout/report-layout.md) — To format either a classic report region, interactive report region, or report query, you associate it with a report layout. Using report layouts renders the data in a printer-friendly format. If you do not select a report layout, a default XSL-FO layout is used.
  - [reportQuery](assets/app/report-query/report-query.md) — A report query is a SQL query that is used to fetch data to be displayed in a report. The data source can be a table, a SQL query, or a REST Data Source. The report query defines the columns to be included in the report, the data source, and any conditions or sorting to be applied to the data. Note that report queries must be SQL statements. Functions returning SQL statements are not supported.
    - [sourceQuery](assets/app/report-query/source-query/source-query.md) — Each source you include can be from any supported data source type including local or remote queries, tables, and views, REST Data Sources, and more.
      - [parameter](assets/app/report-query/source-query/parameter/parameter.md) — Defines a named parameter for the report query source.
  - [restDataSource](assets/app/rest-data-source/rest-data-source.md) — REST Data Sources enable access to Representational State Transfer (REST) services or generic JSON data feeds in applications and allow the data to be used in Oracle APEX components.
    - [dataProfileColumn](assets/app/rest-data-source/data-profile-column/data-profile-column.md) — Stores information about its name, the data type and the name of the attribute within the response from the REST API.
    - [operation](assets/app/rest-data-source/operation/operation.md) — A REST Data Source can contain one or many Operations which are the references to a concrete external web service. Configurations at the REST source level are shared across all contained operations.
    - [parameter](assets/app/rest-data-source/parameter/parameter.md) — Defines a named REST request or response parameter.
    - [plugin-variants/http](assets/app/rest-data-source/plugin-variants/http/http.md) — Use a REST service as a REST Data Source.
    - [plugin-variants/oci](assets/app/rest-data-source/plugin-variants/oci/oci.md) — Use Oracle Cloud Infrastructure REST services as REST Data Sources.
    - [plugin-variants/odataRestService](assets/app/rest-data-source/plugin-variants/odata-rest-service/odata-rest-service.md) — Use OData REST services as REST Data Sources.
    - [plugin-variants/oracleCloudAppsBoss](assets/app/rest-data-source/plugin-variants/oracle-cloud-apps-boss/oracle-cloud-apps-boss.md) — Use Oracle Cloud Applications (BOSS) services as REST Data Sources.
    - [plugin-variants/oracleCloudAppsSaas](assets/app/rest-data-source/plugin-variants/oracle-cloud-apps-saas/oracle-cloud-apps-saas.md) — Use Oracle ADF REST services as REST Data Sources.
    - [plugin-variants/ords](assets/app/rest-data-source/plugin-variants/ords/ords.md) — Use ORDS REST services as REST Data Sources.
    - [plugin-variants/restEnabledSqlQuery](assets/app/rest-data-source/plugin-variants/rest-enabled-sql-query/rest-enabled-sql-query.md) — Defines a query for use against remote Oracle databases.
    - [synchronizationStep](assets/app/rest-data-source/synchronization-step/synchronization-step.md) — Data Synchronization enables developers to automatically sync the contents of a local table with the data from a REST service. Use Steps to pass parameter values or specific external filters to the REST Service.
      - [parameter](assets/app/rest-data-source/synchronization-step/parameter/parameter.md) — Defines a parameter used by a REST Data Source synchronization step.
  - [role](assets/app/role/role.md) — Manage application access control roles and user role assignments
  - [searchConfig](assets/app/search-config/search-config.md) — A search configuration contains information about a searchable data source. Supported search types include Standard, which defines a searchable data source such as a table, SQL query, or REST Data Source; Oracle TEXT, which defines a searchable table or SQL query that already has an Oracle TEXT index; Oracle Ubiquitous Search, which uses an Oracle ubiquitous search index and requires Oracle AI Database 26ai or later; and List, which searches within a selected list from Shared Components. Standard and Oracle TEXT searches are executed using SQL or Oracle TEXT functionality, respectively.
    - [parameter](assets/app/search-config/parameter/parameter.md) — Defines a parameter used by a Search Configuration data source.
  - [shortcut](assets/app/shortcut/shortcut.md) — Use a shortcut to define frequently used code once and then reference it in many places, reducing code redundancy. For example, you can create a shortcut to define a page control such as a button, HTML text, a PL/SQL procedure, or HTML. You can use a shortcut within the following locations: the Region Source attribute of regions defined as HTML Text (with shortcuts), Region Header and Footer Text attributes, Item Label attributes, Pre Element Text, Post Element Text, Default Value attributes, and Region Template attributes. Once you define a shortcut, you can invoke it using the specific syntax unique to the location in which you use it: \`"SHORTCUT_STATIC_ID"\`. The shortcut Static ID is case insensitive and must be enclosed in quotation marks.
  - [substitution](assets/app/substitution/substitution.md) — An application-level static substitution string: a named value that APEX replaces wherever you use \`&NAME.\`.
  - [supportingObject](assets/app/supporting-object/supporting-object.md) — Use Supporting Objects to define database object installation scripts that are invoked when importing an application. You can also define de-installation scripts to drop objects when deleting an application.
    - [installScript](assets/app/supporting-object/install-script-4970/install-script-4970.md) — Define installation scripts that create the application's supporting database objects. 
      - [databaseObject](assets/app/supporting-object/install-script-4970/database-object-4972/database-object-4972.md) — Define multiple installation scripts that create the application's supporting database objects.
    - [upgradeScript](assets/app/supporting-object/upgrade-script-4975/upgrade-script-4975.md) — Upgrade Scripts to define scripts to upgrade database objects, images, and seed data when upgrading an existing application
    - [substitution](assets/app/supporting-object/substitution/substitution.md) — Static substitution strings provide reusable names and values for phrases or labels used throughout an application. This supporting-object substitution identifies a value that an installer may provide or change when installing the application; packaging can include an installation prompt for it.
    - [validation](assets/app/supporting-object/validation/validation.md) — Defines an installation validation check for supporting objects. It evaluates SQL or PL/SQL during application installation and reports the configured error message when the check fails.
    - [buildOption](assets/app/supporting-object/build-option/build-option.md) — Associates a build option with supporting objects so installation scripts and related objects can be included or excluded according to the option's configuration.
  - [taskDefinition](assets/app/task-definition/task-definition.md) — Task that requires human action - also called the human task. Task Definitions contain information about tasks including deadlines, expiry settings, and notification settings.
    - [action](assets/app/task-definition/action/action.md) — Possible events that can happen when specific criteria are met.
      - [plugin-variants/executeCode](assets/app/task-definition/action/plugin-variants/execute-code/execute-code.md) — Process to execute PL/SQL code.
      - [plugin-variants/sendEMail](assets/app/task-definition/action/plugin-variants/send-email/send-email.md) — Process sends an email and optionally one or more attachments from the application.
      - [plugin-variants/sendPushNotification](assets/app/task-definition/action/plugin-variants/send-push-notification/send-push-notification.md) — Process sends a push notification to a user. All devices to which the user subscribes receive the push notification.
    - [parameter](assets/app/task-definition/parameter/parameter.md) — Attributes for a task that contain information about the task. These parameters can be visible on the task details page, and you can configure whether or not a parameter is editable after the task is initiated.
    - [participant](assets/app/task-definition/participant/participant.md) — Users that have permission to act on individual tasks.
  - [textMessage](assets/app/text-message/text-message.md) — Can be used to build translatable text strings with substitution variables which in turn can be called from PL/SQL packages, procedures, and functions. Using Text Messages in an APEX app has various benefits. Some are: Dynamic Translations for Multi-Language Applications, Centralized Management of Text, Dynamic UI Text and Prompts, Seamless Updates for Content Changes, Localization of Emails and Notifications, Improved Maintainability in Large Applications.
  - [workflow](assets/app/workflow/workflow.md) — A workflow represents the automation of a business process, in whole or part, during which documents, information, or tasks are passed from one participant to another for action according to a set of procedural rules, such as sequence flows or transition conditions. Workflow definitions contain the versions and parameters for the execution of a workflow instance.
    - [parameter](assets/app/workflow/parameter/parameter.md) — A workflow parameter is an input for the workflow. APEX passes parameters to the workflow instance when the workflow starts. A parameter applies to all versions of a workflow, and the value of a parameter does not change during the workflow runtime.
    - [version](assets/app/workflow/version/version.md) — A Workflow Version refers to a specific version of a workflow definition. There are three types of workflow versions. In Development workflows are editable, but you can only run them in the developer session. Only one version of a workflow can be in development at a time. Active workflows are partially editable. Only one version of a workflow can be active at a time. You cannot move an active workflow back to in development. Inactive workflows are no longer active, and you cannot use an inactive version of a workflow to start a new workflow instance. Multiple versions of a workflow can be inactive at a time. You can delete an inactive workflow. Deleting an inactive workflow definition also deletes any workflow instances associated with it.
      - [activity](assets/app/workflow/version/activity/activity.md) — A workflow activity specifies what kind of work APEX performs when the workflow arrives at that activity. You can only create a workflow activity if the workflow is in development. You cannot create a workflow activity if the workflow is active.
        - [activityVariable](assets/app/workflow/version/activity/activity-variable/activity-variable.md) — Workflow Activity variables are specific/local to the execution of a workflow activity. These variables may be referenced: During Activity execution, During evaluation of a Switch condition, During evaluation of any Timeout or Error-handling routes defined for the activity. Unlike Workflow Variables, they cannot be referenced by other activities of the workflow once the activity execution is completed. Each workflow activity corresponds to a process type plugin.
        - [branch](assets/app/workflow/version/activity/branch/branch.md) — Parallel Flow allows the execution of workflow activities in parallel via two or more branches. The workflow runtime engine simultaneously processes the branches, and moves to the next activity in the workflow once all branches are completed.
        - [connection](assets/app/workflow/version/activity/connection-c1/connection-c1.md) — A Workflow Connection is a link between two workflow activities. Workflow connections determine the path through a particular workflow at runtime. There are two types of connections: branches and transitions.
        - [connection](assets/app/workflow/version/activity/connection-c2/connection-c2.md) — Defines a workflow transition of type \`BRANCH\` from the current activity to another activity. It specifies the destination, conditions, sequence, and optional diagram settings.
        - [parameter](assets/app/workflow/version/activity/parameter-c1/parameter-c1.md) — Inputs for the workflow that APEX passes to the workflow when a new workflow instance starts. For example, a workflow that approves an employee's request for a new laptop could include parameters like Employee ID and Laptop Type.
        - [parameter](assets/app/workflow/version/activity/parameter-c2/parameter-c2.md) — Defines a Web Source parameter for a workflow activity. It supplies a value from a static value, item, SQL query, preference, or expression.
        - [parameter](assets/app/workflow/version/activity/parameter-c3/parameter-c3.md) — Defines an Invoke API parameter for a workflow activity, including direction, data type, default or value source, and display order.
        - [parameter](assets/app/workflow/version/activity/parameter-c4/parameter-c4.md) — Defines a Task Definition parameter for a workflow activity and the value source used to pass it to the task.
        - [plugin-variants/humanTaskCreate](assets/app/workflow/version/activity/plugin-variants/human-task-create/human-task-create.md) — Process creates a human task using an existing task definition from the application.
        - [plugin-variants/generateTextWithAi](assets/app/workflow/version/activity/plugin-variants/generate-text-with-ai/generate-text-with-ai.md) — Invokes the configured Generative AI Service to generate a one-time response based on user content. This action is ideal for tasks like summarizing or translating text, extracting keywords, or drafting an email.
        - [plugin-variants/invokeApi](assets/app/workflow/version/activity/plugin-variants/invoke-api/invoke-api.md) — Process invokes a procedure or function stored in the local database or an operation defined in a REST Data Source.
        - [plugin-variants/invokeWorkflow](assets/app/workflow/version/activity/plugin-variants/invoke-workflow/invoke-workflow.md) — Invokes another workflow of the application from a workflow activity.
        - [plugin-variants/parallelFlow](assets/app/workflow/version/activity/plugin-variants/parallel-flow/parallel-flow.md) — A parallel flow activity creates multiple branches that execute activities in parallel.
        - [plugin-variants/executeCode](assets/app/workflow/version/activity/plugin-variants/execute-code/execute-code.md) — Process to execute PL/SQL code.
        - [plugin-variants/sendEMail](assets/app/workflow/version/activity/plugin-variants/send-email/send-email.md) — Process sends an email and optionally one or more attachments from the application.
        - [plugin-variants/sendPushNotification](assets/app/workflow/version/activity/plugin-variants/send-push-notification/send-push-notification.md) — Process sends a push notification to a user. All devices to which the user subscribes receive the push notification.
        - [plugin-variants/workflowEnd](assets/app/workflow/version/activity/plugin-variants/workflow-end/workflow-end.md) — Process completes the execution of the workflow in which this process has been added as an activity. When the End State attribute is specified as Completed, the workflow ends with a Completed state. When the end state is specified as Terminated, the workflow ends in a Terminated state.
        - [plugin-variants/workflowStart](assets/app/workflow/version/activity/plugin-variants/workflow-start/workflow-start.md) — Process begins the execution of the workflow in which this process has been added as an activity.
        - [plugin-variants/switch](assets/app/workflow/version/activity/plugin-variants/switch/switch.md) — Process supports condition-based evaluation to arrive at a certain outcome. It can be used in a workflow activity to decide the next activity based on certain conditions.
        - [plugin-variants/wait](assets/app/workflow/version/activity/plugin-variants/wait/wait.md) — Process pauses the execution of the workflow in which this process has been added as an activity. The workflow resumes execution when the timeout specified by the process attributes elapses, or when APEX_WORKFLOW.CONTINUE_ACTIVITY() procedure is called.
      - [participant](assets/app/workflow/version/participant/participant.md) — Workflow participants are APEX users with operational privileges over a workflow. Workflow participants are associated with a specific workflow version. You can specify workflow owners and workflow administrators.
      - [variable](assets/app/workflow/version/variable/variable.md) — A workflow variable is an input for the workflow that is specific to the workflow version. The value of a workflow variable may change during the workflow runtime. You can only create a workflow variable if the workflow is in development. You cannot create a variable if the workflow is active.

## Further Instructions
Read the matching component reference under `assets/` before authoring a component. Follow the nested node paths to preserve APEXlang containment. 
- `filePath` describes the APEX application file structure; it does not describe the generated documentation location. The generator creates a separate Markdown asset for every catalog entry under assets/.
- Only a component type that defines its own `filePath` is a root component for that application file and receives a `filePath` bullet. Nested components, plugin variants, and template components do not display an inherited ancestor path. Ancestor paths are used internally only when resolving a descendant that defines its own file boundary.
- `assets/` is relative to this `SKILL.md` and is the complete documentation source. Its directories represent node-path segments, usually slugified for filesystem use; a directory name is not necessarily the compiler `componentType`.
- Each component reference is stored in a slugified directory and file. Use the `componentType` bullet in the referenced Markdown file as the authoritative compiler component type. `plugin-variants/` and `template-component/` are routing categories, not component types.
- The component reference files use this property format:
  - `name` — `type`; `description`; `Yes|No`; `default`; `<enum:[option:"Description", ...]>`; `constraints`; `nestedCondition`
  - Yes means required and No means optional. An em dash means the field is not applicable or is omitted. Only fields that apply to a property are included.
  - Enum entries use APEXlang values; descriptions are included when available. Property values follow APEXlang syntax.
- Before selecting a plugin variant, inspect the relevant parent or ancestor component's type property and the variant's appliesWhen condition. For template components, the selected `app[userInterface.currentTheme]` must satisfy the template component's appliesWhen condition.
- Use this hierarchy with a lazy-loading approach: read only the component references required for the current APX file.

A document without that bullet describes a nested or routing component; nested declarations must be declared inside their parent as nested component.

When reading properties from `assets/` make sure to:
- Only use the properties defined on the list. 
- `lovType=COMPONENT` properties accept a reference to an existing component, and enum could be used if specified. 
- For an application-owned reference, ensure that a component of the required type and identifier exists in the application tree before assigning it with APEXlang syntax such as `property: @<identifier>`. The referenced component type must match the type shown in the property documentation. Theme-related component references may instead target an existing central-theme component with a predefined path such as `@/<central-theme-path>`, but only when the application's current theme is subscribed to that central theme; do not recreate that central-theme component.

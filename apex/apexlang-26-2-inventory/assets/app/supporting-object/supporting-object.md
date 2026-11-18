# supportingObject

- componentType: `supportingObject`
- identifierRequired: false
- filePath: `supporting-objects/supporting-objects.apx`

## Properties

### prerequisites

- `freeSpace` — `<INTEGER>`; —; No; —; —; —; —;
- `systemPrivileges` — `<STRING>`; —; No; —; `<enum:[createDatabaseLink:"CREATE DATABASE LINK", createMaterializedView:"CREATE MATERIALIZED VIEW", createProcedure:"CREATE PROCEDURE", createSequence:"CREATE SEQUENCE", createSynonym:"CREATE SYNONYM", createTable:"CREATE TABLE", createTrigger:"CREATE TRIGGER", createType:"CREATE TYPE ", createView:"CREATE VIEW"]>`; —; —;

### installation

- `objectNames` — `<STRING>`; —; No; —; —; —; —;

### messages

- `validations` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `license` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `appSubstitutions` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `buildOptions` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### installationMessages

- `welcome` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `confirmation` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `installSuccess` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `installFailure` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### upgradeMessages

- `welcome` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `confirmation` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `success` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `failure` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### deinstallationMessages

- `confirmation` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `postDeinstall` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### deinstall

- `script` — `<STRING>`; —; No; —; —; —; —;

### upgrade

- `upgradeWhenSqlQuery` — `<STRING>`; —; No; —; —; —; —;

### advanced

- `includeInAppExport` — `<STRING>`; —; Yes; `Y`; `<enum:[true:"Yes", false:"No", autoInstall:"Yes and Install on Import Automatically"]>`; —; —;


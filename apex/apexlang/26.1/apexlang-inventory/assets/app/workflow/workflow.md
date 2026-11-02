# workflow

- componentType: `workflow`
- identifierRequired: true
- filePath: `shared-components/workflows/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Name of this workflow.; Yes; —; —; maxLength=255; —;
- `title` — `<STRING>`; User friendly title of this workflow.; Yes; —; —; maxLength=255; —;

### advanced

- `staticId` — `<STRING>`; Static ID for this workflow. The static ID is used when manually executing the workflow with the APEX_WORKFLOW package (APEX_WORKFLOW.CREATE_WORKFLOW).; Yes; —; —; maxLength=255; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;


# columnGroup

- componentType: `columnGroup`
- identifierRequired: true
- appliesWhen: `region[identification.type] = interactiveReport`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter the name of the column group.  This name displays as a region header in the detailed view.; Yes; —; —; maxLength=255; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### description

- `description` — `<STRING>`; Enter a description for the column group. This description never displays to end users.; No; —; —; maxLength=4000; —;

### layout

- `sequence` — `<NUMBER>`; Enter the display sequence for this column group. The sequence determines the order in which the column groups display in the detail view.; Yes; —; —; —; —;


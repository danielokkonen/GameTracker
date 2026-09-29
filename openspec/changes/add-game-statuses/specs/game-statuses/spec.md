## Purpose

Allow users to assign and manage game lifecycle statuses beyond the auto-derived start/completed states, so paused, dropped, and replaying games can be tracked distinctly.

## ADDED Requirements

### Requirement: Valid game statuses

The system SHALL define exactly seven valid game statuses: `Not started`, `Started`, `Completed`, `Paused`, `Dropped`, and `Replaying`. Each game MUST have exactly one status from this set.

#### Scenario: Default status for new games

- **WHEN** a game is created without an explicit status
- **THEN** the system assigns the status `Not started`

#### Scenario: Status must be from the valid set

- **WHEN** a user attempts to set a game status to an invalid value
- **THEN** the system rejects the update and returns an error

### Requirement: Persistent status storage

The system SHALL store the game status in the database as a `status` TEXT column on the `Game` table. The status value SHALL be persisted and retrieved on every read operation.

#### Scenario: Status is persisted on create

- **WHEN** a new game is created with a status
- **THEN** the status is written to the `status` column and read back correctly on subsequent fetches

#### Scenario: Status survives updates

- **WHEN** a game's status is updated
- **THEN** the new status is persisted and returned on the next `get-game` or `list-games` call

### Requirement: User-editable status

The system SHALL allow users to change a game's status at any time through the UI. The status change SHALL be reflected immediately in the game list, game details, dashboard, and filter controls.

#### Scenario: User changes status from Started to Paused

- **WHEN** a user selects `Paused` from the status dropdown on a game currently marked `Started`
- **THEN** the game's status updates to `Paused`, the `started` date is preserved, and the `end` date remains null

#### Scenario: User changes status from Started to Dropped

- **WHEN** a user selects `Dropped` from the status dropdown on a game currently marked `Started`
- **THEN** the game's status updates to `Dropped`, the `started` date is preserved, and the `end` date remains null

#### Scenario: User changes status to Replaying

- **WHEN** a user selects `Replaying` from the status dropdown on a game currently marked `Completed` or `Not started`
- **THEN** the game's status updates to `Replaying` and the `started` and `end` dates are unaffected

### Requirement: Status filter

The system SHALL populate the status filter dropdown in the games list view with all seven valid statuses, regardless of whether games currently exist with each status.

#### Scenario: Filter shows all statuses

- **WHEN** the games list view loads
- **THEN** the status filter dropdown lists all seven statuses: `Not started`, `Started`, `Completed`, `Paused`, `Dropped`, `Replaying`

#### Scenario: Filter by Paused

- **WHEN** a user selects `Paused` from the status filter
- **THEN** the game list displays only games with status `Paused`

### Requirement: Dashboard status counts

The system SHALL compute and display dashboard counts for all seven statuses. The `DashboardDto` SHALL include individual counts for each status. The dashboard SHALL render a pie chart (using `@mui/x-charts`) with one slice per status, where each slice is colored to match the corresponding `StatusIcon` color, and a legend displaying the status name and count.

#### Scenario: Dashboard shows Paused count

- **WHEN** the dashboard loads
- **THEN** the pie chart displays a slice for `Paused` with its count shown in the legend

#### Scenario: Dashboard shows Dropped count

- **WHEN** the dashboard loads
- **THEN** the pie chart displays a slice for `Dropped` with its count shown in the legend

#### Scenario: Dashboard shows Replaying count

- **WHEN** the dashboard loads
- **THEN** the pie chart displays a slice for `Replaying` with its count shown in the legend

#### Scenario: Pie chart shows all statuses

- **WHEN** the dashboard loads
- **THEN** the pie chart displays slices for all seven statuses: `Not started`, `Started`, `Completed`, `Paused`, `Dropped`, and `Replaying`

### Requirement: Status icon representation

The system SHALL render distinct icons and colors for each status to provide visual differentiation in the game list and game details views.

#### Scenario: Paused icon

- **WHEN** a game has status `Paused`
- **THEN** the StatusIcon component renders a blue warning icon

#### Scenario: Dropped icon

- **WHEN** a game has status `Dropped`
- **THEN** the StatusIcon component renders a red cancel/error icon

#### Scenario: Replaying icon

- **WHEN** a game has status `Replaying`
- **THEN** the StatusIcon component renders a purple/replay icon

### Requirement: Backward compatibility

The system SHALL migrate existing games to the new schema by assigning a default status of `Not started` to all games that lack a stored status value. The existing `start` and `end` date columns SHALL continue to function independently of the status field.

#### Scenario: Existing games get default status

- **WHEN** the database migration runs
- **THEN** all existing games receive `status = 'Not started'` in the new column

#### Scenario: Start/end dates remain independent

- **WHEN** a user sets or clears the started/completed dates on a game
- **THEN** the status field is NOT automatically changed — it remains at its current value

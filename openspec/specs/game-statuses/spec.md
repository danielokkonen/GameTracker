# Game Statuses Specification

## Purpose

Allow users to assign and manage game lifecycle statuses beyond the auto-derived start/completed states, so paused, dropped, and replaying games can be tracked distinctly.

## Requirements

### Requirement: Valid game statuses

The system SHALL define exactly six valid game statuses: `Not started`, `Started`, `Completed`, `Paused`, `Dropped`, and `Replaying`. Each game MUST have exactly one status from this set.

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

The system SHALL populate the status filter dropdown in the games list view with all six valid statuses, regardless of whether games currently exist with each status.

#### Scenario: Filter shows all statuses

- **WHEN** the games list view loads
- **THEN** the status filter dropdown lists all six statuses: `Not started`, `Started`, `Completed`, `Paused`, `Dropped`, `Replaying`

#### Scenario: Filter by Paused

- **WHEN** a user selects `Paused` from the status filter
- **THEN** the game list displays only games with status `Paused`

### Requirement: Dashboard status counts

The system SHALL compute and display dashboard counts for all six statuses. The `DashboardDto` SHALL include individual counts for each status. The dashboard SHALL display metric cards for completion rate, total games, total playtime, and average playtime. A "Now Playing" carousel SHALL show games with `Started` or `Replaying` status. A "Recent Activity" feed SHALL display the last 10 status changes.

#### Scenario: Dashboard shows Paused count

- **WHEN** the dashboard loads
- **THEN** the status counts include `Paused`

#### Scenario: Dashboard shows Dropped count

- **WHEN** the dashboard loads
- **THEN** the status counts include `Dropped`

#### Scenario: Dashboard shows Replaying count

- **WHEN** the dashboard loads
- **THEN** the status counts include `Replaying`

#### Scenario: Dashboard shows all statuses

- **WHEN** the dashboard loads
- **THEN** status counts are displayed for all six statuses: `Not started`, `Started`, `Completed`, `Paused`, `Dropped`, and `Replaying`

#### Scenario: Now Playing carousel shows active games

- **WHEN** the dashboard loads
- **THEN** the "Now Playing" carousel displays games with `Started` or `Replaying` status

#### Scenario: Recent activity shows status changes

- **WHEN** the dashboard loads
- **THEN** the "Recent Activity" feed displays the last 10 recorded status changes

### Requirement: Status icon representation

The system SHALL render distinct icons and colors for each status to provide visual differentiation in the game list and game details views. Icons and colors are defined in centralized constants shared between backend and frontend.

#### Scenario: Not started icon

- **WHEN** a game has status `Not started`
- **THEN** the StatusIcon component renders an `EventNote` icon in gray (`#757575`)

#### Scenario: Started icon

- **WHEN** a game has status `Started`
- **THEN** the StatusIcon component renders a `PlayArrow` icon in amber (`#ffbf00`)

#### Scenario: Completed icon

- **WHEN** a game has status `Completed`
- **THEN** the StatusIcon component renders a `CheckCircle` icon in green (`#4caf50`)

#### Scenario: Paused icon

- **WHEN** a game has status `Paused`
- **THEN** the StatusIcon component renders a `PauseCircle` icon in blue (`#2196f3`)

#### Scenario: Dropped icon

- **WHEN** a game has status `Dropped`
- **THEN** the StatusIcon component renders a `Cancel` icon in red (`#f44336`)

#### Scenario: Replaying icon

- **WHEN** a game has status `Replaying`
- **THEN** the StatusIcon component renders a `Replay` icon in purple (`#9c27b0`)

### Requirement: Activity tracking

The system SHALL record status changes in a `GameActivity` table. Each entry SHALL include the game ID, the action type, the previous status (or null for new games), the new status, and a timestamp. The system SHALL provide a method to retrieve the most recent activity entries.

#### Scenario: Status change is logged on update

- **WHEN** a game's status is changed
- **THEN** a new `GameActivity` entry is created with the old and new status values

#### Scenario: New game is logged

- **WHEN** a new game is created
- **THEN** a `GameActivity` entry is created with `old_status` as null and `new_status` as the game's initial status

#### Scenario: Activity feed retrieves recent entries

- **WHEN** the dashboard requests recent activity
- **THEN** the system returns the last 10 `GameActivity` entries joined with game names

### Requirement: Backward compatibility

The system SHALL migrate existing games to the new schema by assigning a default status of `Not started` to all games that lack a stored status value. The existing `start` and `end` date columns SHALL continue to function independently of the status field.

#### Scenario: Existing games get default status

- **WHEN** the database migration runs
- **THEN** all existing games receive `status = 'Not started'` in the new column

#### Scenario: Start/end dates remain independent

- **WHEN** a user sets or clears the started/completed dates on a game
- **THEN** the status field is NOT automatically changed — it remains at its current value

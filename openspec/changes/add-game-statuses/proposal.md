## Why

Games can fall into states that "Started" and "Not started" don't capture: a player may pause a game without finishing it, return to a previously abandoned game, or drop it entirely. The current derived-status model (computed from start/end dates) prevents users from expressing these distinct states.

## What Changes

- Add three new game statuses: `Paused`, `Dropped`, `Replaying`
- Persist `status` as a new `TEXT` column in the `Game` table instead of deriving it from `start`/`end` dates
- Make status user-editable via a dropdown in the Create Game form and Game Details view
- Preserve existing statuses (`Not started`, `Started`, `Completed`) for backward compatibility
- Update dashboard to show a pie chart (using `@mui/x-charts`) with slices for all seven statuses, replacing the existing card-based layout
- Update status filter dropdown to include all statuses

## Capabilities

### New Capabilities
- `game-statuses`: Define and manage game lifecycle statuses with persistent storage, user-editable selection, and dashboard support

## Impact

- **Database**: New `status` column on `Game` table — migration required
- **Backend**: `GameDto.status` becomes stored field; `GameService.toDto()` reads from DB instead of deriving; `DbGame` gains `status` field; `DashboardDto` expands to include all status counts
- **Frontend**: `StatusIcon.tsx` adds icons/colors for new statuses; `CreateGameForm.tsx` adds status dropdown; `GameDetails.tsx` adds status editor; `Games.tsx` filter dropdown updates; `Home.tsx` dashboard replaces cards with `@mui/x-charts` pie chart
- **Breaking**: Status is no longer auto-derived from `start`/`end` dates — existing games will get a default status of "Not started"

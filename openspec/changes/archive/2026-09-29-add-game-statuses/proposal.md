## Why

Games can fall into states that "Started" and "Not started" don't capture: a player may pause a game without finishing it, return to a previously abandoned game, or drop it entirely. The current derived-status model (computed from start/end dates) prevents users from expressing these distinct states.

## What Changes

- Define six valid game statuses: `Not started`, `Started`, `Completed`, `Paused`, `Dropped`, `Replaying`
- Persist `status` as a new `TEXT` column in the `Game` table instead of deriving it from `start`/`end` dates
- Make status user-editable via a dropdown in the Create Game form and Game Details view
- Add a `GameActivity` table to track status changes with before/after values
- Add a `Recent Activity` feed on the dashboard showing the last 10 status changes
- Replace the existing card-based dashboard with metric cards (completion rate, total games, total playtime, avg playtime), a "Now Playing" carousel, and the activity feed
- Update status filter dropdown to include all statuses
- Add `@mui/x-charts` dependency (installed but not used in final dashboard)

## Capabilities

### New Capabilities

- `game-statuses`: Define and manage game lifecycle statuses with persistent storage, user-editable selection, dashboard support, and activity tracking

## Impact

- **Database**: New `status` column on `Game` table (migration); new `GameActivity` table for activity tracking
- **Backend**: `GameDto.status` becomes stored field; `GameService.toDto()` reads from DB; `DbGame` gains `status` field; `DashboardDto` expands to include all status counts, playtime metrics, `startedGames`, and `activity`; new `ActivityDto` class; new `logActivity()` and `getRecentActivity()` methods; `actionFromStatus` mapping records
- **Frontend**: Centralized `gameStatuses.ts` constants (backend + client) with icons/colors; `StatusIcon.tsx` updated; `CreateGameForm.tsx` adds status dropdown; `GameDetails.tsx` adds inline status selector with icons; `Games.tsx` filter uses hardcoded statuses; `Home.tsx` dashboard uses metric cards + carousel + activity feed
- **Breaking**: Status is no longer auto-derived from `start`/`end` dates — existing games will get a default status of "Not started"

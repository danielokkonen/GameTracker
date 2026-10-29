## 1. Database Schema Migration

- [x] 1.1 Add `status TEXT NOT NULL DEFAULT 'Not started'` column to `Game` table in `database.ts`
- [x] 1.2 Add `status: GameStatus` field to `DbGame` class in `db.ts`
- [x] 1.3 Create `GameActivity` table with `game_id`, `action`, `old_status`, `new_status`, `created` columns in `database.ts`
- [x] 1.4 Add `DbActivity` class with `old_status` and `new_status` fields in `db.ts`

## 2. Backend Service Updates

- [x] 2.1 Update `GameService.toDto()` to read `status` from `DbGame` instead of deriving from `start`/`end`
- [x] 2.2 Add `paused`, `dropped`, `replaying` fields to `DashboardDto`
- [x] 2.3 Update `GameService.dashboard()` to compute counts for all six statuses using the `status` column
- [x] 2.4 Update `GameService.createGame()` to accept and store an optional `status` parameter (defaulting to `'Not started'`)
- [x] 2.5 Update `GameService.updateGame()` to accept and persist a `status` parameter
- [x] 2.6 Add `logActivity()` method to `GameService` for recording status changes
- [x] 2.7 Add `getRecentActivity()` method to `GameService` for retrieving the last 10 activity entries
- [x] 2.8 Add `actionFromStatus` mapping in `gameStatuses.ts` linking statuses to activity action strings
- [x] 2.9 Update `DashboardDto` with `avgPlaytime`, `totalPlaytime`, `completionRate`, `startedGames`, and `activity` fields
- [x] 2.10 Create `ActivityDto` class for activity entries
- [x] 2.11 Update `dashboard()` method to compute playtime metrics, `startedGames` list, and fetch recent activity

## 3. Constants and Type Definitions

- [x] 3.1 Create `src/backend/constants/gameStatuses.ts` with `GameStatus` union type, `GAME_STATUSES` array, and `actionFromStatus` mapping
- [x] 3.2 Create `src/client/constants/gameStatuses.ts` re-exporting backend constants and adding `gameStatusIcons` and `gameStatusColors`
- [x] 3.3 Define specific hex color values for each status in `gameStatusColors`
- [x] 3.4 Map each status to a Material UI icon in `gameStatusIcons`

## 4. Frontend — Status Icon

- [x] 4.1 Update `StatusIcon.tsx` to use centralized `gameStatusIcons` and `gameStatusColors` constants
- [x] 4.2 Ensure `StatusIcon` renders the correct icon and color for all six statuses

## 5. Frontend — Create Game Form

- [x] 5.1 Import `GAME_STATUSES` from centralized constants in `CreateGameForm.tsx`
- [x] 5.2 Add a `status` field to the form state with default value `'Not started'`
- [x] 5.3 Add an MUI `Select` dropdown for status selection in the form
- [x] 5.4 Pass `status` to the `create-game` IPC handler

## 6. Frontend — Game Details View

- [x] 6.1 Import `GAME_STATUSES`, `gameStatusIcons`, and `gameStatusColors` from centralized constants in `GameDetails.tsx`
- [x] 6.2 Add an inline MUI `Select` dropdown for status editing in the game details view
- [x] 6.3 Render status options with corresponding icons and colors
- [x] 6.4 Wire the status dropdown to call `update-game` IPC handler on change

## 7. Frontend — Games List Filter

- [x] 7.1 Replace dynamic status derivation in `Games.tsx` with hardcoded `GAME_STATUSES` array
- [x] 7.2 Ensure the filter dropdown shows all statuses even when no games match

## 8. Frontend — Dashboard Redesign

- [x] 8.1 Install `@mui/x-charts` as a dependency
- [x] 8.2 Replace the dashboard layout with four metric cards: Completion Rate, Total Games, Total Playtime, Avg. Playtime
- [x] 8.3 Add "Now Playing" carousel showing games with `Started` or `Replaying` status
- [x] 8.4 Add "Recent Activity" feed displaying the last 10 status changes
- [x] 8.5 Create `ActivityItem` component for rendering activity entries
- [x] 8.6 Create `useActivityItem` hook mapping action strings to icons and colors
- [x] 8.7 Create `NowPlayingCard` component for carousel items
- [x] 8.8 Compute `totalGames` from all six status counts
- [x] 8.9 Ensure the dashboard IPC reply includes the new count fields (`paused`, `dropped`, `replaying`, `avgPlaytime`, `totalPlaytime`, `completionRate`, `startedGames`, `activity`)

## 9. Verification

- [x] 9.1 Run `npm run tsc` to verify type checking passes
- [x] 9.2 Run `npm run lint` to verify linting passes
- [x] 9.3 Run `npm start` and verify the app launches without errors
- [x] 9.4 Test creating a game with a status other than "Not started"
- [x] 9.5 Test changing status on an existing game and verifying it persists
- [x] 9.6 Test the dashboard shows correct counts for all six statuses
- [x] 9.7 Test the filter dropdown shows and filters by all six statuses
- [x] 9.8 Test the "Now Playing" carousel displays active games
- [x] 9.9 Test the "Recent Activity" feed shows status changes

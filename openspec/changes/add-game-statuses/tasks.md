## 1. Database Schema Migration

- [x] 1.1 Add `status TEXT NOT NULL DEFAULT 'Not started'` column to `Game` table in `database.ts`
- [x] 1.2 Add `status: string` field to `DbGame` class in `db.ts`

## 2. Backend Service Updates

- [x] 2.1 Update `GameService.toDto()` to read `status` from `DbGame` instead of deriving from `start`/`end`
- [x] 2.2 Add `paused`, `dropped`, `replaying` fields to `DashboardDto`
- [x] 2.3 Update `GameService.getDashboard()` to compute counts for all seven statuses using the `status` column
- [x] 2.4 Update `GameService.createGame()` to accept and store an optional `status` parameter (defaulting to `'Not started'`)
- [x] 2.5 Update `GameService.updateGame()` to accept and persist a `status` parameter

## 3. Frontend — Status Icon

- [x] 3.1 Update `StatusIcon.tsx` to render `PauseCircleIcon` (blue/info) for `Paused`
- [x] 3.2 Update `StatusIcon.tsx` to render `CancelIcon` (red/error) for `Dropped`
- [x] 3.3 Update `StatusIcon.tsx` to render `ReplayIcon` (purple/secondary) for `Replaying`

## 4. Frontend — Create Game Form

- [x] 4.1 Add a `GameStatus` string array constant with all seven statuses to `CreateGameForm.tsx`
- [x] 4.2 Add a `status` field to the form state with default value `'Not started'`
- [x] 4.3 Add an MUI `Select` dropdown for status selection in the form
- [x] 4.4 Pass `status` to the `create-game` IPC handler

## 5. Frontend — Game Details View

- [x] 5.1 Add a `GameStatus` string array constant with all seven statuses to `GameDetails.tsx`
- [x] 5.2 Add an MUI `Select` dropdown for status editing in the game details view
- [x] 5.3 Wire the status dropdown to call `update-game` IPC handler on change

## 6. Frontend — Games List Filter

- [x] 6.1 Replace dynamic status derivation in `Games.tsx` with a hardcoded array of all seven statuses
- [x] 6.2 Ensure the filter dropdown shows all statuses even when no games match

## 7. Frontend — Dashboard Pie Chart

- [x] 7.1 Install `@mui/x-charts` as a dependency
- [x] [ ] 7.2 Remove the existing status cards from `Home.tsx` (Not started, Started, Completed, Started last 30 days, Completed last 30 days)
- [x] 7.3 Replace the dashboard UI with a `PieChart` from `@mui/x-charts` showing all 7 statuses
- [x] 7.4 Map each status to its corresponding color from `StatusIcon.tsx`
- [x] 7.5 Add a legend to the pie chart displaying status name and count
- [x] 7.6 Ensure the dashboard IPC reply includes the new count fields (`paused`, `dropped`, `replaying`)

## 8. Verification

- [x] 8.1 Run `npm run tsc` to verify type checking passes
- [x] 8.2 Run `npm run lint` to verify linting passes
- [ ] 8.3 Run `npm start` and verify the app launches without errors
- [ ] 8.4 Test creating a game with a status other than "Not started"
- [ ] 8.5 Test changing status on an existing game and verifying it persists
- [ ] 8.6 Test the dashboard shows correct counts for all seven statuses
- [ ] 8.7 Test the filter dropdown shows and filters by all seven statuses

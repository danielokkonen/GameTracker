## Context

The `Game` table currently has no `status` column. Status is derived in `GameService.toDto()` from the presence of `start` and `end` date fields, yielding exactly three values: `Not started`, `Started`, `Completed`. The `status` field on `GameDto` is a plain `string` with no type safety. The dashboard counts (`DashboardDto`) are hard-coded to these three states. The UI filter in `Games.tsx` dynamically builds options from existing status values in the data.

## Goals / Non-Goals

**Goals:**
- Persist status in the database as a nullable TEXT column with a default of `Not started`
- Add `Paused`, `Dropped`, `Replaying` as valid statuses alongside the existing three
- Make status user-editable via a dropdown in the UI
- Update dashboard and filter controls to support all seven statuses
- Keep `start` and `end` dates independent — status is no longer auto-derived

**Non-Goals:**
- Status transition rules or workflow enforcement (any status can be set to any other)
- Automatic status changes based on date changes
- Status-based filtering or sorting logic changes beyond adding new options
- Import/export format changes for status fields

## Decisions

### Decision: Add `status` column to Game table

**Choice:** Add `status TEXT NOT NULL DEFAULT 'Not started'` to the `Game` table.

**Rationale:** A new column is the simplest migration path. Using `NOT NULL DEFAULT` ensures existing rows are populated without a separate UPDATE. The default value (`Not started`) matches the current derived behavior for games without a start date.

**Alternatives considered:**
- Use a separate `GameStatus` lookup table — overkill for 7 static values
- Add `is_paused`, `is_dropped`, `is_replaying` boolean columns — scatters status logic and makes queries harder

### Decision: `GameDto.status` becomes a stored field

**Choice:** `GameDto.status` remains a `string` type but is now populated from the database column instead of derived. `DbGame` gains a `status: string` field.

**Rationale:** Minimal type system changes. The existing index signature on `GameDto` already accepts `string`. A proper `GameStatus` enum type can be added in a future refactor.

**Alternatives considered:**
- Create a `GameStatus` union type (`"Not started" | "Started" | ...`) — good long-term but adds migration surface; defer to a follow-up
- Keep deriving status but with more conditions — contradicts the goal of independent status

### Decision: Dashboard counts expand to seven statuses

**Choice:** Add `paused`, `dropped`, `replaying` fields to `DashboardDto`. The `getDashboard` method in `GameService` filters by the new `status` column.

**Rationale:** Backward-compatible addition — existing dashboard consumers see new fields without breaking. The three original fields (`completed`, `started`, `notStarted`) remain.

**Alternatives considered:**
- Replace the three original fields with a generic `counts: Record<string, number>` — breaking change for existing dashboard consumers

### Decision: Dashboard uses PieChart from @mui/x-charts

**Choice:** Replace the existing card-based dashboard with a `PieChart` from `@mui/x-charts` displaying all 7 status counts. Remove the "last 30 days" time-based metrics (Started last 30 days, Completed last 30 days) as they do not fit the pie chart model.

**Rationale:** `@mui/x-charts` is already part of the MUI ecosystem and integrates seamlessly with the existing MUI 5.18 setup. A pie chart provides an immediate visual breakdown of game distribution across statuses, which is more intuitive than individual cards for this use case.

**Alternatives considered:**
- Keep card-based layout with new status cards — less visually informative for comparing proportions
- Use recharts — adds an external dependency when MUI already provides one
- Use d3 directly — more flexible but significantly more code and complexity

### Decision: Status dropdown in UI

**Choice:** Use MUI `Select` component with a hardcoded array of all seven statuses. Display in `CreateGameForm.tsx` and `GameDetails.tsx`. The `Games.tsx` filter dropdown also uses the hardcoded array instead of deriving from data.

**Rationale:** Hardcoding ensures the filter always shows all options even when no games exist with a given status. Consistent with the spec requirement for the filter.

**Alternatives considered:**
- Keep dynamic filter options — would show empty statuses only when games exist, which is confusing

### Decision: StatusIcon adds new icons/colors

**Choice:** Map each status to a Material UI icon and color:
- `Not started` → `CircleIcon` / `default` (gray)
- `Started` → `CircleIcon` / `warning` (amber)
- `Completed` → `CheckCircleIcon` / `success` (green)
- `Paused` → `PauseCircleIcon` / `info` (blue)
- `Dropped` → `CancelIcon` / `error` (red)
- `Replaying` → `ReplayIcon` / `secondary` (purple)

**Rationale:** MUI provides all needed icons out of the box. Colors follow MUI's semantic palette.

## Risks / Trade-offs

[Risk] Existing games lose their auto-derived status context.
→ Mitigation: Migration assigns `Not started` to all existing games, which matches the current behavior for games without a start date. Games with a start date but no end date were "Started" — they can be manually updated by users after migration.

[Risk] Users may be confused that setting a started date no longer auto-sets status to "Started".
→ Mitigation: The status dropdown is prominent in the game details view. Tooltips or helper text can clarify the relationship.

[Risk] Database migration on a large existing database.
→ Mitigation: `ALTER TABLE ADD COLUMN ... DEFAULT` is an online operation in SQLite — it does not rewrite the entire table.

## Migration Plan

1. Add `status TEXT NOT NULL DEFAULT 'Not started'` column to `Game` table via `ALTER TABLE`
2. Update `DbGame` type to include `status` field
3. Update `GameService.toDto()` to read `status` from `DbGame` instead of deriving
4. Update `DashboardDto` with new count fields; update `getDashboard()` to filter by status
5. Update `StatusIcon.tsx` with new icons/colors
6. Update `CreateGameForm.tsx` to include a status dropdown (default: "Not started")
7. Update `GameDetails.tsx` to include a status editor
8. Update `Games.tsx` filter dropdown to use hardcoded status list
9. Update `Home.tsx` dashboard to replace cards with `@mui/x-charts` pie chart showing all 7 statuses

## Open Questions

None identified. All decisions resolve ambiguities from the spec.

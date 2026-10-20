## Context

The `Game` table currently has no `status` column. Status is derived in `GameService.toDto()` from the presence of `start` and `end` date fields, yielding exactly three values: `Not started`, `Started`, `Completed`. The `status` field on `GameDto` is a plain `string` with no type safety. The dashboard counts (`DashboardDto`) are hard-coded to these three states. The UI filter in `Games.tsx` dynamically builds options from existing status values in the data.

## Goals / Non-Goals

**Goals:**
- Persist status in the database as a nullable TEXT column with a default of `Not started`
- Add `Paused`, `Dropped`, `Replaying` as valid statuses alongside the existing three
- Make status user-editable via a dropdown in the UI
- Update dashboard and filter controls to support all six statuses
- Keep `start` and `end` dates independent — status is no longer auto-derived
- Track status changes in a `GameActivity` table for activity feed display
- Redesign dashboard with metric cards, "Now Playing" carousel, and activity feed

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
- Use a separate `GameStatus` lookup table — overkill for 6 static values
- Add `is_paused`, `is_dropped`, `is_replaying` boolean columns — scatters status logic and makes queries harder

### Decision: `GameDto.status` becomes a stored field

**Choice:** `GameDto.status` uses the `GameStatus` union type (`"Not started" | "Started" | "Completed" | "Paused" | "Dropped" | "Replaying"`) and is now populated from the database column instead of derived. `DbGame` gains a `status: GameStatus` field.

**Rationale:** Using a proper union type adds type safety for the six valid statuses. The existing index signature on `GameDto` already accepts `string`.

**Alternatives considered:**
- Keep `string` type — lost type safety opportunity
- Create a TypeScript `enum` — harder to serialize to/from SQLite; union type is more portable

### Decision: Centralized game statuses constants

**Choice:** Create `src/backend/constants/gameStatuses.ts` with `GameStatus` type, `GAME_STATUSES` array, and `actionFromStatus` mapping. Re-export from `src/client/constants/gameStatuses.ts` alongside UI-specific constants (`gameStatusIcons`, `gameStatusColors`).

**Rationale:** Single source of truth for the six valid statuses prevents drift between backend and frontend. The `actionFromStatus` mapping links each status to its corresponding activity log action (e.g., "Paused" → "paused").

**Alternatives considered:**
- Duplicate constants in both layers — risk of drift, more maintenance
- Generate constants from a shared schema — over-engineering for 6 values

### Decision: `GameActivity` table for activity tracking

**Choice:** New table with columns `game_id`, `action`, `old_status`, `new_status`, `created`. `logActivity()` is called on status changes during create/update. `getRecentActivity()` returns the last 10 entries joined with game names.

**Rationale:** Enables the "Recent Activity" feed on the dashboard. Tracking `old_status` and `new_status` provides audit trail context. The `action` field uses the `actionFromStatus` mapping for human-readable labels.

**Alternatives considered:**
- Derive activity from `updated` timestamps — loses the before/after context
- Store activity in-memory only — lost across restarts

### Decision: Dashboard redesign — metric cards + carousel + activity feed

**Choice:** Replace the original pie chart plan with:
1. Four metric cards: Completion Rate, Total Games, Total Playtime, Avg. Playtime
2. "Now Playing" carousel showing games with `Started` or `Replaying` status
3. "Recent Activity" feed showing the last 10 status changes

**Rationale:** The metric cards provide at-a-glance statistics that are more useful than a pie chart for quick overview. The carousel highlights currently active games. The activity feed adds social/history context. This approach was chosen over the pie chart because it provides more actionable information.

**Alternatives considered:**
- Pie chart with `@mui/x-charts` — less actionable, harder to compare proportions
- Keep original card-based layout — didn't incorporate new status counts meaningfully

### Decision: DashboardDto expands with playtime and activity fields

**Choice:** `DashboardDto` gains `avgPlaytime`, `totalPlaytime`, `completionRate`, `startedGames`, and `activity` fields. The `dashboard()` method computes these from the full game list and activity table.

**Rationale:** Backward-compatible addition — existing dashboard consumers see new fields without breaking. The completion rate and playtime metrics complement the status counts.

**Alternatives considered:**
- Separate API endpoint for activity — unnecessary complexity for a single dashboard load

### Decision: Status icon colors use specific hex values

**Choice:** Map each status to a Material UI icon and specific hex color:
- `Not started` → `EventNote` / `#757575` (gray)
- `Started` → `PlayArrow` / `#ffbf00` (amber)
- `Completed` → `CheckCircle` / `#4caf50` (green)
- `Paused` → `PauseCircle` / `#2196f3` (blue)
- `Dropped` → `Cancel` / `#f44336` (red)
- `Replaying` → `Replay` / `#9c27b0` (purple)

**Rationale:** Specific hex values ensure consistent visual output across themes. The icons follow the semantic meaning of each status (play for Started, pause for Paused, etc.).

**Alternatives considered:**
- MUI semantic colors (`warning`, `error`, etc.) — theme-dependent, less control
- Custom SVG icons — more work for marginal visual gain

### Decision: Status dropdown in GameDetails uses inline icons

**Choice:** The status selector in `GameDetails.tsx` renders each option with its corresponding icon and color inline within the `Select` component, using the `gameStatusIcons` and `gameStatusColors` constants.

**Rationale:** Provides visual confirmation of the selected status without requiring the user to read text. Consistent with the `StatusIcon` component's rendering.

**Alternatives considered:**
- Text-only dropdown — less visually informative
- Chip-based selector — different interaction model, less familiar

## Risks / Trade-offs

[Risk] Existing games lose their auto-derived status context.
→ Mitigation: Migration assigns `Not started` to all existing games, which matches the current behavior for games without a start date. Games with a start date but no end date were "Started" — they can be manually updated by users after migration.

[Risk] Users may be confused that setting a started date no longer auto-sets status to "Started".
→ Mitigation: The status dropdown is prominent in the game details view. Tooltips or helper text can clarify the relationship.

[Risk] Database migration on a large existing database.
→ Mitigation: `ALTER TABLE ADD COLUMN ... DEFAULT` is an online operation in SQLite — it does not rewrite the entire table.

## Migration Plan

1. Add `status TEXT NOT NULL DEFAULT 'Not started'` column to `Game` table via `ALTER TABLE`
2. Create `GameActivity` table for activity tracking
3. Update `DbGame` type to include `status: GameStatus` field
4. Update `GameService.toDto()` to read `status` from `DbGame` instead of deriving
5. Add `logActivity()` and `getRecentActivity()` methods to `GameService`
6. Update `DashboardDto` with new count fields, playtime metrics, `startedGames`, and `activity`; update `dashboard()` method
7. Create `ActivityDto` class for activity entries
8. Create centralized `gameStatuses.ts` constants (backend + client)
9. Update `StatusIcon.tsx` with new icons/colors
10. Update `CreateGameForm.tsx` to include a status dropdown (default: "Not started")
11. Update `GameDetails.tsx` to include a status editor with inline icons
12. Update `Games.tsx` filter dropdown to use hardcoded status list
13. Redesign `Home.tsx` dashboard with metric cards, carousel, and activity feed

## Open Questions

None identified. All decisions resolve ambiguities from the spec.

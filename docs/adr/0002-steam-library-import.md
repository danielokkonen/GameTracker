# ADR-0002: Steam Library Import Integration

## Status

Accepted

## Context

GameTracker supports CSV import and IGDB-based game details fetching, but users have no way to bulk-import games from their Steam library. Steam is the dominant PC gaming platform, and manually adding hundreds of owned games is impractical. We need a Steam integration that lets users authenticate with a Steam Web API key, browse their library, and selectively import games with playtime data.

## Decision

Add Steam library import as a dedicated route (`/steam-import`) rather than a dialog within the Games view. The implementation follows the plan documented in `docs/plans/steam-integration-plan.md` and was executed through six sequential issues.

### Architecture

```
Renderer (SteamImport.tsx)
  └── IPC: get-steam-games → Main process
        └── SteamService.getOwnedGames()
              └── Steam IPlayerService/GetOwnedGames API
  └── IPC: import-steam-games → Main process
        └── GameService.create() per game (duplicate-skipped by appId)
```

### Key design choices

1. **Dedicated route over dialog** — The feature evolved from an in-dialog approach (Issue 5) to a full `/steam-import` view (`src/client/views/SteamImport.tsx`). This avoids IPC round-trips for dialog state management and gives the import flow its own page with search, sorting, and filtering.

2. **IPlayerService/GetOwnedGames over IGameOwner** — The plan specified `IGameOwner/GetOwnedGames/v0001/` but the implementation uses `IPlayerService/GetOwnedGames/v0001/` with `steamid` and `include_played_free_games` parameters instead of `key` + `appids=0`.

3. **appId as deduplication key** — Each Steam game's `appid` is stored as `appId` (TEXT) in the Game table. On import, `GameService.create()` skips games whose `appId` already exists, throwing a `"DUPLICATE"` error that the caller handles.

4. **Steam API key encrypted at rest** — `steamApiKey` uses the existing `CredentialService` encryption infrastructure (same as IGDB credentials). `steamId` is stored as plain text (not sensitive).

5. **No cover images** — Per user decision, Steam integration does not download cover images. Only name, developer, publisher, and playtime data are imported.

### Data mapping

| Steam field | GameTracker field |
|-------------|-------------------|
| `appid` | `appId` (TEXT, unique identifier for deduplication) |
| `name` | `name` |
| `developer` | `developer` |
| `publisher` | `publisher` |
| `playtime_forever` | `playtimeMinutes` (INTEGER, stored in minutes) |

### Database changes

- `Game` table: added `appId` (TEXT) and `playtime_minutes` (INTEGER) columns with `ALTER TABLE` fallback for existing databases
- `Settings` table: `steamApiKey` (encrypted in JSON) and `steamId` (plain text in JSON)

### UI components

- **`SteamImport.tsx`** — Main view; fetches existing games and Steam library on mount, manages search/filter/sort state, handles import flow
- **`SteamImportToolbar.tsx`** — Search input, "Hide imported" toggle, refresh button, import button with selected count
- **`SteamImportTable.tsx`** — Sortable table of games with checkboxes, developer/publisher/playtime columns, "No games to import" empty state
- **Settings form** — New "Steam" section with API key (password field with visibility toggle) and SteamID inputs

### IPC channels

| Channel | Direction | Payload |
|---------|-----------|---------|
| `get-steam-games` | Renderer → Main | — (via `gameService.getSteamGames`, uses stored settings) |
| `get-steam-games-success` | Main → Renderer | `GameDto[]` |
| `get-steam-games-error` | Main → Renderer | `{ error: string }` |
| `import-steam-games` | Renderer → Main | `GameDto[]` (via `gameService.importSteamGames`) |
| `import-steam-games-success` | Main → Renderer | `{ imported: number, skipped: number, errors?: string[] }` |

## Migration

No database migration required beyond the `ALTER TABLE` statements added to `database.ts` constructor (same pattern as `credentialsEncrypted`). Existing databases get `appId` and `playtime_minutes` columns added automatically.

## Consequences

### Positive

- Users can import their entire Steam library in a few clicks
- Playtime data is preserved from Steam
- `appId` deduplication prevents duplicate entries across import sessions
- Dedicated route provides full-screen search, sort, and filter capabilities
- "Hide imported" toggle reduces noise by filtering out already-imported games
- Reuses existing encryption infrastructure for API key storage
- No new dependencies — uses `fetch` (built-in in Electron)

### Negative

- `appId` is stored as TEXT (stringified integer) rather than a dedicated type — acceptable since Steam appids are always integers
- `IPlayerService/GetOwnedGames` requires the user's library to be publicly visible or the API key to have Steam partner status — private libraries will return empty or error
- The dedicated route replaces the original dialog-based approach, meaning users navigate away from the Games view to perform the import
- `steamApiKey` in `Settings.json` column is encrypted as a base64 string within the JSON blob (same limitation as IGDB credentials)
- Import counts (`imported`, `skipped`) are reported but individual game failures are only shown in snackbar (not per-row in the UI)

### Open Questions

- Should we support Steam's `IGameInfoService` or other endpoints for additional game metadata (release dates, tags, etc.)?
- Should `appId` be indexed in the database for faster deduplication lookups?
- Should the "Hide imported" default be user-configurable per the pattern of other settings?

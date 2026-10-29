# Steam Library Import Integration

## Overview

Add Steam library import to GameTracker, allowing users to authenticate with a Steam Web API key, input their SteamID, and selectively import their game library with playtime data (no cover images).

## Implementation Issues

This feature is split into 6 smaller issues, each buildable independently. Work through them in order.

### Important: Stop Between Each Issue

**After completing each issue, stop and manually validate before continuing with the next one.** Do not implement multiple issues in a single pass.

Run `npm start` and `npm run lint`, test the specific functionality the issue addresses, and only proceed once fully validated. This ensures each layer is solid before building on top of it, making any issues easier to isolate and fix.

1. [Foundation — DB schema + DTOs](../issues/steam-integration/01-foundation-db-dtos.md)
2. [Settings — Steam credentials UI](../issues/steam-integration/02-settings-steam-credentials.md)
3. [Steam Service — API integration](../issues/steam-integration/03-steam-service-api.md)
4. [IPC + Preload wiring](../issues/steam-integration/04-ipc-preload-wiring.md)
5. [Steam Import Dialog](../issues/steam-integration/05-steam-import-dialog.md)
6. [Final integration](../issues/steam-integration/06-final-integration.md)

## Steam API Details

### Endpoints

- `https://api.steampowered.com/IGameOwner/GetOwnedGames/v0001/?key={API_KEY}&appids=0&include_appinfo=1&include_played_only_games=false&format=json`

### Rate limits

- Free Steam Web API key allows ~100k requests/day
- GetOwnedGames is cached by Steam, so repeated calls are safe

### Data mapping

| Steam field | GameTracker field |
|-------------|-------------------|
| `appid` | `appId` (unique identifier for deduplication) |
| `name` | `name` |
| `developer` | `developer` |
| `publisher` | `publisher` |
| `playtime_forever` | `playtimeMinutes` (stored, not displayed) |

### Notes

- Playtime data (`playtime_forever`) IS stored (per user decision)
- Cover images are NOT downloaded (skipped per user decision)
- Deduplication uses `appid` to prevent duplicate entries
- User selects which games to import via checkbox dialog
- SteamID is required for API key validation and must be stored in settings

## Steam Import Flow

1. User clicks "Import from Steam" in Games view
2. Main process validates settings (API key + SteamID present), calls Steam API
3. Steam API returns full library list (name, developer, publisher, playtime)
4. Main process sends library data back to renderer
5. Renderer shows SteamImportDialog with searchable checkbox list
6. User selects/deselects games, clicks "Import Selected"
7. Main process imports selected games one-by-one, skipping duplicates by `appId`
8. Success snackbar shown on completion

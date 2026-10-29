# Issue 3: Steam Service — API Integration

## Goal

Create a new service that calls the Steam Web API to fetch the user's game library and maps the response to GameDto objects.

## Files to create

### `src/backend/services/steam-service.ts`

- Import `SettingsService` to retrieve `steamApiKey` and `steamId`
- Implement a method to fetch the owned games list from `IGameOwner/GetOwnedGames/v0001/`
- Validate that settings contain both an API key and a SteamID before making the API call
- Map Steam API response fields to GameDto:
  - `appid` → `appId`
  - `name` → `name`
  - `developer` → `developer`
  - `publisher` → `publisher`
  - `playtime_forever` → `playtimeMinutes`
- Return the mapped `GameDto[]` array

## Files to modify

### `src/backend/services/game-service.ts`

- In `create()`, check if a game with the same `appId` already exists in the database before inserting
- If a duplicate `appId` is found, throw a specific "duplicate" error (`new Error("DUPLICATE")`) that the caller can handle
- In `toDbEntity()`, include `appId` and `playtime_minutes` in the INSERT values
- In `toDto()`, include `appId` and `playtimeMinutes` in the DTO mapping

## Acceptance criteria

- Service returns a valid `GameDto[]` when a valid API key and SteamID are configured
- Service throws a clear error when API key or SteamID is missing
- Service throws a clear error when the API returns an error (invalid key, private library, etc.)
- Duplicate `appId` check prevents inserting games that already exist in the database

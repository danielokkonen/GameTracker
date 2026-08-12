# Issue 1: Foundation — DB Schema + DTOs

## Goal

Add the database columns and DTO fields needed to support Steam integration. This is the base layer that all subsequent issues depend on.

## Files to modify

### `src/backend/dtos/game.ts`

- Add `appId: string` field
- Add `playtimeMinutes: number` field

### `src/backend/dtos/settings.ts`

- Add `steamApiKey: string` field
- Add `steamId: string` field
- Update constructor to initialize both to empty strings

### `src/backend/database/database.ts`

- Add `appId` (TEXT) column to Game table CREATE statement
- Add `playtime_minutes` (INTEGER) column to Game table CREATE statement
- Add ALTER TABLE fallback for both columns (same pattern as existing `credentialsEncrypted` column)

### `src/client/components/settings/SettingsProvider.tsx`

- Add `steamApiKey: string | null` to `ISettingsState` interface
- Add `steamId: string | null` to `ISettingsState` interface
- Add both to `initialState` as `null`

## Acceptance criteria

- Database migrations run without errors (both fresh installs and existing databases)
- All DTOs compile with no type errors
- SettingsProvider state includes both new fields with correct types

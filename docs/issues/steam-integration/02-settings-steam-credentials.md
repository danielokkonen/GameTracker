# Issue 2: Settings — Steam Credentials UI

## Goal

Add a Steam section to the Settings panel where users can enter their API key and SteamID. The API key should be encrypted at rest, same as IGDB credentials.

## Files to modify

### `src/backend/services/credential-service.ts`

- Add `steamApiKey` to the encryption keys list used by `setCredentials`

### `src/backend/services/settings-service.ts`

- Wire `steamApiKey` through `get()` using `getCredentials` (same pattern as `igdbClientId`/`igdbSecret`)
- Wire `steamApiKey` through `upsert()` using `setCredentials` (same pattern as IGDB credentials)
- Wire `steamId` through `get()` as a plain (non-encrypted) field
- Wire `steamId` through `upsert()` as a plain (non-encrypted) field

### `src/client/components/settings/SettingsForm.tsx`

- Add a "Steam" Typography header between General and Debug sections
- Add a TextField for API key with `type="password"` and a visibility toggle (same pattern as IGDB Secret)
- Add a TextField for SteamID with `type="text"` (no masking needed)
- Add a link to `https://partner.steam-api.com` for users who need to obtain a key
- Keep the IGDB section unchanged

## Acceptance criteria

- API key is encrypted at rest using the existing encryption infrastructure
- SteamID is stored as plain text (not sensitive)
- Settings panel saves and loads both values correctly
- Form validates that fields are present before allowing Steam import (handled in Issue 4/6)

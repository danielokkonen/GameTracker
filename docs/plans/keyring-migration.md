# Migrate IGDB Credentials to OS Keychain

## Goal
Move `igdbClientId` and `igdbSecret` from plaintext SQLite to OS credential storage.

## Why
- Currently stored as plaintext JSON in `Settings.json` column in SQLite
- `electron.safeStorage` is built-in — zero new dependencies
- Uses OS-level crypto: DPAPI (Windows), Keychain (macOS), libsecret (Linux)

## Choice: `electron.safeStorage` (built-in)
- Zero new dependencies
- No asar-unpack needed (works with asar-packed build)
- No build toolchain or libsecret requirements for install
- Minimal code change — encrypt/decrypt strings, store base64 in SQLite

## Files Changed

### 1. `src/backend/services/credential-service.ts` (NEW)
- Wraps `electron.safeStorage`
- Methods: `encryptString()`, `decryptString()`, `getCredentials()`, `setCredentials()`, `deleteCredentials()`
- Encrypts clientId/secret individually, stores as base64 in SQLite `Settings` table
- Fallback to plaintext if `safeStorage` is unavailable (graceful degradation)

### 2. `src/backend/services/settings-service.ts`
- `get()`: fetch settings from SQLite, decrypt credentials via `CredentialService`, return merged DTO
- `upsert()`: save non-credential fields to SQLite, encrypt + store credentials via `CredentialService`
- Credentials in SQLite JSON blob become base64 encrypted strings (or plain strings before migration)

### 3. `src/client/components/settings/SettingsForm.tsx`
- Change `igdbSecret` to `type="password"` TextField (masked)
- Add lock icon/hint showing credentials are encrypted at rest
- No "Migrate to Keychain" button — migration happens silently on next form submit

### 4. `src/client/components/settings/SettingsProvider.tsx`
- Add `isMigrated` state to `ISettingsState`
- Track whether credentials are stored in encrypted form

## Migration Flow (silent, on form submit)
1. User edits settings and clicks Save
2. `upsert` detects: credentials exist as plaintext in SQLite but not yet encrypted
3. Encrypts both values via `CredentialService`, clears plaintext from SQLite JSON
4. Next `get()` call finds encrypted values, decrypts them, returns to UI
5. Sets `isMigrated = true` in context

## Fallback Behavior
- If `safeStorage` throws (unavailable), fall back to plaintext storage in SQLite
- No error dialog — degrade gracefully, same as current behavior

## Keyring Status Detection
- `CredentialService.getCredentials()` detects plaintext vs encrypted by checking if values are valid base64
- Returns `isMigrated: true/false` flag
- `isMigrated` is returned from `SettingsService.get()` but NOT added to React context
- UI can check migration status via the returned DTO or a separate mechanism

## Platform Coverage

| OS | Backend |
|----|---------|
| Linux (KDE Plasma) | libsecret (KWallet via D-Bus) |
| Windows | DPAPI (Windows Credential Manager) |
| macOS | Keychain |

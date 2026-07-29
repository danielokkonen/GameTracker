# Session Summary: IGDB Credentials Migration to OS Keychain

## Date
Wed Jul 29 2026

## Goal
Move `igdbClientId` and `igdbSecret` from plaintext SQLite to OS credential storage using `electron.safeStorage`.

## Files Changed

### New Files
- `src/backend/services/credential-service.ts` — Wraps `electron.safeStorage` with `encryptString`, `decryptString`, `getCredentials`, `setCredentials`, `deleteCredentials`

### Modified Files
- `src/backend/database/database.ts` — Added `credentialsEncrypted` INTEGER column to Settings table + migration via `ALTER TABLE`
- `src/backend/services/settings-service.ts` — Integrated `CredentialService` to encrypt on upsert and decrypt on get
- `src/backend/dtos/settings.ts` — Added `isMigrated: boolean` property
- `src/client/components/settings/SettingsProvider.tsx` — Added `isMigrated` to `ISettingsState` and initial state; added guard for `init` action with undefined payload
- `src/client/components/settings/SettingsForm.tsx` — Changed `igdbSecret` to `type="password"` with lock icon tooltip; fixed `value` prop type to `SettingsDto | null`
- `src/client/views/Settings.tsx` — Fixed `useState<SettingsDto>(null)` to `useState<SettingsDto | null>(null)`

## Bugs Found and Fixed

### 1. `isEncrypted` base64 heuristic (Critical)
The initial `isEncrypted` method checked if a string was valid base64 to detect encrypted values. This would misidentify normal IGDB client IDs (which are often alphanumeric and valid base64) as already encrypted, causing credentials to be stored unencrypted but marked as encrypted.

**Fix:** Removed the heuristic entirely. `CredentialService` now relies solely on the `credentialsEncrypted` DB column for detection. `setCredentials` always encrypts when `safeStorage` is available.

### 2. Cleared credentials inconsistent flag (Medium)
When a user cleared their credentials (both empty strings), `credentialsEncrypted` remained `true` because `encryptString("")` returns `""` (early return on falsy) and `isEncrypted("")` returns `false`.

**Fix:** `setCredentials` returns `credentialsEncrypted: false` when both credentials are empty.

### 3. `init` action with undefined payload (Low)
`{...undefined}` in the `init` reducer case would wipe all state.

**Fix:** Added `if (!action.payload) return state;` guard.

### 4. `safeStorage` check before `app.isReady()` (Critical)
`safeStorage.isEncryptionAvailable()` was called in the constructor, which may run before `app.isReady()`. Before ready, this always returns `false`, so encryption never happened.

**Fix:** Replaced cached `encryptAvailable` property with a lazy getter `isEncryptionAvailable` that evaluates at the time of use.

### 5. Migration column not added to existing DBs (Critical)
`CREATE TABLE IF NOT EXISTS` doesn't add columns to existing tables. Existing databases would lack the `credentialsEncrypted` column.

**Fix:** Added `ALTER TABLE Settings ADD COLUMN credentialsEncrypted ...` with try/catch (silently ignored if column already exists).

### 6. Type mismatches (Minor)
- `useState<SettingsDto>(null)` — `null` not assignable to `SettingsDto`
- `value: SettingsDto` on `SettingsForm` interface but receives `null` at initial render

**Fix:** Changed to `useState<SettingsDto | null>(null)` and `value: SettingsDto | null`.

## Migration Flow
1. User edits settings and clicks Save
2. `upsert` calls `CredentialService.setCredentials()` which encrypts via `safeStorage`
3. `credentialsEncrypted` column is set to `1` in SQLite
4. Next `get()` call detects `credentialsEncrypted === 1` and decrypts values
5. Migration happens silently on first save — no user action required

## Platform Coverage
| OS | Backend |
|----|---------|
| Linux (KDE Plasma) | libsecret (KWallet via D-Bus) |
| Windows | DPAPI (Windows Credential Manager) |
| macOS | Keychain |

## Fallback Behavior
If `safeStorage.isEncryptionAvailable()` returns `false` (e.g., headless environment, no secret service), credentials are stored as plaintext in SQLite JSON with `credentialsEncrypted = 0`. No error dialog — graceful degradation.
